"use client";

import type { Profile } from "@/lib/engine";
import { confBg } from "@/lib/engine";
import { CHANNEL_META } from "@/lib/types";

export default function ProfilesPanel({
  profiles,
  selected,
  onSelect,
}: {
  profiles: Profile[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <p className="px-4 py-3 text-xs font-bold text-amex-dark bg-mist border-b border-gray-100">
        👤 IDENTITY PROFILES ({profiles.length})
      </p>
      <div className="max-h-72 overflow-y-auto scrollbar-thin">
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-4 py-2.5 text-xs font-semibold border-b border-gray-50 hover:bg-amex-sky/50 ${selected === null ? "bg-amex-sky text-amex-dark" : "text-gray-600"}`}
        >
          ◈ All profiles (unified view)
        </button>
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-amex-sky/50 ${selected === p.id ? "bg-amex-sky" : ""}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold truncate">
                {p.kind === "provisional" ? "🕵️" : "👤"} {p.name}
              </p>
              <span className="text-[10px] text-gray-400">{p.id}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${confBg(p.confidence)} transition-all`} style={{ width: `${p.confidence * 100}%` }} />
              </div>
              <span className="text-[10px] font-bold text-gray-500">{p.confidence.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {p.channels.map((c) => (
                <span key={c} title={CHANNEL_META[c].label}>{CHANNEL_META[c].icon}</span>
              ))}
              <span className="text-[10px] text-gray-400 ml-auto">{p.eventIds.length} events</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
