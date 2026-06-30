import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { 
  Users, 
  TrendingUp, 
  ShoppingBag, 
  Store,
  CheckCircle,
  Clock
} from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';

export default function AdminDashboard() {
  const kitchens = useKitchenStore(state => state.kitchens);
  const orders = useKitchenStore(state => state.orders);
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);
  const approveKitchen = useKitchenStore(state => state.approveKitchen);

  useEffect(() => {
    fetchKitchens();
    fetchOrders();
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
        <Text style={styles.sellerSectionTitle}>Listed Kitchens & Performance</Text>
        {kitchens.map((kitchen) => (
          <View key={kitchen.id} style={styles.kitchenAdminCard}>
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
              
              {kitchen.isApproved !== 'approved' && (
                <TouchableOpacity
                  style={styles.approveActionBtn}
                  onPress={() => {
                    approveKitchen(kitchen.id);
                    Alert.alert('Approved', `Kitchen "${kitchen.name}" has been approved!`);
                  }}
                >
                  <Text style={styles.approveActionText}>Approve</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
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
  }
});
