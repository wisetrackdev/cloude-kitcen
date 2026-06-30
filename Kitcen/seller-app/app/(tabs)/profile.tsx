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
  ChefHat, 
  Store, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Clock 
} from 'lucide-react-native';
import { theme } from '../../styles/theme';

export default function SellerProfile() {
  const router = useRouter();
  const [kitchenOnline, setKitchenOnline] = useState(true);

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
          source={{ uri: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=150&auto=format&fit=crop&q=80' }} 
          style={styles.avatar} 
        />
        <View style={styles.meta}>
          <Text style={styles.name}>Rupa Sharma</Text>
          <Text style={styles.email}>rupa.sharma@tiffin.com</Text>
          <Text style={styles.roleTag}>Housewife Kitchen Partner</Text>
        </View>
      </View>

      {/* Online/Offline Status Switcher */}
      <View style={styles.statusSection}>
        <Text style={styles.statusLabel}>Kitchen accepting orders:</Text>
        <TouchableOpacity 
          style={[styles.statusToggle, kitchenOnline ? styles.statusToggleOnline : styles.statusToggleOffline]}
          onPress={() => {
            setKitchenOnline(!kitchenOnline);
            Alert.alert('Status Updated', `Your kitchen is now ${!kitchenOnline ? 'ONLINE' : 'OFFLINE'}`);
          }}
        >
          <Text style={styles.statusToggleText}>
            {kitchenOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Options */}
      <View style={styles.optionGroup}>
        <Text style={styles.groupHeader}>Operational Settings</Text>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Kitchen Profile')}>
          <View style={styles.optionLeft}>
            <ChefHat size={16} color="#8E8E93" />
            <Text style={styles.optionLabel}>Edit Kitchen Information</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Payout Details')}>
          <View style={styles.optionLeft}>
            <Store size={16} color="#8E8E93" />
            <Text style={styles.optionLabel}>Bank Account & Payouts</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Timings')}>
          <View style={styles.optionLeft}>
            <Clock size={16} color="#8E8E93" />
            <Text style={styles.optionLabel}>Set Kitchen Hours</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Safety Guidelines')}>
          <View style={styles.optionLeft}>
            <ShieldCheck size={16} color="#8E8E93" />
            <Text style={styles.optionLabel}>Safety & Hygiene Certification</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={16} color={theme.colors.error} />
        <Text style={styles.logoutBtnText}>Logout Kitchen</Text>
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
