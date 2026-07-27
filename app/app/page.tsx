"use client";

import { useState } from "react";
import PhoneFrame from "@/components/PhoneFrame";
import CardArt from "@/components/CardArt";
import DemoChrome from "@/components/DemoChrome";
import CallWidget from "@/components/CallWidget";
import AmexLogo from "@/components/AmexLogo";
import { appendEvent, useActivePersona, useEvents, uid } from "@/lib/store";
import { PERSONAS } from "@/lib/personas";
import type { PersonaId, Stage } from "@/lib/types";

type Tab = "home" | "offers" | "statements" | "account";

const CARD_IDS: Record<PersonaId, string> = {
  aarav: "card-aarav-1005",
  meera: "card-meera-2007",
  rohan: "card-rohan-3009",
};

export default function AppMockup() {
  const [persona] = useActivePersona();
  const events = useEvents();
  const meta = PERSONAS[persona];
  const [tab, setTab] = useState<Tab>("home");
  const [loggedIn, setLoggedIn] = useState(false);
  const [offerSaved, setOfferSaved] = useState(false);
  const [activating, setActivating] = useState(false);
  const [insOpen, setInsOpen] = useState(false);
  const [insDone, setInsDone] = useState(false);
  const [insBusy, setInsBusy] = useState(false);
  const [insForm, setInsForm] = useState({ dest: "Bali", start: "2026-08-10", end: "2026-08-18", travelers: 2 });

  const submitted = events.some((e) => e.type === "apply_submit" && e.persona === persona);
  const activated = events.some((e) => e.type === "card_activation" && e.persona === persona);
  const myTxns = events.filter(
    (e) => e.persona === persona && ["pos_purchase", "pos_decline"].includes(e.type)
  );
  const statementSeen = events.some((e) => e.type === "statement_view" && e.persona === persona);

  const emit = (
    type: string,
    channel: "app" | "in_person",
    stage: Stage,
    label: string,
    extra?: Partial<Parameters<typeof appendEvent>[0]>
  ) =>
    appendEvent({
      persona,
      channel,
      type,
      stage,
      label,
      ids: {
        deviceId: meta.deviceMobile,
        sessionId: uid("sess"),
        email: meta.email,
        phone: meta.phone,
        ...(activated || type === "card_activation" ? { cardId: CARD_IDS[persona] } : {}),
        ...(persona !== "aarav" ? { cardId: CARD_IDS[persona], customerId: `cust-${persona}` } : {}),
      },
      ...extra,
    });

  const login = () => {
    emit("app_login", "app", "onboard", `Logged in to Amex app (biometric)`, {
      detail:
        persona === "aarav"
          ? "New Card Member — device linked to the application identity."
          : "Card Member login — deterministic identity anchor.",
    });
    setLoggedIn(true);
  };

  const activate = () => {
    setActivating(true);
    setTimeout(() => {
      emit("card_activation", "app", "onboard", "⭐ Activated card in app — THE GOLDEN STITCH", {
        detail: "device ↔ card account ↔ application ↔ all anonymous history. Confidence 1.00.",
      });
      setActivating(false);
    }, 900);
  };

  const buyIns = () => {
    setInsBusy(true);
    setTimeout(() => {
      setInsBusy(false);
      setInsDone(true);
      emit("booking_success", "app", "transact", "✅ Travel Insurance booked in app — 2 minutes, no errors", {
        detail:
          persona === "meera"
            ? "Same policy that failed on the website — channel failover complete."
            : "Instant in-app booking.",
      });
    }, 1000);
  };

  // ─── login screen ───
  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-amex-deep py-8 lg:pl-[340px]">
        <DemoChrome current="app" />
        <CallWidget />
        <PhoneFrame title="login">
          <div className="card-sheen px-6 pt-10 pb-16 text-white">
            <AmexLogo size="md" />
            <h1 className="text-xl font-extrabold mt-6">Welcome to Amex</h1>
            <p className="text-xs text-white/70 mt-1">Log in to manage your Card</p>
          </div>
          <div className="px-6 -mt-8 space-y-3 pb-8">
            {(Object.keys(PERSONAS) as PersonaId[]).map((p) => {
              const m = PERSONAS[p];
              const isProspect = p === "aarav";
              const enabled = !isProspect || submitted;
              const active = p === persona;
              return (
                <button
                  key={p}
                  disabled={!enabled}
                  onClick={login}
                  className={`w-full text-left bg-white rounded-2xl p-4 shadow border transition ${
                    active ? "border-amex" : "border-gray-100"
                  } ${enabled ? "hover:shadow-md" : "opacity-50 cursor-not-allowed"}`}
                >
                  <p className="font-bold text-sm">{m.name}</p>
                  <p className="text-[11px] text-gray-400">
                    {isProspect
                      ? enabled
                        ? "✨ New Card Member — application approved"
                        : "🔒 Available after application approval"
                      : m.tag}
                  </p>
                  {active && enabled && (
                    <span className="inline-block mt-2 text-[11px] bg-amex text-white px-3 py-1 rounded-full font-semibold">
                      Log in with Face ID →
                    </span>
                  )}
                </button>
              );
            })}
            <p className="text-[10px] text-gray-400 text-center pt-2">
              🎬 Demo: log in as <b>{meta.name}</b> (set persona in the 🎬 bar)
            </p>
          </div>
        </PhoneFrame>
      </main>
    );
  }

  // ─── main app ───
  return (
    <main className="min-h-screen bg-amex-deep py-8 lg:pl-[340px]">
      <DemoChrome current="app" />
      <CallWidget />
      <PhoneFrame
        title={meta.name}
        footer={
          <div className="bg-white border-t border-gray-200 grid grid-cols-4 text-[10px] font-semibold text-gray-500">
            {(
              [
                ["home", "🏠", "Home"],
                ["offers", "🎁", "Offers"],
                ["statements", "📄", "Statements"],
                ["account", "👤", "Account"],
              ] as [Tab, string, string][]
            ).map(([t, icon, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-2.5 flex flex-col items-center gap-0.5 ${tab === t ? "text-amex" : ""}`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        }
      >
        {/* header */}
        <div className="card-sheen px-5 pt-5 pb-14 text-white">
          <div className="flex items-center justify-between">
            <p className="text-sm">Hello, <b>{meta.name.split(" ")[0]}</b></p>
            <AmexLogo size="sm" />
          </div>
          <p className="text-[11px] text-white/70 mt-0.5">{meta.tag}</p>
        </div>

        <div className="px-5 -mt-10 pb-6">
          <div className="flex justify-center">
            <CardArt
              variant={persona === "rohan" ? "platinum" : persona === "meera" ? "gold" : "platinum"}
              name={meta.name.toUpperCase()}
              last4={CARD_IDS[persona].slice(-4)}
            />
          </div>

          {/* activation banner for Aarav */}
          {persona === "aarav" && !activated && (
            <div className="mt-4 bg-white rounded-2xl p-4 shadow border border-amex/30">
              <p className="font-bold text-sm">🎉 Your Platinum Travel Card has arrived</p>
              <p className="text-xs text-gray-500 mt-1">Activate it to start earning Membership Rewards.</p>
              <button
                onClick={activate}
                disabled={activating}
                className="mt-3 w-full py-2.5 rounded-full bg-amex text-white text-sm font-semibold hover:bg-amex-dark disabled:opacity-60"
              >
                {activating ? "Activating…" : "Activate Card"}
              </button>
            </div>
          )}
          {persona === "aarav" && activated && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-700 pop-in">
              ⭐ <b>Card active.</b> This moment stitched device → account → application → anonymous web history (conf 1.00). See One View!
            </div>
          )}

          {tab === "home" && !insOpen && (
            <div className="mt-4 space-y-4 fade-up">
              <div className="bg-white rounded-2xl p-4 shadow border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-[11px] text-gray-400">Outstanding balance</p>
                  <p className="text-xl font-extrabold text-amex-dark">
                    ₹{persona === "rohan" ? "18,450" : persona === "meera" ? "2,400" : "0"}
                  </p>
                </div>
                <button className="text-xs bg-amex text-white px-4 py-2 rounded-full font-semibold">Pay now</button>
              </div>

              {/* travel insurance quick action — Meera's app-side booking */}
              <button
                onClick={() => setInsOpen(true)}
                className="w-full bg-white rounded-2xl p-4 shadow border border-gray-100 flex items-center gap-3 hover:shadow-md text-left"
              >
                <span className="text-2xl">🛡️</span>
                <span className="flex-1">
                  <p className="text-sm font-bold">Travel Insurance</p>
                  <p className="text-[11px] text-gray-400">Instant cover from ₹1,450 — book in 2 min</p>
                </span>
                <span className="text-amex font-bold">→</span>
              </button>

              <div className="bg-white rounded-2xl p-4 shadow border border-gray-100">
                <p className="font-bold text-sm mb-2">Recent transactions</p>
                {myTxns.length === 0 && <p className="text-xs text-gray-400">No transactions yet.</p>}
                {myTxns.map((t) => (
                  <div key={t.id} className="flex justify-between items-center py-2 border-t border-gray-50 first:border-0">
                    <div>
                      <p className="text-xs font-semibold">{t.detail?.split("·")[0] ?? t.label}</p>
                      <p className="text-[10px] text-gray-400">🟣 in-person POS · closed loop</p>
                    </div>
                    <span className={`text-xs font-bold ${t.type === "pos_decline" ? "text-red-500" : "text-gray-700"}`}>
                      {t.type === "pos_decline" ? "DECLINED" : `₹${t.amount?.toLocaleString("en-IN")}`}
                    </span>
                  </div>
                ))}
              </div>

              {/* presenter simulation controls */}
              <div className="bg-amex-dark rounded-2xl p-4 text-white">
                <p className="text-[11px] font-bold text-white/70">🎬 SIMULATE (in-person channel)</p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {persona === "meera" && (
                    <p className="text-[11px] text-white/50">Meera&apos;s story: book Travel Insurance from the home screen above ↑</p>
                  )}
                  {persona === "aarav" && activated && (
                    <SimBtn onClick={() => emit("pos_purchase", "in_person", "transact", "First in-store purchase — Starbucks · ₹1,850", { amount: 1850, detail: "Starbucks, Gurugram · contactless · approved" })}>
                      ☕ First in-store purchase — ₹1,850
                    </SimBtn>
                  )}
                  {persona === "rohan" && (
                    <SimBtn onClick={() => emit("spend_drop", "app", "retain", "📉 Monthly spend dropped 52%", { detail: "₹1.2L → ₹58k. Engagement collapsing after fee shock." })}>
                      📉 A month passes — spend drops 52%
                    </SimBtn>
                  )}
                  {persona === "rohan" && !statementSeen && (
                    <p className="text-[11px] text-white/50">Open the Statements tab first (annual fee posted there).</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "home" && insOpen && (
            <div className="mt-4 fade-up">
              <button onClick={() => { setInsOpen(false); setInsDone(false); }} className="text-xs text-amex font-bold mb-2">
                ← Back
              </button>
              <div className="bg-white rounded-2xl p-4 shadow border border-gray-100">
                <p className="font-bold text-sm mb-3">🛡️ Travel Insurance</p>
                {!insDone ? (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-[11px] font-semibold text-gray-500">Destination</span>
                      <select
                        value={insForm.dest}
                        onChange={(e) => setInsForm({ ...insForm, dest: e.target.value })}
                        className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white"
                      >
                        {["Bali", "Dubai", "London", "Singapore", "Bangkok"].map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="text-[11px] font-semibold text-gray-500">From</span>
                        <input type="date" value={insForm.start} onChange={(e) => setInsForm({ ...insForm, start: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-xl px-2 py-2 text-xs" />
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-semibold text-gray-500">To</span>
                        <input type="date" value={insForm.end} onChange={(e) => setInsForm({ ...insForm, end: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-xl px-2 py-2 text-xs" />
                      </label>
                    </div>
                    <label className="block">
                      <span className="text-[11px] font-semibold text-gray-500">Travelers</span>
                      <input type="number" min={1} max={6} value={insForm.travelers} onChange={(e) => setInsForm({ ...insForm, travelers: +e.target.value })} className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" />
                    </label>
                    <div className="bg-mist rounded-xl p-3 text-sm flex justify-between">
                      <span className="text-xs">Premium</span>
                      <b>₹{(1450 * insForm.travelers).toLocaleString("en-IN")}</b>
                    </div>
                    <button
                      onClick={buyIns}
                      disabled={insBusy}
                      className="w-full py-2.5 rounded-full bg-amex text-white text-sm font-semibold hover:bg-amex-dark disabled:opacity-60"
                    >
                      {insBusy ? "Booking…" : "Buy policy →"}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4 fade-up">
                    <div className="text-4xl">✅</div>
                    <p className="font-bold text-sm mt-1">Policy booked!</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {insForm.dest} · {insForm.travelers} travelers · documents emailed
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-2">
                      🎬 One View now shows the failover: 🔴 web error → 🟢 app success
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "offers" && (
            <div className="mt-4 space-y-3 fade-up">
              <p className="font-bold text-sm">Amex Offers</p>
              <div className="bg-white rounded-2xl overflow-hidden shadow border border-gray-100">
                <div className="h-20 bg-gradient-to-r from-rose-400 to-orange-400 flex items-center px-4 text-white font-bold">🍽️ Dining Week</div>
                <div className="p-4">
                  <p className="text-sm font-semibold">20% back on dining, up to ₹500</p>
                  <p className="text-[11px] text-gray-400">Valid at 1,000+ restaurants · till 31 Aug</p>
                  <button
                    onClick={() => {
                      if (!offerSaved) {
                        setOfferSaved(true);
                        emit("offer_view", "app", "transact", "Viewed + saved Amex Offer: 20% back on dining", { detail: "Intent signal — usable only if stitched with identity." });
                      }
                    }}
                    className={`mt-3 w-full py-2 rounded-full text-sm font-semibold ${offerSaved ? "bg-emerald-100 text-emerald-700" : "bg-amex text-white hover:bg-amex-dark"}`}
                  >
                    {offerSaved ? "✓ Saved to Card" : "Save to Card"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "statements" && (
            <div className="mt-4 fade-up">
              <p className="font-bold text-sm mb-2">Latest statement</p>
              <button
                onClick={() => {
                  if (!statementSeen && persona === "rohan") {
                    emit("statement_view", "app", "service", "Viewed statement — 💥 annual fee ₹4,999 posted", { reasonCode: "annual_fee", detail: "Fee shock moment. Member feels blindsided." });
                  }
                }}
                className="w-full text-left bg-white rounded-2xl p-4 shadow border border-gray-100 hover:shadow-md"
              >
                <p className="text-xs text-gray-400">July 2026 · PDF</p>
                <p className="text-sm font-semibold mt-1">Statement — ₹18,450 due 15 Aug</p>
                {persona === "rohan" && !statementSeen && (
                  <span className="inline-block mt-2 text-[11px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">
                    🔴 Contains: Annual membership fee ₹4,999
                  </span>
                )}
                {statementSeen && persona === "rohan" && (
                  <p className="text-[11px] text-red-500 mt-2">💥 Fee shock registered. 🎬 Next: open 🟠 Call Center.</p>
                )}
              </button>
            </div>
          )}

          {tab === "account" && (
            <div className="mt-4 fade-up space-y-2">
              <p className="font-bold text-sm mb-1">Account</p>
              {["Profile & settings", "Card controls (freeze)", "Membership Rewards — 12,430 pts", "Help & support"].map((x) => (
                <div key={x} className="bg-white rounded-xl p-3.5 shadow border border-gray-100 text-sm">{x}</div>
              ))}
            </div>
          )}
        </div>

      </PhoneFrame>
    </main>
  );
}

function SimBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2.5 text-xs font-semibold transition">
      {children}
    </button>
  );
}
