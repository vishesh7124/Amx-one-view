// ─── Canonical event model (mirrors ROADMAP.md §4.1, browser-simplified) ───

export type Channel = "web" | "app" | "voice" | "in_person";

export type Stage =
  | "discover"
  | "consider"
  | "apply"
  | "onboard"
  | "transact"
  | "service"
  | "retain";

export type PersonaId = "aarav" | "meera" | "rohan";

export interface EventIds {
  anonId?: string;
  deviceId?: string;
  sessionId?: string;
  email?: string;
  phone?: string;
  applicationId?: string;
  cardId?: string;
  dniNumber?: string;
  resumeToken?: string;
  customerId?: string;
}

export interface JourneyEvent {
  id: string;
  ts: number;
  persona: string; // 3 demo personas + synthetic cohort users (sim-u-*)
  channel: Channel;
  type: string;
  stage: Stage;
  label: string;
  detail?: string;
  ids: EventIds;
  sentiment?: number; // -1 .. 1
  reasonCode?: string; // 'annual_fee' | 'declined_transaction' | ...
  amount?: number;
  isAction?: boolean; // true if emitted by the Action Engine
  actionTier?: 1 | 2; // autonomy tier for action events
}

export const STAGES: Stage[] = [
  "discover",
  "consider",
  "apply",
  "onboard",
  "transact",
  "service",
  "retain",
];

export const CHANNELS: Channel[] = ["web", "app", "voice", "in_person"];

export const CHANNEL_META: Record<
  Channel,
  { label: string; color: string; bg: string; icon: string }
> = {
  web: { label: "Web", color: "#016fd0", bg: "bg-ch-web", icon: "🔵" },
  app: { label: "App", color: "#16a34a", bg: "bg-ch-app", icon: "🟢" },
  voice: { label: "Phone", color: "#f59e0b", bg: "bg-ch-voice", icon: "🟠" },
  in_person: {
    label: "In-Person",
    color: "#8b5cf6",
    bg: "bg-ch-inperson",
    icon: "🟣",
  },
};
