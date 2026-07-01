import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity 
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function OrdersScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const orders = useKitchenStore(state => state.orders);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);

  React.useEffect(() => {
    if (user?.id) {
      fetchOrders(user.id);
    } else {
      fetchOrders();
    }
  }, [user]);

  const getStatusStyle = (status: string) => {
    if (status === 'delivered') return styles.statusDelivered;
    if (status === 'cancelled') return styles.statusCancelled;
    return styles.statusPreparing;
  };

  const getStatusTextStyle = (status: string) => {
    if (status === 'delivered') return styles.statusTextDelivered;
    if (status === 'cancelled') return styles.statusTextCancelled;
    return styles.statusTextPreparing;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order History</Text>
      </View>

      <FlatList
        data={orders}
        contentContainerStyle={styles.listContainer}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.orderCard}
            activeOpacity={0.9}
            onPress={() => router.push(`/tracking/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.restaurantName}>{item.kitchenName}</Text>
                <Text style={styles.orderId}>{item.id} • {item.date}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                getStatusStyle(item.status)
              ]}>
                <Text style={[
                  styles.statusText,
                  getStatusTextStyle(item.status)
                ]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.itemsSummary} numberOfLines={1}>
              {item.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
            </Text>

            <View style={styles.cardFooter}>
              <Text style={styles.orderTotal}>Total Paid: ₹{item.total}</Text>
              <View style={styles.trackLink}>
                <Text style={styles.trackLinkText}>View tracking status</Text>
                <ChevronRight size={14} color={theme.colors.primary} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
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
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    paddingBottom: 12,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  orderId: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusDelivered: {
    backgroundColor: 'rgba(52,199,89,0.1)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(255,59,48,0.1)',
  },
  statusPreparing: {
    backgroundColor: 'rgba(255,204,0,0.1)',
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  statusTextDelivered: {
    color: theme.colors.success,
  },
  statusTextCancelled: {
    color: theme.colors.error,
  },
  statusTextPreparing: {
    color: theme.colors.warning,
  },
  itemsSummary: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    paddingTop: 12,
  },
  orderTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  trackLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackLinkText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginRight: 4,
  }
});
