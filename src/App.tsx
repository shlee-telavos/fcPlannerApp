import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import WebViewComponent from './components/WebViewComponent';
import { requestUserPermission, onMessageListener, onTokenRefreshListener } from './services/pushNotification';
import styles from './styles/styles';

const App = () => {
    useEffect(() => {
      requestUserPermission();

      const unsubscribeOnMessage = onMessageListener();
      const unsubscribeOnRefresh = onTokenRefreshListener();

      return () => {
        unsubscribeOnMessage();
        unsubscribeOnRefresh();
      };
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <WebViewComponent />
        </SafeAreaView>
    );
};

export default App;