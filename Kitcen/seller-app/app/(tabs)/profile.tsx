import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput,
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
  Clock,
  MapPin,
  Gift,
  Tag,
  Edit,
  Camera,
  Phone,
  User
} from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useKitchenStore } from '../../store/useKitchenStore';
import { API_BASE_URL } from '../../store/apiConfig';

export default function SellerProfile() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const token = useAuthStore(state => state.token);
  const refreshToken = useAuthStore(state => state.refreshToken);
  const setAuth = useAuthStore(state => state.setAuth);

  const kitchens = useKitchenStore(state => state.kitchens);
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);
  const myKitchen = kitchens.find(k => k.owner === user?.id) || kitchens[0];

  const [kitchenOnline, setKitchenOnline] = useState(true);
  const [firstName, setFirstName] = useState(user?.firstName || user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState(user?.gender || 'Female');
  const [shopName, setShopName] = useState(myKitchen?.name || '');
  const [logoUrl, setLogoUrl] = useState(myKitchen?.logoUrl || '');
  const [coverImageUrl, setCoverImageUrl] = useState(myKitchen?.coverImageUrl || '');
  const [bankName, setBankName] = useState(myKitchen?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(myKitchen?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(myKitchen?.ifscCode || '');

  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    logout();
    Alert.alert('Session Terminated', 'Logged out successfully!', [
      { text: 'OK', onPress: () => router.replace('/login') }
    ]);
  };

  const handleAction = (title: string) => {
    Alert.alert(title, `This feature is simulated. Action triggered!`);
  };

  const handleUpdateProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First Name and Last Name are required');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Update user profile
      const res = await fetch(`${API_BASE_URL}/api/auth/profile/${user.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`,
          phone: phone.trim(),
          gender: gender.trim(),
          avatar: user.avatar,
          role: user.role
        })
      });

      const json = await res.json();

      // 2. Update kitchen details if kitchen exists
      if (myKitchen?.id) {
        await fetch(`${API_BASE_URL}/api/kitchens/${myKitchen.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: shopName.trim(),
            type: myKitchen.type,
            cuisines: myKitchen.cuisines,
            time: myKitchen.time,
            distance: myKitchen.distance,
            offer: myKitchen.offer,
            image: myKitchen.image,
            logoUrl: logoUrl.trim(),
            coverImageUrl: coverImageUrl.trim(),
            bankName: bankName.trim(),
            accountNumber: accountNumber.trim(),
            ifscCode: ifscCode.trim(),
            isApproved: myKitchen.isApproved
          })
        });
        await fetchKitchens();
      }

      setIsLoading(false);

      if (json.success) {
        setAuth(token, refreshToken, json.data);
        Alert.alert('Success', 'Profile and Kitchen details updated successfully!');
      } else {
        Alert.alert('Error', json.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.warn('Profile update failed:', err);
      setIsLoading(false);
      Alert.alert('Offline Mode', 'Could not sync update with server.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile info */}
      <View style={styles.profileHeader}>
        <Image 
          source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=150&auto=format&fit=crop&q=80' }} 
          style={styles.avatar} 
        />
        <View style={styles.meta}>
          <Text style={styles.name}>{user?.name || 'Chef Partner'}</Text>
          <Text style={styles.email}>{user?.email || 'partner@cludekitchen.com'}</Text>
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

      {/* Edit Profile Details */}
      <View style={styles.optionGroup}>
        <Text style={styles.groupHeader}>Edit Profile Details</Text>
        
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={styles.textInput}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First Name"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Last Name</Text>
          <TextInput
            style={styles.textInput}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last Name"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.textInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. +91 9999999999"
            placeholderTextColor="#888"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Gender</Text>
          <TextInput
            style={styles.textInput}
            value={gender}
            onChangeText={setGender}
            placeholder="e.g. Female, Male, Other"
            placeholderTextColor="#888"
          />
        </View>
      </View>

      {/* Edit Kitchen Info */}
      <View style={styles.optionGroup}>
        <Text style={styles.groupHeader}>Kitchen Profile Settings</Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Kitchen Shop Name</Text>
          <TextInput
            style={styles.textInput}
            value={shopName}
            onChangeText={setShopName}
            placeholder="e.g. Grandma's Spices"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Shop Logo Image URL</Text>
          <TextInput
            style={styles.textInput}
            value={logoUrl}
            onChangeText={setLogoUrl}
            placeholder="https://example.com/logo.png"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Cover Banner Image URL</Text>
          <TextInput
            style={styles.textInput}
            value={coverImageUrl}
            onChangeText={setCoverImageUrl}
            placeholder="https://example.com/cover.png"
            placeholderTextColor="#888"
          />
        </View>
      </View>

      {/* Edit Bank Payout Details */}
      <View style={styles.optionGroup}>
        <Text style={styles.groupHeader}>Bank Account & Payout Details (SuperAdmin Visible)</Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Bank Name</Text>
          <TextInput
            style={styles.textInput}
            value={bankName}
            onChangeText={setBankName}
            placeholder="e.g. State Bank of India"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Account Number</Text>
          <TextInput
            style={styles.textInput}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="e.g. 30948576291"
            placeholderTextColor="#888"
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>IFSC Code</Text>
          <TextInput
            style={styles.textInput}
            value={ifscCode}
            onChangeText={setIfscCode}
            placeholder="e.g. SBIN0001234"
            placeholderTextColor="#888"
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile} disabled={isLoading}>
          <Text style={styles.saveBtnText}>{isLoading ? 'Saving...' : 'Save All Details'}</Text>
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
  },
  inputWrapper: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#121212',
    color: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
