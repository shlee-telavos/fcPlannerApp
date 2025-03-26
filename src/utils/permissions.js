import { Alert, Platform, PermissionsAndroid, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export const requestLocationPermissions = async () => {
  try {
    if (Platform.OS === 'android') {
      return await handleAndroidPermissions();
    } else if (Platform.OS === 'ios') {
      return await handleIOSPermissions();
    }
  } catch (error) {
    Alert.alert('권한 요청 실패', `오류: ${error.message}`);
  }
  return false;
};

const handleAndroidPermissions = async () => {
  const isFineLocationGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );

  if (isFineLocationGranted) return true;

  const fineGranted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );

  if (fineGranted !== PermissionsAndroid.RESULTS.GRANTED) {
    showPermissionDeniedAlert();
    return false;
  }

  if (Platform.Version >= 29) {
    await requestBackgroundLocationPermission();
  }
  return true;
};

const requestBackgroundLocationPermission = async () => {
  const backgroundGranted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
  );

  if (backgroundGranted !== PermissionsAndroid.RESULTS.GRANTED) {
    console.log('백그라운드 권한 없음. 앱 사용 중 위치 정보 제공 가능.');
  }
};

const handleIOSPermissions = async () => {
  const authStatus = await Geolocation.requestAuthorization('whenInUse');

  if (authStatus === 'granted' || authStatus === 'whenInUse') return true;

  if (authStatus === 'denied' || authStatus === 'restricted') {
    showPermissionDeniedAlert();
    return false;
  }

  openAppSettings();
  return await waitForPermissionResult();
};

const openAppSettings = () => {
  Alert.alert('권한 필요', '앱이 정상적으로 동작하려면 위치 권한을 허용해 주세요.', [
    { text: '취소', style: 'cancel' },
    { text: '설정으로 이동', onPress: () => Linking.openSettings() },
  ]);
};

const showPermissionDeniedAlert = () => {
  Alert.alert('권한 요청 실패', '앱이 정상적으로 동작하려면 위치 권한이 필요합니다.');
};

const waitForPermissionResult = () => {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      const isFineLocationGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (isFineLocationGranted) {
        clearInterval(interval);
        resolve(true);
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      resolve(false);
    }, 10000);
  });
};
