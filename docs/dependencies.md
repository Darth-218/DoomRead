# Dependency Audit

Tracks all runtime and build-time dependencies with their license, ensuring GPLv3 compatibility. Updated as dependencies are added. See [reqs.md §8 OQ-14](../reqs.md) for the audit requirement.

## Core module (`core/`)

| Dependency | Version | License | Compatibility | Notes |
|---|---|---|---|---|
| Kotlin Multiplatform | 2.3.20 | Apache-2.0 | ✅ | Build-time only (compiler); not shipped |
| Kotlin/JS | 2.3.20 | Apache-2.0 | ✅ | Shipped in Web build |
| Kotlin/JVM | 2.3.20 | Apache-2.0 | ✅ | Shipped in Android build |
| kotlinx-serialization-json | 1.9.0 | Apache-2.0 | ✅ | Backup codec (JSON encode/decode) |
| Android Gradle Plugin | 8.13.0 | Apache-2.0 | ✅ | Build-time only; not shipped |

## Build tooling (not shipped)

| Tool | Version | License | Notes |
|---|---|---|---|
| Gradle | 8.14.4 | Apache-2.0 | Build system |
| Nix dev shell | pinned nixpkgs | Mixed | Dev environment only; packages not shipped |

## Future additions (Phase 2+)

These will be added as they're wired in:

- **Readium Kotlin Toolkit** (BSD-3-Clause) — Android EPUB/PDF parsing (excluding `readium-lcp`)
- **Readium pdfium adapter** (BSD-3-Clause) — Android PDF rendering
- **Room/SQLite** (Apache-2.0) — Android local storage
- **Jetpack Compose** (Apache-2.0) — Android UI
- **Svelte** (MIT) — Web UI framework
- **pdf.js** (Apache-2.0) — Web PDF parsing
- **epub.js** (MIT) — Web EPUB parsing

## Excluded (never add)

| Dependency | Reason |
|---|---|
| `readium-lcp` | Depends on proprietary `liblcp` binary from EDRLab |
| pspdfkit adapter | Wraps commercial PSPDFKit library |
| Any telemetry/analytics SDK | Violates NFR-1 (zero data collection) |

## How to audit

1. Check `gradle/libs.versions.toml` for the current pinned versions
2. Verify license at the dependency's repository (Maven Central listing or GitHub)
3. Add a row to this table before merging
4. Run `./gradlew :core:allTests` to confirm nothing breaks

Last audited: 2026-08-01 (Phase 1 core engine)
