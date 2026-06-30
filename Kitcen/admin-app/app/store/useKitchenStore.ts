import { create } from 'zustand';

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
  
  // Role switcher
  setRole: (role: 'customer' | 'seller' | 'superadmin') => void;
  
  // Kitchen actions
  addKitchen: (kitchen: Omit<Kitchen, 'id' | 'rating' | 'ratingCount' | 'revenue' | 'ordersCount'>) => string;
  
  // Product actions
  addProduct: (kitchenId: string, product: Omit<ProductItem, 'id'>) => void;
  deleteProduct: (kitchenId: string, productId: string) => void;
  
  // Order actions
  placeOrder: (order: Omit<OrderRecord, 'id' | 'status' | 'date'>) => string;
  updateOrderStatus: (orderId: string, status: OrderRecord['status']) => void;
}

const initialKitchens: Kitchen[] = [
  { 
    id: 'k1', 
    name: 'The Pizza Box', 
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
    name: 'Burger Bistro', 
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
    name: 'Auntie\'s Homely Tiffin', 
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
  },
  { 
    id: 'k4', 
    name: 'Maa Ki Rasoi', 
    owner: 'Kiran Devi (Housewife)',
    type: 'home_tiffin',
    cuisines: 'Healthy Tiffin, Roti Sabji Combo', 
    rating: 4.7, 
    ratingCount: 82,
    time: '35 mins', 
    distance: '2.5 km',
    offer: '₹50 OFF on first tiffin', 
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    revenue: 6800,
    ordersCount: 15
  }
];

const initialProducts: Record<string, ProductItem[]> = {
  k1: [
    { id: 'p1', name: 'Margherita Pizza', price: 249, desc: 'Classic mozzarella cheese and fresh basil leaves on thin crust', category: 'Pizzas', isVeg: true, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&auto=format&fit=crop&q=80', customizable: true },
    { id: 'p2', name: 'Pepperoni Supreme', price: 389, desc: 'Loaded with double layers of smoked pepperoni and extra cheese', category: 'Pizzas', isVeg: false, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300&auto=format&fit=crop&q=80', customizable: true },
    { id: 'p4', name: 'Garlic Breadsticks', price: 129, desc: 'Baked dough sticks brushed with garlic butter and herbs', category: 'Starters', isVeg: true, image: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=300&auto=format&fit=crop&q=80' }
  ],
  k2: [
    { id: 'p3', name: 'Crunchy Chicken Burger', price: 189, desc: 'Crispy chicken patty with lettuce, tomatoes and spicy mayonnaise', category: 'Burgers', isVeg: false, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80' }
  ],
  k3: [
    { id: 'p5', name: 'Standard Homestyle Veg Tiffin', price: 120, desc: '4 Rotis, Dal, Seasonal Sabji, Rice, Salad, and Pickle. Low oil & spices.', category: 'Tiffin Meals', isVeg: true, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80' },
    { id: 'p6', name: 'Special Paneer Tiffin', price: 160, desc: '4 Rotis, Paneer Butter Masala, Dal Fry, Rice, Sweet, and Salad.', category: 'Tiffin Meals', isVeg: true, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80' }
  ],
  k4: [
    { id: 'p7', name: 'Daily Tiffin Combo', price: 110, desc: '3 Butter Rotis, Dal Tadka, Sukhi Sabji, Rice and Salad.', category: 'Tiffin Meals', isVeg: true, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80' }
  ]
};

const initialOrders: OrderRecord[] = [
  {
    id: 'CK-8931',
    kitchenId: 'k1',
    kitchenName: 'The Pizza Box',
    customerName: 'Arjun Mehta',
    items: [
      { id: 'p1-Medium-no-cheese', name: 'Margherita Pizza (Medium)', price: 249, quantity: 1 },
      { id: 'p4', name: 'Garlic Breadsticks', price: 129, quantity: 1 }
    ],
    subtotal: 378,
    deliveryCharge: 29,
    tax: 56.7,
    discount: 0,
    total: 463.7,
    status: 'preparing',
    date: '27 June, 11:40 AM',
    paymentMethod: 'cod'
  },
  {
    id: 'CK-8932',
    kitchenId: 'k2',
    kitchenName: 'Burger Bistro',
    customerName: 'Sneha Rao',
    items: [
      { id: 'p3', name: 'Crunchy Chicken Burger', price: 189, quantity: 1 }
    ],
    subtotal: 189,
    deliveryCharge: 29,
    tax: 28.35,
    discount: 0,
    total: 246.35,
    status: 'ready',
    date: '27 June, 11:20 AM',
    paymentMethod: 'wallet'
  }
];

export const useKitchenStore = create<KitchenState>((set) => ({
  role: 'customer',
  kitchens: initialKitchens,
  products: initialProducts,
  orders: initialOrders,

  setRole: (role) => set({ role }),

  addKitchen: (newKitchen) => {
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
      products: {
        ...state.products,
        [id]: []
      }
    }));
    return id;
  },

  addProduct: (kitchenId, newProduct) => {
    const id = 'p' + Math.random().toString(36).substring(2, 6);
    const product: ProductItem = {
      ...newProduct,
      id
    };
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

  deleteProduct: (kitchenId, productId) => {
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

  placeOrder: (newOrder) => {
    const id = 'CK-' + Math.floor(1000 + Math.random() * 9000);
    const date = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' today';
    const order: OrderRecord = {
      ...newOrder,
      id,
      status: 'placed',
      date
    };
    set((state) => {
      // Update kitchen revenue and order count
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

  updateOrderStatus: (orderId, status) => {
    set((state) => ({
      orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
    }));
  }
}));
