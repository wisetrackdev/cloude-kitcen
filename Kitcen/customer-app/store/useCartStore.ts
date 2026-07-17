import { create } from 'zustand';
import { useKitchenStore } from './useKitchenStore';
import { useAuthStore } from './useAuthStore';

export interface CartItem {
  id: string; // unique item id including customization combinations
  productId: string;
  name: string;
  price: number; // base price + selected customization options
  quantity: number;
  image?: string;
  selectedCustomizations?: Array<{
    customizationName: string;
    optionName: string;
    price: number;
  }>;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
}

interface CartState {
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartItem[];
  coupon: Coupon | null;
  tip: number;
  cookingInstruction: string;
  riderInstruction: string;
  
  // Actions
  addItem: (restaurantId: string, restaurantName: string, item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  applyCoupon: (coupon: Coupon | null) => void;
  setTip: (amount: number) => void;
  setCookingInstruction: (text: string) => void;
  setRiderInstruction: (text: string) => void;
  clearCart: () => void;
  
  // Computations
  getTotals: () => {
    subtotal: number;
    tax: number;
    deliveryCharge: number;
    discount: number;
    total: number;
    distanceKm: number;
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  restaurantId: null,
  restaurantName: null,
  items: [],
  coupon: null,
  tip: 0,
  cookingInstruction: '',
  riderInstruction: '',

  addItem: (restId, restName, newItem) => {
    const { restaurantId, items } = get();
    
    // Switch restaurant check
    if (restaurantId && restaurantId !== restId) {
      // Clean cart first
      set({
        restaurantId: restId,
        restaurantName: restName,
        items: [{ ...newItem, quantity: 1 }],
        coupon: null
      });
      return;
    }

    const existingIndex = items.findIndex(item => item.id === newItem.id);
    
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      set({ items: updated, restaurantId: restId, restaurantName: restName });
    } else {
      set({ 
        items: [...items, { ...newItem, quantity: 1 }], 
        restaurantId: restId, 
        restaurantName: restName 
      });
    }
  },

  removeItem: (itemId) => {
    const { items } = get();
    const filtered = items.filter(item => item.id !== itemId);
    
    if (filtered.length === 0) {
      set({ items: [], restaurantId: null, restaurantName: null, coupon: null });
    } else {
      set({ items: filtered });
    }
  },

  updateQuantity: (itemId, delta) => {
    const { items } = get();
    const updated = items.map(item => {
      if (item.id === itemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[];

    if (updated.length === 0) {
      set({ items: [], restaurantId: null, restaurantName: null, coupon: null });
    } else {
      set({ items: updated });
    }
  },

  applyCoupon: (coupon) => set({ coupon }),
  setTip: (tip) => set({ tip }),
  setCookingInstruction: (cookingInstruction) => set({ cookingInstruction }),
  setRiderInstruction: (riderInstruction) => set({ riderInstruction }),
  clearCart: () => set({ 
    items: [], 
    restaurantId: null, 
    restaurantName: null, 
    coupon: null, 
    tip: 0,
    cookingInstruction: '',
    riderInstruction: ''
  }),

  getTotals: () => {
    const { items, coupon, tip, restaurantId } = get();
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = 0;

    const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    let deliveryCharge = 0;
    let distanceKm = 0;
    if (subtotal > 0 && restaurantId) {
      const kitchens = useKitchenStore.getState().kitchens;
      const kitchen = kitchens.find(k => k.id === restaurantId);
      const userLocation = useAuthStore.getState().location;

      if (kitchen) {
        let distNum = 1.0;
        if (kitchen.latitude && kitchen.longitude && userLocation?.latitude && userLocation?.longitude) {
          distNum = getHaversineDistance(
            Number(kitchen.latitude),
            Number(kitchen.longitude),
            Number(userLocation.latitude),
            Number(userLocation.longitude)
          );
          if (distNum > 100) {
            if (kitchen.distance && !kitchen.distance.includes('1147')) {
              distNum = parseFloat(kitchen.distance.replace(/[^0-9.]/g, '')) || 7.2;
            } else {
              distNum = 7.2;
            }
          }
        } else if (kitchen.distance) {
          distNum = parseFloat(kitchen.distance.replace(/[^0-9.]/g, '')) || 7.2;
        } else {
          distNum = 7.2;
        }

        distanceKm = Number(distNum.toFixed(2));
        // Strictly ₹5 per km
        deliveryCharge = Math.round(distNum * 5);
      } else {
        deliveryCharge = 29;
      }
    }
    
    let discount = 0;
    if (coupon && subtotal >= coupon.minOrderValue) {
      if (coupon.discountType === 'percentage') {
        discount = subtotal * (coupon.discountValue / 100);
        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      } else {
        discount = coupon.discountValue;
      }
    }

    const total = Math.max(0, subtotal + tax + deliveryCharge + tip - discount);

    return {
      subtotal,
      tax,
      deliveryCharge,
      discount,
      total,
      distanceKm
    };
  }
}));
