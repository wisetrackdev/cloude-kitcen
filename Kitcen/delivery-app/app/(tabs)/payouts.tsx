import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Modal, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { CreditCard, Calendar, CheckCircle, RefreshCw, Eye } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL } from '../../store/apiConfig';

type TimeFilter = 'all' | 'today' | 'week' | 'month';

export default function RiderPayoutsScreen() {
  const user = useAuthStore(state => state.user);
  const riderId = user?.id || 'usr-rider-simulated';
  const isDarkMode = useAuthStore(state => state.isDarkMode);

  const themeColors = {
    background: '#121212', // Dark background matching the rider app theme
    card: '#1C1C1E',
    border: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    primary: '#FFCC00',
  };

  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<TimeFilter>('all');
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settlements?adminUserId=usr-admin-simulated`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // Filter settlements belonging to this rider
          const filtered = json.data.filter((s: any) => s.userType === 'rider' && s.userId === riderId);
          setSettlements(filtered);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch settlements:', err);
    } finally {
      setLoading(false);
    }
  };

  const orders = useKitchenStore(state => state.orders);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);

  useEffect(() => {
    fetchSettlements();
    fetchOrders();
  }, []);

  // Calculate unpaid earnings: delivered orders where isRiderSettled is false
  const riderOrders = orders.filter(o => o.riderId === riderId && o.status === 'delivered');
  const unpaidOrders = riderOrders.filter(o => !o.isRiderSettled);
  const unpaidEarnings = unpaidOrders.reduce((sum, o) => sum + Number(o.deliveryCharge ?? 0), 0);

  // Parse transactionDetails safely
  const parseTxDetails = (detailsStr: string) => {
    try {
      if (detailsStr.startsWith('{') && detailsStr.endsWith('}')) {
        return JSON.parse(detailsStr);
      }
    } catch (e) {}
    return { utr: detailsStr, screenshot: null };
  };

  // Filtered settlements list
  const getFilteredSettlements = () => {
    const now = new Date();
    return settlements.filter(s => {
      const sDate = new Date(s.settledAt || s.created_at || Date.now());
      if (filter === 'today') {
        return sDate.toDateString() === now.toDateString();
      } else if (filter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return sDate >= oneWeekAgo;
      } else if (filter === 'month') {
        return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const filteredList = getFilteredSettlements();
  const totalPaid = settlements.reduce((sum, s) => sum + Number(s.amount || 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      
      {/* Premium Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings Payouts</Text>
        <TouchableOpacity onPress={fetchSettlements} style={styles.refreshBtn}>
          <RefreshCw size={16} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        
        {/* Earnings Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(230,126,34,0.1)' }]}>
              <CreditCard size={18} color="#e67e22" />
            </View>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Unpaid Earnings</Text>
            <Text style={[styles.statVal, { color: '#e67e22' }]}>₹{unpaidEarnings.toFixed(0)}</Text>
            <Text style={styles.statSubText}>Delivered, awaiting payout</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(46,204,113,0.1)' }]}>
              <CheckCircle size={18} color="#2ecc71" />
            </View>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Total Paid Out</Text>
            <Text style={[styles.statVal, { color: '#2ecc71' }]}>₹{totalPaid.toFixed(0)}</Text>
            <Text style={styles.statSubText}>Cleared by admin</Text>
          </View>
        </View>

        {/* Time Filter Tabs */}
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Payout Transactions</Text>
        <View style={styles.filterRow}>
          {(['all', 'today', 'week', 'month'] as TimeFilter[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterTab,
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
                filter === tab && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
              ]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[
                styles.filterText,
                { color: themeColors.textSecondary },
                filter === tab && { color: '#000', fontWeight: 'bold' }
              ]}>
                {tab === 'all' ? 'All Time' : 
                 tab === 'today' ? 'Today' : 
                 tab === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payout Logs list */}
        {loading ? (
          <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: 40 }} />
        ) : filteredList.length > 0 ? (
          filteredList.map((item) => {
            const details = parseTxDetails(item.transactionDetails || '');
            const payoutDate = new Date(item.settledAt || item.created_at || Date.now()).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <View key={item.id} style={[styles.payoutCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <View style={styles.payoutHeader}>
                  <View>
                    <Text style={[styles.payoutId, { color: themeColors.text }]}>Payout ID: {item.id}</Text>
                    <Text style={[styles.payoutDate, { color: themeColors.textSecondary }]}>Settled: {payoutDate}</Text>
                  </View>
                  <View style={styles.payoutAmountBadge}>
                    <Text style={styles.payoutAmountText}>+₹{item.amount}</Text>
                  </View>
                </View>

                <View style={[styles.detailsSection, { borderTopColor: themeColors.border }]}>
                  <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>
                    Ref: <Text style={{ color: themeColors.text, fontWeight: 'bold' }}>{details.utr}</Text>
                  </Text>
                  
                  {details.screenshot && (
                    <TouchableOpacity 
                      style={styles.proofBtn}
                      onPress={() => setSelectedScreenshot(details.screenshot)}
                    >
                      <Eye size={12} color="#000" style={{ marginRight: 4 }} />
                      <Text style={styles.proofBtnText}>View Proof</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Calendar size={48} color={themeColors.textSecondary} style={{ opacity: 0.5, marginBottom: 10 }} />
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No payouts found for this timeframe.</Text>
          </View>
        )}

      </ScrollView>

      {/* Screenshot Viewer Modal */}
      <Modal
        visible={selectedScreenshot !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedScreenshot(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: '#1C1C1E' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#FFF' }]}>Payment Proof Screenshot</Text>
              <TouchableOpacity onPress={() => setSelectedScreenshot(null)} style={styles.closeBtn}>
                <Text style={{ fontSize: 18, color: '#FF3B30', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedScreenshot && (
              <Image 
                source={{ uri: selectedScreenshot }} 
                style={styles.screenshotImage} 
                resizeMode="contain"
              />
            )}
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
  header: {
    backgroundColor: '#FFCC00',
    paddingTop: 55,
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statVal: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statSubText: {
    fontSize: 9,
    color: '#8E8E93',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
  },
  payoutCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutId: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  payoutDate: {
    fontSize: 10,
    marginTop: 2,
  },
  payoutAmountBadge: {
    backgroundColor: 'rgba(46,204,113,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payoutAmountText: {
    color: '#2ecc71',
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailsSection: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
  },
  proofBtn: {
    backgroundColor: '#FFCC00',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  proofBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  screenshotImage: {
    width: '100%',
    height: 350,
    borderRadius: 10,
  }
});
