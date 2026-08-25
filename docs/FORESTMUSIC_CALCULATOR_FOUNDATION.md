# ForestMusic Calculator Foundation

**Brand:** ForestMusic  
**Purpose:** Stop rebuilding product infrastructure for every niche calculator.  
**Status:** Architecture audit (F0). Not a monorepo. Not a shared npm publish.  
**Apps inspected:** Wallpaper (`wallpaperAppRustore`) + Tile (`ceramicTilesAppRuStore`).

This document is the source of truth for how Calculator #3+ should be built.

---

## 1. Wallpaper vs Tile — what actually happened

Both apps are Expo SDK 57 / RN 0.86 / Expo Router / TypeScript / Jest.
Both follow the same *intended* layering:

```text
UI → parse/units → pure domain → presenter → i18n
services: ads / analytics / (sharing)
```

Wallpaper is **release-mature** (Phase 6 RuStore prep): real AppMetrica, Yandex Ads,
Share + PDF, privacy docs, production prebuild/signing scripts.

Tile is **calculation-mature for MVP/3B**, but still on **noop/dev stubs** for ads and
analytics, and **missing** Share, PDF, privacy hosting, and release scripts.

### Why Calculator #2 took too long

Not because tile math is uniquely hard (though Phase 3B layout-aware quantity *is*
domain-new). The main cost was **process**, not physics:

| Cost driver | Classification |
|-------------|----------------|
| Re-deriving Expo/dev-client/Android/emulator habits | **B/C** — reusable, rediscovered |
| Re-implementing decimal `,`/`.` input + Android keyboard | **B** — duplicated from Wallpaper |
| Rebuilding result card / explanation accordion / chips / fields | **B/C** — same UX language, separate code |
| Rebuilding i18n + RU pluralization | **B** — duplicated |
| Building Ads/Analytics *boundaries* then leaving them stubs | **D** — Wallpaper already solved production adapters |
| Deferring Share/PDF while reinventing adjacent UX | **D** — Wallpaper Phase 5B already shipped |
| Treating Tile Phase 3B as a second product redesign | **Process** — domain work expanded into full product cycle |
| No template / checklist that says “copy these folders from Wallpaper” | **Missing platform artifact** |

**Domain-specific work that *should* have taken time (legitimately):** tile layout-rect,
orientations, multi-wall policy, openings/diagonal/offset honesty, scheme visualization,
acceptance tests for new quantity semantics.

**Verdict:** ~40–60% of Tile calendar time was platform rediscovery and parallel UX,
not unavoidable domain invention.

---

## 2. Capability comparison

| Capability | Wallpaper | Tile | Shared? | Recommended action |
|------------|-----------|------|---------|-------------------|
| Expo SDK 57 + CNG `app.config.ts` | Yes | Yes (near twin) | Yes | **Template** — copy app.config pattern; swap identity |
| Expo Router shell | Quick + Precise routes | Single index route | Yes (shell) | Template `_layout` + one calculator route |
| TypeScript / ESLint / Jest gates | Yes | Yes | Yes | Template `package.json` scripts + jest config |
| Pure domain in mm | `domain/wallpaper` | `domain/tile` | Pattern only | **Keep separate** — never one formula engine |
| Numeric input `,` / `.` | `units/parse-decimal-input.ts` + keyboard props | Same pattern | **Yes** | Standardize on Wallpaper+Tile union; template owns it |
| Dimension field / chips | Feature-local | Feature-local | **Yes** | Extract small UI kit into template `src/ui/` |
| Screen container / theme tokens | Yes | Yes | **Yes** | Template |
| Result hero + breakdown | Presenter → card | Presenter → card | **Yes** | Common *presentation* types; calculator presenter fills them |
| Explanation accordion | Trace → steps | Trace → steps | **Yes** | Shared `ExplanationSection` |
| Visualization | Precise `WallPreview` only | `LayoutScheme` grid | Slot only | **Optional slot**; no universal drawing engine |
| Share (text) | Mature | **Missing** | **Yes** | **FOUNDATION FIRST** — copy Wallpaper `services/sharing` |
| PDF report | HTML via expo-print; no recalc | **Missing** | **Yes** | **FOUNDATION FIRST** — copy report pipeline |
| Analytics AppMetrica | Real + Safe/Noop/Dev | Stub/Dev only | **Yes** | Copy Wallpaper adapters; Tile events stay tile-specific |
| Ads Yandex | Real banners + Safe | Noop only | **Yes** | Copy Wallpaper adapters + `ResultBanner` |
| Privacy docs | Yes | **Missing** | **Yes** | Template privacy MD/HTML with placeholders |
| Android production prebuild | Scripts | Missing | **Yes** | Copy `scripts/*` into template |
| Signing / AAB verify | Scripts + credentials README | Missing | **Yes** | Template checklist; app-specific keystore outside git |
| RuStore listing/release docs | Mature | Roadmap only | **Yes** | Generic checklist + per-app listing stub |
| Persistence | Memory stub | None | Later | Defer until Calculator #3 needs it |
| RU pluralization | `i18n/pluralize.ts` | Same idea | **Yes** | Template |

