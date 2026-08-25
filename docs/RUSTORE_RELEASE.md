# RuStore release checklist — Tile Calculator

## Before production prebuild

- [ ] Identity: `Калькулятор плитки` / `com.calculatorplatform.tile` / 1.0.0 / versionCode 1
- [ ] Icons: launcher + adaptive + splash from `assets/icon_gpt.png` master
- [ ] Privacy URL live (HTTPS)
- [ ] Analytics / ads production IDs only in CI secrets or local `.env` (not git)
- [ ] Keystore ready for **this** package (`credentials/README.md`)

## Build (next task)

```powershell
$env:APP_VARIANT = "production"
$env:KEEP_PRODUCTION_AUTOLINKING = "1"
# Windows: build from a short real path (e.g. D:\t) if CMake hits MAX_PATH (~260).
# Do not use subst (RN codegen “different roots”).
npm run prebuild:android:production
npm run apply:release-signing
npm run verify:release-signing
# then Gradle bundleRelease from generated android/
```

Verified AAB (local, not in git): `release-artifacts/tile-1.0.0-v1.aab`

Production release blocks `SYSTEM_ALERT_WINDOW` via `android.blockedPermissions` when `APP_VARIANT=production`.

## Verify AAB

- [ ] Package matches `com.calculatorplatform.tile`
- [ ] versionName / versionCode match listing
- [ ] Signing certificate registered in RuStore
- [ ] Manifest permission audit (see below)

## Permissions (debug APK audit + production expectations)

Observed on **debug** merged APK (dev-client present):

| Permission | Purpose | Release note |
|------------|---------|--------------|
| `INTERNET` | Network | Required (ads / analytics) |
| `ACCESS_NETWORK_STATE` | Network | Required (SDK) |
| `com.google.android.gms.permission.AD_ID` | Yandex Mobile Ads | Expected in release |
| `com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE` | AppMetrica / install referrer | Expected in release |
| `VIBRATE` | Expo template | Harmless |
| `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` (`maxSdkVersion=32`) | Expo legacy storage | Legacy API ≤32 only |
| `CHANGE_WIFI_MULTICAST_STATE` | Expo / networking | Dev-leaning; re-check release merge |
| `SYSTEM_ALERT_WINDOW` | Expo CNG + **debug** manifests (`app/src/debug`) | Dev overlay / template; **re-check RELEASE merged manifest** at AAB verify (Wallpaper same Expo pattern) |
| App-scoped `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` | AndroidX | Normal |

Production prebuild excludes `expo-dev-*`; confirm `SYSTEM_ALERT_WINDOW` and multicast are absent or justified in the **release** merge before RuStore upload.

## After publication

- [ ] Add RuStore URL to Yandex Advertising Network
- [ ] `npm run restore:dev-autolinking` for local work
