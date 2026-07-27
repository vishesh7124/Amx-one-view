"use client";

import { funnelCounts } from "@/lib/analytics";
import { getPersonaMeta } from "@/lib/personas";
import { EmptyState } from "./Timeline";

export default function Funnel({ events }: { events: Parameters<typeof funnelCounts>[0] }) {
  const rows = funnelCounts(events);
  if (rows.length === 0) return <EmptyState text="Funnel builds as personas move through journey stages." />;

  const first = rows[0].count;
  let biggestDrop = -1;
  let biggestDropIdx = -1;
  for (let i = 1; i < rows.length; i++) {
    const drop = rows[i - 1].count - rows[i].count;
    if (drop > biggestDrop) {
      biggestDrop = drop;
      biggestDropIdx = i;
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-xs font-bold text-amex-dark mb-4">🪣 JOURNEY FUNNEL — personas reaching each stage</p>
      <div className="space-y-2">
        {rows.map((r, i) => {
          const pct = first ? Math.round((r.count / first) * 100) : 0;
          const isDrop = i === biggestDropIdx && biggestDrop > 0;
          return (
            <div key={r.stage} className="flex items-center gap-3 fade-up">
              <span className="w-20 text-xs font-semibold capitalize text-gray-600">{r.stage}</span>
              <div className="flex-1 h-9 bg-gray-50 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full rounded-lg transition-all ${isDrop ? "bg-red-400" : "bg-amex"}`}
                  style={{ width: `${pct}%` }}
                />
                <span className="absolute inset-0 flex items-center px-3 text-xs font-bold text-amex-dark">
                  {r.count} persona{r.count !== 1 ? "s" : ""} · {pct}%
                  <span className="ml-2 font-normal text-gray-400">
                    ({r.personas.slice(0, 3).map((p) => getPersonaMeta(p).name.split(" ")[0]).join(", ")}
                    {r.personas.length > 3 ? ` +${r.personas.length - 3} more` : ""})
                  </span>
                </span>
              </div>
              {isDrop && (
                <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-1 rounded-full whitespace-nowrap">
                  🔻 BIGGEST DROP-OFF
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-400 mt-4">
        💡 Drill-down insight: the apply stage leaks high-intent prospects at the <b>KYC & fee step</b> — exactly where Aarav dropped.
        In production this view slices by channel, product, and campaign.
      </p>
    </div>
  );
}