---

## 3. Domain boundary (must stay calculator-specific)

### Always calculator-specific

- Domain formulas and types (`domain/<product>/`)
- Acceptance/reference tests for those formulas
- Input form model + `parse-*-form.ts`
- Domain → presentation mapper (presenter)
- Calculator-specific i18n strings (surface labels, explanation bodies)
- Optional visualization component
- Product id, Android package, icons, splash, store listing copy
- Production AppMetrica key, Yandex unit IDs, keystore

### Never put in a “generic formula engine”

- Wallpaper strip/roll planning
- Tile layout-rect / edge reuse / corner policy
- Future concrete volume / rebar / electricity math

### Shared presentation contract (not shared math)

```text
PresentedResult
  hero: { heading, value, unit }
  lines: { id, text }[]          // breakdown; packaging-aware rules
  sections?: { title, lines }[]
  explanationSteps: { title, body }[]
  phaseNote?: string
  visualization?: unknown        // opaque; shell renders slot only
  warnings?: string[]
```

Calculator presenter produces this. Shared UI renders it.
Share/PDF consume a related **export/report snapshot** built from the same presented
data — **never** re-run domain `calculate()`.

---

## 4. What should NOT be generalized

- Wallpaper Precise Mode multi-route UX as the default shell (Tile is one screen)
- Wallpaper pattern-match / half-drop education UI
- Wallpaper decorative background as mandatory brand chrome
- A plugin registry / DI container / schema DSL for “any calculator”
- Shared 2D CAD / cutting-stock library
- Forced monorepo coupling of release cycles
- One npm package for five StyleSheet components

---

## 5. Target foundation structure (boring template)

Preferred delivery: **template repository** (or a local `calculator-template/` directory
copied into a new repo). Not a monorepo. Not a published multi-package workspace.

