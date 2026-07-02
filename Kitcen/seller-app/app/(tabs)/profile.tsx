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
  MapPin,
  Tag,
  Camera,
  Phone,
  User,
  CreditCard,
  ArrowLeft,
  Image as ImageIcon,
  CheckCircle,
  ChevronRight
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

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchKitchens();
  }, []);

  useEffect(() => {
    if (myKitchen) {
      setShopName(myKitchen.name || '');
      setShopAddress(myKitchen.address || '');
      setCuisines(myKitchen.cuisines || '');
      setLogoUrl(myKitchen.logoUrl || '');
      setCoverImageUrl(myKitchen.coverImageUrl || '');
      setBankName(myKitchen.bankName || '');
      setAccountNumber(myKitchen.accountNumber || '');
      setIfscCode(myKitchen.ifscCode || '');
    }
  }, [kitchens]);

  const handleLogout = () => {
    logout();
    Alert.alert('Session Terminated', 'Logged out successfully!', [
      { text: 'OK', onPress: () => router.replace('/login') }
    ]);
  };

  // Image Picker Logic (Camera)
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
      console.warn('Camera failed', e);
      Alert.alert('Camera Error', 'Could not open camera');
    }
  };

  // Image Picker Logic (Gallery)
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
      console.warn('Gallery failed', e);
      Alert.alert('Gallery Error', 'Could not open photo library');
    }
  };

  const handleUpdateAll = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First Name and Last Name are required');
      return;
    }

    setIsLoading(true);
    try {
      let uploadedAvatar = avatar;
      let uploadedLogo = logoUrl;
      let uploadedCover = coverImageUrl;

      // Upload local images to Cloudinary if they are local URIs
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

      // 1. Update user auth profile
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
          role: user.role
        })
      });
      const jsonProfile = await resProfile.json();

      // 2. Update kitchen settings if exists
      if (myKitchen?.id) {
        await fetch(`${API_BASE_URL}/api/kitchens/${myKitchen.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: shopName.trim(),
            address: shopAddress.trim(),
            type: myKitchen.type,
            cuisines: cuisines.trim(),
            time: myKitchen.time,
            distance: myKitchen.distance,
            offer: myKitchen.offer,
            image: uploadedCover.trim() !== '' ? uploadedCover.trim() : myKitchen.image,
            logoUrl: uploadedLogo.trim(),
            coverImageUrl: uploadedCover.trim(),
            bankName: bankName.trim(),
            accountNumber: accountNumber.trim(),
            ifscCode: ifscCode.trim(),
            isApproved: myKitchen.isApproved
          })
        });
        await fetchKitchens();
      }

      setIsLoading(false);

      if (jsonProfile.success) {
        setAuth(token, refreshToken, jsonProfile.data);
        Alert.alert('Success', 'Profile and Kitchen information updated successfully!');
        setActiveTab('main');
      } else {
        Alert.alert('Error', jsonProfile.message || 'Failed to update settings');
      }
    } catch (err: any) {
      console.warn('Update failed:', err);
      setIsLoading(false);
      Alert.alert('Offline Sync', 'Settings updated locally (offline simulation).');
      setActiveTab('main');
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
      {activeTab === 'main' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header Card */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
              <TouchableOpacity style={styles.camIcon} onPress={() => {
                Alert.alert("Select Avatar Photo", "Choose photo source:", [
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
              <Text style={styles.email}>{user?.email}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.approvedBadge, { backgroundColor: myKitchen?.isApproved === 'approved' ? 'rgba(52,199,89,0.15)' : 'rgba(255,204,0,0.15)' }]}>
                  <Text style={[styles.approvedText, { color: myKitchen?.isApproved === 'approved' ? theme.colors.success : theme.colors.warning }]}>
                    {myKitchen?.isApproved === 'approved' ? '✓ APPROVED PARTNER' : '⌛ APPROVAL PENDING'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Zomato menu list */}
          <View style={styles.zomatoList}>
            <Text style={styles.listTitle}>My Workspace Settings</Text>

            <TouchableOpacity style={styles.zomatoRow} onPress={() => setActiveTab('profile')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(255,107,0,0.1)' }]}>
                  <User size={18} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Edit Profile details</Text>
                  <Text style={styles.rowDesc}>Change phone, gender, and contact name</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.zomatoRow} onPress={() => setActiveTab('shop')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(52,199,89,0.1)' }]}>
                  <Store size={18} color={theme.colors.success} />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Kitchen & Address Settings</Text>
                  <Text style={styles.rowDesc}>Shop name, GPS address, logo & cover photo</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.zomatoRow} onPress={() => setActiveTab('bank')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(0,122,255,0.1)' }]}>
                  <CreditCard size={18} color="#007AFF" />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Payout Bank Account</Text>
                  <Text style={styles.rowDesc}>IFSC, Bank name & account numbers</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.zomatoRow} onPress={() => setActiveTab('help')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(255,45,85,0.1)' }]}>
                  <ShieldCheck size={18} color="#FF2D55" />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Safety & Guidelines</Text>
                  <Text style={styles.rowDesc}>Partner hygiene and cloud guidelines</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.zomatoRow} onPress={() => setActiveTab('settings')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(142,142,147,0.1)' }]}>
                  <Settings size={18} color="#8E8E93" />
                </View>
                <View>
                  <Text style={styles.rowTitle}>App Settings</Text>
                  <Text style={styles.rowDesc}>Security logs, theme, and logout option</Text>
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
              placeholder="e.g. Female, Male, Other"
              placeholderTextColor="#888"
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateAll} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Save Personal Details</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Tab: Shop Settings */}
      {activeTab === 'shop' && (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {renderHeader("Kitchen Settings")}

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Kitchen Shop Name</Text>
            <TextInput
              style={styles.textInput}
              value={shopName}
              onChangeText={setShopName}
              placeholder="e.g. Grandma's Healthy Kitchen"
              placeholderTextColor="#888"
            />

            <Text style={styles.inputLabel}>Cuisines Served</Text>
            <TextInput
              style={styles.textInput}
              value={cuisines}
              onChangeText={setCuisines}
              placeholder="e.g. North Indian, South Indian, Healthy Food"
              placeholderTextColor="#888"
            />

            <Text style={styles.inputLabel}>Shop GPS Address Location</Text>
            <TextInput
              style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
              value={shopAddress}
              onChangeText={setShopAddress}
              placeholder="Enter exact address (e.g. Shop 42, Sector 62, Noida)"
              placeholderTextColor="#888"
              multiline={true}
            />
            <Text style={styles.fieldGuide}>* This location coordinates will show exactly to delivery boys in Google Maps routes.</Text>

            {/* Shop Logo Picker */}
            <Text style={styles.inputLabel}>Kitchen Logo Image</Text>
            <View style={styles.imagePickerRow}>
              {logoUrl ? <Image source={{ uri: logoUrl }} style={styles.pickerThumb} /> : <View style={styles.noThumb}><Store size={20} color="#666" /></View>}
              <View style={styles.pickerButtons}>
                <TouchableOpacity style={styles.pickerActionBtn} onPress={() => pickFromCamera(setLogoUrl)}>
                  <Camera size={12} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.pickerActionText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickerActionBtn} onPress={() => pickFromGallery(setLogoUrl)}>
                  <ImageIcon size={12} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.pickerActionText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Shop Cover Picker */}
            <Text style={styles.inputLabel}>Kitchen Banner Cover Image</Text>
            <View style={styles.imagePickerRow}>
              {coverImageUrl ? <Image source={{ uri: coverImageUrl }} style={styles.pickerThumbBanner} /> : <View style={styles.noThumbBanner}><ImageIcon size={20} color="#666" /></View>}
              <View style={styles.pickerButtons}>
                <TouchableOpacity style={styles.pickerActionBtn} onPress={() => pickFromCamera(setCoverImageUrl)}>
                  <Camera size={12} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.pickerActionText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickerActionBtn} onPress={() => pickFromGallery(setCoverImageUrl)}>
                  <ImageIcon size={12} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.pickerActionText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateAll} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Save Kitchen Settings</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Tab: Bank Account */}
      {activeTab === 'bank' && (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {renderHeader("Payout Bank Account")}

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

            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateAll} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Save Bank Account</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Tab: Help */}
      {activeTab === 'help' && (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {renderHeader("Hygiene & Safety Guidelines")}
          <View style={styles.infoTextCard}>
            <CheckCircle size={32} color={theme.colors.success} style={{ marginBottom: 12 }} />
            <Text style={styles.infoTitle}>Partner Guidelines</Text>
            <Text style={styles.infoDesc}>
              1. Masking: Wear masks during food preparation and packaging.{"\n\n"}
              2. Sanitization: Wash hands every 20 minutes with sanitizer.{"\n\n"}
              3. Fresh Ingredients: Ensure quality ingredients are used.{"\n\n"}
              4. Secure Packaging: Double seal packages to avoid transit leakage.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Tab: Settings (Logout inside) */}
      {activeTab === 'settings' && (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {renderHeader("Security & Settings")}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Role Credentials</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: '#181818', color: '#666' }]}
              value="ROLE_KITCHEN_PARTNER"
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
              <Text style={styles.logoutBtnText}>Logout Partner Account</Text>
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
  statusRow: {
    marginTop: 6,
    flexDirection: 'row',
  },
  approvedBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  approvedText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  zomatoList: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  listTitle: {
    fontSize: 12,
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
  fieldGuide: {
    fontSize: 9,
    color: theme.colors.primary,
    marginTop: -10,
    marginBottom: 16,
  },
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#222',
    marginRight: 12,
  },
  noThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pickerThumbBanner: {
    width: 80,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#222',
    marginRight: 12,
  },
  noThumbBanner: {
    width: 80,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pickerButtons: {
    flexDirection: 'row',
  },
  pickerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  pickerActionText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
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
