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
  Users, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Clock 
} from 'lucide-react-native';
import { theme } from '../../styles/theme';

export default function AdminProfile() {
  const router = useRouter();

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
          source={{ uri: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80' }} 
          style={styles.avatar} 
        />
        <View style={styles.meta}>
          <Text style={styles.name}>Super Admin</Text>
          <Text style={styles.email}>admin@cludekitchen.com</Text>
          <Text style={styles.roleTag}>Master Controller</Text>
        </View>
      </View>

      {/* Options */}
      <View style={styles.optionGroup}>
        <Text style={styles.groupHeader}>System Management</Text>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Commission Rates')}>
          <View style={styles.optionLeft}>
            <Settings size={16} color="#8E8E93" />
            <Text style={styles.optionLabel}>Set Platform Commission (e.g. 15%)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Commission Records')}>
          <View style={styles.optionLeft}>
            <Clock size={16} color="#8E8E93" />
            <Text style={styles.optionLabel}>Monthly Payout Approvals</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Rider Management')}>
          <View style={styles.optionLeft}>
            <Users size={16} color="#8E8E93" />
            <Text style={styles.optionLabel}>Verify Delivery Riders</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Security Audit')}>
          <View style={styles.optionLeft}>
            <ShieldCheck size={16} color="#8E8E93" />
            <Text style={styles.optionLabel}>Platform System Security Audit</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={16} color={theme.colors.error} />
        <Text style={styles.logoutBtnText}>Logout System</Text>
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
  optionGroup: {
    paddingHorizontal: 16,
    marginVertical: 24,
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