```text
forestmusic-calculator-template/
  AGENTS.md
  docs/
    FORESTMUSIC_CALCULATOR_FOUNDATION.md   # this file
    PRODUCT_SPEC.template.md
    ARCHITECTURE.md
    ROADMAP.md
    DECISIONS.md
    ADS.md
    ANALYTICS.md
    SHARING_AND_REPORTS.md
    PRIVACY_POLICY_RU.md / EN.md / privacy.html
    RUSTORE_RELEASE.md
    RUSTORE_LISTING.template.md
  scripts/
    prebuild-android-production.cjs
    restore-dev-autolinking.cjs
    apply-release-signing.cjs
    verify-release-signing.cjs
  credentials/
    README.md
    keystore.properties.example
  .env.example
  app.config.ts                 # identity via config + env
  package.json
  src/
    bootstrap.ts
    app/_layout.tsx
    app/index.tsx               # mounts feature calculator screen
    components/screen-container.tsx
    ui/                         # small ForestMusic kit
      dimension-field.tsx
      chip-row.tsx
      section-card.tsx
      primary-button.tsx
      calculation-result.tsx    # consumes PresentedResult
      explanation-section.tsx
      result-banner-slot.tsx
    units/
      length.ts
      parse-decimal-input.ts
      decimal-input-text.ts
    i18n/
      index.ts
      pluralize.ts
      locales/{ru,en}.ts        # shell strings + empty calculator namespace
    theme/
    config/
      app-config.ts
      env.ts
      ads-config.ts
    services/
      index.ts
      ads/                      # interface + Safe + Noop + Yandex
      analytics/                # interface + Safe + Noop/Dev + AppMetrica
      sharing/                  # text + PDF via expo-print/sharing
    domain/_template/           # stub calculate() + tests
    features/_template/         # screen + parse + presenter + optional viz
```

New calculator: **copy template → rename identity → replace `domain/` + `features/` +
strings + tests**.

---

## 6. Common UI primitives (extract only what both use)

| Primitive | Wallpaper | Tile | Extract? |
|-----------|-----------|------|----------|
| `ScreenContainer` | Yes | Yes | Yes |
| Theme tokens | Yes | Yes (similar teal) | Yes (one ForestMusic palette) |
| `DimensionField` | Yes | Yes | Yes |
| Chip / segmented selector | Preset radios / selectors | `ChipRow` | Yes (`ChipRow`) |
| Optional section + Switch | Inline | `OptionalSection` | Yes |
| Primary Calculate CTA | Yes | Yes | Yes |
| Result card (hero + lines) | Yes | Yes | Yes |
| Explanation accordion | Yes | Yes | Yes |
| Add/remove wall/opening rows | Precise walls | Walls editor | Pattern yes; keep feature-local lists |
| Diagram container | WallPreview | LayoutScheme | **Slot only** |
| Share button/sheet | Yes | No | Yes (after F2) |
| Banner ad slot | `ResultBanner` | No | Yes (after F3) |

---

## 7. Numeric input — platform infrastructure

**Standardize on the existing dual-app pattern** (already nearly identical):

1. Store draft strings in the form (never silently rewrite `4,` while typing).
2. Parse on calculate via `parseUserDecimalNumber` / mm converters.
3. Android: `keyboardType: 'default'` + `inputMode: 'text'` so locale comma reaches JS.
4. Reject incomplete drafts (`4,`) as invalid format.

**Owner:** template `src/units/` + `src/ui/dimension-field.tsx` + decimal keyboard props.  
Future calculators must not re-implement this.

**Action:** When creating the template, take the **stricter union** of Wallpaper + Tile
parsers (keep Tile’s `NEGATIVE` if useful; keep Wallpaper’s documented meter precision
rules if they matter for that product).

---

## 8. Share / PDF strategy

### Wallpaper reality (keep this architecture)

```text
domain result
  → presenter (UI strings)
  → build-*-report (CalculationReportModel snapshot)
  → format-text-report / format-pdf-html
  → ShareService (RN Share / expo-print / expo-sharing)
```

PDF **does not recalculate**. Reports are snapshots.

### Tile / future

1. **FOUNDATION FIRST:** copy `services/sharing/*` and the report *pipeline* types.
2. Calculator provides `buildTileReport(presented, form) → ReportModel`.
3. Shared formatters render sections/lines.

### Classification

| Feature | Action |
|---------|--------|
| Share text | FOUNDATION FIRST, then Tile adapts |
| PDF HTML | FOUNDATION FIRST, then Tile adapts |
| Rewarded-ad gate on PDF | DEFER (Wallpaper reserved `future_pdf_reward`, unused) |

---

## 9. Analytics strategy

Copy Wallpaper’s adapter triad:

```text
AnalyticsService
  SafeAnalyticsService(AppMetrica | Dev | Noop)
```

