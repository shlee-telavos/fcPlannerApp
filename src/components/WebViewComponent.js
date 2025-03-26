import React, { useRef, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  shareContent,
  getUniqueAppIdAndSend,
  extractHostname,
  handleExternalLink,
  injectedJavaScript,
} from '../utils/webviewUtils';
import { handleRequestLocationEvent } from '../utils/geolocation';
import useBackHandler from '../hooks/useBackHandler';
import useNotificationListener from '../hooks/useNotificationListener';
import styles from '../styles/styles';

const allowedDomains = [
  'web.fcplanner.co.kr',
  'admin.fcplanner.co.kr',
  'dapi.kakao.com',
  'fcpwas.ovsfc.com',
  'review.fcplanner.co.kr',
  'fcpweb.ovsfc.com',
];

const WebViewComponent = () => {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useBackHandler(canGoBack, webViewRef);
  useNotificationListener();

  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView event:', data);

      if (data.type) {
        switch (data.type) {
          case 'windowOpen':
            handleWindowOpen(data.url);
            break;
          case 'shareBrandContentUrl':
            shareContent(data.url, '브랜드 알아보기');
            break;
          default:
            console.warn('Unhandled WebView message type:', data.type);
        }
      } else if (data.request) {
        switch (data.request) {
          case 'requestLocation':
            handleRequestLocationEvent(webViewRef);
            break;
          case 'requestAppId':
            getUniqueAppIdAndSend(webViewRef);
            break;
          case 'shareContentUrl':
            shareContent(data.url, '나의 성향 분석 - 나에게 꼭 맞는 프랜차이즈 찾아보기.');
            break;
          default:
            console.warn('Unhandled WebView message request:', data.request);
        }
      }

    } catch (error) {
      console.error('WebView message parsing error:', error);
    }
  };

  const handleWindowOpen = (url) => {
    const hostname = extractHostname(url);
    if (allowedDomains.includes(hostname)) {
      webViewRef.current?.injectJavaScript(`window.location.href = "${url}";`);
    } else {
      handleExternalLink(url);
    }
  };

  return (
    <WebView
      style={styles.webview}
      ref={webViewRef}
      source={{ uri: 'https://web.fcplanner.co.kr/main' }}
      javaScriptEnabled
      domStorageEnabled
      cacheEnabled
      mixedContentMode="always"
      allowFileAccess
      allowUniversalAccessFromFileURLs
      onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
      onShouldStartLoadWithRequest={(request) => {
        const hostname = extractHostname(request.url);
        return allowedDomains.includes(hostname) || handleExternalLink(request.url);
      }}
      injectedJavaScript={injectedJavaScript}
      onMessage={handleWebViewMessage}
      onError={({ nativeEvent }) => {
        console.error('WebView Error:', nativeEvent);
        Alert.alert('오류 발생', `페이지를 로드할 수 없습니다.\n오류 메시지: ${nativeEvent.description}`);
      }}
    />
  );
};

export default WebViewComponent;