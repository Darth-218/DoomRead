# DoomRead Roadmap

This roadmap sequences the work from the current docs-only state to a released MVP and beyond. Requirement IDs reference [reqs.md](reqs.md). Status reflects the current state of the repository.

## Legend

- **Done** — completed and in the repo
- **Next** — the immediate focus
- **Todo** — planned, not yet started
- **Deferred** — explicitly out of MVP scope

## Phase 0 — Foundations (current)

| Item | Req | Status |
|---|---|---|
| Spec source of truth (`reqs.md`) | — | Done |
| License (GPLv3), contributing guidelines | §7 | Done |
| Roadmap | — | Done |
| Repo hosting, branch strategy, issue/PR templates | OQ-8 | Todo |
| Governance decisions: maintainership, bus factor, DCO/sign-off, code of conduct | OQ-7, OQ-8 | Todo |
| Reproducible dev environment (`nix develop`) | — | Done |
| CI pipeline | — | Todo |

**Exit criteria:** any contributor can open a PR, run checks, and see clear guidance on process.

## Phase 1 — Core engine (KMP)

The single source of truth for all reading logic, compiled to JVM (Android) and Kotlin/JS (Web).

| Item | Req | Status |
|---|---|---|
| Stand up Kotlin Multiplatform project (android + jvm + js targets) | §10 | Done |
| Tokenizer (words + punctuation, correct diacritics/accent handling) | FR-1.1, NFR-6 | Done |
| Pacing engine: WPM math, comma/clause pauses, sentence pauses, long-word scaling | FR-1.2, FR-1.3 | Done |
| Stats math: session time, time saved vs 250 WPM baseline | FR-6.2 | Done |
| Backup codec: single-file JSON export/import schema | FR-7.1, FR-7.2 | Done |
| Shared unit tests run on all targets | NFR-2 | Done |
| Version pinning + dependency audit baseline (all GPLv3-compatible) | OQ-14 | Done |

**Exit criteria:** `core` tests green on JVM, JS, and Android targets; pacing/stats/export behavior is identical across platforms by construction.

## Phase 2 — Android MVP

| Item | Req | Status |
|---|---|---|
| Compose app shell + navigation between reading modes | FR-2.1, FR-2.2 | Todo |
| Speed Read (RSVP) view with play/pause/rewind, resume from position | FR-1.4, FR-6.1 | Todo |
| Immersive Reader view; toggle modes without losing position | FR-2.2, FR-2.3 | Todo |
| Import: paste, OS share-sheet | FR-3.3, FR-3.4 | Todo |
| Import: PDF via Readium pdfium adapter (open-source only) | FR-3.1, §10 | Todo |
| Import: EPUB via Readium streamer, chapter parsing + per-chapter progress | FR-3.5, §10 | Todo |
| Room/SQLite storage: documents, progress, bookmarks, stats | §10 | Todo |
| Visual customization: 5 themes, fonts, size, spacing, light/dark/sepia | FR-4 | Todo |
| Focus Mode (chrome hidden) | FR-5.1, FR-5.2 | Todo |
| Stats dashboard + one-tap backup export | FR-6.2, FR-7.4 | Todo |
| Backup import/restore | FR-7.2 | Todo |
| Footprint target ~30 MB class; WCAG AA contrast; diacritics render correctly | NFR-4, NFR-5, NFR-6 | Todo |

**Exit criteria:** all MVP features (P0 + P1) work on Android with zero telemetry and no data leaving the device.

## Phase 3 — Web MVP (current)

> **Built before Android** (decided during implementation) — the Web app is therefore the reference platform for MVP features; Android (Phase 2) will mirror it.

| Item | Req | Status |
|---|---|---|
| Svelte + TypeScript + Vite app shell (Reader + Library/Stats/Settings views) | §10 | Done |
| Consume the KMP core via its Kotlin/JS output (generated `core.mjs`, copied into the web app) | §10 | Done |
| Speed Read + Immersive modes, same core pacing | FR-1, FR-2 | Todo |
| Import: paste, file (PDF via pdf.js, EPUB via epub.js) | FR-3.1, FR-3.3, §10 | Todo |
| IndexedDB storage + backup export/import; periodic export reminder | FR-7, FR-7.4 | Todo |
| Same themes/typography controls/focus mode as Android | FR-4, FR-5 | Todo |
| Static hosting (GitHub Pages or self-host) | OQ-9 | Todo |

**Exit criteria:** all MVP features (P0 + P1) work in the browser, driven by the shared core.

## Phase 4 — Polish & hardening

| Item | Req | Status |
|---|---|---|
| Jank-free word rendering at up to 1000 WPM | NFR-2 | Todo |
| Large-PDF behavior (pdfium ~40MB+ limitation) assessed and mitigated where possible | §10 | Todo |
| Accessibility audit (keyboard nav, contrast, dyslexia-friendly defaults) | NFR-4 | Todo |
| Full dependency license audit before first release | OQ-14 | Todo |
| In-app privacy statement + privacy policy page | NFR-1 | Todo |

## Phase 5 — Release & distribution

| Item | Req | Status |
|---|---|---|
| Android: Google Play and/or F-Droid; signing/release infra | OQ-9, OQ-10 | Todo |
| Web: static site deployed and self-hostable | OQ-9 | Todo |
| Trademark clearance for the DoomRead name | OQ-16 | Todo |
| Baseline success metrics (retention, WPM growth, contributors, installs) | §11 | Todo |

## Post-MVP (deferred)

| Feature | Req |
|---|---|
| URL/article import (needs a CORS workaround: extension, bookmarklet, etc.) | FR-3.2, §9 |
| Cloud sync / multi-device continuity | §9 |
| Text-to-speech | §9 |
| AI summaries | §9 |
| Highlighting / annotation | §9 |
| Social / sharing features | §9 |

## Notes

- Web is currently the reference platform for MVP features (Phase 3 first, Android Phase 2 second) because the Svelte/Vite app is lighter to iterate on and the core Kotlin/JS output is already being produced; Android then mirrors it.
- Privacy and "fully open source" are constraints, not features — every dependency decision must pass both.
- Governance open questions (OQ-7, OQ-8, OQ-10) should be resolved before the first external contribution, per [CONTRIBUTING.md](CONTRIBUTING.md).
