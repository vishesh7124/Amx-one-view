"use client";

import { flowLinks } from "@/lib/analytics";
import { STAGES, type Stage } from "@/lib/types";
import { EmptyState } from "./Timeline";

// Minimal stage-flow Sankey: nodes = stages (in journey order), links = transitions.
export default function FlowSankey({ events }: { events: Parameters<typeof flowLinks>[0] }) {
  const links = flowLinks(events);
  if (links.length === 0) return <EmptyState text="Flow diagram builds as personas move between stages." />;

  const usedStages = STAGES.filter(
    (s) => links.some((l) => l.from === s || l.to === s)
  );
  const xOf = (s: Stage) => 60 + usedStages.indexOf(s) * (880 / Math.max(usedStages.length, 1));
  const W = 60 + usedStages.length * (880 / Math.max(usedStages.length, 1)) + 80;
  const H = 220;
  const maxV = Math.max(...links.map((l) => l.value));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 overflow-x-auto scrollbar-thin">
      <p className="text-xs font-bold text-amex-dark mb-2">🌊 JOURNEY FLOW (Sankey) — how personas move between stages</p>
      <svg width={W} height={H}>
        {links.map((l, i) => {
          const x1 = xOf(l.from) + 14;
          const x2 = xOf(l.to) - 14;
          const w = 2 + (l.value / maxV) * 10;
          const backwards = usedStages.indexOf(l.to) < usedStages.indexOf(l.from);
          return (
            <path
              key={i}
              d={`M ${x1} ${H / 2} C ${(x1 + x2) / 2} ${H / 2 - 60}, ${(x1 + x2) / 2} ${H / 2 + (backwards ? 60 : -60)}, ${x2} ${H / 2}`}
              fill="none"
              stroke={backwards ? "#f59e0b" : "#016fd0"}
              strokeOpacity="0.45"
              strokeWidth={w}
            >
              <title>{`${l.from} → ${l.to}: ${l.value} transition(s)`}</title>
            </path>
          );
        })}
        {usedStages.map((s) => (
          <g key={s}>
            <rect x={xOf(s) - 14} y={H / 2 - 26} width={28} height={52} rx={6} fill="#00175a" />
            <text x={xOf(s)} y={H / 2 + 46} textAnchor="middle" fontSize="10" fontWeight="700" fill="#334155" className="capitalize">
              {s}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-[11px] text-gray-400">
        Blue = forward progress · Amber = backward loops (friction) · width = volume. Hover a flow for counts.
      </p>
    </div>
  );
}
