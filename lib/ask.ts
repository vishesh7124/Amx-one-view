import type { JourneyEvent } from "./types";
import type { EngineResult } from "./engine";
import { computeAlerts, churnScore, funnelCounts, type AlertItem } from "./analytics";
import { getPersonaMeta } from "./personas";
import { CHANNEL_META, CHANNELS } from "./types";

// ─── Ask One View: natural-language answers computed from LIVE stitched data ───

export interface AskChip {
  label: string;
  value: string;
  tone?: "good" | "bad" | "warn" | "info";
}
export interface AskAnswer {
  title: string;
  lines: string[];
  chips: AskChip[];
}

export const SUGGESTIONS = [
  "Where are journeys breaking right now?",
  "Is there a platform bug?",
  "Who is about to churn?",
  "Summarize Aarav's journey",
  "What should we fix first?",
];

export function answerQuery(qRaw: string, events: JourneyEvent[], engine: EngineResult): AskAnswer {
  const q = qRaw.toLowerCase();
  const alerts = computeAlerts(events);

  for (const p of ["aarav", "meera", "rohan"]) {
    if (q.includes(p)) return journeyAnswer(p, events, engine, alerts);
  }
  if (/(bug|failover|failover|5003|insurance|platform|engineering)/.test(q)) return bugAnswer(events);
  if (/(churn|cancel|retention|attrition|leaving)/.test(q)) return churnAnswer(events);
  if (/(repeat|again|callback)/.test(q)) return repeatAnswer(events);
  if (/(drop|abandon|break|lose|losing|leak|fail)/.test(q)) return dropoffAnswer(events, alerts);
  if (/(identity|stitch|confidence|merge|profile|resolution)/.test(q)) return identityAnswer(engine);
  if (/(latency|speed|fast|slow|delay|real.?time)/.test(q)) return latencyAnswer();
  if (/(fix|priorit|recommend|should|next|improve)/.test(q)) return priorityAnswer(alerts);
  if (/(how many|count|total|volume|events)/.test(q)) return volumeAnswer(events, engine);
  return helpAnswer();
}

function journeyAnswer(p: string, events: JourneyEvent[], engine: EngineResult, alerts: AlertItem[]): AskAnswer {
  const meta = getPersonaMeta(p);
  const mine = events.filter((e) => e.persona === p).sort((a, b) => a.ts - b.ts);
  const profile = engine.profiles.find((x) => x.persona === p);
  const channels = [...new Set(mine.map((e) => e.channel))];
  const myAlerts = alerts.filter((a) => a.persona === p);
  const first = mine[0];
  const last = mine[mine.length - 1];
  return {
    title: `${meta.name} — journey so far`,
    lines: [
      mine.length === 0
        ? "No events yet — start this persona's journey from the channel mockups."
        : `Started with “${first?.label}”, latest is “${last?.label}”.`,
      channels.length > 0 ? `Touched ${channels.length} channel(s): ${channels.map((c) => CHANNEL_META[c].label).join(" → ")}.` : "",
      myAlerts.length > 0 ? `Active signals: ${myAlerts.map((a) => a.title).join(" · ")}` : "No open friction signals.",
    ].filter(Boolean),
    chips: [
      { label: "events", value: String(mine.length), tone: "info" },
      { label: "identity confidence", value: profile ? profile.confidence.toFixed(2) : "—", tone: profile && profile.confidence >= 0.9 ? "good" : "warn" },
      { label: "channels", value: String(channels.length), tone: "info" },
      { label: "open signals", value: String(myAlerts.length), tone: myAlerts.length ? "bad" : "good" },
    ],
  };
}

