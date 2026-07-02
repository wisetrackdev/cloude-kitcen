import { create } from 'zustand';
import * as Location from 'expo-location';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  rewardPoints: number;
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
  isOnline: boolean;
  
  // Actions
  setAuth: (token: string, refreshToken: string, user: UserProfile) => void;
  updateUser: (user: Partial<UserProfile>) => void;
  setLocation: (location: LocationCoords) => void;
  detectLocation: () => Promise<void>;
  logout: () => void;
  setTheme: (isDarkMode: boolean) => void;
  setDutyStatus: (isOnline: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  location: {
    latitude: 19.0760, // Default to Mumbai / Bandra coordinates
    longitude: 72.8777,
    addressName: 'Bandra West, Mumbai, Maharashtra'
  },
  isDarkMode: false, // default starting white background (light mode)
  isOnline: false, // default offline (off duty)

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
  setTheme: (isDarkMode) => set({ isDarkMode }),
  setDutyStatus: (isOnline) => set({ isOnline })
}));
