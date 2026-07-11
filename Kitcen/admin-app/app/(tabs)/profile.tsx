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
  ActivityIndicator,
  Modal
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
  Trash2,
  Camera,
  X
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL } from '../../store/apiConfig';
import { uploadImage } from '../../store/uploadHelper';

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
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [upiNumber, setUpiNumber] = useState(user?.upiNumber || '');
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [bankName, setBankName] = useState(user?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(user?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(user?.ifscCode || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (showProfileModal && user) {
      setFirstName(user.firstName || user.name?.split(' ')[0] || '');
      setLastName(user.lastName || user.name?.split(' ').slice(1).join(' ') || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setUpiNumber(user.upiNumber || '');
      setUpiId(user.upiId || '');
      setBankName(user.bankName || '');
      setAccountNumber(user.accountNumber || '');
      setIfscCode(user.ifscCode || '');
    }
  }, [showProfileModal, user]);

  // Banners state
  const [banners, setBanners] = useState<any[]>([]);
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerLinkUrl, setBannerLinkUrl] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingBannerLocal, setIsUploadingBannerLocal] = useState(false);

  // Profile modal and avatar upload states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isUploadingProfilePic, setIsUploadingProfilePic] = useState(false);

  // Camera & picker functions for profile picture
  const requestProfileImageSource = () => {
    Alert.alert(
      'Profile Photo Source',
      'Select image upload source:',
      [
        { text: 'Camera (Take Photo)', onPress: captureProfileImage },
        { text: 'Gallery (Choose from Library)', onPress: pickProfileImageFromGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const captureProfileImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permissions are required.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUploadProfileImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  const pickProfileImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUploadProfileImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Gallery Error', 'Could not open photo library.');
    }
  };

  const handleUploadProfileImage = async (localUri: string) => {
    setIsUploadingProfilePic(true);
    const uploadedUrl = await uploadImage(localUri);
    setIsUploadingProfilePic(false);
    
    if (uploadedUrl) {
      try {
        const userId = user?.id || 'usr-admin-simulated';
        const res = await fetch(`${API_BASE_URL}/api/auth/profile/${userId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: userId,
            email: email.trim() || user?.email,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            name: `${firstName.trim()} ${lastName.trim()}`,
            avatar: uploadedUrl,
            role: user?.role || 'superadmin'
          })
        });
        const json = await res.json();
        if (json.success) {
          setAuth(token, refreshToken, json.data);
          Alert.alert('Success', 'Profile photo updated successfully!');
        } else {
          useAuthStore.getState().updateUser({ avatar: uploadedUrl });
          Alert.alert('Success', 'Profile photo updated locally.');
        }
      } catch (err) {
        useAuthStore.getState().updateUser({ avatar: uploadedUrl });
        Alert.alert('Offline Mode', 'Profile photo updated locally.');
      }
    } else {
      Alert.alert('Upload Failed', 'Could not upload profile picture to server.');
    }
  };

  // Camera & picker functions for banner
  const requestBannerImageSource = () => {
    Alert.alert(
      'Banner Image Source',
      'Select image upload source:',
      [
        { text: 'Camera (Take Photo)', onPress: captureBannerImage },
        { text: 'Gallery (Choose from Library)', onPress: pickBannerImageFromGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const captureBannerImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permissions are required.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploadingBannerLocal(true);
        const uploadedUrl = await uploadImage(result.assets[0].uri);
        setIsUploadingBannerLocal(false);
        if (uploadedUrl) {
          setBannerImageUrl(uploadedUrl);
        } else {
          setBannerImageUrl(result.assets[0].uri);
        }
      }
    } catch (e) {
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  const pickBannerImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploadingBannerLocal(true);
        const uploadedUrl = await uploadImage(result.assets[0].uri);
        setIsUploadingBannerLocal(false);
        if (uploadedUrl) {
          setBannerImageUrl(uploadedUrl);
        } else {
          setBannerImageUrl(result.assets[0].uri);
        }
      }
    } catch (e) {
      Alert.alert('Gallery Error', 'Could not open photo library.');
    }
  };

  const themeColors = {
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    inputBg: isDarkMode ? '#0F0F0F' : '#F0F2F4',
    primary: '#FFB300'
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
          email: email.trim() || user.email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`,
          avatar: user.avatar,
          role: user.role,
          phone: phone.trim(),
          upiNumber: upiNumber.trim(),
          upiId: upiId.trim(),
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim()
        })
      });

      const json = await res.json();
      setIsLoading(false);

      if (json.success) {
        setAuth(token, refreshToken, json.data);
        Alert.alert('Success', 'Profile updated successfully!');
        setShowProfileModal(false);
      } else {
        Alert.alert('Error', json.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.warn('Profile update failed:', err);
      setIsLoading(false);
      useAuthStore.getState().updateUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim() || user.email,
        phone: phone.trim(),
        upiNumber: upiNumber.trim(),
        upiId: upiId.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim()
      });
      Alert.alert('Offline Mode', 'Profile settings updated locally.');
      setShowProfileModal(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} showsVerticalScrollIndicator={false}>
      {/* Profile info */}
      <TouchableOpacity 
        style={[styles.profileHeader, { backgroundColor: '#FFCC00' }]}
        onPress={() => setShowProfileModal(true)}
      >
        <View style={{ position: 'relative' }}>
          <Image 
            source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80' }} 
            style={styles.avatar} 
          />
          <TouchableOpacity 
            style={styles.avatarCameraBadge} 
            onPress={requestProfileImageSource}
          >
            <Camera size={12} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.meta}>
          <Text style={[styles.name, { color: '#FFF' }]}>{user?.name || 'Super Admin'}</Text>
          <Text style={[styles.email, { color: 'rgba(255, 255, 255, 0.85)' }]}>{user?.email || 'admin@cludekitchen.com'}</Text>
          <Text style={[styles.roleTag, { color: '#FFF' }]}>Master Controller</Text>
        </View>
      </TouchableOpacity>



      {/* Payout & UPI Configurations */}
      <View style={[styles.optionGroup, { backgroundColor: themeColors.card, borderColor: themeColors.border, padding: 16, borderRadius: 18, marginTop: 16 }]}>
        <Text style={[styles.groupHeader, { color: themeColors.text, fontWeight: 'bold', fontSize: 14, marginBottom: 12 }]}>Payout & UPI Configuration</Text>
        
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: themeColors.border }}>
            <Text style={{ fontSize: 12, color: themeColors.textSecondary }}>UPI ID:</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: themeColors.text }}>{user?.upiId || 'Not Configured'}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: themeColors.border }}>
            <Text style={{ fontSize: 12, color: themeColors.textSecondary }}>UPI Phone:</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: themeColors.text }}>{user?.upiNumber || 'Not Configured'}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: themeColors.border }}>
            <Text style={{ fontSize: 12, color: themeColors.textSecondary }}>Bank Name:</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: themeColors.text }}>{user?.bankName || 'Not Configured'}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: themeColors.border }}>
            <Text style={{ fontSize: 12, color: themeColors.textSecondary }}>Account Number:</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: themeColors.text }}>{user?.accountNumber || 'Not Configured'}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: themeColors.textSecondary }}>IFSC Code:</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: themeColors.text }}>{user?.ifscCode || 'Not Configured'}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={{ backgroundColor: themeColors.primary, borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 14 }}
          onPress={() => setShowProfileModal(true)}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>Edit Payment Settings</Text>
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

        <TouchableOpacity 
          style={styles.optionRow} 
          onPress={() => {
            Alert.alert(
              'Reset Database',
              'Are you sure you want to TRUNCATE and RESET all database tables? All orders, products, shops, and user profiles (except Superadmin) will be deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Reset Database', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setIsLoading(true);
                      const res = await fetch(`${API_BASE_URL}/api/admin/truncate?adminUserId=${user?.id || 'usr-admin-simulated'}`, {
                        method: 'POST'
                      });
                      setIsLoading(false);
                      if (res.ok) {
                        const json = await res.json();
                        if (json.success) {
                          Alert.alert('Database Reset', 'All tables have been truncated and default categories re-seeded successfully!');
                        } else {
                          Alert.alert('Error', json.message || 'Failed to truncate database');
                        }
                      } else {
                        Alert.alert('Error', 'Failed to connect to server to reset database');
                      }
                    } catch (e: any) {
                      setIsLoading(false);
                      Alert.alert('Error', 'An error occurred: ' + e.message);
                    }
                  }
                }
              ]
            );
          }}
        >
          <View style={styles.optionLeft}>
            <Trash2 size={16} color="#FF3B30" />
            <Text style={[styles.optionLabel, { color: '#FF3B30', fontWeight: 'bold' }]}>Truncate All Tables (Reset DB)</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={16} color={theme.colors.error} />
        <Text style={styles.logoutBtnText}>Logout System</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />

      {/* EDIT PROFILE DETAILS MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showProfileModal}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Edit Superadmin Details</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)} style={[styles.closeBtn, { backgroundColor: themeColors.border }]}>
                <X size={18} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              
              {/* Photo picking section inside Modal */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <TouchableOpacity onPress={requestProfileImageSource} style={{ position: 'relative' }}>
                  <Image 
                    source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80' }} 
                    style={[styles.avatar, { width: 80, height: 80, borderRadius: 40 }]} 
                  />
                  {isUploadingProfilePic ? (
                    <ActivityIndicator size="small" color={themeColors.primary} style={{ position: 'absolute', top: 30 }} />
                  ) : (
                    <View style={[styles.avatarCameraBadge, { bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14 }]}>
                      <Camera size={14} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={{ fontSize: 11, color: themeColors.textSecondary, marginTop: 8 }}>Tap to update photo</Text>
              </View>

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

              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Email Address</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email Address"
                  placeholderTextColor="#888"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Mobile Number</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Mobile Number"
                  placeholderTextColor="#888"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>UPI Number (e.g. Paytm Number)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                  value={upiNumber}
                  onChangeText={setUpiNumber}
                  placeholder="UPI Mobile Number"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>UPI ID (e.g. name@paytm)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="UPI ID"
                  placeholderTextColor="#888"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Bank Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="e.g. State Bank of India"
                  placeholderTextColor="#888"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Bank Account Number</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="e.g. 30948576291"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>IFSC Code</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                  value={ifscCode}
                  onChangeText={setIfscCode}
                  placeholder="e.g. SBIN0001043"
                  placeholderTextColor="#888"
                  autoCapitalize="characters"
                />
              </View>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: themeColors.primary }]} onPress={handleUpdateProfile} disabled={isLoading}>
                {isLoading ? <ActivityIndicator size="small" color="#FFF" /> : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    marginTop: 4,
    textTransform: 'uppercase',
  },
  optionGroup: {
    marginTop: 16,
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
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFB300',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    height: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
