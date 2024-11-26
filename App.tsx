import React from 'react';
import {
  SafeAreaView,
  //   ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {WebView} from 'react-native-webview';

function App(): React.JSX.Element {
  const url = 'https://web.fcplanner.co.kr';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <WebView
        style={styles.webview}
        source={{
          uri: url,
          headers: {
            Authorization: 'Bearer token',
            'Custom-Header': 'value',
          },
        }}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
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
    bottom: 0, // 화면 전체를 덮도록 설정
  },
});

export default App;
