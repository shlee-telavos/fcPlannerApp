# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native 기본 규칙
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

# react-native-geolocation-service
-keep class com.reactnativecommunity.geolocation.** { *; }
-dontwarn com.reactnativecommunity.geolocation.**

# react-native-webview
-keep class com.reactnativecommunity.webview.** { *; }
-keep public class * extends android.webkit.WebView { *; }
-dontwarn com.reactnativecommunity.webview.**

# react-native-inappbrowser-reborn
-keep class com.proyecto26.inappbrowser.** { *; }
-dontwarn com.proyecto26.inappbrowser.**

# react-native-device-info
-keep class com.learnium.RNDeviceInfo.** { *; }
-dontwarn com.learnium.RNDeviceInfo.**
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

-dontwarn androidx.**
-keep class androidx.** { *; }
-keep class com.google.** { *; }
-keep class com.facebook.** { *; }