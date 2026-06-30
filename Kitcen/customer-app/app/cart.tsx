import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trash2, Tag, ChevronRight, Plus, Minus, CreditCard } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useCartStore } from '../store/useCartStore';
import { useKitchenStore } from '../store/useKitchenStore';

export default function CartScreen() {
  const router = useRouter();
  
  const cartItems = useCartStore(state => state.items);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeItem = useCartStore(state => state.removeItem);
  const totals = useCartStore(state => state.getTotals());
  const restaurantId = useCartStore(state => state.restaurantId);
  const restaurantName = useCartStore(state => state.restaurantName);
  
  const coupon = useCartStore(state => state.coupon);
  const applyCoupon = useCartStore(state => state.applyCoupon);
  const clearCart = useCartStore(state => state.clearCart);

  const cookingInstruction = useCartStore(state => state.cookingInstruction);
  const setCookingInstruction = useCartStore(state => state.setCookingInstruction);

  // Zustand Kitchen store
  const placeOrder = useKitchenStore(state => state.placeOrder);

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'wallet' | 'card'>('cod');

  const handleApplyCoupon = () => {
    if (promoCodeInput.toUpperCase() === 'ITALY50') {
      applyCoupon({
        code: 'ITALY50',
        discountType: 'percentage',
        discountValue: 50,
        maxDiscount: 120,
        minOrderValue: 200
      });
      Alert.alert('Success', 'Promo applied successfully!');
    } else {
      Alert.alert('Invalid', 'Invalid coupon code. Try "ITALY50"');
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    try {
      const orderId = await placeOrder({
        kitchenId: restaurantId || 'k1',
        kitchenName: restaurantName || 'The Pizza Box',
        customerName: 'Sneha Mehta',
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          selectedCustomizations: item.selectedCustomizations
        })),
        subtotal: totals.subtotal,
        deliveryCharge: totals.deliveryCharge,
        tax: totals.tax,
        discount: totals.discount,
        total: totals.total,
        paymentMethod: paymentMethod
      });

      // Simulate order placement
      Alert.alert(
        'Order Confirmed',
        'Your order has been placed successfully!',
        [
          {
            text: 'Track Order',
            onPress: () => {
              clearCart();
              // Go to live tracking screen with real generated order ID
              router.replace(`/tracking/${orderId}`);
            }
          }
        ]
      );
    } catch (err: any) {
      Alert.alert('Checkout Error', 'Failed to submit order. Please try again.');
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Your cart is empty 🛍️</Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => router.replace('/')}>
          <Text style={styles.shopButtonText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout Cart</Text>
        <TouchableOpacity onPress={clearCart}>
          <Trash2 size={18} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Items List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemMeta}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
              </View>

              <View style={styles.qtyContainer}>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => updateQuantity(item.id, -1)}
                >
                  <Minus size={12} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => updateQuantity(item.id, 1)}
                >
                  <Plus size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Cooking notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cooking Instructions</Text>
          <TextInput
            placeholder="E.g. Make it spicy, No onions, etc."
            placeholderTextColor="#888"
            value={cookingInstruction}
            onChangeText={setCookingInstruction}
            style={styles.textInput}
          />
        </View>

        {/* Coupons section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply Coupon</Text>
          <View style={styles.couponRow}>
            <TextInput
              placeholder="Enter promo code (Try: ITALY50)"
              placeholderTextColor="#888"
              autoCapitalize="characters"
              value={promoCodeInput}
              onChangeText={setPromoCodeInput}
              style={[styles.textInput, { flex: 1, marginBottom: 0, marginRight: 10 }]}
            />
            <TouchableOpacity style={styles.couponApplyBtn} onPress={handleApplyCoupon}>
              <Text style={styles.couponApplyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {coupon && (
            <View style={styles.couponSuccessBadge}>
              <Tag size={12} color={theme.colors.success} />
              <Text style={styles.couponSuccessText}>Applied: "{coupon.code}" (Saved ₹{totals.discount})</Text>
            </View>
          )}
        </View>

        {/* Payments selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethodRow}>
            {(['cod'] as const).map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentOption,
                  paymentMethod === method && styles.paymentOptionActive
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[
                  styles.paymentLabel,
                  paymentMethod === method && styles.paymentLabelActive
                ]}>
                  {method === 'cod' ? 'Cash on Delivery' : method === 'wallet' ? 'Wallet' : 'Card'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary pricing */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>₹{totals.subtotal}</Text>
          </View>
          
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Charges</Text>
            <Text style={styles.billValue}>₹{totals.deliveryCharge}</Text>
          </View>
          
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes & GST (15%)</Text>
            <Text style={styles.billValue}>₹{totals.tax}</Text>
          </View>

          {totals.discount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: theme.colors.success }]}>Coupon Discount</Text>
              <Text style={[styles.billValue, { color: theme.colors.success }]}>-₹{totals.discount}</Text>
            </View>
          )}

          <View style={[styles.billRow, styles.billRowTotal]}>
            <Text style={styles.billLabelTotal}>To Pay</Text>
            <Text style={styles.billValueTotal}>₹{totals.total}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer trigger */}
      <View style={styles.footerBar}>
        <View>
          <Text style={styles.footerPrice}>₹{totals.total}</Text>
          <Text style={styles.footerLabel}>Grand Total</Text>
        </View>
        <TouchableOpacity style={styles.payButton} onPress={handleCheckout}>
          <Text style={styles.payButtonText}>Place Order</Text>
          <ChevronRight size={16} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 50,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  shopButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollArea: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#050505',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemMeta: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 10,
    padding: 4,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    marginHorizontal: 12,
  },
  textInput: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 12,
    padding: 12,
    color: '#FFF',
    fontSize: 13,
    marginBottom: 12,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponApplyBtn: {
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  couponApplyBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  couponSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,199,89,0.1)',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  couponSuccessText: {
    fontSize: 11,
    color: theme.colors.success,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentOption: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  paymentOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(255,107,0,0.05)',
  },
  paymentLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  paymentLabelActive: {
    color: theme.colors.primary,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  billValue: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600',
  },
  billRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    paddingTop: 12,
    marginTop: 12,
  },
  billLabelTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  billValueTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  footerBar: {
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  footerLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  payButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 4,
  }
});
