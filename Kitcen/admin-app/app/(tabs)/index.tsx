import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image,
  Linking,
  ActivityIndicator
} from 'react-native';
import { 
  Users, 
  TrendingUp, 
  ShoppingBag, 
  Store,
  CheckCircle,
  Clock,
  X,
  Trash2,
  Send,
  Camera,
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  Phone,
  CreditCard,
  MapPin,
  Star,
  Menu,
  Bike,
  ShieldCheck,
  Plus,
  Image as ImageIcon
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL } from '../../store/apiConfig';
import { uploadImage } from '../../store/uploadHelper';

type SubTab = 'analytics' | 'categories' | 'sellers';

export default function AdminDashboard() {
  const router = useRouter();
  const kitchens = useKitchenStore(state => state.kitchens);
  const orders = useKitchenStore(state => state.orders);
  const categories = useKitchenStore(state => state.categories);
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);
  const fetchCategories = useKitchenStore(state => state.fetchCategories);
  const approveKitchen = useKitchenStore(state => state.approveKitchen);
  const createCategory = useKitchenStore(state => state.createCategory);
  const deleteCategory = useKitchenStore(state => state.deleteCategory);

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('analytics');
  const [selectedKitchen, setSelectedKitchen] = useState<any>(null);
  const [selectedSellerForStats, setSelectedSellerForStats] = useState<any>(null);

  // Form states
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');

  // Registered system users log
  const [systemUsers, setSystemUsers] = useState<any[]>([]);

  // Support chat multi-user states
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportRooms, setSupportRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [supportInput, setSupportInput] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);

  // Hamburger Drawer & Live Banner Manager States
  const [showDrawer, setShowDrawer] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerLinkUrl, setBannerLinkUrl] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingBannerLocal, setIsUploadingBannerLocal] = useState(false);

  const fetchActiveBanners = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/banners`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setBanners(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load dynamic banners:', err);
    }
  };

  const handleUploadBannerFromDrawer = async () => {
    if (!bannerImageUrl.trim()) {
      Alert.alert('Error', 'Please enter or upload a banner image URL');
      return;
    }
    setIsUploadingBanner(true);
    try {
      const adminId = 'usr-admin-simulated';
      const res = await fetch(`${API_BASE_URL}/api/admin/banners?adminUserId=${adminId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: bannerImageUrl.trim(),
          linkUrl: bannerLinkUrl.trim() || 'default_promo',
          isActive: true
        })
      });
      const json = await res.json();
      setIsUploadingBanner(false);

      if (json.success) {
        Alert.alert('Success', 'Dynamic Banner uploaded successfully!');
        setBannerImageUrl('');
        setBannerLinkUrl('');
        fetchActiveBanners();
      } else {
        Alert.alert('Error', json.message || 'Failed to upload banner');
      }
    } catch (err) {
      setIsUploadingBanner(false);
      Alert.alert('Offline Mode', 'Banner saved locally.');
      const newMock = {
        id: 'mock-' + Math.random().toString(36).substring(2, 6),
        imageUrl: bannerImageUrl.trim(),
        linkUrl: bannerLinkUrl.trim()
      };
      setBanners([newMock, ...banners]);
      setBannerImageUrl('');
      setBannerLinkUrl('');
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      // Simulate delete
      Alert.alert('Delete', 'Banner deletion is simulated.');
      setBanners(banners.filter(b => b.id !== bannerId));
    } catch (err) {
      console.warn(err);
    }
  };

  const handleUploadImageUri = async (localUri: string, target: 'category' | 'banner') => {
    if (target === 'category') {
      const uploadedUrl = await uploadImage(localUri);
      if (uploadedUrl) {
        setNewCatImage(uploadedUrl);
      } else {
        setNewCatImage(localUri);
      }
    } else if (target === 'banner') {
      setIsUploadingBannerLocal(true);
      const uploadedUrl = await uploadImage(localUri);
      setIsUploadingBannerLocal(false);
      if (uploadedUrl) {
        setBannerImageUrl(uploadedUrl);
      } else {
        setBannerImageUrl(localUri);
      }
    }
  };

  const requestBannerImageSource = () => {
    Alert.alert(
      'Banner Image Source',
      'Select image upload source:',
      [
        {
          text: 'Camera (Take Photo)',
          onPress: captureBannerImage
        },
        {
          text: 'Gallery (Choose from Library)',
          onPress: pickBannerImageFromGallery
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const captureBannerImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permissions are required.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUploadImageUri(result.assets[0].uri, 'banner');
      }
    } catch (e) {
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  const pickBannerImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUploadImageUri(result.assets[0].uri, 'banner');
      }
    } catch (e) {
      Alert.alert('Gallery Error', 'Could not open photo library.');
    }
  };

  // Forced light-mode theme colors matching customer app theme
  const themeColors = {
    background: '#F5F5F7',
    card: '#FFFFFF',
    border: '#EAEAEA',
    text: '#1E2022',
    textSecondary: '#686E73',
    inputBg: '#F0F2F4',
    primary: '#FFB300', // Gold/Yellow primary
  };

  // Fetch all registered users
  const fetchSystemUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSystemUsers(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load system users:', err);
    }
  };

  // Poll for support rooms ONLY when modal is open and no room is selected
  useEffect(() => {
    if (!showSupportModal) return;
    if (selectedRoom) return;

    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders/support/rooms`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setSupportRooms(json.data);
          }
        }
      } catch (err) {
        console.warn('Failed to load support rooms in admin:', err);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, [showSupportModal, selectedRoom]);

  // Poll for message list inside selected customer support room
  useEffect(() => {
    if (!showSupportModal || !selectedRoom) {
      setSupportMessages([]);
      return;
    }

    const fetchRoomMessages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders/${selectedRoom.orderId}/chats`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setSupportMessages(json.data);
          }
        }
      } catch (err) {
        console.warn('Failed to load room messages:', err);
      }
    };

    fetchRoomMessages();
    const interval = setInterval(fetchRoomMessages, 2000);
    return () => clearInterval(interval);
  }, [showSupportModal, selectedRoom]);

  // Send admin reply to selected support room
  const handleSendSupportReply = async () => {
    if (!supportInput.trim() || !selectedRoom) return;
    const text = supportInput.trim();
    setSupportInput('');
    setSendingSupport(true);
    try {
      await fetch(`${API_BASE_URL}/api/orders/${selectedRoom.orderId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'usr-admin-support',
          message: text
        })
      });
      // Refresh local logs
      const res = await fetch(`${API_BASE_URL}/api/orders/${selectedRoom.orderId}/chats`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSupportMessages(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to send admin support reply:', err);
    } finally {
      setSendingSupport(false);
    }
  };

  // Image upload selector options alert
  const requestCategoryImageSource = () => {
    Alert.alert(
      'Category Image Source',
      'Select image upload source:',
      [
        {
          text: 'Camera (Take Photo)',
          onPress: captureCategoryImage
        },
        {
          text: 'Gallery (Choose from Library)',
          onPress: pickCategoryImageFromGallery
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const captureCategoryImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permissions are required.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUploadImageUri(result.assets[0].uri, 'category');
      }
    } catch (e) {
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  const pickCategoryImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUploadImageUri(result.assets[0].uri, 'category');
      }
    } catch (e) {
      Alert.alert('Gallery Error', 'Could not open photo library.');
    }
  };

  // Core background fetches
  useEffect(() => {
    fetchKitchens();
    fetchOrders();
    fetchCategories();
    fetchSystemUsers();
    fetchActiveBanners();
    const interval = setInterval(() => {
      fetchKitchens();
      fetchOrders();
      fetchCategories();
      fetchSystemUsers();
      fetchActiveBanners();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalSales = kitchens.reduce((sum, k) => sum + k.revenue, 0);
  const totalOrdersCount = orders.length;
  const totalShopsCount = kitchens.length;

  // Seller Stats logic helpers
  const getSellerStats = (kitchenId: string) => {
    const sellerOrders = orders.filter(o => o.kitchenId === kitchenId);
    
    // Calculate weekly orders (placed in last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyOrders = sellerOrders.filter(o => {
      const orderDate = new Date(o.date || o.createdAt || Date.now());
      return orderDate >= oneWeekAgo;
    });

    return {
      totalOrders: sellerOrders.length,
      cancelledOrders: sellerOrders.filter(o => o.status === 'cancelled').length,
      deliveredOrders: sellerOrders.filter(o => o.status === 'delivered').length,
      totalEarnings: sellerOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0),
      weeklyOrdersCount: weeklyOrders.length
    };
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      
      {/* 1. Yellow/Gold Header block */}
      <View style={styles.goldHeader}>
        <View style={styles.headerTopRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setShowDrawer(true)} style={{ marginRight: 12 }}>
              <Menu size={24} color="#FFF" />
            </TouchableOpacity>
            <Users size={22} color="#FFF" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.roleText}>Super Admin Panel</Text>
              <Text style={styles.titleText}>Global Control</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.adminSupportBtn}
            onPress={() => setShowSupportModal(true)}
          >
            <MessageSquare size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.adminSupportBtnText}>Support Chats</Text>
          </TouchableOpacity>
        </View>

        {/* Top Tab Navigator Buttons */}
        <View style={styles.subTabBar}>
          <TouchableOpacity 
            style={[styles.subTabItem, activeSubTab === 'analytics' && styles.subTabActive]}
            onPress={() => setActiveSubTab('analytics')}
          >
            <Text style={[styles.subTabText, activeSubTab === 'analytics' && styles.subTabTextActive]}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.subTabItem, activeSubTab === 'categories' && styles.subTabActive]}
            onPress={() => setActiveSubTab('categories')}
          >
            <Text style={[styles.subTabText, activeSubTab === 'categories' && styles.subTabTextActive]}>Categories</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.subTabItem, activeSubTab === 'sellers' && styles.subTabActive]}
            onPress={() => setActiveSubTab('sellers')}
          >
            <Text style={[styles.subTabText, activeSubTab === 'sellers' && styles.subTabTextActive]}>Sellers Stats</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        
        {/* SUBTAB 1: ANALYTICS */}
        {activeSubTab === 'analytics' && (
          <View style={styles.tabContent}>
            {/* Global KPI Counters */}
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <TrendingUp size={16} color={themeColors.primary} />
                <Text style={[styles.kpiValue, { color: themeColors.text }]}>₹{totalSales}</Text>
                <Text style={[styles.kpiLabel, { color: themeColors.textSecondary }]}>Platform Sales</Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <ShoppingBag size={16} color="#FF3B30" />
                <Text style={[styles.kpiValue, { color: themeColors.text }]}>{totalOrdersCount}</Text>
                <Text style={[styles.kpiLabel, { color: themeColors.textSecondary }]}>Orders Handled</Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Store size={16} color={themeColors.primary} />
                <Text style={[styles.kpiValue, { color: themeColors.text }]}>{totalShopsCount}</Text>
                <Text style={[styles.kpiLabel, { color: themeColors.textSecondary }]}>Total Kitchens</Text>
              </View>
            </View>

            {/* User Base Stats Breakdown Grid */}
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: themeColors.textSecondary, marginHorizontal: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>User Base Stats</Text>
            <View style={styles.userGrid}>
              <View style={[styles.userCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Users size={16} color="#FF9500" />
                <Text style={[styles.kpiValue, { color: themeColors.text }]}>{systemUsers.filter(u => u.role === 'customer').length}</Text>
                <Text style={[styles.kpiLabel, { color: themeColors.textSecondary }]}>Customers</Text>
              </View>
              <View style={[styles.userCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Store size={16} color="#34C759" />
                <Text style={[styles.kpiValue, { color: themeColors.text }]}>{systemUsers.filter(u => u.role === 'vendor' || u.role === 'seller').length}</Text>
                <Text style={[styles.kpiLabel, { color: themeColors.textSecondary }]}>Vendors / Sellers</Text>
              </View>
              <View style={[styles.userCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Bike size={16} color="#007AFF" />
                <Text style={[styles.kpiValue, { color: themeColors.text }]}>{systemUsers.filter(u => u.role === 'rider').length}</Text>
                <Text style={[styles.kpiLabel, { color: themeColors.textSecondary }]}>Riders</Text>
              </View>
              <View style={[styles.userCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <ShieldCheck size={16} color="#5856D6" />
                <Text style={[styles.kpiValue, { color: themeColors.text }]}>{systemUsers.length}</Text>
                <Text style={[styles.kpiLabel, { color: themeColors.textSecondary }]}>Total Registered</Text>
              </View>
            </View>

            {/* Listed Kitchens approving panel */}
            <View style={styles.sellerSection}>
              <Text style={[styles.sellerSectionTitle, { color: themeColors.text }]}>Listed Kitchens & Performance</Text>
              {kitchens.map((kitchen) => (
                <TouchableOpacity 
                  key={kitchen.id} 
                  style={[styles.kitchenAdminCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                  onPress={() => router.push(`/kitchen/${kitchen.id}`)}
                >
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={[styles.kitchenAdminName, { color: themeColors.text }]}>{kitchen.name}</Text>
                    <Text style={[styles.kitchenAdminOwner, { color: themeColors.textSecondary }]}>Owner ID: {kitchen.owner}</Text>
                    
                    {/* Approval status badge */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      {kitchen.isApproved === 'approved' ? (
                        <View style={styles.statusApprovedBadge}>
                          <CheckCircle size={10} color="#2ecc71" />
                          <Text style={styles.statusApprovedText}>APPROVED</Text>
                        </View>
                      ) : kitchen.isApproved === 'rejected' ? (
                        <View style={styles.statusRejectedBadge}>
                          <X size={10} color="#FF3B30" />
                          <Text style={styles.statusRejectedText}>REJECTED</Text>
                        </View>
                      ) : (
                        <View style={styles.statusPendingBadge}>
                          <Clock size={10} color={themeColors.primary} />
                          <Text style={styles.statusPendingText}>PENDING APPROVAL</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.kitchenAdminStats}>
                    <Text style={[styles.adminStatVal, { color: '#2ecc71' }]}>₹{kitchen.revenue}</Text>
                    <Text style={[styles.adminStatLabel, { color: themeColors.textSecondary }]}>{kitchen.ordersCount} Orders</Text>
                    
                    {kitchen.isApproved !== 'approved' && kitchen.isApproved !== 'rejected' && (
                      <View style={{ marginTop: 8, flexDirection: 'row' }}>
                        <TouchableOpacity
                          style={[styles.approveActionBtn, { marginRight: 6, backgroundColor: themeColors.primary }]}
                          onPress={() => {
                            approveKitchen(kitchen.id, 'approved');
                            Alert.alert('Approved', `Kitchen "${kitchen.name}" approved!`);
                          }}
                        >
                          <Text style={styles.approveActionText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.approveActionBtn, { backgroundColor: '#FF3B30' }]}
                          onPress={() => {
                            approveKitchen(kitchen.id, 'rejected');
                            Alert.alert('Rejected', `Kitchen "${kitchen.name}" rejected.`);
                          }}
                        >
                          <Text style={[styles.approveActionText, { color: '#FFF' }]}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Registered Platform Users Log */}
            <View style={styles.sellerSection}>
              <Text style={[styles.sellerSectionTitle, { color: themeColors.text }]}>Registered Platform Users ({systemUsers.length})</Text>
              {systemUsers.map((u) => (
                <View key={u.id} style={[styles.kitchenAdminCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, padding: 12 }]}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <Image 
                      source={{ uri: u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' }} 
                      style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#EEE' }} 
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.kitchenAdminName, { color: themeColors.text, fontSize: 13 }]}>{u.firstName} {u.lastName}</Text>
                      <Text style={{ fontSize: 10, color: themeColors.textSecondary }}>{u.email} • Role: {u.role.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 10, color: themeColors.textSecondary }}>Joined: {new Date(u.createdAt).toLocaleDateString()}</Text>
                </View>
              ))}
            </View>

            {/* Global Transactions Log */}
            <View style={styles.sellerSection}>
              <Text style={[styles.sellerSectionTitle, { color: themeColors.text }]}>Global Transactions Log</Text>
              {orders.map((order) => (
                <View key={order.id} style={[styles.logCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <View style={styles.logHeader}>
                    <Text style={[styles.logId, { color: themeColors.text }]}>{order.id}</Text>
                    <Text style={[styles.logDate, { color: themeColors.textSecondary }]}>{order.date}</Text>
                  </View>
                  <Text style={[styles.logSummary, { color: themeColors.textSecondary }]}>
                    Customer <Text style={{ color: themeColors.text }}>{order.customerName}</Text> paid <Text style={{ color: themeColors.text }}>₹{order.total}</Text> to <Text style={{ color: themeColors.text }}>{order.kitchenName}</Text>
                  </Text>
                  <View style={[styles.logStatus, { 
                    backgroundColor: order.status === 'delivered' ? 'rgba(46,204,113,0.1)' : 'rgba(255,179,0,0.1)',
                  }]}>
                    <Text style={{ 
                      fontSize: 9, 
                      fontWeight: 'bold', 
                      color: order.status === 'delivered' ? '#2ecc71' : themeColors.primary 
                    }}>
                      {order.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* SUBTAB 2: CATEGORIES */}
        {activeSubTab === 'categories' && (
          <View style={styles.tabContent}>
            <View style={styles.sellerSection}>
              <Text style={[styles.sellerSectionTitle, { color: themeColors.text }]}>Category Management</Text>
              
              {/* Add Category Box */}
              <View style={[styles.addCatBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <TextInput
                  placeholder="Category Name (e.g. Pizza, Cake, Burger)"
                  placeholderTextColor="#888"
                  value={newCatName}
                  onChangeText={setNewCatName}
                  style={[styles.adminInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                />
                
                <View style={styles.imageSelectorRow}>
                  <TextInput
                    placeholder="Image URL or pick image"
                    placeholderTextColor="#888"
                    value={newCatImage}
                    onChangeText={setNewCatImage}
                    style={[styles.adminInput, { flex: 1, marginBottom: 0, marginRight: 10, backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                  />
                  <TouchableOpacity style={styles.uploadBtn} onPress={requestCategoryImageSource}>
                    <Camera size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>

                {newCatImage ? (
                  <Text style={styles.imagePickedText}>✓ Image linked successfully</Text>
                ) : null}

                <TouchableOpacity 
                  style={[styles.addCatBtn, { backgroundColor: themeColors.primary }]}
                  onPress={async () => {
                    if (!newCatName.trim()) {
                      Alert.alert('Error', 'Please enter a category name');
                      return;
                    }
                    await createCategory(newCatName.trim(), newCatImage.trim());
                    setNewCatName('');
                    setNewCatImage('');
                    Alert.alert('Success', 'Category added globally!');
                  }}
                >
                  <Text style={styles.addCatBtnText}>Add Category Tag</Text>
                </TouchableOpacity>
              </View>

              {/* Categories Grid list */}
              <View style={styles.categoriesGrid}>
                {categories.map((cat) => (
                  <View key={cat.id} style={[styles.catCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    {cat.image ? (
                      <Image source={{ uri: cat.image }} style={styles.catCardImage} />
                    ) : (
                      <View style={styles.catCardPlaceholder} />
                    )}
                    <View style={styles.catCardInfo}>
                      <Text style={[styles.catCardName, { color: themeColors.text }]} numberOfLines={1}>{cat.name}</Text>
                      <TouchableOpacity onPress={() => {
                        Alert.alert(
                          'Delete Category',
                          `Are you sure you want to delete category "${cat.name}" globally?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Delete', 
                              style: 'destructive',
                              onPress: () => {
                                deleteCategory(cat.id);
                                Alert.alert('Deleted', 'Category deleted globally.');
                              }
                            }
                          ]
                        );
                      }}>
                        <Trash2 size={14} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* SUBTAB 3: SELLERS STATISTICS */}
        {activeSubTab === 'sellers' && (
          <View style={styles.tabContent}>
            <View style={styles.sellerSection}>
              <Text style={[styles.sellerSectionTitle, { color: themeColors.text }]}>Seller Selection</Text>
              
              {/* Display selection chips */}
              <View style={styles.chipScrollContainer}>
                {kitchens.map(kitchen => (
                  <TouchableOpacity
                    key={kitchen.id}
                    style={[
                      styles.sellerChip, 
                      { backgroundColor: themeColors.card, borderColor: themeColors.border },
                      selectedSellerForStats?.id === kitchen.id && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
                    ]}
                    onPress={() => setSelectedSellerForStats(kitchen)}
                  >
                    <Text style={[
                      styles.sellerChipText, 
                      { color: themeColors.text },
                      selectedSellerForStats?.id === kitchen.id && { color: '#FFF', fontWeight: 'bold' }
                    ]}>
                      {kitchen.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Show Stats Panel if seller is selected */}
              {selectedSellerForStats ? (
                <View style={[styles.statsPanelCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, padding: 0, overflow: 'hidden' }]}>
                  {/* Shop Banner Image */}
                  <Image 
                    source={{ uri: selectedSellerForStats.image || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&auto=format&fit=crop&q=80' }} 
                    style={styles.statsBannerImage} 
                  />

                  <View style={{ padding: 20 }}>
                    <Text style={[styles.statsTitle, { color: themeColors.text }]}>{selectedSellerForStats.name}</Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 16 }}>
                      <Star size={12} color={themeColors.primary} fill={themeColors.primary} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 11, color: themeColors.textSecondary }}>
                        {Number(selectedSellerForStats.rating).toFixed(1)} rating ({selectedSellerForStats.ratingCount} reviews)
                      </Text>
                    </View>

                    {/* Operational KPIs */}
                    <View style={styles.metricsGrid}>
                      <View style={[styles.metricItem, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                        <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Total Orders</Text>
                        <Text style={[styles.metricVal, { color: themeColors.text }]}>{getSellerStats(selectedSellerForStats.id).totalOrders}</Text>
                      </View>
                      <View style={[styles.metricItem, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                        <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Weekly Jobs</Text>
                        <Text style={[styles.metricVal, { color: themeColors.primary }]}>{getSellerStats(selectedSellerForStats.id).weeklyOrdersCount}</Text>
                      </View>
                      <View style={[styles.metricItem, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                        <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Cancelled</Text>
                        <Text style={[styles.metricVal, { color: '#FF3B30' }]}>{getSellerStats(selectedSellerForStats.id).cancelledOrders}</Text>
                      </View>
                    </View>

                    <View style={{ height: 16 }} />

                    {/* Shop details fields */}
                    <View style={[styles.statsRow, { borderBottomColor: themeColors.border }]}>
                      <Text style={[styles.statsLabel, { color: themeColors.textSecondary }]}>Owner Name:</Text>
                      <Text style={[styles.statsVal, { color: themeColors.text }]}>
                        {selectedSellerForStats.ownerName || 'Housewife Partner'}
                      </Text>
                    </View>
                    
                    <View style={[styles.statsRow, { borderBottomColor: themeColors.border }]}>
                      <Text style={[styles.statsLabel, { color: themeColors.textSecondary }]}>Owner ID:</Text>
                      <Text style={[styles.statsVal, { color: themeColors.text }]}>
                        {selectedSellerForStats.owner}
                      </Text>
                    </View>

                    <View style={[styles.statsRow, { borderBottomColor: themeColors.border }]}>
                      <Text style={[styles.statsLabel, { color: themeColors.textSecondary }]}>Cuisines Type:</Text>
                      <Text style={[styles.statsVal, { color: themeColors.text }]}>
                        {selectedSellerForStats.cuisines}
                      </Text>
                    </View>

                    <View style={[styles.statsRow, { borderBottomColor: themeColors.border }]}>
                      <Text style={[styles.statsLabel, { color: themeColors.textSecondary }]}>Shop Address:</Text>
                      <Text style={[styles.statsVal, { color: themeColors.text, maxWidth: '60%', textAlign: 'right' }]} numberOfLines={2}>
                        {selectedSellerForStats.address || 'Address Not Provided'}
                      </Text>
                    </View>

                    <View style={[styles.statsRow, { borderBottomColor: themeColors.border }]}>
                      <Text style={[styles.statsLabel, { color: themeColors.textSecondary }]}>Bank Name:</Text>
                      <Text style={[styles.statsVal, { color: themeColors.text }]}>
                        {selectedSellerForStats.bankName || 'State Bank of India'}
                      </Text>
                    </View>

                    <View style={[styles.statsRow, { borderBottomColor: themeColors.border }]}>
                      <Text style={[styles.statsLabel, { color: themeColors.textSecondary }]}>Bank A/C Number:</Text>
                      <Text style={[styles.statsVal, { color: themeColors.text }]}>
                        {selectedSellerForStats.bankAccount || 'SBI A/C 90812376510'}
                      </Text>
                    </View>

                    <View style={[styles.statsRow, { borderBottomColor: themeColors.border }]}>
                      <Text style={[styles.statsLabel, { color: themeColors.textSecondary }]}>IFSC Code:</Text>
                      <Text style={[styles.statsVal, { color: themeColors.text }]}>
                        {selectedSellerForStats.ifscCode || 'SBIN0001043'}
                      </Text>
                    </View>

                    {/* Calling/Phone Contact Row with Click Action */}
                    <View style={[styles.statsRow, { borderBottomColor: themeColors.border }]}>
                      <Text style={[styles.statsLabel, { color: themeColors.textSecondary }]}>Mobile Number:</Text>
                      <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                        onPress={() => Linking.openURL(`tel:${selectedSellerForStats.phone || '9876543210'}`)}
                      >
                        <Phone size={13} color={themeColors.primary} style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: themeColors.primary }}>
                          {selectedSellerForStats.phone || '+91 9876543210'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.statsRow, { borderBottomColor: themeColors.border }]}>
                      <Text style={[styles.statsLabel, { fontWeight: 'bold', color: themeColors.text }]}>Total Net Revenue:</Text>
                      <Text style={{ fontWeight: 'bold', color: '#2ecc71', fontSize: 18 }}>
                        ₹{getSellerStats(selectedSellerForStats.id).totalEarnings}
                      </Text>
                    </View>

                    {/* Support Chat with Seller Action Button */}
                    <TouchableOpacity 
                      style={[styles.chatSellerBtn, { backgroundColor: themeColors.primary }]}
                      onPress={() => {
                        setSelectedRoom({
                          orderId: `support-seller-${selectedSellerForStats.owner}`,
                          customerId: selectedSellerForStats.owner,
                          customerName: `${selectedSellerForStats.name} (Seller)`
                        });
                        setShowSupportModal(true);
                      }}
                    >
                      <MessageSquare size={16} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>Chat with Seller</Text>
                    </TouchableOpacity>

                  </View>
                </View>
              ) : (
                <View style={styles.placeholderBox}>
                  <Store size={36} color={themeColors.textSecondary} style={{ marginBottom: 12 }} />
                  <Text style={{ color: themeColors.textSecondary, fontSize: 13 }}>Select a kitchen from the chips above to inspect metrics.</Text>
                </View>
              )}
            </View>
          </View>
        )}

      </ScrollView>

      {/* MODAL 1: Shop Administration Details */}
      {selectedKitchen && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={selectedKitchen !== null}
          onRequestClose={() => setSelectedKitchen(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
                <Text style={styles.modalTitle}>Shop Administration Details</Text>
                <TouchableOpacity onPress={() => setSelectedKitchen(null)} style={[styles.closeBtn, { backgroundColor: themeColors.border }]}>
                  <X size={18} color={themeColors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                {/* Shop Basic Details */}
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionHeader, { color: themeColors.textSecondary }]}>Basic Information</Text>
                  
                  <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Shop Name:</Text>
                    <Text style={[styles.detailValue, { color: themeColors.text }]}>{selectedKitchen.name}</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Owner Name:</Text>
                    <Text style={[styles.detailValue, { color: themeColors.text }]}>{selectedKitchen.ownerName || 'Housewife Partner'}</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Bank Name:</Text>
                    <Text style={[styles.detailValue, { color: themeColors.text }]}>{selectedKitchen.bankName || 'State Bank of India'}</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Bank Account:</Text>
                    <Text style={[styles.detailValue, { color: themeColors.text }]}>{selectedKitchen.bankAccount || '30948576291'}</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>IFSC Code:</Text>
                    <Text style={[styles.detailValue, { color: themeColors.text }]}>{selectedKitchen.ifscCode || 'SBIN0001043'}</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Cuisines:</Text>
                    <Text style={[styles.detailValue, { color: themeColors.text }]}>{selectedKitchen.cuisines}</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Address:</Text>
                    <Text style={[styles.detailValue, { color: themeColors.text }]}>{selectedKitchen.address || 'Not Specified'}</Text>
                  </View>
                </View>

                {/* Operations Stats */}
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionHeader, { color: themeColors.textSecondary }]}>Operational Metrics</Text>
                  
                  <View style={styles.metricsGrid}>
                    <View style={[styles.metricItem, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                      <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Total Orders</Text>
                      <Text style={[styles.metricVal, { color: themeColors.text }]}>{getSellerStats(selectedKitchen.id).totalOrders}</Text>
                    </View>
                    <View style={[styles.metricItem, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                      <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Weekly Orders</Text>
                      <Text style={[styles.metricVal, { color: themeColors.primary }]}>{getSellerStats(selectedKitchen.id).weeklyOrdersCount}</Text>
                    </View>
                    <View style={[styles.metricItem, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                      <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Cancelled</Text>
                      <Text style={[styles.metricVal, { color: '#FF3B30' }]}>{getSellerStats(selectedKitchen.id).cancelledOrders}</Text>
                    </View>
                  </View>

                  <View style={[styles.detailRow, { marginTop: 15, borderTopWidth: 1, borderTopColor: themeColors.border, paddingTop: 10 }]}>
                    <Text style={[styles.detailLabel, { fontWeight: 'bold', color: themeColors.text }]}>Total Net Earnings:</Text>
                    <Text style={[styles.detailValue, { fontWeight: 'bold', color: '#2ecc71', fontSize: 16 }]}>
                      ₹{getSellerStats(selectedKitchen.id).totalEarnings}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* MODAL 2: Support Chats center per customer ID */}
      {showSupportModal && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showSupportModal}
          onRequestClose={() => {
            setShowSupportModal(false);
            setSelectedRoom(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card, borderColor: themeColors.border, height: '75%' }]}>
              <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
                {selectedRoom ? (
                  <TouchableOpacity style={styles.backToRoomsBtn} onPress={() => setSelectedRoom(null)}>
                    <ArrowLeft size={16} color={themeColors.primary} />
                    <Text style={[styles.backToRoomsText, { color: themeColors.primary }]}>Rooms</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.modalTitle}>User Support Channels</Text>
                )}
                
                <TouchableOpacity 
                  onPress={() => {
                    setShowSupportModal(false);
                    setSelectedRoom(null);
                  }} 
                  style={[styles.closeBtn, { backgroundColor: themeColors.border }]}
                >
                  <X size={18} color={themeColors.text} />
                </TouchableOpacity>
              </View>

              {/* RENDER VIEW 1: List of Active support rooms */}
              {!selectedRoom ? (
                <ScrollView 
                  contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={{ fontSize: 12, color: themeColors.textSecondary, marginBottom: 15, textAlign: 'center' }}>
                    Active support chat tickets. Select a session to read and reply.
                  </Text>
                  {supportRooms.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: themeColors.textSecondary, marginTop: 40 }}>
                      No support chats received yet.
                    </Text>
                  ) : (
                    supportRooms.map((room) => (
                      <TouchableOpacity 
                        key={room.orderId} 
                        style={[styles.supportRoomRow, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
                        onPress={() => setSelectedRoom(room)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.roomNameText, { color: themeColors.text }]}>{room.customerName}</Text>
                          <Text style={{ fontSize: 10, color: themeColors.textSecondary, marginTop: 2 }}>
                            {room.orderId.includes('-seller-') ? 'Role: SELLER' : 'Role: CUSTOMER'} • ID: {room.customerId}
                          </Text>
                        </View>
                        <ChevronRight size={16} color={themeColors.primary} />
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              ) : (
                /* RENDER VIEW 2: Messages inside selected support room */
                <>
                  <View style={styles.activeRoomBar}>
                    <Text style={[styles.activeRoomTitle, { color: themeColors.text }]}>Chatting with: {selectedRoom.customerName}</Text>
                  </View>

                  <ScrollView 
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {supportMessages.length === 0 ? (
                      <Text style={{ textAlign: 'center', color: themeColors.textSecondary, marginTop: 40 }}>
                        Start of conversation history.
                      </Text>
                    ) : (
                      supportMessages.map((msg) => (
                        <View 
                          key={msg.id} 
                          style={{ 
                            marginVertical: 6,
                            alignSelf: msg.senderId === 'usr-admin-support' ? 'flex-end' : 'flex-start',
                            backgroundColor: msg.senderId === 'usr-admin-support' ? themeColors.primary : themeColors.background,
                            padding: 12,
                            borderRadius: 12,
                            maxWidth: '80%'
                          }}
                        >
                          <Text style={{ fontSize: 9, fontWeight: 'bold', color: msg.senderId === 'usr-admin-support' ? '#FFF' : themeColors.primary, marginBottom: 2 }}>
                            {msg.senderName}
                          </Text>
                          <Text style={{ fontSize: 13, color: msg.senderId === 'usr-admin-support' ? '#FFF' : themeColors.text }}>
                            {msg.message}
                          </Text>
                        </View>
                      ))
                    )}
                  </ScrollView>

                  {/* Admin Input Row */}
                  <View style={{ flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: themeColors.border, alignItems: 'center' }}>
                    <TextInput
                      placeholder="Type administrator response..."
                      placeholderTextColor="#888"
                      value={supportInput}
                      onChangeText={setSupportInput}
                      style={[styles.adminInput, { flex: 1, marginBottom: 0, marginRight: 10, backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                    />
                    <TouchableOpacity 
                      style={{ backgroundColor: themeColors.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
                      onPress={handleSendSupportReply}
                      disabled={sendingSupport}
                    >
                      <Send size={18} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      )}

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
                <Store size={20} color={themeColors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.drawerTitle, { color: themeColors.text }]}>Admin Services</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDrawer(false)} style={[styles.closeBtn, { backgroundColor: themeColors.border }]}>
                <X size={18} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.drawerScrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.drawerSection}>
                {/* Navigation Button 1: Add Banner */}
                <TouchableOpacity 
                  style={[styles.drawerNavBtn, { backgroundColor: themeColors.inputBg }]} 
                  onPress={() => {
                    setShowDrawer(false);
                    router.push('/add-banner');
                  }}
                >
                  <Plus size={20} color={themeColors.primary} style={{ marginRight: 12 }} />
                  <Text style={[styles.drawerNavText, { color: themeColors.text }]}>Add Banner</Text>
                </TouchableOpacity>

                {/* Navigation Button 2: Show All Banners */}
                <TouchableOpacity 
                  style={[styles.drawerNavBtn, { backgroundColor: themeColors.inputBg }]} 
                  onPress={() => {
                    setShowDrawer(false);
                    router.push('/all-banners');
                  }}
                >
                  <ImageIcon size={20} color={themeColors.primary} style={{ marginRight: 12 }} />
                  <Text style={[styles.drawerNavText, { color: themeColors.text }]}>Show All Banners</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  goldHeader: {
    backgroundColor: '#FFCC00', // Customer style Gold header
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  adminSupportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adminSupportBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    padding: 3,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  subTabActive: {
    backgroundColor: '#FFF',
  },
  subTabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subTabTextActive: {
    color: '#FFB300',
  },
  tabContent: {
    paddingBottom: 40,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 8,
  },
  kpiLabel: {
    fontSize: 9,
    marginTop: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  sellerSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sellerSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  kitchenAdminCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  kitchenAdminName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  kitchenAdminOwner: {
    fontSize: 10,
    marginTop: 2,
  },
  kitchenAdminStats: {
    alignItems: 'flex-end',
  },
  adminStatVal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  adminStatLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  statusApprovedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46,204,113,0.1)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusApprovedText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginLeft: 4,
  },
  statusPendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,179,0,0.1)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusPendingText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFB300',
    marginLeft: 4,
  },
  statusRejectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusRejectedText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginLeft: 4,
  },
  approveActionBtn: {
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  approveActionText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
  },
  logCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB300',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 2,
    elevation: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  logId: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  logDate: {
    fontSize: 9,
  },
  logSummary: {
    fontSize: 11,
    lineHeight: 16,
  },
  logStatus: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 8,
  },
  addCatBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 3,
    elevation: 1,
  },
  adminInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  imageSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadBtn: {
    backgroundColor: '#FFB300',
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickedText: {
    fontSize: 11,
    color: '#2ecc71',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addCatBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCatBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  catCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 3,
    elevation: 1,
  },
  catCardImage: {
    width: '100%',
    height: 90,
    backgroundColor: '#EEE',
  },
  catCardPlaceholder: {
    width: '100%',
    height: 90,
    backgroundColor: '#E5E5E5',
  },
  catCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  catCardName: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  chipScrollContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  sellerChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  sellerChipText: {
    fontSize: 12,
  },
  statsPanelCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsSubtitle: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statsLabel: {
    fontSize: 13,
  },
  statsVal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 16,
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
    maxHeight: '80%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFB300',
  },
  closeBtn: {
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 6,
  },
  backToRoomsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backToRoomsText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  supportRoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  roomNameText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeRoomBar: {
    backgroundColor: '#FFEFEB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  activeRoomTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsBannerImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#EAEAEA',
  },
  chatSellerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
    shadowColor: '#FFB300',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  userGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  userCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 2,
    elevation: 1,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  drawerContent: {
    width: '80%',
    height: '100%',
    borderRightWidth: 1,
    paddingTop: 50,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  drawerScrollBody: {
    padding: 16,
  },
  drawerSection: {
    marginBottom: 20,
  },
  drawerNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  drawerNavText: {
    fontSize: 14,
    fontWeight: '600',
  }
});
