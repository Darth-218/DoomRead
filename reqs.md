# Product Requirements Document: DoomRead (MVP)

**Status:** Draft
**Owner:** Yahia Gaber
**Last updated:** August 01, 2026
**Project name:** DoomRead

## 1. Purpose & Vision

Build a fully local, open source RSVP (Rapid Serial Visual Presentation) app for Android and Web that lets users consume text 2–3x faster by displaying one word at a time at a fixed focal point, while preserving comprehension through rhythm-aware pacing. No servers, no accounts, no data leaving the device — everything runs and stores locally.

## 2. Goals

- Ship a feature-complete MVP validating the core RSVP reading loop
- Support the most common content sources (files, web, pasted/shared text) with zero-friction import
- Keep the interface distraction-free by default, with an explicit focus mode for ADHD/attention-limited users
- Collect no user data beyond what's needed for local progress tracking

## 3. Non-Goals (Out of Scope for MVP)

- Cloud sync / multi-device continuity
- Social or sharing features
- Text-to-speech
- AI-generated summaries
- Collaborative/shared reading
- Offline dictionary lookups
- Highlighting or annotation

## 4. Target Users

| Persona | Primary Need |
|---|---|
| Students | Fast exam-prep reading through large volumes of text |
| Professionals | Faster processing of articles/reports/docs |
| Lifelong learners | Read more books in less time |
| ADHD readers | Reduced visual clutter, sustained attention |
| Language learners | Improved reading flow in a new language |
| Speed-reading practitioners | Deliberate training/practice |

## 5. Functional Requirements

### 5.1 Core Reading Engine (P0)
- **FR-1.1** RSVP display: render one word at a time centered on a fixed focal point
- **FR-1.2** WPM control: continuously adjustable speed slider, range **100–1000 WPM**, default **300 WPM** (a comfortable starting point above the ~250 WPM average adult reading speed, without being intimidating on first use)
- **FR-1.3** Smart pacing: auto-insert a short pause after commas/clauses, a longer pause after sentence-ending punctuation, and a proportional pause for long/complex words
- **FR-1.4** Playback controls: play, pause, rewind (word- and sentence-level), resume from last position

### 5.2 Reading Modes (P0)
- **FR-2.1** Speed Read mode: full RSVP experience, in-app (full-screen or embedded view)
- **FR-2.2** Immersive Reader mode: traditional paginated/scrollable full-text view with customizable typography and chapter navigation
- **FR-2.3** Mode switching: user can toggle between modes without losing reading position

### 5.3 Content Import (P0)
- **FR-3.1** File import: PDF, EPUB
- **FR-3.2** *(Deferred — see Section 9)* URL import: extract main article body, stripping ads/nav/boilerplate. Client-side browser CORS restrictions make this unreliable for the web build at MVP; revisit once a workaround (browser extension, bookmarklet, etc.) is chosen. Not blocked on Android but deprioritized to keep both platforms at feature parity for MVP.
- **FR-3.3** Text input: manual paste
- **FR-3.4** OS share-sheet integration: accept shared text/links from any app
- **FR-3.5** EPUB chapter parsing with per-chapter progress tracking

### 5.4 Visual Customization (P1)
- **FR-4.1** Theme presets: Default, Focus Bold (bolded word-initial letters), ORP Reticle (fixation-point guide), Monospace, Dyslexia-friendly (e.g., Lexend font)
- **FR-4.2** Font family selection independent of theme: Sans-serif, Monospace, Dyslexia-friendly
- **FR-4.3** Font size and line-spacing controls
- **FR-4.4** Display modes: light, dark, sepia

### 5.5 Focus & Distraction Management (P1)
- **FR-5.1** Focus Mode: hide all chrome/controls, show only the current word
- **FR-5.2** Default reading view is minimal (no persistent toolbars during active reading)

### 5.6 Progress & Analytics (P1)
- **FR-6.1** Bookmarking: save and resume position per document
- **FR-6.2** Stats dashboard: total words read, session count, average WPM, estimated time saved vs. conventional reading — baseline fixed at **250 WPM** (commonly cited average adult silent-reading speed), calculated as `time_at_250wpm − time_at_actual_wpm` per session

