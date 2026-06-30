import { create } from 'zustand';

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
    const { items, coupon, tip } = get();
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.15 * 100) / 100; // 15% combined GST/Service charges
    const deliveryCharge = subtotal > 0 ? 29 : 0; // Flat base fee
    
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
      total
    };
  }
}));
