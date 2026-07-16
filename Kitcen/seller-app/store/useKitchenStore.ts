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
  ownerName?: string;
  ownerPhone?: string;
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
  coverImageUrl?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  utrNumber?: string;
  paymentScreenshot?: string;
  isLive?: boolean;
  upiNumber?: string;
  upiId?: string;
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
  status: 'placed' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled' | 'confirmed';
  date: string;
  paymentMethod: string;
  deliveryAddress?: string | null;
  kitchenAddress?: string | null;
  kitchenPhone?: string | null;
  riderId?: string | null;
  riderName?: string | null;
  riderPhone?: string | null;
  riderAvatar?: string | null;
}

interface KitchenState {
  role: 'customer' | 'seller' | 'superadmin';
  kitchens: Kitchen[];
  products: Record<string, ProductItem[]>; // Keyed by kitchenId
  orders: OrderRecord[];
  categories: Array<{ id: string, name: string }>;
  isLoading: boolean;
  error: string | null;

  // Role switcher
  setRole: (role: 'customer' | 'seller' | 'superadmin') => void;
  
  // API Syncing actions
  fetchKitchens: () => Promise<void>;
  fetchProducts: (kitchenId: string) => Promise<void>;
  fetchOrders: (customerId?: string, kitchenId?: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  
  // Kitchen actions
  addKitchen: (kitchen: Omit<Kitchen, 'id' | 'rating' | 'ratingCount' | 'revenue' | 'ordersCount'>) => Promise<string>;
  
  // Product actions
  addProduct: (kitchenId: string, product: Omit<ProductItem, 'id'>) => Promise<void>;
  deleteProduct: (kitchenId: string, productId: string) => Promise<void>;
  
  // Order actions
  placeOrder: (order: Omit<OrderRecord, 'id' | 'status' | 'date'>) => Promise<string>;
  updateOrderStatus: (orderId: string, status: OrderRecord['status']) => Promise<void>;
}

// Offline fallback mock data
const initialKitchens: Kitchen[] = [];

const initialProducts: Record<string, ProductItem[]> = {};

export const useKitchenStore = create<KitchenState>((set, get) => ({
  role: 'customer',
  kitchens: initialKitchens,
  products: initialProducts,
  orders: [],
  categories: [],
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
          ownerName: k.ownerName || '',
          ownerPhone: k.ownerPhone,
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
          longitude: k.longitude ? Number(k.longitude) : undefined,
          coverImageUrl: k.coverImageUrl,
          bankName: k.bankName,
          accountNumber: k.accountNumber,
          ifscCode: k.ifscCode,
          utrNumber: k.utrNumber,
          paymentScreenshot: k.paymentScreenshot,
          isLive: k.isLive,
          upiNumber: k.upiNumber,
          upiId: k.upiId
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
          paymentMethod: o.paymentMethod,
          deliveryAddress: o.deliveryAddress || null,
          kitchenAddress: o.kitchenAddress || null,
          kitchenPhone: o.kitchenPhone || null,
          riderId: o.riderId || null,
          riderName: o.riderName || null,
          riderPhone: o.riderPhone || null,
          riderAvatar: o.riderAvatar || null
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

  fetchCategories: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      const json = await res.json();
      if (json.success) {
        set({ categories: json.data });
      } else {
        set({ categories: [] });
      }
    } catch (err: any) {
      console.warn('API Error fetching categories:', err.message);
      set({ categories: [
        { id: 'cat1', name: 'Tiffin Meals' },
        { id: 'cat2', name: 'Pizzas' },
        { id: 'cat3', name: 'Burgers' },
        { id: 'cat4', name: 'Starters' }
      ] });
    }
  },

  createCategory: async (name: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'cat-' + Math.floor(Math.random() * 10000),
          name: name,
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=60',
          isActive: true
        })
      });
      const json = await res.json();
      if (json.success) {
        get().fetchCategories();
      }
    } catch (err) {
      console.error('API Error creating category:', err);
      set((state) => ({
        categories: [...state.categories, { id: 'cat-' + Math.floor(Math.random() * 10000), name }]
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
        body: JSON.stringify({ status, Status: status })
      });
      
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success) {
          set((state) => ({
            orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
          }));
          return;
        }
      } else {
        const text = await res.text();
        console.warn('Non-JSON status update response:', text.substring(0, 200));
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
