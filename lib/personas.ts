import type { JourneyEvent, PersonaId } from "./types";
import { appendEvent, loadEvents, uid } from "./store";

// ─── Personas + presenter scripts (Slide 3 + ROADMAP §6) ───

export interface PersonaMeta {
  id: string;
  name: string;
  tag: string;
  story: string;
  color: string;
  email: string;
  phone: string;
  anonId: string;
  deviceWeb: string;
  deviceMobile: string;
}

export const PERSONAS: Record<string, PersonaMeta> = {
  aarav: {
    id: "aarav",
    name: "Aarav Sharma",
    tag: "The anonymous prospect",
    story:
      "Browses cards at midnight, abandons the application at KYC, calls to ask about fees, resumes via email link, activates in app.",
    color: "#016fd0",
    email: "aarav.sharma@gmail.com",
    phone: "+91 98100 12345",
    anonId: "anon-aarav-01",
    deviceWeb: "dev-laptop-aarav",
    deviceMobile: "dev-phone-aarav",
  },
  meera: {
    id: "meera",
    name: "Meera Iyer",
    tag: "The blocked booker — platform bug signal",
    story:
      "Logs into the website to buy travel insurance → cryptic error → switches to the app and succeeds in 2 minutes. Alone: friction. Across 40 users: a platform bug.",
    color: "#16a34a",
    email: "meera.iyer@gmail.com",
    phone: "+91 99870 54321",
    anonId: "anon-meera-01",
    deviceWeb: "dev-laptop-meera",
    deviceMobile: "dev-phone-meera",
  },
  rohan: {
    id: "rohan",
    name: "Rohan Malhotra",
    tag: "The churn risk",
    story:
      "Platinum member. Annual-fee shock → waiver denied → spend halves → hints at cancellation. Signals existed for weeks — scattered.",
    color: "#f59e0b",
    email: "rohan.malhotra@gmail.com",
    phone: "+91 98760 11223",
    anonId: "anon-rohan-01",
    deviceWeb: "dev-laptop-rohan",
    deviceMobile: "dev-phone-rohan",
  },
};

// Synthetic cohort users (sim-u-01…) get a graceful fallback identity
export function getPersonaMeta(id: string): PersonaMeta {
  if (PERSONAS[id]) return PERSONAS[id];
  return {
    id,
    name: id.startsWith("sim-") ? `Simulated user ${id.replace(/\D/g, "")}` : id,
    tag: "cohort user",
    story: "",
    color: "#94a3b8",
    email: `${id}@gmail.com`,
    phone: "+91 90000 00000",
    anonId: `${id}-anon`,
    deviceWeb: `${id}-web`,
    deviceMobile: `${id}-mob`,
  };
}

export interface ScriptStep {
  id: string;
  tab: "web" | "app" | "call" | "oneview";
  label: string;
  match: (e: JourneyEvent) => boolean;
}

const isType =
  (persona: string, ...types: string[]) =>
  (e: JourneyEvent) =>
    e.persona === persona && types.includes(e.type);

