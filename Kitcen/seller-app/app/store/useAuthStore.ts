import { create } from 'zustand';

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
  
  // Actions
  setAuth: (token: string, refreshToken: string, user: UserProfile) => void;
  updateUser: (user: Partial<UserProfile>) => void;
  setLocation: (location: LocationCoords) => void;
  logout: () => void;
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

  setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
  
  updateUser: (updatedFields) => set((state) => ({
    user: state.user ? { ...state.user, ...updatedFields } : null
  })),

  setLocation: (location) => set({ location }),

  logout: () => set({ token: null, refreshToken: null, user: null })
}));
