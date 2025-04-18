This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Step 1: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

### For iOS

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Step 3: Modifying your App

Now that you have successfully run the app, let's modify it.

1. Open `App.tsx` in your text editor of choice and edit some lines.
2. For **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Developer Menu** (<kbd>Ctrl</kbd> + <kbd>M</kbd> (on Window and Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (on macOS)) to see your changes!

   For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator to reload the app and see your changes!

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [Introduction to React Native](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

# Create and setting
npx react-native init fcPlannerApp
npm i
cd ios
pod install
# Start android
cd ..
npx react-native start
a
# Start ios
cd ios
open fcPlannerApp.xcworkspace
(Click!) clean build folder
(Click!) run
cd ..
npx react-native run-ios
npx react-native start
i
# Reset Android build cash
cd android
./gradlew clean
cd ..
# Make android apk file
cd android
./gradlew clean
./gradlew assembleRelease
cd ..
-> (Create!) android/app/build/outputs/apk/release/app-release.apk
# Make android aab file
cd android
./gradlew clean
./gradlew bundleRelease
cd ..
-> (Create!) android/app/build/outputs/bundle/release/app-release.aab
# Clean and Rebuild APK
cd android
./gradlew clean
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
cd ..
# Restart Emulater 
adb emu kill
adb kill-server
adb start-server
# Create Metro Bundeler Forcing
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/
# Reset Metro Bundeler
npx react-native start --reset-cache
# Create KeyStore
(구버전)
keytool -genkeypair -v -keystore fcPlanner-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias fcPlanner-key-alias
다음에 대해 유효 기간이 10,000일인 2,048비트 RSA 키 쌍 및 자체 서명된 인증서(SHA256withRSA)를 생성하는 중
: CN=sohwi lee, OU=개발팀, O=제2의문, L=관악구, ST=서울, C=82
# Get KeyStore info
keytool -list -v -keystore /Users/isohwi/Desktop/development/study/react-native/fcPlannerApp/android/app/fcPlanner-release-key.jks