 import URLParse from 'url-parse';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { Linking, Alert, Share } from 'react-native';
import DeviceInfo from 'react-native-device-info';

// 🔹 공유 기능
export const shareContent = async (url,message) => {
  try {
    await Share.share({
      message: `${message}\n${url}`,
    });
  } catch (error) {
    console.error('Error sharing content: ', error);
  }
};

// 🔹 앱 고유 ID를 WebView로 전송
export const getUniqueAppIdAndSend = async (webViewRef) => {
  try {
    const uniqueId = await DeviceInfo.getUniqueId();
    console.log('Unique App ID:', uniqueId);
    sendMessageToWebView(webViewRef, { uniqueId });
  } catch (error) {
    console.error('Error retrieving unique ID:', error);
  }
};

// 🔹 외부 링크 처리
export const handleExternalLink = async (url) => {
  if (!/^https?:\/\//.test(url)) {
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
      Linking.openURL(url);
    }
  } catch (error) {
    Linking.openURL(url);
  }
};

// 🔹 도메인 추출
export const extractHostname = (url) => {
  try {
    const baseDomain = 'https://web.fcplanner.co.kr';
    const parsedUrl = new URLParse(url, baseDomain);
    return parsedUrl.hostname;
  } catch (error) {
    console.error('extractHostname Error:', error);
    return '';
  }
};

// 🔹 WebView 로딩 결정
export const onShouldStartLoadWithRequest = (request, allowedDomains) => {
  const { url } = request;
  console.log('Requested URL:', url);
  const hostname = extractHostname(url);

  if (!allowedDomains.includes(hostname)) {
    handleExternalLink(url);
    return false;
  }
  return true;
};

// 🔹 WebView 메시지 전송
const sendMessageToWebView = (webViewRef, data) => {
  if (webViewRef?.current) {
    try {
      const message = JSON.stringify(data);
      console.log('postMessage send data:', message);
      webViewRef.current.postMessage(message);
    } catch (error) {
      console.error('WebView postMessage Error:', error);
      Alert.alert('오류', 'WebView 참조를 찾을 수 없습니다. 앱을 다시 시작해 주세요.');
    }
  } else {
    console.warn('WebView reference is null. Cannot send data.');
  }
};

// 🔹 WebView 내 JavaScript 코드 삽입
export const injectedJavaScript = `
    (function() {
       const originalWindowOpen = window.open;
       window.open = function(url, target, features) {
           if (window.ReactNativeWebView) {
               window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'windowOpen', url }));
           } else {
               return originalWindowOpen(url, target, features);
           }
       };

       const updateLinks = () => {
         document.querySelectorAll('a[target="_blank"]').forEach(link => {
           link.target = '_self';
           link.addEventListener('click', (e) => {
             e.preventDefault();
             if (window.ReactNativeWebView) {
               window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'windowOpen', url: link.href }));
             }
           });
         });
       };

       const observer = new MutationObserver(() => updateLinks());
       observer.observe(document.body, { childList: true, subtree: true });
       updateLinks();

       if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
           console.log('iOS detected. Overriding $.ajax.');
           const originalAjax = $.ajax;
           $.ajax = function(options) {
               if (options.url && !options.url.startsWith('http')) {
                   options.url = window.location.origin + options.url;
                   console.log('Modified URL:', options.url);
               }
               return originalAjax.call(this, options);
           };
       }
    })();
`;
