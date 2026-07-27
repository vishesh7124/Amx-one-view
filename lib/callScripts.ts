import type { JourneyEvent, PersonaId, Stage } from "./types";
import { PERSONAS, DNI_POOL } from "./personas";

// ─── Journey-aware call scripts ───
// The agent's lines are generated from the caller's ACTUAL stitched events —
// the transcript itself demonstrates that the executive already knows the journey.

export interface ScriptEvent {
  type: string;
  stage: Stage;
  label: string;
  detail?: string;
  reasonCode?: string;
  sentiment?: number;
}

export interface ScriptLine {
  speaker: "customer" | "agent" | "system";
  text: string;
  event?: ScriptEvent; // fired when this line appears
}

export interface CallScript {
  lines: ScriptLine[];
  endResolution: string;
  reasonCode: string;
  context: string[]; // chips shown in the "agent knows" strip
}

const CARD_LAST4: Record<PersonaId, string> = {
  aarav: "1005",
  meera: "2007",
  rohan: "3009",
};

export function buildCallScript(persona: PersonaId, events: JourneyEvent[]): CallScript {
  if (persona === "aarav") return aaravScript(events);
  if (persona === "meera") return meeraScript(events);
  return rohanScript(events);
}

// ─── AARAV — prospect calling the website's per-session DNI number ───
function aaravScript(events: JourneyEvent[]): CallScript {
  const abandoned = events.some((e) => e.persona === "aarav" && e.type === "apply_abandon");
  const compared = events.some((e) => e.persona === "aarav" && e.type === "compare_view");
  const firstName = PERSONAS.aarav.name.split(" ")[0];

  const context = [
    `🔵 web session ${PERSONAS.aarav.anonId}`,
    `🔗 stitched via DNI ${DNI_POOL.aarav} · conf 0.90`,
    ...(abandoned ? ["📄 application saved at KYC step", "📧 resume link emailed"] : ["👀 card pages viewed tonight"]),
  ];

  const connect: ScriptLine = {
    speaker: "system",
    text: "🎧 Connected — Priya, Relationship Care",
    event: {
      type: "call_start",
      stage: "apply",
      label: "Call connected — ask about card fees & benefits",
      reasonCode: "fee_inquiry",
      sentiment: 0.1,
      detail: `Dialed the number shown on the website (${DNI_POOL.aarav}) — DNI stitch links this call to the anonymous web session.`,
    },
  };

  const branch: ScriptLine[] = abandoned
    ? [
        {
          speaker: "agent",
          text: `Of course. I can see you were ${compared ? "comparing the Platinum Travel and Gold Charge cards" : "browsing our cards"} tonight, and your application is saved at the KYC step — so no need to repeat any of that.`,
        },
        { speaker: "customer", text: "Oh — you can already see that? Good. Yes, is the annual fee charged immediately?" },
        {
          speaker: "agent",
          text: "It's billed only after your Card is issued, and the first-year travel credits more than offset it. I've also emailed you a secure link — your application resumes exactly where you left it.",
        },
        { speaker: "customer", text: "Perfect, that saves me from doing it all over again. I'll complete it right after this call." },
      ]
    : [
        {
          speaker: "agent",
          text: `Happy to help. I can see the cards you viewed on our site tonight — shall I walk you through how their fees and rewards compare?`,
        },
        { speaker: "customer", text: "Yes please, that's exactly what I needed." },
      ];

  const lines: ScriptLine[] = [
    { speaker: "system", text: "🔇 No card verification needed — number dialed is a tracked website number" },
    connect,
    { speaker: "agent", text: `Good evening, thank you for calling American Express — I'm Priya. Am I speaking with ${firstName}?` },
    { speaker: "customer", text: "Yes, hi. I was on your website looking at cards and I have a question about the fees." },
    ...branch,
    { speaker: "agent", text: `Wonderful. Is there anything else I can help you with, ${firstName}? … Have a great evening!` },
  ];

  return {
    lines,
    endResolution: "Answered fee questions; emailed application link",
    reasonCode: "fee_inquiry",
    context,
  };
}

