import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  TextInput,
  Alert 
} from 'react-native';
import { Bike, Shield, Phone, CreditCard, ChevronRight, X, Clock, MapPin, Search } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { API_BASE_URL } from '../../store/apiConfig';
import { useAuthStore } from '../../store/useAuthStore';

interface Rider {
  id: string;
  vehicleNumber: string;
  licenseNumber: string;
  rcNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  rating: number;
  ratingCount: number;
  phone?: string;
  gender?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export default function AdminRidersScreen() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);

  const isDarkMode = useAuthStore(state => state.isDarkMode);

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

  const fetchRiderData = async () => {
    try {
      const resRiders = await fetch(`${API_BASE_URL}/api/riders`);
      const jsonRiders = await resRiders.json();

      const resOrders = await fetch(`${API_BASE_URL}/api/orders`);
      const jsonOrders = await resOrders.json();

      if (jsonRiders.success) {
        setRiders(jsonRiders.data);
      }
      if (jsonOrders.success) {
        setOrders(jsonOrders.data);
      }
    } catch (e) {
      console.warn('Failed to load admin riders panel data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderData();
    const interval = setInterval(fetchRiderData, 8000); // refresh every 8s
    return () => clearInterval(interval);
  }, []);

  const filteredRiders = riders.filter(r => {
    const fullName = `${r.firstName || ''} ${r.lastName || ''}`.toLowerCase();
    const phone = (r.phone || '').toLowerCase();
    const zone = (r.vehicleNumber || '').toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           phone.includes(searchQuery.toLowerCase()) ||
           zone.includes(searchQuery.toLowerCase());
  });

  const getRiderCompletedOrders = (riderId: string) => {
    return orders.filter(o => o.riderId === riderId && o.status === 'delivered');
  };

  const getRiderEarnings = (riderId: string) => {
    const riderCompleted = getRiderCompletedOrders(riderId);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyOrders = riderCompleted.filter(o => {
      let dateStr = o.date || o.createdAt;
      if (typeof dateStr === 'string' && dateStr.includes('today')) return true;
      const orderDate = new Date(dateStr || Date.now());
      return orderDate >= oneWeekAgo;
    });

    const weekly = weeklyOrders.reduce((sum, o) => sum + Number(o.deliveryCharge || 40), 0);
    const total = riderCompleted.reduce((sum, o) => sum + Number(o.deliveryCharge || 40), 0);
    const historic = total - weekly;

    return {
      weekly,
      historic,
      total
    };
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading delivery partners...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#FFCC00' }]}>
        <Bike size={28} color={'#FFF'} />
        <View style={styles.headerMeta}>
          <Text style={[styles.roleText, { color: 'rgba(255, 255, 255, 0.85)' }]}>Super Admin Panel</Text>
          <Text style={[styles.kitchenName, { color: '#FFF' }]}>Rider Directory & Payouts</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={[styles.searchContainer, { backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}>
        <Search size={16} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search by name, phone or vehicle plate..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: themeColors.text }]}
        />
      </View>

      {/* Riders Directory */}
      <ScrollView style={styles.scroller} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Registered Partners ({filteredRiders.length})</Text>
        
        {filteredRiders.map((rider) => {
          const completedCount = getRiderCompletedOrders(rider.id).length;
          const earnings = getRiderEarnings(rider.id);
          const fullName = `${rider.firstName || 'Rider'} ${rider.lastName || 'Partner'}`.trim();

          return (
            <TouchableOpacity 
              key={rider.id} 
              style={[styles.riderCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => setSelectedRider(rider)}
            >
              <View style={[styles.cardHeader, { borderBottomColor: themeColors.border }]}>
                <View>
                  <Text style={[styles.riderName, { color: themeColors.text }]}>{fullName}</Text>
                  <Text style={[styles.riderEmail, { color: themeColors.textSecondary }]}>{rider.email || 'partner@cludekitchen.com'}</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {Number(rider.rating).toFixed(1)}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Phone size={11} color="#888" />
                  <Text style={[styles.metaVal, { color: themeColors.textSecondary }]}>{rider.phone || 'No phone'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Shield size={11} color="#888" />
                  <Text style={[styles.metaVal, { color: themeColors.textSecondary }]}>{rider.vehicleNumber || 'No plate'}</Text>
                </View>
              </View>

              <View style={[styles.bankPreview, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                <CreditCard size={12} color={themeColors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.bankText, { color: themeColors.textSecondary }]} numberOfLines={1}>
                  Bank: {rider.bankName || 'SBI'} A/C {rider.accountNumber ? `••••${rider.accountNumber.slice(-4)}` : 'SBI-Static'}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={[styles.completedCountText, { color: themeColors.textSecondary }]}>Jobs Done: <Text style={{ color: themeColors.text, fontWeight: 'bold' }}>{completedCount}</Text></Text>
                <Text style={[styles.earningsText, { color: themeColors.textSecondary }]}>7-Day Due: <Text style={{ color: themeColors.primary, fontWeight: 'bold' }}>₹{earnings.weekly}</Text></Text>
                <ChevronRight size={14} color="#888" />
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredRiders.length === 0 && (
          <Text style={[styles.noResults, { color: themeColors.textSecondary }]}>No riders match your search query.</Text>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Selected Rider History & Bank Details Modal */}
      {selectedRider && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={selectedRider !== null}
          onRequestClose={() => setSelectedRider(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
                <View>
                  <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                    {selectedRider.firstName} {selectedRider.lastName}
                  </Text>
                  <Text style={[styles.modalSub, { color: themeColors.textSecondary }]}>{selectedRider.email}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedRider(null)} style={[styles.closeBtn, { backgroundColor: themeColors.border }]}>
                  <X size={18} color={themeColors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroller} contentContainerStyle={{ padding: 16 }}>
                {/* Rider Payout Summary */}
                <Text style={[styles.modalSectionTitle, { color: themeColors.primary }]}>Payout Settlement (Swiggy Payout Cycle)</Text>
                <View style={[styles.detailsGroup, { backgroundColor: themeColors.background, borderColor: themeColors.border, padding: 16, marginBottom: 20 }]}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary, fontWeight: 'bold' }]}>7-Day Pending Payout</Text>
                    <Text style={[styles.detailVal, { color: themeColors.primary, fontWeight: 'bold', fontSize: 16 }]}>₹{getRiderEarnings(selectedRider.id).weekly}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Paid / Cleared History</Text>
                    <Text style={[styles.detailVal, { color: themeColors.success, fontWeight: 'bold' }]}>₹{getRiderEarnings(selectedRider.id).historic}</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Lifetime Payout</Text>
                    <Text style={[styles.detailVal, { color: themeColors.text, fontWeight: 'bold' }]}>₹{getRiderEarnings(selectedRider.id).total}</Text>
                  </View>
                </View>

                {/* Bank Account Section */}
                <Text style={[styles.modalSectionTitle, { color: themeColors.primary }]}>Bank & Document Details</Text>
                <View style={[styles.detailsGroup, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Bank Name</Text>
                    <Text style={[styles.detailVal, { color: themeColors.text }]}>{selectedRider.bankName || 'State Bank Of India'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Account Number</Text>
                    <Text style={[styles.detailVal, { color: themeColors.text }]}>{selectedRider.accountNumber || 'SBI A/C 98745612301'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>IFSC Code</Text>
                    <Text style={[styles.detailVal, { color: themeColors.text }]}>{selectedRider.ifscCode || 'SBIN0001043'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Vehicle License</Text>
                    <Text style={[styles.detailVal, { color: themeColors.text }]}>{selectedRider.licenseNumber || 'DL-14201800000'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>RC Book Code</Text>
                    <Text style={[styles.detailVal, { color: themeColors.text }]}>{selectedRider.rcNumber || 'RC/30948/2026'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Gender / Sex</Text>
                    <Text style={[styles.detailVal, { color: themeColors.text }]}>{selectedRider.gender || 'Male'}</Text>
                  </View>
                </View>

                {/* Job Logs */}
                <Text style={[styles.modalSectionTitle, { color: themeColors.primary }]}>Completed Jobs History ({getRiderCompletedOrders(selectedRider.id).length})</Text>
                {getRiderCompletedOrders(selectedRider.id).map((order) => (
                  <View key={order.id} style={[styles.jobLogCard, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                    <View style={[styles.jobLogHeader, { borderBottomColor: themeColors.border }]}>
                      <Text style={[styles.jobId, { color: themeColors.text }]}>{order.id}</Text>
                      <Text style={[styles.jobDate, { color: themeColors.textSecondary }]}>{order.date}</Text>
                    </View>
                    <View style={styles.jobNode}>
                      <MapPin size={10} color={themeColors.success} style={{ marginRight: 6, marginTop: 2 }} />
                      <Text style={[styles.jobText, { color: themeColors.textSecondary }]}>From: {order.kitchenName}</Text>
                    </View>
                    <View style={styles.jobNode}>
                      <MapPin size={10} color={themeColors.primary} style={{ marginRight: 6, marginTop: 2 }} />
                      <Text style={[styles.jobText, { color: themeColors.textSecondary }]}>To: {order.deliveryAddress || 'Customer Location'}</Text>
                    </View>
                    <View style={[styles.jobFooter, { borderTopColor: themeColors.border }]}>
                      <Text style={styles.jobCharge}>Payout: ₹{order.deliveryCharge || 40}</Text>
                      <Text style={styles.jobDelivered}>✓ DELIVERED</Text>
                    </View>
                  </View>
                ))}

                {getRiderCompletedOrders(selectedRider.id).length === 0 && (
                  <Text style={[styles.noHistory, { color: themeColors.textSecondary }]}>This rider has not completed any delivery jobs yet.</Text>
                )}
              </ScrollView>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 10,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFCC00',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerMeta: {
    marginLeft: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  kitchenName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 14,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  searchInput: {
    color: '#FFF',
    fontSize: 13,
    flex: 1,
  },
  scroller: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  riderCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    paddingBottom: 8,
    marginBottom: 10,
  },
  riderName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  riderEmail: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  ratingBadge: {
    backgroundColor: 'rgba(255,204,0,0.1)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.gold,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaVal: {
    fontSize: 11,
    color: '#CCC',
    marginLeft: 6,
  },
  bankPreview: {
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bankText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    paddingTop: 10,
  },
  completedCountText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  earningsText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginTop: 40,
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
    height: '80%',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroller: {
    flex: 1,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  detailsGroup: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  detailLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  detailVal: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  jobLogCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  jobLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 4,
    marginBottom: 6,
  },
  jobId: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
  },
  jobDate: {
    fontSize: 9,
    color: '#888',
  },
  jobNode: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 1,
  },
  jobText: {
    fontSize: 10,
    color: '#CCC',
    flex: 1,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 6,
    marginTop: 6,
  },
  jobCharge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  jobDelivered: {
    fontSize: 8,
    fontWeight: 'bold',
    color: theme.colors.success,
    backgroundColor: 'rgba(46,204,113,0.1)',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  noHistory: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  }
});
