# Mobile Build Notes — Emart BD (apps/mobile)

## Expo project location

- Expo app source: `apps/mobile`
- Base directory for Expo GitHub integration: `apps/mobile`
- EAS config: `apps/mobile/eas.json`
- Expo project ID: `8b0a3cc9-2926-4fe5-8504-6c549b5dedcd`

## Android native folder

- `apps/mobile/android` is the native prebuild output and is **kept in the repo**.
- Do not delete it. EAS can build from the native folder directly.
- If Expo SDK is upgraded, run `npx expo prebuild --platform android --clean` to regenerate, then re-apply any manual native patches.

## Version sync rule

`android/app/build.gradle` `versionCode` and `versionName` **must stay in sync** with `app.json` `android.versionCode` and `version` before any production build.

Current state (2026-05-06):

| File | versionName / version | versionCode |
|---|---|---|
| `app.json` | `1.1.0` | `9` |
| `android/app/build.gradle` | `1.1.0` | `9` |

> **Note:** `eas.json` production profile uses `autoIncrement: true` and `appVersionSource: remote`. EAS will manage the version code for cloud builds. The values in `build.gradle` and `app.json` serve as the local baseline and are used for local Gradle builds.

## EAS build commands

```bash
# Development build (internal distribution)
cd apps/mobile
eas build --platform android --profile development

# Preview APK (internal distribution)
eas build --platform android --profile preview

# Production AAB for Play Store
eas build --platform android --profile production
```

## Play Console requirements

- Target API: 35 (set via `expo-build-properties` plugin in `app.json`)
- `compileSdkVersion`: 35
- `targetSdkVersion`: 35
- Do NOT sign production builds with the debug keystore (`debug.keystore`).
  Use EAS managed signing or a production keystore configured in EAS credentials.
- Before promoting from testing to production: verify versionCode is higher than
  the last Play Store upload, crash-free rate is acceptable, and staged rollout is configured.
