import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield } from 'lucide-react-native';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Gold Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* White rounded body card */}
      <View style={styles.bodyCard}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.iconWrapper}>
            <Shield size={36} color="#FFB300" />
          </View>
          
          <Text style={styles.sectionTitle}>1. Data We Collect</Text>
          <Text style={styles.bodyText}>
            We collect personal details such as names, phone numbers, email addresses, and delivery coordinates when you register an account. Profile pictures are uploaded securely to display user identity.
          </Text>

          <Text style={styles.sectionTitle}>2. Biometric Security Option</Text>
          <Text style={styles.bodyText}>
            If you enable fingerprint or biometric locks, this data is processed locally on your phone hardware via native device APIs. Clude Kitchen never uploads or stores your biometric markers on our databases.
          </Text>

          <Text style={styles.sectionTitle}>3. Location Services</Text>
          <Text style={styles.bodyText}>
            We cache your delivery addresses and require location access to calculate shop distances and enable delivery tracking. You may customize permission flags at any time through system settings.
          </Text>

          <Text style={styles.sectionTitle}>4. Information Sharing</Text>
          <Text style={styles.bodyText}>
            Selected profile information (First Name and Contact Number) is shared with kitchen partners and delivery riders only when executing your active tiffin or food orders.
          </Text>

          <Text style={styles.sectionTitle}>5. Contact Privacy Office</Text>
          <Text style={styles.bodyText}>
            For inquiries regarding account deletion or access requests, please contact our data safety division at privacy@cludekitchen.com.
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
