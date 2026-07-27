"use client";

import { appendEvent, useEvents } from "@/lib/store";

// Web experimentation (Amplitude-style): journey-informed A/B decisions
const COMPLETED = {
  title: "Save-and-resume recovery channel",
  hypothesis: "SMS nudges recover more abandoned applications than email",
  variants: [
    { name: "A · Email resume link", conv: 38, tone: "bg-gray-300" },
    { name: "B · SMS resume link", conv: 54, tone: "bg-amex" },
  ],
  uplift: "+42%",
  conf: 96,
  verdict: "B wins — SMS resumes significantly more abandoned applications.",
};

export default function Experiments() {
  const events = useEvents();
  const rolledOut = events.some((e) => e.type === "experiment_rollout");

  const rollout = () =>
    appendEvent({
      persona: "aarav",
      channel: "web",
      type: "experiment_rollout",
      stage: "apply",
      label: "🧪 Rolled out winner: SMS save-resume nudges (96% confidence) — Tier-2 approved",
      detail: "Experiment outcome applied to production recovery flows. Logged on the timeline — closed loop.",
      isAction: true,
      actionTier: 2,
      ids: { sessionId: "exp-console" },
    });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-5 fade-up">
        <div className="flex items-center gap-2">
          <p className="text-sm font-extrabold tracking-tight text-amex-deep">{COMPLETED.title}</p>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">COMPLETED</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5">Hypothesis: {COMPLETED.hypothesis}</p>

        <div className="mt-4 space-y-2.5">
          {COMPLETED.variants.map((v) => (
            <div key={v.name} className="flex items-center gap-3">
              <span className="w-40 text-[11px] font-semibold text-gray-600">{v.name}</span>
              <div className="flex-1 h-6 bg-mist rounded overflow-hidden">
                <div className={`h-full ${v.tone}`} style={{ width: `${v.conv}%` }} />
              </div>
              <span className="tnum text-xs font-extrabold text-amex-deep w-10 text-right">{v.conv}%</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            uplift {COMPLETED.uplift}
          </span>
          <span className="text-[11px] font-bold text-amex-dark bg-amex-sky border border-amex/20 px-2.5 py-1 rounded-full">
            confidence {COMPLETED.conf}%
          </span>
          <span className="text-[11px] text-gray-500">{COMPLETED.verdict}</span>
        </div>

        <div className="mt-4">
          {rolledOut ? (
            <span className="text-[11px] bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-full">
              ✓ Winner rolled out — logged on the journey timeline
            </span>
          ) : (
            <button onClick={rollout} className="text-[11px] bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-full">
              🤖→🧑 Approve rollout (Tier 2)
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 fade-up" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center gap-2">
          <p className="text-sm font-extrabold tracking-tight text-amex-deep">KYC step simplification</p>
          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">RUNNING</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Hypothesis: deferring document upload to after fee disclosure cuts the biggest drop-off in the application funnel.
        </p>
        <div className="mt-4">
          <div className="h-2 bg-mist rounded-full overflow-hidden">
            <div className="h-full bg-amex rounded-full grow-x" style={{ width: "62%" }} />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">62% to significance · est. 2 days · journeys from One View feed both arms</p>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 px-1">
        Experiments here are informed by stitched journeys — variants are compared on <b>completed journeys</b>, not page metrics. That is what makes journey-level experimentation different from page-level A/B testing.
      </p>
    </div>
  );
}
