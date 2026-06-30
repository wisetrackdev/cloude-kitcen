import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { Navigation, MapPin, CheckCircle, Clock } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';

export default function RiderDashboard() {
  const orders = useKitchenStore(state => state.orders);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);
  const updateOrderStatus = useKitchenStore(state => state.updateOrderStatus);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Active deliveries for rider Vikram (orders not delivered or cancelled)
  const activeDeliveries = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'placed');

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus: typeof orders[0]['status'] = 'on_the_way';
    if (currentStatus === 'preparing' || currentStatus === 'ready') {
      nextStatus = 'on_the_way';
      Alert.alert('Status Updated', 'Order picked up! Navigate to Customer Location.');
    } else if (currentStatus === 'on_the_way') {
      nextStatus = 'delivered';
      Alert.alert('Status Updated', 'Order delivered successfully! Earnings added.');
    }

    await updateOrderStatus(orderId, nextStatus);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.riderHeader}>
        <Navigation size={28} color={theme.colors.primary} />
        <View style={styles.headerMeta}>
          <Text style={styles.roleText}>Rider Workspace</Text>
          <Text style={styles.riderName}>Vikram Singh (MH-02-AB-9831)</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Active Delivery Tasks ({activeDeliveries.length})</Text>

      <View style={styles.deliveriesList}>
        {activeDeliveries.map((delivery) => (
          <View key={delivery.id} style={styles.deliveryCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>{delivery.id}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{delivery.status.toUpperCase()}</Text>
              </View>
            </View>

            {/* Path details */}
            <View style={styles.pathContainer}>
              <View style={styles.pathNode}>
                <MapPin size={16} color={theme.colors.veg} />
                <View style={styles.nodeDetails}>
                  <Text style={styles.nodeTitle}>Pickup Kitchen</Text>
                  <Text style={styles.nodeName}>{delivery.kitchenName}</Text>
                  <Text style={styles.nodeAddress}>Distance: ~1.2 km</Text>
                </View>
              </View>

              <View style={styles.verticalDottedLine} />

              <View style={styles.pathNode}>
                <MapPin size={16} color={theme.colors.primary} />
                <View style={styles.nodeDetails}>
                  <Text style={styles.nodeTitle}>Delivery Destination</Text>
                  <Text style={styles.nodeName}>{delivery.customerName}</Text>
                  <Text style={styles.nodeAddress}>Flat 402, Royal Residency, Pune</Text>
                </View>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.cardFooter}>
              <View style={styles.earningContainer}>
                <Text style={styles.earningLabel}>Payout for this order:</Text>
                <Text style={styles.earningVal}>₹{delivery.deliveryCharge + 10} (incl. tip)</Text>
              </View>

              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => handleUpdateStatus(delivery.id, delivery.status)}
              >
                <Text style={styles.actionBtnText}>
                  {delivery.status === 'preparing' || delivery.status === 'ready' 
                    ? 'Pick Up from Kitchen' 
                    : 'Mark Delivered'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {activeDeliveries.length === 0 && (
          <View style={styles.emptyContainer}>
            <CheckCircle size={40} color={theme.colors.success} />
            <Text style={styles.emptyText}>All deliveries completed! Waiting for new orders.</Text>
          </View>
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
  riderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  headerMeta: {
    marginLeft: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  riderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  deliveriesList: {
    paddingHorizontal: 16,
  },
  deliveryCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    paddingBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusBadge: {
    backgroundColor: 'rgba(255,107,0,0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  pathContainer: {
    marginVertical: 16,
  },
  pathNode: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nodeDetails: {
    marginLeft: 12,
    flex: 1,
  },
  nodeTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  nodeName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  nodeAddress: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  verticalDottedLine: {
    width: 2,
    height: 30,
    backgroundColor: '#333',
    marginLeft: 7,
    marginVertical: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    paddingTop: 12,
    marginTop: 4,
  },
  earningContainer: {
    flex: 1,
  },
  earningLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  earningVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 18,
  }
});
