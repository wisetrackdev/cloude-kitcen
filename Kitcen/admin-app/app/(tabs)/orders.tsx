import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Search, ShoppingBag, DollarSign, Clock, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';

type StatusFilter = 'all' | 'active' | 'delivered' | 'cancelled';

export default function AdminOrdersScreen() {
  const orders = useKitchenStore(state => state.orders);
  const isLoading = useKitchenStore(state => state.isLoading);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);
  const updateOrderStatus = useKitchenStore(state => state.updateOrderStatus);

  const isDarkMode = useAuthStore(state => state.isDarkMode);
  const user = useAuthStore(state => state.user);

  const themeColors = {
    background: isDarkMode ? '#0A0A0A' : '#F5F6F8',
    card: isDarkMode ? '#121212' : '#FFFFFF',
    border: isDarkMode ? '#1F1F1F' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    inputBg: isDarkMode ? '#0F0F0F' : '#F0F2F4',
    primary: '#FFB300', // Gold/Yellow primary
    success: '#34C759',
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 8000); // refresh every 8 seconds
    return () => clearInterval(interval);
  }, []);

  // Performance calculations
  const totalRevenue = orders.reduce((sum, o) => o.status === 'delivered' ? sum + Number(o.total) : sum, 0);
  const activeOrdersCount = orders.filter(o => ['placed', 'preparing', 'ready', 'on_the_way'].includes(o.status)).length;
  const completedOrdersCount = orders.filter(o => o.status === 'delivered').length;

  // Filter and search logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.kitchenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'active') {
      return ['placed', 'preparing', 'ready', 'on_the_way'].includes(order.status);
    }
    if (activeFilter === 'delivered') {
      return order.status === 'delivered';
    }
    if (activeFilter === 'cancelled') {
      return order.status === 'cancelled';
    }
    return true;
  });

  const handleAdminOverrideStatus = (orderId: string, currentStatus: string) => {
    Alert.alert(
      'Modify Order Status',
      `Override order status for ID: ${orderId}. Current: ${currentStatus.toUpperCase()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark Preparing', onPress: () => updateOrderStatus(orderId, 'preparing') },
        { text: 'Mark Ready', onPress: () => updateOrderStatus(orderId, 'ready') },
        { text: 'Mark Out for Delivery', onPress: () => updateOrderStatus(orderId, 'on_the_way') },
        { text: 'Mark Delivered', onPress: () => updateOrderStatus(orderId, 'delivered') },
        { text: 'Cancel Order', style: 'destructive', onPress: () => updateOrderStatus(orderId, 'cancelled') },
      ]
    );
  };

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
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Sticky Global Header */}
      <View style={{
        backgroundColor: '#FFCC00',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        zIndex: 100
      }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#000' }}>Cloud Kitchen</Text>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)', textTransform: 'uppercase' }}>Superadmin Order Logs</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#000' }}>{user?.name || 'Super Admin'}</Text>
            <Text style={{ fontSize: 8, color: 'rgba(0,0,0,0.6)' }}>Administrator</Text>
          </View>
          <Image
            source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80' }}
            style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#FFF' }}
          />
        </View>
      </View>

      {/* Metrics Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricsContainer}>
        <View style={[styles.metricCard, { backgroundColor: themeColors.card, borderColor: themeColors.primary }]}>
          <ShoppingBag size={18} color={themeColors.primary} />
          <Text style={[styles.metricVal, { color: themeColors.text }]}>{orders.length}</Text>
          <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Total Orders</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: themeColors.card, borderColor: '#FFCC00' }]}>
          <Clock size={18} color="#FFCC00" />
          <Text style={[styles.metricVal, { color: themeColors.text }]}>{activeOrdersCount}</Text>
          <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Active Jobs</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: themeColors.card, borderColor: '#34C759' }]}>
          <CheckCircle2 size={18} color="#34C759" />
          <Text style={[styles.metricVal, { color: themeColors.text }]}>{completedOrdersCount}</Text>
          <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Completed</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: themeColors.card, borderColor: themeColors.success }]}>
          <DollarSign size={18} color={themeColors.success} />
          <Text style={[styles.metricVal, { color: themeColors.text }]}>₹{totalRevenue.toFixed(0)}</Text>
          <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>System GMV</Text>
        </View>
      </ScrollView>

      {/* Search Bar */}
      <View style={[styles.searchRow, { backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}>
        <Search size={16} color="#666" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search Order ID, Shop, or Customer..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: themeColors.text }]}
        />
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterRow, { backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}>
        {(['all', 'active', 'delivered', 'cancelled'] as StatusFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && { backgroundColor: themeColors.primary }
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter ? { color: '#000' } : { color: themeColors.textSecondary }
              ]}
            >
              {filter.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Order List */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.listScroller}>
        {isLoading && orders.length === 0 ? (
          <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: 40 }} />
        ) : filteredOrders.map((order) => (
          <View key={order.id} style={[styles.orderCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.cardHeader, { borderBottomColor: themeColors.border }]}>
              <View>
                <Text style={[styles.orderId, { color: themeColors.text }]}>{order.id}</Text>
                <Text style={[styles.orderDate, { color: themeColors.textSecondary }]}>{order.date} • {order.paymentMethod.toUpperCase()}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '1A', borderColor: getStatusColor(order.status) }]}
                onPress={() => handleAdminOverrideStatus(order.id, order.status)}
              >
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {order.status.toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Order Items Summary */}
            <View style={styles.itemsBlock}>
              {order.items.map((item, idx) => (
                <Text key={idx} style={[styles.itemRow, { color: themeColors.textSecondary }]}>
                  {item.quantity}x {item.name} (₹{item.price})
                </Text>
              ))}
              {order.discount > 0 ? (
                <>
                  <View style={[styles.totalRow, { borderTopColor: themeColors.border, paddingBottom: 4 }]}>
                    <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>Original Price:</Text>
                    <Text style={[styles.totalVal, { color: themeColors.textSecondary, textDecorationLine: 'line-through' }]}>₹{order.subtotal}</Text>
                  </View>
                  <View style={[styles.totalRow, { borderTopWidth: 0, paddingBottom: 4 }]}>
                    <Text style={[styles.totalLabel, { color: themeColors.success }]}>Discount Applied:</Text>
                    <Text style={[styles.totalVal, { color: themeColors.success }]}>- ₹{order.discount}</Text>
                  </View>
                  <View style={[styles.totalRow, { borderTopWidth: 0 }]}>
                    <Text style={[styles.totalLabel, { color: themeColors.textSecondary, fontWeight: 'bold' }]}>Real Price (Paid to Admin):</Text>
                    <Text style={[styles.totalVal, { color: themeColors.primary, fontSize: 13, fontWeight: 'bold' }]}>₹{order.total}</Text>
                  </View>
                </>
              ) : (
                <View style={[styles.totalRow, { borderTopColor: themeColors.border }]}>
                  <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>Total Payout Amount:</Text>
                  <Text style={[styles.totalVal, { color: themeColors.primary }]}>₹{order.total}</Text>
                </View>
              )}
            </View>

            {/* Addresses Box */}
            <View style={[styles.addressBox, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
              <Text style={[styles.addressText, { color: themeColors.textSecondary }]} numberOfLines={1}>
                🏪 <Text style={{ fontWeight: 'bold', color: themeColors.text }}>{order.kitchenName}</Text>
              </Text>
              <Text style={[styles.addressText, { color: themeColors.textSecondary }]} numberOfLines={2}>
                📍 Deliver to: <Text style={{ color: themeColors.text }}>{order.deliveryAddress || 'Not Provided'}</Text>
              </Text>
              {order.customerPhone && (
                <Text style={[styles.phoneText, { color: themeColors.textSecondary }]}>📞 Customer Contact: {order.customerPhone}</Text>
              )}
            </View>

            {/* Order Timeline Timestamps */}
            <View style={[styles.timelineBox, { borderTopColor: themeColors.border }]}>
              <Text style={[styles.timelineRow, { color: themeColors.textSecondary }]}>🕒 Placed At: {order.createdAt || order.date}</Text>
              {order.acceptedByRiderAt && (
                <Text style={[styles.timelineRow, { color: themeColors.textSecondary }]}>🏍 Accepted: {order.acceptedByRiderAt}</Text>
              )}
              {order.pickedUpAt && (
                <Text style={[styles.timelineRow, { color: themeColors.textSecondary }]}>📦 Picked Up: {order.pickedUpAt}</Text>
              )}
              {order.deliveredAt && (
                <Text style={[styles.timelineRow, { color: themeColors.textSecondary }]}>✅ Delivered: {order.deliveredAt}</Text>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.actionRow, { borderTopColor: themeColors.border }]}
              onPress={() => handleAdminOverrideStatus(order.id, order.status)}
            >
              <Text style={[styles.actionLink, { color: themeColors.primary }]}>Manage Order State</Text>
              <ChevronRight size={14} color={themeColors.primary} />
            </TouchableOpacity>
          </View>
        ))}

        {!isLoading && filteredOrders.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders matched your search criteria.</Text>
          </View>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    marginBottom: 15,
    backgroundColor: '#FFCC00',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  metricsContainer: {
    flexDirection: 'row',
    maxHeight: 75,
    marginBottom: 15,
    marginTop: 15,
    paddingHorizontal: 16,
  },
  metricCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    backgroundColor: '#121212',
    minWidth: 100,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 12,
    marginHorizontal: 16,
    height: 40,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#FFF',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 10,
    marginHorizontal: 16,
    padding: 3,
    marginBottom: 15,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 7,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#777',
  },
  filterTextActive: {
    color: '#000',
  },
  listScroller: {
    flex: 1,
    paddingHorizontal: 16,
  },
  orderCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    paddingBottom: 10,
    marginBottom: 10,
  },
  orderId: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  orderDate: {
    fontSize: 10,
    color: theme.colors.textSecondary,
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
  itemsBlock: {
    marginBottom: 10,
  },
  itemRow: {
    fontSize: 11,
    color: '#CCC',
    marginBottom: 3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    paddingTop: 6,
  },
  totalLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  totalVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  addressBox: {
    backgroundColor: '#0A0A0A',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#181818',
  },
  addressText: {
    fontSize: 10,
    color: '#888',
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 9,
    color: '#777',
  },
  timelineBox: {
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    paddingTop: 8,
    marginBottom: 10,
  },
  timelineRow: {
    fontSize: 9,
    color: '#666',
    marginBottom: 3,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    paddingTop: 10,
  },
  actionLink: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 12,
    color: '#555',
  }
});
