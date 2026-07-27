import type { Channel, JourneyEvent, Stage } from "./types";
import { STAGES } from "./types";
import { getPersonaMeta } from "./personas";

// ─── Journey analytics (Task 4): alerts, churn score, funnel, flows ───

export interface AlertAction {
  tier: 1 | 2;
  label: string;
  eventType: string;
  eventLabel: string;
  eventChannel: Channel;
  executed: boolean;
}

export interface AlertItem {
  id: string;
  type: "dropoff" | "repeat_contact" | "churn_risk" | "channel_failover" | "platform_bug";
  severity: "high" | "medium";
  title: string;
  detail: string;
  persona: string;
  ts: number;
  action?: AlertAction;
}

export function churnScore(persona: string, events: JourneyEvent[]): number {
  const ev = events.filter((e) => e.persona === persona);
  let s = 0;
  if (ev.some((e) => e.reasonCode === "annual_fee")) s += 30;
  if (ev.some((e) => e.type === "spend_drop")) s += 25;
  if (ev.some((e) => (e.sentiment ?? 0) <= -0.5)) s += 15;
  if (ev.some((e) => e.reasonCode === "cancellation_hint")) s += 30;
  if (ev.filter((e) => e.type === "call_start").length >= 2) s += 10;
  return Math.min(100, s);
}

export function computeAlerts(events: JourneyEvent[]): AlertItem[] {
  const alerts: AlertItem[] = [];
  const executed = (t: string, p: string) =>
    events.some((e) => e.type === t && e.persona === p);

  // 1 — application abandonment → Tier-1 autonomous recovery
  for (const e of events.filter((x) => x.type === "apply_abandon")) {
    alerts.push({
      id: `drop_${e.id}`,
      type: "dropoff",
      severity: "high",
      persona: e.persona,
      ts: e.ts,
      title: "Application abandoned at KYC step",
      detail: `${getPersonaMeta(e.persona).name} left the application at the KYC/fee step. Today this prospect vanishes; One View keeps the journey alive.`,
      action: {
        tier: 1,
        label: "Send save-and-resume link",
        eventType: "action_resume_link",
        eventLabel: "📧 Save-and-resume link sent — Tier-1 autonomous",
        eventChannel: "web",
        executed: executed("action_resume_link", e.persona),
      },
    });
  }

  // 2 — repeat contact: ≥2 calls, same reason, same person
  const byKey = new Map<string, JourneyEvent[]>();
  for (const c of events.filter((x) => x.type === "call_start")) {
    const k = `${c.persona}|${c.reasonCode ?? "general"}`;
    byKey.set(k, [...(byKey.get(k) ?? []), c]);
  }
  for (const [, list] of byKey) {
    if (list.length >= 2) {
      const p = list[0].persona;
      alerts.push({
        id: `rep_${p}_${list[0].reasonCode}`,
        type: "repeat_contact",
        severity: "high",
        persona: p,
        ts: list[1].ts,
        title: `Repeat contact — ${list[0].reasonCode?.replace(/_/g, " ")}`,
        detail: `${getPersonaMeta(p).name} contacted care ${list.length}× about the same issue. Legacy systems see ${list.length} tickets; One View sees 1 unresolved issue.`,
        action: {
          tier: 1,
          label: "Priority callback with full journey context",
          eventType: "action_priority_callback",
          eventLabel: "📞 Priority callback scheduled with full context — Tier-1 autonomous",
          eventChannel: "voice",
          executed: executed("action_priority_callback", p),
        },
      });
    }
  }

  // 3 — churn risk (score ≥ 75) → Tier-2 HITL
  const realPersonas = [...new Set(events.map((e) => e.persona))].filter((p) => !p.startsWith("sim-"));
  realPersonas.forEach((p) => {
    const score = churnScore(p, events);
    if (score >= 75) {
      alerts.push({
        id: `churn_${p}`,
        type: "churn_risk",
        severity: "high",
        persona: p,
        ts: Date.now(),
        title: `Churn risk ${score}/100 — ${getPersonaMeta(p).name}`,
        detail:
          "Annual-fee complaint + spend drop + negative-sentiment call + cancellation hint — signals were scattered across channels for weeks.",
        action: {
          tier: 2,
          label: "Retention offer — needs human approval",
          eventType: "action_retention_offer",
          eventLabel: "🎁 Retention offer sent (approved by retention desk) — Tier-2 HITL",
          eventChannel: "voice",
          executed: executed("action_retention_offer", p),
        },
      });
    }
  });

  // 4 — channel failover (individual): web booking error → app success
  const allPersonas = [...new Set(events.map((e) => e.persona))];
  const failoverUsers: string[] = [];
  for (const p of allPersonas) {
    const err = events.find((e) => e.persona === p && e.type === "booking_error");
    const succ = events.find((e) => e.persona === p && e.type === "booking_success" && (!err || e.ts > err.ts));
    if (err && succ) {
      failoverUsers.push(p);
      if (!p.startsWith("sim-")) {
        alerts.push({
          id: `failover_${p}`,
          type: "channel_failover",
          severity: "medium",
          persona: p,
          ts: succ.ts,
          title: `Channel failover — ${getPersonaMeta(p).name}`,
          detail:
            "Booking failed on web (ERR-5003) → succeeded in the app minutes later. One user = friction. Watch what happens when it's forty…",
          action: {
            tier: 1,
            label: "Send apology + 1,000 MR points",
            eventType: "action_goodwill",
            eventLabel: "🎁 Apology sent + 1,000 MR points credited — Tier-1 autonomous",
            eventChannel: "web",
            executed: executed("action_goodwill", p),
          },
        });
      }
    }
  }

  // 5 — platform bug (aggregate): the SAME failover across many users
  if (failoverUsers.length >= 4) {
    alerts.push({
      id: "platform_bug_travel_insurance",
      type: "platform_bug",
      severity: "high",
      persona: "meera",
      ts: Date.now(),
      title: `🐞 Platform bug suspected — Travel Insurance on web (${failoverUsers.length} users)`,
      detail: `${failoverUsers.length} users hit ERR-5003 on web then completed in the app. Identical failure→failover pattern = the web booking service is broken, not the users. One failover is a ticket; ${failoverUsers.length} is an incident.`,
      action: {
        tier: 2,
        label: "File engineering incident with journey evidence",
        eventType: "action_file_incident",
        eventLabel: "🐞 Engineering incident filed with 41 stitched journeys attached — Tier-2 HITL",
        eventChannel: "web",
        executed: executed("action_file_incident", "meera"),
      },
    });
  }

  return alerts.sort((a, b) => b.ts - a.ts);
}