### 5.7 Data Export & Import (P0)
- **FR-7.1** Export all local data — bookmarks, reading progress, stats, and settings — to a single portable file (e.g., JSON)
- **FR-7.2** Import a previously exported file to restore state, either on the same device after data loss or on a new device
- **FR-7.3** This is the primary backup/continuity mechanism given there's no cloud sync (deferred, see Section 9) — it's what lets a user move between Android and Web or recover from browser data being cleared
- **FR-7.4** Web build: since IndexedDB isn't durable (cleared by browser data-clearing, private windows, or storage-quota eviction), surface an in-app reminder to export periodically, or offer it as a one-tap action from the stats dashboard

## 6. Non-Functional Requirements

- **NFR-1 Privacy:** no user text or reading data leaves the device; no third-party data sharing. State this explicitly in-app and in a privacy policy, not just as a marketing claim.
- **NFR-2 Performance:** word transitions must render with no visible jank at speeds up to the max supported WPM
- **NFR-3 Permissions:** minimal permission footprint — no overlay/"draw over other apps" permission needed since overlay mode is out of scope. Android should request only storage/file access needed for import; web needs no special permissions beyond standard file picker/clipboard APIs.
- **NFR-4 Accessibility:** dyslexia-friendly font and adjustable text sizing must meet WCAG AA contrast at minimum
- **NFR-5 Footprint:** target installed size comparable to lightweight utility apps (~30 MB class)
- **NFR-6 Internationalization:** support accented/diacritic characters correctly in the RSVP renderer from day one (not as a post-launch patch)

## 7. Project Model

Fully open source, licensed under **GPLv3**. No paywalls, Pro tiers, or upgrade prompts — all features in this document ship free to all users. This also means "in-app purchases" and monetization-driven UX (e.g., "smart frequency" upsell notifications) referenced in the original app are explicitly excluded.

**Platforms: Android + Web.** iOS is out of scope for MVP. This resolves the earlier overlay-feasibility question (FR-5 below) and simplifies distribution (no App Store / GPL conflict to navigate).

## 8. Open Questions

