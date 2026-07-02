import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Search, ShoppingBag, DollarSign, Clock, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';

type StatusFilter = 'all' | 'active' | 'delivered' | 'cancelled';

export default function AdminOrdersScreen() {
  const orders = useKitchenStore(state => state.orders);
  const isLoading = useKitchenStore(state => state.isLoading);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);
  const updateOrderStatus = useKitchenStore(state => state.updateOrderStatus);

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
    <View style={styles.container}>
      {/* Title Header */}
      <View style={styles.header}>
        <Text style={styles.subtitle}>Superadmin Dashboard</Text>
        <Text style={styles.title}>All System Orders</Text>
      </View>

      {/* Metrics Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricsContainer}>
        <View style={[styles.metricCard, { borderColor: theme.colors.primary }]}>
          <ShoppingBag size={18} color={theme.colors.primary} />
          <Text style={styles.metricVal}>{orders.length}</Text>
          <Text style={styles.metricLabel}>Total Orders</Text>
        </View>

        <View style={[styles.metricCard, { borderColor: '#FFCC00' }]}>
          <Clock size={18} color="#FFCC00" />
          <Text style={styles.metricVal}>{activeOrdersCount}</Text>
          <Text style={styles.metricLabel}>Active Jobs</Text>
        </View>

        <View style={[styles.metricCard, { borderColor: '#34C759' }]}>
          <CheckCircle2 size={18} color="#34C759" />
          <Text style={styles.metricVal}>{completedOrdersCount}</Text>
          <Text style={styles.metricLabel}>Completed</Text>
        </View>

        <View style={[styles.metricCard, { borderColor: theme.colors.success }]}>
          <DollarSign size={18} color={theme.colors.success} />
          <Text style={styles.metricVal}>₹{totalRevenue.toFixed(0)}</Text>
          <Text style={styles.metricLabel}>System GMV</Text>
        </View>
      </ScrollView>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <Search size={16} color="#666" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search Order ID, Shop, or Customer..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'delivered', 'cancelled'] as StatusFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.filterTabActive
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive
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
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : filteredOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderId}>{order.id}</Text>
                <Text style={styles.orderDate}>{order.date} • {order.paymentMethod.toUpperCase()}</Text>
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
                <Text key={idx} style={styles.itemRow}>
                  {item.quantity}x {item.name} (₹{item.price})
                </Text>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Payout Amount:</Text>
                <Text style={styles.totalVal}>₹{order.total}</Text>
              </View>
            </View>

            {/* Addresses Box */}
            <View style={styles.addressBox}>
              <Text style={styles.addressText} numberOfLines={1}>
                🏪 <Text style={{ fontWeight: 'bold', color: '#FFF' }}>{order.kitchenName}</Text>
              </Text>
              <Text style={styles.addressText} numberOfLines={2}>
                📍 Deliver to: <Text style={{ color: '#DDD' }}>{order.deliveryAddress || 'Not Provided'}</Text>
              </Text>
              {order.customerPhone && (
                <Text style={styles.phoneText}>📞 Customer Contact: {order.customerPhone}</Text>
              )}
            </View>

            {/* Order Timeline Timestamps */}
            <View style={styles.timelineBox}>
              <Text style={styles.timelineRow}>🕒 Placed At: {order.createdAt || order.date}</Text>
              {order.acceptedByRiderAt && (
                <Text style={styles.timelineRow}>🏍 Accepted: {order.acceptedByRiderAt}</Text>
              )}
              {order.pickedUpAt && (
                <Text style={styles.timelineRow}>📦 Picked Up: {order.pickedUpAt}</Text>
              )}
              {order.deliveredAt && (
                <Text style={styles.timelineRow}>✅ Delivered: {order.deliveredAt}</Text>
              )}
            </View>

            <TouchableOpacity 
              style={styles.actionRow}
              onPress={() => handleAdminOverrideStatus(order.id, order.status)}
            >
              <Text style={styles.actionLink}>Manage Order State</Text>
              <ChevronRight size={14} color={theme.colors.primary} />
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
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 15,
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
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  metricsContainer: {
    flexDirection: 'row',
    maxHeight: 75,
    marginBottom: 15,
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
    paddingHorizontal: 12,
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
