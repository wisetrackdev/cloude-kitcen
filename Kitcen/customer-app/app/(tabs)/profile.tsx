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
  User, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Clock,
  Phone,
  CreditCard,
  ArrowLeft,
  Image as ImageIcon,
  CheckCircle,
  ChevronRight,
  Sun,
  Moon,
  Plus,
  Camera,
  FileText,
  RefreshCw
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useKitchenStore } from '../../store/useKitchenStore';
import { API_BASE_URL } from '../../store/apiConfig';
import { uploadImageToServer } from '../../store/uploadHelper';

type SubTab = 'main' | 'profile' | 'bank' | 'settings' | 'help';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const token = useAuthStore(state => state.token);
  const refreshToken = useAuthStore(state => state.refreshToken);
  const setAuth = useAuthStore(state => state.setAuth);

  // Theme states
  const isDarkMode = useAuthStore(state => state.isDarkMode);
  const setTheme = useAuthStore(state => state.setTheme);

  const [activeTab, setActiveTab] = useState<SubTab>('main');

  const [firstName, setFirstName] = useState(user?.firstName || user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [avatar, setAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&w=150&q=80');

  const [isLoading, setIsLoading] = useState(false);

  const themeColors = {
    background: '#FFCC00', // Gold-yellow top header background
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    inputBg: isDarkMode ? '#0F0F0F' : '#F0F2F4'
  };

  const handleUpdateProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First Name and Last Name are required');
      return;
    }

    setIsLoading(true);
    try {
      // If local photo is updated (starts with file:), upload it to server
      let finalAvatarUrl = avatar;
      if (avatar.startsWith('file://') || avatar.startsWith('content://')) {
        try {
          finalAvatarUrl = await uploadImageToServer(avatar);
        } catch (uploadErr: any) {
          console.warn('Avatar upload failed, using local URI:', uploadErr.message);
        }
      }

      const res = await fetch(`${API_BASE_URL}/api/auth/complete-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`,
          phone: phone.trim(),
          gender: gender.trim(),
          avatar: finalAvatarUrl,
          role: user?.role
        })
      });

      const json = await res.json();
      setIsLoading(false);

      if (json.success) {
        setAuth(token || '', refreshToken || '', json.data);
        Alert.alert('Success', 'Profile updated successfully!');
        setActiveTab('main');
      } else {
        Alert.alert('Error', json.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.warn('Profile update failed:', err);
      setIsLoading(false);
      
      // Local fallback
      setAuth(token || '', refreshToken || '', {
        id: user?.id || 'usr-9281',
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: user?.email || 'dev.kumar@gmail.com',
        phone: phone.trim(),
        avatar: avatar,
        role: user?.role || 'customer',
        rewardPoints: user?.rewardPoints || 10,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: gender.trim()
      });
      Alert.alert('Offline Mode', 'Profile settings updated locally.');
      setActiveTab('main');
    }
  };

  const handleLogout = () => {
    logout();
    Alert.alert('Session Terminated', 'Logged out successfully!', [
      { text: 'OK', onPress: () => router.replace('/login') }
    ]);
  };

  // Photo Picking
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
      
      {/* Gold Top Header block */}
      {activeTab === 'main' ? (
        <View style={styles.profileMainHeader}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <TouchableOpacity style={styles.camIcon} onPress={() => {
              Alert.alert("Profile Picture", "Choose image source:", [
                { text: "Camera", onPress: () => pickFromCamera(setAvatar) },
                { text: "Gallery", onPress: () => pickFromGallery(setAvatar) },
                { text: "Cancel", style: "cancel" }
              ]);
            }}>
              <Camera size={12} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.meta}>
            <Text style={styles.name}>{firstName || 'Dev'} {lastName || 'Kumar'}</Text>
            <Text style={styles.email}>{user?.email || 'customer@cludekitchen.com'}</Text>
            <Text style={styles.roleTag}>Customer Account</Text>
          </View>
        </View>
      ) : (
        <View style={styles.profileSubHeader}>
          {renderHeader(
            activeTab === 'profile' ? 'Edit Profile' : 
            activeTab === 'settings' ? 'Settings' : 
            'Help & Support'
          )}
        </View>
      )}

      {/* White rounded body card */}
      <View style={styles.bodyCard}>
        {activeTab === 'main' && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }}>
            {/* Loyalty points card */}
            <View style={styles.loyaltyCards}>
              <View style={styles.loyaltyCard}>
                <ShieldCheck size={20} color="#2ecc71" />
                <Text style={styles.loyaltyVal}>₹{user?.rewardPoints || 0}</Text>
                <Text style={styles.loyaltyLabel}>Wallet Cash</Text>
              </View>
              <View style={styles.loyaltyCard}>
                <Clock size={20} color="#FF6B00" />
                <Text style={styles.loyaltyVal}>{user?.rewardPoints ? user.rewardPoints * 10 : 120}</Text>
                <Text style={styles.loyaltyLabel}>Reward Points</Text>
              </View>
            </View>

            {/* Settings Options list */}
            <View style={styles.zomatoList}>
              <Text style={[styles.listTitle, { color: themeColors.textSecondary }]}>Account Settings</Text>

              {/* Option 1: Edit Profile */}
              <TouchableOpacity style={styles.zomatoRow} onPress={() => setActiveTab('profile')}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBg, { backgroundColor: '#FFEFEB' }]}>
                    <User size={18} color="#FF6B00" />
                  </View>
                  <View>
                    <Text style={styles.rowTitle}>Edit Profile Info</Text>
                    <Text style={styles.rowDesc}>Name, phone, gender, avatar details</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#FF6B00" />
              </TouchableOpacity>

              {/* Option 2: Settings */}
              <TouchableOpacity style={styles.zomatoRow} onPress={() => setActiveTab('settings')}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBg, { backgroundColor: '#FFEFEB' }]}>
                    <Settings size={18} color="#FF6B00" />
                  </View>
                  <View>
                    <Text style={styles.rowTitle}>Theme & Security</Text>
                    <Text style={styles.rowDesc}>Biometric setup, dark mode toggle</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#FF6B00" />
              </TouchableOpacity>

              {/* Option 3: Support Center */}
              <TouchableOpacity style={styles.zomatoRow} onPress={() => setActiveTab('help')}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBg, { backgroundColor: '#FFEFEB' }]}>
                    <Phone size={18} color="#FF6B00" />
                  </View>
                  <View>
                    <Text style={styles.rowTitle}>Support Center</Text>
                    <Text style={styles.rowDesc}>Direct assistance & admin chat support</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#FF6B00" />
              </TouchableOpacity>

              {/* Option 4: Terms & Conditions */}
              <TouchableOpacity style={styles.zomatoRow} onPress={() => router.push('/terms')}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBg, { backgroundColor: '#FFEFEB' }]}>
                    <FileText size={18} color="#FF6B00" />
                  </View>
                  <View>
                    <Text style={styles.rowTitle}>Terms & Conditions</Text>
                    <Text style={styles.rowDesc}>Read platform policies and tiffin delivery rules</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#FF6B00" />
              </TouchableOpacity>

              {/* Option 5: Privacy Policy */}
              <TouchableOpacity style={styles.zomatoRow} onPress={() => router.push('/privacy')}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBg, { backgroundColor: '#FFEFEB' }]}>
                    <ShieldCheck size={18} color="#FF6B00" />
                  </View>
                  <View>
                    <Text style={styles.rowTitle}>Privacy Policy</Text>
                    <Text style={styles.rowDesc}>Learn how we protect your biometric & personal data</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#FF6B00" />
              </TouchableOpacity>

              {/* Option 6: Return & Refund */}
              <TouchableOpacity style={styles.zomatoRow} onPress={() => router.push('/refund')}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBg, { backgroundColor: '#FFEFEB' }]}>
                    <RefreshCw size={18} color="#FF6B00" />
                  </View>
                  <View>
                    <Text style={styles.rowTitle}>Return & Refund</Text>
                    <Text style={styles.rowDesc}>Read cancellation policies and refund terms</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#FF6B00" />
              </TouchableOpacity>

            </View>
          </ScrollView>
        )}

        {/* Tab: Profile form */}
        {activeTab === 'profile' && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
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
                placeholder="e.g. +91 99999 88888"
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
                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Save Profile Settings</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* Tab: Help support */}
        {activeTab === 'help' && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={styles.infoTextCard}>
              <CheckCircle size={40} color="#2ecc71" style={{ marginBottom: 15 }} />
              <Text style={styles.infoTitle}>Dedicated Support</Text>
              <Text style={styles.infoDesc}>
                For refund, order cancellations, delivery boy issues, or food quality escalations, click below to launch live messaging chat support.{"\n\n"}
                Email: support@cludekitchen.com{"\n"}
                Hotline: 1800-419-8600
              </Text>
              <TouchableOpacity 
                style={[styles.primaryBtn, { width: '100%', marginTop: 20 }]} 
                onPress={() => router.push('/chat/admin')}
              >
                <Text style={styles.primaryBtnText}>Chat with Support Representative</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* Tab: Settings */}
        {activeTab === 'settings' && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={styles.inputCard}>
              
              <Text style={styles.inputLabel}>App Interface Theme</Text>
              <TouchableOpacity 
                style={styles.themeToggleBtn}
                onPress={() => setTheme(!isDarkMode)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {isDarkMode ? <Sun size={18} color="#FFCC00" style={{ marginRight: 8 }} /> : <Moon size={18} color="#FF6B00" style={{ marginRight: 8 }} />}
                  <Text style={styles.themeToggleText}>
                    {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut size={16} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.logoutBtnText}>Logout Customer Account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFCC00', // Gold/yellow background matching mockup
  },
  profileMainHeader: {
    paddingTop: 65,
    paddingHorizontal: 20,
    paddingBottom: 35,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileSubHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 35,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: '#EEE',
  },
  camIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  meta: {
    marginLeft: 18,
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  email: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  roleTag: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#E43B3F',
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  tabHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  bodyCard: {
    flex: 1,
    backgroundColor: '#F5F5F7', // Rounded White body container card
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
  },
  loyaltyCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  loyaltyCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  loyaltyVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginTop: 8,
  },
  loyaltyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    marginTop: 4,
  },
  zomatoList: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  listTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  zomatoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  rowDesc: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  inputCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#333',
    marginBottom: 18,
  },
  primaryBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  themeToggleBtn: {
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  themeToggleText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 13,
  },
  logoutBtn: {
    backgroundColor: '#FFEFEB', // Peach style button
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: '#FF6B00', // Orange text
    fontSize: 13,
    fontWeight: 'bold',
  },
  infoTextCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoDesc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  }
});