**Product**
1. ~~WPM range and default~~ Resolved: 100–1000 WPM range, 300 WPM default. See FR-1.2.
2. ~~Time-saved baseline~~ Resolved: fixed at 250 WPM (average adult silent-reading speed). See FR-6.2.
3. ~~Platforms~~ Resolved: Android + Web.
4. ~~AGPL vs. plain GPLv3~~ Resolved: no backend, so plain **GPLv3** is sufficient — no AGPL needed.
5. How does local storage actually work on each platform? Android: local DB (e.g., Room/SQLite) is straightforward. Web: relies on browser storage (IndexedDB) for documents/progress/stats — not durable the way native storage is (users clearing browser data lose everything, private/incognito windows won't persist, storage quota applies). FR-7 (export/import) is the mitigation; still worth deciding whether to nudge users to export on a schedule or only on-demand.
6. ~~Is web URL-import worth keeping in MVP scope?~~ Resolved: deferred post-MVP for both platforms, see Section 9.

**Open source governance**
7. Who maintains it long-term, and what's the bus-factor plan if the initial maintainer(s) step back?
8. What's the contribution process — issue templates, PR review requirements, DCO/sign-off (common for GPL projects to keep provenance clean), code of conduct?
9. Distribution: **Android** — Google Play and/or F-Droid (F-Droid is a strong fit for a GPLv3, no-proprietary-dependency, no-backend project). **Web** — since there's no server to run, is this a static site users can self-host/open as a local file, a project-hosted static page (e.g., GitHub Pages), or both?
10. Ongoing costs: with no backend, this is now mainly Android signing/release infra and (if used) a static web hosting bill — both cheap/free-tier feasible, worth confirming.
11. ~~Trademark/naming~~ See #16 below — name chosen (DoomRead), no collision found in initial search, formal clearance still pending before launch.

**Technical**
12. ~~Tech stack~~ Resolved: Kotlin Multiplatform shared core, compiled to **Kotlin/JS** for Web (chosen over Kotlin/Wasm for broader browser compatibility) + Jetpack Compose (Android) and TypeScript/Svelte (Web) as separate native UIs; Readium Kotlin Toolkit for Android EPUB/PDF parsing (BSD-3-Clause, GPLv3-compatible — excluding the LCP module and pspdfkit adapter, both of which pull in proprietary code). See Section 10.
13. Any telemetry at all, even opt-in/local-only crash logs, or strictly zero data collection as stated in NFR-1? With no backend, "zero data collection" is easier to guarantee and worth stating as a hard privacy commitment.
14. ~~Dependency audit~~ Resolved for the core stack — all confirmed GPLv3-compatible: Readium Kotlin Toolkit incl. pdfium adapter (BSD-3-Clause, excluding the LCP module), Svelte (MIT), pdf.js and epub.js. Remaining audit work is scoped to secondary/incidental dependencies picked up during implementation (e.g., KMP tooling plugins, build system dependencies) — a lighter lift than the original open question, but still worth a pass before each release.
15. ~~Minimum platform targets~~ Resolved: Android minSdk 26; Web targets evergreen browsers only. See Section 10.
16. Trademark check: a quick search found no existing "DoomRead" app or product — no collision found, but no formal trademark clearance has been done. Worth a proper check (USPTO/trademark database, app store name search) before public launch, not before starting development.

## 9. MVP Scope Summary

| In MVP | Deferred Post-MVP |
|---|---|
| RSVP engine + smart pacing | Cloud sync |
| Speed Read + Immersive modes | Social/sharing |
| PDF, EPUB, paste, share-sheet import | Text-to-speech |
| 5 visual themes + font/size/spacing controls | AI summaries |
| Bookmarks + stats dashboard | Collaborative reading |
| Focus Mode | Offline dictionary |
| Export/import backup file | Floating overlay (Android-only concept, cut from scope) |
| | Highlighting/annotation |
| | **URL/article import** (client-side CORS constraints on web; revisit with a workaround) |

## 10. Technical Architecture

**Code-sharing model:** shared core logic, separate native UIs.

| Layer | Choice | Notes |
|---|---|---|
| Shared core | Kotlin Multiplatform (KMP) module, compiled to **Kotlin/JS** for Web | Tokenizer, pacing/rhythm engine, WPM and stats calculations, export/import file format. Single implementation compiled to JVM (Android) and Kotlin/JS (Web) — keeps core reading behavior identical across platforms by construction. Kotlin/JS chosen over Kotlin/Wasm for broader browser compatibility, at the cost of a slightly heavier/slower runtime than Wasm would offer. |
| Android UI | Kotlin + Jetpack Compose | Native, idiomatic; consumes the KMP core directly (same JVM). |
| Web UI | TypeScript + Svelte (MIT — GPLv3-compatible, confirmed) | Native web UI, consumes the KMP core via its Kotlin/JS output. |
| Android storage | Room/SQLite | Durable local DB. |
| Web storage | IndexedDB | Paired with FR-7 export/import to mitigate non-durability (see NFRs/open questions). |
| PDF parsing | Android: **Readium's pdfium adapter** (wraps PdfiumAndroid + AndroidPdfViewer, both free/open source — GPLv3-compatible); Web: pdf.js | ⚠️ Do **not** use Readium's alternative pspdfkit adapter — that wraps the commercial PSPDFKit library. Known limitation: the pdfium adapter can struggle with very large PDFs (~40MB+); acceptable trade-off for staying fully open source. |
| EPUB parsing | Android: **Readium Kotlin Toolkit** (BSD-3-Clause — GPLv3-compatible, confirmed); Web: epub.js | ⚠️ Exclude the `readium-lcp` module specifically — it depends on a proprietary binary (`liblcp`) from EDRLab, which conflicts with a fully open source build. Stick to `readium-shared`, `readium-streamer`, `readium-navigator`, `readium-opds`, plus `readium-adapter-pdfium` for PDF. |
| Minimum platform targets | Android: **minSdk 26** (Android 8.0). Web: evergreen browsers only (recent Chrome, Firefox, Safari, Edge) | minSdk 26 avoids the core-library-desugaring requirement Readium notes for API <26, simplifying the build. Kotlin/JS output still expects a reasonably modern JS engine; exact browser version floor should be pinned once the build tooling is set up and tested. |

**Rationale for KMP over dual implementations:** a single core implementation guarantees the pacing algorithm, WPM math, and export/import format can't drift between Android and Web over time. Trade-off accepted: contributors need Kotlin/KMP familiarity to touch core logic, even if they're only working on the Web UI.

## 11. Success Metrics (suggested — needs stakeholder input)

- Day-7 retention of users who complete onboarding
- Average WPM growth per user over first 30 days
- GitHub stars / active contributors / merged external PRs
- F-Droid or store install counts (if telemetry-free measurement is feasible)
