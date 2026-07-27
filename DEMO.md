# Amex One View — Demo Runbook

## Run it

```bash
cd amex-one-view
npm run dev        # http://localhost:3000
```

Open `http://localhost:3000` (the **Console**) → launch tabs from there. Everything runs in the browser; no backend needed. State lives in localStorage and syncs live across tabs.

## Setup (the split screen)

1. **Right half of screen:** `📊 Amex One View` (/oneview)
2. **Left half:** the channel mockups (/web, /app, /call) — play the customer here
3. Every mockup has a **🎬 bar** (top-right): persona selector, tab shortcuts, ↺ reset — and a **script checklist** (bottom-left) that auto-checks as you go.

> **📞 Calls:** the easiest way to make a call is the **floating call widget** (bottom-right of the /web and /app pages) — it opens an in-window, minimizable call panel with live progressive transcription, where the agent greets the caller with their stitched journey context. The full-screen /call page (IVR + agent desktop) still exists as an alternative.

## Act 1 — Aarav, the anonymous prospect (hero story, ~3 min)

| # | Do this (left screen) | Say this (point at right screen) |
|---|---|---|
| 1 | /web → land, view Platinum Travel, compare with Gold | "AmEx sees nothing today. One View already created a **Provisional Identity** — conf 0.40." |
| 2 | Apply Now → step 1 → **✕ Leave at KYC step** | "💥 The break. Legacy: lead lost. One View: **drop-off alert** fired." |
| 3 | Watch One View ~3.5s | "Tier-1 agentic action, no human: **save-resume link sent** — and logged on the timeline." |
| 4 | /call → dial the website number → ask about fees | "The website showed a **per-session DNI number** — the call stitches to his web history. conf 0.90. Legacy CRM sees a stranger." |
| 5 | /web → click the 📧 resume email → submit | "Progress restored — tokenized link, conf 0.90 → application ID, 0.95." |
| 6 | /app → log in as Aarav → **Activate Card** | "⭐ The golden stitch — device↔card↔application↔anonymous history. **Confidence 1.00.** Watch the ladder in Identity Graph." |
| 7 | /app → ☕ first in-store purchase | "Closed loop: POS data is natively AmEx's." |

**Finish on the Identity Graph tab:** walk the confidence ladder 0.40 → 0.80 → 0.90 → 0.95 → 1.00.

## Act 2 — Meera, the blocked booker (platform-bug signal, ~2 min)

/web → **Log In** as Meera → **Travel** nav → Travel Insurance → fill the quote form → **💥 ERR-5003 unknown error** → /app → log in → 🛡️ Travel Insurance → same details → **✅ booked in 2 minutes** → One View: **🔀 channel-failover alert** → Tier-1 goodwill (1,000 MR points) auto-fires → click **👥 ×40 users** in the alerts header → **🐞 platform-bug alert: 41 users, identical failover pattern** → **Approve (Tier 2)** → engineering incident filed *with 41 stitched journeys attached as evidence*. The line: **"One failover is a support ticket. Forty is an engineering incident. Only a stitched platform can tell the difference."**

## Act 3 — Rohan, churn risk (~1.5 min)

/app → Statements → annual fee view → /call → fee waiver denied → /app → 📉 spend drops 52% → /call → "thinking of cancelling" → **⚠️ churn-risk 100/100** alert → **Tier-2 action needs human approval** — click **Approve** in One View → retention offer logged on the timeline. "Tier 1 never touches money. Tier 2 never executes without a human."

## Reset

🎬 bar → ↺ (or Console → Reset demo). Wipes all journeys across tabs.

## Prototype ↔ production mapping (if judges ask)

| Prototype | Production (Slide 5/5B) |
|---|---|
| localStorage event bus + storage events | Kafka topics `raw.*` → `events.canonical` |
| `lib/engine.ts` (identifier→profile, deterministic merges, confidence) | Stateful identity service: union-find + Postgres/Neo4j + review queue |
| Timeline rebuild on merge | Retro-stitch + 3-speed stitching |
| In-browser alerts & action engine | Analytics consumers + policy router + `actions.executed` topic |

## Troubleshooting

- Tab looks stale → it refreshes within ~1s (storage events + polling); hard-refresh if needed.
- Reset didn't clear a tab → reload that tab.
- Demo on one screen? Use browser windows side-by-side; the 🎬 bar is on every page.
