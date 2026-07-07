import { Vibration } from 'react-native';
import { Audio } from 'expo-av';

let soundInstance: Audio.Sound | null = null;

export const alertService = {
  triggerOrderAlert: async () => {
    try {
      // 1. Trigger Vibration pattern: wait 0s, vibrate 1s, pause 0.5s, vibrate 1s, pause 0.5s, vibrate 1s
      Vibration.vibrate([0, 1000, 500, 1000, 500, 1000]);

      // 2. Play ringtone sound
      if (soundInstance) {
        try {
          await soundInstance.stopAsync();
          await soundInstance.unloadAsync();
        } catch (e) {
          // ignore
        }
        soundInstance = null;
      }

      // Load and play the alert sound (stable jsDelivr public asset)
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://cdn.jsdelivr.net/gh/ionictheme/ionic-sounds@master/src/assets/sounds/bell.mp3' },
        { shouldPlay: true, volume: 1.0 }
      );
      soundInstance = sound;
    } catch (error) {
      console.warn('[AlertService] Error playing alert ringtone/vibration:', error);
      // Fallback: Vibrate only if audio loading fails
      Vibration.vibrate(800);
    }
  },

  stopAlert: async () => {
    try {
      Vibration.cancel();
      if (soundInstance) {
        await soundInstance.stopAsync();
        await soundInstance.unloadAsync();
        soundInstance = null;
      }
    } catch (e) {
      // ignore
    }
  }
};