function dropoffAnswer(events: JourneyEvent[], alerts: AlertItem[]): AskAnswer {
  const funnel = funnelCounts(events);
  let biggest = { from: "", to: "", n: 0 };
  for (let i = 1; i < funnel.length; i++) {
    const d = funnel[i - 1].count - funnel[i].count;
    if (d > biggest.n) biggest = { from: funnel[i - 1].stage, to: funnel[i].stage, n: d };
  }
  const abandons = events.filter((e) => e.type === "apply_abandon").length;
  const dropAlerts = alerts.filter((a) => a.type === "dropoff").length;
  return {
    title: "Where journeys break right now",
    lines: [
      abandons > 0
        ? `${abandons} application abandonment(s) detected — all at the KYC & annual-fee step on web.`
        : "No application abandonments yet in this session.",
      biggest.n > 0 ? `Largest stage leak: ${biggest.from} → ${biggest.to} (${biggest.n} persona${biggest.n > 1 ? "s" : ""}).` : "Funnel still forming — play more of the journeys.",
      dropAlerts > 0 ? `Recovery already in motion: ${dropAlerts} save-and-resume action(s) fired autonomously.` : "",
    ].filter(Boolean),
    chips: [
      { label: "abandonments", value: String(abandons), tone: abandons ? "bad" : "good" },
      { label: "break point", value: abandons ? "KYC & fee step" : "—", tone: "warn" },
      { label: "auto-recoveries", value: String(events.filter((e) => e.type === "action_resume_link").length), tone: "good" },
    ],
  };
}

function bugAnswer(events: JourneyEvent[]): AskAnswer {
  const errs = events.filter((e) => e.type === "booking_error");
  const users = new Set(errs.map((e) => e.persona));
  const failovers = [...users].filter((p) => events.some((e) => e.persona === p && e.type === "booking_success"));
  const isBug = failovers.length >= 4;
  return {
    title: isBug ? "Yes — platform bug pattern confirmed" : "No bug pattern yet",
    lines: [
      errs.length === 0
        ? "No booking errors observed yet. Meera's journey triggers the first one (web Travel Insurance → ERR-5003)."
        : `${errs.length} web booking failure(s) (ERR-5003) across ${users.size} user(s); ${failovers.length} of those users then completed in the app.`,
      isBug
        ? "Identical failure→failover across users means the web booking service is broken, not the users. One failover is a ticket; this many is an incident."
        : "Watch for the pattern: same error on web → success in app, repeated across users.",
    ],
    chips: [
      { label: "web failures", value: String(errs.length), tone: errs.length ? "bad" : "good" },
      { label: "failovers to app", value: String(failovers.length), tone: failovers.length >= 4 ? "bad" : "warn" },
      { label: "verdict", value: isBug ? "file incident" : "monitoring", tone: isBug ? "bad" : "info" },
    ],
  };
}

function churnAnswer(events: JourneyEvent[]): AskAnswer {
  const scores = ["aarav", "meera", "rohan"]
    .map((p) => ({ p, s: churnScore(p, events) }))
    .sort((a, b) => b.s - a.s);
  const top = scores[0];
  const meta = getPersonaMeta(top.p);
  return {
    title: top.s >= 75 ? `${meta.name} is a live churn risk` : "No critical churn risk right now",
    lines: [
      `Risk scores — ${scores.map((x) => `${getPersonaMeta(x.p).name.split(" ")[0]} ${x.s}/100`).join(" · ")}.`,
      top.s >= 75
        ? `${meta.name}: annual-fee complaint (+30) + spend drop (+25) + negative call sentiment (+15) + cancellation hint (+30) + repeat calls (+10). Signals were scattered across app, phone and statements — stitching surfaced them weeks early.`
        : "Churn signals accumulate as Rohan's journey plays out (fee → waiver denied → spend drop → cancellation hint).",
    ],
    chips: scores.map((x) => ({
      label: getPersonaMeta(x.p).name.split(" ")[0],
      value: `${x.s}/100`,
      tone: x.s >= 75 ? "bad" : x.s >= 40 ? "warn" : "good",
    })),
  };
}

