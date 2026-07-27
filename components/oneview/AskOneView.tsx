"use client";

import { useEffect, useRef, useState } from "react";
import { answerQuery, SUGGESTIONS, type AskAnswer } from "@/lib/ask";
import type { EngineResult } from "@/lib/engine";
import type { JourneyEvent } from "@/lib/types";

interface Msg {
  role: "user" | "ai";
  text?: string;
  answer?: AskAnswer;
  thinking?: boolean;
}

const TONE = {
  good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  bad: "bg-red-50 text-red-600 border-red-200",
  warn: "bg-amber-50 text-amber-700 border-amber-200",
  info: "bg-amex-sky text-amex-dark border-amex/20",
} as const;

export default function AskOneView({ events, engine }: { events: JourneyEvent[]; engine: EngineResult }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const submit = (q: string) => {
    const query = q.trim();
    if (!query) return;
    setMsgs((m) => [...m, { role: "user", text: query }, { role: "ai", thinking: true }]);
    setInput("");
    setTimeout(() => {
      const answer = answerQuery(query, events, engine);
      setMsgs((m) => [...m.slice(0, -1), { role: "ai", answer }]);
    }, 650);
  };

  // external "ask" trigger (topbar ⌘K input)
  useEffect(() => {
    const handler = (e: Event) => {
      const q = (e as CustomEvent<{ q: string }>).detail?.q;
      if (!q) return;
      setOpen(true);
      submit(q);
    };
    window.addEventListener("amex:ask", handler);
    return () => window.removeEventListener("amex:ask", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, engine]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 bg-amex-deep text-white pl-4 pr-5 py-3 rounded-full shadow-2xl hover:bg-amex transition group"
      >
        <span className="text-base">✨</span>
        <span className="text-xs font-extrabold tracking-tight">Ask One View</span>
        <span className="text-[9px] bg-white/15 px-1.5 py-0.5 rounded font-mono">⌘K</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] w-[420px] max-w-[94vw] h-[600px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden pop-in">
      {/* header */}
      <div className="bg-amex-deep text-white px-4 py-3 flex items-center gap-2">
        <span>✨</span>
        <div className="flex-1">
          <p className="text-sm font-extrabold tracking-tight">Ask One View</p>
          <p className="text-[10px] text-white/60">answers computed from live stitched data</p>
        </div>
        <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full hover:bg-white/15 text-sm">
          —
        </button>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3 bg-[#F7F9FC]">
        {msgs.length === 0 && (
          <div className="pt-4 fade-up">
            <p className="text-xs text-gray-500 px-1">Ask about your journeys in plain language:</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="text-[11px] bg-white border border-gray-200 hover:border-amex hover:text-amex rounded-full px-3 py-1.5 font-semibold text-gray-600 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end fade-up">
              <div className="max-w-[85%] bg-amex text-white rounded-2xl rounded-br-sm px-3 py-2 text-xs font-semibold">
                {m.text}
              </div>
            </div>
          ) : m.thinking ? (
            <div key={i} className="flex fade-up">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-gray-400">
                Analyzing stitched journeys<span className="pulse-dot">…</span>
              </div>
            </div>
          ) : (
            <div key={i} className="flex fade-up">
              <div className="max-w-[92%] bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3.5 py-3 shadow-sm">
                <p className="text-xs font-extrabold text-amex-deep">{m.answer!.title}</p>
                <div className="mt-1.5 space-y-1">
                  {m.answer!.lines.map((l, j) => (
                    <p key={j} className="text-[11px] text-gray-600 leading-relaxed">
                      {l}
                    </p>
                  ))}
                </div>
                {m.answer!.chips.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.answer!.chips.map((c, j) => (
                      <span key={j} className={`text-[10px] font-bold px-2 py-1 rounded-full border ${TONE[c.tone ?? "info"]}`}>
                        {c.label}: {c.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* input */}
      <div className="border-t border-gray-200 bg-white p-2.5 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit(input)}
          placeholder="Ask about drop-offs, churn, bugs…"
          className="flex-1 text-xs bg-mist rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-amex/30"
        />
        <button
          onClick={() => submit(input)}
          className="w-9 h-9 rounded-full bg-amex text-white text-sm font-bold hover:bg-amex-dark"
          title="Ask"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
