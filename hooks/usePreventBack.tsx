// hooks/usePreventBack.ts
import { useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

const usePreventBack = () => {
  const navigation = useNavigation();

  // Block gesture swipe back (iOS)
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    });
  }, [navigation]);

  // Block hardware back button (Android) — minimize app instead
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });

    return () => backHandler.remove();
  }, []);
};

export default usePreventBack;