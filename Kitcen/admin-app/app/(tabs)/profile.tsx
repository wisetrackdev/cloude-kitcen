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
  Users, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Clock,
  Sun,
  Moon,
  Image as ImageIcon,
  Plus,
  Trash2
} from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL } from '../../store/apiConfig';

export default function AdminProfile() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const token = useAuthStore(state => state.token);
  const refreshToken = useAuthStore(state => state.refreshToken);
  const setAuth = useAuthStore(state => state.setAuth);

  // Theme states
  const isDarkMode = useAuthStore(state => state.isDarkMode);
  const setTheme = useAuthStore(state => state.setTheme);

  const [firstName, setFirstName] = useState(user?.firstName || user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '');
  const [isLoading, setIsLoading] = useState(false);

  // Banners state
  const [banners, setBanners] = useState<any[]>([]);
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerLinkUrl, setBannerLinkUrl] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const themeColors = {
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    inputBg: isDarkMode ? '#0F0F0F' : '#F0F2F4'
  };

  useEffect(() => {
    fetchActiveBanners();
  }, []);

  const fetchActiveBanners = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/banners`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setBanners(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load dynamic banners:', err);
    }
  };

  const handleUploadBanner = async () => {
    if (!bannerImageUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid banner image URL');
      return;
    }
    
    setIsUploadingBanner(true);
    try {
      const adminId = user?.id || 'usr-admin-simulated';
      const res = await fetch(`${API_BASE_URL}/api/admin/banners?adminUserId=${adminId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: bannerImageUrl.trim(),
          linkUrl: bannerLinkUrl.trim() || 'default_promo',
          isActive: true
        })
      });
      const json = await res.json();
      setIsUploadingBanner(false);

      if (json.success) {
        Alert.alert('Success', 'Dynamic Banner uploaded successfully!');
        setBannerImageUrl('');
        setBannerLinkUrl('');
        fetchActiveBanners();
      } else {
        Alert.alert('Error', json.message || 'Failed to upload banner');
      }
    } catch (err) {
      setIsUploadingBanner(false);
      Alert.alert('Offline Seeding', 'Dynamic banner saved locally for testing.');
      const newMock = {
        id: 'mock-' + Math.random().toString(36).substring(2, 6),
        imageUrl: bannerImageUrl.trim(),
        linkUrl: bannerLinkUrl.trim()
      };
      setBanners([newMock, ...banners]);
      setBannerImageUrl('');
      setBannerLinkUrl('');
    }
  };

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
          avatar: user.avatar,
          role: user.role
        })
      });

      const json = await res.json();
      setIsLoading(false);

      if (json.success) {
        setAuth(token, refreshToken, json.data);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', json.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.warn('Profile update failed:', err);
      setIsLoading(false);
      Alert.alert('Offline Mode', 'Profile settings updated locally.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} showsVerticalScrollIndicator={false}>
      
      {/* Profile info */}
      <View style={[styles.profileHeader, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
        <Image 
          source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80' }} 
          style={styles.avatar} 
        />
        <View style={styles.meta}>
          <Text style={[styles.name, { color: themeColors.text }]}>{user?.name || 'Super Admin'}</Text>
          <Text style={[styles.email, { color: themeColors.textSecondary }]}>{user?.email || 'admin@cludekitchen.com'}</Text>
          <Text style={styles.roleTag}>Master Controller</Text>
        </View>
      </View>

      {/* Dynamic Promotion Banners Panel */}
      <View style={[styles.optionGroup, { backgroundColor: themeColors.card, borderColor: themeColors.border, padding: 16, borderRadius: 18, marginTop: 16 }]}>
        <Text style={[styles.groupHeader, { color: themeColors.text }]}>Dynamic Live Banner Manager</Text>
        <Text style={{ color: themeColors.textSecondary, fontSize: 10, marginBottom: 12 }}>
          Publish promotional sliders/banners directly onto the customer home screen.
        </Text>

        <TextInput
          style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Enter Banner Image URL..."
          placeholderTextColor="#888"
          value={bannerImageUrl}
          onChangeText={setBannerImageUrl}
        />

        <TextInput
          style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Enter Action link (e.g. discount_page)..."
          placeholderTextColor="#888"
          value={bannerLinkUrl}
          onChangeText={setBannerLinkUrl}
        />

        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: theme.colors.success }]} 
          onPress={handleUploadBanner}
          disabled={isUploadingBanner}
        >
          {isUploadingBanner ? <ActivityIndicator size="small" color="#FFF" /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Plus size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Publish Live Banner</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* List of active uploaded banners */}
        {banners.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: themeColors.text, marginBottom: 8 }}>Active Banners ({banners.length})</Text>
            {banners.map((b) => (
              <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, padding: 6, borderWidth: 1, borderColor: themeColors.border, borderRadius: 10 }}>
                <Image source={{ uri: b.imageUrl }} style={{ width: 40, height: 40, borderRadius: 6 }} />
                <Text style={{ color: themeColors.text, marginLeft: 8, flex: 1, fontSize: 11 }} numberOfLines={1}>{b.linkUrl}</Text>
                <TouchableOpacity onPress={() => Alert.alert('Delete', 'Banner deletion is simulated.')}>
                  <Trash2 size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Edit Profile Details */}
      <View style={[styles.optionGroup, { backgroundColor: themeColors.card, borderColor: themeColors.border, padding: 16, borderRadius: 18, marginTop: 16 }]}>
        <Text style={[styles.groupHeader, { color: themeColors.text }]}>Edit Profile Details</Text>
        
        <View style={styles.inputWrapper}>
          <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>First Name</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First Name"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Last Name</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last Name"
            placeholderTextColor="#888"
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile} disabled={isLoading}>
          <Text style={styles.saveBtnText}>{isLoading ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>

      {/* Theme Settings switcher & Management */}
      <View style={[styles.optionGroup, { backgroundColor: themeColors.card, borderColor: themeColors.border, padding: 16, borderRadius: 18, marginTop: 16 }]}>
        <Text style={[styles.groupHeader, { color: themeColors.text }]}>System Management & Theme</Text>

        {/* Theme switch button */}
        <TouchableOpacity 
          style={[styles.themeToggleBtn, { borderColor: themeColors.border, marginBottom: 12 }]}
          onPress={() => setTheme(!isDarkMode)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isDarkMode ? <Sun size={18} color="#FFCC00" style={{ marginRight: 8 }} /> : <Moon size={18} color="#000" style={{ marginRight: 8 }} />}
            <Text style={{ color: themeColors.text, fontWeight: 'bold', fontSize: 13 }}>
              {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Commission Rates')}>
          <View style={styles.optionLeft}>
            <Settings size={16} color={themeColors.textSecondary} />
            <Text style={[styles.optionLabel, { color: themeColors.text }]}>Set Platform Commission (15%)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Commission Records')}>
          <View style={styles.optionLeft}>
            <Clock size={16} color={themeColors.textSecondary} />
            <Text style={[styles.optionLabel, { color: themeColors.text }]}>Monthly Payout Approvals</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Rider Management')}>
          <View style={styles.optionLeft}>
            <Users size={16} color={themeColors.textSecondary} />
            <Text style={[styles.optionLabel, { color: themeColors.text }]}>Verify Delivery Riders</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => handleAction('Security Audit')}>
          <View style={styles.optionLeft}>
            <ShieldCheck size={16} color={themeColors.textSecondary} />
            <Text style={[styles.optionLabel, { color: themeColors.text }]}>Platform System Security Audit</Text>
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
    paddingTop: 50,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
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
  },
  email: {
    fontSize: 12,
    marginTop: 2,
  },
  roleTag: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#E23744',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  optionGroup: {
    marginHorizontal: 16,
    borderWidth: 1,
  },
  groupHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 13,
    marginLeft: 12,
  },
  themeToggleBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: 'rgba(255,59,48,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.1)',
    borderRadius: 16,
    paddingVertical: 16,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginLeft: 8,
  },
  inputWrapper: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  textInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  saveBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
