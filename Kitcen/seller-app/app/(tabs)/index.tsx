import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Linking,
  Modal,
  TextInput,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ChefHat,
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  UtensilsCrossed,
  MapPin,
  MessageSquare,
  Phone,
  Menu,
  X,
  Plus,
  Trash2,
  Ticket,
  Image as ImageIcon,
  Sparkles,
  Camera
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToServer } from '../../store/uploadHelper';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';
import { alertService } from '../../store/alertService';
import { API_BASE_URL } from '../../store/apiConfig';
import { Alert } from 'react-native';

const ZOMATO_RED = '#E23744';

type OrderTabFilter = 'live' | 'history';

export default function SellerDashboard() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  const kitchens = useKitchenStore(state => state.kitchens);
  const products = useKitchenStore(state => state.products);
  const orders = useKitchenStore(state => state.orders);
  
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);
  const updateOrderStatus = useKitchenStore(state => state.updateOrderStatus);

  // Theme states
  const isDarkMode = useAuthStore(state => state.isDarkMode);

  const [activeTab, setActiveTab] = useState<OrderTabFilter>('live');

  useEffect(() => {
    fetchKitchens();
    fetchOrders(); 
    const interval = setInterval(() => {
      fetchKitchens();
      fetchOrders();
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const myKitchen = kitchens.find(k => k.owner === user?.id) || kitchens[0];
  const selectedKitchenId = myKitchen?.id || 'k3';
  const isApproved = myKitchen?.isApproved === 'approved';

  // State for online status
  const [isLiveState, setIsLiveState] = useState(myKitchen?.isLive !== false);
  const [isTogglingLive, setIsTogglingLive] = useState(false);

  useEffect(() => {
    if (myKitchen) {
      setIsLiveState(myKitchen.isLive !== false);
    }
  }, [myKitchen]);

  const toggleOnlineStatus = async () => {
    if (!myKitchen?.id) return;
    const nextLiveState = !isLiveState;
    setIsTogglingLive(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/kitchens/${myKitchen.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: myKitchen.id,
          name: myKitchen.name,
          ownerId: user?.id,
          type: myKitchen.type,
          cuisines: myKitchen.cuisines || 'Indian',
          time: myKitchen.time,
          distance: myKitchen.distance,
          offer: myKitchen.offer,
          image: myKitchen.image,
          logoUrl: myKitchen.logoUrl,
          coverImageUrl: myKitchen.coverImageUrl,
          address: myKitchen.address,
          bankName: myKitchen.bankName,
          accountNumber: myKitchen.accountNumber,
          ifscCode: myKitchen.ifscCode,
          isLive: nextLiveState,
          isApproved: myKitchen.isApproved
        })
      });
      const json = await res.json();
      setIsTogglingLive(false);
      if (json.success) {
        setIsLiveState(nextLiveState);
        fetchKitchens(); // refresh store
        Alert.alert('Status Updated', `You are now ${nextLiveState ? 'ONLINE' : 'OFFLINE'}.`);
      } else {
        Alert.alert('Error', json.message || 'Failed to update online status');
      }
    } catch (err) {
      setIsTogglingLive(false);
      // Offline mode fallback
      setIsLiveState(nextLiveState);
      Alert.alert('Offline Mode', `Status updated locally to ${nextLiveState ? 'ONLINE' : 'OFFLINE'}.`);
    }
  };

  // Hamburger Drawer & Management states
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);

  // Categories list & inputs
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Coupons list & inputs
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscountType, setNewCouponDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState('');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState('');
  const [newCouponMaxDiscount, setNewCouponMaxDiscount] = useState('');
  const [newCouponExpiryDays, setNewCouponExpiryDays] = useState('30');
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

  // Banners list & inputs
  const [banners, setBanners] = useState<any[]>([]);
  const [newBannerImage, setNewBannerImage] = useState('');
  const [isLoadingBanners, setIsLoadingBanners] = useState(false);

  // Category functions
  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setCategories(json.data);
      }
    } catch (err) {
      console.warn('Failed to load categories', err);
    }
    setIsLoadingCategories(false);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter category name');
      return;
    }
    const id = 'cat-' + newCategoryName.toLowerCase().replace(/ /g, '-');
    const image = newCategoryImage.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120';
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: newCategoryName.trim(), image, isActive: true })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Category tag added!');
        setNewCategoryName('');
        setNewCategoryImage('');
        fetchCategories();
      } else {
        Alert.alert('Error', json.message || 'Failed to add category');
      }
    } catch (err) {
      setCategories([...categories, { id, name: newCategoryName.trim(), image }]);
      setNewCategoryName('');
      setNewCategoryImage('');
      Alert.alert('Offline Mode', 'Category tag added locally.');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    Alert.alert('Delete Category', 'Are you sure you want to delete this category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/categories/${catId}`, {
              method: 'DELETE'
            });
            const json = await res.json();
            if (json.success) {
              Alert.alert('Success', 'Category deleted');
              fetchCategories();
            } else {
              Alert.alert('Error', json.message || 'Failed to delete category');
            }
          } catch (err) {
            setCategories(categories.filter(c => c.id !== catId));
            Alert.alert('Offline Mode', 'Category deleted locally.');
          }
        }
      }
    ]);
  };

  // Coupon functions
  const fetchCoupons = async () => {
    setIsLoadingCoupons(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/coupons`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setCoupons(json.data);
      }
    } catch (err) {
      console.warn('Failed to load coupons', err);
    }
    setIsLoadingCoupons(false);
  };

  const handleCreateCoupon = async () => {
    if (!newCouponCode.trim() || !newCouponValue.trim()) {
      Alert.alert('Error', 'Please fill in Coupon Code and Value');
      return;
    }
    const days = parseInt(newCouponExpiryDays) || 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const payload = {
      code: newCouponCode.trim().toUpperCase(),
      discountType: newCouponDiscountType,
      discountValue: parseFloat(newCouponValue) || 0,
      minOrder: parseFloat(newCouponMinOrder) || 0,
      maxDiscount: parseFloat(newCouponMaxDiscount) || 0,
      expiryDate: expiryDate.toISOString(),
      isActive: true
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Promo Coupon Code created!');
        setNewCouponCode('');
        setNewCouponValue('');
        setNewCouponMinOrder('');
        setNewCouponMaxDiscount('');
        fetchCoupons();
      } else {
        Alert.alert('Error', json.message || 'Failed to create coupon');
      }
    } catch (err) {
      setCoupons([...coupons, { id: 'CPN-' + Math.floor(Math.random()*10000), ...payload }]);
      setNewCouponCode('');
      setNewCouponValue('');
      setNewCouponMinOrder('');
      setNewCouponMaxDiscount('');
      Alert.alert('Offline Mode', 'Coupon created locally.');
    }
  };

  // Banner functions
  const fetchBanners = async () => {
    setIsLoadingBanners(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/banners`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const filtered = json.data.filter((b: any) => b.linkUrl === `restaurant/${selectedKitchenId}` || b.link_url === `restaurant/${selectedKitchenId}`);
          setBanners(filtered);
        }
      }
    } catch (err) {
      console.warn('Failed to load banners', err);
    }
    setIsLoadingBanners(false);
  };

  const handleSelectBannerImage = async (source: 'camera' | 'gallery') => {
    try {
      const { status } = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission is required to choose a photo.');
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsLoadingBanners(true);
        const localUri = result.assets[0].uri;
        const uploadedUrl = await uploadImageToServer(localUri);
        setIsLoadingBanners(false);
        if (uploadedUrl) {
          setNewBannerImage(uploadedUrl);
          Alert.alert('Success', 'Image uploaded successfully!');
        } else {
          Alert.alert('Error', 'Failed to upload image to server.');
        }
      }
    } catch (err) {
      setIsLoadingBanners(false);
      console.warn('Image selection failed:', err);
      Alert.alert('Error', 'Failed to select and upload image.');
    }
  };

  const requestBannerPhotoSource = () => {
    Alert.alert(
      'Upload Promo Banner',
      'Select source:',
      [
        { text: 'Camera', onPress: () => handleSelectBannerImage('camera') },
        { text: 'Gallery', onPress: () => handleSelectBannerImage('gallery') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleCreateBanner = async () => {
    if (!newBannerImage.trim()) {
      Alert.alert('Error', 'Please enter banner image URL');
      return;
    }
    const payload = {
      imageUrl: newBannerImage.trim(),
      linkUrl: `restaurant/${selectedKitchenId}`,
      isActive: true
    };
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/banners?adminUserId=${user?.id || 'usr-seller-simulated'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Promotion Banner published! Clicking it will redirect customers to your kitchen.');
        setNewBannerImage('');
        fetchBanners();
      } else {
        Alert.alert('Error', json.message || 'Failed to publish banner');
      }
    } catch (err) {
      setBanners([...banners, { id: 'ban-' + Math.floor(Math.random()*10000), ...payload }]);
      setNewBannerImage('');
      Alert.alert('Offline Mode', 'Banner simulated locally.');
    }
  };

  const handleDeleteBanner = (bannerId: string) => {
    Alert.alert('Delete Banner', 'Are you sure you want to delete this promotion banner?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setBanners(banners.filter(b => b.id !== bannerId));
          Alert.alert('Success', 'Banner deleted successfully.');
        }
      }
    ]);
  };

  // Alert when a new order is received for the seller's kitchen
  const prevPlacedOrderIds = useRef<string[]>([]);
  useEffect(() => {
    if (!isApproved) {
      prevPlacedOrderIds.current = [];
      return;
    }
    
    // Filter orders for this kitchen that are in 'placed' state (newly ordered by customer)
    const placedIds = orders
      .filter((o) => o.kitchenId === selectedKitchenId && o.status === 'placed')
      .map((o) => o.id);

    // If there is any new order ID that wasn't in our previous list, trigger the alert
    const newOrders = placedIds.filter(id => !prevPlacedOrderIds.current.includes(id));
    if (newOrders.length > 0) {
      alertService.triggerOrderAlert();
      console.log('New order received for kitchen:', newOrders);
    }
    
    prevPlacedOrderIds.current = placedIds;
  }, [orders, selectedKitchenId, isApproved]);

  const kitchenInfo = myKitchen || kitchens[0] || { name: 'My Kitchen', revenue: 0 };
  const kitchenOrders = orders.filter(o => o.kitchenId === selectedKitchenId);

  const themeColors = {
    background: '#F5F6F8',
    card: '#FFFFFF',
    border: '#EAEAEA',
    text: '#1E2022',
    textSecondary: '#686E73',
    inputBg: '#F0F2F4'
  };

  const handleOrderStatusToggle = async (orderId: string, currentStatus: string) => {
    let nextStatus: typeof orders[0]['status'] = 'placed';
    if (currentStatus === 'placed') {
      nextStatus = 'preparing';
    } else if (currentStatus === 'preparing') {
      nextStatus = 'ready';
    } else {
      return; 
    }
    await updateOrderStatus(orderId, nextStatus);
  };

  if (!isApproved) {
    const isRejected = myKitchen?.isApproved === 'rejected';
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <ChefHat size={72} color={isRejected ? '#FF3B30' : ZOMATO_RED} style={{ marginBottom: 20 }} />
        <Text style={{ color: isRejected ? '#FF3B30' : ZOMATO_RED, fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
          {isRejected ? 'Registration Rejected' : 'Kitchen Approval Pending'}
        </Text>
        <Text style={{ color: themeColors.text, fontSize: 13, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 }}>
          {isRejected 
            ? `Your kitchen "${kitchenInfo.name}" registration has been REJECTED by the SuperAdmin.`
            : `Your kitchen "${kitchenInfo.name}" registration is being reviewed by the SuperAdmin.`}
        </Text>
        <View style={[styles.pendingBadge, isRejected && { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
          {isRejected ? (
            <XCircle size={14} color="#FF3B30" />
          ) : (
            <Clock size={14} color="#FF9500" />
          )}
          <Text style={[styles.pendingBadgeText, isRejected && { color: '#FF3B30' }]}>
            Status: {isRejected ? 'Rejected' : 'Under Review'}
          </Text>
        </View>
        <Text style={{ color: themeColors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 15, lineHeight: 18, paddingHorizontal: 20 }}>
          {isRejected
            ? 'Please check with support or re-submit your registration. You can log out from profile settings.'
            : 'We will notify you once your store dashboard goes live. Thank you for partnering with us!'}
        </Text>
      </View>
    );
  }

  const liveOrders = kitchenOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const pastOrders = kitchenOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  const totalEarnings = pastOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + Number(o.total), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed': return '#007AFF';
      case 'preparing': return '#FF9500';
      case 'ready': return '#5856D6';
      case 'on_the_way': return '#FFCC00';
      case 'delivered': return '#34C759';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} showsVerticalScrollIndicator={false}>
      {/* Brand Header */}
      <View style={[styles.header, { backgroundColor: '#FFCC00' }]}>
        <TouchableOpacity onPress={() => setShowDrawer(true)} style={{ marginRight: 12 }}>
          <Menu size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerSub, { color: 'rgba(255, 255, 255, 0.85)' }]}>Zomato Partner Workspace</Text>
          <Text style={[styles.headerMain, { color: '#FFFFFF' }]}>{kitchenInfo.name}</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.onlineIndicator, 
            !isLiveState && { backgroundColor: 'rgba(255, 59, 48, 0.2)', borderColor: 'rgba(255, 59, 48, 0.3)' }
          ]}
          onPress={toggleOnlineStatus}
          disabled={isTogglingLive}
        >
          {isTogglingLive ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <View style={[styles.pulseDot, !isLiveState && { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.onlineText}>{isLiveState ? 'ONLINE' : 'OFFLINE'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* KPI Stats Panel */}
      <View style={styles.kpiContainer}>
        <View style={[styles.kpiCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderLeftColor: ZOMATO_RED, borderLeftWidth: 3 }]}>
          <View style={styles.kpiRow}>
            <Text style={[styles.kpiVal, { color: themeColors.text }]}>₹{totalEarnings.toFixed(0)}</Text>
            <TrendingUp size={16} color="#34C759" />
          </View>
          <Text style={[styles.kpiLabel, { color: themeColors.textSecondary }]}>Today's Earnings</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderLeftColor: '#007AFF', borderLeftWidth: 3 }]}>
          <View style={styles.kpiRow}>
            <Text style={[styles.kpiVal, { color: themeColors.text }]}>{kitchenOrders.length}</Text>
            <ShoppingBag size={16} color="#007AFF" />
          </View>
          <Text style={[styles.kpiLabel, { color: themeColors.textSecondary }]}>Total Orders</Text>
        </View>
      </View>

      {/* Quick Details Bar */}
      <View style={[styles.quickDetailsBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.detailItem}>
          <CheckCircle size={12} color="#34C759" />
          <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>{pastOrders.filter(o => o.status === 'delivered').length} Delivered</Text>
        </View>
        <View style={styles.detailItem}>
          <XCircle size={12} color="#FF3B30" />
          <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>{pastOrders.filter(o => o.status === 'cancelled').length} Cancelled</Text>
        </View>
        <View style={styles.detailItem}>
          <Clock size={12} color="#FF9500" />
          <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>{liveOrders.length} Pending</Text>
        </View>
      </View>

      {/* Tab Segment Selector */}
      <View style={[styles.tabContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'live' && styles.tabActive]}
          onPress={() => setActiveTab('live')}
        >
          <Text style={[styles.tabText, activeTab === 'live' && styles.tabTextActive]}>
            Live Orders ({liveOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Order Logs ({pastOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List Render */}
      <View style={styles.listContainer}>
        {activeTab === 'live' ? (
          liveOrders.map((order) => (
            <View key={order.id} style={[styles.orderCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={[styles.cardHeader, { borderBottomColor: themeColors.border }]}>
                <View>
                  <Text style={[styles.clientName, { color: themeColors.text }]}>{order.customerName}</Text>
                  <Text style={[styles.orderId, { color: themeColors.textSecondary }]}>{order.id} • {order.paymentMethod.toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15', borderColor: getStatusColor(order.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {order.status === 'placed' ? 'INCOMING' : order.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Items List & Customer Contact Actions */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 }}>
                {/* Items List */}
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.itemsSectionTitle}>FOOD ITEMS</Text>
                  {order.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <UtensilsCrossed size={12} color="#888" style={{ marginRight: 8 }} />
                      <Text style={[styles.itemText, { color: themeColors.text }]} numberOfLines={1}>
                        {item.quantity}x {item.name}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Right Aligned Chat & Call buttons */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity 
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,179,0,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ZOMATO_RED, marginRight: 8 }}
                    onPress={() => router.push({ pathname: '/chat-customer', params: { orderId: order.id, customerName: order.customerName } })}
                  >
                    <MessageSquare size={14} color={ZOMATO_RED} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(46,204,113,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2ecc71' }}
                    onPress={() => Linking.openURL(`tel:${(order as any).customerPhone || ''}`)}
                  >
                    <Phone size={14} color="#2ecc71" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Delivery Address */}
              {order.deliveryAddress && (
                <View style={[styles.addressBox, { backgroundColor: themeColors.inputBg, borderColor: themeColors.border, marginHorizontal: 16 }]}>
                  <Text style={[styles.addressText, { color: themeColors.textSecondary }]} numberOfLines={1}>
                    📍 Deliver to: {order.deliveryAddress}
                  </Text>
                </View>
              )}

              {/* Action and Price footer */}
              <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
                <View>
                  <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>Grand Total</Text>
                  <Text style={styles.totalVal}>₹{order.total}</Text>
                </View>

                {order.status === 'placed' || order.status === 'preparing' ? (
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => handleOrderStatusToggle(order.id, order.status)}
                  >
                    <Text style={styles.actionText}>
                      {order.status === 'placed' ? '✓ Accept Order' : '⚡ Mark Food Ready'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.waitingBadge}>
                    <Clock size={12} color="#8E8E93" style={{ marginRight: 5 }} />
                    <Text style={styles.waitingText}>
                      {order.status === 'ready' ? 'Food Ready. Awaiting Pickup' : 'Out for Delivery'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          pastOrders.map((order) => (
            <View key={order.id} style={[styles.orderCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, opacity: 0.8 }]}>
              <View style={[styles.cardHeader, { borderBottomColor: themeColors.border }]}>
                <View>
                  <Text style={[styles.clientName, { color: themeColors.text }]}>{order.customerName}</Text>
                  <Text style={[styles.orderId, { color: themeColors.textSecondary }]}>{order.id} • {order.paymentMethod.toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15', borderColor: getStatusColor(order.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {order.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Items List & Customer Contact Actions */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 }}>
                {/* Items List */}
                <View style={{ flex: 1, paddingRight: 10 }}>
                  {order.items.map((item, idx) => (
                    <Text key={idx} style={[styles.pastItemText, { color: themeColors.textSecondary }]} numberOfLines={1}>
                      • {item.quantity}x {item.name}
                    </Text>
                  ))}
                </View>

                {/* Right Aligned Chat & Call buttons */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity 
                    style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,179,0,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ZOMATO_RED + '50', marginRight: 6 }}
                    onPress={() => router.push({ pathname: '/chat-customer', params: { orderId: order.id, customerName: order.customerName } })}
                  >
                    <MessageSquare size={12} color={ZOMATO_RED} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(46,204,113,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(46,204,113,0.3)' }}
                    onPress={() => Linking.openURL(`tel:${(order as any).customerPhone || ''}`)}
                  >
                    <Phone size={12} color="#2ecc71" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: 'transparent', paddingTop: 4 }]}>
                <Text style={styles.orderDateText}>{order.date}</Text>
                <Text style={[styles.pastPriceText, { color: themeColors.text }]}>Bill Total: ₹{order.total}</Text>
              </View>
            </View>
          ))
        )}

        {activeTab === 'live' && liveOrders.length === 0 && (
          <View style={styles.emptyContainer}>
            <ChefHat size={48} color="#888" style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>Kitchen is quiet. No active incoming orders right now.</Text>
          </View>
        )}

        {activeTab === 'history' && pastOrders.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No completed order records available.</Text>
          </View>
        )}
      </View>
      <View style={{ height: 60 }} />
    </ScrollView>

      {/* HAMBURGER SIDE DRAWER MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDrawer}
        onRequestClose={() => setShowDrawer(false)}
      >
        <View style={styles.drawerOverlay}>
          <View style={[styles.drawerContent, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.drawerHeader, { borderBottomColor: themeColors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Sparkles size={20} color={ZOMATO_RED} style={{ marginRight: 8 }} />
                <Text style={[styles.drawerTitle, { color: themeColors.text }]}>Seller Workspace</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDrawer(false)} style={[styles.closeBtn, { backgroundColor: themeColors.border }]}>
                <X size={18} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.drawerScrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.drawerSection}>
                {/* Button 1: Manage Categories */}
                <TouchableOpacity 
                  style={[styles.drawerNavBtn, { backgroundColor: themeColors.inputBg }]} 
                  onPress={() => {
                    setShowDrawer(false);
                    setShowCategoryModal(true);
                    fetchCategories();
                  }}
                >
                  <UtensilsCrossed size={20} color={ZOMATO_RED} style={{ marginRight: 12 }} />
                  <Text style={[styles.drawerNavText, { color: themeColors.text }]}>Category Tag Manager</Text>
                </TouchableOpacity>

                {/* Button 2: Manage Coupons */}
                <TouchableOpacity 
                  style={[styles.drawerNavBtn, { backgroundColor: themeColors.inputBg }]} 
                  onPress={() => {
                    setShowDrawer(false);
                    setShowCouponModal(true);
                    fetchCoupons();
                  }}
                >
                  <Ticket size={20} color={ZOMATO_RED} style={{ marginRight: 12 }} />
                  <Text style={[styles.drawerNavText, { color: themeColors.text }]}>Discount Coupons</Text>
                </TouchableOpacity>

                {/* Button 3: Manage Advertisements */}
                <TouchableOpacity 
                  style={[styles.drawerNavBtn, { backgroundColor: themeColors.inputBg }]} 
                  onPress={() => {
                    setShowDrawer(false);
                    setShowBannerModal(true);
                    fetchBanners();
                  }}
                >
                  <ImageIcon size={20} color={ZOMATO_RED} style={{ marginRight: 12 }} />
                  <Text style={[styles.drawerNavText, { color: themeColors.text }]}>Shop Promotion Banners</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CATEGORY MANAGEMENT MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCategoryModal}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Category Tag Management</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={[styles.closeBtn, { backgroundColor: themeColors.border }]}>
                <X size={18} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 11, color: themeColors.textSecondary, marginBottom: 12 }}>
                Categories are shown globally to all customers. Add category tags that describe your food items.
              </Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Category Name (e.g. Punjabi, Fast Food)"
                  placeholderTextColor="#888"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border, width: '100%', marginBottom: 10 }]}
                />
                <TextInput
                  placeholder="Image URL (Optional)"
                  placeholderTextColor="#888"
                  value={newCategoryImage}
                  onChangeText={setNewCategoryImage}
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border, width: '100%' }]}
                />
              </View>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: ZOMATO_RED, marginTop: 14 }]} onPress={handleCreateCategory}>
                <Text style={styles.saveBtnText}>Add Category Tag</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 13, fontWeight: 'bold', color: themeColors.text, marginTop: 24, marginBottom: 10 }}>Global Categories</Text>
              {isLoadingCategories ? (
                <ActivityIndicator size="small" color={ZOMATO_RED} />
              ) : (
                categories.map((cat) => (
                  <View key={cat.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: themeColors.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image source={{ uri: cat.image || cat.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120' }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: themeColors.text }}>{cat.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteCategory(cat.id)}>
                      <Trash2 size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* COUPON MANAGEMENT MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCouponModal}
        onRequestClose={() => setShowCouponModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Discount Coupons</Text>
              <TouchableOpacity onPress={() => setShowCouponModal(false)} style={[styles.closeBtn, { backgroundColor: themeColors.border }]}>
                <X size={18} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 11, color: themeColors.textSecondary, marginBottom: 12 }}>
                Create discount coupon codes that customers can apply in their cart.
              </Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Coupon Code (e.g. WELCOME50)"
                  placeholderTextColor="#888"
                  value={newCouponCode}
                  onChangeText={setNewCouponCode}
                  autoCapitalize="characters"
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border, width: '100%', marginBottom: 10 }]}
                />
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <TouchableOpacity 
                    style={{ flex: 1, paddingVertical: 8, backgroundColor: newCouponDiscountType === 'percentage' ? ZOMATO_RED : themeColors.inputBg, borderRadius: 6, alignItems: 'center', marginRight: 5 }}
                    onPress={() => setNewCouponDiscountType('percentage')}
                  >
                    <Text style={{ color: newCouponDiscountType === 'percentage' ? '#FFF' : themeColors.textSecondary, fontSize: 12, fontWeight: 'bold' }}>Percentage (%)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ flex: 1, paddingVertical: 8, backgroundColor: newCouponDiscountType === 'fixed' ? ZOMATO_RED : themeColors.inputBg, borderRadius: 6, alignItems: 'center', marginLeft: 5 }}
                    onPress={() => setNewCouponDiscountType('fixed')}
                  >
                    <Text style={{ color: newCouponDiscountType === 'fixed' ? '#FFF' : themeColors.textSecondary, fontSize: 12, fontWeight: 'bold' }}>Fixed Amt (₹)</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  placeholder={newCouponDiscountType === 'percentage' ? "Discount Value (e.g. 15 for 15%)" : "Discount Value (e.g. 50 for ₹50)"}
                  placeholderTextColor="#888"
                  value={newCouponValue}
                  onChangeText={setNewCouponValue}
                  keyboardType="numeric"
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border, width: '100%', marginBottom: 10 }]}
                />
                <TextInput
                  placeholder="Min Order Value Required (₹)"
                  placeholderTextColor="#888"
                  value={newCouponMinOrder}
                  onChangeText={setNewCouponMinOrder}
                  keyboardType="numeric"
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border, width: '100%', marginBottom: 10 }]}
                />
                <TextInput
                  placeholder="Max Discount Value (Optional, ₹)"
                  placeholderTextColor="#888"
                  value={newCouponMaxDiscount}
                  onChangeText={setNewCouponMaxDiscount}
                  keyboardType="numeric"
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border, width: '100%', marginBottom: 10 }]}
                />
                <TextInput
                  placeholder="Days to Expiry (e.g. 30)"
                  placeholderTextColor="#888"
                  value={newCouponExpiryDays}
                  onChangeText={setNewCouponExpiryDays}
                  keyboardType="numeric"
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border, width: '100%' }]}
                />
              </View>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: ZOMATO_RED, marginTop: 14 }]} onPress={handleCreateCoupon}>
                <Text style={styles.saveBtnText}>Add Coupon Code</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 13, fontWeight: 'bold', color: themeColors.text, marginTop: 24, marginBottom: 10 }}>Active Promo Codes</Text>
              {isLoadingCoupons ? (
                <ActivityIndicator size="small" color={ZOMATO_RED} />
              ) : (
                coupons.map((c) => (
                  <View key={c.id} style={{ padding: 12, backgroundColor: themeColors.inputBg, borderRadius: 10, marginVertical: 6, borderWidth: 1, borderColor: themeColors.border }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: ZOMATO_RED }}>{c.code}</Text>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: themeColors.textSecondary }}>
                        {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10, color: themeColors.textSecondary }}>Min Order: ₹{c.minOrder} • Max Disc: ₹{c.maxDiscount || 'No Limit'}</Text>
                    <Text style={{ fontSize: 9, color: themeColors.textSecondary, marginTop: 2 }}>Expires: {new Date(c.expiryDate).toLocaleDateString()}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* BANNER ADVERTISEMENT MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showBannerModal}
        onRequestClose={() => setShowBannerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Shop Promotion Banners</Text>
              <TouchableOpacity onPress={() => setShowBannerModal(false)} style={[styles.closeBtn, { backgroundColor: themeColors.border }]}>
                <X size={18} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 11, color: themeColors.textSecondary, marginBottom: 12, lineHeight: 16 }}>
                Publish a promotional advertisement banner for your kitchen on the customer app's home screen. Clicking the banner will open your kitchen shop page.
              </Text>

                <TextInput
                  placeholder="Banner Image URL"
                  placeholderTextColor="#888"
                  value={newBannerImage}
                  onChangeText={setNewBannerImage}
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border, width: '100%', marginBottom: 10 }]}
                />
                
                {newBannerImage ? (
                  <Image source={{ uri: newBannerImage }} style={{ width: '100%', height: 100, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: themeColors.border }} resizeMode="cover" />
                ) : null}

                <TouchableOpacity 
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    backgroundColor: '#2c2c2c', 
                    paddingHorizontal: 12, 
                    paddingVertical: 8, 
                    borderRadius: 8,
                    marginBottom: 10,
                    alignSelf: 'flex-start'
                  }} 
                  onPress={requestBannerPhotoSource}
                >
                  <Camera size={12} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>Choose Banner Image (Camera/Gallery)</Text>
                </TouchableOpacity>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: themeColors.inputBg, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: themeColors.border }}>
                  <Text style={{ fontSize: 10, color: themeColors.textSecondary, flex: 1 }}>
                    Target Link: <Text style={{ fontWeight: 'bold' }}>restaurant/{selectedKitchenId}</Text> (Points directly to your kitchen page)
                  </Text>
                </View>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: ZOMATO_RED, marginTop: 14 }]} onPress={handleCreateBanner}>
                <Text style={styles.saveBtnText}>Publish Banner Ad</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 13, fontWeight: 'bold', color: themeColors.text, marginTop: 24, marginBottom: 10 }}>Your Published Banners</Text>
              {isLoadingBanners ? (
                <ActivityIndicator size="small" color={ZOMATO_RED} />
              ) : (
                banners.map((b) => (
                  <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: themeColors.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                      <Image source={{ uri: b.imageUrl || b.image_url }} style={{ width: 60, height: 35, borderRadius: 4, marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: themeColors.text }} numberOfLines={1}>Ad ID: {b.id}</Text>
                        <Text style={{ fontSize: 9, color: themeColors.textSecondary }}>Target: {b.linkUrl || b.link_url}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteBanner(b.id)}>
                      <Trash2 size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFCC00',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerSub: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
  },
  headerMain: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  kpiContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 4,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  kpiLabel: {
    fontSize: 9,
    marginTop: 6,
  },
  quickDetailsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 10,
    marginLeft: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: ZOMATO_RED,
  },
  tabText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#FFF',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  orderCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 10,
  },
  clientName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  orderId: {
    fontSize: 9,
    marginTop: 2,
  },
  statusBadge: {
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  itemsBox: {
    marginBottom: 10,
  },
  itemsSectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 12,
  },
  addressBox: {
    borderRadius: 8,
    padding: 6,
    marginBottom: 10,
    borderWidth: 1,
  },
  addressText: {
    fontSize: 9,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 9,
  },
  totalVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: ZOMATO_RED,
  },
  actionBtn: {
    backgroundColor: ZOMATO_RED,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(142,142,147,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  waitingText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,149,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,149,0,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF9500',
    marginLeft: 6,
  },
  pastItemText: {
    fontSize: 11,
    marginBottom: 2,
  },
  orderDateText: {
    fontSize: 9,
    color: '#888',
  },
  pastPriceText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 11,
    textAlign: 'center',
  },
  // Hamburger Drawer & Modal styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  drawerContent: {
    width: '75%',
    height: '100%',
    borderRightWidth: 1,
    paddingTop: 50,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  drawerScrollBody: {
    padding: 20,
  },
  drawerSection: {
    marginBottom: 20,
  },
  drawerNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  drawerNavText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    height: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    marginBottom: 12,
  },
  textInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  saveBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
