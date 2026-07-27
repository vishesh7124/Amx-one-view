"use client";

import { useEffect, useMemo, useState } from "react";
import { getPersonaMeta } from "@/lib/personas";
import { CHANNEL_META, type Channel, type JourneyEvent } from "@/lib/types";
import { EmptyState } from "./Timeline";

// Session Replay (Amplitude-style): play back a persona's journey step by step
export default function SessionReplay({ events }: { events: JourneyEvent[] }) {
  const personas = useMemo(
    () => ["aarav", "meera", "rohan"].filter((p) => events.some((e) => e.persona === p)),
    [events]
  );
  const [persona, setPersona] = useState<string>("");
  const active = persona || personas[0] || "";
  const steps = useMemo(
    () => events.filter((e) => e.persona === active).sort((a, b) => a.ts - b.ts),
    [events, active]
  );

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => setIdx(0), [active]);
  useEffect(() => {
    if (!playing) return;
    if (idx >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIdx((i) => Math.min(i + 1, steps.length - 1)), 1500 / speed);
    return () => clearTimeout(t);
  }, [playing, idx, steps.length, speed]);

  if (personas.length === 0) {
    return <EmptyState text="No sessions to replay yet — run a persona journey, then watch it here frame by frame." />;
  }

  const cur = steps[idx];

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      {/* playback screen */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
          <select
            value={active}
            onChange={(e) => setPersona(e.target.value)}
            className="text-sm font-extrabold text-amex-deep bg-transparent outline-none cursor-pointer"
          >
            {personas.map((p) => (
              <option key={p} value={p}>
                {getPersonaMeta(p).name}
              </option>
            ))}
          </select>
          <span className="text-[10px] bg-mist px-2 py-1 rounded-full font-bold text-gray-500">
            {steps.length} moments
          </span>
          <span className="ml-auto text-[10px] text-gray-400 font-semibold">SESSION REPLAY</span>
        </div>

        {/* the "screen" */}
        <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-mist to-white relative">
          {cur ? (
            <div key={cur.id} className="pop-in w-[320px] max-w-[85%]">
              <ChannelFrame channel={cur.channel}>
                <p className="text-sm font-extrabold text-amex-deep leading-snug">{cur.label}</p>
                {cur.detail && <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">{cur.detail}</p>}
                <p className="text-[10px] text-gray-400 mt-2 font-mono">
                  {new Date(cur.ts).toLocaleTimeString("en-IN")} · {cur.stage}
                </p>
              </ChannelFrame>
            </div>
          ) : (
            <p className="text-xs text-gray-400">No events for this persona yet.</p>
          )}
        </div>

        {/* controls */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-3">
          <button onClick={() => { setIdx(0); setPlaying(false); }} className="w-8 h-8 rounded-full bg-mist hover:bg-gray-200 text-sm" title="Restart">
            ⏮
          </button>
          <button
            onClick={() => setPlaying(!playing)}
            className="w-9 h-9 rounded-full bg-amex text-white text-sm font-bold hover:bg-amex-dark"
            title={playing ? "Pause" : "Play"}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <button onClick={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))} className="px-2.5 h-8 rounded-full bg-mist hover:bg-gray-200 text-[11px] font-bold">
            {speed}×
          </button>
          <input
            type="range"
            min={0}
            max={Math.max(0, steps.length - 1)}
            value={idx}
            onChange={(e) => { setIdx(+e.target.value); setPlaying(false); }}
            className="flex-1 accent-amex"
          />
          <span className="tnum text-[11px] font-bold text-gray-400 w-12 text-right">
            {steps.length ? idx + 1 : 0}/{steps.length}
          </span>
        </div>
      </div>

      {/* event rail */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
        <p className="px-4 py-3 text-[11px] font-bold text-gray-400 border-b border-gray-100">ALL EVENTS</p>
        <div className="flex-1 overflow-y-auto scrollbar-thin max-h-[380px]">
          {steps.map((e, i) => (
            <button
              key={e.id}
              onClick={() => { setIdx(i); setPlaying(false); }}
              className={`w-full text-left px-4 py-2.5 border-b border-gray-50 flex gap-2 items-start transition ${
                i === idx ? "bg-amex-sky/60 border-l-2 border-l-amex" : "hover:bg-mist"
              }`}
            >
              <span className="mt-0.5">{CHANNEL_META[e.channel].icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] font-semibold truncate">{e.label}</span>
                <span className="block text-[10px] text-gray-400 font-mono">
                  {new Date(e.ts).toLocaleTimeString("en-IN")}
                </span>
              </span>
              {i === idx && <span className="text-amex text-xs">●</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChannelFrame({ channel, children }: { channel: Channel; children: React.ReactNode }) {
  const meta = CHANNEL_META[channel];
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 flex items-center gap-2 border-b border-gray-100" style={{ background: `${meta.color}14` }}>
        <span className="text-sm">{meta.icon}</span>
        <span className="text-[10px] font-bold" style={{ color: meta.color }}>
          {channel === "web" ? "americanexpress.com" : channel === "app" ? "Amex Mobile App" : channel === "voice" ? "Relationship Care call" : "Merchant terminal"}
        </span>
        <span className="ml-auto w-2 h-2 rounded-full pulse-dot" style={{ background: meta.color }} />
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
