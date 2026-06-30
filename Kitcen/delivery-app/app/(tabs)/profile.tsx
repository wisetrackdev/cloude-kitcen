import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Navigation, 
  Wallet, 
  Star, 
  LogOut, 
  Clock, 
  ShieldCheck 
} from 'lucide-react-native';
import { theme } from '../../styles/theme';

export default function RiderProfile() {
  const router = useRouter();
  const [online, setOnline] = useState(true);

  const handleLogout = () => {
    Alert.alert('Session Terminated', 'Logged out successfully!', [
      { text: 'OK', onPress: () => router.replace('/login') }
    ]);
  };

  const handleAction = (title: string) => {
    Alert.alert(title, `This feature is simulated. Action triggered!`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile info */}
      <View style={styles.profileHeader}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }} 
          style={styles.avatar} 
        />
        <View style={styles.meta}>
          <Text style={styles.name}>Vikram Singh</Text>
          <Text style={styles.email}>vikram.rider@cludekitchen.com</Text>
          <Text style={styles.roleTag}>Rider ID: CL-9081</Text>
        </View>
      </View>

      {/* Online/Offline Status Switcher */}
      <View style={styles.statusSection}>
        <Text style={styles.statusLabel}>Accepting Deliveries:</Text>
        <TouchableOpacity 
          style={[styles.statusToggle, online ? styles.statusToggleOnline : styles.statusToggleOffline]}
          onPress={() => {
            setOnline(!online);
            Alert.alert('Status Updated', `Duty status set to ${!online ? 'ONLINE (DUTY ON)' : 'OFFLINE (DUTY OFF)'}`);
          }}
        >
          <Text style={styles.statusToggleText}>
            {online ? 'ON DUTY' : 'OFF DUTY'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Wallet / Points cards */}
      <View style={styles.loyaltyCards}>
        <View style={styles.loyaltyCard}>
          <Wallet size={20} color={theme.colors.primary} />
          <Text style={styles.loyaltyVal}>₹860.00</Text>
          <Text style={styles.loyaltyLabel}>Today's Earnings</Text>
        </View>
        
        <View style={styles.loyaltyCard}>
          <Star size={20} color={theme.colors.gold} />
          <Text style={[styles.loyaltyVal, { color: theme.colors.gold }]}>4.91</Text>
          <Text style={styles.loyaltyLabel}>Rider Rating</Text>
        </View>
      </View>

      {/* Options */}
      <View style={styles.optionGroup}>
        <Text style={styles.groupHeader}>Duty settings</Text>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Vehicle Details')}>
          <View style={styles.optionLeft}>
            <Navigation size={16} color="#8E8E93" />
            <Text style={styles.optionLabel}>Edit Vehicle Information</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Weekly History')}>
          <View style={styles.optionLeft}>
            <Clock size={16} color="#8E8E93" />
            <Text style={styles.optionLabel}>Weekly Payout Logs</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Rider Safety')}>
          <View style={styles.optionLeft}>
            <ShieldCheck size={16} color="#8E8E93" />
            <Text style={styles.optionLabel}>Contactless Delivery Guide</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={16} color={theme.colors.error} />
        <Text style={styles.logoutBtnText}>Logout Duty</Text>
      </TouchableOpacity>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#222',
  },
  meta: {
    marginLeft: 16,
  },
  name: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFF',
  },
  email: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  roleTag: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  statusLabel: {
    fontSize: 13,
    color: '#FFF',
  },
  statusToggle: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  statusToggleOnline: {
    backgroundColor: theme.colors.veg,
  },
  statusToggleOffline: {
    backgroundColor: theme.colors.error,
  },
  statusToggleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  loyaltyCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  loyaltyCard: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
  },
  loyaltyVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 10,
  },
  loyaltyLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  optionGroup: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  groupHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#121212',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 13,
    color: '#FFF',
    marginLeft: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: 'rgba(255,59,48,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.1)',
    borderRadius: 16,
    paddingVertical: 16,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginLeft: 8,
  }
});
