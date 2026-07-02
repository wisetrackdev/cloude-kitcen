import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator
} from 'react-native';
import { Calendar, Wallet, CheckCircle, Clock, MapPin, Award } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';

type TimeFilter = 'today' | 'week' | 'all';

export default function RiderHistoryScreen() {
  const user = useAuthStore(state => state.user);
  const riderId = user?.id || 'usr-rider-simulated';

  const orders = useKitchenStore(state => state.orders);
  const isLoading = useKitchenStore(state => state.isLoading);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);

  const [activeFilter, setActiveFilter] = useState<TimeFilter>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter logic
  const completedOrders = orders.filter(
    (o) => o.riderId === riderId && o.status === 'delivered'
  );

  const getFilteredOrders = () => {
    if (activeFilter === 'today') {
      // Filter by today's date string (simulation checks)
      return completedOrders.filter(o => o.date.toLowerCase().includes('today') || o.date.includes(new Date().toLocaleDateString()));
    }
    if (activeFilter === 'week') {
      // Show last 7 orders or simulated weekly logs
      return completedOrders.slice(0, 7);
    }
    return completedOrders;
  };

  const filteredList = getFilteredOrders();
  const totalEarnings = filteredList.reduce((sum, o) => sum + Number(o.deliveryCharge || 40), 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.subtitle}>Earnings & Records</Text>
          <Text style={styles.title}>Delivery History</Text>
        </View>
        <View style={styles.badge}>
          <Award size={18} color="#000" />
          <Text style={styles.badgeText}>Zomato Partner</Text>
        </View>
      </View>

      {/* Zomato-style Earnings Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>YOUR SUMMARY PERFORMANCE</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <View style={[styles.iconBg, { backgroundColor: 'rgba(52,199,89,0.1)' }]}>
              <Wallet size={20} color={theme.colors.success} />
            </View>
            <Text style={styles.metricVal}>₹{totalEarnings}</Text>
            <Text style={styles.metricLabel}>Total Payout</Text>
          </View>
          
          <View style={styles.dividerLine} />

          <View style={styles.metricItem}>
            <View style={[styles.iconBg, { backgroundColor: 'rgba(255,107,0,0.1)' }]}>
              <CheckCircle size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.metricVal}>{filteredList.length}</Text>
            <Text style={styles.metricLabel}>Trips Done</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['today', 'week', 'all'] as TimeFilter[]).map((filter) => (
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
              {filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : 'All History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logs List */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : filteredList.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderId}>{order.id}</Text>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>
              <View style={styles.earningsBadge}>
                <Text style={styles.earningsAmt}>+₹{order.deliveryCharge || 40}</Text>
              </View>
            </View>

            {/* Path details */}
            <View style={styles.pathBox}>
              <View style={styles.pathNode}>
                <MapPin size={14} color={theme.colors.veg} />
                <Text style={styles.pathText} numberOfLines={1}>
                  From: <Text style={styles.boldText}>{order.kitchenName}</Text>
                </Text>
              </View>
              <View style={styles.pathNode}>
                <MapPin size={14} color={theme.colors.primary} />
                <Text style={styles.pathText} numberOfLines={1}>
                  To: <Text style={styles.boldText}>{order.customerName}</Text>
                </Text>
              </View>
              <Text style={styles.addressText} numberOfLines={2}>
                📍 Address: {order.deliveryAddress || 'Customer Location'}
              </Text>
            </View>

            {/* Timestamps */}
            <View style={styles.timestampsBlock}>
              <Text style={styles.timestampRow}>
                🕒 Ordered: <Text style={styles.timeVal}>{order.createdAt || order.date}</Text>
              </Text>
              {order.pickedUpAt && (
                <Text style={styles.timestampRow}>
                  📦 Picked Up: <Text style={styles.timeVal}>{order.pickedUpAt}</Text>
                </Text>
              )}
              {order.deliveredAt && (
                <Text style={styles.timestampRow}>
                  ✅ Delivered: <Text style={styles.timeVal}>{order.deliveredAt}</Text>
                </Text>
              )}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.successLabel}>✓ DELIVERED SUCCESSFUL</Text>
              <Text style={styles.commissionLabel}>Payout: Cash/Online</Text>
            </View>
          </View>
        ))}

        {!isLoading && filteredList.length === 0 && (
          <View style={styles.emptyContainer}>
            <Clock size={48} color="#444" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>No completed delivery records found in this timeframe.</Text>
          </View>
        )}
      </View>
      <View style={{ height: 45 }} />
    </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerInfo: {
    flex: 1,
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 4,
  },
  summaryCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  metricLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  dividerLine: {
    width: 1,
    height: 45,
    backgroundColor: '#1F1F1F',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#888',
  },
  filterTextActive: {
    color: '#000',
  },
  listContainer: {
    marginBottom: 20,
  },
  orderCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
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
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  orderDate: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  earningsBadge: {
    backgroundColor: 'rgba(52,199,89,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  earningsAmt: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  pathBox: {
    marginBottom: 10,
  },
  pathNode: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pathText: {
    fontSize: 11,
    color: '#CCC',
    marginLeft: 8,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#FFF',
  },
  addressText: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
    marginLeft: 4,
  },
  timestampsBlock: {
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    paddingTop: 10,
    marginBottom: 10,
  },
  timestampRow: {
    fontSize: 9,
    color: '#888',
    marginBottom: 3,
  },
  timeVal: {
    color: '#AAA',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    paddingTop: 10,
  },
  successLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  commissionLabel: {
    fontSize: 9,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  }
});