// ─── Funnel: unique personas reaching each stage ───
export function funnelCounts(events: JourneyEvent[]) {
  const personas = [...new Set(events.map((e) => e.persona))];
  return STAGES.map((stage) => {
    const reached = personas.filter((p) =>
      events.some((e) => e.persona === p && e.stage === stage)
    );
    return { stage, count: reached.length, personas: reached };
  }).filter((s) => s.count > 0);
}

// ─── Flow links for the Sankey: consecutive stage transitions ───
export interface FlowLink {
  from: Stage;
  to: Stage;
  value: number;
}
export function flowLinks(events: JourneyEvent[]): FlowLink[] {
  const byPersona = new Map<string, JourneyEvent[]>();
  for (const e of [...events].sort((a, b) => a.ts - b.ts)) {
    byPersona.set(e.persona, [...(byPersona.get(e.persona) ?? []), e]);
  }
  const counts = new Map<string, number>();
  for (const [, list] of byPersona) {
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1].stage;
      const b = list[i].stage;
      if (a === b) continue;
      counts.set(`${a}|${b}`, (counts.get(`${a}|${b}`) ?? 0) + 1);
    }
  }
  return [...counts.entries()].map(([k, value]) => {
    const [from, to] = k.split("|") as [Stage, Stage];
    return { from, to, value };
  });
}
