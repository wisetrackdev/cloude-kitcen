import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Phone, MessageSquare, ShieldCheck, MapPin, Navigation, Send, X, ChefHat, Store } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL } from '../../store/apiConfig';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const user = useAuthStore(state => state.user);
  const customerId = user?.id || 'usr-customer-simulated';

  const orders = useKitchenStore(state => state.orders);
  const kitchens = useKitchenStore(state => state.kitchens);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);
  const activeOrder = orders.find(o => o.id === id);
  const activeKitchen = kitchens.find(k => k.id === activeOrder?.kitchenId);

  // Chat and Rating states
  const [chatActive, setChatActive] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [chatInterval, setChatInterval] = useState<any>(null);
  const [riderRating, setRiderRating] = useState(0);
  const [isRiderRated, setIsRiderRated] = useState(false);

  const handleRateRider = async (stars: number) => {
    if (!activeOrder?.riderId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/riders/${activeOrder.riderId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: stars })
      });
      const json = await res.json();
      if (json.success) {
        setRiderRating(stars);
        setIsRiderRated(true);
        Alert.alert('Thank You', 'Rider rated successfully!');
      }
    } catch (err) {
      console.warn('Rating submission failed');
      setRiderRating(stars);
      setIsRiderRated(true);
    }
  };

  // Poll order status every 5 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll chat when active
  useEffect(() => {
    if (chatActive && activeOrder) {
      fetchChats();
      const interval = setInterval(fetchChats, 2000);
      setChatInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (chatInterval) clearInterval(chatInterval);
    }
  }, [chatActive]);

  const fetchChats = async () => {
    if (!activeOrder) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${activeOrder.id}/chats`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data);
      }
    } catch (err) {
      console.warn('Failed to fetch chats offline');
    }
  };

  const sendChatMessage = async () => {
    if (!newMessageText.trim() || !activeOrder) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${activeOrder.id}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: customerId,
          message: newMessageText.trim()
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewMessageText('');
        fetchChats();
      }
    } catch (err) {
      const simulated = {
        id: 'msg-' + Math.random(),
        orderId: activeOrder.id,
        senderId: customerId,
        senderName: user?.name || 'Customer',
        message: newMessageText.trim(),
        createdAt: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, simulated]);
      setNewMessageText('');
    }
  };

  const getStatusNumber = (status: string) => {
    switch (status) {
      case 'placed': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'on_the_way': return 4;
      case 'delivered': return 5;
      default: return 1;
    }
  };

  const currentStatus = activeOrder ? activeOrder.status : 'placed';
  const statusStep = getStatusNumber(currentStatus);

  const getEta = (status: string) => {
    if (status === 'placed') return 30;
    if (status === 'preparing') return 20;
    if (status === 'ready') return 15;
    if (status === 'on_the_way') return 8;
    return 0;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracker ({id})</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Map visual section */}
      <View style={styles.mapMock}>
        <View style={styles.mapOverlayInfo}>
          <Navigation size={18} color={theme.colors.primary} />
          <Text style={styles.mapEtaText}>
            {currentStatus === 'delivered' ? 'Order Delivered 🎉' : 
             currentStatus === 'cancelled' ? 'Order Cancelled ❌' : 
             `Arriving in ${getEta(currentStatus)} mins`}
          </Text>
        </View>

        {/* Dummy Map Route with dynamic address overlay */}
        <View style={styles.mapGraphicWrapper}>
          <View style={styles.addressLineCard}>
            <View style={styles.addressLineRow}>
              <MapPin size={12} color={theme.colors.success} style={{ marginRight: 6 }} />
              <Text numberOfLines={1} style={styles.addressLineText}>
                Kitchen: {activeKitchen?.address || 'Noida Sector 62, UP'}
              </Text>
            </View>
            <View style={styles.addressLineRow}>
              <MapPin size={12} color={theme.colors.primary} style={{ marginRight: 6 }} />
              <Text numberOfLines={1} style={styles.addressLineText}>
                Delivery: {activeOrder?.deliveryAddress || 'Your Address'}
              </Text>
            </View>
          </View>

          <MapPin size={24} color={theme.colors.veg} style={styles.restaurantPin as any} />
          <View style={styles.mapDottedPath} />
          <MapPin size={24} color={theme.colors.primary} style={styles.homePin as any} />
        </View>
      </View>

      <ScrollView style={styles.statusSection} showsVerticalScrollIndicator={false}>
        {/* Kitchen Partner Details Card */}
        <View style={[styles.riderCard, { marginBottom: 12 }]}>
          <View style={styles.riderMeta}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,179,0,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <ChefHat size={20} color={theme.colors.primary} />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.riderName}>{activeKitchen?.name || 'Kitchen Partner'}</Text>
              <Text style={styles.riderVehicle}>Home Chef Partner • Healthy Meals</Text>
            </View>
          </View>
          <View style={styles.riderActions}>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => Linking.openURL(`tel:${(activeKitchen as any)?.phone || (activeOrder as any)?.kitchenPhone || '9876543210'}`)}
            >
              <Phone size={16} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => setChatActive(true)}
            >
              <MessageSquare size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Rider profile card */}
        {activeOrder?.riderId ? (
          <View>
            <View style={styles.riderCard}>
              <View style={styles.riderMeta}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' }} 
                  style={styles.riderAvatar} 
                />
                <View>
                  <Text style={styles.riderName}>{activeOrder?.riderName || 'Vikram Singh'} (Rider Assigned)</Text>
                  <Text style={styles.riderVehicle}>Hero Splendor (MH-02-AB-9831)</Text>
                </View>
              </View>
              <View style={styles.riderActions}>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => Linking.openURL(`tel:${activeOrder?.riderPhone || '9876543210'}`)}
                >
                  <Phone size={16} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => setChatActive(true)}
                >
                  <MessageSquare size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Rider Rating Card when order is delivered */}
            {currentStatus === 'delivered' && (
              <View style={styles.ratingCard}>
                <Text style={styles.ratingTitle}>Rate Delivery Partner</Text>
                <Text style={styles.ratingSubtitle}>How was your delivery experience with {activeOrder?.riderName || 'the rider'}?</Text>
                {isRiderRated ? (
                  <View style={styles.ratingSuccess}>
                    <Text style={styles.ratingSuccessText}>You rated: {riderRating} ⭐</Text>
                  </View>
                ) : (
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <TouchableOpacity 
                        key={stars} 
                        style={styles.starBtn} 
                        onPress={() => handleRateRider(stars)}
                      >
                        <Text style={styles.starText}>⭐</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.riderCard, { justifyContent: 'center', paddingVertical: 20 }]}>
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 10 }} />
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold' }}>Finding nearest delivery partner...</Text>
          </View>
        )}

        {/* Vertical status tracker */}
        <View style={styles.trackerWrapper}>
          {[
            { step: 1, label: 'Order Confirmed', sub: 'We have received your order' },
            { step: 2, label: 'Cooking & Preparing', sub: 'Chef is preparing your fresh meal' },
            { step: 3, label: 'Ready for Pickup', sub: 'Kitchen has packed your order' },
            { step: 4, label: 'On The Way', sub: 'Rider is speeding towards your house' },
            { step: 5, label: 'Delivered', sub: 'Enjoy your delicious tiffin/food!' }
          ].map((item) => {
            const isCompleted = statusStep >= item.step;
            return (
              <View key={item.step} style={styles.trackerStep}>
                <View style={styles.bulletCol}>
                  <View style={[
                    styles.trackerCircle, 
                    isCompleted && styles.trackerCircleActive
                  ]}>
                    {isCompleted && <View style={styles.trackerDot} />}
                  </View>
                  {item.step !== 5 && <View style={[styles.trackerLine, isCompleted && styles.trackerLineActive]} />}
                </View>
                <View style={styles.trackerTextContainer}>
                  <Text style={[styles.stepLabel, isCompleted && styles.stepLabelActive]}>
                    {item.label}
                  </Text>
                  <Text style={styles.stepSub}>{item.sub}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Safety standards */}
        <View style={styles.safetyCard}>
          <ShieldCheck size={16} color={theme.colors.veg} />
          <Text style={styles.safetyText}>
            Our riders undergo daily temperature screenings and follow strictly contactless delivery protocols.
          </Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Customer Chat with Rider Modal */}
      {chatActive && activeOrder && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={chatActive}
          onRequestClose={() => setChatActive(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chat with Delivery Partner</Text>
                <TouchableOpacity onPress={() => setChatActive(false)} style={styles.closeBtn}>
                  <X size={18} color="#FFF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.chatScroller} contentContainerStyle={{ padding: 15 }}>
                {messages.map((msg: any) => {
                  const isMe = msg.senderId === customerId;
                  return (
                    <View 
                      key={msg.id} 
                      style={[
                        styles.msgBubble, 
                        isMe ? styles.msgBubbleMe : styles.msgBubbleOther
                      ]}
                    >
                      <Text style={styles.msgSender}>{isMe ? 'You' : msg.senderName}</Text>
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
    backgroundColor: theme.colors.background,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  mapMock: {
    height: 220,
    backgroundColor: '#151515',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapOverlayInfo: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapEtaText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 8,
  },
  mapGraphicWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '60%',
    marginTop: 40,
  },
  addressLineCard: {
    position: 'absolute',
    bottom: -55,
    left: '-30%',
    right: '-30%',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 8,
    zIndex: 100,
  },
  addressLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  addressLineText: {
    fontSize: 10,
    color: '#CCC',
    flex: 1,
  },
  ratingCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  ratingSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  ratingSuccess: {
    backgroundColor: 'rgba(52,199,89,0.1)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  ratingSuccessText: {
    color: theme.colors.success,
    fontWeight: 'bold',
    fontSize: 12,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  starBtn: {
    paddingHorizontal: 8,
  },
  starText: {
    fontSize: 24,
  },
  restaurantPin: {
    transform: [{ scale: 1.2 }],
  },
  mapDottedPath: {
    flex: 1,
    height: 2,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginHorizontal: 10,
  },
  homePin: {
    transform: [{ scale: 1.2 }],
  },
  statusSection: {
    flex: 1,
    padding: 16,
  },
  riderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  riderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222',
    marginRight: 12,
  },
  riderName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  riderVehicle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  riderActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F1F1F',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  trackerWrapper: {
    paddingLeft: 8,
    marginBottom: 24,
  },
  trackerStep: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  bulletCol: {
    alignItems: 'center',
    marginRight: 16,
  },
  trackerCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackerCircleActive: {
    borderColor: theme.colors.primary,
  },
  trackerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  trackerLine: {
    width: 2,
    height: 40,
    backgroundColor: '#333',
    marginTop: 4,
  },
  trackerLineActive: {
    backgroundColor: theme.colors.primary,
  },
  trackerTextContainer: {
    flex: 1,
    paddingTop: 1,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#444',
  },
  stepLabelActive: {
    color: '#FFF',
  },
  stepSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,199,89,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  safetyText: {
    flex: 1,
    fontSize: 10,
    color: theme.colors.veg,
    lineHeight: 14,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    height: '75%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  closeBtn: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatScroller: {
    flex: 1,
  },
  msgBubble: {
    maxWidth: '80%',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  msgBubbleMe: {
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-end',
  },
  msgBubbleOther: {
    backgroundColor: '#222',
    alignSelf: 'flex-start',
  },
  msgSender: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 4,
  },
  msgText: {
    fontSize: 13,
    color: '#FFF',
  },
  chatInputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 13,
    marginRight: 10,
  },
  sendBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
