import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Linking
} from 'react-native';
import { 
  ChefHat,
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  UtensilsCrossed,
  MapPin,
  MessageSquare
} from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';

const ZOMATO_RED = '#FFB300';

type OrderTabFilter = 'live' | 'history';

export default function SellerDashboard() {
  const user = useAuthStore(state => state.user);
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
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const myKitchen = kitchens.find(k => k.owner === user?.id) || kitchens[0];
  const selectedKitchenId = myKitchen?.id || 'k3';

  const kitchenInfo = myKitchen || kitchens[0] || { name: 'My Kitchen', revenue: 0 };
  const kitchenOrders = orders.filter(o => o.kitchenId === selectedKitchenId);

  const themeColors = {
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    inputBg: isDarkMode ? '#0F0F0F' : '#F0F2F4'
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

  const isApproved = myKitchen?.isApproved === 'approved';

  if (!isApproved) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <ChefHat size={72} color={ZOMATO_RED} style={{ marginBottom: 20 }} />
        <Text style={{ color: ZOMATO_RED, fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
          Kitchen Approval Pending
        </Text>
        <Text style={{ color: themeColors.text, fontSize: 13, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 }}>
          Your kitchen "{kitchenInfo.name}" registration is being reviewed by the SuperAdmin.
        </Text>
        <View style={styles.pendingBadge}>
          <Clock size={14} color="#FF9500" />
          <Text style={styles.pendingBadgeText}>Status: Under Review</Text>
        </View>
        <Text style={{ color: themeColors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 15, lineHeight: 18, paddingHorizontal: 20 }}>
          We will notify you via email once your store dashboard goes live. Thank you for partnering with us!
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
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} showsVerticalScrollIndicator={false}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSub}>Zomato Partner Workspace</Text>
          <Text style={[styles.headerMain, { color: themeColors.text }]}>{kitchenInfo.name}</Text>
        </View>
        <View style={styles.onlineIndicator}>
          <View style={styles.pulseDot} />
          <Text style={styles.onlineText}>ONLINE</Text>
        </View>
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

              {/* Items List */}
              <View style={styles.itemsBox}>
                <Text style={styles.itemsSectionTitle}>FOOD ITEMS</Text>
                {order.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <UtensilsCrossed size={12} color="#888" style={{ marginRight: 8 }} />
                    <Text style={[styles.itemText, { color: themeColors.text }]}>{item.quantity}x {item.name}</Text>
                  </View>
                ))}
              </View>

              {/* Delivery Address */}
              {order.deliveryAddress && (
                <View style={[styles.addressBox, { backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}>
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

              {/* Items List */}
              <View style={styles.itemsBox}>
                {order.items.map((item, idx) => (
                  <Text key={idx} style={[styles.pastItemText, { color: themeColors.textSecondary }]}>
                    • {item.quantity}x {item.name}
                  </Text>
                ))}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerSub: {
    fontSize: 9,
    fontWeight: 'bold',
    color: ZOMATO_RED,
    textTransform: 'uppercase',
  },
  headerMain: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,199,89,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#34C759',
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
  }
});
