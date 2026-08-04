# DoomRead

Fully local, open source **RSVP** (Rapid Serial Visual Presentation) reader for **Android** and **Web** — consume text 2–3x faster by displaying one word at a time at a fixed focal point, with rhythm-aware pacing that preserves comprehension.

No servers. No accounts. No telemetry. Everything runs and stores on your device.

> **Status: Phase 1 complete.** The shared KMP core engine (tokenizer, pacing, stats, backup codec) is implemented and tested across JVM, JS, and Android targets. See [reqs.md](reqs.md) for full requirements and [ROADMAP.md](ROADMAP.md) for what's next.

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

## Architecture

Shared core, separate native UIs — a single Kotlin Multiplatform core keeps the pacing algorithm, WPM math, and export format identical across platforms by construction.

| Layer | Choice | Status |
|---|---|---|
| Shared core | Kotlin Multiplatform, compiled to JVM (Android) and Kotlin/JS (Web) | ✅ Done (Phase 1) |
| Android UI | Kotlin + Jetpack Compose | Todo (Phase 2) |
| Web UI | TypeScript + Svelte (MIT — GPLv3-compatible) | Todo (Phase 3) |
| Android storage | Room / SQLite | Todo (Phase 2) |
| Web storage | IndexedDB | Todo (Phase 3) |
| PDF parsing | Readium pdfium adapter (Android) · pdf.js (Web) | Todo (Phase 2+) |
| EPUB parsing | Readium Kotlin Toolkit (Android) · epub.js (Web) | Todo (Phase 2+) |

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
flake.nix               Reproducible dev shell (Nix)
core/                   KMP shared engine (tokenizer, pacing, stats, backup)
  build.gradle.kts
  src/commonMain/       Platform-independent Kotlin source
  src/commonTest/       Tests running on JVM, JS, Android
gradle/
  libs.versions.toml    Version catalog (Kotlin, AGP, serialization)
settings.gradle.kts     Root build config
reqs.md                 Living product requirements document (spec source of truth)
ROADMAP.md              Phased implementation roadmap
CONTRIBUTING.md         Contribution guidelines (provisional)
docs/dependencies.md    Dependency license audit (OQ-14)
LICENSE                 GPLv3
```

## License

**GPLv3** — see [LICENSE](LICENSE). Fully open source: no paywalls, Pro tiers, or paid features. All features ship free to all users.

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Note that several governance questions (maintainership, DCO/sign-off, code of conduct) are still open in [reqs.md §8](reqs.md#8-open-questions).
