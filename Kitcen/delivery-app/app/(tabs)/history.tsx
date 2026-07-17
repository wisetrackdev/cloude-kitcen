import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator
} from 'react-native';
import { Wallet, CheckCircle, Clock, MapPin, Award } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL } from '../../store/apiConfig';

type TimeFilter = 'today' | 'week' | 'all';

export default function RiderHistoryScreen() {
  const user = useAuthStore(state => state.user);
  const riderId = user?.id || 'usr-rider-simulated';
  const isDarkMode = useAuthStore(state => state.isDarkMode);

  const orders = useKitchenStore(state => state.orders);
  const isLoading = useKitchenStore(state => state.isLoading);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);

  const [activeFilter, setActiveFilter] = useState<TimeFilter>('all');
  const [activeTab, setActiveTab] = useState<'deliveries' | 'payouts'>('deliveries');
  const [payoutInfo, setPayoutInfo] = useState<any>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutFilter, setPayoutFilter] = useState<'7days' | 'all'>('7days');

  const fetchPayoutInfo = async () => {
    setPayoutLoading(true);
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
    } finally {
      setPayoutLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchPayoutInfo();
  }, []);

  // Theme-based colors
  const themeColors = {
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
  };

  // Date filter helper
  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const lower = dateStr.toLowerCase();
    if (lower.includes('today')) return true;

    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      const today = new Date();
      return d.getDate() === today.getDate() &&
             d.getMonth() === today.getMonth() &&
             d.getFullYear() === today.getFullYear();
    } catch {
      // Fallback: check if the string contains the locale date parts
      const todayString = new Date().toLocaleDateString();
      return dateStr.includes(todayString);
    }
  };

  const isThisWeek = (dateStr: string) => {
    if (!dateStr) return false;
    const lower = dateStr.toLowerCase();
    if (lower.includes('today') || lower.includes('yesterday')) return true;

    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    } catch {
      return true; // Fallback to true if unparseable custom relative date (for demo mock consistency)
    }
  };

  const completedOrders = orders.filter(
    (o) => o.riderId === riderId && o.status === 'delivered'
  );

  const getFilteredOrders = () => {
    if (activeFilter === 'today') {
      return completedOrders.filter(o => isToday(o.createdAt || o.date));
    }
    if (activeFilter === 'week') {
      return completedOrders.filter(o => isThisWeek(o.createdAt || o.date));
    }
    return completedOrders;
  };

  const filteredList = getFilteredOrders();
  const totalEarnings = filteredList.reduce((sum, o) => sum + Number(o.deliveryCharge ?? 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      
      {/* Fixed Header */}
      <View style={[styles.header, { backgroundColor: '#FFCC00', borderBottomColor: '#E2B200' }]}>
        <View style={styles.headerInfo}>
          <Text style={[styles.subtitle, { color: '#333' }]}>Earnings & Records</Text>
          <Text style={[styles.title, { color: '#000' }]}>Delivery History</Text>
        </View>
        <View style={styles.badge}>
          <Award size={14} color="#000" />
          <Text style={styles.badgeText}>Cloude Kitchen App</Text>
        </View>
      </View>

      {/* Scrollable Content (Only body scrolls) */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Earnings Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.summaryTitle, { color: themeColors.textSecondary }]}>YOUR SUMMARY PERFORMANCE</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <View style={[styles.iconBg, { backgroundColor: 'rgba(52,199,89,0.1)' }]}>
                <Wallet size={20} color={theme.colors.success} />
              </View>
              <Text style={[styles.metricVal, { color: themeColors.text }]}>₹{totalEarnings}</Text>
              <Text style={styles.metricLabel}>Total Payout</Text>
            </View>
            
            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />

            <View style={styles.metricItem}>
              <View style={[styles.iconBg, { backgroundColor: 'rgba(255,107,0,0.1)' }]}>
                <CheckCircle size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.metricVal, { color: themeColors.text }]}>{filteredList.length}</Text>
              <Text style={styles.metricLabel}>Trips Done</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={[styles.filterRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
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
            <View key={order.id} style={[styles.orderCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={[styles.cardHeader, { borderBottomColor: themeColors.border }]}>
                <View>
                  <Text style={[styles.orderId, { color: themeColors.text }]}>{order.id}</Text>
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
                <View style={styles.earningsBadge}>
                  <Text style={styles.earningsAmt}>+₹{order.deliveryCharge ?? 0}</Text>
                </View>
              </View>

              {/* Path details */}
              <View style={styles.pathBox}>
                <View style={styles.pathNode}>
                  <MapPin size={12} color={theme.colors.veg} />
                  <Text style={[styles.pathText, { color: themeColors.text }]} numberOfLines={1}>
                    From: <Text style={styles.boldText}>{order.kitchenName}</Text>
                  </Text>
                </View>
                <View style={styles.pathNode}>
                  <MapPin size={12} color={theme.colors.primary} />
                  <Text style={[styles.pathText, { color: themeColors.text }]} numberOfLines={1}>
                    To: <Text style={styles.boldText}>{order.customerName}</Text>
                  </Text>
                </View>
                <Text style={styles.addressText} numberOfLines={2}>
                  📍 Address: {order.deliveryAddress || 'Customer Location'}
                </Text>
              </View>

              {/* Timestamps */}
              <View style={[styles.timestampsBlock, { borderTopColor: themeColors.border }]}>
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

              <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
                <Text style={styles.successLabel}>✓ DELIVERED SUCCESSFUL</Text>
                <Text style={styles.commissionLabel}>Payout: Cash/Online</Text>
              </View>
            </View>
          ))}

          {!isLoading && filteredList.length === 0 && (
            <View style={styles.emptyContainer}>
              <Clock size={44} color="#555" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No completed delivery records found in this timeframe.</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#E23744',
    textTransform: 'uppercase',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFCC00',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 4,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 9,
    fontWeight: 'bold',
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
  },
  metricLabel: {
    fontSize: 9,
    color: '#888',
    marginTop: 2,
  },
  dividerLine: {
    width: 1,
    height: 45,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#E23744',
  },
  filterText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#888',
  },
  filterTextActive: {
    color: '#FFF',
  },
  listContainer: {
    marginBottom: 20,
  },
  orderCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 10,
  },
  orderId: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 10,
    color: '#888',
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
    color: '#2ecc71',
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
    marginLeft: 8,
  },
  boldText: {
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
    marginLeft: 4,
  },
  timestampsBlock: {
    borderTopWidth: 1,
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
    paddingTop: 10,
  },
  successLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  commissionLabel: {
    fontSize: 9,
    color: '#888',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  }
});
