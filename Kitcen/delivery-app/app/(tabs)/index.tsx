import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  Alert, 
  Modal, 
  TextInput, 
  ActivityIndicator, 
  Switch,
  Image 
} from 'react-native';
import { 
  MapPin, 
  MessageSquare, 
  Send, 
  X, 
  Phone, 
  Moon, 
  Sun, 
  HelpCircle, 
  AlertTriangle, 
  Award, 
  Gift,
  Compass, 
  Power, 
  Navigation, 
  Clock, 
  TrendingUp, 
  User, 
  CheckCircle2, 
  Bike, 
  Check, 
  FileText, 
  Info, 
  History, 
  Plus, 
  DollarSign, 
  Activity, 
  Calendar, 
  Inbox, 
  ShieldAlert,
  Sparkles
} from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL } from '../../store/apiConfig';
import { alertService } from '../../store/alertService';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToServer } from '../../store/uploadHelper';
import * as Location from 'expo-location';

export default function RiderDashboard() {
  const user = useAuthStore(state => state.user);
  const riderId = user?.id || 'usr-rider-simulated';

  const orders = useKitchenStore(state => state.orders);
  const kitchens = useKitchenStore(state => state.kitchens);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);
  const updateOrderStatus = useKitchenStore(state => state.updateOrderStatus);
  const acceptOrder = useKitchenStore(state => state.acceptOrder);

  // Theme & Duty state from central Zustand store
  const isDarkMode = useAuthStore(state => state.isDarkMode);
  const setTheme = useAuthStore(state => state.setTheme);
  const isOnline = useAuthStore(state => state.isOnline);
  const setDutyStatus = useAuthStore(state => state.setDutyStatus);

  // Location tracking states
  const [riderLat, setRiderLat] = useState(28.6273);
  const [riderLon, setRiderLon] = useState(77.3725);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setRiderLat(loc.coords.latitude);
        setRiderLon(loc.coords.longitude);
        
        try {
          await fetch(`${API_BASE_URL}/api/auth/rider/location`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${useAuthStore.getState().token}`
            },
            body: JSON.stringify({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude
            })
          });
        } catch (err) {
          console.warn('Failed to sync location to server:', err);
        }
      }
    })();
  }, [isOnline]);

  const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1-a));
    return R * c;
  };

  const [payoutInfo, setPayoutInfo] = useState<any>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delivery zone/area filter choice
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const AVAILABLE_ZONES = ['All', 'Noida', 'Indirapuram', 'Vasundhara', 'Vaishali', 'Greater Noida', 'Sector 62'];

  const isOrderInSelectedZone = (o: any) => {
    if (selectedZone === 'All') return true;
    const kitchen = kitchens.find((k) => k.id === o.kitchenId);
    const zoneLower = selectedZone.toLowerCase();
    const kitchenMatch = kitchen?.address && kitchen.address.toLowerCase().includes(zoneLower);
    const deliveryMatch = o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(zoneLower);
    return !!(kitchenMatch || deliveryMatch);
  };

  const fetchPayoutInfo = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/wallet/${riderId}/payout-info`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setPayoutInfo(json.data);
        }
      }
    } catch (err) {
      console.warn('Error fetching payout info:', err);
    }
  };

  useEffect(() => {
    fetchPayoutInfo();
    const interval = setInterval(fetchPayoutInfo, 8000);
    return () => clearInterval(interval);
  }, [riderId]);

  useEffect(() => {
    console.log('[RiderDashboard] Orders in state:', orders.map(o => ({ id: o.id, status: o.status, riderId: o.riderId })));
    console.log('[RiderDashboard] AvailableOrdersPool:', availableOrdersPool.map(o => o.id));
    console.log('[RiderDashboard] SelectedZone:', selectedZone);
    console.log('[RiderDashboard] IsOnline:', isOnline);
  }, [orders, availableOrdersPool, selectedZone, isOnline]);

  const getTodayEarnings = () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return orders
      .filter(o => o.riderId === riderId && o.status === 'delivered' && o.deliveredAt && new Date(o.deliveredAt.replace(' ', 'T')) >= todayStart)
      .reduce((sum, o) => sum + Number(o.deliveryCharge || 40), 0);
  };

  // Chat state
  const [chatOrder, setChatOrder] = useState<any>(null);
  const [chatRecipientType, setChatRecipientType] = useState<'seller' | 'customer'>('customer');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [chatInterval, setChatInterval] = useState<any>(null);

  // Fetch orders & kitchens on mount
  useEffect(() => {
    fetchOrders();
    fetchKitchens();
  }, []);

  // Poll orders & kitchens periodically only if online
  useEffect(() => {
    if (isOnline) {
      fetchOrders();
      fetchKitchens();
      const interval = setInterval(() => {
        fetchOrders();
        fetchKitchens();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  // Alert when a new order becomes available in the pool
  const prevAvailableOrderIds = useRef<string[]>([]);
  useEffect(() => {
    if (!isOnline) {
      prevAvailableOrderIds.current = [];
      return;
    }
    
    // Available orders: no riderId, status in ['ready', 'placed', 'preparing'] and matching chosen zone
    const availableIds = orders
      .filter((o) => !o.riderId && ['ready', 'placed', 'preparing'].includes(o.status) && isOrderInSelectedZone(o))
      .map((o) => o.id);

    // Find if there are any new IDs that were not in our previous list
    const newOrders = availableIds.filter(id => !prevAvailableOrderIds.current.includes(id));
    
    if (newOrders.length > 0) {
      alertService.triggerOrderAlert();
      console.log('New orders detected for rider:', newOrders);
    }
    
    prevAvailableOrderIds.current = availableIds;
  }, [orders, isOnline]);

  // Poll chat messages when modal is active
  useEffect(() => {
    if (chatOrder) {
      loadChatMessages();
      const interval = setInterval(loadChatMessages, 3000);
      setChatInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (chatInterval) {
        clearInterval(chatInterval);
        setChatInterval(null);
      }
    }
  }, [chatOrder]);

  const loadChatMessages = async () => {
    if (!chatOrder) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${chatOrder.id}/chats`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setMessages(json.data);
        }
      }
    } catch (err: any) {
      console.warn('Error loading chat messages:', err.message);
    }
  };

  const sendChatMessage = async () => {
    if (!newMessageText.trim() || !chatOrder) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${chatOrder.id}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: riderId,
          message: newMessageText.trim()
        })
      });
      if (res.ok) {
        setNewMessageText('');
        loadChatMessages();
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!isOnline) {
      Alert.alert('Off Duty', 'You must go online to accept orders.');
      return;
    }
    const success = await acceptOrder(orderId, riderId);
    if (success) {
      Alert.alert('Order Accepted', 'Go to pickup kitchen details on your dashboard.');
    } else {
      Alert.alert('Error', 'Failed to accept order. It might already be taken.');
    }
  };

  const pickImageFromCamera = async (): Promise<string | null> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required to take order photo.');
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      return null;
    } catch (e) {
      Alert.alert('Camera Error', 'Could not open camera.');
      return null;
    }
  };

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus: typeof orders[0]['status'] = 'placed';
    let promptMsg = '';
    
    if (currentStatus === 'ready') {
      nextStatus = 'on_the_way';
      promptMsg = 'Please take a photo of the order package at the seller counter before picking it up.';
    } else if (currentStatus === 'on_the_way') {
      nextStatus = 'delivered';
      promptMsg = 'Please take a photo of the order handover at the customer location to complete delivery.';
    } else {
      return;
    }

    Alert.alert(
      'Camera Verification Required',
      promptMsg,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Camera',
          onPress: async () => {
            const localUri = await pickImageFromCamera();
            if (!localUri) return;

            setIsUpdatingStatus(true);
            try {
              const uploadedUrl = await uploadImageToServer(localUri);
              if (!uploadedUrl) {
                Alert.alert('Error', 'Failed to upload photo to server. Please try again.');
                setIsUpdatingStatus(false);
                return;
              }

              let pickupPhotoUrl: string | undefined = undefined;
              let deliveryPhotoUrl: string | undefined = undefined;
              if (currentStatus === 'ready') {
                pickupPhotoUrl = uploadedUrl;
              } else {
                deliveryPhotoUrl = uploadedUrl;
              }

              const success = await updateOrderStatus(orderId, nextStatus, pickupPhotoUrl, deliveryPhotoUrl);
              if (success) {
                Alert.alert('Success', `Order status updated to: ${nextStatus.replace('_', ' ').toUpperCase()}`);
                fetchPayoutInfo();
              } else {
                Alert.alert('Error', 'Failed to update order status.');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Verification failed. Try again.');
            } finally {
              setIsUpdatingStatus(false);
            }
          }
        }
      ]
    );
  };

  const handleOpenMaps = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open Google Maps'));
  };

  const triggerSOS = () => {
    Alert.alert(
      'EMERGENCY SOS',
      'Are you in danger? Clicking call now will connect you directly to the Cloude Kitchen Emergency Line.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', style: 'destructive', onPress: () => Linking.openURL('tel:+919119119110') }
      ]
    );
  };

  const triggerHelp = () => {
    Alert.alert(
      'Rider Support Helpdesk',
      'Need help with an active delivery? Call support helpline.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Support', onPress: () => Linking.openURL('tel:+919888877766') }
      ]
    );
  };

  // Filter orders
  const activeDeliveries = orders.filter(
    (o) => o.riderId === riderId && ['ready', 'on_the_way', 'preparing'].includes(o.status)
  );

  const availableOrdersPool = orders.filter(
    (o) => !o.riderId && ['ready', 'placed', 'preparing'].includes(o.status) && isOrderInSelectedZone(o)
  );

  // Dynamic colors based on theme mode
  const themeColors = {
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      
      {/* Header (Fixed at the top, does not scroll) */}
      <View style={[styles.header, { backgroundColor: '#FFCC00', borderBottomColor: '#E2B200' }]}>
        
        {/* Toggle Switch Duty */}
        <TouchableOpacity 
          style={[
            styles.toggleDutyBtn, 
            { backgroundColor: isOnline ? '#249B3E' : '#333' }
          ]}
          onPress={() => setDutyStatus(!isOnline)}
          activeOpacity={0.8}
        >
          <View style={[styles.toggleDot, { alignSelf: isOnline ? 'flex-end' : 'flex-start' }]} />
          <Text style={[styles.toggleText, { color: '#FFF' }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </TouchableOpacity>

        {/* Action icons */}
        <View style={styles.headerActions}>
          
          {/* Light / Dark Mode Toggle */}
          <TouchableOpacity 
            style={[styles.actionIconBtn, { borderColor: '#E2B200', backgroundColor: 'rgba(0,0,0,0.05)' }]} 
            onPress={() => setTheme(!isDarkMode)}
          >
            {isDarkMode ? <Sun size={16} color="#000" /> : <Moon size={16} color="#000" />}
          </TouchableOpacity>

          {/* Help Support */}
          <TouchableOpacity 
            style={[styles.actionIconBtn, { borderColor: '#E2B200', backgroundColor: 'rgba(0,0,0,0.05)', minWidth: 55 }]} 
            onPress={triggerHelp}
          >
            <HelpCircle size={14} color="#000" />
            <Text style={[styles.actionIconLabel, { color: '#000' }]}>HELP</Text>
          </TouchableOpacity>

          {/* SOS Emergency */}
          <TouchableOpacity 
            style={[styles.actionIconBtn, { borderColor: '#FF3B30', backgroundColor: 'rgba(255,59,48,0.1)' }]} 
            onPress={triggerSOS}
          >
            <ShieldAlert size={14} color="#FF3B30" />
            <Text style={[styles.actionIconLabel, { color: '#FF3B30', fontWeight: 'bold' }]}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scrollable Body */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 40 }} 
        showsVerticalScrollIndicator={false}
      >
        {isUpdatingStatus && (
          <View style={{ padding: 12, backgroundColor: '#FFCC00', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#000" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 12, color: '#000', fontWeight: 'bold' }}>Uploading photo & updating order status...</Text>
          </View>
        )}

        {/* Active Delivery Area Selector (Only visible when Online) */}
        {isOnline && (
          <View style={{ paddingHorizontal: 16, marginTop: 15 }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: themeColors.textSecondary, marginBottom: 8, letterSpacing: 0.5 }}>
              ACTIVE DELIVERY AREA CHOICE
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 2 }}>
              {AVAILABLE_ZONES.map((zone) => {
                const isActive = selectedZone === zone;
                return (
                  <TouchableOpacity
                    key={zone}
                    onPress={() => setSelectedZone(zone)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 18,
                      backgroundColor: isActive ? '#FFCC00' : themeColors.card,
                      borderWidth: 1,
                      borderColor: isActive ? '#FFCC00' : themeColors.border,
                      marginRight: 8,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 1,
                      elevation: 1
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: isActive ? 'bold' : 'normal', color: isActive ? '#000' : themeColors.text }}>
                      📍 {zone}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Payout & Earnings Summary Card (Visible in both online/offline) */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <View style={[styles.payoutSummaryCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.payoutHeaderTitle, { color: themeColors.textSecondary }]}>
              WEEKLY PAYOUT CYCLE (7 DAYS)
            </Text>
            
            <View style={styles.payoutMetricsRow}>
              {/* Today's Earnings */}
              <View style={styles.payoutMetricItem}>
                <Text style={styles.payoutMetricLabel}>Today's Earnings</Text>
                <Text style={[styles.payoutMetricVal, { color: '#2ecc71' }]}>
                  ₹{getTodayEarnings()}
                </Text>
                <Text style={styles.payoutMetricSub}>Resets at 12 AM</Text>
              </View>

              {/* Divider */}
              <View style={[styles.verticalDivider, { backgroundColor: themeColors.border }]} />

              {/* Current Cycle (Unpaid Balance) */}
              <View style={styles.payoutMetricItem}>
                <Text style={styles.payoutMetricLabel}>Unpaid Balance</Text>
                <Text style={[styles.payoutMetricVal, { color: '#FFCC00' }]}>
                  ₹{payoutInfo?.unpaidBalance ?? 0}
                </Text>
                <Text style={styles.payoutMetricSub}>Payout in {payoutInfo?.daysRemaining ?? 7} days</Text>
              </View>
            </View>

            {/* Next Payout Details bar */}
            <View style={[styles.payoutFooterBar, { backgroundColor: isDarkMode ? '#1a1a1a' : '#eaeaea' }]}>
              <Calendar size={12} color={themeColors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.payoutFooterText, { color: themeColors.text }]}>
                Next Payout: <Text style={{ fontWeight: 'bold' }}>{payoutInfo?.nextPayoutDate ?? 'Calculating...'}</Text>
              </Text>
            </View>
          </View>
        </View>
        
        {/* IF OFFLINE (OFF DUTY VIEW) */}
        {!isOnline ? (
          <View style={styles.offlineWrapper}>
            
            {/* Shift Booking Card */}
            <View style={[styles.shiftCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={styles.shiftHeader}>
                <View>
                  <Text style={[styles.shiftTitle, { color: themeColors.text }]}>High earning shift Live!</Text>
                  <Text style={styles.shiftTimings}>2:00 pm - 4:00 pm  <Text style={{ color: '#E23744', fontWeight: 'bold' }}>● LIVE</Text></Text>
                </View>
                <View style={styles.shiftAvatarContainer}>
                  <Award size={36} color="#FF9500" />
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.greenOnlineBtn}
                onPress={() => setDutyStatus(true)}
              >
                <Text style={styles.greenOnlineText}>Let's book and go online</Text>
              </TouchableOpacity>
            </View>

            {/* Refer and Earn Row */}
            <View style={[styles.referBanner, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Gift size={20} color="#E23744" style={{ marginRight: 8 }} />
                <Text style={[styles.referTitle, { color: themeColors.text }]}>Refer Friend & Earn</Text>
              </View>
              <View style={styles.referAmtBadge}>
                <Text style={styles.referAmtText}>upto ₹15,000 ❯</Text>
              </View>
            </View>

            {/* Promotional Carousels */}
            <View style={[styles.promoCard, { backgroundColor: '#2ecc71', borderColor: '#27ae60' }]}>
              <View style={styles.promoContent}>
                <Text style={styles.promoLabel}>Low-Interest, Fast Personal Loans!</Text>
                <TouchableOpacity style={styles.promoActionBtn}>
                  <Text style={styles.promoActionText}>KNOW MORE</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Warning deposit alert bar */}
            <View style={[styles.warningBox, { backgroundColor: '#FFCC00' }]}>
              <AlertTriangle size={18} color="#000" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>You may not get new orders!</Text>
                <Text style={styles.warningSubtitle}>Cash collected is HIGH! Deposit now.</Text>
              </View>
              <TouchableOpacity style={styles.warningBtn}>
                <Text style={styles.warningBtnText}>Deposit Now</Text>
              </TouchableOpacity>
            </View>

          </View>
        ) : (
          
          /* IF ONLINE (ACTIVE DUTY VIEW) */
          <View style={styles.onlineWrapper}>
            
            {/* Status Info */}
            <View style={styles.onlineStatusHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>🟢 Online & Ready for Orders</Text>
              <Text style={[styles.sectionDesc, { color: themeColors.textSecondary }]}>Keep app open. New incoming delivery requests will appear below.</Text>
            </View>

            {/* Active Deliveries (Accepted Tasks) */}
            {activeDeliveries.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={[styles.subSectionTitle, { color: themeColors.text }]}>Active Delivery Tasks ({activeDeliveries.length})</Text>
                {activeDeliveries.map((delivery) => {
                  const isPickedUp = delivery.status === 'on_the_way';
                  return (
                    <View key={delivery.id} style={[styles.deliveryCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                      
                      <View style={styles.cardHeader}>
                        <Text style={[styles.orderId, { color: themeColors.text }]}>{delivery.id}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: isPickedUp ? 'rgba(46,204,113,0.1)' : 'rgba(255,204,0,0.1)' }]}>
                          <Text style={[styles.statusText, { color: isPickedUp ? '#2ecc71' : theme.colors.warning }]}>
                            {delivery.status === 'preparing' ? 'SELLER PREPARING' : delivery.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {/* Map Pins Timeline for both nodes */}
                      <View style={styles.pathContainer}>
                        {/* Shop Node */}
                        <View style={styles.pathNode}>
                          <MapPin size={16} color={theme.colors.veg} />
                          <View style={styles.nodeDetails}>
                            <Text style={[styles.nodeTitle, !isPickedUp && { color: theme.colors.primary, fontWeight: 'bold' }]}>
                              Step 1: Go to Pickup Shop {!isPickedUp && '★ (CURRENT)'}
                            </Text>
                            <Text style={[styles.nodeName, { color: themeColors.text }]}>{delivery.kitchenName}</Text>
                            <Text style={[styles.nodeAddress, { color: themeColors.textSecondary }]}>
                              Address: {delivery.kitchenAddress || kitchens.find(k => k.id === delivery.kitchenId)?.address || 'Collect from Vendor Counter'}
                            </Text>
                            
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                              <TouchableOpacity 
                                style={[styles.mapLinkBtn, { borderColor: themeColors.border }]}
                                onPress={() => handleOpenMaps(delivery.kitchenAddress || kitchens.find(k => k.id === delivery.kitchenId)?.address || delivery.kitchenName)}
                              >
                                <Text style={[styles.mapLinkText, { color: themeColors.text }]}>🗺 Navigate Shop</Text>
                              </TouchableOpacity>

                              <TouchableOpacity 
                                style={[styles.mapLinkBtn, { marginLeft: 8, borderColor: 'rgba(52,199,89,0.2)', backgroundColor: 'rgba(52,199,89,0.1)' }]}
                                onPress={() => Linking.openURL(`tel:${delivery.kitchenPhone || kitchens.find(k => k.id === delivery.kitchenId)?.ownerPhone || '9876543210'}`)}
                              >
                                <Text style={[styles.mapLinkText, { color: theme.colors.success }]}>📞 Call Seller</Text>
                              </TouchableOpacity>

                              <TouchableOpacity 
                                style={[styles.mapLinkBtn, { marginLeft: 8, borderColor: 'rgba(0,122,255,0.2)', backgroundColor: 'rgba(0,122,255,0.1)' }]}
                                onPress={() => {
                                  setChatRecipientType('seller');
                                  setChatOrder(delivery);
                                }}
                              >
                                <Text style={[styles.mapLinkText, { color: '#007AFF' }]}>💬 Chat Seller</Text>
                              </TouchableOpacity>
                            </View>

                            {delivery.pickupPhotoUrl && (
                              <View style={{ marginTop: 8 }}>
                                <Text style={{ fontSize: 9, color: '#2ecc71', fontWeight: 'bold' }}>✓ Pickup Photo:</Text>
                                <Image source={{ uri: delivery.pickupPhotoUrl }} style={{ width: 120, height: 80, borderRadius: 6, marginTop: 4 }} />
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Connection Line */}
                        <View style={styles.verticalDottedLine} />

                        {/* Customer Node */}
                        <View style={styles.pathNode}>
                          <MapPin size={16} color={theme.colors.primary} />
                          <View style={styles.nodeDetails}>
                            <Text style={[styles.nodeTitle, isPickedUp && { color: theme.colors.primary, fontWeight: 'bold' }]}>
                              Step 2: Deliver to Customer {isPickedUp && '★ (CURRENT)'}
                            </Text>
                            <Text style={[styles.nodeName, { color: themeColors.text }]}>{delivery.customerName}</Text>
                            <Text style={[styles.nodeAddress, { color: themeColors.textSecondary }]}>Address: {delivery.deliveryAddress || 'Royal Residency, Pune'}</Text>

                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                              <TouchableOpacity 
                                style={[styles.mapLinkBtn, { borderColor: themeColors.border }]}
                                onPress={() => handleOpenMaps(delivery.deliveryAddress || 'Royal Residency, Pune')}
                              >
                                <Text style={[styles.mapLinkText, { color: themeColors.text }]}>🗺 Navigate Customer</Text>
                              </TouchableOpacity>

                              <TouchableOpacity 
                                style={[styles.mapLinkBtn, { marginLeft: 8, borderColor: 'rgba(52,199,89,0.2)', backgroundColor: 'rgba(52,199,89,0.1)' }]}
                                onPress={() => Linking.openURL(`tel:${delivery.customerPhone || '+91 9876543210'}`)}
                              >
                                <Text style={[styles.mapLinkText, { color: theme.colors.success }]}>📞 Call Customer</Text>
                              </TouchableOpacity>

                              <TouchableOpacity 
                                style={[styles.mapLinkBtn, { marginLeft: 8, borderColor: 'rgba(0,122,255,0.2)', backgroundColor: 'rgba(0,122,255,0.1)' }]}
                                onPress={() => {
                                  setChatRecipientType('customer');
                                  setChatOrder(delivery);
                                }}
                              >
                                <Text style={[styles.mapLinkText, { color: '#007AFF' }]}>💬 Chat Customer</Text>
                              </TouchableOpacity>
                            </View>

                            {delivery.deliveryPhotoUrl && (
                              <View style={{ marginTop: 8 }}>
                                <Text style={{ fontSize: 9, color: '#2ecc71', fontWeight: 'bold' }}>✓ Delivery Photo:</Text>
                                <Image source={{ uri: delivery.deliveryPhotoUrl }} style={{ width: 120, height: 80, borderRadius: 6, marginTop: 4 }} />
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Timestamps */}
                      <View style={[styles.timestampsContainer, { borderTopColor: themeColors.border }]}>
                        <Text style={styles.timestampText}>🕒 Ordered At: {delivery.createdAt || delivery.date}</Text>
                        {delivery.acceptedByRiderAt && (
                          <Text style={styles.timestampText}>🏍 Accepted At: {delivery.acceptedByRiderAt}</Text>
                        )}
                        {delivery.pickedUpAt && (
                          <Text style={styles.timestampText}>📦 Picked Up At: {delivery.pickedUpAt}</Text>
                        )}
                      </View>

                      {/* Complete Buttons */}
                      <View style={styles.cardFooter}>
                        <TouchableOpacity 
                          style={[styles.actionBtn, { flex: 1, backgroundColor: delivery.status === 'preparing' ? '#333' : theme.colors.primary }]}
                          disabled={delivery.status === 'preparing'}
                          onPress={() => handleUpdateStatus(delivery.id, delivery.status)}
                        >
                          <Text style={[styles.actionBtnText, { color: delivery.status === 'preparing' ? '#888' : '#000', textAlign: 'center' }]}>
                            {delivery.status === 'preparing' 
                              ? 'Waiting for Vendor...' 
                              : delivery.status === 'ready' 
                                ? '📸 Pick Up Order' 
                                : '📸 Mark Delivered'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                    </View>
                  );
                })}
              </View>
            )}

            {/* Available Orders Pool */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.subSectionTitle, { color: themeColors.text }]}>Available Nearby Jobs ({availableOrdersPool.length})</Text>
              {availableOrdersPool.map((order) => {
                const shopLat = order.shopLatitude ? Number(order.shopLatitude) : 28.5355;
                const shopLon = order.shopLongitude ? Number(order.shopLongitude) : 77.3910;
                const custLat = order.customerLatitude ? Number(order.customerLatitude) : 28.5355;
                const custLon = order.customerLongitude ? Number(order.customerLongitude) : 77.3910;

                const riderToShop = getHaversineDistance(riderLat, riderLon, shopLat, shopLon);
                const shopToCust = getHaversineDistance(shopLat, shopLon, custLat, custLon);

                return (
                  <View key={order.id} style={[styles.poolCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <View style={styles.poolHeader}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={[styles.poolTitle, { color: themeColors.text }]}>{order.kitchenName}</Text>
                        <Text style={[styles.poolDistance, { color: themeColors.textSecondary, fontSize: 11 }]} numberOfLines={1}>
                          Shop: {order.kitchenAddress || kitchens.find(k => k.id === order.kitchenId)?.address || 'Noida Sector 132'}
                        </Text>
                        <Text style={[styles.poolDistance, { color: themeColors.textSecondary, fontSize: 11 }]} numberOfLines={2}>
                          Drop: {order.deliveryAddress || 'Customer Location'}
                        </Text>
                        
                        <View style={{ flexDirection: 'row', marginTop: 6, gap: 10 }}>
                          <Text style={{ fontSize: 11, color: '#FFB300', fontWeight: 'bold' }}>
                            🏍 Shop: {riderToShop.toFixed(1)} km
                          </Text>
                          <Text style={{ fontSize: 11, color: '#2ecc71', fontWeight: 'bold' }}>
                            📍 Drop: {shopToCust.toFixed(1)} km
                          </Text>
                        </View>
                      </View>
                      <View style={styles.poolPayout}>
                        <Text style={styles.payoutVal}>₹{Number(order.deliveryCharge || 40).toFixed(0)}</Text>
                        <Text style={styles.payoutLabel}>Est. Payout</Text>
                      </View>
                    </View>

                    <View style={[styles.poolFooter, { borderTopColor: themeColors.border }]}>
                      <Text style={[styles.poolTotal, { color: themeColors.text }]}>Total Bill: ₹{order.total} • COD</Text>
                      <TouchableOpacity 
                        style={styles.acceptJobBtn}
                        onPress={() => handleAcceptOrder(order.id)}
                      >
                        <Text style={styles.acceptJobText}>Accept Order</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {availableOrdersPool.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Sparkles size={32} color="#888" style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyText}>All quiet! We will notify you when a new order is ready for pickup.</Text>
                </View>
              )}
            </View>

            {/* Metric Earnings Summary at Bottom */}
            <View style={[styles.bottomStatsCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Text style={[styles.statsHeader, { color: themeColors.text }]}>Rider Delivery Metrics</Text>
              <View style={styles.statsRow}>
                <View style={styles.statsItem}>
                  <Text style={[styles.statsVal, { color: themeColors.text }]}>{orders.filter(o => o.riderId === riderId && o.status === 'delivered').length}</Text>
                  <Text style={styles.statsLabel}>Completed Jobs</Text>
                </View>
                <View style={styles.statsItem}>
                  <Text style={[styles.statsVal, { color: themeColors.text }]}>
                    ₹{orders.filter(o => o.riderId === riderId && o.status === 'delivered').reduce((sum, o) => sum + Number(o.deliveryCharge || 40), 0)}
                  </Text>
                  <Text style={styles.statsLabel}>Delivery Earnings</Text>
                </View>
              </View>
            </View>

          </View>
        )}

      </ScrollView>

      {/* Chat Modal */}
      {chatOrder && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={chatOrder !== null}
          onRequestClose={() => setChatOrder(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {chatRecipientType === 'seller' 
                    ? `Chat with Seller (${chatOrder.kitchenName})` 
                    : `Chat with Customer (${chatOrder.customerName})`}
                </Text>
                <TouchableOpacity onPress={() => setChatOrder(null)} style={styles.closeBtn}>
                  <X size={18} color="#FFF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.chatScroller} contentContainerStyle={{ padding: 15 }}>
                {messages.map((msg: any) => {
                  const isMe = msg.senderId === riderId;
                  return (
                    <View 
                      key={msg.id} 
                      style={[
                        styles.msgBubble, 
                        isMe ? styles.msgBubbleMe : styles.msgBubbleOther
                      ]}
                    >
                      <Text style={styles.msgSender}>{isMe ? 'Me' : msg.senderName}</Text>
                      <Text style={styles.msgText}>{msg.message}</Text>
                    </View>
                  );
                })}
                {messages.length === 0 && (
                  <Text style={{ color: '#555', textAlign: 'center', marginVertical: 30 }}>Send a message to start chatting...</Text>
                )}
              </ScrollView>

              <View style={styles.chatInputRow}>
                <TextInput
                  placeholder="Type a message..."
                  placeholderTextColor="#888"
                  value={newMessageText}
                  onChangeText={setNewMessageText}
                  style={styles.chatInput}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={sendChatMessage}>
                  <Send size={16} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  toggleDutyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 90,
    justifyContent: 'space-between',
  },
  toggleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  toggleText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginLeft: 8,
    height: 32,
  },
  actionIconLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  offlineWrapper: {
    padding: 16,
  },
  onlineWrapper: {
    padding: 16,
  },
  shiftCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  shiftTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  shiftTimings: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  shiftAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,149,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenOnlineBtn: {
    backgroundColor: '#2ecc71',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  greenOnlineText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  referBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  referTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  referAmtBadge: {
    backgroundColor: 'rgba(226,55,68,0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  referAmtText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E23744',
  },
  promoCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  promoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    marginRight: 10,
  },
  promoActionBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  promoActionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  warningSubtitle: {
    fontSize: 10,
    color: '#333',
    marginTop: 2,
  },
  warningBtn: {
    backgroundColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  warningBtnText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
  },
  onlineStatusHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionDesc: {
    fontSize: 11,
    marginTop: 4,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  deliveryCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  orderId: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  pathContainer: {
    marginBottom: 14,
  },
  pathNode: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nodeDetails: {
    marginLeft: 10,
    flex: 1,
  },
  nodeTitle: {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
  },
  nodeName: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  nodeAddress: {
    fontSize: 10,
    marginTop: 2,
  },
  mapLinkBtn: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  mapLinkText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  verticalDottedLine: {
    width: 1.5,
    height: 35,
    backgroundColor: '#333',
    marginLeft: 7,
    marginVertical: 4,
  },
  timestampsContainer: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginBottom: 12,
  },
  timestampText: {
    fontSize: 9,
    color: '#888',
    marginBottom: 3,
  },
  cardFooter: {
    flexDirection: 'row',
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  poolCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  poolTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  poolDistance: {
    fontSize: 10,
    marginTop: 2,
  },
  poolPayout: {
    alignItems: 'flex-end',
  },
  payoutVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  payoutLabel: {
    fontSize: 8,
    color: '#888',
  },
  poolFooter: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poolTotal: {
    fontSize: 11,
  },
  acceptJobBtn: {
    backgroundColor: '#2ecc71',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  acceptJobText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 11,
    color: '#777',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 30,
  },
  bottomStatsCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  statsHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statsItem: {
    flex: 1,
  },
  statsVal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsLabel: {
    fontSize: 9,
    color: '#888',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeBtn: {
    padding: 4,
  },
  chatScroller: {
    flex: 1,
  },
  msgBubble: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  msgBubbleMe: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  msgBubbleOther: {
    backgroundColor: '#333',
    alignSelf: 'flex-start',
  },
  msgSender: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
    opacity: 0.8,
  },
  msgText: {
    fontSize: 12,
    color: '#FFF',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    color: '#FFF',
    fontSize: 12,
  },
  sendBtn: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  payoutSummaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  payoutHeaderTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  payoutMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  payoutMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  payoutMetricLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 4,
  },
  payoutMetricVal: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  payoutMetricSub: {
    fontSize: 8,
    color: '#888',
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 40,
  },
  payoutFooterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  payoutFooterText: {
    fontSize: 10,
  }
});
