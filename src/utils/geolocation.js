import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔹 WebView에서 위치 요청 이벤트 발생 시 실행
export const handleRequestLocationEvent = async (webViewRef) => {
    console.log("📌 requestLocation :: handleRequestLocationEvent 실행");

    const hasPermission = await requestLocationPermissions();
    if (hasPermission) {
        console.log('✅ 위치 권한이 허용됨 → 위치 정보 가져오기 실행');
        getLocationAndSend(webViewRef);
    } else {
        console.log('🚨 위치 권한이 거부됨 → 기본 좌표 전송');
        sendLocationData(webViewRef, { latitude: 0, longitude: 0 });
    }
};

// 🔹 위치 권한 요청 및 상태 관리
export async function requestLocationPermissions() {
    try {
        const storedPermission = await AsyncStorage.getItem('locationPermissionStatus');

        if (storedPermission === 'granted') {
            console.log('✅ 위치 권한이 이미 허용됨');
            return true; // ✅ 이미 허용된 경우 다시 요청하지 않음
        } else if (storedPermission === 'denied') {
            console.log('🚨 위치 권한이 거부됨, 다시 요청하지 않음');
            return false; // ✅ 거부된 경우 다시 요청하지 않음
        }

        if (Platform.OS === 'android') {
            console.log('🔹 Android 위치 권한 요청 시작');

            const fineLocationGranted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );

            if (fineLocationGranted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log('✅ 위치 권한 허용됨');
                await AsyncStorage.setItem('locationPermissionStatus', 'granted');
                return true;
            } else {
                console.log('🚨 위치 권한 거부됨');
                await AsyncStorage.setItem('locationPermissionStatus', 'denied');
                Alert.alert('위치 권한 필요', '위치를 사용하려면 설정에서 권한을 허용해야 합니다.');
                return false;
            }
        } else if (Platform.OS === 'ios') {
            const authStatus = await Geolocation.requestAuthorization('whenInUse');

            if (authStatus === 'granted' || authStatus === 'whenInUse') {
                console.log('✅ iOS 위치 권한 허용됨');
                await AsyncStorage.setItem('locationPermissionStatus', 'granted');
                return true;
            } else {
                console.log('🚨 iOS 위치 권한 거부됨');
                await AsyncStorage.setItem('locationPermissionStatus', 'denied');
                Alert.alert('위치 권한 필요', '위치를 사용하려면 설정에서 권한을 허용해야 합니다.');
                return false;
            }
        }

        return false;
    } catch (error) {
        console.error('❌ requestLocationPermissions Error:', error);
        Alert.alert('오류 발생', '위치 권한 요청 중 오류가 발생했습니다.');
        return false;
    }
}

// 🔹 위치 정보를 가져와 WebView에 전송
export const getLocationAndSend = async (webViewRef) => {
    console.log("📌 requestLocation :: getLocationAndSend 실행");

    try {
        const hasPermission = await requestLocationPermissions();
        if (!hasPermission) {
            console.log('🚨 위치 권한이 없으므로 기본 좌표 전송');
            sendLocationData(webViewRef, { latitude: 0, longitude: 0 });
            return;
        }

        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log(`📍 현재 위치: ${latitude}, ${longitude}`);
                sendLocationData(webViewRef, { latitude, longitude });
            },
            (error) => handleGeolocationError(error),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    } catch (error) {
        console.error('❌ Geolocation Error:', error);
        Alert.alert('오류 발생', '위치 정보를 가져오는 중 오류가 발생했습니다.');
    }
};

// 🔹 WebView로 위치 데이터 전송
const sendLocationData = (webViewRef, location) => {
    console.log("📌 requestLocation :: sendLocationData 실행");

    if (webViewRef?.current) {
        try {
            const locationData = JSON.stringify(location);
            console.log('📩 WebView로 위치 데이터 전송:', locationData);
            webViewRef.current.postMessage(locationData);
        } catch (err) {
            console.error('❌ WebView postMessage Error:', err);
            Alert.alert('오류', 'WebView 참조를 찾을 수 없습니다. 앱을 다시 시작해 주세요.');
        }
    } else {
        console.warn('⚠️ WebView reference is null. Cannot send location data.');
    }
};

// 🔹 위치 정보를 가져오는 중 오류 발생 시 처리
const handleGeolocationError = (error) => {
    console.error('❌ Geolocation Error:', error);
    const errorMessages = {
        1: '위치 권한 없음. 위치 권한을 허용해 주세요.',
        2: '위치 서비스 사용 불가. 현재 위치를 가져올 수 없습니다.',
        3: '시간 초과. 위치 정보를 가져오는 데 실패했습니다.',
    };
    Alert.alert('오류 발생', errorMessages[error.code] || '알 수 없는 오류가 발생했습니다.');
};