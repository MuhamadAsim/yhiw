import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';




export const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
        alert('Must use physical device for Push Notifications');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        alert('Permission for notifications denied');
        return null;
    }
    // ✅ Add Android notification channel here
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
        });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '67f051a5-ca6d-4aca-8459-a79026dd31f2',
    });
    console.log('Expo Push Token:', tokenData.data);

    return tokenData.data;
};