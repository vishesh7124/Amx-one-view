"use client";

import type { EngineResult, Profile } from "@/lib/engine";
import { confBg } from "@/lib/engine";
import type { JourneyEvent } from "@/lib/types";
import { EmptyState } from "./Timeline";

// SVG identity graph: profiles as nodes, identifiers fanned below them.
// Below the graph: the confidence ladder — how identity strengthened over time.
export default function IdentityGraph({
  events,
  engine,
  selectedProfile,
}: {
  events: JourneyEvent[];
  engine: EngineResult;
  selectedProfile: string | null;
}) {
  const profiles = engine.profiles;
  if (profiles.length === 0) {
    return <EmptyState text="No identities yet — the graph builds as journeys unfold." />;
  }

  const colW = 230;
  const W = Math.max(profiles.length * colW, 400);
  const H = 330;

  const ladderProfile =
    profiles.find((p) => p.id === selectedProfile) ??
    profiles.find((p) => p.kind === "customer") ??
    profiles[0];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-4 overflow-x-auto scrollbar-thin">
        <svg width={W} height={H} className="mx-auto">
          {profiles.map((p, i) => {
            const cx = i * colW + colW / 2;
            const cy = 62;
            const ids = p.identifiers.slice(0, 7);
            return (
              <g key={p.id} className="fade-up">
                {ids.map((id, j) => {
                  const iy = 150 + j * 24;
                  return (
                    <g key={id}>
                      <line x1={cx} y1={cy + 26} x2={cx} y2={iy - 8} stroke="#cbd5e1" strokeWidth="1.2" />
                      <rect x={cx - 88} y={iy - 9} width={176} height={18} rx={9} fill="#f1f5f9" stroke="#e2e8f0" />
                      <text x={cx} y={iy + 3.5} textAnchor="middle" fontSize="9.5" fontFamily="monospace" fill="#475569">
                        {id.length > 30 ? id.slice(0, 29) + "…" : id}
                      </text>
                    </g>
                  );
                })}
                <circle
                  cx={cx}
                  cy={cy}
                  r={26}
                  fill={p.kind === "customer" ? "#016fd0" : "#94a3b8"}
                  stroke={selectedProfile === p.id ? "#f59e0b" : "white"}
                  strokeWidth={selectedProfile === p.id ? 4 : 3}
                />
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize="15">
                  {p.kind === "customer" ? "👤" : "🕵️"}
                </text>
                <text x={cx} y={cy + 44} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">
                  {p.name.length > 22 ? p.name.slice(0, 21) + "…" : p.name}
                </text>
                <text x={cx} y={cy + 58} textAnchor="middle" fontSize="9.5" fill="#64748b">
                  {p.id} · conf {p.confidence.toFixed(2)} · {p.eventIds.length} events
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* confidence ladder */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-xs font-bold text-amex-dark mb-3">
          🪜 CONFIDENCE LADDER — {ladderProfile.name} ({ladderProfile.id})
        </p>
        <ConfidenceLadder profile={ladderProfile} events={events} engine={engine} />
        {ladderProfile.stitches.length > 0 && (
          <div className="mt-3 space-y-1">
            {ladderProfile.stitches.map((s, i) => (
              <p key={i} className="text-[11px] text-emerald-600">
                ⚡ {new Date(s.ts).toLocaleTimeString("en-IN")} — {s.label}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfidenceLadder({
  profile,
  events,
  engine,
}: {
  profile: Profile;
  events: JourneyEvent[];
  engine: EngineResult;
}) {
  const myEvents = events
    .filter((e) => engine.profileOfEvent[e.id] === profile.id)
    .sort((a, b) => a.ts - b.ts);

  const milestones: { conf: number; label: string; ts: number }[] = [
    { conf: 0.4, label: "anonymous", ts: profile.firstTs },
  ];
  const kinds = new Set<string>();
  const LEVELS: [string[], number, string][] = [
    [["deviceId"], 0.55, "device recognized"],
    [["email", "phone"], 0.8, "identity captured (email/phone)"],
    [["dniNumber"], 0.9, "web→phone stitched (DNI)"],
    [["resumeToken"], 0.9, "resume link token"],
    [["applicationId"], 0.95, "application submitted"],
    [["customerId", "cardId"], 1.0, "card activation / login — golden stitch"],
  ];
  for (const e of myEvents) {
    Object.keys(e.ids).forEach((k) => kinds.add(k));
    for (const [ks, conf, label] of LEVELS) {
      if (ks.some((k) => Object.keys(e.ids).includes(k)) && conf > milestones[milestones.length - 1].conf) {
        milestones.push({ conf, label, ts: e.ts });
      }
    }
  }
  void kinds;

  return (
    <div className="relative pt-6 pb-2">
      <div className="h-2 bg-gray-100 rounded-full" />
      {milestones.map((m, i) => (
        <div key={i} className="absolute" style={{ left: `${Math.min(m.conf * 96, 96)}%`, top: 0 }}>
          <div className={`w-4 h-4 rounded-full border-2 border-white shadow ${confBg(m.conf)} -translate-x-1/2 translate-y-2`} />
          <div className="translate-x-[-50%] mt-[-8px] text-center w-32">
            <p className="text-[10px] font-bold">{m.conf.toFixed(2)}</p>
            <p className="text-[9px] text-gray-400 leading-tight">{m.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
