import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import WebViewComponent from './components/WebViewComponent';
import { requestUserPermission, onMessageListener } from './services/pushNotification';
import styles from './styles/styles';

const App = () => {
    useEffect(() => {
        requestUserPermission(); // 앱 실행 시 푸시 권한 요청
        const unsubscribe = onMessageListener(); // 포그라운드 푸시 알림 리스너 등록

        return () => {
            unsubscribe(); // 컴포넌트 언마운트 시 리스너 해제
        };
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <WebViewComponent />
        </SafeAreaView>
    );
};

export default App;