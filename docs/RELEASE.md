# Release (Android)

> Started in phase 6. Store listing steps (Bazaar, Myket), screenshots, age rating, privacy policy
> and chest-odds disclosure are added when the release step of phase 6 is done.

## Prerequisites
- JDK 21, Android SDK (platform 36, build-tools), `apps/client/android/local.properties` with `sdk.dir=…`.
- `VITE_API_URL` = the production server (Hamravesh), e.g. `https://api.example.ir`. Without it the
  build is the offline development build (fake server + test tools) — never upload that.

## Signing key (once)
```
keytool -genkeypair -v -keystore chakachak-release.jks -alias chakachak \
  -keyalg RSA -keysize 4096 -validity 10000
```
Keep the `.jks` and passwords **outside the repository** and back them up in two places: losing the
key means the app can never be updated in the stores. Then create `apps/client/android/keystore.properties`
(git-ignored):
```
storeFile=/absolute/path/chakachak-release.jks
storePassword=…
keyAlias=chakachak
keyPassword=…
```

## Build
```
VITE_API_URL=https://api.example.ir pnpm android:release
```
Outputs (one per store, each with its own billing library):
- `apps/client/android/app/build/outputs/bundle/{bazaar,myket}Release/*.aab`
- `apps/client/android/app/build/outputs/apk/{bazaar,myket}/release/*.apk`

## Build on GitHub (preferred)
`.github/workflows/android.yml` builds the Bazaar APK + AAB on every push to `main` touching the app
(or by hand: Actions → Android → Run workflow, on any branch) and publishes them in Releases.
- Secrets (Settings → Secrets and variables → Actions): `ANDROID_KEYSTORE_BASE64` (`base64 -w0
  chakachak-release.jks`), `ANDROID_KEYSTORE_PASSWORD` (key password is the same; alias `chakachak`).
  Without them the run makes a debug APK only.
- Variable `VITE_API_URL` overrides the server (default `https://chakachak.darkube.ir`).
- `versionCode` = run number + 5, so every run is a valid Bazaar upload.

Before every local upload bump `versionCode` in `apps/client/android/app/build.gradle` and `version` in
`apps/client/package.json` (it becomes `versionName` and is sent with error reports).

## App identity
- Application id: `ir.chakachak.game` (cannot change after the first store upload).
- Name «چکاچک», portrait only. Icons/splash: `python3 tools/art/android.py`.
