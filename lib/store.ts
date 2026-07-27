"use client";

import { useEffect, useState } from "react";
import type { JourneyEvent, PersonaId } from "./types";

// ─── Source of truth: localStorage. Cross-tab sync via the `storage` event,
// which fires in every OTHER tab whenever one tab writes. Simple + reliable. ───

const EVENTS_KEY = "amex.oneview.events.v1";
const PERSONA_KEY = "amex.oneview.activePersona.v1";
const AUTONOMY_KEY = "amex.oneview.autonomy.v1";

export function uid(prefix = "e"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function loadEvents(): JourneyEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    return raw ? (JSON.parse(raw) as JourneyEvent[]) : [];
  } catch {
    return [];
  }
}

export function appendEvent(e: Omit<JourneyEvent, "id" | "ts"> & { ts?: number }) {
  const ev: JourneyEvent = { ...e, id: uid(), ts: e.ts ?? Date.now() };
  const arr = loadEvents();
  arr.push(ev);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(arr));
  return ev;
}

export function clearAll() {
  localStorage.removeItem(EVENTS_KEY);
  localStorage.removeItem(PERSONA_KEY);
}

export function getActivePersona(): PersonaId {
  if (typeof window === "undefined") return "aarav";
  return (localStorage.getItem(PERSONA_KEY) as PersonaId) || "aarav";
}

export function setActivePersona(p: PersonaId) {
  localStorage.setItem(PERSONA_KEY, p);
}

export function getAutonomy(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(AUTONOMY_KEY) !== "off";
}

export function setAutonomy(on: boolean) {
  localStorage.setItem(AUTONOMY_KEY, on ? "on" : "off");
}

// ─── React hook: live event state, synced across tabs ───
export function useEvents(): JourneyEvent[] {
  const [events, setEvents] = useState<JourneyEvent[]>([]);
  useEffect(() => {
    const refresh = () => setEvents(loadEvents());
    refresh();
    window.addEventListener("storage", refresh);
    // also poll lightly (storage event doesn't fire in the originating tab)
    const t = setInterval(refresh, 700);
    return () => {
      window.removeEventListener("storage", refresh);
      clearInterval(t);
    };
  }, []);
  return events;
}

export function useActivePersona(): [PersonaId, (p: PersonaId) => void] {
  const [p, setP] = useState<PersonaId>("aarav");
  useEffect(() => {
    const refresh = () => setP(getActivePersona());
    refresh();
    window.addEventListener("storage", refresh);
    const t = setInterval(refresh, 700);
    return () => {
      window.removeEventListener("storage", refresh);
      clearInterval(t);
    };
  }, []);
  return [p, setActivePersona];
}

export function useAutonomy(): [boolean, (on: boolean) => void] {
  const [a, setA] = useState<boolean>(true);
  useEffect(() => {
    const refresh = () => setA(getAutonomy());
    refresh();
    window.addEventListener("storage", refresh);
    const t = setInterval(refresh, 900);
    return () => {
      window.removeEventListener("storage", refresh);
      clearInterval(t);
    };
  }, []);
  return [a, setAutonomy];
}
