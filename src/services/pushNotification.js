import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import DeviceInfo from 'react-native-device-info';

// 🔹 백엔드 API 주소
const BACKEND_API_URL = 'https://admin.fcplanner.co.kr/api/firebase';
const API_KEY = 'UIkyQR875NWqfNIyMX3V';

// 🔹 서버에 FCM 토큰 저장
const saveTokenToBackend = async (fcmToken) => {
  try {
    const appId = await DeviceInfo.getUniqueId();

    const response = await axios.post(`${BACKEND_API_URL}/save-token`, {
      appId,
      fcmToken,
    }, {
      headers: {
        'Authorization': API_KEY, // 또는 'x-api-key'로 서버와 맞춰도 됨
        'Content-Type': 'application/json',
      }
    });

    console.log('✅ FCM 토큰 백엔드 저장 성공:', response.data);
  } catch (error) {
    console.error('❌ FCM 토큰 백엔드 저장 실패:', error);
  }
};

// 🔹 FCM 토큰 요청 + 저장
export async function getFCMToken() {
  try {
    await messaging().registerDeviceForRemoteMessages();
    const fcmToken = await messaging().getToken();

    if (fcmToken) {
      console.log('🚀 FCM Token:', fcmToken);
      await saveTokenToBackend(fcmToken);
      await AsyncStorage.setItem('fcmToken', fcmToken);
    } else {
      console.error('⚠️ FCM 토큰을 가져올 수 없습니다.');
    }

    return fcmToken;
  } catch (error) {
    console.error('❌ getFCMToken Error:', error);
    return null;
  }
}

// 🔹 푸시 알림 권한 요청
export async function requestUserPermission() {
  try {
    const alreadyAsked = await AsyncStorage.getItem('pushPermissionAsked');

    if (!alreadyAsked || alreadyAsked === 'false') {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('🚫 Android 알림 권한 거부됨');
          await AsyncStorage.setItem('pushPermissionAsked', 'false');
          return;
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ 푸시 알림 권한 허용됨');
        await AsyncStorage.setItem('pushPermissionAsked', 'true');
        await getFCMToken();
      } else {
        console.log('🚫 푸시 알림 권한 거부됨');
        await AsyncStorage.setItem('pushPermissionAsked', 'false');
      }
    } else {
      console.log('🔁 이미 권한 요청함, 재요청 안함');
    }
  } catch (error) {
    console.error('❌ requestUserPermission Error:', error);
  }
}

// 🔹 토큰 갱신 시 서버에도 업데이트
export function onTokenRefreshListener() {
  return messaging().onTokenRefresh(async newToken => {
    console.log('🔄 FCM 토큰 갱신됨:', newToken);
    await AsyncStorage.setItem('fcmToken', newToken);
    await saveTokenToBackend(newToken);
  });
}

// 🔹 포그라운드 알림 수신 처리
export function onMessageListener() {
  return messaging().onMessage(async remoteMessage => {
    console.log('📩 Foreground Message:', remoteMessage);
    Alert.alert(remoteMessage.notification?.title || '알림', remoteMessage.notification?.body || '');
  });
}