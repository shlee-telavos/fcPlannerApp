import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {WebView} from 'react-native-webview';

function App(): React.JSX.Element {
  const webViewRef = useRef(null);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('위치 권한 제한', '설정에서 권한을 활성화해 주세요.');
        return false;
      }
    } else if (Platform.OS === 'ios') {
      // iOS 권한 상태 확인 및 요청
      const status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      if (status === RESULTS.GRANTED) {
        return true; // 이미 권한 허용됨
      } else if (status === RESULTS.DENIED) {
        // 사용자에게 다시 권한 요청
        const requestStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        if (requestStatus === RESULTS.GRANTED) {
          return true;
        } else {
          Alert.alert('위치 권한 거부됨', '위치 권한이 필요합니다.');
          return false;
        }
      } else {
        Alert.alert('위치 권한 제한', '설정에서 권한을 활성화해 주세요.');
        return false;
      }
    }
    return true;
  };

  const getLocationAndSend = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationData = JSON.stringify({ latitude, longitude });

        // WebView로 데이터 전송
        if (webViewRef.current) {
          webViewRef.current.postMessage(locationData);
          setLocationSent(true); // 위치 정보 전송 상태 업데이트
        }
      },
      (error) => {
        console.error(error);
        Alert.alert('위치 권한 사용 불가', '위치 서비스를 사용할 수 없습니다.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleNavigationChange = async (navState) => {
    const targetPath = 'https://web.fcplanner.co.kr/reviewMap'; // 위치 정보를 보낼 대상 URL

    // 사용자가 대상 URL로 처음 도달했을 때만 위치 정보를 전송
    if (navState.url === targetPath) {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        getLocationAndSend();
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <WebView
        style={styles.webview}
        ref={webViewRef}
        source={{
          uri: 'https://web.fcplanner.co.kr',
          headers: {
            Authorization: 'Bearer token',
            'Custom-Header': 'value',
          },
        }}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onNavigationStateChange={handleNavigationChange} // 페이지 경로 변경 감지
        onMessage={(event) => console.log('Data from WebView:', event.nativeEvent.data)}
        onLoadStart={syntheticEvent => {
          const {nativeEvent} = syntheticEvent;
          console.log('Loading URL:', nativeEvent.url);
        }}
        onError={syntheticEvent => {
          const {nativeEvent} = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default App;
