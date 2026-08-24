# Калькулятор плитки

Android-first ceramic tile quantity calculator for RuStore.

The app opens directly on the calculator. No account, no onboarding, no network required for the calculation.

## Prerequisites

- Node.js 22+
- Android Studio / JDK 17 for native builds
- Android SDK (`ANDROID_HOME`)

## Setup

```bash
npm install
```

## Scripts

```bash
npm start                 # Expo dev server
npm run android           # Development build on device/emulator
npm run lint
npm run typecheck
npm test
npm run validate          # lint + typecheck + test
```

## Architecture

```text
UI form strings → parse/normalize → validate → domain calculate → presenter → UI
```

Business formulas live in `src/domain/tile` and must not be duplicated in React components.

## Docs

- [AGENTS.md](AGENTS.md) — rules for developers and AI agents
- [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) — frozen v1.0 product spec
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/ROADMAP.md](docs/ROADMAP.md)
- [docs/DECISIONS.md](docs/DECISIONS.md)
