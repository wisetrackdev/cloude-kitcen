import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native';
import { 
  Users, 
  TrendingUp, 
  ShoppingBag, 
  Store,
  CheckCircle,
  Clock,
  X
} from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';

export default function AdminDashboard() {
  const kitchens = useKitchenStore(state => state.kitchens);
  const orders = useKitchenStore(state => state.orders);
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);
  const approveKitchen = useKitchenStore(state => state.approveKitchen);

  const [selectedKitchen, setSelectedKitchen] = useState<any>(null);

  const selectedKitchenOrders = selectedKitchen 
    ? orders.filter(o => o.kitchenId === selectedKitchen.id) 
    : [];

  const selectedKitchenStats = {
    total: selectedKitchenOrders.length,
    pending: selectedKitchenOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length,
    returned: selectedKitchenOrders.filter(o => o.status === 'cancelled').length,
    earnings: selectedKitchenOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0),
    lastUpdated: selectedKitchenOrders.length > 0 ? selectedKitchenOrders[0].date : 'No orders yet'
  };

  useEffect(() => {
    fetchKitchens();
    fetchOrders();
    const interval = setInterval(() => {
      fetchKitchens();
      fetchOrders();
    }, 5000); // Poll every 5s for live updates
    return () => clearInterval(interval);
  }, []);

  const totalSales = kitchens.reduce((sum, k) => sum + k.revenue, 0);
  const totalOrdersCount = orders.length;
  const totalShopsCount = kitchens.length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.sellerHeader}>
        <Users size={28} color={theme.colors.primary} />
        <View style={styles.sellerHeaderMeta}>
          <Text style={styles.sellerRoleText}>Super Admin Panel</Text>
          <Text style={styles.sellerKitchenName}>Global Analytics</Text>
        </View>
      </View>

      {/* Global KPI Counters */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <TrendingUp size={16} color={theme.colors.success} />
          <Text style={styles.kpiValue}>₹{totalSales}</Text>
          <Text style={styles.kpiLabel}>Platform Sales</Text>
        </View>
        <View style={styles.kpiCard}>
          <ShoppingBag size={16} color={theme.colors.primary} />
          <Text style={styles.kpiValue}>{totalOrdersCount}</Text>
          <Text style={styles.kpiLabel}>Orders Handled</Text>
        </View>
        <View style={styles.kpiCard}>
          <Store size={16} color="#00C49F" />
          <Text style={styles.kpiValue}>{totalShopsCount}</Text>
          <Text style={styles.kpiLabel}>Active Shops</Text>
        </View>
      </View>

      {/* Kitchen Sales breakdowns */}
      <View style={styles.sellerSection}>
        <Text style={styles.sellerSectionTitle}>Listed Kitchens & Performance (Tap to view details)</Text>
        {kitchens.map((kitchen) => (
          <TouchableOpacity 
            key={kitchen.id} 
            style={styles.kitchenAdminCard}
            onPress={() => setSelectedKitchen(kitchen)}
          >
            <View style={[styles.kitchenAdminMeta, { flex: 1, marginRight: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kitchenAdminName}>{kitchen.name}</Text>
                {kitchen.address ? (
                  <Text style={[styles.kitchenAdminOwner, { fontSize: 10 }]}>Addr: {kitchen.address}</Text>
                ) : null}
                <Text style={styles.kitchenAdminOwner}>Owner ID: {kitchen.owner}</Text>
                <Text style={styles.kitchenAdminType}>
                  {kitchen.type === 'home_tiffin' ? 'Housewife Homestyle Tiffin' : 'Standard Restaurant'}
                </Text>
                
                {/* Approval status badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  {kitchen.isApproved === 'approved' ? (
                    <View style={styles.statusApprovedBadge}>
                      <CheckCircle size={10} color={theme.colors.veg} />
                      <Text style={styles.statusApprovedText}>APPROVED</Text>
                    </View>
                  ) : kitchen.isApproved === 'rejected' ? (
                    <View style={styles.statusRejectedBadge}>
                      <Clock size={10} color="#FF3B30" />
                      <Text style={styles.statusRejectedText}>REJECTED</Text>
                    </View>
                  ) : (
                    <View style={styles.statusPendingBadge}>
                      <Clock size={10} color={theme.colors.warning} />
                      <Text style={styles.statusPendingText}>PENDING APPROVAL</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.kitchenAdminStats}>
              <Text style={styles.adminStatVal}>₹{kitchen.revenue}</Text>
              <Text style={styles.adminStatLabel}>{kitchen.ordersCount} Orders</Text>
              
              {kitchen.isApproved !== 'approved' && kitchen.isApproved !== 'rejected' && (
                <View style={{ marginTop: 8, flexDirection: 'row' }}>
                  <TouchableOpacity
                    style={[styles.approveActionBtn, { marginRight: 6 }]}
                    onPress={() => {
                      approveKitchen(kitchen.id, 'approved');
                      Alert.alert('Approved', `Kitchen "${kitchen.name}" has been approved!`);
                    }}
                  >
                    <Text style={styles.approveActionText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.approveActionBtn, { backgroundColor: '#FF3B30' }]}
                    onPress={() => {
                      approveKitchen(kitchen.id, 'rejected');
                      Alert.alert('Rejected', `Kitchen "${kitchen.name}" has been rejected.`);
                    }}
                  >
                    <Text style={[styles.approveActionText, { color: '#FFF' }]}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* System transaction log feed */}
      <View style={styles.sellerSection}>
        <Text style={styles.sellerSectionTitle}>Global Transactions Log</Text>
        {orders.map((order) => (
          <View key={order.id} style={styles.logCard}>
            <View style={styles.logHeader}>
              <Text style={styles.logId}>{order.id}</Text>
              <Text style={styles.logDate}>{order.date}</Text>
            </View>
            <Text style={styles.logSummary}>
              Customer **{order.customerName}** paid **₹{order.total}** to **{order.kitchenName}**
            </Text>
            <View style={[styles.logStatus, { 
              backgroundColor: order.status === 'delivered' ? 'rgba(52,199,89,0.1)' : 'rgba(255,107,0,0.1)',
            }]}>
              <Text style={{ 
                fontSize: 9, 
                fontWeight: 'bold', 
                color: order.status === 'delivered' ? theme.colors.veg : theme.colors.primary 
              }}>
                {order.status.toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />

      {selectedKitchen && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={selectedKitchen !== null}
          onRequestClose={() => setSelectedKitchen(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Shop Administration Details</Text>
                <TouchableOpacity onPress={() => setSelectedKitchen(null)} style={styles.closeBtn}>
                  <X size={18} color="#FFF" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                {/* Shop Basic Details */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionHeader}>Basic Information</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Shop Name:</Text>
                    <Text style={styles.detailValue}>{selectedKitchen.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Owner Name:</Text>
                    <Text style={styles.detailValue}>{selectedKitchen.ownerName || 'Housewife Partner'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bank Account:</Text>
                    <Text style={styles.detailValue}>{selectedKitchen.bankAccount || 'SBI A/C 30948576291'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Cuisines:</Text>
                    <Text style={styles.detailValue}>{selectedKitchen.cuisines}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={styles.detailValue}>{selectedKitchen.address || 'Not Specified'}</Text>
                  </View>
                </View>

                {/* Dynamic Orders Stats */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionHeader}>Operational Metrics</Text>
                  
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Total Orders</Text>
                      <Text style={styles.metricVal}>{selectedKitchenStats.total}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Pending</Text>
                      <Text style={[styles.metricVal, { color: theme.colors.warning }]}>{selectedKitchenStats.pending}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Returned</Text>
                      <Text style={[styles.metricVal, { color: theme.colors.error }]}>{selectedKitchenStats.returned}</Text>
                    </View>
                  </View>

                  <View style={[styles.detailRow, { marginTop: 15, borderTopWidth: 1, borderTopColor: '#222', paddingTop: 10 }]}>
                    <Text style={[styles.detailLabel, { fontWeight: 'bold', color: '#FFF' }]}>Total Earnings:</Text>
                    <Text style={[styles.detailValue, { fontWeight: 'bold', color: theme.colors.success, fontSize: 16 }]}>
                      ₹{selectedKitchenStats.earnings}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Last Transaction:</Text>
                    <Text style={[styles.detailValue, { fontSize: 11, color: '#888' }]}>{selectedKitchenStats.lastUpdated}</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 50,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sellerHeaderMeta: {
    marginLeft: 12,
  },
  sellerRoleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  sellerKitchenName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  kpiLabel: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  sellerSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sellerSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  kitchenAdminCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  kitchenAdminMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kitchenAdminName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  kitchenAdminOwner: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  kitchenAdminType: {
    fontSize: 9,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  kitchenAdminStats: {
    alignItems: 'flex-end',
  },
  adminStatVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  adminStatLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  logCard: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  logId: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  logDate: {
    fontSize: 9,
    color: theme.colors.textSecondary,
  },
  logSummary: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  logStatus: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 8,
  },
  statusApprovedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,199,89,0.1)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusApprovedText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: theme.colors.veg,
    marginLeft: 4,
  },
  statusPendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,204,0,0.1)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusPendingText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: theme.colors.warning,
    marginLeft: 4,
  },
  statusRejectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusRejectedText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginLeft: 4,
  },
  approveActionBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  approveActionText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
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
    maxHeight: '80%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalTitle: {
    fontSize: 16,
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
  modalScrollBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  detailLabel: {
    fontSize: 13,
    color: '#AAA',
  },
  detailValue: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    color: '#888',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 6,
  }
});
