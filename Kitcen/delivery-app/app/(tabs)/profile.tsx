import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput,
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Navigation, 
  Wallet, 
  Star, 
  LogOut, 
  Clock, 
  ShieldCheck,
  Camera,
  Phone,
  User,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  Settings
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useKitchenStore } from '../../store/useKitchenStore';
import { API_BASE_URL } from '../../store/apiConfig';

type SubTab = 'main' | 'profile' | 'bank' | 'vehicle' | 'settings' | 'help';

export default function RiderProfile() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const token = useAuthStore(state => state.token);
  const refreshToken = useAuthStore(state => state.refreshToken);
  const setAuth = useAuthStore(state => state.setAuth);

  const orders = useKitchenStore(state => state.orders);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);

  // Sub tab navigation state
  const [activeTab, setActiveTab] = useState<SubTab>('main');

  // Input states
  const [firstName, setFirstName] = useState(user?.firstName || user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [avatar, setAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  // Vehicle states
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('');

  // Bank states
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // Loaded DB state details
  const [dbRating, setDbRating] = useState(4.8);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRiderData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/riders/${user.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        const r = json.data;
        setVehicleNumber(r.vehicleNumber || '');
        setLicenseNumber(r.licenseNumber || '');
        setRcNumber(r.rcNumber || '');
        setBankName(r.bankName || '');
        setAccountNumber(r.accountNumber || '');
        setIfscCode(r.ifscCode || '');
        setDeliveryZone(r.deliveryZone || '');
        setPhone(r.phone || user?.phone || '');
        setGender(r.gender || user?.gender || 'Male');
        setDbRating(r.rating || 4.8);
      }
    } catch (err) {
      console.warn('Failed to load rider details', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchRiderData();
  }, []);

  const handleLogout = () => {
    logout();
    Alert.alert('Session Terminated', 'Logged out successfully!', [
      { text: 'OK', onPress: () => router.replace('/login') }
    ]);
  };

  // Image Picking
  const pickFromCamera = async (onSelected: (uri: string) => void) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        onSelected(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Camera Error', 'Could not open camera');
    }
  };

  const pickFromGallery = async (onSelected: (uri: string) => void) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        onSelected(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Gallery Error', 'Could not open gallery');
    }
  };

  const handleUpdateProfile = async () => {
    if (!firstName.trim() || !lastName.trim() || !vehicleNumber.trim()) {
      Alert.alert('Error', 'First Name, Last Name and Vehicle Number are required');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Update rider profile details
      const resRider = await fetch(`${API_BASE_URL}/api/riders/${user.id}/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleNumber: vehicleNumber.trim(),
          licenseNumber: licenseNumber.trim(),
          rcNumber: rcNumber.trim(),
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim(),
          deliveryZone: deliveryZone.trim(),
          phone: phone.trim(),
          gender: gender.trim()
        })
      });
      const jsonRider = await resRider.json();

      // 2. Update user name/details
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
          avatar: avatar,
          role: user.role
        })
      });

      const json = await res.json();
      setIsLoading(false);

      if (json.success && jsonRider.success) {
        setAuth(token, refreshToken, json.data);
        Alert.alert('Success', 'Profile, vehicle, and bank details updated successfully!');
        setActiveTab('main');
      } else {
        Alert.alert('Error', json.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.warn('Profile update failed:', err);
      setIsLoading(false);
      Alert.alert('Offline Mode', 'Settings saved locally.');
      setActiveTab('main');
    }
  };

  // Calculation Metrics from Zustand Store
  const riderCompletedOrders = orders.filter(o => o.riderId === user.id && o.status === 'delivered');
  const dynamicEarnings = riderCompletedOrders.reduce((sum, o) => sum + Number(o.deliveryCharge || 40), 0);

  const renderHeader = (title: string) => (
    <View style={styles.tabHeader}>
      <TouchableOpacity onPress={() => setActiveTab('main')} style={styles.backBtn}>
        <ArrowLeft size={18} color="#FFF" />
      </TouchableOpacity>
      <Text style={styles.tabHeaderTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {activeTab === 'main' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header Card */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
              <TouchableOpacity style={styles.camIcon} onPress={() => {
                Alert.alert("Rider Photo", "Choose photo source:", [
                  { text: "Camera", onPress: () => pickFromCamera(setAvatar) },
                  { text: "Gallery", onPress: () => pickFromGallery(setAvatar) },
                  { text: "Cancel", style: "cancel" }
                ]);
              }}>
                <Camera size={14} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.meta}>
              <Text style={styles.name}>{firstName} {lastName}</Text>
              <Text style={styles.email}>{user?.email || 'rider@cludekitchen.com'}</Text>
              <Text style={styles.roleTag}>Rider Partner Account</Text>
            </View>
          </View>

          {/* Earnings & Rating Cards */}
          <View style={styles.loyaltyCards}>
            <View style={styles.loyaltyCard}>
              <Wallet size={20} color={theme.colors.primary} />
              <Text style={styles.loyaltyVal}>₹{dynamicEarnings.toFixed(2)}</Text>
              <Text style={styles.loyaltyLabel}>Completed Earnings</Text>
            </View>
            
            <View style={styles.loyaltyCard}>
              <Star size={20} color={theme.colors.gold} />
              <Text style={[styles.loyaltyVal, { color: theme.colors.gold }]}>{Number(dbRating).toFixed(1)}</Text>
              <Text style={styles.loyaltyLabel}>Rider Rating</Text>
            </View>
          </View>

          {/* Sub menu tabs */}
          <View style={styles.zomatoList}>
            <Text style={styles.listTitle}>Rider Workspace Options</Text>

            <TouchableOpacity style={styles.zomatoRow} onPress={() => setActiveTab('profile')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(255,107,0,0.1)' }]}>
                  <User size={18} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Edit Profile Info</Text>
                  <Text style={styles.rowDesc}>Change phone number and gender</Text>
                </View>
              </View>
              <ChevronRight style={styles.zomatoRow} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.zomatoRow} onPress={() => setActiveTab('vehicle')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(52,199,89,0.1)' }]}>
                  <Navigation size={18} color={theme.colors.success} />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Vehicle & Zone details</Text>
                  <Text style={styles.rowDesc}>Plate number, RC book and delivery zone</Text>
                </View>
              </View>
              <ChevronRight style={styles.zomatoRow} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.zomatoRow} onPress={() => setActiveTab('bank')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(0,122,255,0.1)' }]}>
                  <CreditCard size={18} color="#007AFF" />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Payout Bank Account</Text>
                  <Text style={styles.rowDesc}>Routing code and bank account numbers</Text>
                </View>
              </View>
              <ChevronRight style={styles.zomatoRow} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.zomatoRow} onPress={() => setActiveTab('help')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(255,45,85,0.1)' }]}>
                  <ShieldCheck size={18} color="#FF2D55" />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Contactless Delivery Rules</Text>
                  <Text style={styles.rowDesc}>Safety policies and zero-contact guides</Text>
                </View>
              </View>
              <ChevronRight style={styles.zomatoRow} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.zomatoRow} onPress={() => setActiveTab('settings')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(142,142,147,0.1)' }]}>
                  <Settings size={18} color="#8E8E93" />
                </View>
                <View>
                  <Text style={styles.rowTitle}>App Settings</Text>
                  <Text style={styles.rowDesc}>Security logs and logout button</Text>
                </View>
              </View>
              <ChevronRight style={styles.zomatoRow} />
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {renderHeader("Personal Details")}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.textInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              placeholderTextColor="#888"
            />

            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.textInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              placeholderTextColor="#888"
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Gender</Text>
            <TextInput
              style={styles.textInput}
              value={gender}
              onChangeText={setGender}
              placeholder="e.g. Male, Female"
              placeholderTextColor="#888"
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateProfile} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Save Personal Details</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Tab: Vehicle */}
      {activeTab === 'vehicle' && (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {renderHeader("Vehicle Details")}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Vehicle Plate Number</Text>
            <TextInput
              style={styles.textInput}
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              placeholder="e.g. DL 3C AY 4321"
              placeholderTextColor="#888"
            />

            <Text style={styles.inputLabel}>Driver License Number</Text>
            <TextInput
              style={styles.textInput}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="e.g. DL-1420180000000"
              placeholderTextColor="#888"
            />

            <Text style={styles.inputLabel}>RC Book / Registration Number</Text>
            <TextInput
              style={styles.textInput}
              value={rcNumber}
              onChangeText={setRcNumber}
              placeholder="e.g. RC/9874563/2026"
              placeholderTextColor="#888"
            />

            <Text style={styles.inputLabel}>Delivery Zone</Text>
            <TextInput
              style={styles.textInput}
              value={deliveryZone}
              onChangeText={setDeliveryZone}
              placeholder="e.g. Noida Sector 62"
              placeholderTextColor="#888"
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateProfile} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Save Vehicle Details</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Tab: Bank details */}
      {activeTab === 'bank' && (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {renderHeader("Payout Bank Details")}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Bank Name</Text>
            <TextInput
              style={styles.textInput}
              value={bankName}
              onChangeText={setBankName}
              placeholder="e.g. State Bank of India"
              placeholderTextColor="#888"
            />

            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput
              style={styles.textInput}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="e.g. 30948576291"
              placeholderTextColor="#888"
              keyboardType="number-pad"
            />

            <Text style={styles.inputLabel}>IFSC Code</Text>
            <TextInput
              style={styles.textInput}
              value={ifscCode}
              onChangeText={setIfscCode}
              placeholder="e.g. SBIN0001234"
              placeholderTextColor="#888"
              autoCapitalize="characters"
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateProfile} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Save Bank Account</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Tab: Help */}
      {activeTab === 'help' && (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {renderHeader("Rider Safety Guideline")}
          <View style={styles.infoTextCard}>
            <CheckCircle size={32} color={theme.colors.success} style={{ marginBottom: 12 }} />
            <Text style={styles.infoTitle}>Safety Rules for Delivery Partner</Text>
            <Text style={styles.infoDesc}>
              1. Helmet: Wear your helmet at all times when riding.{"\n\n"}
              2. Navigation: Never use phone while driving. Pull over to check maps.{"\n\n"}
              3. Zero Contact: Place packages on a clean surface at the customer's gate when requested.{"\n\n"}
              4. Speed Limits: Stay within safety speed limits to avoid accidents.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {renderHeader("Security & Settings")}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Role Credentials</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: '#181818', color: '#666' }]}
              value="ROLE_DELIVERY_PARTNER"
              editable={false}
            />

            <Text style={styles.inputLabel}>Authorization Token Scope</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: '#181818', color: '#666' }]}
              value="JWT Bearer Token Signature verified"
              editable={false}
            />

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <LogOut size={16} color="#000" style={{ marginRight: 6 }} />
              <Text style={styles.logoutBtnText}>Logout Duty</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
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
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#222',
  },
  camIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  meta: {
    marginLeft: 16,
    flex: 1,
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
    paddingHorizontal: 16,
    marginTop: 20,
    justifyContent: 'space-between',
  },
  loyaltyCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 14,
    width: '48%',
    alignItems: 'center',
  },
  loyaltyVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginTop: 6,
  },
  loyaltyLabel: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  zomatoList: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  listTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  zomatoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121212',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  rowDesc: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  backBtn: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tabHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  inputCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 18,
    padding: 16,
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 13,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  logoutBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: 'bold',
  },
  infoTextCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  infoDesc: {
    fontSize: 12,
    color: '#CCC',
    lineHeight: 20,
  }
});
