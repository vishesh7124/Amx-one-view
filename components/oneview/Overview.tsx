"use client";

import { computeAlerts, churnScore, funnelCounts } from "@/lib/analytics";
import type { EngineResult } from "@/lib/engine";
import { CHANNEL_META, CHANNELS, type JourneyEvent } from "@/lib/types";

// Executive overview: KPI strip + question-led cards (Amplitude-style)
export default function Overview({
  events,
  engine,
  onNavigate,
}: {
  events: JourneyEvent[];
  engine: EngineResult;
  onNavigate: (s: string) => void;
}) {
  const alerts = computeAlerts(events);
  const customers = engine.profiles.filter((p) => p.kind === "customer").length;
  const provisional = engine.profiles.length - customers;
  const channelsUsed = new Set(events.map((e) => e.channel)).size;
  const highAlerts = alerts.filter((a) => a.severity === "high").length;
  const funnel = funnelCounts(events);
  const channelCounts = CHANNELS.map((c) => ({ c, n: events.filter((e) => e.channel === c).length }));
  const maxCh = Math.max(1, ...channelCounts.map((x) => x.n));
  const churners = ["aarav", "meera", "rohan"]
    .map((p) => ({ p, s: churnScore(p, events) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  const kpis: { label: string; value: string; sub: string; tone?: string }[] = [
    { label: "Known customers", value: String(customers), sub: "identity resolved", tone: "text-emerald-600" },
    { label: "Anonymous in progress", value: String(provisional), sub: "still tracked, not lost", tone: "text-amber-600" },
    { label: "Events stitched", value: String(events.length), sub: `across ${channelsUsed} channels` },
    { label: "Open signals", value: String(highAlerts), sub: "high severity", tone: highAlerts ? "text-red-500" : "text-emerald-600" },
  ];

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-200 px-5 py-4 fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{k.label}</p>
            <p className={`tnum text-3xl font-extrabold tracking-tight mt-1 ${k.tone ?? "text-amex-deep"}`}>{k.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* question-led cards */}
      <div className="grid xl:grid-cols-2 gap-4">
        {/* Where are journeys breaking? */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 fade-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold tracking-tight text-amex-deep">Where are journeys breaking?</p>
            <button onClick={() => onNavigate("analytics")} className="text-[11px] font-bold text-amex hover:underline">
              Open analytics →
            </button>
          </div>
          <div className="mt-3 space-y-1.5">
            {funnel.length === 0 && <p className="text-xs text-gray-400">Play the journeys — the funnel forms live.</p>}
            {funnel.slice(0, 5).map((r, i) => {
              const pct = funnel[0].count ? Math.round((r.count / funnel[0].count) * 100) : 0;
              const drop = i > 0 && funnel[i - 1].count - r.count > 0;
              return (
                <div key={r.stage} className="flex items-center gap-2">
                  <span className="w-16 text-[10px] font-semibold capitalize text-gray-500">{r.stage}</span>
                  <div className="flex-1 h-5 bg-mist rounded overflow-hidden">
                    <div className={`h-full ${drop ? "bg-red-400" : "bg-amex"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="tnum text-[10px] font-bold text-gray-500 w-8 text-right">{r.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Who needs attention right now? */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 fade-up" style={{ animationDelay: "280ms" }}>
          <p className="text-sm font-extrabold tracking-tight text-amex-deep">Who needs attention right now?</p>
          <div className="mt-3 space-y-2">
            {alerts.length === 0 && <p className="text-xs text-gray-400">No open signals — journeys are healthy.</p>}
            {alerts.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-start gap-2 text-xs">
                <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${a.severity === "high" ? "bg-red-500" : "bg-amber-400"}`} />
                <div>
                  <p className="font-bold">{a.title}</p>
                  <p className="text-[11px] text-gray-400">{a.action ? (a.action.executed ? `✓ ${a.action.label}` : `→ ${a.action.label}`) : "review"}</p>
                </div>
              </div>
            ))}
            {alerts.length > 3 && <p className="text-[11px] text-gray-400">+{alerts.length - 3} more in the Signals rail →</p>}
          </div>
        </div>

        {/* Which channels carry the load? */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 fade-up" style={{ animationDelay: "360ms" }}>
          <p className="text-sm font-extrabold tracking-tight text-amex-deep">Which channels carry the load?</p>
          <div className="mt-3 space-y-2">
            {channelCounts.map(({ c, n }) => (
              <div key={c} className="flex items-center gap-2">
                <span className="w-16 text-[10px] font-semibold text-gray-500">{CHANNEL_META[c].icon} {CHANNEL_META[c].label}</span>
                <div className="flex-1 h-5 bg-mist rounded overflow-hidden">
                  <div className="h-full" style={{ width: `${(n / maxCh) * 100}%`, background: CHANNEL_META[c].color }} />
                </div>
                <span className="tnum text-[10px] font-bold text-gray-500 w-8 text-right">{n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Who is drifting away? */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 fade-up" style={{ animationDelay: "440ms" }}>
          <p className="text-sm font-extrabold tracking-tight text-amex-deep">Who is drifting away?</p>
          <div className="mt-3 space-y-2">
            {churners.length === 0 && <p className="text-xs text-gray-400">No churn signals yet — Rohan&apos;s journey builds them.</p>}
            {churners.map(({ p, s }) => (
              <div key={p} className="flex items-center gap-2">
                <span className="w-16 text-[10px] font-semibold text-gray-500 capitalize">{p}</span>
                <div className="flex-1 h-5 bg-mist rounded overflow-hidden">
                  <div className={`h-full ${s >= 75 ? "bg-red-500" : s >= 40 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${s}%` }} />
                </div>
                <span className={`tnum text-[10px] font-bold w-12 text-right ${s >= 75 ? "text-red-500" : "text-gray-500"}`}>{s}/100</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
