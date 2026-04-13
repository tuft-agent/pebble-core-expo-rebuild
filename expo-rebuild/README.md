# Pebble Core Expo Rebuild

An Expo-native rebuild of the Core Devices Pebble companion app.

This app is not a mock shell anymore. It includes:

- the Expo UI / Liquid Glass front end
- an Expo native module bridge into the upstream `libpebble3` runtime
- Android transport integration
- iOS framework packaging for the Kotlin runtime so the Expo app can build and launch on iPhone targets

## Repo Layout

`expo-rebuild` must stay inside this repository. Its iOS native module builds against sibling projects from the repo root, especially `../libpebble3`.

## Current Status

- `npx tsc --noEmit` passes
- `npx expo-doctor` passes
- iOS simulator build passes
- generic iPhone device build passes with `CODE_SIGNING_ALLOWED=NO`
- simulator install and launch pass

Physical iPhone-to-Pebble Bluetooth validation still has to be done on real hardware. The simulator cannot prove that part.

## Local Setup

### Prerequisites

- Xcode with iOS platform support installed
- Java 17 available
- CocoaPods available
- Node.js / npm

### Install

From the repo root:

```bash
cd expo-rebuild
npm install
```

## Build

### iOS

Build the local iOS frameworks once before the first pod install:

```bash
cd expo-rebuild/modules/pebble-core-native/ios
PLATFORM_NAME=iphonesimulator CONFIGURATION=Debug ARCHS=arm64 ./build-pebble-frameworks.sh
```

Then generate native files and run:

```bash
cd expo-rebuild
npx expo run:ios
```

For a direct Xcode build after prebuild:

```bash
cd expo-rebuild/ios
xcodebuild -workspace PebbleCoreExpo.xcworkspace \
  -scheme PebbleCoreExpo \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
```

### Android

```bash
cd expo-rebuild
npx expo run:android
```

## Notes

- `@expo/ui` is pinned to `0.2.0-beta.9` because newer canary builds were not compatible with the Expo 54 native stack used here.
- The iOS native module packages `libpebble3` and `LibPebbleSwift` as static frameworks during the pod build.
- `expo-rebuild/modules/pebble-core-native/ios/vendor/` is generated locally and should not be committed.
