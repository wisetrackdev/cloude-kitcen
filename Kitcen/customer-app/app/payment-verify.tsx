import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  Clipboard
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ShieldCheck, Copy, Info, CheckCircle2, CreditCard } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useKitchenStore } from '../store/useKitchenStore';

export default function PaymentVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const isDarkMode = useAuthStore(state => state.isDarkMode);
  const user = useAuthStore(state => state.user);
  const clearCart = useCartStore(state => state.clearCart);
  const verifyPayment = useKitchenStore(state => state.verifyPayment);

  const [transactionId, setTransactionId] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const themeColors = {
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    inputBg: isDarkMode ? '#0F0F0F' : '#F0F2F4',
    accent: '#FF5252',
    success: '#2ecc71'
  };

  const handleCopyUpi = () => {
    const upi = (params.upiId as string) || 'sdev70817@paytm';
    Clipboard.setString(upi);
    Alert.alert('Copied', 'UPI ID copied to clipboard!');
  };

  const handleVerify = async () => {
    if (!transactionId.trim()) {
      Alert.alert('Required', 'Please enter the Transaction ID.');
      return;
    }
    if (!utrNumber.trim()) {
      Alert.alert('Required', 'Please enter the UTR Number.');
      return;
    }
    if (utrNumber.trim().length < 6) {
      Alert.alert('Invalid UTR', 'UTR number must be at least 6 digits.');
      return;
    }

    setIsVerifying(true);
    try {
      const itemsList = params.items ? JSON.parse(params.items as string) : [];
      const payload = {
        transactionId: transactionId.trim(),
        utrNumber: utrNumber.trim(),
        userId: user?.id || 'usr-9281',
        kitchenId: (params.kitchenId as string) || 'k1',
        deliveryAddress: (params.deliveryAddress as string) || '',
        totalAmount: parseFloat(params.amount as string) || 0,
        subtotal: parseFloat(params.subtotal as string) || 0,
        deliveryCharge: parseFloat(params.deliveryCharge as string) || 0,
        tax: parseFloat(params.tax as string) || 0,
        discount: parseFloat(params.discount as string) || 0,
        latitude: params.latitude ? parseFloat(params.latitude as string) : null,
        longitude: params.longitude ? parseFloat(params.longitude as string) : null,
        items: itemsList
      };

      const result = await verifyPayment(payload);

      if (result.success && result.orderId) {
        Alert.alert(
          'Payment Verified',
          'Your payment was verified and order has been confirmed!',
          [
            {
              text: 'Track Order',
              onPress: () => {
                clearCart();
                router.replace(`/tracking/${result.orderId}`);
              }
            }
          ]
        );
      } else {
        Alert.alert('Verification Failed', result.message || 'Unable to verify payment. Please check your transaction details.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred during verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border, backgroundColor: themeColors.card }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: isDarkMode ? '#121212' : '#EAEAEA' }]} onPress={() => router.back()}>
          <ArrowLeft size={20} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Verify Payment</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order Details Summary Card */}
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.summaryHeader}>
            <CreditCard size={18} color={themeColors.accent} />
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Order Summary</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]}>Kitchen:</Text>
            <Text style={[styles.summaryVal, { color: themeColors.text }]}>{params.kitchenName || 'Cloud Kitchen'}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]}>Amount to Pay:</Text>
            <Text style={[styles.summaryVal, { color: themeColors.accent, fontWeight: 'bold', fontSize: 16 }]}>₹{params.amount || '0.00'}</Text>
          </View>

          <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]}>Deliver to:</Text>
            <Text style={[styles.summaryVal, { color: themeColors.text, flex: 1, textAlign: 'right' }]} numberOfLines={2}>
              {params.deliveryAddress || 'No address provided'}
            </Text>
          </View>
        </View>

        {/* UPI Details Display */}
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.cardTitle, { color: themeColors.text, marginBottom: 8 }]}>Payment Done To</Text>
          <View style={[styles.upiBox, { backgroundColor: isDarkMode ? '#1C1C1E' : '#F2F2F7' }]}>
            <Text style={[styles.upiIdText, { color: themeColors.accent }]}>{params.upiId || 'sdev70817@paytm'}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyUpi}>
              <Copy size={16} color={themeColors.text} />
              <Text style={[styles.copyBtnText, { color: themeColors.text }]}>Copy</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Info size={12} color={themeColors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
              Enter the transaction details after completing the payment in your UPI app.
            </Text>
          </View>
        </View>

        {/* Verification Inputs Form */}
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.cardTitle, { color: themeColors.text, marginBottom: 16 }]}>Transaction Details</Text>
          
          <Text style={[styles.inputLabel, { color: themeColors.text }]}>Transaction ID / Ref No.</Text>
          <TextInput
            placeholder="e.g. 318293749201"
            placeholderTextColor="#888"
            value={transactionId}
            onChangeText={setTransactionId}
            style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
          />

          <Text style={[styles.inputLabel, { color: themeColors.text, marginTop: 12 }]}>UTR / UPI Reference Number</Text>
          <TextInput
            placeholder="12-digit UTR number"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={utrNumber}
            onChangeText={setUtrNumber}
            style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
          />

          <TouchableOpacity 
            style={[styles.verifyButton, { backgroundColor: themeColors.accent }]} 
            onPress={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <ShieldCheck size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.verifyButtonText}>Verify & Confirm Order</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Trust Badge */}
        <View style={styles.trustBadge}>
          <CheckCircle2 size={16} color={themeColors.success} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 11, color: themeColors.textSecondary }}>Secure Payment Verification System</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128,128,128,0.15)',
  },
  upiBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  upiIdText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  infoText: {
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    marginBottom: 10,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
  },
  verifyButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  }
});
