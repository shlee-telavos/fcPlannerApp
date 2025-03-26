import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import { Alert } from 'react-native';

function useNotificationListener() {
    useEffect(() => {
        // 🔹 앱이 실행 중일 때(Foreground) 푸시 알림 감지
        const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
            Alert.alert(remoteMessage.notification?.title, remoteMessage.notification?.body);
        });

        // 🔹 앱이 백그라운드에 있다가 알림을 통해 열렸을 때 이벤트 처리
        const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('Notification caused app to open from background:', remoteMessage);
        });

        // 🔹 앱이 완전히 종료된 상태(Quit)에서 알림을 통해 열렸을 때 이벤트 처리
        const unsubscribeOnInitialNotification = messaging().getInitialNotification()
            .then(remoteMessage => {
                if (remoteMessage) {
                    console.log('Notification caused app to open from quit state:', remoteMessage);
                }
            });

        // 🔹 컴포넌트 언마운트 시 이벤트 리스너 정리
        return () => {
            unsubscribeOnMessage();
            unsubscribeOnNotificationOpenedApp();
        };
    }, []);
}

export default useNotificationListener;