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
import { runEngine } from "@/lib/engine";
import { useAutonomy, useEvents, setAutonomy } from "@/lib/store";

const TABS = [
  ["timeline", "🕒 Journey Timeline"],
  ["graph", "🕸️ Identity Graph"],
  ["funnel", "🪣 Funnel"],
  ["flow", "🌊 Flow (Sankey)"],
] as const;

type TabId = (typeof TABS)[number][0];

export default function OneView() {
  const events = useEvents();
  const engine = useMemo(() => runEngine(events), [events]);
  const [tab, setTab] = useState<TabId>("timeline");
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [autonomy] = useAutonomy();

  const customers = engine.profiles.filter((p) => p.kind === "customer").length;
  const provisional = engine.profiles.length - customers;

  return (
    <main className="min-h-screen bg-mist">
      <DemoChrome current="oneview" />

      {/* header */}
      <header className="bg-amex-deep text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-5 py-3 flex items-center gap-3">
          <AmexLogo size="sm" />
          <div>
            <h1 className="font-extrabold leading-none">
              Amex <span className="text-amex-sky">One View</span>
            </h1>
            <p className="text-[10px] text-white/60">One Customer. One Identity. One Continuous Journey.</p>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="hidden md:flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" /> LIVE · {events.length} events
            </span>
            <span className="hidden md:block bg-white/10 px-3 py-1.5 rounded-full whitespace-nowrap">
              👤 {customers} · 🕵️ {provisional}
            </span>
            <button
              onClick={() => setAutonomy(!autonomy)}
              className={`px-3 py-1.5 rounded-full font-semibold transition ${autonomy ? "bg-violet-600" : "bg-white/10"}`}
              title="Tier-1 actions execute autonomously when ON"
            >
              🤖 Autonomy {autonomy ? "ON" : "OFF"}
            </button>
            <Link href="/" className="bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20">
              Console
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-5 py-5 grid lg:grid-cols-[300px_1fr] gap-5">
        {/* left rail */}
        <aside className="space-y-4">
          <ProfilesPanel profiles={engine.profiles} selected={selectedProfile} onSelect={setSelectedProfile} />
          <AlertsPanel />
        </aside>

        {/* main */}
        <section className="space-y-4 min-w-0">
          <div className="flex gap-2 flex-wrap">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                  tab === id ? "bg-amex text-white shadow" : "bg-white text-gray-600 border border-gray-200 hover:border-amex"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "timeline" && <Timeline events={events} engine={engine} selectedProfile={selectedProfile} />}
          {tab === "graph" && <IdentityGraph events={events} engine={engine} selectedProfile={selectedProfile} />}
          {tab === "funnel" && <Funnel events={events} />}
          {tab === "flow" && <FlowSankey events={events} />}
        </section>
      </div>
    </main>
  );
}
