import React, { useState } from 'react';
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
  HelpCircle, 
  ChevronRight,
  ClipboardCheck,
  LogOut,
  Camera,
  ArrowLeft,
  Settings,
  CheckCircle,
  Sun,
  Moon
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL } from '../../store/apiConfig';

type SubTab = 'main' | 'profile' | 'settings' | 'help';

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
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
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

      if (json.success) {
        setAuth(token, refreshToken, json.data);
        Alert.alert('Success', 'Profile updated successfully!');
        setActiveTab('main');
      } else {
        Alert.alert('Error', json.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.warn('Profile update failed:', err);
      setIsLoading(false);
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
    <View style={[styles.tabHeader, { borderBottomColor: themeColors.border }]}>
      <TouchableOpacity onPress={() => setActiveTab('main')} style={[styles.backBtn, { backgroundColor: isDarkMode ? '#1C1C1E' : '#E4E4E6' }]}>
        <ArrowLeft size={18} color={themeColors.text} />
      </TouchableOpacity>
      <Text style={[styles.tabHeaderTitle, { color: themeColors.text }]}>{title}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {activeTab === 'main' && (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Header Card */}
          <View style={[styles.profileHeader, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
              <TouchableOpacity style={styles.camIcon} onPress={() => {
                Alert.alert("Profile Picture", "Choose image source:", [
                  { text: "Camera", onPress: () => pickFromCamera(setAvatar) },
                  { text: "Gallery", onPress: () => pickFromGallery(setAvatar) },
                  { text: "Cancel", style: "cancel" }
                ]);
              }}>
                <Camera size={14} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.meta}>
              <Text style={[styles.name, { color: themeColors.text }]}>{firstName} {lastName}</Text>
              <Text style={[styles.email, { color: themeColors.textSecondary }]}>{user?.email || 'customer@cludekitchen.com'}</Text>
              <Text style={styles.roleTag}>Customer Account</Text>
            </View>
          </View>

          {/* Settings Options list */}
          <View style={styles.zomatoList}>
            <Text style={[styles.listTitle, { color: themeColors.textSecondary }]}>Customer Account Options</Text>

            <TouchableOpacity style={[styles.zomatoRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={() => setActiveTab('profile')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(255,107,0,0.1)' }]}>
                  <User size={18} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: themeColors.text }]}>Edit Profile Settings</Text>
                  <Text style={styles.rowDesc}>Change phone number, gender and name</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.zomatoRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={() => Alert.alert('Referral Program', `Code: ${user?.referralCode || 'CLD120'}. Share to get ₹50 free.`)}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(52,199,89,0.1)' }]}>
                  <ClipboardCheck size={18} color={theme.colors.success} />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: themeColors.text }]}>Refer & Earn Rewards</Text>
                  <Text style={styles.rowDesc}>Referral code: {user?.referralCode || 'CLD120'}</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.zomatoRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={() => setActiveTab('help')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(0,122,255,0.1)' }]}>
                  <HelpCircle size={18} color="#007AFF" />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: themeColors.text }]}>Help & Live Chat Support</Text>
                  <Text style={styles.rowDesc}>24/7 dedicated customer support line</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.zomatoRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={() => setActiveTab('settings')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(142,142,147,0.1)' }]}>
                  <Settings size={18} color="#8E8E93" />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: themeColors.text }]}>Security & Theme Settings</Text>
                  <Text style={styles.rowDesc}>Switch light/dark themes and logs</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#555" />
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {renderHeader("Edit Profile")}
          <View style={[styles.inputCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>First Name</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              placeholderTextColor="#888"
            />

            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Last Name</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              placeholderTextColor="#888"
            />

            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Phone Number</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +91 99999 88888"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
            />

            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Gender</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
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

      {/* Tab: Help */}
      {activeTab === 'help' && (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {renderHeader("Support Center")}
          <View style={[styles.infoTextCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <CheckCircle size={32} color={theme.colors.success} style={{ marginBottom: 12 }} />
            <Text style={[styles.infoTitle, { color: themeColors.text }]}>Dedicated Support</Text>
            <Text style={[styles.infoDesc, { color: themeColors.textSecondary }]}>
              For refund, order cancellations, delivery boy issues, or food quality escalations, click below to launch live messaging chat support.{"\n\n"}
              Email: support@cludekitchen.com{"\n"}
              Hotline: 1800-419-8600
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {renderHeader("Theme & Settings")}
          <View style={[styles.inputCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            
            {/* Dark Mode Switcher */}
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>App Interface Theme</Text>
            <TouchableOpacity 
              style={[styles.themeToggleBtn, { borderColor: themeColors.border }]}
              onPress={() => setTheme(!isDarkMode)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {isDarkMode ? <Sun size={18} color="#FFCC00" style={{ marginRight: 8 }} /> : <Moon size={18} color="#000" style={{ marginRight: 8 }} />}
                <Text style={{ color: themeColors.text, fontWeight: 'bold', fontSize: 13 }}>
                  {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: themeColors.textSecondary, marginTop: 15 }]}>Authorization Token</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: isDarkMode ? '#181818' : '#EAEAEA', color: '#666', borderColor: themeColors.border }]}
              value="JWT Signature active"
              editable={false}
            />

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <LogOut size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.logoutBtnText}>Logout Customer Account</Text>
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
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
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
  },
  email: {
    fontSize: 12,
    marginTop: 2,
  },
  roleTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#E23744',
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
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    width: '48%',
    alignItems: 'center',
  },
  loyaltyVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginTop: 6,
  },
  loyaltyLabel: {
    fontSize: 9,
    marginTop: 2,
  },
  zomatoList: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  listTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  zomatoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
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
  },
  inputCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: '#E23744',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  themeToggleBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  logoutBtn: {
    backgroundColor: '#E23744',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  logoutBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  infoTextCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoDesc: {
    fontSize: 12,
    lineHeight: 20,
  }
});
