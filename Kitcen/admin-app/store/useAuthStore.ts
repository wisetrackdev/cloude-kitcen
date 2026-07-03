import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Safe storage fallback
const memoryStorage: Record<string, string> = {};
const safeAsyncStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(name);
    } catch (err) {
      return memoryStorage[name] || null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (err) {
      memoryStorage[name] = value;
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (err) {
      delete memoryStorage[name];
    }
  }
};

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  rewardPoints: number;
  firstName?: string;
  lastName?: string;
}

interface LocationCoords {
  latitude: number;
  longitude: number;
  addressName: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  location: LocationCoords | null;
  isDarkMode: boolean;
  
  // Actions
  setAuth: (token: string, refreshToken: string, user: UserProfile) => void;
  updateUser: (user: Partial<UserProfile>) => void;
  setLocation: (location: LocationCoords) => void;
  detectLocation: () => Promise<void>;
  logout: () => void;
  setTheme: (isDarkMode: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      location: {
        latitude: 19.0760, // Default to Mumbai / Bandra coordinates
        longitude: 72.8777,
        addressName: 'Bandra West, Mumbai, Maharashtra'
      },

      isDarkMode: false, // Starts in Light Mode by default

      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
      
      updateUser: (updatedFields) => set((state) => ({
        user: state.user ? { ...state.user, ...updatedFields } : null
      })),

      setLocation: (location) => set({ location }),

      detectLocation: async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            console.warn('GPS permission denied by user. Falling back to default location.');
            return;
          }

          const currentLoc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const { latitude, longitude } = currentLoc.coords;

          // Reverse geocoding to get human-readable street/locality name
          const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
          let addressName = 'My Location';
          if (geocode && geocode.length > 0) {
            const place = geocode[0];
            const parts = [
              place.name || place.street,
              place.district || place.subregion,
              place.city || place.region
            ];
            addressName = parts.filter(p => !!p).join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          }

          set({
            location: {
              latitude,
              longitude,
              addressName
            }
          });
        } catch (err: any) {
          console.warn('Error fetching GPS coordinates: ', err.message);
        }
      },

      logout: () => set({ token: null, refreshToken: null, user: null }),
      setTheme: (isDarkMode) => set({ isDarkMode })
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => safeAsyncStorage)
    }
  )
);
