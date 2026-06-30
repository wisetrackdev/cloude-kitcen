import { create } from 'zustand';
import { API_BASE_URL } from './apiConfig';

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  desc: string;
  category: string;
  isVeg: boolean;
  image: string;
  customizable?: boolean;
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
  logoUrl?: string;
  address?: string;
  floor?: string;
  officeGaliNumber?: string;
  latitude?: number;
  longitude?: number;
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
}

interface KitchenState {
  role: 'customer' | 'seller' | 'superadmin';
  kitchens: Kitchen[];
  products: Record<string, ProductItem[]>; // Keyed by kitchenId
  orders: OrderRecord[];
  isLoading: boolean;
  error: string | null;

  // Role switcher
  setRole: (role: 'customer' | 'seller' | 'superadmin') => void;
  
  // API Syncing actions
  fetchKitchens: () => Promise<void>;
  fetchProducts: (kitchenId: string) => Promise<void>;
  fetchOrders: (customerId?: string, kitchenId?: string) => Promise<void>;
  
  // Kitchen actions
  addKitchen: (kitchen: Omit<Kitchen, 'id' | 'rating' | 'ratingCount' | 'revenue' | 'ordersCount' | 'isApproved' | 'logoUrl' | 'address' | 'floor' | 'officeGaliNumber' | 'latitude' | 'longitude'>) => Promise<string>;
  approveKitchen: (kitchenId: string, status?: string) => Promise<void>;
  
  // Product actions
  addProduct: (kitchenId: string, product: Omit<ProductItem, 'id'>) => Promise<void>;
  deleteProduct: (kitchenId: string, productId: string) => Promise<void>;
  
  // Order actions
  placeOrder: (order: Omit<OrderRecord, 'id' | 'status' | 'date'>) => Promise<string>;
  updateOrderStatus: (orderId: string, status: OrderRecord['status']) => Promise<void>;
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
  kitchens: initialKitchens,
  products: initialProducts,
  orders: [],
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
          isApproved: k.isApproved || 'pending',
          logoUrl: k.logoUrl,
          address: k.address,
          floor: k.floor,
          officeGaliNumber: k.officeGaliNumber,
          latitude: k.latitude ? Number(k.latitude) : undefined,
          longitude: k.longitude ? Number(k.longitude) : undefined
        }));
        set({ kitchens: mappedKitchens, isLoading: false });
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      console.warn('API Error, falling back to mock kitchens:', err.message);
      set({ kitchens: initialKitchens, isLoading: false, error: err.message });
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

  fetchOrders: async (customerId, kitchenId) => {
    set({ isLoading: true, error: null });
    try {
      let queryStr = '';
      if (customerId) queryStr += `customerId=${customerId}`;
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
          paymentMethod: o.paymentMethod
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

  approveKitchen: async (kitchenId: string, status: string = 'approved') => {
    try {
      const kitchen = get().kitchens.find(k => k.id === kitchenId);
      if (!kitchen) return;

      const res = await fetch(`${API_BASE_URL}/api/kitchens/${kitchenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: kitchen.name,
          type: kitchen.type,
          cuisines: kitchen.cuisines,
          time: kitchen.time,
          distance: kitchen.distance,
          offer: kitchen.offer,
          image: kitchen.image,
          logoUrl: kitchen.logoUrl,
          address: kitchen.address,
          floor: kitchen.floor,
          officeGaliNumber: kitchen.officeGaliNumber,
          latitude: kitchen.latitude,
          longitude: kitchen.longitude,
          isApproved: status
        })
      });

      const json = await res.json();
      if (json.success) {
        await get().fetchKitchens();
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      console.warn('API Error updating kitchen status, doing fallback:', err.message);
      set(state => ({
        kitchens: state.kitchens.map(k => k.id === kitchenId ? { ...k, isApproved: status } : k)
      }));
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
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kitchenId: newOrder.kitchenId,
          kitchenName: newOrder.kitchenName,
          customerId: 'usr-9281', // Map customer representation, or dynamically read from auth store
          customerName: newOrder.customerName || 'Customer User',
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
          paymentMethod: newOrder.paymentMethod
        })
      });
      const json = await res.json();
      if (json.success) {
        // Refresh local kitchen list to update revenues/stats
        get().fetchKitchens();
        get().fetchOrders('usr-9281');
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
  }
}));
