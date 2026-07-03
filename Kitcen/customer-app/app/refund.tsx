import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';

export default function RefundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Gold Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Return & Refund</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* White rounded body card */}
      <View style={styles.bodyCard}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.iconWrapper}>
            <RefreshCw size={36} color="#FFB300" />
          </View>
          
          <Text style={styles.sectionTitle}>1. Order Cancellation Policy</Text>
          <Text style={styles.bodyText}>
            You may request order cancellation prior to the kitchen accepting your request. Once the food preparation starts, cancellations cannot be processed, and refunds will not be issued.
          </Text>

          <Text style={styles.sectionTitle}>2. 100% Refund Conditions</Text>
          <Text style={styles.bodyText}>
            Full refunds are issued under the following circumstances:
            {"\n\n"}
            • Food delivered is completely incorrect compared to the ordered menu.
            {"\n"}
            • Order is cancelled by the Kitchen Partner due to stock outages.
            {"\n"}
            • Food packages are damaged, split, or spilled significantly upon delivery.
          </Text>

          <Text style={styles.sectionTitle}>3. Processing Window</Text>
          <Text style={styles.bodyText}>
            Approved refunds are credited directly back to the original payment source (UPI, Credit/Debit card, or Clude Wallet) within 3 to 5 business days, subject to your banking partner's protocols.
          </Text>

          <Text style={styles.sectionTitle}>4. Dispute Resolution</Text>
          <Text style={styles.bodyText}>
            To escalate disputes regarding meal freshness or incorrect preparation, please submit details along with package images via the Support Center chat interface within 2 hours of delivery.
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFCC00', // Gold/yellow theme header background
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
  },
  bodyCard: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  iconWrapper: {
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFEFEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 18,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 20,
    textAlign: 'justify',
  },
});
