import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock, RefreshCw, Star, Trash2 } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';

type OrderSubTab = 'active' | 'completed' | 'cancelled';

export default function OrdersScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const isDarkMode = useAuthStore(state => state.isDarkMode);
  
  const orders = useKitchenStore(state => state.orders);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);
  const updateOrderStatus = useKitchenStore(state => state.updateOrderStatus);

  const addItem = useCartStore(state => state.addItem);

  const [activeTab, setActiveTab] = useState<OrderSubTab>('active');
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchOrders(user.id);
    } else {
      fetchOrders();
    }
  }, [user]);

  // Filter orders by sub-tab
  const getFilteredOrders = () => {
    return orders.filter(order => {
      if (activeTab === 'active') {
        return order.status !== 'delivered' && order.status !== 'cancelled';
      } else if (activeTab === 'completed') {
        return order.status === 'delivered';
      } else {
        return order.status === 'cancelled';
      }
    });
  };

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoadingOrderId(orderId);
              await updateOrderStatus(orderId, 'cancelled');
              setLoadingOrderId(null);
              Alert.alert('Cancelled', 'Order cancelled successfully.');
              if (user?.id) fetchOrders(user.id);
            } catch (err) {
              setLoadingOrderId(null);
              Alert.alert('Error', 'Failed to cancel order.');
            }
          }
        }
      ]
    );
  };

  const handleOrderAgain = (order: any) => {
    // Add all items from this order back into the cart
    try {
      order.items.forEach((item: any) => {
        addItem(order.kitchenId, order.kitchenName, {
          id: item.id,
          productId: item.productId || item.id,
          name: item.name,
          price: item.price,
          selectedCustomizations: item.selectedCustomizations || []
        });
      });
      Alert.alert(
        'Added to Cart',
        'All items from this order have been added to your basket.',
        [
          { text: 'Keep Shopping' },
          { text: 'Go to Cart', onPress: () => router.push('/cart') }
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to add items to cart.');
    }
  };

  const handleLeaveReview = (order: any) => {
    Alert.alert(
      'Leave a Review',
      `Rate your experience from ${order.kitchenName}:`,
      [
        { text: '★ Excellent (5)', onPress: () => Alert.alert('Thank you', 'Review submitted successfully!') },
        { text: '★★★ Average (3)', onPress: () => Alert.alert('Thank you', 'We will improve our service!') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const filteredOrders = getFilteredOrders();

  const themeColors = {
    background: '#FFCC00', // Gold/yellow top header background
    card: isDarkMode ? '#121214' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
  };

  return (
    <View style={styles.container}>
      
      {/* Gold Header block */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* White rounded body card */}
      <View style={styles.bodyCard}>
        
        {/* Horizontal Sub-tabs bar */}
        <View style={styles.tabBar}>
          {(['active', 'completed', 'cancelled'] as OrderSubTab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Orders list */}
        {filteredOrders.length > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {filteredOrders.map(order => {
              // Calculate total quantity of items
              const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
              // Use a generic food image or item image if available
              const firstItemImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150';
              
              return (
                <View key={order.id} style={styles.orderCard}>
                  
                  {/* Card Content Row */}
                  <View style={styles.cardHeader}>
                    <Image source={{ uri: firstItemImg }} style={styles.itemImage} />
                    
                    <View style={styles.metaInfo}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={styles.restaurantName} numberOfLines={1}>
                          {order.kitchenName}
                        </Text>
                        <Text style={styles.priceText}>₹{order.total}</Text>
                      </View>
                      
                      <Text style={styles.orderDate}>{order.date || 'Today'}</Text>
                      <Text style={styles.itemsSummary}>
                        {totalItems} {totalItems > 1 ? 'items' : 'item'} • {order.items.map(i => i.name).join(', ')}
                      </Text>
                    </View>
                  </View>

                  {/* Dynamic Action Buttons */}
                  {order.id === loadingOrderId ? (
                    <ActivityIndicator size="small" color="#FFB300" style={{ marginTop: 12 }} />
                  ) : activeTab === 'active' ? (
                    <View style={styles.btnRow}>
                      <TouchableOpacity 
                        style={styles.cancelBtn} 
                        onPress={() => handleCancelOrder(order.id)}
                      >
                        <Text style={styles.cancelBtnText}>Cancel Order</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.trackBtn}
                        onPress={() => router.push(`/tracking/${order.id}`)}
                      >
                        <Text style={styles.trackBtnText}>Track Driver</Text>
                      </TouchableOpacity>
                    </View>
                  ) : activeTab === 'completed' ? (
                    <View style={styles.btnRow}>
                      <TouchableOpacity 
                        style={styles.cancelBtn} 
                        onPress={() => handleLeaveReview(order)}
                      >
                        <Text style={styles.cancelBtnText}>Leave a review</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.trackBtn}
                        onPress={() => handleOrderAgain(order)}
                      >
                        <Text style={styles.trackBtnText}>Order Again</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* Cancelled order info status */
                    <View style={styles.cancelledStatusBox}>
                      <Text style={styles.cancelledStatusText}>This order was cancelled</Text>
                    </View>
                  )}

                </View>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Clock size={48} color="#D1D1D6" style={{ marginBottom: 15 }} />
            <Text style={styles.emptyText}>No {activeTab} orders found.</Text>
          </View>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFCC00', // Gold/yellow top background matching mockups
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 35,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: 'System',
  },
  bodyCard: {
    flex: 1,
    backgroundColor: '#F5F5F7', // Crisp light background from mockups
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 21,
  },
  tabButtonActive: {
    backgroundColor: '#FFB300', // Primary orange-red tab indicator
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFB300',
  },
  tabButtonTextActive: {
    color: '#FFF',
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 65,
    height: 65,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
  },
  metaInfo: {
    flex: 1,
    marginLeft: 14,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFB300', // Bold orange price tags
  },
  orderDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 3,
  },
  itemsSummary: {
    fontSize: 11,
    color: '#666',
    marginTop: 6,
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: 14,
    borderTopWidth: 1,
    borderColor: '#F0F0F2',
    paddingTop: 14,
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flex: 1,
    marginRight: 10,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFEFEB', // Light peach background
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFB300', // Orange text
  },
  trackBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFB300', // Bold orange-red primary background
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cancelledStatusBox: {
    marginTop: 14,
    borderTopWidth: 1,
    borderColor: '#F0F0F2',
    paddingTop: 14,
    alignItems: 'center',
  },
  cancelledStatusText: {
    color: '#999',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  }
});
