"use client";

import { useEffect, useState } from "react";
import type { EngineResult } from "@/lib/engine";
import { CHANNEL_META, CHANNELS, type JourneyEvent } from "@/lib/types";

export default function Timeline({
  events,
  engine,
  selectedProfile,
}: {
  events: JourneyEvent[];
  engine: EngineResult;
  selectedProfile: string | null;
}) {
  const [openEvent, setOpenEvent] = useState<JourneyEvent | null>(null);
  const [mode, setMode] = useState<"chrono" | "lanes">(selectedProfile ? "chrono" : "lanes");

  useEffect(() => {
    setMode(selectedProfile ? "chrono" : "lanes");
  }, [selectedProfile]);

  const visible = [...events]
    .filter((e) => !selectedProfile || engine.profileOfEvent[e.id] === selectedProfile)
    .sort((a, b) => a.ts - b.ts);

  const profile = engine.profiles.find((p) => p.id === selectedProfile);

  return (
    <div className="space-y-3">
      {/* mode toggle */}
      <div className="flex gap-1 bg-white rounded-full border border-gray-200 p-1 w-fit text-[11px] font-bold">
        <button
          onClick={() => setMode("chrono")}
          className={`px-3 py-1.5 rounded-full ${mode === "chrono" ? "bg-amex text-white" : "text-gray-500"}`}
        >
          ⏱ Chronological
        </button>
        <button
          onClick={() => setMode("lanes")}
          className={`px-3 py-1.5 rounded-full ${mode === "lanes" ? "bg-amex text-white" : "text-gray-500"}`}
        >
          🏊 Channel swimlanes
        </button>
      </div>

      {visible.length === 0 && (
        <EmptyState text="No journey events yet — open a channel mockup (🔵 web / 🟢 app / 🟠 call) and start the persona script." />
      )}

      {/* ─── chronological: one interleaved story, strictly by time ─── */}
      {mode === "chrono" &&
        visible.map((e) => (
          <div key={e.id} className="flex gap-3 items-start">
            <div className="w-24 shrink-0 pt-2 text-right">
              <span className="text-[10px] text-gray-400 font-mono">
                {new Date(e.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
            <span className="mt-2.5 text-sm shrink-0" title={CHANNEL_META[e.channel].label}>
              {CHANNEL_META[e.channel].icon}
            </span>
            <EventCard e={e} onOpen={() => setOpenEvent(e)} />
          </div>
        ))}

      {/* ─── swimlanes: grouped per channel ─── */}
      {mode === "lanes" &&
        CHANNELS.map((ch) => {
          const laneEvents = visible.filter((e) => e.channel === ch);
          if (laneEvents.length === 0) return null;
          const meta = CHANNEL_META[ch];
          return (
            <div key={ch} className="flex gap-3 items-start">
              <div className="w-24 shrink-0 pt-2">
                <span className="text-xs font-bold" style={{ color: meta.color }}>
                  {meta.icon} {meta.label}
                </span>
              </div>
              <div className="flex-1 border-l-2 pl-4 py-1 space-y-2" style={{ borderColor: meta.color }}>
                {laneEvents.map((e) => (
                  <EventCard key={e.id} e={e} onOpen={() => setOpenEvent(e)} showTime />
                ))}
              </div>
            </div>
          );
        })}

      {/* event inspector */}
      {openEvent && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpenEvent(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-w-[95vw] p-5 pop-in" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs text-gray-400">EVENT INSPECTOR — &quot;how do we know this is the same person?&quot;</p>
            <h3 className="font-bold mt-1">{CHANNEL_META[openEvent.channel].icon} {openEvent.label}</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Info k="Channel" v={CHANNEL_META[openEvent.channel].label} />
              <Info k="Stage" v={openEvent.stage} />
              <Info k="Time" v={new Date(openEvent.ts).toLocaleString("en-IN")} />
              <Info k="Resolved profile" v={engine.profileOfEvent[openEvent.id] ?? "—"} />
            </div>
            <p className="text-xs font-bold text-gray-400 mt-4 mb-1">Identifiers carried by this event</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(openEvent.ids).map(([k, v]) => (
                <span key={k} className="text-[11px] bg-mist border border-gray-200 rounded-full px-2 py-1 font-mono">
                  {k}: {String(v)}
                </span>
              ))}
            </div>
            {profile && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-3">
                ✓ Stitched into {profile.name} (confidence {profile.confidence.toFixed(2)}) via deterministic identifiers
              </p>
            )}
            <button onClick={() => setOpenEvent(null)} className="mt-4 w-full py-2 rounded-full bg-amex text-white text-sm font-semibold">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EventCard({ e, onOpen, showTime }: { e: JourneyEvent; onOpen: () => void; showTime?: boolean }) {
  return (
    <button
      onClick={onOpen}
      className={`fade-up flex-1 text-left rounded-xl px-3 py-2 border text-sm shadow-sm transition hover:shadow-md ${
        e.isAction
          ? "bg-violet-50 border-violet-300"
          : e.type.includes("abandon") || e.type.includes("decline") || (e.sentiment ?? 0) <= -0.5
            ? "bg-red-50 border-red-200"
            : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center gap-2">
        {e.isAction && <span className="text-[10px] bg-violet-600 text-white px-1.5 py-0.5 rounded font-bold">🤖 TIER {e.actionTier}</span>}
        <span className="font-medium flex-1">{e.label}</span>
        {showTime && (
          <span className="text-[10px] text-gray-400 whitespace-nowrap">
            {new Date(e.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
      </div>
      {e.detail && <p className="text-[11px] text-gray-500 mt-0.5">{e.detail}</p>}
    </button>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-mist rounded-lg px-2.5 py-2">
      <p className="text-[10px] text-gray-400">{k}</p>
      <p className="font-semibold">{v}</p>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-14 text-gray-400 text-sm bg-white rounded-2xl border border-dashed border-gray-300">
      <div className="text-3xl mb-2">🛰️</div>
      {text}
    </div>
  );
}
