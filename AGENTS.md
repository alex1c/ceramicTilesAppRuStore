# Calculator Platform — Tile Calculator

> **Source of truth for AI agents and developers.** Read this file before substantial work.

## What this is

Commercial **Calculator Platform** — a family of separate niche Android calculator apps.
This product is **Калькулятор плитки** (ceramic tile quantity calculator).

**Business goal:** validate ad-monetized niche calculators on **RuStore (Russia-first)** and measure **Revenue per Install**.

Wallpaper Calculator (`wallpaperAppRustore`) is the first sibling app. This repo is a **separate product**, not a monorepo package. Copy proven patterns; do not couple the two apps at runtime.

## Current phase

**Phase 3 — Calculator MVP UX** (in progress with Phase 2 engine)

Phase 0 product spec is frozen in `docs/PRODUCT_SPEC.md`.
Phase 1 foundation + Phase 2 calculation engine ship together in this repository bootstrap.

## Tech stack

| Layer | Choice |
|-------|--------|
| Runtime | Expo SDK 57, React Native 0.86, React 19 |
| Navigation | Expo Router (`src/app/`) |
| Target | Android-first, **Development Build** (not Expo Go) |
| Language | TypeScript (strict) |
| Tests | Jest |
| Lint | ESLint (eslint-config-expo) |

Verify exact versions in `package.json`.

## Architecture rules

1. **UI** must not import Yandex/AppMetrica/native ad SDKs directly.
2. **Domain/calculation** code lives in `src/domain/tile` — pure TypeScript, no React/Expo.
3. **Ads** go through `AdService` (`src/services/ads/`).
4. **Analytics** go through `AnalyticsService` (`src/services/analytics/`).
5. **User-facing strings** only via `src/i18n/` — no hardcoded copy in components.
6. **Canonical lengths** in domain are **millimeters**; UI converts/displays.
7. **No fake precision** — v1.0 does not simulate physical tile placement; layout only changes recommended reserve.
8. **No secrets** in git — use `.env.example` + local `.env` (gitignored).

## Do NOT

- Commit or push without explicit user instruction
- Add production ad unit IDs, AppMetrica keys, or API secrets
- Put tile formulas inside React components
- Implement 2D editors, AR, grout/adhesive, L-shaped geometry (see PRODUCT_SPEC non-goals)
- Silently override documented decisions — update `docs/DECISIONS.md` instead

## Read next

| Document | Purpose |
|----------|---------|
| [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) | Frozen v1.0 product + calculation spec, acceptance cases |
| [docs/PRODUCT_STRATEGY.md](docs/PRODUCT_STRATEGY.md) | Portfolio context |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layer boundaries |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phased delivery |
| [docs/DECISIONS.md](docs/DECISIONS.md) | ADR log |
| [README.md](README.md) | Setup and scripts |

> Before doing substantial work, read **AGENTS.md** and the documents it references.
> Do not override documented architectural/product decisions silently.
> If a decision must change, update **DECISIONS.md** with the reason.

## Validation commands

```bash
npm install
npm run lint
npm run typecheck
npm test
```

## Local Android environment (Windows)

Set per shell session before native builds:

```powershell
$env:JAVA_HOME = "<path-to-jdk-17>"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
```

Generated `android/` and `ios/` are **not** source of truth — regenerate via `expo prebuild`.

## Entry points

- App entry: `index.ts` → `src/bootstrap.ts` → `expo-router/entry`
- Routes: `src/app/`
- Product config: `src/config/app-config.ts`
