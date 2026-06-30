import React from 'react';
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
  User, 
  Wallet, 
  Gift, 
  HelpCircle, 
  FileText, 
  ChevronRight,
  ClipboardCheck,
  LogOut
} from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../store/useAuthStore';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const handleLogout = () => {
    logout();
    Alert.alert('Session Terminated', 'Logged out successfully!', [
      { text: 'OK', onPress: () => router.replace('/login') }
    ]);
  };

  const handleAction = (title: string) => {
    Alert.alert(title, `This feature is simulated. Action triggered!`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile summary info */}
      <View style={styles.profileHeader}>
        <Image 
          source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&w=150&q=80' }} 
          style={styles.avatar} 
        />
        <View style={styles.meta}>
          <Text style={styles.name}>{user?.name || 'Clude Customer'}</Text>
          <Text style={styles.email}>{user?.email || 'customer@cludekitchen.com'}</Text>
          <Text style={styles.roleTag}>Customer Account</Text>
        </View>
      </View>

      {/* Wallet / Points cards */}
      <View style={styles.loyaltyCards}>
        <View style={styles.loyaltyCard}>
          <Wallet size={20} color={theme.colors.primary} />
          <Text style={styles.loyaltyVal}>₹1,240.00</Text>
          <Text style={styles.loyaltyLabel}>Clude Balance</Text>
        </View>
        
        <View style={styles.loyaltyCard}>
          <Gift size={20} color={theme.colors.gold} />
          <Text style={[styles.loyaltyVal, { color: theme.colors.gold }]}>{user?.rewardPoints || 120} Pts</Text>
          <Text style={styles.loyaltyLabel}>Clude Rewards</Text>
        </View>
      </View>

      {/* Options Group 1 */}
      <View style={styles.optionGroup}>
        <Text style={styles.groupHeader}>Account Settings</Text>
        
        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('My Addresses')}>
          <View style={styles.optionLeft}>
            <View style={styles.iconCircle}><User size={16} color="#8E8E93" /></View>
            <Text style={styles.optionLabel}>My Addresses</Text>
          </View>
          <ChevronRight size={16} color="#444" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Payment Details')}>
          <View style={styles.optionLeft}>
            <View style={styles.iconCircle}><Wallet size={16} color="#8E8E93" /></View>
            <Text style={styles.optionLabel}>Payment Methods</Text>
          </View>
          <ChevronRight size={16} color="#444" />
        </TouchableOpacity>

        {user?.referralCode && (
          <TouchableOpacity 
            style={styles.optionRow} 
            onPress={() => Alert.alert('Referral Copied', `Referral code ${user.referralCode} copied to clipboard.`)}
          >
            <View style={styles.optionLeft}>
              <View style={styles.iconCircle}><ClipboardCheck size={16} color="#8E8E93" /></View>
              <Text style={styles.optionLabel}>Refer & Earn (Code: {user.referralCode})</Text>
            </View>
            <ChevronRight size={16} color="#444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Options Group 2 */}
      <View style={styles.optionGroup}>
        <Text style={styles.groupHeader}>Support & Info</Text>
        
        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Help Center')}>
          <View style={styles.optionLeft}>
            <View style={styles.iconCircle}><HelpCircle size={16} color="#8E8E93" /></View>
            <Text style={styles.optionLabel}>Help & Support</Text>
          </View>
          <ChevronRight size={16} color="#444" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Privacy Document')}>
          <View style={styles.optionLeft}>
            <View style={styles.iconCircle}><FileText size={16} color="#8E8E93" /></View>
            <Text style={styles.optionLabel}>Privacy Policy</Text>
          </View>
          <ChevronRight size={16} color="#444" />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={16} color={theme.colors.error} />
        <Text style={styles.logoutBtnText}>Logout Account</Text>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  email: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  roleTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  loyaltyCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 20,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#121212',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
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
