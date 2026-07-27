"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { appendEvent, useActivePersona, useEvents, uid } from "@/lib/store";
import { PERSONAS, DNI_POOL } from "@/lib/personas";
import { buildCallScript, type ScriptEvent, type ScriptLine } from "@/lib/callScripts";
import type { PersonaId } from "@/lib/types";

type Phase = "closed" | "dialing" | "active" | "ended";

const CARD_IDS: Record<PersonaId, string> = {
  aarav: "card-aarav-1005",
  meera: "card-meera-2007",
  rohan: "card-rohan-3009",
};

export default function CallWidget() {
  const [persona] = useActivePersona();
  const events = useEvents();
  const meta = PERSONAS[persona];

  const [phase, setPhase] = useState<Phase>("closed");
  const [minimized, setMinimized] = useState(false);
  const [displayed, setDisplayed] = useState<ScriptLine[]>([]);
  const [typing, setTyping] = useState<{ speaker: "customer" | "agent"; text: string } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [ctxOpen, setCtxOpen] = useState(false);

  const scriptRef = useRef<ReturnType<typeof buildCallScript> | null>(null);
  const endedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const baseIds = useMemo(
    () =>
      persona === "aarav"
        ? { phone: meta.phone, sessionId: uid("call"), dniNumber: DNI_POOL.aarav, anonId: meta.anonId }
        : { phone: meta.phone, sessionId: uid("call"), cardId: CARD_IDS[persona], customerId: `cust-${persona}`, email: meta.email },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persona, phase]
  );

  const needsHelp = events.some(
    (e) => e.persona === persona && (e.type === "apply_abandon" || e.type === "pos_decline" || e.type === "statement_view")
  );

  const fire = (ev: ScriptEvent) => appendEvent({ persona, channel: "voice", ids: baseIds, ...ev });

  const startCall = () => {
    scriptRef.current = buildCallScript(persona, events);
    endedRef.current = false;
    setDisplayed([]);
    setTyping(null);
    setElapsed(0);
    setMinimized(false);
    setPhase("dialing");
    setTimeout(() => setPhase("active"), 1600);
  };

  const endCall = (auto = false) => {
    if (endedRef.current || !scriptRef.current) return;
    endedRef.current = true;
    const s = scriptRef.current;
    appendEvent({
      persona,
      channel: "voice",
      type: "call_end",
      stage: persona === "aarav" ? "apply" : "service",
      label: `Call ended — ${s.endResolution}`,
      detail: s.endResolution,
      reasonCode: s.reasonCode,
      ids: baseIds,
    });
    setTyping(null);
    setPhase("ended");
    void auto;
  };

  // elapsed timer
  useEffect(() => {
    if (phase !== "active") return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // transcription player — progressive, typewriter-style
  useEffect(() => {
    if (phase !== "active" || !scriptRef.current) return;
    const script = scriptRef.current.lines;
    let li = 0;
    let ci = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (cancelled) return;
      if (li >= script.length) {
        timer = setTimeout(() => endCall(true), 1400);
        return;
      }
      const line = script[li];
      if (line.speaker === "system") {
        setDisplayed((d) => [...d, line]);
        if (line.event) fire(line.event);
        li++;
        timer = setTimeout(tick, 650);
        return;
      }
      ci++;
      setTyping({ speaker: line.speaker, text: line.text.slice(0, ci) });
      if (ci >= line.text.length) {
        setDisplayed((d) => [...d, line]);
        if (line.event) fire(line.event);
        setTyping(null);
        li++;
        ci = 0;
        timer = setTimeout(tick, line.speaker === "agent" ? 1000 : 750);
        return;
      }
      timer = setTimeout(tick, 24);
    };

    timer = setTimeout(tick, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // auto-scroll transcript
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [displayed, typing, phase]);

  const close = () => {
    if (phase === "active" || phase === "dialing") endCall();
    setPhase("closed");
    setMinimized(false);
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ─── launcher ───
  if (phase === "closed") {
    return (
      <button
        onClick={startCall}
        title={`Call AmEx Customer Care (${DNI_POOL[persona]})`}
        className="fixed bottom-4 right-4 z-[60] group"
      >
        <span className="relative flex w-14 h-14 rounded-full bg-amex hover:bg-amex-dark shadow-xl items-center justify-center text-2xl transition">
          📞
          {needsHelp && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white pulse-dot" />}
        </span>
        <span className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap bg-amex-deep text-white text-[11px] font-semibold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition pointer-events-none">
          AmEx Care · {DNI_POOL[persona]}
        </span>
      </button>
    );
  }

  // ─── minimized pill ───
  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-[60] bg-amex text-white rounded-full px-4 py-2.5 shadow-xl text-xs font-bold flex items-center gap-2"
      >
        🎧 {phase === "active" ? `On call · ${fmt(elapsed)}` : phase === "dialing" ? "Dialing…" : "Call ended"}
        <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
      </button>
    );
  }

  // ─── call panel ───
  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[384px] max-w-[92vw] h-[560px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden pop-in">
      {/* header */}
      <div className="bg-amex text-white px-4 py-3 flex items-center gap-2">
        <span className="text-lg">📞</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">AmEx Care · {DNI_POOL[persona]}</p>
          <p className="text-[10px] text-white/70">
            {phase === "dialing" ? "Dialing…" : phase === "active" ? `● LIVE ${fmt(elapsed)} — Relationship Care` : "Call ended"}
          </p>
        </div>
        <button onClick={() => setMinimized(true)} className="w-7 h-7 rounded-full hover:bg-white/20 text-sm" title="Minimize">
          —
        </button>
        <button onClick={close} className="w-7 h-7 rounded-full hover:bg-white/20 text-sm" title="End & close">
          ✕
        </button>
      </div>

      {/* "agent already knows" context strip */}
      {scriptRef.current && phase !== "dialing" && (
        <button onClick={() => setCtxOpen(!ctxOpen)} className="bg-amex-sky px-3 py-1.5 text-left border-b border-amex/10">
          <p className="text-[10px] font-bold text-amex-dark">
            🧠 Agent sees the stitched journey {ctxOpen ? "▾" : "▸"}
          </p>
          {ctxOpen && (
            <div className="mt-1 space-y-0.5 fade-up">
              {scriptRef.current.context.map((c) => (
                <p key={c} className="text-[10px] text-amex-dark/80 font-mono">{c}</p>
              ))}
            </div>
          )}
        </button>
      )}

      {/* transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2 bg-mist">
        {phase === "dialing" && (
          <p className="text-center text-xs text-gray-400 py-8 pulse-dot">
            🔊 Dialing {DNI_POOL[persona]}…
            <br />
            <span className="text-[10px]">{persona === "aarav" ? "the tracked number from the website" : "the number on the back of the card"}</span>
          </p>
        )}
        {displayed.map((l, i) =>
          l.speaker === "system" ? (
            <p key={i} className="text-center text-[10px] text-gray-400 py-0.5 fade-up">{l.text}</p>
          ) : (
            <div key={i} className={`flex ${l.speaker === "customer" ? "justify-end" : "justify-start"} fade-up`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${
                  l.speaker === "customer"
                    ? "bg-amex text-white rounded-br-sm"
                    : "bg-white border border-gray-200 rounded-bl-sm"
                }`}
              >
                {l.speaker === "agent" && <span className="mr-1">👩‍💼</span>}
                {l.text}
              </div>
            </div>
          )
        )}
        {typing && (
          <div className={`flex ${typing.speaker === "customer" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${
                typing.speaker === "customer"
                  ? "bg-amex text-white rounded-br-sm"
                  : "bg-white border border-gray-200 rounded-bl-sm"
              }`}
            >
              {typing.speaker === "agent" && <span className="mr-1">👩‍💼</span>}
              {typing.text}
              <span className="opacity-50">▍</span>
            </div>
          </div>
        )}
        {phase === "ended" && (
          <p className="text-center text-[11px] text-emerald-600 font-semibold pt-2 fade-up">
            ✓ Full transcript + outcome logged to the journey timeline
          </p>
        )}
      </div>

      {/* footer */}
      <div className="border-t border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
        {phase === "active" ? (
          <>
            <span className="text-[11px] text-gray-400">🔇 mute · ⌨️ keypad · 🔊 speaker</span>
            <button onClick={() => endCall()} className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold">
              End call
            </button>
          </>
        ) : phase === "ended" ? (
          <>
            <span className="text-[11px] text-gray-400">Duration {fmt(elapsed)}</span>
            <button onClick={close} className="px-4 py-2 rounded-full bg-amex hover:bg-amex-dark text-white text-xs font-bold">
              Close
            </button>
          </>
        ) : (
          <span className="text-[11px] text-gray-400">Connecting you securely…</span>
        )}
      </div>
    </div>
  );
}
