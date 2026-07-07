import AsyncStorage from '@react-native-async-storage/async-storage';

const memoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn(`[SafeStorage Warning] getItem failed for key "${key}", using memory fallback:`, e);
      return memoryStore[key] || null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      memoryStore[key] = value;
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[SafeStorage Warning] setItem failed for key "${key}":`, e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      delete memoryStore[key];
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`[SafeStorage Warning] removeItem failed for key "${key}":`, e);
    }
  }
};