Common events (keep small):

- `app_open`
- `calculator_opened` / screen
- `calculation_completed` / `calculation_failed`
- `share_opened` / PDF lifecycle (when Share exists)
- `explanation_opened`
- ad lifecycle (when Ads exist)

Calculator-specific events stay minimal (Tile already has surface/layout/package/price
categorical events — good pattern; keep privacy: **no raw dimensions**).

Production keys: per-app `.env`, never in template git.

---

## 10. Ads strategy

Copy Wallpaper:

- Placements: `RESULT_BANNER`, `FOOTER_BANNER` (one unit is fine initially)
- `__DEV__` / Jest → demo unit IDs or noop
- Production → `EXPO_PUBLIC_YANDEX_*` or fail-open disable
- UI never imports Yandex SDK directly — only `ResultBanner` / `AdService`

Do **not** invent interstitial/app-open for niche calculators unless measured.

---

## 11. Release strategy (template checklist)

Promote Wallpaper’s release knowledge into reusable docs/scripts:

1. Identity: `app.config.ts` name, slug, scheme, `android.package`, versionCode
2. `npm run validate` (lint / typecheck / test)
3. Production prebuild excluding expo-dev-client
4. Local keystore **outside** repo; `keystore.properties` gitignored
5. `assembleRelease` / AAB + verify script
6. Permissions dump review
7. Privacy URL + analytics/ads disclosure
8. Screenshots / listing copy
9. RuStore upload + smoke on release build

Each app keeps its own keystore, package ID, and store listing.

---

## 12. Recommended reuse mechanism (ONE choice)

### Choice: **Template repository** (or copyable template directory)

**Why this wins for ForestMusic:**

- Separate RuStore apps, packages, signing, and release cycles
- Cursor/Codex workflows are folder/repo based — a template clone is obvious
- Avoids monorepo CI/version coupling and “shared package churn”
- Accepts small intentional duplication after clone (speed > perfect DRY)
- Matches how Wallpaper → Tile was *intended* to work, but never formalized

### Rejected for now

| Option | Why not (yet) |
|--------|----------------|
| Monorepo | Couples release; overkill for 2–5 small apps |
| Published shared npm | Overhead for ~10 UI files + adapters |
| Runtime plugin registry | Enterprise smell; violates “boring” |

Optional later: a private git submodule or `packages/calculator-kit` **only if**
three apps prove painful drift. Do not start there.

---

## 13. Calculator #3 workflow (acceptance criterion)

Hypothetical: **Concrete Calculator** (`com.calculatorplatform.concrete`).

1. Clone/copy `forestmusic-calculator-template` → new repo `concreteAppRuStore`
2. Change identity: name, package, icons, `.env.example`, listing stub
3. Implement `src/domain/concrete/` (`calculateConcrete`, validate, tests)
4. Implement `src/features/concrete/` form + `parse-concrete-form` + presenter
5. Fill `i18n` calculator strings (RU first)
6. Optional: simple illustration in visualization slot (or none)
7. Wire analytics event names if any product-specific ones are needed
8. `npm run validate` + Android debug smoke
9. Later: enable AppMetrica/Ads env; Share/PDF via shared services already in template
10. Release via checklist + scripts

### Files Calculator #3 should need to change

```text
app.config.ts
src/config/app-config.ts
assets/icons/*
src/domain/concrete/**          # NEW
src/features/concrete/**        # NEW
src/i18n/locales/ru.ts + en.ts  # calculator namespace
docs/PRODUCT_SPEC.md
docs/RUSTORE_LISTING.md
.env (local)
credentials (local keystore)
```

### Files Calculator #3 should NOT recreate

```text
src/units/**
src/ui/**
src/services/ads/**
src/services/analytics/**
src/services/sharing/**
src/i18n/pluralize.ts
scripts/**
docs/RUSTORE_RELEASE.md
docs/ADS.md / ANALYTICS.md / SHARING_AND_REPORTS.md
decimal keyboard behavior
result/explanation shell components
```