// ─── MEERA — member, web booking failure → app failover ───
function meeraScript(events: JourneyEvent[]): CallScript {
  const priorCalls = events.filter((e) => e.persona === "meera" && e.type === "call_start");
  const isRepeat = priorCalls.length >= 1;
  const appSuccess = events.some((e) => e.persona === "meera" && e.type === "booking_success");

  const ivr: ScriptLine = {
    speaker: "system",
    text: `✓ IVR verified — card ••${CARD_LAST4.meera} + OTP (conf 1.00)`,
    event: {
      type: "ivr_auth",
      stage: "service",
      label: `IVR authentication — card ••${CARD_LAST4.meera} + OTP`,
      detail: "Deterministic anchor: this call now belongs to a known Card Member (conf 1.00).",
    },
  };

  return {
    reasonCode: "booking_failed",
    endResolution: "logged web incident with engineering + 1,000 MR goodwill points",
    context: [
      `✓ IVR verified · conf 1.00`,
      "🔴 web booking error (ERR-5003) — visible",
      appSuccess ? "🟢 app booking success — visible" : "⏳ app booking not done yet",
      "🔴 legacy CRM: would show a blank ticket",
    ],
    lines: [
      ivr,
      {
        speaker: "system",
        text: "🎧 Connected — Vikram, Relationship Care",
        event: {
          type: "call_start",
          stage: "service",
          label: isRepeat ? "💥 Calls AGAIN — same issue (repeat contact)" : "Call connected — travel insurance booking failed on web",
          reasonCode: "booking_failed",
          sentiment: -0.3,
          detail: isRepeat
            ? "calls again about the failed website booking. Legacy CRM: brand-new ticket."
            : "Reason: booking_failed (web ERR-5003).",
        },
      },
      {
        speaker: "agent",
        text: appSuccess
          ? "Hello Meera, I'm Vikram. I can see you tried to buy travel insurance on our website and hit an error — and that you completed it in the app a few minutes later. I'm sorry for the runaround."
          : "Hello Meera, I'm Vikram. I can see you tried to buy travel insurance on our website and hit an error a few minutes ago. I'm sorry about that.",
      },
      { speaker: "customer", text: "Yes, the website just said 'something went wrong'. At least the app worked." },
      {
        speaker: "agent",
        text: "I've attached your session to an engineering ticket — and credited 1,000 Membership Rewards points as an apology. Your policy documents are already in the app.",
      },
      { speaker: "customer", text: "That's appreciated. Thank you." },
      { speaker: "agent", text: "Anything else I can help with? … Thank you for your patience, Meera." },
    ],
  };
}

// ─── ROHAN — annual fee → churn arc ───
function rohanScript(events: JourneyEvent[]): CallScript {
  const priorFeeCall = events.some(
    (e) => e.persona === "rohan" && e.type === "call_start" && e.reasonCode === "annual_fee"
  );

  const ivr: ScriptLine = {
    speaker: "system",
    text: `✓ IVR verified — card ••${CARD_LAST4.rohan} + OTP (conf 1.00)`,
    event: {
      type: "ivr_auth",
      stage: "service",
      label: `IVR authentication — card ••${CARD_LAST4.rohan} + OTP`,
      detail: "Deterministic anchor: this call now belongs to a known Card Member (conf 1.00).",
    },
  };

  if (!priorFeeCall) {
    return {
      reasonCode: "annual_fee",
      endResolution: "waiver denied — no retention playbook visible to agent",
      context: [
        `✓ IVR verified · conf 1.00`,
        "🟢 statement viewed — fee ₹4,999 (app event)",
        "6-yr tenure · Platinum — visible",
      ],
      lines: [
        ivr,
        {
          speaker: "system",
          text: "🎧 Connected — Vikram, Relationship Care",
          event: {
            type: "call_start",
            stage: "service",
            label: "Call connected — question about annual fee",
            reasonCode: "annual_fee",
            sentiment: -0.6,
            detail: "Reason: annual_fee.",
          },
        },
        { speaker: "agent", text: "Mr. Malhotra, I'm Vikram. I believe this is about the ₹4,999 annual membership fee on your July statement — I can see you viewed it in the app." },
        { speaker: "customer", text: "That's right. Six years a member — I want the fee waived." },
        { speaker: "agent", text: "I completely understand, and I can see your relationship with us. Unfortunately, I don't have a waiver available on this plan today." },
        { speaker: "customer", text: "That's… really disappointing. Okay." },
        { speaker: "agent", text: "I'm sorry, sir. Is there anything else? … Thank you for calling American Express." },
      ],
    };
  }

  return {
    reasonCode: "cancellation_hint",
    endResolution: "cancellation request noted — transferred to retention queue",
    context: [
      `✓ IVR verified · conf 1.00`,
      "⚠️ churn risk 100/100 — fee denied + spend ↓52%",
      "🟠 unresolved fee call — stitched",
    ],
    lines: [
      ivr,
      {
        speaker: "system",
        text: "🎧 Connected — Priya, Relationship Care",
        event: {
          type: "call_start",
          stage: "retain",
          label: "💥 Second call — hints at cancelling the card",
          reasonCode: "cancellation_hint",
          sentiment: -0.8,
          detail: "says he is thinking of cancelling unless something is done about the fee.",
        },
      },
      { speaker: "agent", text: "Mr. Malhotra, I'm Priya. Before we begin — I can see your fee concern from the earlier call wasn't resolved, and your spending has dropped sharply since. I want to fix this." },
      { speaker: "customer", text: "Honestly, at this point I'm thinking of just cancelling the card." },
      { speaker: "agent", text: "I hear you, and I'd hate to lose a six-year relationship over this. I'm flagging your account to our retention desk on priority — you'll have a tailored offer within 24 hours. Can I ask you to hold off until then?" },
      { speaker: "customer", text: "…Fine. I'll wait 24 hours. But that's it." },
      { speaker: "agent", text: "Understood, and thank you. You'll hear from us shortly, sir." },
    ],
  };
}
