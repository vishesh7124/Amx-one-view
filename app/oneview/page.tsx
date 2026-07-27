"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AmexLogo from "@/components/AmexLogo";
import DemoChrome from "@/components/DemoChrome";
import ProfilesPanel from "@/components/oneview/ProfilesPanel";
import Timeline from "@/components/oneview/Timeline";
import IdentityGraph from "@/components/oneview/IdentityGraph";
import Funnel from "@/components/oneview/Funnel";
import FlowSankey from "@/components/oneview/FlowSankey";
import AlertsPanel from "@/components/oneview/AlertsPanel";
import Overview from "@/components/oneview/Overview";
import SessionReplay from "@/components/oneview/SessionReplay";
import Experiments from "@/components/oneview/Experiments";
import AskOneView from "@/components/oneview/AskOneView";
import { runEngine } from "@/lib/engine";
import { useAutonomy, useEvents, setAutonomy, clearAll } from "@/lib/store";

const SECTIONS = [
  ["overview", "🏠", "Overview"],
  ["journeys", "🕒", "Journeys"],
  ["identity", "🧬", "Identity"],
  ["analytics", "📊", "Analytics"],
  ["replay", "🎬", "Replay"],
  ["experiments", "🧪", "Tests"],
] as const;

type Section = (typeof SECTIONS)[number][0];

export default function OneView() {
  const events = useEvents();
  const engine = useMemo(() => runEngine(events), [events]);
  const [section, setSection] = useState<Section>("overview");
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [autonomy] = useAutonomy();

  return (
    <main className="min-h-screen bg-[#F5F7FB]">
      <DemoChrome current="oneview" bare />

      <div className="flex">
        {/* ─── command rail ─── */}
        <aside className="w-16 shrink-0 bg-[#0B1530] min-h-screen sticky top-0 self-start flex flex-col items-center py-3 gap-1.5 z-40">
          <Link href="/" title="Amex One View — home" className="mb-2">
            <AmexLogo size="sm" />
          </Link>
          {SECTIONS.map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              title={label}
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-base transition ${
                section === id ? "bg-amex text-white shadow-lg" : "text-white/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              {icon}
            </button>
          ))}
          <div className="mt-auto flex flex-col gap-1.5">
            <button
              onClick={() => setAutonomy(!autonomy)}
              title={`Agentic autonomy ${autonomy ? "ON" : "OFF"} — Tier-1 actions fire automatically when ON`}
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-base transition ${
                autonomy ? "bg-violet-600 text-white" : "text-white/40 hover:bg-white/10"
              }`}
            >
              🤖
            </button>
            <button
              onClick={() => {
                if (confirm("Reset all journeys?")) {
                  clearAll();
                  location.reload();
                }
              }}
              title="Reset all journeys"
              className="w-11 h-11 rounded-xl flex items-center justify-center text-base text-white/40 hover:bg-white/10"
            >
              ↺
            </button>
          </div>
        </aside>

        {/* ─── main column ─── */}
        <div className="flex-1 min-w-0">
          {/* topbar */}
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200 px-5 py-2.5 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-sm font-extrabold tracking-tight text-amex-deep truncate">
                Consumer Cards · Journey Intelligence
              </p>
              <p className="text-[10px] text-gray-400">Amex One View — internal console</p>
            </div>
            <div className="flex-1 max-w-xl mx-auto">
              <input
                placeholder="Ask a question about your journeys…  ⌘K"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    window.dispatchEvent(new CustomEvent("amex:ask", { detail: { q: e.currentTarget.value.trim() } }));
                    e.currentTarget.value = "";
                  }
                }}
                className="w-full text-xs bg-mist rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-amex/30 text-gray-600"
              />
            </div>
            <span className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-gray-500 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" /> LIVE · {events.length}
            </span>
          </header>

          {/* content + context rail */}
          <div className="flex">
            <div className="flex-1 min-w-0 p-5">
              {section === "overview" && <Overview events={events} engine={engine} onNavigate={(s) => setSection(s as Section)} />}
              {section === "journeys" && <Timeline events={events} engine={engine} selectedProfile={selectedProfile} />}
              {section === "identity" && <IdentityGraph events={events} engine={engine} selectedProfile={selectedProfile} />}
              {section === "analytics" && (
                <div className="grid xl:grid-cols-2 gap-4">
                  <Funnel events={events} />
                  <FlowSankey events={events} />
                </div>
              )}
              {section === "replay" && <SessionReplay events={events} />}
              {section === "experiments" && <Experiments />}
            </div>

            {/* right context rail */}
            <aside className="w-[320px] shrink-0 p-5 pl-0 space-y-4 hidden xl:block">
              <ProfilesPanel profiles={engine.profiles} selected={selectedProfile} onSelect={setSelectedProfile} />
              <AlertsPanel />
            </aside>
          </div>
        </div>
      </div>

      {/* chatbot */}
      <AskOneView events={events} engine={engine} />
    </main>
  );
}
