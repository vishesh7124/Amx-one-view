"use client";

import Link from "next/link";
import AmexLogo from "@/components/AmexLogo";
import { PERSONAS, SCRIPTS, TAB_ROUTES } from "@/lib/personas";
import { useEvents, clearAll, setActivePersona } from "@/lib/store";
import type { PersonaId } from "@/lib/types";

export default function Console() {
  const events = useEvents();

  const launch = (p: PersonaId) => (t: string) => {
    setActivePersona(p);
    window.open(TAB_ROUTES[t], "_blank");
  };

  return (
    <main className="min-h-screen bg-mist">
      {/* header */}
      <header className="bg-amex-deep text-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center gap-4">
          <AmexLogo size="lg" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Amex <span className="text-amex-sky">One View</span> — Prototype Console
            </h1>
            <p className="text-sm text-white/70 mt-1">
              One Customer. One Identity. One Continuous Journey. · Code Street
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* how to run */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-bold text-amex-dark">How to present (the split screen)</h2>
          <ol className="mt-2 text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Pick a persona below → open <b>Amex One View</b> and keep it on the right half of the screen.</li>
            <li>Open the channel tabs (website / app / call) on the left half and play the customer.</li>
            <li>Every action in the mockups appears <b>live</b> in Amex One View — timeline, identity graph, funnel, alerts.</li>
            <li>Follow the 🎬 script checklist (bottom-left of every mockup). Reset anytime with ↺.</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["web", "app", "call", "oneview"] as const).map((t) => (
              <button
                key={t}
                onClick={() => window.open(TAB_ROUTES[t], "_blank")}
                className="px-4 py-2 rounded-full bg-amex text-white text-sm font-semibold hover:bg-amex-dark transition"
              >
                Open {t === "oneview" ? "📊 Amex One View" : t === "web" ? "🔵 Website" : t === "app" ? "🟢 App" : "🟠 Call Center"}
              </button>
            ))}
            <button
              onClick={() => {
                if (confirm("Reset the entire demo?")) { clearAll(); location.reload(); }
              }}
              className="px-4 py-2 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition"
            >
              ↺ Reset demo
            </button>
          </div>
        </section>

        {/* personas */}
        <section className="grid md:grid-cols-3 gap-4">
          {(Object.keys(PERSONAS) as PersonaId[]).map((p) => {
            const meta = PERSONAS[p];
            const steps = SCRIPTS[p];
            const done = steps.filter((s) => events.some(s.match)).length;
            return (
              <div key={p} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: meta.color }} />
                  <h3 className="font-bold">{meta.name}</h3>
                </div>
                <p className="text-xs font-semibold text-amex mt-1">{meta.tag}</p>
                <p className="text-xs text-gray-500 mt-2 flex-1">{meta.story}</p>
                <div className="mt-3">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amex transition-all"
                      style={{ width: `${(done / steps.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {done}/{steps.length} journey steps done
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1">
                  {(["web", "app", "call", "oneview"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => launch(p)(t)}
                      className="text-[11px] px-1 py-1.5 rounded-lg bg-mist hover:bg-amex-sky font-semibold text-amex-dark"
                    >
                      {t === "oneview" ? "📊" : t === "web" ? "🔵" : t === "app" ? "🟢" : "🟠"} {t === "oneview" ? "1View" : t}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* legend */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 text-sm">
          <h2 className="font-bold text-amex-dark mb-2">What the mockups simulate</h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 text-gray-600 text-xs">
            <p>🔵 <b>Web</b> — anonymous browsing, card compare, application + abandonment, resume link</p>
            <p>🟢 <b>App</b> — login, card activation (golden stitch), offers, statements, push alerts</p>
            <p>🟠 <b>Phone</b> — IVR authentication, agent desktop (legacy vs One View context)</p>
            <p>🟣 <b>In-Person</b> — POS purchases &amp; declines (closed-loop data), simulated from the app mockup</p>
          </div>
          <p className="text-[11px] text-gray-400 mt-3">
            Every event carries the identifiers available at that moment (anon id, device, DNI number, email, application id, card id…). The in-browser identity engine mirrors the production design: deterministic anchors → confidence 1.0 merges → retro-stitched timeline.
          </p>
        </section>
      </div>
    </main>
  );
}
