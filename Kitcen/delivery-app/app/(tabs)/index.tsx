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
  ActivityIndicator,
  Linking
} from 'react-native';
import { Navigation, MapPin, CheckCircle, Clock, MessageSquare, Send, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL } from '../../store/apiConfig';

export default function RiderDashboard() {
  const user = useAuthStore(state => state.user);
  const riderId = user?.id || 'usr-rider-simulated';

  const orders = useKitchenStore(state => state.orders);
  const kitchens = useKitchenStore(state => state.kitchens);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);
  const updateOrderStatus = useKitchenStore(state => state.updateOrderStatus);
  const acceptOrder = useKitchenStore(state => state.acceptOrder);

  // Chat state
  const [chatOrder, setChatOrder] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [chatInterval, setChatInterval] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
    fetchKitchens();
    const interval = setInterval(() => {
      fetchOrders();
      fetchKitchens();
    }, 5000); // Poll every 5s for live updates
    return () => clearInterval(interval);
  }, []);

  // Poll chat messages when modal is active
  useEffect(() => {
    if (chatOrder) {
      fetchChats();
      const interval = setInterval(fetchChats, 2000);
      setChatInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (chatInterval) clearInterval(chatInterval);
    }
  }, [chatOrder]);

  const fetchChats = async () => {
    if (!chatOrder) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${chatOrder.id}/chats`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data);
      }
    } catch (err) {
      console.warn('Failed to fetch chats offline');
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
      const json = await res.json();
      if (json.success) {
        setNewMessageText('');
        fetchChats();
      }
    } catch (err) {
      // Offline simulation fallback
      const simulated = {
        id: 'msg-' + Math.random(),
        orderId: chatOrder.id,
        senderId: riderId,
        senderName: user?.name || 'Rider',
        message: newMessageText.trim(),
        createdAt: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, simulated]);
      setNewMessageText('');
    }
  };

  // Grouping orders
  const availableOrders = orders.filter(o => o.status === 'placed' && !o.riderId);
  const activeDeliveries = orders.filter(o => o.riderId === riderId && o.status !== 'delivered' && o.status !== 'cancelled');

  const handleAcceptOrder = async (orderId: string) => {
    const success = await acceptOrder(orderId, riderId);
    if (success) {
      Alert.alert('Order Accepted!', 'Proceed to Pickup Location: Shop');
    }
  };

  const takeOrderPhoto = async (actionLabel: string) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permissions are required to snap a picture of the order.');
        return false;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        Alert.alert('Photo Captured', `Successfully captured order photo for ${actionLabel}!`);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Camera capture failed:', err);
      Alert.alert('Simulation Mode', 'Photo captured (simulated).');
      return true;
    }
  };

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus: typeof orders[0]['status'] = 'on_the_way';
    if (currentStatus === 'preparing' || currentStatus === 'ready') {
      nextStatus = 'on_the_way';
      const photoOk = await takeOrderPhoto('Pickup Confirmation');
      if (!photoOk) return;

      Alert.alert('Status Updated', 'Order picked up! Navigate to Customer Location.');
    } else if (currentStatus === 'on_the_way') {
      nextStatus = 'delivered';
      const photoOk = await takeOrderPhoto('Delivery Confirmation');
      if (!photoOk) return;

      Alert.alert('Status Updated', 'Order delivered successfully!');
    }
    await updateOrderStatus(orderId, nextStatus);
  };

  const handleOpenMaps = (query: string) => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.riderHeader}>
        <Navigation size={28} color={theme.colors.primary} />
        <View style={styles.headerMeta}>
          <Text style={styles.roleText}>Rider Workspace</Text>
          <Text style={styles.riderName}>{user?.name || 'Vikram Singh'}</Text>
        </View>
      </View>

      {/* Available Orders Pool */}
      <Text style={styles.sectionTitle}>Available Job Pool ({availableOrders.length})</Text>
      <View style={styles.deliveriesList}>
        {availableOrders.map((order) => (
          <View key={order.id} style={[styles.deliveryCard, { borderColor: theme.colors.primary, borderWidth: 1.5 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>{order.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,107,0,0.15)' }]}>
                <Text style={styles.statusText}>PENDING ACCEPTANCE</Text>
              </View>
            </View>
            
            <View style={styles.pathContainer}>
              <View style={styles.pathNode}>
                <MapPin size={16} color={theme.colors.veg} />
                <View style={styles.nodeDetails}>
                  <Text style={styles.nodeTitle}>Pickup Kitchen</Text>
                  <Text style={styles.nodeName}>{order.kitchenName}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleAcceptOrder(order.id)}
            >
              <Text style={[styles.actionBtnText, { color: '#000' }]}>Accept Order (First Come)</Text>
            </TouchableOpacity>
          </View>
        ))}
        {availableOrders.length === 0 && (
          <Text style={{ color: '#666', fontSize: 13, textAlign: 'center', marginBottom: 15 }}>No new orders pending acceptance.</Text>
        )}
      </View>

      {/* Active Tasks */}
      <Text style={styles.sectionTitle}>Active Delivery Tasks ({activeDeliveries.length})</Text>

      <View style={styles.deliveriesList}>
        {activeDeliveries.map((delivery) => {
          // Live location tracking instructions
          const isPickedUp = delivery.status === 'on_the_way';
          return (
            <View key={delivery.id} style={styles.deliveryCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>{delivery.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: isPickedUp ? 'rgba(46,204,113,0.1)' : 'rgba(255,204,0,0.1)' }]}>
                  <Text style={[styles.statusText, { color: isPickedUp ? '#2ecc71' : theme.colors.warning }]}>
                    {delivery.status === 'preparing' ? 'SELLER PREPARING' : delivery.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Show Pickup Kitchen details first, then Customer details when picked up */}
              <View style={styles.pathContainer}>
                {!isPickedUp ? (
                  <View style={styles.pathNode}>
                    <MapPin size={16} color={theme.colors.veg} />
                    <View style={styles.nodeDetails}>
                      <Text style={styles.nodeTitle}>Step 1: Go to Pickup Shop</Text>
                      <Text style={styles.nodeName}>{delivery.kitchenName}</Text>
                      <Text style={styles.nodeAddress}>
                        Address: {kitchens.find(k => k.id === delivery.kitchenId)?.address || 'Collect from Vendor Counter'}
                      </Text>
                      
                      <TouchableOpacity 
                        style={styles.mapLinkBtn}
                        onPress={() => handleOpenMaps(`${delivery.kitchenName} Kitchen address: ${kitchens.find(k => k.id === delivery.kitchenId)?.address || ''}`)}
                      >
                        <Text style={styles.mapLinkText}>🗺 Navigate to Shop (Google Maps)</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.pathNode}>
                    <MapPin size={16} color={theme.colors.primary} />
                    <View style={styles.nodeDetails}>
                      <Text style={styles.nodeTitle}>Step 2: Deliver to Customer</Text>
                      <Text style={styles.nodeName}>{delivery.customerName}</Text>
                      <Text style={styles.nodeAddress}>Contact Mobile: {delivery.customerPhone || '+91 98765 43210'}</Text>
                      <Text style={styles.nodeAddress}>Address: {delivery.deliveryAddress || 'Royal Residency, Pune'}</Text>

                      <TouchableOpacity 
                        style={styles.mapLinkBtn}
                        onPress={() => handleOpenMaps(`${delivery.deliveryAddress || 'Royal Residency Pune'} customer ${delivery.customerName}`)}
                      >
                        <Text style={styles.mapLinkText}>🗺 Navigate to Customer (Google Maps)</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Footer and Buttons */}
              <View style={styles.cardFooter}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { flex: 1, marginRight: 8, backgroundColor: '#222', borderColor: '#444', borderWidth: 1 }]}
                  onPress={() => setChatOrder(delivery)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={14} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Chat Customer</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionBtn, { flex: 1, backgroundColor: delivery.status === 'preparing' ? '#333' : theme.colors.primary }]}
                  disabled={delivery.status === 'preparing'}
                  onPress={() => handleUpdateStatus(delivery.id, delivery.status)}
                >
                  <Text style={[styles.actionBtnText, { color: delivery.status === 'preparing' ? '#888' : '#000' }]}>
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

        {activeDeliveries.length === 0 && (
          <View style={styles.emptyContainer}>
            <CheckCircle size={40} color={theme.colors.success} />
            <Text style={styles.emptyText}>No active tasks. Accept from pool above!</Text>
          </View>
        )}
      </View>
      <View style={{ height: 40 }} />

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
                <Text style={styles.modalTitle}>Chat with Customer ({chatOrder.customerName})</Text>
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
      {/* Earnings & Stats Card */}
      <View style={styles.statsCard}>
        <Text style={styles.statsHeader}>Rider Delivery Metrics</Text>
        <View style={styles.statsRow}>
          <View style={styles.statsItem}>
            <Text style={styles.statsVal}>{orders.filter(o => o.riderId === riderId && o.status === 'delivered').length}</Text>
            <Text style={styles.statsLabel}>Completed Jobs</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsVal}>
              ₹{orders.filter(o => o.riderId === riderId && o.status === 'delivered').reduce((sum, o) => sum + Number(o.deliveryCharge || 40), 0)}
            </Text>
            <Text style={styles.statsLabel}>Delivery Earnings</Text>
          </View>
        </View>
      </View>

      {/* Completed Orders Logs */}
      <Text style={styles.sectionTitle}>Completed Orders Logs ({orders.filter(o => o.riderId === riderId && o.status === 'delivered').length})</Text>
      <View style={styles.deliveriesList}>
        {orders.filter(o => o.riderId === riderId && o.status === 'delivered').map((order) => (
          <View key={order.id} style={styles.completedCard}>
            <View style={styles.completedHeader}>
              <Text style={styles.completedId}>{order.id}</Text>
              <Text style={styles.completedDate}>{order.date}</Text>
            </View>
            <Text style={styles.completedDetails}>From: {order.kitchenName}</Text>
            <Text style={styles.completedDetails}>To: {order.customerName}</Text>
            <Text style={styles.completedAddress}>Address: {order.deliveryAddress || 'Customer Location'}</Text>
            <View style={styles.completedFooter}>
              <Text style={styles.earningAmt}>Earnings: ₹{order.deliveryCharge || 40}</Text>
              <Text style={styles.deliveredLabel}>✓ DELIVERED</Text>
            </View>
          </View>
        ))}
        {orders.filter(o => o.riderId === riderId && o.status === 'delivered').length === 0 && (
          <Text style={{ color: '#666', fontSize: 13, textAlign: 'center', marginVertical: 10, marginBottom: 30 }}>No completed orders history found.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 50,
  },
  riderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  headerMeta: {
    marginLeft: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  riderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  deliveriesList: {
    paddingHorizontal: 16,
  },
  deliveryCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    paddingBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusBadge: {
    backgroundColor: 'rgba(255,107,0,0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  pathContainer: {
    marginVertical: 16,
  },
  pathNode: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nodeDetails: {
    marginLeft: 12,
    flex: 1,
  },
  nodeTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  nodeName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  nodeAddress: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  verticalDottedLine: {
    width: 2,
    height: 30,
    backgroundColor: '#333',
    marginLeft: 7,
    marginVertical: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    paddingTop: 12,
    marginTop: 4,
  },
  earningContainer: {
    flex: 1,
  },
  earningLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  earningVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 18,
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
  },
  mapLinkBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(255,107,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.2)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  mapLinkText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statsCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  statsHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statsLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  completedCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 6,
    marginBottom: 8,
  },
  completedId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  completedDate: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  completedDetails: {
    fontSize: 11,
    color: '#CCC',
    marginVertical: 1,
  },
  completedAddress: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
    marginBottom: 8,
  },
  completedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 8,
  },
  earningAmt: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  deliveredLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.success,
    backgroundColor: 'rgba(46,204,113,0.1)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  }
});
