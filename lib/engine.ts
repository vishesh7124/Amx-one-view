import type { Channel, JourneyEvent } from "./types";
import { getPersonaMeta } from "./personas";

// ─── In-browser Identity Engine (mirrors Slide 5, Panel 3) ───
// Deterministic anchors merge profiles instantly (confidence 1.0).
// Weak signals (shared device/anon) never merge on their own below threshold.

export interface StitchRecord {
  ts: number;
  rule: string;
  confidence: number;
  label: string;
}

export interface Profile {
  id: string;
  kind: "provisional" | "customer";
  persona: string;
  name: string;
  identifiers: string[]; // pretty labels: "email:aarav@gmail.com"
  confidence: number;
  eventIds: string[];
  stitches: StitchRecord[];
  firstTs: number;
  lastTs: number;
  channels: Channel[];
}

export interface EngineResult {
  profiles: Profile[];
  profileOfEvent: Record<string, string>;
}

type IdKind =
  | "customerId"
  | "cardId"
  | "applicationId"
  | "email"
  | "phone"
  | "dniNumber"
  | "resumeToken"
  | "deviceId"
  | "anonId"
  | "sessionId";

const STRONG: IdKind[] = [
  "customerId",
  "cardId",
  "applicationId",
  "email",
  "phone",
  "dniNumber",
  "resumeToken",
];

const RULE_LABEL: Record<IdKind, string> = {
  customerId: "customer login",
  cardId: "in-app card activation",
  applicationId: "application ID match",
  email: "email captured",
  phone: "phone number match",
  dniNumber: "DNI — per-session callback number",
  resumeToken: "tokenized save-and-resume link",
  deviceId: "shared device (weak)",
  anonId: "same anonymous id (weak)",
  sessionId: "same session (weak)",
};

function idKeysOf(e: JourneyEvent): { kind: IdKind; key: string }[] {
  const out: { kind: IdKind; key: string }[] = [];
  const ids = e.ids || {};
  (Object.keys(ids) as IdKind[]).forEach((k) => {
    const v = ids[k];
    if (v) out.push({ kind: k, key: `${k}:${v}` });
  });
  return out;
}

function confidenceOf(identKeys: string[]): number {
  const kinds = new Set(identKeys.map((k) => k.split(":")[0] as IdKind));
  if (kinds.has("customerId") || kinds.has("cardId")) return 1.0;
  if (kinds.has("applicationId")) return 0.95;
  if (kinds.has("dniNumber") || kinds.has("resumeToken")) return 0.9;
  if (kinds.has("email") || kinds.has("phone")) return 0.8;
  if (kinds.has("deviceId") && kinds.has("anonId")) return 0.55;
  return 0.4;
}

export function runEngine(events: JourneyEvent[]): EngineResult {
  const sorted = [...events].sort((a, b) => a.ts - b.ts);
  const profiles = new Map<string, Profile>();
  const keyToProfile = new Map<string, string>();
  const profileOfEvent: Record<string, string> = {};
  let seq = 0;

  const newProfile = (e: JourneyEvent): Profile => {
    seq += 1;
    const p: Profile = {
      id: `P-${String(seq).padStart(3, "0")}`,
      kind: "provisional",
      persona: e.persona,
      name: `Anonymous (${e.channel})`,
      identifiers: [],
      confidence: 0.4,
      eventIds: [],
      stitches: [],
      firstTs: e.ts,
      lastTs: e.ts,
      channels: [],
    };
    profiles.set(p.id, p);
    return p;
  };

  for (const e of sorted) {
    const keys = idKeysOf(e).filter((k) => k.kind !== "sessionId"); // sessions don't stitch
    const found = new Set<string>();
    for (const k of keys) {
      const pid = keyToProfile.get(k.key);
      if (pid) found.add(pid);
    }

    let target: Profile;
    const foundArr = [...found];
    if (foundArr.length === 0) {
      target = newProfile(e);
    } else {
      target = profiles.get(foundArr[0])!;
      // merge the rest (deterministic stitch — a strong shared identifier appeared)
      for (let i = 1; i < foundArr.length; i++) {
        const other = profiles.get(foundArr[i])!;
        // infer the strongest shared key as the rule
        const shared = keys
          .filter((k) => other.identifiers.includes(k.key))
          .sort(
            (a, b) => STRONG.indexOf(a.kind) - STRONG.indexOf(b.kind)
          )[0];
        const kind: IdKind = shared?.kind ?? "anonId";
        const isStrong = STRONG.includes(kind);
        const conf = isStrong ? 1.0 : 0.6;
        target.stitches.push({
          ts: e.ts,
          rule: RULE_LABEL[kind],
          confidence: conf,
          label: `Merged ${other.name} → (${RULE_LABEL[kind]}, conf ${conf.toFixed(
            2
          )})`,
        });
        // fold other into target
        target.eventIds.push(...other.eventIds);
        target.identifiers = [...new Set([...target.identifiers, ...other.identifiers])];
        target.channels = [...new Set([...target.channels, ...other.channels])];
        target.firstTs = Math.min(target.firstTs, other.firstTs);
        for (const evId of other.eventIds) profileOfEvent[evId] = target.id;
        for (const k of other.identifiers) keyToProfile.set(k, target.id);
        profiles.delete(other.id);
      }
    }

    // attach event + identifiers
    target.eventIds.push(e.id);
    profileOfEvent[e.id] = target.id;
    target.lastTs = e.ts;
    if (!target.channels.includes(e.channel)) target.channels.push(e.channel);
    for (const k of keys) {
      keyToProfile.set(k.key, target.id);
      if (!target.identifiers.includes(k.key)) target.identifiers.push(k.key);
    }

    // kind + naming + confidence upgrades
    const hasIdentity = target.identifiers.some((k) =>
      ["customerId", "cardId", "applicationId", "email"].includes(k.split(":")[0])
    );
    if (hasIdentity && target.kind === "provisional") {
      target.kind = "customer";
      target.name = getPersonaMeta(target.persona).name;
    }
    target.confidence = Math.max(
      target.confidence,
      confidenceOf(target.identifiers)
    );
  }

  return {
    profiles: [...profiles.values()].sort((a, b) => a.firstTs - b.firstTs),
    profileOfEvent,
  };
}

export function confColor(c: number): string {
  if (c >= 0.95) return "text-emerald-600";
  if (c >= 0.8) return "text-blue-600";
  if (c >= 0.55) return "text-amber-600";
  return "text-gray-500";
}

export function confBg(c: number): string {
  if (c >= 0.95) return "bg-emerald-500";
  if (c >= 0.8) return "bg-blue-500";
  if (c >= 0.55) return "bg-amber-500";
  return "bg-gray-400";
}
