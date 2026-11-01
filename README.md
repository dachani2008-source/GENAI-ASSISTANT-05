# ELEGANTIA AI — The Intelligent Event Planning Studio

> *"Every detail, thoughtfully planned. Every moment, unforgettable."*

**ELEGANTIA AI** is a GenAI-powered event planning platform built to help planners and hosts organize **Weddings**, **Birthdays**, and **Community Events** with precision budgets, dynamic timelines, vendor checklists, personalized ideas, calendar synchronization, and preference-driven theme suggestions.

---

## Core Capabilities

1. **Three Dedicated Event Studios (`Wedding`, `Birthday`, `Community`)**
   - Dynamic category accents (`#A34E50` Burgundy, `#D77C50` Coral, `#397D85` Teal), tailored checklists, weather backup plans, and run-of-show schedules.
2. **5-Step AI Event Creation Wizard (`/api/gemini/generate-plan`)**
   - Synthesizes category, guest count, venue setting, budget ceiling, priorities, and cultural preferences into a structured event workspace.
3. **Smart Budget Studio & AI Cost Optimizer (`/api/gemini/optimize-budget`)**
   - Tracks planned vs. actual spend, enforces total budget ceilings, supports lockable priority categories, and generates itemized savings proposals.
4. **Dynamic Timeline & Dual Calendar Sync (`.ICS` + Google Calendar)**
   - Automatically recalculates milestone due dates when the event date shifts and exports RFC 5545 `.ics` bundles or syncs via 1-click Google Calendar deep links.
5. **Vendor Checklist & Quotation Spread Analyzer**
   - Tracks vendor booking stages (`Shortlisted`, `Quoted`, `Contracted`), payment status, and side-by-side price spreads.
6. **Preference-Driven AI Theme Suggestion Engine (`/api/gemini/suggest-themes` & `/api/gemini/generate-ideas`)**
   - Generates tailored event themes from user preferences (*Season*, *Venue Setting*, *Color Mood*, and *Cultural Notes*) with 1-click application.
7. **Contextual AI Copilot (`/api/gemini/copilot`)**
   - Slide-over executive assistant grounded in live event metrics with 1-click state actions.

---

## GenAI Architecture

- **SDK**: `@google/genai` (`GoogleGenAI`)
- **Model**: `gemini-3.8-flash` with `responseMimeType: "application/json"` and strict `responseSchema` definitions.
- **Resilience & Caching**: Bounded server-side LRU response cache (`X-Cache: HIT | MISS`) with deterministic fallback calculation engines so every feature operates reliably even offline or without an API key.

---

## Scripts & Verification

```bash
# Start full-stack development server on http://localhost:3000
npm run dev

# Run all 31 unit, API integration, security, and React component tests
npm test

# Run tests with code coverage report
npm run test:coverage

# Type-check with strict TypeScript
npm run lint

# Build production bundle
npm run build
```
