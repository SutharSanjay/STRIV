# STRIV

STRIV is a strength-training app for one person and one phone.

Train with intent. Progress with purpose.

Version **0.1.0** is a testing build. It is not a store release. Workouts, records, and body weight stay on the device. There are no accounts, ads, analytics, or a network API. Android Auto Backup does not include the training database.

Source: [github.com/SutharSanjay/STRIV](https://github.com/SutharSanjay/STRIV)

Android package id and iOS bundle id: `com.sutharsanjay.striv`

## What you can do

- Start from a built-in program, including Push Pull Legs Custom, or build a split of your own.
- Log weight and reps. A set counts only after it is marked complete.
- The next session uses double progression: add a rep inside the range, then add weight when every required set reaches the top.
- Finished workouts keep the names and targets from that day, even if the split changes later.
- Progress shows the session streak, weekly volume, records, and body weight. Sunday can be a rest day without breaking the streak.
- Save a backup file and restore it later. The save dialog opens on Today when the last successful backup is at least 7 days old. STRIV does not write a backup by itself while the app is closed.

Deleting the app deletes its database. A backup file you saved outside the app is what you restore from.

## Requirements

- Node.js 22.14.0 (`nvm use`, from `.nvmrc`)
- JDK 17 or newer
- Android: SDK with compile SDK 37, build-tools 37.0.0, and NDK 27.1.12297006. `ANDROID_HOME` must point at the SDK. Minimum Android version is 24.
- iOS: a Mac with Xcode 26. CocoaPods is the supported path. An iOS archive cannot be made on Linux.

## Run it

```sh
git clone https://github.com/SutharSanjay/STRIV.git
cd STRIV
nvm use
npm install
```

Start Metro in one terminal:

```sh
npm start
```

Android, with a device or emulator connected:

```sh
npm run android
```

If Gradle cannot find the SDK, create `android/local.properties` with one line, using your own SDK path:

```
sdk.dir=/path/to/Android/Sdk
```

That file is not part of the repository.

A debug package, signed only with the debug keystore included for local installs, is:

```sh
cd android && ./gradlew assembleDebug
```

The file is `android/app/build/outputs/apk/debug/app-debug.apk`. This repository does not contain a release signing key. Install the debug package, then keep Metro running so the app can load.

On a Mac, install pods once, then open the workspace:

```sh
bundle install
cd ios && bundle exec pod install
open STRIV.xcworkspace
```

In Xcode, select the STRIV scheme and your iPhone, then run. Re-running the same bundle id keeps the existing database. The first iOS build needs the pods above because backup uses the document picker.

## Checks

```sh
npm run typecheck
npm test
npm run lint
```

Tests need Node's experimental SQLite flag. `npm test` sets that already.

## Using a workout

1. Open Programs and tap **Use this program**, or create a split and add days.
2. On Today, start the scheduled day. On a rest day you can still train one of the split's days.
3. Enter weight and reps, then mark each set complete. Finish the workout only after at least one set is complete.
4. Progress and History update from finished workouts. Open an exercise to see its weight chart after two logged sessions.
5. Back up from Today or Progress when you want a file you can keep if the app is removed.