If #3 still rebuilds those, the foundation failed.

---

## 14. Staged migration plan

### Foundation F0 — Audit + contract ✅ (this document)

- Wallpaper ↔ Tile comparison
- Presentation / share / ads / analytics / release contracts
- Reuse mechanism chosen: template repo

### Foundation F1 — Template skeleton (next real work)

- Create `forestmusic-calculator-template` from Wallpaper shell **minus** wallpaper domain
- Include Tile-proven UI pieces (`ChipRow`, optional sections) where cleaner
- Document “New calculator” checklist in AGENTS.md
- Do **not** move Tile mid-flight into the template yet

### Foundation F2 — Share / PDF in template

- Port Wallpaper `services/sharing` + report types/formatters
- Prove with Wallpaper still green; then add Tile report builder (thin)

### Foundation F3 — Analytics / Ads adapters in template

- Port Wallpaper Safe/Yandex/AppMetrica stacks
- Tile switches from stubs to real adapters behind env (no formula changes)

### Foundation F4 — Release template

- Scripts + privacy + RuStore checklist parameterized by app id

### Foundation F5 — Proof: scaffold Calculator #3

- Create Concrete (or chosen #3) from template to time-box MVP path
- Measure: days to interactive Android MVP with domain stub

---

## 15. Missing mature Wallpaper features — Tile actions

| Feature | Classification | Why |
|---------|----------------|-----|
| Share text | **FOUNDATION FIRST** | Don’t invent a Tile-only Share; copy Wallpaper service |
| PDF report | **FOUNDATION FIRST** | Same pipeline; Tile only supplies snapshot content |
| AppMetrica | **FOUNDATION FIRST** then wire Tile env | Adapters exist; Tile stubs are placeholders |
| Yandex Ads | **FOUNDATION FIRST** then wire Tile env | Same |
| Privacy policy docs | **COPY/ADAPT NOW** (docs-only) | Low risk; needed before RuStore anyway |
| Release scripts | **FOUNDATION FIRST** | Parameterize from Wallpaper scripts |
| Persistence | **DEFER** | Neither app depends on it for MVP value |
| Precise multi-route shell | **DEFER** | Not the Tile product shape |

**Do not** pause Tile Phase 3B commit for foundation work. Stabilize/commit Tile 3B,
then extract template from the *union* of mature Wallpaper + polished Tile UI.

---

## 16. Tile Phase 3B impact

| Area | Change for foundation? |
|------|------------------------|
| `domain/tile/**` | **No** — leave layout-aware engine alone |
| `layout-scheme*` | **No** — stays Tile visualization |
| Presenter / result card | Optional later align to `PresentedResult` type — **after** 3B commit |
| `units/` / decimal keyboard | Keep; becomes template standard |
| Ads/analytics stubs | Replace with Wallpaper adapters in F3 — not during 3B polish |
| Share/PDF | Add in F2 — not blocking 3B |

**Immediate guidance:** Finish Phase 3B review/commit on Tile as a product milestone.
Treat foundation extraction as the **next** track, sourced primarily from Wallpaper
plus Tile UI improvements (scheme, plurals, chips).

---

## 17. Immediate next step (ONE)

**Create the template repository skeleton (F1) by cloning Wallpaper, deleting
`domain/wallpaper` + wallpaper feature routes, and replacing them with a stub
calculator — without touching Tile’s uncommitted Phase 3B tree.**

Until that template exists, every new calculator will keep costing a “second product”
cycle.

---

## 18. Success metric

Calculator #3 reaches:

- interactive Android debug build
- domain tests green
- result + explanation UI
- decimal input with comma
- standard quality gates

**without** re-deriving Share/PDF/Ads/Analytics/release/input infrastructure.

Domain difficulty may still take days. Platform rediscovery should not.
