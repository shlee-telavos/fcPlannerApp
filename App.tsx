import React, { useRef, useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Alert,
  BackHandler,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { WebView } from 'react-native-webview';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import URLParse from 'url-parse';


const App = () => {
    const webViewRef = useRef(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const allowedDomains = ['web.fcplanner.co.kr', 'dapi.kakao.com', 'fcpwas.ovsfc.com', 'review.fcplanner.co.kr']; // 허용된 도메인 리스트


  const requestLocationPermissions = async () => {
      try {
        if (Platform.OS === 'android') {
          // ACCESS_FINE_LOCATION 권한 확인
          const isFineLocationGranted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );

          // Android 10 이상에서 ACCESS_BACKGROUND_LOCATION 권한 확인
          const isBackgroundLocationGranted =
            Platform.Version >= 29 &&
            (await PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
            ));

          // "앱 사용 중에만 허용" 상태 처리
          if (isFineLocationGranted) {
            // 위치 정보를 가져올 수 있는 상태
            return true;
          }

          // 권한 요청
          const fineGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );

          if (fineGranted !== PermissionsAndroid.RESULTS.GRANTED) {
            showPermissionDeniedAlert();
            return false;
          }

          // Android 10 이상에서 백그라운드 권한 요청
          if (Platform.Version >= 29) {
            const backgroundGranted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
            );

            // 백그라운드 권한이 없어도 앱 사용 중 위치 정보는 허용
            if (backgroundGranted !== PermissionsAndroid.RESULTS.GRANTED) {
              console.log('백그라운드 권한 없음. 앱 사용 중에는 위치 정보 제공 가능.');
            }
          }

          return true;
        } else if (Platform.OS === 'ios') {
          const authStatus = await Geolocation.requestAuthorization('whenInUse');

          if (authStatus === 'granted' || authStatus === 'whenInUse') {
            console.log('Location permission granted');
            return true; // 위치 정보 가져올 수 있음
          } else {
               console.warn('Location permission denied:', authStatus);
          }

          if (authStatus === 'denied') {
            showPermissionDeniedAlert();
            return false;
          }

          if (authStatus === 'restricted') {
            showPermissionDeniedAlert();
            return false;
          }

          openAppSettings();
          return await waitForPermissionResult();
        }

        return false;
      } catch (error) {
        Alert.alert('권한 요청 실패', `오류: ${error.message}`);
        return false;
      }
  };

  // 설정 화면으로 이동
  const openAppSettings = () => {
    Alert.alert(
      '권한 필요',
      '앱이 정상적으로 동작하려면 위치 권한을 허용해 주세요.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '설정으로 이동',
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  };

  // 권한 거부 알림
  const showPermissionDeniedAlert = () => {
    Alert.alert(
      '권한 요청 실패',
      '앱이 정상적으로 동작하려면 위치 권한이 필요합니다.'
    );
  };

  // 사용자 설정 변경 대기
  const waitForPermissionResult = () => {
    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        const isFineLocationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        const isBackgroundLocationGranted =
          Platform.Version >= 29 &&
          (await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
          ));

        if (
          isFineLocationGranted &&
          (Platform.Version < 29 || isBackgroundLocationGranted)
        ) {
          clearInterval(interval);
          resolve(true);
        }
      }, 1000);

      setTimeout(() => {
        clearInterval(interval);
        resolve(false);
      }, 10000); // 10초 후 중단
    });
  };

    const getLocationAndSend = () => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationData = JSON.stringify({ latitude, longitude });
          if (webViewRef.current) {
              try {
              console.log('postMessage send data:',locationData);
                webViewRef.current.postMessage(locationData);
              } catch (err) {
                console.error('WebView postMessage Error:', err);
                Alert.alert('오류', 'WebView 참조를 찾을 수 없습니다. 앱을 다시 시작해 주세요.');
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
      if (webViewRef.current) {
          try {
              console.log('postMessage send data: latitude:0, longitude:0');
              webViewRef.current.postMessage(JSON.stringify({'latitude':0, 'longitude':0}));
          } catch (err) {
              console.error('WebView postMessage Error:', err);
              Alert.alert('오류', 'WebView 참조를 찾을 수 없습니다. 앱을 다시 시작해 주세요.');
          }
      } else {
          console.warn('WebView reference is null. Cannot send location data.');
      }
    }
  };

  const handleExternalLink = async (url) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        console.error('Invalid URL format:', url);
        Alert.alert('오류', '올바르지 않은 URL입니다.');
        return;
    }

    try {
      const isBrowserAvailable = await InAppBrowser.isAvailable();
      if (isBrowserAvailable) {
        await InAppBrowser.open(url, {
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: '#453AA4',
          preferredControlTintColor: 'white',
          readerMode: false,
          showTitle: true,
          enableDefaultShare: true,
          enableBarCollapsing: true,
        });
      } else {
        Linking.openURL(url); // Fallback to default browser
      }
    } catch (error) {
      console.error('Error opening in-app browser:', error);
      Linking.openURL(url); // Fallback to default browser
    }
  };

    const extractHostname = (url) => {
      try {
        // URL이 http 또는 https로 시작하지 않으면 기본 도메인 추가
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          const baseDomain = 'https://web.fcplanner.co.kr';
          url = new URLParse(url, baseDomain).href;
        }

        const parsedUrl = new URLParse(url);
        return parsedUrl.hostname; // 도메인 반환
      } catch (error) {
        console.error('extractHostname Error:', error);
        return '';
      }
    };

  const onShouldStartLoadWithRequest = (request) => {
    const { url } = request;
    console.log('Requested URL:', url); // API 호출된 URL 확인
    const hostname = extractHostname(url);
    const isAllowedDomain = allowedDomains.includes(hostname);
    if (!isAllowedDomain) {
      // 외부 링크는 In-App Browser로 열기
      handleExternalLink(url);
      return false; // WebView에서 URL 로드를 중단
    }

    return true; // WebView에서 허용된 URL 로드
  };

  // WebView에 JavaScript 주입
  // 모든 링크의 target="_blank"를 제거하고 React Native에서 처리하도록 변경
  // window.open 호출을 가로채서 React Native로 URL 전달
  const injectedJavaScript = `
    (function() {
        // window.open 가로채기
        const originalWindowOpen = window.open;
        window.open = function(url, target, features) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'windowOpen', url }));
            } else {
                return originalWindowOpen(url, target, features);
            }
        };

        // 기존 DOM에 있는 <a target="_blank"> 처리
        const updateLinks = () => {
          const links = document.querySelectorAll('a[target="_blank"]');
          links.forEach(link => {
            link.target = '_self'; // WebView에서 처리 가능하도록 변경
            link.addEventListener('click', (e) => {
              e.preventDefault();
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'windowOpen', url: link.href }));
              }
            });
          });
        };

        // DOM 변경 감지
        const observer = new MutationObserver((mutations) => {
          mutations.forEach(() => {
            updateLinks(); // 새로 추가된 링크에 대해 처리
          });
        });

        // 감지 대상 설정
        observer.observe(document.body, { childList: true, subtree: true });

        // 초기 실행
        updateLinks();

        // iOS 환경 확인 후 $.ajax 가로채기
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            console.log('iOS detected. Overriding $.ajax.');

            const originalAjax = $.ajax;
            $.ajax = function(options) {
                if (options.url && !options.url.startsWith('http')) {
                    // 상대 경로를 절대 경로로 변환
                    const baseUrl = window.location.origin; // 현재 사이트의 도메인
                    options.url = baseUrl + options.url;
                    console.log('Modified URL:', options.url); // 디버깅 용도
                }

                // 원래의 ajax 메서드를 호출
                return originalAjax.call(this, options);
            };
        }
    })();
  `;

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
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        injectedJavaScript={injectedJavaScript} // JavaScript 주입
        onLoadStart={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.log('Loading URL:', nativeEvent.url);
        }}
        onMessage={(event) => {
            console.log('onMessage event 발생');
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('event data:',data);

            if (data.type === 'windowOpen') {
              // window.open 호출 시 전달된 URL 처리
              const { url } = data;
              const hostname = extractHostname(url);
              const isAllowedDomain = allowedDomains.includes(hostname);

              if (isAllowedDomain) {
                // 허용된 도메인은 WebView로 열기
                if (webViewRef.current) {
                  webViewRef.current.injectJavaScript(`
                    window.location.href = "${url}";
                  `);
                }
              } else {
                // 허용되지 않은 도메인은 InAppBrowser로 열기
                handleExternalLink(url);
              }
            }

            if (data.request === 'requestLocation') {
              handleRequestLocationEvent();
            }
          } catch (error) {
              console.error('WebView 메시지 파싱 에러:', error);
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