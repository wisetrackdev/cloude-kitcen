import { create } from 'zustand';
import { API_BASE_URL } from './apiConfig';
import { useAuthStore } from './useAuthStore';

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  desc: string;
  category: string;
  isVeg: boolean;
  image: string;
  customizable?: boolean;
  kitchenId?: string;
  kitchenName?: string;
}

export interface Kitchen {
  id: string;
  name: string;
  owner: string;
  type: 'restaurant' | 'home_tiffin';
  cuisines: string;
  rating: number;
  ratingCount: number;
  distance: string;
  time: string;
  image: string;
  offer: string;
  revenue: number;
  ordersCount: number;
  isApproved?: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  address?: string;
  floor?: string;
  officeGaliNumber?: string;
  latitude?: number;
  longitude?: number;
  isLive?: boolean;
  upiId?: string | null;
  upiNumber?: string | null;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selectedCustomizations?: Array<{
    customizationName: string;
    optionName: string;
    price: number;
  }>;
}

export interface OrderRecord {
  id: string;
  kitchenId: string;
  kitchenName: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  tax: number;
  discount: number;
  total: number;
  status: 'placed' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled';
  date: string;
  paymentMethod: string;
  riderId?: string | null;
  riderName?: string | null;
  riderPhone?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  kitchenAddress?: string | null;
  kitchenPhone?: string | null;
  customerLatitude?: number | null;
  customerLongitude?: number | null;
  shopLatitude?: number | null;
  shopLongitude?: number | null;
}

interface KitchenState {
  role: 'customer' | 'seller' | 'superadmin';
  kitchens: Kitchen[];
  products: Record<string, ProductItem[]>; // Keyed by kitchenId
  allProducts: ProductItem[];
  orders: OrderRecord[];
  isLoading: boolean;
  error: string | null;

  // Role switcher
  setRole: (role: 'customer' | 'seller' | 'superadmin') => void;
  
  // API Syncing actions
  fetchKitchens: () => Promise<void>;
  fetchProducts: (kitchenId: string) => Promise<void>;
  fetchAllProducts: () => Promise<void>;
  fetchOrders: (customerId?: string, kitchenId?: string) => Promise<void>;
  
  // Kitchen actions
  addKitchen: (kitchen: Omit<Kitchen, 'id' | 'rating' | 'ratingCount' | 'revenue' | 'ordersCount'>) => Promise<string>;
  
  // Product actions
  addProduct: (kitchenId: string, product: Omit<ProductItem, 'id'>) => Promise<void>;
  deleteProduct: (kitchenId: string, productId: string) => Promise<void>;
  
  // Order actions
  placeOrder: (order: Omit<OrderRecord, 'id' | 'status' | 'date'>) => Promise<string>;
  updateOrderStatus: (orderId: string, status: OrderRecord['status']) => Promise<void>;
  verifyPayment: (payload: {
    transactionId: string;
    utrNumber: string;
    userId: string;
    kitchenId: string;
    deliveryAddress: string;
    totalAmount: number;
    subtotal: number;
    deliveryCharge: number;
    tax: number;
    discount: number;
    items: any[];
  }) => Promise<{ success: boolean; message: string; orderId?: string }>;
}

// Offline fallback mock data
const initialKitchens: Kitchen[] = [
  { 
    id: 'k1', 
    name: 'The Pizza Box (Offline)', 
    owner: 'Arjun Mehta',
    type: 'restaurant',
    cuisines: 'Italian, Pizza', 
    rating: 4.8, 
    ratingCount: 128,
    time: '20-25 mins', 
    distance: '1.8 km',
    offer: '50% OFF up to ₹120', 
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    revenue: 12450,
    ordersCount: 24
  },
  { 
    id: 'k2', 
    name: 'Burger Bistro (Offline)', 
    owner: 'Sneha Rao',
    type: 'restaurant',
    cuisines: 'Fast Food, American', 
    rating: 4.5, 
    ratingCount: 94,
    time: '15-20 mins', 
    distance: '0.9 km',
    offer: 'Buy 1 Get 1 Free', 
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    revenue: 8400,
    ordersCount: 18
  },
  { 
    id: 'k3', 
    name: 'Auntie\'s Homely Tiffin (Offline)', 
    owner: 'Rupa Sharma (Housewife)',
    type: 'home_tiffin',
    cuisines: 'North Indian, Homestyle Dal-Roti', 
    rating: 4.9, 
    ratingCount: 312,
    time: '30 mins', 
    distance: '1.2 km',
    offer: 'Healthy Homestyle Food', 
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    revenue: 24500,
    ordersCount: 56
  }
];

