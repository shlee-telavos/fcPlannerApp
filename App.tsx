import React, { useRef, useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Alert,
  BackHandler,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { WebView } from 'react-native-webview';

const App = () => {
    const webViewRef = useRef(null);
    const [canGoBack, setCanGoBack] = useState(false);

    const requestLocationPermissions = async () => {
      try {
        const foregroundGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        if (foregroundGranted !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }

        if (Platform.Version >= 29) {
          const backgroundGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
          );

          if (backgroundGranted !== PermissionsAndroid.RESULTS.GRANTED) {
            return false;
          }
        }

        return true;
      } catch (err) {
        Alert.alert('권한 요청 실패', `오류: ${err.message}`);
        return false;
      }
    };

    const getLocationAndSend = () => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationData = JSON.stringify({ latitude, longitude });
          if (webViewRef.current) {
              try {
                webViewRef.current.postMessage(locationData);
              } catch (err) {
                console.error('WebView postMessage Error:', err);
              }
          } else {
              console.warn('WebView reference is null. Cannot send location data.');
          }
        },
        (error) => {
          console.error('Geolocation Error:', error);
          switch (error.code) {
            case 1:
              Alert.alert('위치 권한 없음', '위치 권한을 허용해 주세요.');
              break;
            case 2:
              Alert.alert('위치 서비스 사용 불가', '현재 위치를 가져올 수 없습니다.');
              break;
            case 3:
              Alert.alert('시간 초과', '위치 정보를 가져오는 데 실패했습니다.');
              break;
            default:
              Alert.alert('오류 발생', '알 수 없는 오류가 발생했습니다.');
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    };

  const handleRequestLocationEvent = async () => {
    const hasPermission = await requestLocationPermissions();
    if (hasPermission) {
      getLocationAndSend();
    } else {
      Alert.alert('권한 요청 실패', '위치 정보를 가져올 수 없습니다.');
    }
  };

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

  const handleNavigationChange = async (navState) => {
    console.log('Navigated to:', navState.url);
    setCanGoBack(navState.canGoBack);

    const reviewMap = 'https://web.fcplanner.co.kr/reviewMap';
    if (navState.url === reviewMap) {
        handleRequestLocationEvent();
    }
  };

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, [canGoBack]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <WebView
        style={styles.webview}
        ref={webViewRef}
        source={{ uri: 'https://web.fcplanner.co.kr/main' }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        cacheEnabled={true}
        mixedContentMode="always"
        allowFileAccess={true}
        onNavigationStateChange={handleNavigationChange}
        onLoadStart={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.log('Loading URL:', nativeEvent.url);
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.request === 'requestLocation') {
              handleRequestLocationEvent();
            }
          } catch (error) {
            console.error('Error parsing message from WebView:', error);
          }
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView Error:', nativeEvent);
          Alert.alert('오류 발생', `페이지를 로드할 수 없습니다.\n오류 메시지: ${nativeEvent.description}`);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default App;