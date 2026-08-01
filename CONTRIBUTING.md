# Contributing to DoomRead

DoomRead is a fully open source, GPLv3-licensed project. Contributions of any kind are welcome.

## Governance

This document is provisional. The requirements doc [open questions](reqs.md#8-open-questions) list several governance items still to be decided — long-term maintainership, bus-factor plan, DCO/sign-off policy, and code of conduct. Until those are resolved, the process below applies.

## Ground rules

- **Privacy is a hard commitment.** No telemetry, no analytics, no user-data collection — in code or in dependencies. Do not add anything that phones home.
- **Stay fully open source.** Do not introduce dependencies that are not GPLv3-compatible. In particular, never add Readium's `readium-lcp` module or pspdfkit adapter, or anything wrapping a commercial library.
- **Core behavior lives in `core/`.** Pacing rules, WPM math, and the export/import format must remain a single Kotlin Multiplatform implementation so Android and Web can't drift. Web UI changes should consume the shared core, not re-implement it.

## Getting started

```sh
git clone <repo-url> && cd wpm
nix develop        # or install JDK 21, Android SDK, Node 22 manually
./gradlew build    # core + Android
npm run build      # web (in webApp/)
```

## Making changes

1. Fork and create a feature branch.
2. Keep changes focused; match the existing code style (no comments unless they earn their place).
3. Add or update tests in `core/src/commonTest/` for any core logic change.
4. Run `./gradlew :core:allTests`, `npm run check`, and `npm run build` before submitting.
5. Open a PR against `main` with a clear description of the change and why.

## Reporting issues

- Bug reports: include platform, version, steps to reproduce, and expected vs. actual behavior.
- Feature requests: reference the relevant requirement ID in `reqs.md` where possible (e.g., FR-3.1).
- Security or privacy concerns: report privately to the maintainers rather than in a public issue.

## Licensing

By contributing, you agree that your contributions are licensed under GPLv3. If the project adopts a DCO/sign-off requirement (under discussion), you'll be asked to add a sign-off line to commits.
