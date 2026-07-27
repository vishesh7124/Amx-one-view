"use client";

import AmexLogo from "@/components/AmexLogo";
import { PERSONAS, SCRIPTS } from "@/lib/personas";
import { useEvents, clearAll, setActivePersona } from "@/lib/store";
import { CHANNEL_META, type PersonaId } from "@/lib/types";

const START_ROUTE: Record<PersonaId, string> = {
  aarav: "/web",
  meera: "/web",
  rohan: "/app",
};

// short visual story-beats per persona (channel-colored stepper)
const BEATS: Record<PersonaId, { label: string; ch: keyof typeof DOT }[]> = {
  aarav: [
    { label: "Browses anonymously", ch: "web" },
    { label: "Abandons at KYC", ch: "web" },
    { label: "Calls the site number", ch: "voice" },
    { label: "Resumes via email", ch: "web" },
    { label: "Activates in app ⭐", ch: "app" },
  ],
  meera: [
    { label: "Logs in on web", ch: "web" },
    { label: "Booking fails — ERR-5003", ch: "web" },
    { label: "Retries in the app", ch: "app" },
    { label: "Success in 2 min", ch: "app" },
    { label: "Bug detected (×40) 🐞", ch: "oneview" },
  ],
  rohan: [
    { label: "Annual fee posts", ch: "app" },
    { label: "Waiver denied", ch: "voice" },
    { label: "Spend drops 52%", ch: "app" },
    { label: "Hints at cancelling", ch: "voice" },
    { label: "Retention saves him 🎁", ch: "oneview" },
  ],
};

const DOT = {
  web: "#016fd0",
  app: "#16a34a",
  voice: "#f59e0b",
  in_person: "#8b5cf6",
  oneview: "#00175a",
} as const;

const HOW = [
  ["📥", "Collect", "Every event from every channel — web, app, phone, in-person"],
  ["🧹", "Clean", "Translated into one common format, identity protected"],
  ["🧩", "Identify", "Fragments resolved into one customer, with confidence"],
  ["🧵", "Stitch", "One continuous timeline per customer, in real time"],
  ["📊", "Act", "Drop-offs flagged, churn predicted, next-best-action taken"],
] as const;

