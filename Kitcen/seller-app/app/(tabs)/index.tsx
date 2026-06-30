import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { 
  ChefHat,
  TrendingUp,
  ShoppingBag,
  Store
} from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function SellerDashboard() {
  const user = useAuthStore(state => state.user);
  const kitchens = useKitchenStore(state => state.kitchens);
  const products = useKitchenStore(state => state.products);
  const orders = useKitchenStore(state => state.orders);
  
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);
  const updateOrderStatus = useKitchenStore(state => state.updateOrderStatus);

  // Fetch kitchens and orders on mount
  useEffect(() => {
    fetchKitchens();
    fetchOrders(); // Fetches all orders so we can filter by kitchenId
  }, []);

  // Find user's kitchen by matching ownerId
  const myKitchen = kitchens.find(k => k.owner === user?.id) || kitchens[0];
  const selectedKitchenId = myKitchen?.id || 'k3';

  const kitchenInfo = myKitchen || kitchens[0] || { name: 'My Kitchen', revenue: 0 };
  const kitchenProducts = products[selectedKitchenId] || [];
  const kitchenOrders = orders.filter(o => o.kitchenId === selectedKitchenId);

  const handleOrderStatusToggle = async (orderId: string, currentStatus: string) => {
    let nextStatus: typeof orders[0]['status'] = 'placed';
    if (currentStatus === 'placed') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'on_the_way';
    else if (currentStatus === 'on_the_way') nextStatus = 'delivered';
    
    await updateOrderStatus(orderId, nextStatus);
  };

  const isApproved = myKitchen?.isApproved === 'approved';

  if (!isApproved) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <ChefHat size={64} color={theme.colors.warning} style={{ marginBottom: 20 }} />
        <Text style={{ color: theme.colors.warning, fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
          Approval Pending
        </Text>
        <Text style={{ color: '#FFF', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 }}>
          Your kitchen "{kitchenInfo.name}" is pending approval from the SuperAdmin.
        </Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 8, lineHeight: 18, paddingHorizontal: 20 }}>
          Once approved, you will be able to manage orders, setup categories, and add items to your menu.
        </Text>
      </View>
    );
  }

  const soldOrders = kitchenOrders.filter(o => o.status === 'delivered');
  const cancelledOrders = kitchenOrders.filter(o => o.status === 'cancelled');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.sellerHeader}>
        <ChefHat size={28} color={theme.colors.primary} />
        <View style={styles.sellerHeaderMeta}>
          <Text style={styles.sellerRoleText}>Kitchen Owner Workspace</Text>
          <Text style={styles.sellerKitchenName}>{kitchenInfo.name}</Text>
        </View>
      </View>

      {/* Operational Stats */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <TrendingUp size={16} color={theme.colors.success} />
          <Text style={styles.kpiValue}>₹{kitchenInfo.revenue}</Text>
          <Text style={styles.kpiLabel}>Kitchen Earnings</Text>
        </View>
        <View style={styles.kpiCard}>
          <ShoppingBag size={16} color={theme.colors.primary} />
          <Text style={styles.kpiValue}>{kitchenOrders.length}</Text>
          <Text style={styles.kpiLabel}>Total Orders</Text>
        </View>
      </View>

      <View style={[styles.kpiGrid, { marginTop: -12, marginBottom: 24 }]}>
        <View style={styles.kpiCard}>
          <ShoppingBag size={16} color={theme.colors.veg} />
          <Text style={styles.kpiValue}>{soldOrders.length}</Text>
          <Text style={styles.kpiLabel}>Orders Sold</Text>
        </View>
        <View style={styles.kpiCard}>
          <ShoppingBag size={16} color={theme.colors.nonVeg} />
          <Text style={styles.kpiValue}>{cancelledOrders.length}</Text>
          <Text style={styles.kpiLabel}>Returned/Rejected</Text>
        </View>
      </View>

      {/* Live Incoming Orders Queue */}
      <View style={styles.sellerSection}>
        <Text style={styles.sellerSectionTitle}>Live Kitchen Orders ({kitchenOrders.filter(o => o.status !== 'delivered').length})</Text>
        {kitchenOrders.filter(o => o.status !== 'delivered').map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderCardHeader}>
              <View>
                <Text style={styles.orderCardClient}>{order.customerName}</Text>
                <Text style={styles.orderCardId}>{order.id} • {order.paymentMethod.toUpperCase()}</Text>
              </View>
              <View style={styles.statusBadgeYellow}>
                <Text style={styles.statusTextYellow}>{order.status.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.orderCardItemsList}>
              {order.items.map((item, idx) => (
                <Text key={idx} style={styles.orderCardItem}>
                  {item.quantity}x {item.name}
                </Text>
              ))}
            </View>

            <View style={styles.orderCardFooter}>
              <Text style={styles.orderCardTotal}>Total Bill: ₹{order.total}</Text>
              {order.status !== 'delivered' && (
                <TouchableOpacity 
                  style={styles.actionStatusBtn}
                  onPress={() => handleOrderStatusToggle(order.id, order.status)}
                >
                  <Text style={styles.actionStatusText}>
                    {order.status === 'placed' ? 'Accept / Start Preparing' : 
                     order.status === 'preparing' ? 'Mark Food Ready' : 
                     order.status === 'ready' ? 'Dispatch Rider' : 'Complete Delivery'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        {kitchenOrders.filter(o => o.status !== 'delivered').length === 0 && (
          <Text style={styles.emptyQueueText}>No active incoming orders currently.</Text>
        )}
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
  orderCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    paddingBottom: 10,
  },
  orderCardClient: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  orderCardId: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusBadgeYellow: {
    backgroundColor: 'rgba(255,204,0,0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusTextYellow: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.warning,
  },
  orderCardItemsList: {
    paddingVertical: 12,
  },
  orderCardItem: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    paddingTop: 12,
  },
  orderCardTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  actionStatusBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyQueueText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  }
});
