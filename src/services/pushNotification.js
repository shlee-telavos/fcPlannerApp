import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import DeviceInfo from 'react-native-device-info';


// 🔹 백엔드 API URL (서버 주소로 변경)
const BACKEND_API_URL = 'https://admin.fcplanner.co.kr/api/firebase';

// 🔹 푸시 알림 권한 요청 및 확인
export async function requestUserPermission() {
    try {
        const alreadyAsked = await AsyncStorage.getItem('pushPermissionAsked');

        if (alreadyAsked === null || alreadyAsked === 'false') {
            if (Platform.OS === 'android' && Platform.Version >= 33) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                );

                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    console.log('🚨 Android 13 알림 권한 거부됨');
                    await AsyncStorage.setItem('pushPermissionAsked', 'false');
                    return;
                }
            }

            // 🔹 iOS & Android 공통 푸시 권한 요청
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('✅ 푸시 알림 권한 허용됨');
                await AsyncStorage.setItem('pushPermissionAsked', 'true');

                // ✅ 디바이스 등록 후 FCM 토큰 요청 (iOS & Android 공통)
                await messaging().registerDeviceForRemoteMessages();
                await getFCMToken();
            } else {
                console.log('🚨 푸시 알림 권한 거부됨');
                await AsyncStorage.setItem('pushPermissionAsked', 'false');
            }
        } else {
            console.log('🔹 이미 권한 요청됨, 다시 요청하지 않음.');
        }
    } catch (error) {
        console.error('❌ requestUserPermission Error:', error);
    }
}

// 🔹 APNs 토큰 가져오기 (iOS 전용)
export async function getAPNSToken() {
    try {
        const apnsToken = await messaging().getAPNSToken();
        console.log('📲 APNs Token:', apnsToken);
        return apnsToken;
    } catch (error) {
        console.error('❌ getAPNSToken Error:', error);
        return null;
    }
}

// 🔹 FCM 토큰을 백엔드(Spring)에 저장하는 함수
const saveTokenToBackend = async (fcmToken) => {
    try {
        const appId = await DeviceInfo.getUniqueId()
        const API_KEY = "UIkyQR875NWqfNIyMX3V"
        const response = await axios.post(`${BACKEND_API_URL}/save-token`, {
            appId: appId,
            fcmToken: fcmToken,
        }, {
             headers: {
                 "Authorization": `${API_KEY}`,
                 "Content-Type": "application/json"
             }
        });

        console.log('✅ FCM 토큰 백엔드 저장 성공:', response.data);
    } catch (error) {
        console.error('❌ FCM 토큰 백엔드 저장 실패:', error);
    }
};

// 🔹 FCM 토큰 가져오기 (APNs 토큰 필요)
export async function getFCMToken() {
    try {
        await messaging().registerDeviceForRemoteMessages();

        if (Platform.OS === 'ios') {
            let apnsToken = await getAPNSToken();

            if (!apnsToken) {
                console.log('🕒 APNs Token이 없습니다. 3초 후 다시 시도...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                apnsToken = await getAPNSToken();
            }

            if (!apnsToken) {
                console.error('🚨 No APNs Token found, skipping FCM Token request.');
                return null;
            }
        }

        const fcmToken = await messaging().getToken();
        console.log('🚀 FCM Token:', fcmToken);

        if (fcmToken) {
            await saveTokenToBackend(fcmToken);
            await AsyncStorage.setItem('fcmToken', fcmToken);
        } else {
            console.error('🚨 FCM 토큰을 가져올 수 없습니다.');
        }

        return fcmToken;
    } catch (error) {
        console.error('❌ getFCMToken Error:', error);
        return null;
    }
}

// 🔹 포그라운드 메시지 처리 (앱이 실행 중일 때 푸시 알림을 감지)
export function onMessageListener() {
    return messaging().onMessage(async remoteMessage => {
        console.log('📩 Foreground Message:', remoteMessage);
        Alert.alert(remoteMessage.notification?.title, remoteMessage.notification?.body);
    });
}

// 🔹 특정 사용자에게 푸시 알림 보내기 (React Native → Spring API)
export const sendPushNotification = async (appId, title, content) => {
    try {
        const response = await axios.get(`${BACKEND_API_URL}/send-notification`, {
            params: {
                appId: appId,
                title: title,
                content: content,
            }
        });

        console.log('✅ 푸시 알림 전송 성공:', response.data);
    } catch (error) {
        console.error('❌ 푸시 알림 전송 실패:', error);
    }
};

// 🔹 모든 사용자에게 푸시 알림 보내기 (React Native → Spring API)
export const sendPushNotificationToAll = async (title, content) => {
    try {
        const response = await axios.get(`${BACKEND_API_URL}/send-all-notification`, {
            params: {
                title: title,
                content: content,
            }
        });

        console.log('✅ 전체 푸시 알림 전송 성공:', response.data);
    } catch (error) {
        console.error('❌ 전체 푸시 알림 전송 실패:', error);
    }
};

// 🔹 실제 사용 예시 (React Native 버튼 클릭 시 실행)
export const testPushNotification = async () => {
    await requestUserPermission();
    const fcmToken = await getFCMToken();

    if (fcmToken) {
        console.log('📩 푸시 알림 테스트 시작...');
        await sendPushNotification("myApp", "테스트 제목", "테스트 내용");
    }
};

// 🔹 모든 사용자에게 푸시 알림 보내기 테스트
export const testPushNotificationToAll = async () => {
    console.log('📢 모든 사용자에게 푸시 알림 전송 시작...');
    await sendPushNotificationToAll("공지사항", "모든 사용자에게 푸시 알림을 전송합니다.");
};