export default function Landing() {
  const events = useEvents();

  const startJourney = (p: PersonaId) => {
    setActivePersona(p);
    window.open(START_ROUTE[p], "_blank");
  };

  return (
    <main className="min-h-screen bg-white">
      {/* ─── nav ─── */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3">
          <AmexLogo size="sm" />
          <div className="leading-none">
            <p className="font-extrabold tracking-tight text-amex-deep">
              Amex <span className="text-amex">One View</span>
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">by American Express</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => window.open("/oneview", "_blank")}
              className="text-xs font-bold px-4 py-2 rounded-full bg-amex text-white hover:bg-amex-dark transition"
            >
              Launch One View ↗
            </button>
            <button
              onClick={() => {
                if (confirm("Reset all journeys?")) {
                  clearAll();
                  location.reload();
                }
              }}
              className="w-8 h-8 rounded-full text-gray-400 hover:bg-mist text-sm"
              title="Reset all journeys"
            >
              ↺
            </button>
          </div>
        </div>
      </nav>

      {/* ─── hero ─── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(120deg,#000f33 0%,#00175a 45%,#016fd0 100%)" }}>
        {/* floating channel dots */}
        <span className="hero-float absolute top-16 right-[12%] w-3 h-3 rounded-full bg-ch-web ring-4 ring-white/10" />
        <span className="hero-float absolute top-40 right-[22%] w-3 h-3 rounded-full bg-ch-app ring-4 ring-white/10" style={{ animationDelay: "1.2s" }} />
        <span className="hero-float absolute top-24 right-[30%] w-3 h-3 rounded-full bg-ch-voice ring-4 ring-white/10" style={{ animationDelay: "2.1s" }} />
        <span className="hero-float absolute top-52 right-[8%] w-3 h-3 rounded-full bg-ch-inperson ring-4 ring-white/10" style={{ animationDelay: "0.6s" }} />

        <div className="max-w-6xl mx-auto px-6 py-20 text-white">
          <p className="text-[11px] font-bold tracking-[0.25em] text-amex-sky/90 fade-up">AMEX ONE VIEW</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.08] max-w-3xl fade-up" style={{ animationDelay: "120ms" }}>
            One Customer. One Identity.
            <br />
            One Continuous Journey.
          </h1>
          <p className="mt-5 text-sm md:text-base text-white/70 max-w-xl leading-relaxed fade-up" style={{ animationDelay: "240ms" }}>
            Every interaction — website, app, phone and in-person — stitched into a single timeline per customer.
            So we can see exactly where a journey breaks, and fix it before the customer is lost.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 fade-up" style={{ animationDelay: "360ms" }}>
            <button
              onClick={() => window.open("/oneview", "_blank")}
              className="px-6 py-3 rounded-full bg-white text-amex-dark text-sm font-bold hover:bg-amex-sky transition"
            >
              Launch Amex One View ↗
            </button>
            <a href="#journeys" className="px-6 py-3 rounded-full border border-white/30 text-sm font-bold text-white hover:bg-white/10 transition">
              Start a journey ↓
            </a>
          </div>
          <div className="mt-10 flex gap-6 text-[11px] text-white/50 font-semibold fade-up" style={{ animationDelay: "480ms" }}>
            <span>🔵 Web</span>
            <span>🟢 App</span>
            <span>🟠 Phone</span>
            <span>🟣 In-Person</span>
            <span className="text-white/30">→ 1 timeline</span>
          </div>
        </div>
      </section>

      {/* ─── how it works ─── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-xl font-extrabold tracking-tight text-amex-deep">How One View works</h2>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          {HOW.map(([icon, title, desc], i) => (
            <div key={title} className="fade-up bg-mist rounded-2xl p-4" style={{ animationDelay: `${i * 110}ms` }}>
              <div className="text-xl">{icon}</div>
              <p className="mt-2 text-sm font-extrabold text-amex-deep">{title}</p>
              <p className="mt-1 text-[11px] text-gray-500 leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── journeys ─── */}
      <section id="journeys" className="bg-mist/60 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-xl font-extrabold tracking-tight text-amex-deep">Experience a live journey</h2>
          <p className="mt-1 text-sm text-gray-500">
            Pick a customer — their story plays out across the channels, and Amex One View stitches it in real time.
          </p>

          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {(Object.keys(PERSONAS) as PersonaId[]).map((p, idx) => {
              const meta = PERSONAS[p];
              const steps = SCRIPTS[p];
              const done = steps.filter((s) => events.some(s.match)).length;
              return (
                <button
                  key={p}
                  onClick={() => startJourney(p)}
                  className="group text-left bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:border-amex/40 hover:-translate-y-0.5 transition-all fade-up"
                  style={{ animationDelay: `${idx * 140}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-extrabold" style={{ background: meta.color }}>
                        {meta.name.split(" ").map((w) => w[0]).join("")}
                      </span>
                      <div>
                        <p className="font-extrabold text-sm tracking-tight">{meta.name}</p>
                        <p className="text-[11px] font-semibold text-amex">{meta.tag}</p>
                      </div>
                    </div>
                    <span className="text-amex opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all font-bold">
                      →
                    </span>
                  </div>

                  <JourneyBeats beats={BEATS[p]} />

                  <div className="mt-5">
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(done / steps.length) * 100}%`, background: meta.color }} />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <p className="text-[10px] text-gray-400">{done}/{steps.length} moments experienced</p>
                      <p className="text-[10px] font-bold text-amex opacity-0 group-hover:opacity-100 transition">
                        Start journey →
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-[11px] text-gray-400">
            Tip: keep <b>Amex One View</b> on one half of the screen while the journey plays on the other — every moment appears live.
          </p>
        </div>
      </section>

      {/* ─── footer ─── */}
      <footer className="bg-amex-deep text-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-3">
            <AmexLogo size="sm" />
            <div>
              <p className="font-extrabold text-sm">Amex One View</p>
              <p className="text-[11px] text-white/50">Cross-channel identity resolution &amp; journey stitching</p>
            </div>
          </div>
          <div className="md:ml-auto flex flex-wrap items-center gap-4 text-[11px] text-white/60">
            {(["web", "app", "voice", "in_person"] as const).map((c) => (
              <span key={c} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: CHANNEL_META[c].color }} />
                {CHANNEL_META[c].label}
              </span>
            ))}
            <span className="text-white/30">|</span>
            <span>© 2026 · A demonstration experience on the American Express theme</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

// animated journey stepper — dots, self-drawing connectors, staggered labels
function JourneyBeats({ beats }: { beats: { label: string; ch: keyof typeof DOT }[] }) {
  return (
    <div className="mt-5">
      <div className="flex items-center">
        {beats.map((b, i) => (
          <div key={i} className={`flex items-center ${i < beats.length - 1 ? "flex-1" : ""}`}>
            <span
              className="block w-3 h-3 rounded-full border-2 border-white shadow fade-up shrink-0"
              style={{ background: DOT[b.ch], animationDelay: `${i * 170 + 250}ms` }}
            />
            {i < beats.length - 1 && (
              <div className="h-[2px] flex-1 mx-1 rounded bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded grow-x"
                  style={{ background: DOT[beats[i + 1].ch], animationDelay: `${i * 170 + 400}ms` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex mt-2">
        {beats.map((b, i) => (
          <p
            key={i}
            className={`text-[9.5px] leading-tight text-gray-500 fade-up pr-1 ${i < beats.length - 1 ? "flex-1" : ""}`}
            style={{ animationDelay: `${i * 170 + 350}ms` }}
          >
            {b.label}
          </p>
        ))}
      </div>
    </div>
  );
}
