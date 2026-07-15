import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trash2, Tag, ChevronRight, Plus, Minus, CreditCard, MapPin, Navigation } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useCartStore } from '../store/useCartStore';
import { useKitchenStore } from '../store/useKitchenStore';
import { useAuthStore } from '../store/useAuthStore';
import * as Location from 'expo-location';

export default function CartScreen() {
  const router = useRouter();
  
  const isDarkMode = useAuthStore(state => state.isDarkMode);
  const user = useAuthStore(state => state.user);

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
  const kitchens = useKitchenStore(state => state.kitchens);
  const kitchen = kitchens.find(k => k.id === restaurantId);

  const userLocation = useAuthStore(state => state.location);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'wallet' | 'card' | 'paytm'>('paytm');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    if (userLocation?.addressName) {
      setDeliveryAddress(userLocation.addressName);
    }
  }, [userLocation]);

  const themeColors = {
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    inputBg: isDarkMode ? '#0F0F0F' : '#F0F2F4'
  };

  const detectLocation = async () => {
    setLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied. Please type your address manually.');
        setLoadingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      if (geocode.length > 0) {
        const addressObj = geocode[0];
        const formattedAddress = [
          addressObj.name,
          addressObj.street,
          addressObj.district,
          addressObj.city,
          addressObj.region,
          addressObj.postalCode,
          addressObj.country
        ].filter(Boolean).join(', ');
        setDeliveryAddress(formattedAddress || `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`);
      } else {
        setDeliveryAddress(`${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`);
      }
    } catch (e) {
      console.warn(e);
      setDeliveryAddress('H.No. 402, Block C, Noida Sector 62, Landmark: Near Metro Station, UP');
    } finally {
      setLoadingLocation(false);
    }
  };

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
    if (!deliveryAddress.trim()) {
      Alert.alert('Address Required', 'Please enter or detect your delivery address.');
      return;
    }

    const sellerUpi = kitchen?.upiId || (kitchen?.upiNumber ? `${kitchen.upiNumber}@paytm` : 'sdev70817@paytm');
    const upiUrl = `upi://pay?pa=${sellerUpi}&pn=${encodeURIComponent(kitchen?.name || 'Cloud Kitchen')}&am=${totals.total}&cu=INR&tn=${encodeURIComponent('Food Order')}`;

    const navigateToVerify = () => {
      router.push({
        pathname: '/payment-verify',
        params: {
          kitchenId: restaurantId || 'k1',
          kitchenName: restaurantName || 'The Pizza Box',
          amount: totals.total.toString(),
          subtotal: totals.subtotal.toString(),
          deliveryCharge: totals.deliveryCharge.toString(),
          tax: totals.tax.toString(),
          discount: totals.discount.toString(),
          deliveryAddress: deliveryAddress,
          latitude: userLocation?.latitude?.toString() || '28.5355',
          longitude: userLocation?.longitude?.toString() || '77.3910',
          items: JSON.stringify(cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          }))),
          upiId: sellerUpi
        }
      });
    };

    try {
      const canOpen = await Linking.canOpenURL(upiUrl);
      if (canOpen) {
        await Linking.openURL(upiUrl);
        // Wait 1 second and then navigate to verification screen
        setTimeout(() => {
          navigateToVerify();
        }, 1000);
      } else {
        Alert.alert(
          'UPI App Not Found',
          `Could not open UPI apps automatically. Please pay ₹${totals.total} to UPI ID: ${sellerUpi} manually, then click Proceed to verify.`,
          [
            { text: 'Proceed to Verify', onPress: navigateToVerify },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } catch (err) {
      console.warn('Linking error', err);
      navigateToVerify();
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.emptyText, { color: themeColors.text }]}>Your cart is empty 🛍️</Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => router.replace('/')}>
          <Text style={styles.shopButtonText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border, backgroundColor: themeColors.card }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: isDarkMode ? '#121212' : '#EAEAEA' }]} onPress={() => router.back()}>
          <ArrowLeft size={20} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Checkout Cart</Text>
        <TouchableOpacity onPress={clearCart}>
          <Trash2 size={18} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Items List */}
        <View style={[styles.section, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Items Ordered</Text>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemMeta}>
                <Text style={[styles.itemName, { color: themeColors.text }]}>{item.name}</Text>
                <Text style={[styles.itemPrice, { color: themeColors.textSecondary }]}>₹{item.price * item.quantity}</Text>
              </View>

              <View style={[styles.qtyContainer, { backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => updateQuantity(item.id, -1)}
                >
                  <Minus size={12} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.qtyValue, { color: themeColors.text }]}>{item.quantity}</Text>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => updateQuantity(item.id, 1)}
                >
                  <Plus size={12} color={themeColors.text} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Cooking notes */}
        <View style={[styles.section, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Cooking Instructions</Text>
          <TextInput
            placeholder="E.g. Make it spicy, No onions, etc."
            placeholderTextColor="#888"
            value={cookingInstruction}
            onChangeText={setCookingInstruction}
            style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
          />
        </View>

        {/* Delivery Address selection */}
        <View style={[styles.section, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Delivery Address</Text>
          <View style={[styles.addressContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <TextInput
              placeholder="H.No. / Flat, Building, Street, Area, City"
              placeholderTextColor="#888"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
              style={[styles.textInput, { height: 60, textAlignVertical: 'top', paddingVertical: 8, marginBottom: 8, backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
            />
            <TouchableOpacity 
              style={styles.gpsButton} 
              onPress={detectLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#FF5252" />
              ) : (
                <>
                  <Navigation size={14} color="#FF5252" style={{ marginRight: 6 }} />
                  <Text style={styles.gpsButtonText}>Detect via GPS</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Coupons section */}
        <View style={[styles.section, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Apply Coupon</Text>
          <View style={styles.couponRow}>
            <TextInput
              placeholder="Enter promo code (Try: ITALY50)"
              placeholderTextColor="#888"
              autoCapitalize="characters"
              value={promoCodeInput}
              onChangeText={setPromoCodeInput}
              style={[styles.textInput, { flex: 1, marginBottom: 0, marginRight: 10, backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
            />
            <TouchableOpacity style={styles.couponApplyBtn} onPress={handleApplyCoupon}>
              <Text style={styles.couponApplyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {coupon && (
            <View style={styles.couponSuccessBadge}>
              <Tag size={12} color="#2ecc71" />
              <Text style={styles.couponSuccessText}>Applied: "{coupon.code}" (Saved ₹{totals.discount})</Text>
            </View>
          )}
        </View>

        {/* Payments selection */}
        <View style={[styles.section, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Payment Method</Text>
          <View style={styles.paymentMethodRow}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                { backgroundColor: themeColors.inputBg, borderColor: '#FFCC00', backgroundColor: 'rgba(255,204,0,0.05)', flex: 1, paddingVertical: 12, borderRadius: 10 }
              ]}
            >
              <Text style={[styles.paymentLabel, { color: '#FFCC00', fontWeight: 'bold', textAlign: 'center' }]}>
                Paytm / UPI Online Only
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Display Seller UPI Details */}
          <View style={{ marginTop: 12, padding: 12, backgroundColor: isDarkMode ? '#1a1a10' : '#fffdeb', borderRadius: 10, borderWidth: 1, borderColor: '#FFCC00' }}>
            <Text style={{ fontSize: 11, color: themeColors.text, fontWeight: 'bold' }}>
              Direct Pay to Seller UPI:
            </Text>
            <Text style={{ fontSize: 15, color: '#FFCC00', fontWeight: 'bold', marginTop: 4 }}>
              {kitchen?.upiId ? `${kitchen.upiId}` : (kitchen?.upiNumber ? `${kitchen.upiNumber}@paytm` : 'sdev70817@paytm')}
            </Text>
            <Text style={{ fontSize: 9, color: themeColors.textSecondary, marginTop: 4, lineHeight: 12 }}>
              Please copy this UPI ID to make payment using Paytm, PhonePe, or Google Pay. Cash on Delivery is disabled.
            </Text>
          </View>
        </View>

        {/* Summary pricing */}
        <View style={[styles.section, { marginBottom: 40, backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Bill Details</Text>
          
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: themeColors.textSecondary }]}>Item Subtotal</Text>
            <Text style={[styles.billValue, { color: themeColors.text }]}>₹{totals.subtotal}</Text>
          </View>
          
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: themeColors.textSecondary }]}>Delivery Charges</Text>
            <Text style={[styles.billValue, { color: themeColors.text }]}>₹{totals.deliveryCharge}</Text>
          </View>
          
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: themeColors.textSecondary }]}>Taxes & GST (15%)</Text>
            <Text style={[styles.billValue, { color: themeColors.text }]}>₹{totals.tax}</Text>
          </View>

          {totals.discount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: '#2ecc71' }]}>Coupon Discount</Text>
              <Text style={[styles.billValue, { color: '#2ecc71' }]}>-₹{totals.discount}</Text>
            </View>
          )}

          <View style={[styles.billRow, styles.billRowTotal, { borderTopColor: themeColors.border }]}>
            <Text style={[styles.billLabelTotal, { color: themeColors.text }]}>To Pay</Text>
            <Text style={styles.billValueTotal}>₹{totals.total}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer trigger */}
      <View style={[styles.footerBar, { borderTopColor: themeColors.border, backgroundColor: themeColors.card }]}>
        <View>
          <Text style={[styles.footerPrice, { color: themeColors.text }]}>₹{totals.total}</Text>
          <Text style={[styles.footerLabel, { color: themeColors.textSecondary }]}>Grand Total</Text>
        </View>
        <TouchableOpacity style={styles.payButton} onPress={handleCheckout}>
          <Text style={styles.payButtonText}>Pay Now</Text>
          <ChevronRight size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  shopButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
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
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 12,
    marginTop: 4,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 4,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    marginBottom: 12,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponApplyBtn: {
    backgroundColor: '#FF5252',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  couponApplyBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  couponSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46,204,113,0.1)',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  couponSuccessText: {
    fontSize: 11,
    color: '#2ecc71',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 13,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  billRowTotal: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  billLabelTotal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  billValueTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5252',
  },
  footerBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5252',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  payButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 4,
  },
  addressContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,82,82,0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.2)',
  },
  gpsButtonText: {
    fontSize: 12,
    color: '#FF5252',
    fontWeight: 'bold',
  }
});
