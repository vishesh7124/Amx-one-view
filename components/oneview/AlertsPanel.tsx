"use client";

import { useEffect } from "react";
import { computeAlerts, type AlertItem } from "@/lib/analytics";
import { appendEvent, useAutonomy, useEvents } from "@/lib/store";
import { getPersonaMeta, simulateCohort } from "@/lib/personas";

const ICONS = {
  dropoff: "🔻",
  repeat_contact: "🔁",
  churn_risk: "⚠️",
  channel_failover: "🔀",
  platform_bug: "🐞",
} as const;

function fireAction(a: AlertItem) {
  const act = a.action!;
  const meta = getPersonaMeta(a.persona);
  appendEvent({
    persona: a.persona,
    channel: act.eventChannel,
    type: act.eventType,
    stage: act.eventType === "action_resume_link" ? "apply" : "service",
    label: act.eventLabel,
    detail:
      act.tier === 1
        ? "Executed autonomously by the Action Engine (no human in the loop). Logged back onto the timeline — closed loop."
        : "Approved by a human agent (HITL). Logged back onto the timeline — closed loop.",
    isAction: true,
    actionTier: act.tier,
    ids: { email: meta.email, phone: meta.phone, anonId: meta.anonId, deviceId: meta.deviceWeb },
  });
}

export default function AlertsPanel() {
  const events = useEvents();
  const [autonomy] = useAutonomy();
  const alerts = computeAlerts(events);
  const cohortDone = events.some((e) => e.type === "cohort_simulated");

  // Tier-1 actions fire autonomously when the autonomy switch is ON.
  // Data-driven (no timers): on every sync tick, fire any Tier-1 action whose
  // alert is ≥3.5s old and still unexecuted. Immune to re-renders/tab throttling.
  useEffect(() => {
    if (!autonomy) return;
    const now = Date.now();
    alerts
      .filter((a) => a.action?.tier === 1 && !a.action.executed && now - a.ts >= 3500)
      .forEach(fireAction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, autonomy]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-mist border-b border-gray-100 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-amex-dark">
          🚨 FRICTION ALERTS + NEXT-BEST-ACTION ({alerts.length})
        </p>
        <button
          onClick={() => simulateCohort()}
          disabled={cohortDone}
          title="Inject 40 synthetic users with the same web-error → app-success pattern"
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
            cohortDone
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amex-dark text-white hover:bg-amex"
          }`}
        >
          {cohortDone ? "✓ cohort live" : "👥 ×40 users"}
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto scrollbar-thin divide-y divide-gray-50">
        {alerts.length === 0 && (
          <p className="text-xs text-gray-400 px-4 py-5">
            No friction yet. Alerts fire here when journeys break — abandonments, repeat contacts, churn risk.
          </p>
        )}
        {alerts.map((a) => (
          <div key={a.id} className="px-4 py-3 fade-up">
            <div className="flex items-start gap-2">
              <span>{ICONS[a.type]}</span>
              <div className="flex-1">
                <p className="text-xs font-bold">{a.title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{a.detail}</p>
                {a.action && (
                  <div className="mt-2">
                    {a.action.executed ? (
                      <span className="text-[11px] bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1.5 rounded-full inline-block">
                        ✓ Action executed — see timeline
                      </span>
                    ) : a.action.tier === 1 ? (
                      <span className="text-[11px] bg-violet-100 text-violet-700 font-semibold px-2.5 py-1.5 rounded-full inline-block pulse-dot">
                        🤖 TIER 1 · {autonomy ? "auto-executing…" : `queued — ${a.action.label}`}
                      </span>
                    ) : (
                      <button
                        onClick={() => fireAction(a)}
                        className="text-[11px] bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-full"
                      >
                        🤖→🧑 TIER 2 · Approve: {a.action.label}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