const initialProducts: Record<string, ProductItem[]> = {
  k1: [
    { id: 'p1', name: 'Margherita Pizza', price: 249, desc: 'Classic mozzarella cheese and fresh basil leaves on thin crust', category: 'Pizzas', isVeg: true, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&auto=format&fit=crop&q=80', customizable: true },
    { id: 'p4', name: 'Garlic Breadsticks', price: 129, desc: 'Baked dough sticks brushed with garlic butter and herbs', category: 'Starters', isVeg: true, image: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=300&auto=format&fit=crop&q=80' }
  ]
};

export const useKitchenStore = create<KitchenState>((set, get) => ({
  role: 'customer',
  kitchens: [],
  products: {},
  orders: [],
  allProducts: [],
  isLoading: false,
  error: null,

  setRole: (role) => set({ role }),

  fetchKitchens: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE_URL}/api/kitchens`);
      if (!res.ok) throw new Error('Failed to fetch kitchens');
      const json = await res.json();
      if (json.success) {
        // Map backend KitchenDb format to frontend Kitchen format
        const mappedKitchens = json.data.map((k: any) => ({
          id: k.id,
          name: k.name,
          owner: k.ownerId, // Map OwnerId to Owner representation
          type: k.type,
          cuisines: k.cuisines,
          rating: Number(k.rating),
          ratingCount: k.ratingCount,
          time: k.time,
          distance: k.distance,
          offer: k.offer,
          image: k.image,
          revenue: Number(k.revenue),
          ordersCount: k.ordersCount,
          isApproved: k.isApproved,
          logoUrl: k.logoUrl,
          coverImageUrl: k.coverImageUrl,
          bankName: k.bankName,
          accountNumber: k.accountNumber,
          ifscCode: k.ifscCode,
          isLive: k.isLive,
          upiId: k.upiId,
          upiNumber: k.upiNumber,
          latitude: k.latitude ? Number(k.latitude) : undefined,
          longitude: k.longitude ? Number(k.longitude) : undefined
        }));
        set({ kitchens: mappedKitchens, isLoading: false });
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      console.warn('API Error, setting empty kitchens:', err.message);
      set({ kitchens: [], isLoading: false, error: err.message });
    }
  },

  fetchProducts: async (kitchenId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE_URL}/api/products?kitchenId=${kitchenId}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const json = await res.json();
      if (json.success) {
        const mappedProducts = json.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          desc: p.description || '',
          category: p.category,
          isVeg: p.isVeg,
          image: p.image,
          customizable: p.customizable
        }));
        set((state) => ({
          products: {
            ...state.products,
            [kitchenId]: mappedProducts
          },
          isLoading: false
        }));
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      console.warn('API Error, falling back to mock products:', err.message);
      set({ isLoading: false, error: err.message });
    }
  },
  fetchAllProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const json = await res.json();
      if (json.success) {
        const mappedProducts = json.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          desc: p.description || '',
          category: p.categoryName || p.category || 'Meals',
          isVeg: p.isVeg,
          image: p.imageUrl || p.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150',
          customizable: p.customizable,
          kitchenId: p.kitchenId,
          kitchenName: p.kitchenName || 'Kitchen Partner'
        }));
        set({ allProducts: mappedProducts, isLoading: false });
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      console.warn('API Error, setting empty products:', err.message);
      set({ allProducts: [], isLoading: false });
    }
  },

  fetchOrders: async (customerId, kitchenId) => {
    set({ isLoading: true, error: null });
    try {
      let queryStr = '';
      const activeCustomerId = customerId || useAuthStore.getState().user?.id;
      if (activeCustomerId) queryStr += `customerId=${activeCustomerId}`;
      if (kitchenId) queryStr += `${queryStr ? '&' : ''}kitchenId=${kitchenId}`;

      const res = await fetch(`${API_BASE_URL}/api/orders?${queryStr}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const json = await res.json();
      if (json.success) {
        const mappedOrders = json.data.map((o: any) => ({
          id: o.id,
          kitchenId: o.kitchenId,
          kitchenName: o.kitchenName,
          customerName: o.customerName,
          items: o.items.map((i: any) => ({
            id: i.id,
            name: i.name,
            price: Number(i.price),
            quantity: i.quantity
          })),
          subtotal: Number(o.subtotal),
          deliveryCharge: Number(o.deliveryCharge),
          tax: Number(o.tax),
          discount: Number(o.discount),
          total: Number(o.total),
          status: o.status,
          date: o.date,
          paymentMethod: o.paymentMethod,
          riderId: o.riderId || null,
          riderName: o.riderName || null,
          riderPhone: o.riderPhone || null,
          customerPhone: o.customerPhone || null,
          deliveryAddress: o.deliveryAddress || null,
          kitchenAddress: o.kitchenAddress || null,
          kitchenPhone: o.kitchenPhone || null,
          customerLatitude: o.customerLatitude ? Number(o.customerLatitude) : null,
          customerLongitude: o.customerLongitude ? Number(o.customerLongitude) : null,
          shopLatitude: o.shopLatitude ? Number(o.shopLatitude) : null,
          shopLongitude: o.shopLongitude ? Number(o.shopLongitude) : null
        }));
        set({ orders: mappedOrders, isLoading: false });
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      console.warn('API Error, falling back to cached/mock orders:', err.message);
      set({ isLoading: false, error: err.message });
    }
  },

  addKitchen: async (newKitchen) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/kitchens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKitchen.name,
          ownerId: newKitchen.owner || 'usr-9281', // fallback owner
          type: newKitchen.type,
          cuisines: newKitchen.cuisines,
          time: newKitchen.time,
          distance: newKitchen.distance,
          offer: newKitchen.offer,
          image: newKitchen.image
        })
      });
      const json = await res.json();
      if (json.success) {
        // Refresh local kitchen listing
        get().fetchKitchens();
        return json.data.id;
      }
    } catch (err) {
      console.error('API Error creating kitchen, doing local mock fallback:', err);
    }

    // Mock Fallback
    const id = 'k' + Math.random().toString(36).substring(2, 6);
    const kitchen: Kitchen = {
      ...newKitchen,
      id,
      rating: 5.0,
      ratingCount: 0,
      revenue: 0,
      ordersCount: 0
    };
    set((state) => ({
      kitchens: [...state.kitchens, kitchen],
      products: { ...state.products, [id]: [] }
    }));
    return id;
  },

  addProduct: async (kitchenId, newProduct) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kitchenId,
          name: newProduct.name,
          price: newProduct.price,
          description: newProduct.desc,
          category: newProduct.category,
          isVeg: newProduct.isVeg,
          image: newProduct.image,
          customizable: newProduct.customizable || false
        })
      });
      const json = await res.json();
      if (json.success) {
        get().fetchProducts(kitchenId);
        return;
      }
    } catch (err) {
      console.error('API Error adding product, doing local fallback:', err);
    }

    // Fallback
    const id = 'p' + Math.random().toString(36).substring(2, 6);
    const product: ProductItem = { ...newProduct, id };
    set((state) => {
      const currentProducts = state.products[kitchenId] || [];
      return {
        products: {
          ...state.products,
          [kitchenId]: [...currentProducts, product]
        }
      };
    });
  },

  deleteProduct: async (kitchenId, productId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        get().fetchProducts(kitchenId);
        return;
      }
    } catch (err) {
      console.error('API Error deleting product, doing local fallback:', err);
    }

    // Fallback
    set((state) => {
      const currentProducts = state.products[kitchenId] || [];
      return {
        products: {
          ...state.products,
          [kitchenId]: currentProducts.filter(p => p.id !== productId)
        }
      };
    });
  },

  placeOrder: async (newOrder) => {
    const currentUser = useAuthStore.getState().user;
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kitchenId: newOrder.kitchenId,
          kitchenName: newOrder.kitchenName,
          customerId: currentUser?.id || 'usr-9281',
          customerName: currentUser?.name || newOrder.customerName || 'Customer User',
          items: newOrder.items.map(i => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity
          })),
          subtotal: newOrder.subtotal,
          deliveryCharge: newOrder.deliveryCharge,
          tax: newOrder.tax,
          discount: newOrder.discount,
          total: newOrder.total,
          paymentMethod: newOrder.paymentMethod,
          deliveryAddress: newOrder.deliveryAddress
        })
      });
      const json = await res.json();
      if (json.success) {
        // Refresh local kitchen list to update revenues/stats
        get().fetchKitchens();
        get().fetchOrders(currentUser?.id);
        return json.data.id;
      }
    } catch (err) {
      console.error('API Error placing order, doing local fallback:', err);
    }

    // Fallback
    const id = 'CK-' + Math.floor(1000 + Math.random() * 9000);
    const date = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' today';
    const order: OrderRecord = {
      ...newOrder,
      id,
      status: 'placed',
      date
    };
    set((state) => {
      const updatedKitchens = state.kitchens.map(k => {
        if (k.id === newOrder.kitchenId) {
          return {
            ...k,
            revenue: k.revenue + newOrder.total,
            ordersCount: k.ordersCount + 1
          };
        }
        return k;
      });

      return {
        orders: [order, ...state.orders],
        kitchens: updatedKitchens
      };
    });
    return id;
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        set((state) => ({
          orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
        }));
        return;
      }
    } catch (err) {
      console.error('API Error updating order status, doing local fallback:', err);
    }

    // Fallback
    set((state) => ({
      orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
    }));
  },

  verifyPayment: async (payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (json.success) {
        // Success: refresh kitchens (revenue) and fetch orders list
        get().fetchKitchens();
        get().fetchOrders(payload.userId);
        return { 
          success: true, 
          message: json.message || 'Payment verified successfully.',
          orderId: json.data?.orderId
        };
      } else {
        return { success: false, message: json.message || 'Payment verification failed.' };
      }
    } catch (err: any) {
      console.error('API Error verifying payment:', err);
      return { success: false, message: err.message || 'Network error occurred during payment verification.' };
    }
  }
}));
