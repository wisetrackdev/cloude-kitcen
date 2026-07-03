import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText } from 'lucide-react-native';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Gold Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* White rounded body card */}
      <View style={styles.bodyCard}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.iconWrapper}>
            <FileText size={36} color="#FF6B00" />
          </View>
          
          <Text style={styles.sectionTitle}>1. Platform Utilization</Text>
          <Text style={styles.bodyText}>
            Welcome to Clude Kitchen. By using our application, you agree to comply with our platform terms. Clude Kitchen connects independent home chefs, housewives, and local commercial kitchens with food delivery subscribers.
          </Text>

          <Text style={styles.sectionTitle}>2. Hygiene and Food Safety</Text>
          <Text style={styles.bodyText}>
            All seller kitchens on our platform are required to adhere to local food hygiene regulations and maintain active certifications. Home-cooked tiffins are prepared under standard cleanliness protocols.
          </Text>

          <Text style={styles.sectionTitle}>3. Tiffin Subscriptions</Text>
          <Text style={styles.bodyText}>
            Tiffin package deliveries are scheduled according to the subscription plans chosen. Sellers prepare meals daily, and delivery partners transport the packages during the allocated windows (Breakfast, Lunch, or Dinner).
          </Text>

          <Text style={styles.sectionTitle}>4. User Code of Conduct</Text>
          <Text style={styles.bodyText}>
            Customers must provide accurate address details and cooperate with delivery riders to ensure successful drop-offs. Inaccurate location pins may result in delivery delays.
          </Text>

          <Text style={styles.sectionTitle}>5. Modifications to Services</Text>
          <Text style={styles.bodyText}>
            Clude Kitchen reserves the right to modify prices, delivery areas, and kitchen availability to optimize service quality across Noida and surrounding regions.
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
