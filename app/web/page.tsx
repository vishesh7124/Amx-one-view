"use client";

import { useEffect, useRef, useState } from "react";
import AmexLogo from "@/components/AmexLogo";
import CardArt from "@/components/CardArt";
import DemoChrome from "@/components/DemoChrome";
import CallWidget from "@/components/CallWidget";
import { appendEvent, useActivePersona, useEvents, uid } from "@/lib/store";
import { PERSONAS, DNI_POOL } from "@/lib/personas";
import type { PersonaId, Stage } from "@/lib/types";

const CARDS = [
  {
    id: "platinum_travel",
    name: "Platinum Travel Credit Card",
    variant: "platinum" as const,
    fee: "₹4,999 + taxes / yr",
    perks: ["4X MR points on travel", "8 complimentary lounge visits", "Taj voucher ₹10,000 on ₹4L spend"],
  },
  {
    id: "gold_charge",
    name: "Gold Charge Card",
    variant: "gold" as const,
    fee: "₹1,000 + taxes / yr",
    perks: ["5X rewards on dining", "Monthly milestone bonuses", "No pre-set spending limit"],
  },
  {
    id: "mrcc",
    name: "Membership Rewards Credit Card",
    variant: "blue" as const,
    fee: "₹1,000 + taxes / yr",
    perks: ["1,000 bonus MR points monthly", "Fuel surcharge waiver", "Easy EMI options"],
  },
];

const CARD_IDS: Record<PersonaId, string> = {
  aarav: "card-aarav-1005",
  meera: "card-meera-2007",
  rohan: "card-rohan-3009",
};

type View = "cards" | "travel" | "rewards" | "business" | "help";

