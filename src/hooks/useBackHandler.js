import { useEffect } from 'react';
import { Alert, BackHandler } from 'react-native';

const useBackHandler = (canGoBack, webViewRef) => {
    useEffect(() => {
        const handleBackPress = () => {
            if (webViewRef.current && canGoBack) {
                webViewRef.current.goBack();
                return true;
            } else {
                Alert.alert(
                    '앱 종료',
                    '앱을 종료하시겠습니까?',
                    [
                        { text: '취소', style: 'cancel' },
                        { text: '종료', onPress: () => BackHandler.exitApp() },
                    ]
                );
                return true;
            }
        };

        BackHandler.addEventListener('hardwareBackPress', handleBackPress);
        return () => BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    }, [canGoBack, webViewRef]);
};

export default useBackHandler;