function repeatAnswer(events: JourneyEvent[]): AskAnswer {
  const calls = events.filter((e) => e.type === "call_start");
  const byKey = new Map<string, number>();
  calls.forEach((c) => byKey.set(`${c.persona}|${c.reasonCode ?? "general"}`, (byKey.get(`${c.persona}|${c.reasonCode ?? "general"}`) ?? 0) + 1));
  const repeats = [...byKey.entries()].filter(([, n]) => n >= 2);
  return {
    title: "Repeat-contact watch",
    lines: [
      `${calls.length} call(s) total; ${repeats.length} repeat-contact pattern(s) — same person, same reason, multiple calls.`,
      repeats.length > 0
        ? "Legacy systems log these as separate tickets. One View treats them as one unresolved issue — that's the first-contact-resolution lever."
        : "No repeat contacts yet. Make the same persona call twice about one issue to see detection fire.",
    ],
    chips: [
      { label: "total calls", value: String(calls.length), tone: "info" },
      { label: "repeat patterns", value: String(repeats.length), tone: repeats.length ? "bad" : "good" },
    ],
  };
}

function identityAnswer(engine: EngineResult): AskAnswer {
  const customers = engine.profiles.filter((p) => p.kind === "customer").length;
  const provisional = engine.profiles.length - customers;
  const merges = engine.profiles.reduce((n, p) => n + p.stitches.length, 0);
  const avg = engine.profiles.length ? engine.profiles.reduce((s, p) => s + p.confidence, 0) / engine.profiles.length : 0;
  return {
    title: "Identity resolution status",
    lines: [
      `${engine.profiles.length} profiles tracked: ${customers} known customers, ${provisional} provisional (anonymous, still followed).`,
      `${merges} deterministic merge(s) so far — every one logged with its rule and confidence, all reversible.`,
    ],
    chips: [
      { label: "known", value: String(customers), tone: "good" },
      { label: "provisional", value: String(provisional), tone: "warn" },
      { label: "merges", value: String(merges), tone: "info" },
      { label: "avg confidence", value: avg.toFixed(2), tone: avg >= 0.8 ? "good" : "info" },
    ],
  };
}

function latencyAnswer(): AskAnswer {
  return {
    title: "Pipeline speed",
    lines: [
      "In this build, events appear in One View in under a second — web, app and phone alike.",
      "Production design target: p95 < 3s for web/app events, < 30s for voice after call end — instrumented as processed_ts − ingest_ts at every stage.",
    ],
    chips: [
      { label: "this build", value: "<1s", tone: "good" },
      { label: "design p95", value: "<3s", tone: "info" },
      { label: "voice", value: "<30s", tone: "info" },
    ],
  };
}

function priorityAnswer(alerts: AlertItem[]): AskAnswer {
  if (alerts.length === 0) {
    return {
      title: "Nothing urgent yet",
      lines: ["No open signals. Play the three journeys and this becomes a ranked fix-list."],
      chips: [{ label: "open signals", value: "0", tone: "good" }],
    };
  }
  const ranked = [...alerts].sort((a, b) => (a.severity === b.severity ? b.ts - a.ts : a.severity === "high" ? -1 : 1));
  return {
    title: "Ranked by impact",
    lines: ranked.slice(0, 4).map((a, i) => `${i + 1}. ${a.title} — ${a.action?.label ?? "review"}`),
    chips: [
      { label: "high severity", value: String(alerts.filter((a) => a.severity === "high").length), tone: "bad" },
      { label: "auto-handled", value: String(alerts.filter((a) => a.action?.executed).length), tone: "good" },
    ],
  };
}

function volumeAnswer(events: JourneyEvent[], engine: EngineResult): AskAnswer {
  return {
    title: "Data volume this session",
    lines: CHANNELS.map((c) => `${CHANNEL_META[c].label}: ${events.filter((e) => e.channel === c).length} events`),
    chips: [
      { label: "total events", value: String(events.length), tone: "info" },
      { label: "profiles", value: String(engine.profiles.length), tone: "info" },
    ],
  };
}

function helpAnswer(): AskAnswer {
  return {
    title: "I can answer questions about your journeys",
    lines: [
      "Try: “Where are journeys breaking?”, “Is there a platform bug?”, “Who is about to churn?”, “Summarize Meera's journey”, “Repeat contacts?”, “What should we fix first?”",
    ],
    chips: [
      { label: "drop-offs", value: "ask", tone: "info" },
      { label: "churn risk", value: "ask", tone: "info" },
      { label: "bug detection", value: "ask", tone: "info" },
    ],
  };
}
