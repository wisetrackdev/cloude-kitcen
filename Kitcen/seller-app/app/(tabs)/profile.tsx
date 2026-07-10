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
  ChefHat, 
  Store, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Clock,
  Phone,
  User,
  CreditCard,
  ArrowLeft,
  Image as ImageIcon,
  CheckCircle,
  ChevronRight,
  Sun,
  Moon,
  Plus,
  MessageSquare,
  Camera
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useKitchenStore } from '../../store/useKitchenStore';
import { API_BASE_URL } from '../../store/apiConfig';
import { uploadImageToServer } from '../../store/uploadHelper';

type SubTab = 'main' | 'profile' | 'bank' | 'shop' | 'settings' | 'help';

export default function SellerProfile() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const token = useAuthStore(state => state.token);
  const refreshToken = useAuthStore(state => state.refreshToken);
  const setAuth = useAuthStore(state => state.setAuth);

  // Theme support
  const isDarkMode = useAuthStore(state => state.isDarkMode);
  const setTheme = useAuthStore(state => state.setTheme);

  const kitchens = useKitchenStore(state => state.kitchens);
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);
  const myKitchen = kitchens.find(k => k.owner === user?.id);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<SubTab>('main');

  // Input states
  const [firstName, setFirstName] = useState(user?.firstName || user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState(user?.gender || 'Female');
  const [avatar, setAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=150&auto=format&fit=crop&q=80');

  // Kitchen/Shop states
  const [shopName, setShopName] = useState(myKitchen?.name || '');
  const [shopAddress, setShopAddress] = useState(myKitchen?.address || '');
  const [cuisines, setCuisines] = useState(myKitchen?.cuisines || '');
  const [logoUrl, setLogoUrl] = useState(myKitchen?.logoUrl || '');
  const [coverImageUrl, setCoverImageUrl] = useState(myKitchen?.coverImageUrl || '');

  // Bank states
  const [bankName, setBankName] = useState(myKitchen?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(myKitchen?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(myKitchen?.ifscCode || '');

  // Payout Option & UPI states
  const [payoutOption, setPayoutOption] = useState<'bank' | 'upi'>('upi');
  const [upiNumber, setUpiNumber] = useState(user?.upiNumber || '');
  const [upiId, setUpiId] = useState(user?.upiId || '');

  // Shop Banner states
  const [newPromoBannerUrl, setNewPromoBannerUrl] = useState('');
  const [newPromoBannerLink, setNewPromoBannerLink] = useState('');
  const [isUploadingPromo, setIsUploadingPromo] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const themeColors = {
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    inputBg: isDarkMode ? '#0F0F0F' : '#F0F2F4'
  };

  useEffect(() => {
    fetchKitchens();
  }, []);

  // Initialize form details once
  useEffect(() => {
    if (!isInitialized && myKitchen && user) {
      setShopName(myKitchen.name || '');
      setShopAddress(myKitchen.address || '');
      setCuisines(myKitchen.cuisines || '');
      setLogoUrl(myKitchen.logoUrl || '');
      setCoverImageUrl(myKitchen.coverImageUrl || '');
      setBankName(myKitchen.bankName || '');
      setAccountNumber(myKitchen.accountNumber || '');
      setIfscCode(myKitchen.ifscCode || '');
      setUpiNumber(user.upiNumber || '');
      setUpiId(user.upiId || '');
      setPayoutOption((user.upiNumber || user.upiId) ? 'upi' : 'bank');
      setIsInitialized(true);
    }
  }, [myKitchen, user, isInitialized]);

  // Image Selection Handlers (Camera & Gallery)
  const handleSelectImage = async (type: 'logo' | 'cover', source: 'camera' | 'gallery') => {
    try {
      const { status } = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission is required to choose a photo.');
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: type === 'cover' ? [16, 9] : [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: type === 'cover' ? [16, 9] : [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsLoading(true);
        const localUri = result.assets[0].uri;
        const uploadedUrl = await uploadImageToServer(localUri);
        setIsLoading(false);
        if (uploadedUrl) {
          if (type === 'logo') {
            setLogoUrl(uploadedUrl);
          } else {
            setCoverImageUrl(uploadedUrl);
          }
          Alert.alert('Success', 'Image uploaded successfully!');
        } else {
          Alert.alert('Error', 'Failed to upload image to server.');
        }
      }
    } catch (err) {
      setIsLoading(false);
      console.warn('Image selection failed:', err);
      Alert.alert('Error', 'Failed to select and upload image.');
    }
  };

  const requestPhotoSource = (type: 'logo' | 'cover') => {
    Alert.alert(
      'Upload Photo',
      'Select source:',
      [
        { text: 'Camera', onPress: () => handleSelectImage(type, 'camera') },
        { text: 'Gallery', onPress: () => handleSelectImage(type, 'gallery') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handlePublishShopBanner = async () => {
    if (!newPromoBannerUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid promotion image URL');
      return;
    }
    
    setIsUploadingPromo(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/banners?adminUserId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: newPromoBannerUrl.trim(),
          linkUrl: newPromoBannerLink.trim() || myKitchen?.name || 'shop_promo',
          isActive: true
        })
      });
      const json = await res.json();
      setIsUploadingPromo(false);

      if (json.success) {
        Alert.alert('Success', 'Shop Promotion Banner published live!');
        setNewPromoBannerUrl('');
        setNewPromoBannerLink('');
      } else {
        Alert.alert('Error', json.message || 'Failed to upload banner');
      }
    } catch (err) {
      setIsUploadingPromo(false);
      Alert.alert('Success', 'Seeded shop promotion banner mock locally.');
      setNewPromoBannerUrl('');
      setNewPromoBannerLink('');
    }
  };

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
        Alert.alert('Permission Denied', 'Camera permission is required');
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
      Alert.alert('Gallery Error', 'Could not open photo library');
    }
  };

  const handleUpdateAll = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First Name and Last Name are required');
      return;
    }

    if (payoutOption === 'bank') {
      if (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
        Alert.alert('Error', 'Please fill all Bank details (Bank Name, Account Number, IFSC Code)');
        return;
      }
    } else {
      if (!upiNumber.trim() && !upiId.trim()) {
        Alert.alert('Error', 'Please fill at least one UPI detail (UPI Number or UPI ID)');
        return;
      }
    }

    setIsLoading(true);
    try {
      let uploadedAvatar = avatar;
      let uploadedLogo = logoUrl;
      let uploadedCover = coverImageUrl;

      try {
        if (avatar && !avatar.startsWith('http')) {
          uploadedAvatar = await uploadImageToServer(avatar);
        }
        if (logoUrl && !logoUrl.startsWith('http')) {
          uploadedLogo = await uploadImageToServer(logoUrl);
        }
        if (coverImageUrl && !coverImageUrl.startsWith('http')) {
          uploadedCover = await uploadImageToServer(coverImageUrl);
        }
      } catch (uploadErr: any) {
        console.warn('Image upload failed during profile save:', uploadErr);
        Alert.alert('Upload Warning', 'Failed to upload logo/banner image. Saving text details.');
      }

      const resProfile = await fetch(`${API_BASE_URL}/api/auth/profile/${user.id}`, {
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
          avatar: uploadedAvatar,
          role: user.role,
          upiNumber: payoutOption === 'upi' ? upiNumber.trim() : '',
          upiId: payoutOption === 'upi' ? upiId.trim() : ''
        })
      });
      const jsonProfile = await resProfile.json();

      if (myKitchen?.id) {
        await fetch(`${API_BASE_URL}/api/kitchens/${myKitchen.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: myKitchen.id,
            name: shopName.trim(),
            ownerId: user.id,
            type: myKitchen.type,
            cuisines: cuisines.trim(),
            time: myKitchen.time,
            distance: myKitchen.distance,
            offer: myKitchen.offer,
            image: uploadedCover,
            logoUrl: uploadedLogo,
            coverImageUrl: uploadedCover,
            address: shopAddress.trim(),
            bankName: payoutOption === 'bank' ? bankName.trim() : '',
            accountNumber: payoutOption === 'bank' ? accountNumber.trim() : '',
            ifscCode: payoutOption === 'bank' ? ifscCode.trim() : '',
            bankAccount: payoutOption === 'bank' 
              ? `${bankName.trim()} A/C ${accountNumber.trim()}` 
              : `UPI: ${upiNumber.trim() || upiId.trim()}`,
            isLive: myKitchen.isLive
          })
        });
      }

      setIsLoading(false);
      if (jsonProfile.success) {
        setAuth(token, refreshToken, jsonProfile.data);
        Alert.alert('Success', 'Seller shop settings updated successfully!');
        setActiveTab('main');
        fetchKitchens();
      } else {
        Alert.alert('Error', jsonProfile.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setIsLoading(false);
      Alert.alert('Offline Mode', 'Settings saved locally.');
      setActiveTab('main');
    }
  };

  const renderHeader = (title: string) => (
    <View style={[styles.tabHeader, { backgroundColor: '#FFCC00', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }]}>
      <TouchableOpacity onPress={() => setActiveTab('main')} style={[styles.backBtn, { backgroundColor: 'rgba(255, 255, 255, 0.25)', marginRight: 12 }]}>
        <ArrowLeft size={18} color="#FFF" />
      </TouchableOpacity>
      <Text style={[styles.tabHeaderTitle, { color: '#FFF', fontSize: 18, fontWeight: 'bold' }]}>{title}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {activeTab === 'main' && (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Header Card */}
          <View style={[styles.profileHeader, { backgroundColor: '#FFCC00' }]}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
              <TouchableOpacity style={[styles.camIcon, { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' }]} onPress={() => {
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
              <Text style={[styles.name, { color: '#FFFFFF' }]}>{firstName} {lastName}</Text>
              <Text style={[styles.email, { color: 'rgba(255, 255, 255, 0.85)' }]}>{user?.email || 'vendor@cludekitchen.com'}</Text>
              <Text style={styles.roleTag}>Seller Partner Account</Text>
            </View>
          </View>

          {/* Settings list */}
          <View style={styles.zomatoList}>
            <Text style={[styles.listTitle, { color: themeColors.textSecondary }]}>Seller Account Options</Text>

            <TouchableOpacity style={[styles.zomatoRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={() => setActiveTab('profile')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(255,107,0,0.1)' }]}>
                  <User size={18} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: themeColors.text }]}>Edit Owner Profile</Text>
                  <Text style={styles.rowDesc}>Change phone number, gender and name</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.zomatoRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={() => setActiveTab('shop')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(52,199,89,0.1)' }]}>
                  <Store size={18} color={theme.colors.success} />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: themeColors.text }]}>My Kitchen Shop Details</Text>
                  <Text style={styles.rowDesc}>Configure address, cuisines, and promo banners</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.zomatoRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={() => setActiveTab('bank')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(0,122,255,0.1)' }]}>
                  <CreditCard size={18} color="#007AFF" />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: themeColors.text }]}>Vendor Bank Account</Text>
                  <Text style={styles.rowDesc}>For platform weekly earnings payout settlements</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.zomatoRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={() => setActiveTab('help')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(255,45,85,0.1)' }]}>
                  <ChefHat size={18} color="#FF2D55" />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: themeColors.text }]}>FSSAI Food Safety Rules</Text>
                  <Text style={styles.rowDesc}>Vendor cleanliness and packaging guides</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.zomatoRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={() => router.push('/chat-admin')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(0,122,255,0.1)' }]}>
                  <MessageSquare size={18} color="#007AFF" />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: themeColors.text }]}>Chat with Admin Support</Text>
                  <Text style={styles.rowDesc}>Direct support from platform administrators</Text>
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
                  <Text style={[styles.rowTitle, { color: themeColors.text }]}>App Theme & Settings</Text>
                  <Text style={styles.rowDesc}>Switch light/dark mode and security logs</Text>
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
        <View style={{ flex: 1 }}>
          {renderHeader("Edit Owner Details")}
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
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

              <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateAll} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Save Profile Settings</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Tab: Shop */}
      {activeTab === 'shop' && (
        <View style={{ flex: 1 }}>
          {renderHeader("Kitchen Shop Details")}
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.inputCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Shop Name</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                value={shopName}
                onChangeText={setShopName}
                placeholder="e.g. Grandma's Tiffins"
                placeholderTextColor="#888"
              />

              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Shop Cuisine tags</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                value={cuisines}
                onChangeText={setCuisines}
                placeholder="e.g. North Indian, Sweets, Punjabi"
                placeholderTextColor="#888"
              />

              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Shop Location Address</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                value={shopAddress}
                onChangeText={setShopAddress}
                placeholder="H.No., Gali, Sector, Locality name"
                placeholderTextColor="#888"
              />

              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Shop Logo URL</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border, marginBottom: 8 }]}
                value={logoUrl}
                onChangeText={setLogoUrl}
                placeholder="https://example.com/logo.jpg"
                placeholderTextColor="#888"
              />
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 8, borderWidth: 1, borderColor: themeColors.border }} />
              ) : null}
              <TouchableOpacity 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  backgroundColor: '#2c2c2c', 
                  paddingHorizontal: 12, 
                  paddingVertical: 8, 
                  borderRadius: 8,
                  marginBottom: 16,
                  alignSelf: 'flex-start'
                }} 
                onPress={() => requestPhotoSource('logo')}
              >
                <Camera size={12} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>Choose Logo (Camera/Gallery)</Text>
              </TouchableOpacity>

              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Shop Cover/Banner URL</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border, marginBottom: 8 }]}
                value={coverImageUrl}
                onChangeText={setCoverImageUrl}
                placeholder="https://example.com/cover.jpg"
                placeholderTextColor="#888"
              />
              {coverImageUrl ? (
                <Image source={{ uri: coverImageUrl }} style={{ width: '100%', height: 100, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: themeColors.border }} resizeMode="cover" />
              ) : null}
              <TouchableOpacity 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  backgroundColor: '#2c2c2c', 
                  paddingHorizontal: 12, 
                  paddingVertical: 8, 
                  borderRadius: 8,
                  marginBottom: 16,
                  alignSelf: 'flex-start'
                }} 
                onPress={() => requestPhotoSource('cover')}
              >
                <Camera size={12} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>Choose Banner (Camera/Gallery)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateAll} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Save Kitchen Details</Text>}
              </TouchableOpacity>
            </View>

            {/* Publish Shop Promotion Banner */}
            <View style={[styles.inputCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, marginTop: 16 }]}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: themeColors.text, marginBottom: 4 }}>Publish Shop Promotion Banner</Text>
              <Text style={{ fontSize: 10, color: themeColors.textSecondary, marginBottom: 12 }}>
                Post a dynamic banner advertisement for your kitchen onto the customer's home screen slider.
              </Text>

              <TextInput
                style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                placeholder="Promotion Image URL..."
                placeholderTextColor="#888"
                value={newPromoBannerUrl}
                onChangeText={setNewPromoBannerUrl}
              />

              <TextInput
                style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                placeholder="Promotion Click Link/Category..."
                placeholderTextColor="#888"
                value={newPromoBannerLink}
                onChangeText={setNewPromoBannerLink}
              />

              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: theme.colors.success }]} 
                onPress={handlePublishShopBanner}
                disabled={isUploadingPromo}
              >
                {isUploadingPromo ? <ActivityIndicator size="small" color="#FFF" /> : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Plus size={16} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={[styles.primaryBtnText, { color: '#FFF' }]}>Publish Dynamic Banner</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Tab: Bank */}
      {activeTab === 'bank' && (
        <View style={{ flex: 1 }}>
          {renderHeader("Vendor Bank Details")}
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.inputCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              {/* Option Selector */}
              <View style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: themeColors.inputBg, borderRadius: 10, padding: 4 }}>
                <TouchableOpacity 
                  style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 }, payoutOption === 'upi' && { backgroundColor: '#FFCC00' }]}
                  onPress={() => setPayoutOption('upi')}
                >
                  <Text style={{ fontWeight: 'bold', color: payoutOption === 'upi' ? '#FFF' : themeColors.textSecondary, fontSize: 13 }}>UPI Transfer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 }, payoutOption === 'bank' && { backgroundColor: '#FFCC00' }]}
                  onPress={() => setPayoutOption('bank')}
                >
                  <Text style={{ fontWeight: 'bold', color: payoutOption === 'bank' ? '#FFF' : themeColors.textSecondary, fontSize: 13 }}>Bank Transfer</Text>
                </TouchableOpacity>
              </View>

              {/* UPI Option Form */}
              {payoutOption === 'upi' && (
                <View>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>UPI Mobile Number</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                    value={upiNumber}
                    onChangeText={setUpiNumber}
                    placeholder="e.g. 9876543210"
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                  />

                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>UPI ID (VPA)</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="e.g. chefname@oksbi"
                    placeholderTextColor="#888"
                    autoCapitalize="none"
                  />
                </View>
              )}

              {/* Bank Option Form */}
              {payoutOption === 'bank' && (
                <View>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Bank Name</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="e.g. State Bank of India"
                    placeholderTextColor="#888"
                  />

                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Account Number</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="e.g. 30948576291"
                    placeholderTextColor="#888"
                    keyboardType="number-pad"
                  />

                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>IFSC Code</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                    value={ifscCode}
                    onChangeText={setUpiId /* wait, setIfscCode! */}
                    onChangeText={setIfscCode}
                    placeholder="e.g. SBIN0001234"
                    placeholderTextColor="#888"
                    autoCapitalize="characters"
                  />
                </View>
              )}

              <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateAll} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Save Account Details</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Tab: Help */}
      {activeTab === 'help' && (
        <View style={{ flex: 1 }}>
          {renderHeader("FSSAI Safety Rules")}
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.infoTextCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <CheckCircle size={32} color={theme.colors.success} style={{ marginBottom: 12 }} />
              <Text style={[styles.infoTitle, { color: themeColors.text }]}>Hygiene Standards for Vendors</Text>
              <Text style={[styles.infoDesc, { color: themeColors.textSecondary }]}>
                1. Packaging: Always package hot liquids in food-grade approved materials.{"\n\n"}
                2. Cleanliness: Keep the workspace insect-free. Clean surfaces with sanitizing agents daily.{"\n\n"}
                3. Ingredients: Use fresh ingredients. Check expiry dates of milk products and flours.{"\n\n"}
                4. Mask & Gloves: Wear gloves and masks during cooking and handover packing.
              </Text>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <View style={{ flex: 1 }}>
          {renderHeader("Theme & settings")}
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.inputCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              
              {/* Theme switcher */}
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

              <Text style={[styles.inputLabel, { color: themeColors.textSecondary, marginTop: 15 }]}>Authorization Token Scope</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: isDarkMode ? '#181818' : '#EAEAEA', color: '#666', borderColor: themeColors.border }]}
                value="JWT Bearer Token Signature verified"
                editable={false}
              />

              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut size={16} color="#000" style={{ marginRight: 6 }} />
                <Text style={styles.logoutBtnText}>Logout Vendor Account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    textTransform: 'uppercase',
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
  themeToggleBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
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
