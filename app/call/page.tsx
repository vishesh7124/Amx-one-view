"use client";

import { useEffect, useState } from "react";
import DemoChrome from "@/components/DemoChrome";
import AmexLogo from "@/components/AmexLogo";
import { appendEvent, useActivePersona, useEvents, uid } from "@/lib/store";
import { PERSONAS, DNI_POOL } from "@/lib/personas";
import { CHANNEL_META, type PersonaId, type Stage } from "@/lib/types";

type Phase = "idle" | "dialing" | "ivr" | "menu" | "agent" | "ended";

const CARD_IDS: Record<PersonaId, string> = {
  aarav: "card-aarav-1005",
  meera: "card-meera-2007",
  rohan: "card-rohan-3009",
};

const REASONS: Record<PersonaId, { code: string; label: string; sentiment: number }[]> = {
  aarav: [{ code: "fee_inquiry", label: "Ask about card fees & benefits", sentiment: 0.1 }],
  meera: [{ code: "booking_failed", label: "Travel insurance booking failed on website", sentiment: -0.3 }],
  rohan: [
    { code: "annual_fee", label: "Question about annual fee", sentiment: -0.6 },
    { code: "cancellation_hint", label: "Thinking of cancelling my card", sentiment: -0.8 },
  ],
};

export default function CallMockup() {
  const [persona] = useActivePersona();
  const events = useEvents();
  const meta = PERSONAS[persona];
  const isProspect = persona === "aarav";

  const [phase, setPhase] = useState<Phase>("idle");
  const [authd, setAuthd] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[PersonaId][number] | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const priorCalls = events.filter((e) => e.persona === persona && e.type === "call_start");
  const callNo = priorCalls.length + 1;
  const myEvents = events.filter((e) => e.persona === persona);

  useEffect(() => {
    if (phase !== "agent") return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const emit = (
    type: string,
    stage: Stage,
    label: string,
    extra?: Partial<Parameters<typeof appendEvent>[0]>
  ) =>
    appendEvent({
      persona,
      channel: "voice",
      type,
      stage,
      label,
      ids: {
        phone: meta.phone,
        sessionId: uid("call"),
        ...(isProspect
          ? { dniNumber: DNI_POOL[persona], anonId: meta.anonId }
          : { cardId: CARD_IDS[persona], customerId: `cust-${persona}`, email: meta.email }),
      },
      ...extra,
    });

  const dial = () => {
    setPhase("dialing");
    setTimeout(() => setPhase(isProspect ? "menu" : "ivr"), 1400);
  };

  const ivrAuth = () => {
    emit("ivr_auth", "service", `IVR authentication — card ••${CARD_IDS[persona].slice(-4)} + OTP`, {
      detail: "Deterministic anchor: this call now belongs to a known Card Member (conf 1.00).",
    });
    setAuthd(true);
    setPhase("menu");
  };

  const pickReason = (r: (typeof REASONS)[PersonaId][number]) => {
    setReason(r);
    const isRepeat = priorCalls.some((c) => c.reasonCode === r.code) || priorCalls.length >= 1;
    let detail = `Reason: ${r.code}.`;
    let label = `Call connected — ${r.label.toLowerCase()}`;
    if (persona === "meera" && isRepeat) {
      label = "💥 Calls AGAIN — same issue (repeat contact)";
      detail = "3 days later — calls again about the failed website booking. Legacy CRM: brand-new ticket.";
    }
    if (persona === "rohan" && r.code === "cancellation_hint") {
      label = "💥 Second call — hints at cancelling the card";
      detail = "says he is thinking of cancelling unless something is done about the fee.";
    }
    if (persona === "aarav") {
      detail = `Dialed the number shown on the website (${DNI_POOL.aarav}) — DNI stitch links this call to the anonymous web session.`;
    }
    emit("call_start", isProspect ? "apply" : "service", label, {
      reasonCode: r.code,
      sentiment: r.sentiment,
      detail,
    });
    setPhase("agent");
    setElapsed(0);
  };

  const endCall = (resolution: string) => {
    emit("call_end", isProspect ? "apply" : "service", `Call ended — ${resolution}`, {
      reasonCode: reason?.code,
      detail: resolution,
    });
    setPhase("ended");
  };

  const endOptions: Record<PersonaId, string[]> = {
    aarav: ["Answered fee questions; emailed application link"],
    meera: ["logged web incident with engineering + 1,000 MR goodwill points"],
    rohan:
      reason?.code === "annual_fee"
        ? ["waiver denied — no retention playbook visible to agent"]
        : ["cancellation request noted — transferred to retention queue"],
  };

  return (
    <main className="min-h-screen bg-slate-800 py-8 lg:pl-[340px]">
      <DemoChrome current="call" />
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-3 text-white mb-5">
          <AmexLogo size="sm" />
          <div>
            <h1 className="font-extrabold">American Express — Customer Care</h1>
            <p className="text-xs text-white/60">24×7 Relationship Care · mockup of IVR + agent desktop</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* ─── caller side ─── */}
          <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-2xl min-h-[480px] flex flex-col">
            <p className="text-xs text-gray-400">📱 {meta.name}&apos;s phone</p>

            {phase === "idle" && (
              <div className="flex-1 flex flex-col items-center justify-center fade-up">
                <p className="text-sm text-gray-300 mb-1">
                  {isProspect ? "Calling the number shown on the website" : "Calling the number on the back of the card"}
                </p>
                <p className="text-2xl font-mono font-bold tracking-wider">{DNI_POOL[persona]}</p>
                {isProspect && (
                  <p className="text-[11px] text-amex-sky mt-2">🎬 This is a per-session DNI number — the web→phone bridge</p>
                )}
                <button onClick={dial} className="mt-6 w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-2xl shadow-lg">
                  📞
                </button>
              </div>
            )}

            {phase === "dialing" && (
              <div className="flex-1 flex flex-col items-center justify-center fade-up">
                <p className="text-lg font-semibold pulse-dot">Calling American Express…</p>
                <p className="text-xs text-gray-400 mt-2">🔊 ringing</p>
              </div>
            )}

            {phase === "ivr" && (
              <div className="flex-1 flex flex-col justify-center fade-up">
                <p className="text-sm font-semibold text-center">IVR — &quot;Welcome to American Express&quot;</p>
                <div className="mt-4 bg-white/5 rounded-2xl p-4 space-y-2 text-sm">
                  <p className="text-gray-300">To continue, please verify your Card.</p>
                  <button onClick={ivrAuth} className="w-full py-3 rounded-xl bg-amex font-semibold hover:bg-amex-dark">
                    Verify card ••{CARD_IDS[persona].slice(-4)} + OTP
                  </button>
                  <p className="text-[11px] text-gray-500 text-center">🎬 IVR auth = deterministic identity anchor (conf 1.00)</p>
                </div>
              </div>
            )}

            {phase === "menu" && (
              <div className="flex-1 flex flex-col justify-center fade-up">
                <p className="text-sm font-semibold text-center">{isProspect ? "How can we help?" : "IVR — main menu"}</p>
                <div className="mt-4 space-y-2">
                  {REASONS[persona].map((r) => (
                    <button key={r.code} onClick={() => pickReason(r)} className="w-full py-3 rounded-xl bg-white/10 hover:bg-amex text-sm font-semibold text-left px-4">
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {phase === "agent" && (
              <div className="flex-1 flex flex-col items-center justify-center fade-up">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl pulse-dot">🎧</div>
                <p className="mt-2 font-semibold">Connected — {["Priya", "Vikram", "Ananya"][callNo % 3]} (Relationship Care)</p>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
                </p>
                <div className="mt-5 w-full space-y-2">
                  {endOptions[persona].map((r) => (
                    <button key={r} onClick={() => endCall(r)} className="w-full py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-xs font-semibold">
                      End call — {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {phase === "ended" && (
              <div className="flex-1 flex flex-col items-center justify-center fade-up">
                <p className="text-lg font-semibold">Call ended</p>
                <button onClick={() => { setPhase("idle"); setReason(null); setAuthd(false); }} className="mt-4 px-5 py-2.5 rounded-full bg-white/10 text-sm font-semibold hover:bg-white/20">
                  ← Back to phone
                </button>
              </div>
            )}
          </div>

          {/* ─── agent desktop: legacy vs One View ─── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow border-2 border-red-200 overflow-hidden">
              <p className="bg-red-50 text-red-600 text-xs font-bold px-4 py-2">🖥️ LEGACY CRM — what the agent sees today</p>
              <div className="p-4 min-h-[120px]">
                {phase === "agent" || phase === "ended" ? (
                  <div className="text-sm text-gray-500 space-y-1 fade-up">
                    <p>Caller: <b>{meta.phone}</b></p>
                    {isProspect ? (
                      <>
                        <p className="text-red-500 font-semibold">⚠ No records found for this caller.</p>
                        <p className="text-xs">No web history. No abandoned application. Agent asks everything from scratch — &quot;Which card were you looking at, sir?&quot;</p>
                      </>
                    ) : (
                      <>
                        <p>{meta.name} · Gold/Platinum Card</p>
                        <p className="text-red-500 font-semibold">⚠ Ticket #{Math.floor(Math.random() * 90000 + 10000)} opened — no link to previous contacts.</p>
                        <p className="text-xs">App activity, alerts, past calls: invisible. Member must repeat the whole story.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-300">Waiting for a call…</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow border-2 border-emerald-200 overflow-hidden">
              <p className="bg-emerald-50 text-emerald-600 text-xs font-bold px-4 py-2">✨ AMEX ONE VIEW — agent context (from the stitched timeline)</p>
              <div className="p-4 min-h-[160px]">
                {myEvents.length === 0 ? (
                  <p className="text-sm text-gray-300">No stitched history yet — start the journey in the mockups.</p>
                ) : (
                  <div className="fade-up">
                    <div className="flex items-center gap-2 text-sm">
                      <b>{meta.name}</b>
                      <span className="text-[10px] bg-amex-sky text-amex-dark px-2 py-0.5 rounded-full font-semibold">
                        {new Set(myEvents.map((e) => e.channel)).size} channels stitched
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 max-h-44 overflow-y-auto scrollbar-thin">
                      {[...myEvents].slice(-8).reverse().map((e) => (
                        <p key={e.id} className="text-[11px] text-gray-600 flex gap-1.5 items-start">
                          <span>{CHANNEL_META[e.channel].icon}</span>
                          <span>{e.label}</span>
                        </p>
                      ))}
                    </div>
                    {(phase === "agent" || phase === "ended") && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-2">
                        ✓ Agent greets with full context — no repeat story, no new ticket.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
