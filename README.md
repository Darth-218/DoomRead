# DoomRead

Fully local, open source **RSVP** (Rapid Serial Visual Presentation) reader for **Android** and **Web** — consume text 2–3x faster by displaying one word at a time at a fixed focal point, with rhythm-aware pacing that preserves comprehension.

No servers. No accounts. No telemetry. Everything runs and stores on your device.

> **Status: fresh start.** This repository currently contains documentation only — the codebase has not been implemented yet. See [reqs.md](reqs.md) for the full product requirements.

## What it is

An app that lets you read text as a steady stream of single words centered on one focal point, paced to your speed, so your eyes never scan the page. Smart pacing inserts pauses at commas/clauses and sentence ends, and gives long words proportional extra time — keeping comprehension high at 2–3x normal reading speed.

**MVP scope** (from [reqs.md](reqs.md)):

- RSVP engine with smart pacing; 100–1000 WPM control, 300 WPM default
- Speed Read and Immersive Reader modes, switchable without losing position
- Import: PDF, EPUB, manual paste, OS share-sheet
- Five visual themes + font/size/spacing controls; light/dark/sepia
- Focus Mode (chrome hidden, word only)
- Bookmarks, stats dashboard (words read, sessions, avg WPM, time saved vs 250 WPM baseline)
- Full local data export/import as a single JSON backup

**Explicitly out of scope:** cloud sync, URL/article import, text-to-speech, AI summaries, annotations, sharing, and any paid tier.

## Platforms

| Platform | Minimum target | Planned UI |
|---|---|---|
| Android | minSdk 26 (Android 8.0) | Kotlin + Jetpack Compose |
| Web | evergreen browsers | TypeScript + Svelte |

iOS is out of scope for the MVP.

## Planned architecture

Shared core, separate native UIs — a single Kotlin Multiplatform core keeps the pacing algorithm, WPM math, and export format identical across platforms by construction.

| Layer | Planned choice | Notes |
|---|---|---|
| Shared core | Kotlin Multiplatform, compiled to JVM (Android) and Kotlin/JS (Web) | tokenizer, pacing engine, stats, export/import format |
| Android UI | Kotlin + Jetpack Compose | consumes the KMP core directly |
| Web UI | TypeScript + Svelte (MIT — GPLv3-compatible) | consumes the KMP core via its Kotlin/JS output |
| Android storage | Room / SQLite | durable local DB |
| Web storage | IndexedDB | paired with export/import since it is not durable |
| PDF parsing | Readium pdfium adapter (Android) · pdf.js (Web) | open source only — never the pspdfkit adapter |
| EPUB parsing | Readium Kotlin Toolkit (Android) · epub.js (Web) | BSD-3-Clause; excludes the `readium-lcp` module (proprietary liblcp) |

Every dependency must be GPLv3-compatible. Readium's LCP module and pspdfkit adapter are deliberately excluded because they pull in proprietary code.

## Privacy

- No user text or reading data ever leaves the device; zero telemetry; no third-party data sharing.
- Minimal permissions: file/storage access for import only on Android; no overlay permission; web uses only standard file-picker/clipboard APIs.
- This is a hard commitment stated in-app and in a privacy policy, not a marketing claim.

## Development environment

A reproducible Nix dev shell provides the full toolchain — JDK 21, Gradle, Node.js 22, and the Android SDK (platform 36, build-tools 36.1.0). `ANDROID_HOME` is set automatically on entry.

```sh
nix develop          # enter the dev shell (Nix with flakes required)
```

Requirements on the host:

- Nix with flakes enabled (`nix.settings.experimental-features = [ "nix-command" "flakes" ]`)
- **nix-ld** enabled for Android's prebuilt binaries (`programs.nix-ld.enable = true`), otherwise `aapt2`/`zipalign`/`apksigner` fail to run on NixOS

The shell is pinned to a fixed nixpkgs commit in `flake.nix`, so every contributor gets identical tooling.

## Repository layout

```
flake.nix           Reproducible dev shell (Nix)
reqs.md             Living product requirements document (spec source of truth)
ROADMAP.md          Phased implementation roadmap
README.md           This file
CONTRIBUTING.md     Contribution guidelines (provisional)
LICENSE             GPLv3
```

Code modules (`core/`, Android app, web app) will be added as implementation starts.

## License

**GPLv3** — see [LICENSE](LICENSE). Fully open source: no paywalls, Pro tiers, or paid features. All features ship free to all users.

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Note that several governance questions (maintainership, DCO/sign-off, code of conduct) are still open in [reqs.md §8](reqs.md#8-open-questions).
