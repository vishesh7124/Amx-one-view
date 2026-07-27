"use client";

import { useEffect, useState } from "react";
import { PERSONAS, SCRIPTS, TAB_LABELS, TAB_ROUTES } from "@/lib/personas";
import { useActivePersona, useEvents } from "@/lib/store";

const TOUR_KEY = "amex.oneview.tour";

// Guided tour: spotlight the exact element to click, auto-advance when the
// action's real event fires. Starts automatically on first visit.
export default function TourGuide({ current }: { current: string }) {
  const [persona] = useActivePersona();
  const events = useEvents();
  const [tourOn, setTourOn] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setTourOn(localStorage.getItem(TOUR_KEY) !== "off"); // default ON (first visit)
    const restart = () => {
      localStorage.setItem(TOUR_KEY, "on");
      setTourOn(true);
    };
    window.addEventListener("amex:tour-restart", restart);
    return () => window.removeEventListener("amex:tour-restart", restart);
  }, []);

  const steps = SCRIPTS[persona];
  const step = steps.find((s) => !events.some(s.match));
  const idx = step ? steps.indexOf(step) : steps.length;
  const done = !step;

  // poll for the target element (modals/panels mount asynchronously)
  useEffect(() => {
    if (!tourOn || !step || step.tab !== current) {
      setRect(null);
      return;
    }
    const find = () => {
      for (const sel of step.targets ?? []) {
        const el = document.querySelector(`[data-tour="${sel}"]`);
        if (el) {
          setRect(el.getBoundingClientRect());
          return;
        }
      }
      setRect(null);
    };
    find();
    const t = setInterval(find, 450);
    return () => clearInterval(t);
  }, [tourOn, step, current, events]);

  if (!tourOn) return null;

  const skip = () => {
    localStorage.setItem(TOUR_KEY, "off");
    setTourOn(false);
  };

  const meta = PERSONAS[persona];
  const eyebrow = `GUIDED JOURNEY · ${meta.name.toUpperCase()} · ${Math.min(idx + 1, steps.length)}/${steps.length}`;

  const dots = (
    <div className="flex gap-1">
      {steps.map((s, i) => (
        <span
          key={s.id}
          className={`h-1 rounded-full transition-all ${i < idx ? "w-3 bg-amex" : i === idx ? "w-3 bg-amex/50" : "w-1.5 bg-gray-300"}`}
        />
      ))}
    </div>
  );

  const cardBody = (hint: string, note?: string) => (
    <div>
      <p className="text-[9px] font-extrabold tracking-widest text-amex">{eyebrow}</p>
      <p className="mt-1 text-sm font-bold text-amex-deep leading-snug">{hint}</p>
      {note && <p className="mt-0.5 text-[11px] text-gray-400">{note}</p>}
      <div className="mt-2.5 flex items-center justify-between">
        {dots}
        <button onClick={skip} className="text-[10px] text-gray-400 hover:text-gray-600 font-semibold">
          Skip tour
        </button>
      </div>
    </div>
  );

  // ─── journey complete ───
  if (done) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[75] w-[360px] max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-emerald-200 p-4 pop-in">
        {cardBody(`🎉 ${meta.name.split(" ")[0]}'s journey is complete — check the full stitched timeline in Amex One View.`, "Restart the tour anytime from the 🎬 panel (▶ tour).")}
      </div>
    );
  }

  // ─── step lives on another tab ───
  if (step.tab !== current) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[75] w-[360px] max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 pop-in">
        {cardBody(step.hint)}
        <button
          onClick={() => window.open(TAB_ROUTES[step.tab], "_blank")}
          className="mt-3 w-full py-2.5 rounded-full bg-amex text-white text-xs font-bold hover:bg-amex-dark"
        >
          Continue on {TAB_LABELS[step.tab]} →
        </button>
      </div>
    );
  }

  // ─── target found: spotlight + tooltip ───
  if (rect) {
    const pad = 6;
    const below = rect.bottom + 160 < window.innerHeight;
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - 360));
    return (
      <>
        <div
          className="fixed z-[70] pointer-events-none rounded-xl pulse-dot"
          style={{
            left: rect.left - pad,
            top: rect.top - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            border: "2px solid #016fd0",
            boxShadow: "0 0 0 9999px rgba(0,15,51,0.45), 0 0 0 5px rgba(1,111,208,0.30)",
          }}
        />
        <div
          className="fixed z-[75] w-[340px] max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 pop-in"
          style={
            below
              ? { left, top: rect.bottom + 14 }
              : { left, bottom: window.innerHeight - rect.top + 14 }
          }
        >
          {cardBody(step.hint, "Click the highlighted element — the tour advances on its own.")}
        </div>
      </>
    );
  }

  // ─── right tab, target not mounted yet (or watch-only step) ───
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[75] w-[360px] max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 pop-in">
      {cardBody(step.hint, step.targets ? "The element highlights when it appears." : "Happens on its own — just watch.")}
    </div>
  );
}