export const SCRIPTS: Record<PersonaId, ScriptStep[]> = {
  aarav: [
    { id: "a1", tab: "web", label: "Land on amex.com — browse anonymously", match: isType("aarav", "page_view") },
    { id: "a2", tab: "web", label: "View Platinum Travel Card details", match: isType("aarav", "card_view") },
    { id: "a3", tab: "web", label: "Compare cards", match: isType("aarav", "compare_view") },
    { id: "a4", tab: "web", label: "Start application (Platinum Travel)", match: isType("aarav", "apply_start") },
    { id: "a5", tab: "web", label: "💥 ABANDON at KYC step — journey 'breaks'", match: isType("aarav", "apply_abandon") },
    { id: "a6", tab: "oneview", label: "One View: drop-off alert → auto save-resume link (Tier 1)", match: isType("aarav", "action_resume_link") },
    { id: "a7", tab: "call", label: "Call the number on the website (DNI) — ask about fees", match: isType("aarav", "call_start") },
    { id: "a8", tab: "web", label: "Open resume link from email → prefilled form", match: isType("aarav", "resume_open") },
    { id: "a9", tab: "web", label: "Submit application → application ID", match: isType("aarav", "apply_submit") },
    { id: "a10", tab: "app", label: "Install app & log in", match: isType("aarav", "app_login") },
    { id: "a11", tab: "app", label: "⭐ Activate card in app — the golden stitch (1.0)", match: isType("aarav", "card_activation") },
    { id: "a12", tab: "app", label: "First in-store purchase (POS, closed loop)", match: isType("aarav", "pos_purchase") },
  ],
  meera: [
    { id: "m1", tab: "web", label: "Log in to americanexpress.com", match: isType("meera", "web_login") },
    { id: "m2", tab: "web", label: "Travel → Travel Insurance — start a quote", match: isType("meera", "booking_start") },
    { id: "m3", tab: "web", label: "💥 Unknown error — booking fails (ERR-5003)", match: isType("meera", "booking_error") },
    { id: "m4", tab: "app", label: "Switch to the mobile app → log in", match: isType("meera", "app_login") },
    { id: "m5", tab: "app", label: "Book the SAME insurance in app — ✅ success", match: isType("meera", "booking_success") },
    { id: "m6", tab: "oneview", label: "One View: 🔀 channel-failover alert → goodwill (Tier 1)", match: isType("meera", "action_goodwill") },
    { id: "m7", tab: "oneview", label: "👥 Simulate 40 users → 🐞 platform-bug alert → file incident (Tier 2)", match: (e) => e.type === "action_file_incident" },
  ],
  rohan: [
    { id: "r1", tab: "app", label: "Log in → view statement (annual fee ₹4,999 posted)", match: isType("rohan", "statement_view") },
    { id: "r2", tab: "call", label: "Call care — ask for fee waiver (denied)", match: isType("rohan", "call_start") },
    { id: "r3", tab: "app", label: "Spend drops 52% over the month", match: isType("rohan", "spend_drop") },
    { id: "r4", tab: "call", label: "💥 Second call — hints at cancellation", match: (e) => e.persona === "rohan" && e.type === "call_start" && !!e.detail?.includes("cancelling") },
    { id: "r5", tab: "oneview", label: "One View: churn-risk alert → retention offer drafted (Tier 2)", match: isType("rohan", "action_retention_offer") },
  ],
};

export const DNI_POOL: Record<string, string> = {
  aarav: "1800-419-0042",
  meera: "1800-419-2122",
  rohan: "1800-419-2122",
};

export const TAB_ROUTES: Record<string, string> = {
  web: "/web",
  app: "/app",
  call: "/call",
  oneview: "/oneview",
};

export const TAB_LABELS: Record<string, string> = {
  web: "🔵 Website",
  app: "🟢 Mobile App",
  call: "🟠 Call Center",
  oneview: "📊 Amex One View",
};

// ─── Cohort simulation: 40 synthetic users with the same web→app failover ───
// Powers the "one failover = friction, forty = platform bug" insight.
export function simulateCohort(): boolean {
  const existing = loadEvents();
  if (existing.some((e) => e.type === "cohort_simulated")) return false;
  const now = Date.now();
  for (let i = 1; i <= 40; i++) {
    const p = `sim-u-${String(i).padStart(2, "0")}`;
    const email = `${p}@gmail.com`;
    const tErr = now - Math.floor(Math.random() * 110 + 10) * 60 * 1000;
    appendEvent({
      persona: p,
      channel: "web",
      type: "booking_error",
      stage: "transact",
      label: "Travel Insurance booking failed on web — ERR-5003",
      reasonCode: "booking_error",
      sentiment: -0.4,
      ts: tErr,
      ids: { anonId: `${p}-anon`, deviceId: `${p}-web`, sessionId: uid("sess"), email },
      detail: "Web quote API timed out after payment details. User saw a generic error.",
    });
    appendEvent({
      persona: p,
      channel: "app",
      type: "booking_success",
      stage: "transact",
      label: "Completed Travel Insurance booking in app",
      ts: tErr + 8 * 60 * 1000,
      ids: { deviceId: `${p}-mob`, sessionId: uid("sess"), email },
      detail: "Same user, same policy — succeeded in the app within minutes.",
    });
  }
  appendEvent({
    persona: "meera",
    channel: "web",
    type: "cohort_simulated",
    stage: "service",
    label: "👥 Cohort simulation injected — 40 users with web error → app success",
    ids: {},
    detail: "Demo data powering aggregate platform-bug detection.",
  });
  return true;
}
