/**
 * Credentials for Tile Calculator production signing.
 *
 * Never commit real keystores, `keystore.properties`, or passwords.
 * `credentials/keystore.properties` is gitignored.
 */

## Per-product keystore

Tile package: `com.calculatorplatform.tile`

Suggested local (outside repo) layout:

| Item | Example |
|------|---------|
| Keystore file | `%USERPROFILE%\secure\calculator-platform\tile-release.jks` |
| Alias | `tile` |
| Package | `com.calculatorplatform.tile` |

Generate (only if no Tile production keystore exists yet):

```powershell
keytool -genkeypair -v -storetype PKCS12 `
  -keystore "$env:USERPROFILE\secure\calculator-platform\tile-release.jks" `
  -alias tile `
  -keyalg RSA -keysize 2048 -validity 10000
```

Copy `keystore.properties.example` → `keystore.properties` and fill absolute
`storeFile` paths. Then:

```bash
npm run apply:release-signing
npm run verify:release-signing
```

See `docs/RUSTORE_RELEASE.md` for AAB / RuStore certificate steps.
