"use client";

import Link from "next/link";
import { useState } from "react";
import { SCRIPTS, PERSONAS, TAB_ROUTES, TAB_LABELS } from "@/lib/personas";
import TourGuide from "@/components/TourGuide";
import {
  useActivePersona,
  useEvents,
  clearAll,
} from "@/lib/store";
import type { PersonaId } from "@/lib/types";

// Floating demo controls + guided script checklist, shown on all mockup pages.
export default function DemoChrome({ current, bare }: { current: "web" | "app" | "call" | "oneview"; bare?: boolean }) {
  const [persona, setPersona] = useActivePersona();
  const events = useEvents();
  const [open, setOpen] = useState(false);

  const steps = SCRIPTS[persona];
  const done = steps.filter((s) => events.some(s.match)).length;
  const next = steps.find((s) => !events.some(s.match));

  return (
    <>
      {/* top-right control bar */}
      {/* {!bare && (
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2 bg-amex-deep/90 text-white rounded-full pl-3 pr-2 py-1.5 shadow-lg backdrop-blur text-xs">
        <span className="opacity-70 hidden sm:inline">🎬</span>
        <select
          value={persona}
          onChange={(e) => setPersona(e.target.value as PersonaId)}
          className="bg-transparent font-semibold outline-none cursor-pointer [&>option]:text-black"
        >
          {(Object.keys(PERSONAS) as PersonaId[]).map((p) => (
            <option key={p} value={p}>
              {PERSONAS[p].name}
            </option>
          ))}
        </select>
        <span className="opacity-40">|</span>
        {(["web", "app", "call", "oneview"] as const).map((t) => (
          <Link
            key={t}
            href={TAB_ROUTES[t]}
            target="_blank"
            className={`px-2 py-1 rounded-full hover:bg-white/15 ${current === t ? "bg-white/20 font-semibold" : ""}`}
            title={TAB_LABELS[t]}
          >
            {TAB_LABELS[t].split(" ")[0]}
          </Link>
        ))}
        <button
          onClick={() => {
            if (confirm("Reset the entire demo (all journeys wiped)?")) {
              clearAll();
              location.reload();
            }
          }}
          className="px-2 py-1 rounded-full bg-red-500/80 hover:bg-red-500 font-semibold"
          title="Reset demo"
        >
          ↺
        </button>
      </div>
      )} */}

      {/* bottom-left script checklist */}
      {/* <div className="fixed bottom-3 left-3 z-50 w-80 max-w-[85vw] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden text-sm">
        <div className="flex items-center bg-amex-dark text-white text-xs font-semibold">
          <button onClick={() => setOpen(!open)} className="flex-1 text-left px-3 py-2">
            🎬 Script — {PERSONAS[persona].name} · {done}/{steps.length} steps
          </button>
          <button
            onClick={() => window.dispatchEvent(new Event("amex:tour-restart"))}
            title="Restart guided tour"
            className="px-2.5 py-2 hover:bg-white/15 font-bold"
          >
            ▶ tour
          </button>
          <button onClick={() => setOpen(!open)} className="px-2.5 py-2 hover:bg-white/15">
            {open ? "▾" : "▴"}
          </button>
        </div>
        {open && (
          <ol className="max-h-56 overflow-y-auto scrollbar-thin p-2 space-y-1">
            {steps.map((s) => {
              const isDone = events.some(s.match);
              const isNext = next?.id === s.id;
              return (
                <li
                  key={s.id}
                  className={`flex gap-2 items-start px-2 py-1.5 rounded-lg text-xs ${
                    isDone
                      ? "text-gray-400 line-through"
                      : isNext
                        ? "bg-amex-sky text-amex-dark font-semibold ring-1 ring-amex"
                        : "text-gray-600"
                  }`}
                >
                  <span>{isDone ? "✅" : isNext ? "👉" : "▫️"}</span>
                  <span className="flex-1">{s.label}</span>
                  {!isDone && (
                    <Link
                      href={TAB_ROUTES[s.tab]}
                      target="_blank"
                      className="text-amex underline whitespace-nowrap"
                    >
                      {s.tab}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div> */}

      {/* guided tour overlay (spotlight + auto-advance) */}
      <TourGuide current={current} />
    </>
  );
}