export default function WebMockup() {
  const [persona] = useActivePersona();
  const events = useEvents();
  const meta = PERSONAS[persona];
  const sessionId = useRef(uid("sess"));
  const viewed = useRef(false);

  // cards/apply state
  const [detail, setDetail] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [applyCard, setApplyCard] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [abandoned, setAbandoned] = useState(false);
  const [appId, setAppId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", pan: "", aadhaar: "" });
  const [resumeToken, setResumeToken] = useState<string | null>(null);

  // navigation + login + insurance state
  const [view, setView] = useState<View>("cards");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingIns, setPendingIns] = useState(false);
  const [insOpen, setInsOpen] = useState(false);
  const [insBusy, setInsBusy] = useState(false);
  const [insErr, setInsErr] = useState(false);
  const [insForm, setInsForm] = useState({ dest: "Bali", start: "2026-08-10", end: "2026-08-18", travelers: 2 });

  const submittedAppId = events.find((e) => e.type === "apply_submit" && e.persona === persona)?.ids.applicationId;

  const loginIds = loggedIn
    ? persona === "aarav"
      ? { email: meta.email, phone: meta.phone, ...(submittedAppId ? { applicationId: submittedAppId } : {}) }
      : { email: meta.email, phone: meta.phone, customerId: `cust-${persona}`, cardId: CARD_IDS[persona] }
    : {};

  const emit = (
    type: string,
    stage: Stage,
    label: string,
    extra?: Partial<Parameters<typeof appendEvent>[0]>
  ) =>
    appendEvent({
      persona,
      channel: "web",
      type,
      stage,
      label,
      ids: {
        anonId: meta.anonId,
        deviceId: meta.deviceWeb,
        sessionId: sessionId.current,
        ...loginIds,
        ...(form.email ? { email: form.email } : {}),
        ...(form.phone ? { phone: form.phone } : {}),
      },
      ...extra,
    });

  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    emit("page_view", "discover", "Landed on americanexpress.com — browsing anonymously", {
      detail: "No login. Legacy systems: invisible. One View: Provisional Identity created.",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumeLinkSent = events.some((e) => e.type === "action_resume_link" && e.persona === persona);
  const alreadySubmitted = events.some((e) => e.type === "apply_submit" && e.persona === persona);
  const alreadyResumed = events.some((e) => e.type === "resume_open" && e.persona === persona);
  const lastApplyLabel = [...events].reverse().find((e) => e.persona === persona && e.type === "apply_start")?.label ?? "";
  const resumeCard = CARDS.find((c) => lastApplyLabel.includes(c.name)) ?? CARDS[0];

  // ─── cards flow ───
  const openDetail = (id: string) => {
    setDetail(id);
    const c = CARDS.find((x) => x.id === id)!;
    emit("card_view", "consider", `Viewed ${c.name} — benefits, fees, rewards`);
  };

  const lastCompare = useRef<string>("");
  const toggleCompare = (id: string) => {
    setCompare((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-2);
      if (next.length === 2) {
        const key = [...next].sort().join("|");
        setCompareOpen(true);
        if (key !== lastCompare.current) {
          lastCompare.current = key;
          emit("compare_view", "consider", `Comparing ${next.map((n) => CARDS.find((c) => c.id === n)!.name).join(" vs ")}`);
        }
      }
      return next;
    });
  };

  const startApply = (id: string) => {
    setApplyCard(id);
    setDetail(null);
    setCompareOpen(false);
    setForm({ name: meta.name, email: meta.email, phone: meta.phone, pan: "", aadhaar: "" });
    setStep(1);
    emit("apply_start", "apply", `Started application — ${CARDS.find((c) => c.id === id)!.name}`);
  };

  const abandon = () => {
    emit("apply_abandon", "apply", "💥 Abandoned application at KYC & fee step", {
      detail: "Annual fee ₹4,999 visible + KYC friction. High-intent prospect, lost silently.",
    });
    setStep(0);
    setAbandoned(true);
  };

  const submit = () => {
    const id = `AX-2026-${Math.floor(10000 + Math.random() * 89999)}`;
    setAppId(id);
    setStep(4);
    emit("apply_submit", "apply", `Submitted application → Application ID ${id}`, {
      ids: {
        anonId: meta.anonId,
        deviceId: meta.deviceWeb,
        sessionId: sessionId.current,
        email: form.email,
        phone: form.phone,
        applicationId: id,
        ...(resumeToken ? { resumeToken } : {}),
      },
    });
  };

  const openResume = () => {
    const tok = uid("tok");
    setResumeToken(tok);
    setApplyCard(resumeCard.id);
    setForm({ name: meta.name, email: meta.email, phone: meta.phone, pan: "AXKPS••••F", aadhaar: "•••• •••• 4321" });
    setStep(3);
    emit("resume_open", "apply", `Opened save-and-resume link from email — progress restored (${resumeCard.name})`, {
      detail: "Tokenized link stitched this session back to the abandoned journey (conf 0.90).",
      ids: {
        anonId: meta.anonId,
        deviceId: meta.deviceWeb,
        sessionId: sessionId.current,
        email: meta.email,
        phone: meta.phone,
        resumeToken: tok,
      },
    });
  };

  // ─── login ───
  const doLogin = (p: PersonaId) => {
    setLoggedIn(true);
    setLoginOpen(false);
    emit("web_login", "service", `Logged in to americanexpress.com — identity anchored (conf 1.00)`, {
      ids:
        p === "aarav"
          ? { anonId: meta.anonId, deviceId: meta.deviceWeb, sessionId: sessionId.current, email: meta.email, phone: meta.phone, ...(submittedAppId ? { applicationId: submittedAppId } : {}) }
          : { anonId: meta.anonId, deviceId: meta.deviceWeb, sessionId: sessionId.current, email: meta.email, phone: meta.phone, customerId: `cust-${p}`, cardId: CARD_IDS[p] },
    });
    if (pendingIns) {
      setPendingIns(false);
      openInsurance();
    }
  };

  // ─── travel insurance flow ───
  const goView = (v: View) => {
    setView(v);
    if (v === "travel") emit("travel_view", "consider", "Viewed Amex Travel section");
  };

  const openInsurance = () => {
    if (!loggedIn) {
      setPendingIns(true);
      setLoginOpen(true);
      return;
    }
    setInsOpen(true);
    emit("booking_start", "transact", "Started Travel Insurance quote — destination, dates, travelers", {
      detail: "Logged-in booking on the website.",
    });
  };

  const submitInsurance = () => {
    setInsBusy(true);
    setTimeout(() => {
      setInsBusy(false);
      setInsOpen(false);
      setInsErr(true);
      emit("booking_error", "transact", "💥 Travel Insurance booking failed on web — ERR-5003", {
        reasonCode: "booking_error",
        sentiment: -0.4,
        detail: "Web quote API timed out after payment details. Generic error shown. 🎬 Meera switches to the app.",
      });
    }, 1300);
  };

  const card = CARDS.find((c) => c.id === (detail ?? applyCard));

  return (
    <main className="min-h-screen bg-white">
      <DemoChrome current="web" />
      <CallWidget />

      {/* browser chrome */}
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-3">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-full px-4 py-1 text-xs text-gray-500 border border-gray-200">
          🔒 americanexpress.com/in-en/{view === "cards" ? "credit-cards" : view}
        </div>
      </div>

      {/* AmEx nav — all functional */}
      <nav className="bg-amex-deep text-white px-6 py-3 flex items-center gap-6 sticky top-0 z-40">
        <AmexLogo size="sm" />
        {(
          [
            ["cards", "Cards"],
            ["travel", "Travel"],
            ["rewards", "Rewards"],
            ["business", "Business"],
            ["help", "Help"],
          ] as [View, string][]
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => goView(v)}
            className={`text-sm transition ${view === v ? "font-bold border-b-2 border-amex-sky pb-0.5" : "text-white/70 hover:text-white"}`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 text-xs">
          <button
            onClick={() => window.open("/call", "_blank")}
            className="bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/25 transition"
            title="Click-to-call — opens the call center mockup"
          >
            📞 Questions? Call <b>{DNI_POOL[persona]}</b>
          </button>
          {loggedIn ? (
            <span className="px-3 py-1.5 rounded-full bg-amex-sky text-amex-dark font-semibold flex items-center gap-2">
              👤 {meta.name.split(" ")[0]}
              <button onClick={() => setLoggedIn(false)} className="text-amex-dark/60 hover:text-amex-dark" title="Log out">
                ⎋
              </button>
            </span>
          ) : (
            <button onClick={() => setLoginOpen(true)} className="px-3 py-1.5 rounded-full border border-white/40 hover:bg-white/10 font-semibold">
              Log In
            </button>
          )}
        </div>
      </nav>

      {/* ─── CARDS VIEW ─── */}
      {view === "cards" && (
        <>
          <section className="card-sheen text-white px-6 py-12">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-3xl font-extrabold">Find the Card that&apos;s right for you</h1>
              <p className="mt-2 text-white/80 text-sm max-w-xl">
                Membership Rewards, lounge access, travel credits — compare our most loved Cards.
              </p>
              {!loggedIn && (
                <p className="mt-4 inline-block bg-white/15 text-xs px-3 py-1.5 rounded-full">
                  👤 You are browsing anonymously — <b>legacy AmEx sees nothing.</b> Watch Amex One View →
                </p>
              )}
            </div>
          </section>

          <section className="max-w-5xl mx-auto px-6 py-10">
            <h2 className="font-bold text-lg text-amex-dark">Our Cards</h2>
            <div className="grid md:grid-cols-3 gap-6 mt-4">
              {CARDS.map((c) => (
                <div key={c.id} className="rounded-2xl border border-gray-200 p-4 hover:shadow-lg transition bg-white">
                  <div className="flex justify-center">
                    <CardArt variant={c.variant} name={meta.name.toUpperCase()} compact />
                  </div>
                  <h3 className="font-bold mt-3 text-sm">{c.name}</h3>
                  <p className="text-xs text-gray-500">{c.fee}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => openDetail(c.id)} className="flex-1 text-xs px-3 py-2 rounded-full border border-amex text-amex font-semibold hover:bg-amex-sky">
                      View details
                    </button>
                    <button onClick={() => toggleCompare(c.id)} className={`text-xs px-3 py-2 rounded-full border font-semibold ${compare.includes(c.id) ? "bg-amex text-white border-amex" : "border-gray-300 text-gray-600"}`}>
                      ⇄
                    </button>
                    <button onClick={() => startApply(c.id)} className="flex-1 text-xs px-3 py-2 rounded-full bg-amex text-white font-semibold hover:bg-amex-dark">
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {abandoned && !alreadySubmitted && (
              <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 fade-up">
                💥 <b>Journey broken (legacy view):</b> {meta.name} left at the KYC step. In today&apos;s AmEx this trail goes cold —
                no identity, no context, no follow-up. <b>Check Amex One View: the Provisional Identity is still alive.</b>
                <div className="mt-3">
                  <button
                    onClick={() => window.open("/call", "_blank")}
                    className="px-4 py-2 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700"
                  >
                    📞 {meta.name.split(" ")[0]} still has fee questions — he calls the number on the site ({DNI_POOL[persona]}) →
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* ─── TRAVEL VIEW ─── */}
      {view === "travel" && (
        <>
          <section className="text-white px-6 py-12" style={{ background: "linear-gradient(135deg,#00175a,#016fd0)" }}>
            <div className="max-w-5xl mx-auto">
              <h1 className="text-3xl font-extrabold">Amex Travel</h1>
              <p className="mt-2 text-white/80 text-sm max-w-xl">Flights, hotels and protection for every trip — booked in minutes.</p>
            </div>
          </section>
          <section className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-gray-200 p-5 bg-white">
              <div className="text-3xl">✈️</div>
              <h3 className="font-bold mt-2 text-sm">Flights</h3>
              <p className="text-xs text-gray-500 mt-1">Domestic & international, with MR points on every booking.</p>
              <button className="mt-3 text-xs px-4 py-2 rounded-full border border-gray-300 text-gray-500">Search flights</button>
            </div>
            <div className="rounded-2xl border border-gray-200 p-5 bg-white">
              <div className="text-3xl">🏨</div>
              <h3 className="font-bold mt-2 text-sm">Hotels</h3>
              <p className="text-xs text-gray-500 mt-1">Fine Hotels & Resorts with complimentary benefits.</p>
              <button className="mt-3 text-xs px-4 py-2 rounded-full border border-gray-300 text-gray-500">Browse hotels</button>
            </div>
            <div className="rounded-2xl border-2 border-amex p-5 bg-amex-sky/40 relative">
              <span className="absolute -top-2.5 right-4 bg-amex text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>
              <div className="text-3xl">🛡️</div>
              <h3 className="font-bold mt-2 text-sm">Travel Insurance</h3>
              <p className="text-xs text-gray-500 mt-1">Medical, baggage & trip-cancellation cover from ₹1,450.</p>
              <button onClick={openInsurance} className="mt-3 text-xs px-4 py-2 rounded-full bg-amex text-white font-semibold hover:bg-amex-dark">
                Get a quote →
              </button>
            </div>
          </section>
        </>
      )}

      {/* ─── REWARDS VIEW ─── */}
      {view === "rewards" && (
        <section className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-extrabold text-amex-dark">Membership Rewards</h1>
          <div className="grid md:grid-cols-2 gap-6 mt-5">
            <div className="card-sheen rounded-2xl p-6 text-white">
              <p className="text-xs text-white/70">{loggedIn ? `${meta.name}'s balance` : "Your balance"}</p>
              <p className="text-4xl font-extrabold mt-1">12,430</p>
              <p className="text-xs text-white/70 mt-1">MR points ≈ ₹5,586 value</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="font-bold text-sm">Transfer partners</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                {["Air India Flying Returns", "Marriott Bonvoy", "Etihad Guest", "Singapore KrisFlyer", "Virgin Atlantic", "Hilton Honors"].map((x) => (
                  <div key={x} className="bg-mist rounded-lg px-3 py-2">{x}</div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── BUSINESS VIEW ─── */}
      {view === "business" && (
        <section className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-extrabold text-amex-dark">Amex for Business</h1>
          <p className="text-sm text-gray-500 mt-2 max-w-xl">Corporate cards, expense management and working-capital solutions for companies of every size.</p>
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            {[
              ["💼", "Business Platinum", "Lounge access, hotel status, 5X on flights"],
              ["🏢", "Corporate Cards", "Centralized billing & controls for teams"],
              ["📊", "Expense @ Work", "Receipts, reconciliation & ERP sync"],
            ].map(([icon, name, desc]) => (
              <div key={name} className="rounded-2xl border border-gray-200 p-5 bg-white">
                <div className="text-3xl">{icon}</div>
                <h3 className="font-bold mt-2 text-sm">{name}</h3>
                <p className="text-xs text-gray-500 mt-1">{desc}</p>
              </div>
            ))}
          </div>
          <button onClick={() => goView("cards")} className="mt-6 text-xs px-4 py-2 rounded-full bg-amex text-white font-semibold">
            Compare business cards →
          </button>
        </section>
      )}

      {/* ─── HELP VIEW ─── */}
      {view === "help" && (
        <section className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-extrabold text-amex-dark">Help & Support</h1>
          <div className="grid md:grid-cols-2 gap-6 mt-5">
            <div className="space-y-2">
              {[
                ["How do I pay my Card bill?", "Via the app, website, UPI or NEFT — instantly reflected."],
                ["How do I dispute a charge?", "Open the transaction in the app → 'Dispute this charge'."],
                ["Where is my application status?", "Track it in the Amex app with your application ID."],
              ].map(([q, a]) => (
                <details key={q} className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm">
                  <summary className="font-semibold cursor-pointer">{q}</summary>
                  <p className="text-xs text-gray-500 mt-2">{a}</p>
                </details>
              ))}
            </div>
            <div className="bg-amex-deep text-white rounded-2xl p-6">
              <p className="font-bold">24×7 Relationship Care</p>
              <p className="text-2xl font-mono font-bold mt-2">{DNI_POOL[persona]}</p>
              <p className="text-xs text-white/60 mt-2">Or use the floating 📞 button on this page — the agent will already know your journey.</p>
            </div>
          </div>
        </section>
      )}

      {/* resume email toast */}
      {resumeLinkSent && !alreadyResumed && !alreadySubmitted && (
        <button
          onClick={openResume}
          className="fixed bottom-24 right-4 z-50 w-80 text-left bg-white rounded-xl shadow-2xl border border-amex/30 p-4 pop-in hover:border-amex"
        >
          <p className="text-[11px] text-gray-400">📧 Gmail — just now</p>
          <p className="text-sm font-bold text-amex-dark mt-1">American Express: complete your application</p>
          <p className="text-xs text-gray-500 mt-1">
            Hi {meta.name.split(" ")[0]}, your {resumeCard.name} application is saved. Pick up exactly where you left off →
          </p>
          <span className="inline-block mt-2 text-xs bg-amex text-white px-3 py-1.5 rounded-full font-semibold">
            Resume application
          </span>
        </button>
      )}

      {/* login modal */}
      {loginOpen && (
        <Modal onClose={() => { setLoginOpen(false); setPendingIns(false); }}>
          <h3 className="font-bold text-lg">Log in to American Express</h3>
          {pendingIns && <p className="text-xs text-amex mt-1 font-semibold">Log in to continue to Travel Insurance →</p>}
          <div className="mt-4 space-y-2">
            {(Object.keys(PERSONAS) as PersonaId[]).map((p) => {
              const m = PERSONAS[p];
              const enabled = p !== "aarav" || !!submittedAppId;
              const active = p === persona;
              return (
                <button
                  key={p}
                  disabled={!enabled}
                  onClick={() => doLogin(p)}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition ${enabled ? "hover:border-amex hover:bg-amex-sky/40" : "opacity-50 cursor-not-allowed"} ${active ? "border-amex" : "border-gray-200"}`}
                >
                  <p className="text-sm font-bold">{m.name}</p>
                  <p className="text-[11px] text-gray-400">
                    {p === "aarav" ? (enabled ? "✨ New Card Member" : "🔒 Available after application approval") : `${m.email} · Card ••${CARD_IDS[p].slice(-4)}`}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 mt-3">🎬 Log in as the active persona (set in the 🎬 bar). Web login = deterministic identity anchor.</p>
        </Modal>
      )}

      {/* travel insurance form modal */}
      {insOpen && (
        <Modal onClose={() => setInsOpen(false)}>
          <h3 className="font-bold text-lg">🛡️ Travel Insurance — instant quote</h3>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-gray-500">Destination</span>
              <select value={insForm.dest} onChange={(e) => setInsForm({ ...insForm, dest: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm">
                {["Bali", "Dubai", "London", "Singapore", "Bangkok"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">From</span>
                <input type="date" value={insForm.start} onChange={(e) => setInsForm({ ...insForm, start: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">To</span>
                <input type="date" value={insForm.end} onChange={(e) => setInsForm({ ...insForm, end: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm" />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-gray-500">Travelers</span>
              <input type="number" min={1} max={6} value={insForm.travelers} onChange={(e) => setInsForm({ ...insForm, travelers: +e.target.value })} className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm" />
            </label>
            <div className="bg-mist rounded-xl p-3 text-sm flex justify-between">
              <span>Premium ({insForm.travelers} travelers, 8 days)</span>
              <b>₹{(1450 * insForm.travelers).toLocaleString("en-IN")}</b>
            </div>
            <button onClick={submitInsurance} disabled={insBusy} className="w-full py-2.5 rounded-full bg-amex text-white text-sm font-semibold hover:bg-amex-dark disabled:opacity-60">
              {insBusy ? "Contacting quote service…" : "Get quote & buy →"}
            </button>
            <p className="text-[11px] text-gray-400 text-center">🎬 Demo: this will fail with an unknown error — the break point.</p>
          </div>
        </Modal>
      )}

      {/* insurance error modal */}
      {insErr && (
        <Modal onClose={() => setInsErr(false)}>
          <div className="text-center py-4">
            <div className="text-5xl">⚠️</div>
            <h3 className="font-bold text-lg mt-2 text-red-600">Something went wrong</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
              We couldn&apos;t complete your booking. Our team has been notified. Please try again later. <span className="font-mono text-xs">(Ref: ERR-5003)</span>
            </p>
            <div className="mt-4 bg-amex-sky rounded-xl p-3 text-xs text-amex-dark">
              🎬 <b>Meera doesn&apos;t give up</b> — she opens the Amex app and books the same policy there. Watch Amex One View connect the dots.
            </div>
            <button onClick={() => setInsErr(false)} className="mt-4 px-5 py-2 rounded-full border border-gray-300 text-sm">Close</button>
          </div>
        </Modal>
      )}

      {/* detail modal */}
      {detail && card && (
        <Modal onClose={() => setDetail(null)}>
          <div className="flex gap-5 items-start">
            <CardArt variant={card.variant} name={meta.name.toUpperCase()} />
            <div className="flex-1">
              <h3 className="font-bold text-lg">{card.name}</h3>
              <p className="text-sm text-gray-500">{card.fee}</p>
              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                {card.perks.map((p) => (
                  <li key={p}>✦ {p}</li>
                ))}
              </ul>
              <button onClick={() => startApply(card.id)} className="mt-4 px-5 py-2.5 rounded-full bg-amex text-white text-sm font-semibold hover:bg-amex-dark">
                Apply Now
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* compare modal */}
      {compareOpen && compare.length === 2 && (
        <Modal onClose={() => setCompareOpen(false)}>
          <h3 className="font-bold text-lg mb-3">Compare Cards</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs">
                <th className="pb-2"></th>
                {compare.map((id) => (
                  <th key={id} className="pb-2">{CARDS.find((c) => c.id === id)!.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-gray-600">
              <tr className="border-t border-gray-100">
                <td className="py-2 text-xs text-gray-400">Annual fee</td>
                {compare.map((id) => (
                  <td key={id} className="py-2">{CARDS.find((c) => c.id === id)!.fee}</td>
                ))}
              </tr>
              <tr className="border-t border-gray-100">
                <td className="py-2 text-xs text-gray-400">Top perks</td>
                {compare.map((id) => (
                  <td key={id} className="py-2 text-xs">{CARDS.find((c) => c.id === id)!.perks[0]}</td>
                ))}
              </tr>
            </tbody>
          </table>
          <button onClick={() => startApply(compare[0])} className="mt-4 px-5 py-2.5 rounded-full bg-amex text-white text-sm font-semibold hover:bg-amex-dark">
            Apply for {CARDS.find((c) => c.id === compare[0])!.name}
          </button>
        </Modal>
      )}

      {/* apply flow modal */}
      {step > 0 && applyCard && (
        <Modal onClose={() => (step === 2 ? abandon() : setStep(0))} wide>
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full ${step >= s ? "bg-amex" : "bg-gray-200"}`} />
                <p className={`text-[10px] mt-1 ${step >= s ? "text-amex font-semibold" : "text-gray-400"}`}>
                  {s === 1 ? "Personal details" : s === 2 ? "KYC & fees" : "Review & submit"}
                </p>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-3 fade-up">
              <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Field label="Mobile" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <button onClick={() => setStep(2)} className="w-full py-2.5 rounded-full bg-amex text-white text-sm font-semibold hover:bg-amex-dark">
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 fade-up">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                💳 Annual fee: <b>₹4,999 + taxes</b> — billed on card issuance
              </div>
              <Field label="PAN" placeholder="ABCDE1234F" value={form.pan} onChange={(v) => setForm({ ...form, pan: v })} />
              <Field label="Aadhaar number" placeholder="XXXX XXXX XXXX" value={form.aadhaar} onChange={(v) => setForm({ ...form, aadhaar: v })} />
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
                📎 Upload address proof (PDF/JPG)… <span className="text-gray-400">(8 more fields below)</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-full bg-amex text-white text-sm font-semibold hover:bg-amex-dark">
                  Continue →
                </button>
                <button onClick={abandon} className="px-4 py-2.5 rounded-full border border-red-300 text-red-500 text-sm font-semibold hover:bg-red-50" title="Abandon the application here">
                  ✕ Leave
                </button>
              </div>
              <p className="text-[11px] text-gray-400 text-center">🎬 Demo: press &quot;✕ Leave&quot; to abandon the application — the break point.</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 fade-up">
              {resumeToken && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700">
                  ✅ <b>Progress restored</b> from your saved application — no re-entry, no repeat story.
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                <p><span className="text-gray-400">Card:</span> {CARDS.find((c) => c.id === applyCard)!.name}</p>
                <p><span className="text-gray-400">Name:</span> {form.name}</p>
                <p><span className="text-gray-400">Email:</span> {form.email}</p>
                <p><span className="text-gray-400">Mobile:</span> {form.phone}</p>
                <p><span className="text-gray-400">PAN:</span> {form.pan || "AXKPS••••F"}</p>
              </div>
              <label className="flex gap-2 text-xs text-gray-500 items-start">
                <input type="checkbox" defaultChecked className="mt-0.5" />
                I agree to the Card Member Agreement and consent to verification calls from American Express.
              </label>
              <button onClick={submit} className="w-full py-2.5 rounded-full bg-amex text-white text-sm font-semibold hover:bg-amex-dark">
                Submit application
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-6 fade-up">
              <div className="text-5xl">✅</div>
              <h3 className="font-bold text-lg mt-2">Application received!</h3>
              <p className="text-sm text-gray-500 mt-1">
                Application ID: <b className="text-amex-dark">{appId}</b>
              </p>
              <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto">
                Our executives will call you back at {form.phone} for verification. You can track status in the Amex app.
              </p>
              <p className="text-[11px] text-amex mt-3">🎬 Next: open the 🟢 App mockup — install, log in, activate the card.</p>
              <button onClick={() => setStep(0)} className="mt-4 px-5 py-2 rounded-full border border-gray-300 text-sm">
                Back to site
              </button>
            </div>
          )}
        </Modal>
      )}
    </main>
  );
}

function Modal({
  children,
  onClose,
  wide,
}: {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-2xl p-6 ${wide ? "w-[560px]" : "w-[640px]"} max-w-[95vw] max-h-[90vh] overflow-y-auto scrollbar-thin pop-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amex focus:ring-2 focus:ring-amex/20"
      />
    </label>
  );
}
