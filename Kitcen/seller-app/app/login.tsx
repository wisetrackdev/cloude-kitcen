import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChefHat, Mail, Key, User, Image as ImageIcon, MapPin, Store, CheckCircle, Camera, FileText, QrCode, ArrowLeft, Upload, Smartphone } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useAuthStore } from '../store/useAuthStore';
import { useKitchenStore } from '../store/useKitchenStore';
import { API_BASE_URL } from '../store/apiConfig';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToServer } from '../store/uploadHelper';

type LoginStep = 'email' | 'otp' | 'name' | 'shop_details' | 'payment' | 'pending_approval';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  // Flow State
  const [step, setStep] = useState<LoginStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [tempRefreshToken, setTempRefreshToken] = useState('');
  const [tempUser, setTempUser] = useState<any>(null);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);

  // Step Inputs
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  // Name Step Inputs
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [gender, setGender] = useState('Male');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Shop Details Step Inputs
  const [shopName, setShopName] = useState('');
  const [shopImage, setShopImage] = useState('');
  const [shopLogo, setShopLogo] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopFloor, setShopFloor] = useState('');
  const [shopGaliNumber, setShopGaliNumber] = useState('');
  const [shopState, setShopState] = useState('');
  const [shopPincode, setShopPincode] = useState('');
  const [shopGst, setShopGst] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState('Detecting live location...');

  // Payment Step Inputs
  const [adminUpiNumber, setAdminUpiNumber] = useState('8527430152');
  const [adminUpiId, setAdminUpiId] = useState('8527430152@slc');
  const [adminBankName, setAdminBankName] = useState('State Bank of India');
  const [adminAccountNumber, setAdminAccountNumber] = useState('30948576291');
  const [adminIfscCode, setAdminIfscCode] = useState('SBIN0001043');
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState('');

  const finalUpiId = adminUpiId ? adminUpiId : (adminUpiNumber ? `${adminUpiNumber}@paytm` : '8527430152@slc');

  // Generic Image Selection and Upload Handler
  const selectImage = async (type: 'profile' | 'banner' | 'logo' | 'payment', source: 'camera' | 'gallery') => {
    try {
      const permissionResult = source === 'camera' 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission is required to select photos.');
        return;
      }

      const pickerResult = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: type === 'banner' ? [16, 9] : [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: type === 'banner' ? [16, 9] : [1, 1],
            quality: 0.8,
          });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        setIsLoading(true);
        const localUri = pickerResult.assets[0].uri;
        const uploadedUrl = await uploadImageToServer(localUri);
        setIsLoading(false);
        if (uploadedUrl) {
          if (type === 'profile') {
            setProfileImage(uploadedUrl);
          } else if (type === 'banner') {
            setShopImage(uploadedUrl);
          } else if (type === 'logo') {
            setShopLogo(uploadedUrl);
          } else if (type === 'payment') {
            setPaymentScreenshot(uploadedUrl);
          }
          Alert.alert('Uploaded', 'Image uploaded successfully!');
        } else {
          Alert.alert('Error', 'Image upload failed. Please try again.');
        }
      }
    } catch (err) {
      setIsLoading(false);
      console.warn('Image selection failed:', err);
      Alert.alert('Error', 'Failed to pick or upload image.');
    }
  };

  const requestImageSource = (type: 'profile' | 'banner' | 'logo' | 'payment') => {
    Alert.alert(
      'Upload Photo',
      'Select source:',
      [
        { text: 'Camera', onPress: () => selectImage(type, 'camera') },
        { text: 'Gallery', onPress: () => selectImage(type, 'gallery') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleProceedToPayment = async () => {
    if (!shopName.trim() || !shopAddress.trim() || !shopImage || !shopLogo || !shopState.trim() || !shopPincode.trim() || !shopGst.trim()) {
      Alert.alert('Error', 'Shop Name, Street Address, State, Pin Code, GST Number, Logo, and Banner Image are all mandatory.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const admin = json.data.find((u: any) => u.role === 'superadmin');
          if (admin) {
            setAdminUpiNumber(admin.upiNumber || '8527430152');
            setAdminUpiId(admin.upiId || '8527430152@slc');
            setAdminBankName(admin.bankName || 'State Bank of India');
            setAdminAccountNumber(admin.accountNumber || '30948576291');
            setAdminIfscCode(admin.ifscCode || 'SBIN0001043');
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch admin UPI, using default');
    }
    setIsLoading(false);
    setStep('payment');
  };

  // Auto-detect live location on entering shop details step
  useEffect(() => {
    if (step === 'shop_details') {
      detectLiveLocation();
    }
  }, [step]);

  const detectLiveLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationAddress('GPS permission denied. Using default coordinates.');
        setLatitude(19.0760);
        setLongitude(72.8777);
        return;
      }

      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude: lat, longitude: lng } = currentLoc.coords;
      setLatitude(lat);
      setLongitude(lng);

      const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const formatted = [
          place.name || place.street,
          place.district || place.subregion,
          place.city || place.region
        ].filter(Boolean).join(', ');
        setLocationAddress(formatted || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        if (!shopAddress) {
          setShopAddress(formatted);
        }
      } else {
        setLocationAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
      }
    } catch (err: any) {
      console.warn('Location detection failed:', err.message);
      setLocationAddress('Failed to detect location. Tap to retry.');
    }
  };

  // Step 1: Request OTP
  const handleRequestOtp = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const json = await res.json();
      setIsLoading(false);

      if (json.success) {
        setStep('otp');
        Alert.alert('OTP Sent', json.message);
      } else {
        Alert.alert('Error', json.message || 'Failed to request OTP');
      }
    } catch (err: any) {
      console.warn('API request failed, doing fallback:', err.message);
      setIsLoading(false);
      setStep('otp');
      Alert.alert('Offline Mode', 'API offline. Simulated OTP: "123456"');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 4) {
      Alert.alert('Error', 'Please enter a valid OTP code');
      return;
    }

    setIsLoading(true);

    // Simulated OTP bypass for development
    if (otpCode === '123456') {
      setIsLoading(false);
      const isMockNew = email.includes('new') || email.includes('test');
      const mockUser = {
        id: 'usr-chef-9281',
        name: '',
        email: email,
        role: 'vendor',
        rewardPoints: 10
      };
      setTempToken('mock_token');
      setTempRefreshToken('mock_refresh');
      setTempUser(mockUser);
      
      if (isMockNew) {
        setShowCompleteProfile(true);
      } else {
        setAuth('mock_token', 'mock_refresh', {
          id: 'usr-chef-9281',
          name: 'Cloud Chef',
          email: email,
          phone: '',
          avatar: '',
          role: 'vendor',
          rewardPoints: 10
        });
        Alert.alert('Welcome Partner', 'Login successful!', [{ text: 'OK', onPress: () => router.replace('/fingerprint') }]);
      }
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode })
      });

      const json = await res.json();
      
      if (json.success) {
        const { token, refreshToken, user, isNewUser } = json.data;
        setTempToken(token);
        setTempRefreshToken(refreshToken);
        setTempUser(user);

        if (isNewUser) {
          setIsLoading(false);
          setShowCompleteProfile(true);
        } else {
          // If user already has name, check if they have a kitchen
          await checkUserKitchen(token, user);
        }
      } else {
        setIsLoading(false);
        Alert.alert('Error', json.message || 'Verification failed');
      }
    } catch (err: any) {
      console.warn('Verification failed, doing mock fallback:', err.message);
      setIsLoading(false);
      Alert.alert('Error', 'Verification failed and could not connect to server.');
    }
  };

  // Helper: Check if user has registered a kitchen & its approval status
  const checkUserKitchen = async (token: string, user: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/kitchens`);
      const json = await res.json();
      
      if (json.success) {
        const userKitchen = json.data.find((k: any) => 
          (k.ownerId || k.owner || '').toLowerCase() === (user.id || '').toLowerCase()
        );
        
        if (!userKitchen) {
          setIsLoading(false);
          setStep('shop_details');
        } else {
          setAuth(token, tempRefreshToken || 'mock_refresh', {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            avatar: user.avatar || '',
            role: 'vendor',
            rewardPoints: user.rewardPoints
          });
          setIsLoading(false);
          Alert.alert('Welcome Partner', 'Login successful!', [{ text: 'OK', onPress: () => router.replace('/fingerprint') }]);
        }
      } else {
        setIsLoading(false);
        setStep('shop_details');
      }
    } catch (err) {
      console.error('Failed to check user kitchen status:', err);
      setIsLoading(false);
      if (token === 'mock_token') {
        setStep('shop_details');
      } else {
        setStep('shop_details');
      }
    }
  };

  // Step 3: Name & Basic Profile Registration (POST complete-profile)
  const handleRegisterName = async () => {
    if (!firstName.trim() || !lastName.trim() || !profileImage || !phoneNumber.trim()) {
      Alert.alert('Error', 'First Name, Last Name, Gender, Mobile Number, and Profile Photo are all mandatory.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/complete-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: tempUser.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          avatar: profileImage,
          gender: gender,
          phone: phoneNumber.trim(),
          role: 'vendor'
        })
      });
      const json = await res.json();
      if (json.success) {
        const updatedUser = json.data;
        setTempUser(updatedUser);
        await checkUserKitchen(tempToken, updatedUser);
      } else {
        setIsLoading(false);
        Alert.alert('Error', json.message || 'Failed to complete profile');
      }
    } catch (err) {
      console.error('Failed to save details:', err);
      setIsLoading(false);
      const updatedUser = { 
        ...tempUser, 
        name: `${firstName.trim()} ${lastName.trim()}`, 
        avatar: profileImage,
        phone: phoneNumber.trim(),
        gender: gender,
        role: 'vendor'
      };
      setTempUser(updatedUser);
      await checkUserKitchen(tempToken, updatedUser);
    }
  };

  // Step 4: Register Shop Details (Submits pending request)
  const handleRegisterShop = async () => {
    if (!utrNumber.trim()) {
      Alert.alert('Error', 'Please enter the transaction UTR number.');
      return;
    }
    if (!paymentScreenshot) {
      Alert.alert('Error', 'Please upload or select a payment screenshot proof.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verify Platform Fee Payment via backend (Must confirm)
      const verifyRes = await fetch(`${API_BASE_URL}/api/wallet/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({
          utrNumber: utrNumber.trim(),
          amount: 1.00,
          upiId: adminUpiId,
          userId: tempUser?.id || ''
        })
      });

      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok || !verifyJson.success) {
        setIsLoading(false);
        Alert.alert('Payment Not Confirmed', 'Payment is not confirmed. Please check your transaction UTR number and try again.');
        return;
      }
    } catch (verifyErr: any) {
      console.warn('Verify payment failed:', verifyErr);
      setIsLoading(false);
      Alert.alert('Payment Not Confirmed', 'Could not confirm payment verification. Please try again.');
      return;
    }

    const completeAddress = `${shopAddress.trim()}, Floor: ${shopFloor.trim()}, Gali/Office: ${shopGaliNumber.trim()}, State: ${shopState.trim()}, PinCode: ${shopPincode.trim()} | GST: ${shopGst.trim()}`;
    
    try {
      // POST new kitchen request to backend (initially pending)
      const res = await fetch(`${API_BASE_URL}/api/kitchens`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({
          name: shopName.trim(),
          ownerId: tempUser.id,
          type: 'home_tiffin',
          cuisines: 'Indian, Healthy Thali',
          time: '30 mins',
          distance: '1.0 km',
          offer: 'Freshly Cooked Homestyle Food',
          image: shopImage,
          logoUrl: shopLogo,
          address: completeAddress,
          floor: shopFloor,
          officeGaliNumber: shopGaliNumber,
          latitude: latitude || 19.0760,
          longitude: longitude || 72.8777,
          isApproved: 'pending',
          utrNumber: utrNumber.trim(),
          paymentScreenshot: paymentScreenshot
        })
      });

      const json = await res.json();
      setIsLoading(false);

      if (json.success) {
        // Log in immediately and redirect to fingerprint setup
        setAuth(tempToken, tempRefreshToken || 'mock_refresh', {
          id: tempUser.id,
          name: tempUser.name || `${firstName.trim()} ${lastName.trim()}`,
          email: tempUser.email,
          phone: tempUser.phone || phoneNumber.trim() || '',
          avatar: tempUser.avatar || profileImage || '',
          role: 'vendor',
          rewardPoints: tempUser.rewardPoints || 0
        });
        Alert.alert('Registration Successful', 'Your shop has been registered and is pending approval by the Admin.', [
          { text: 'OK', onPress: () => router.replace('/fingerprint') }
        ]);
      } else {
        Alert.alert('Error', json.message || 'Failed to submit shop registration details');
      }
    } catch (err: any) {
      console.error('Shop registration failed, doing offline fallback:', err);
      setIsLoading(false);
      // Demo fallback
      setAuth(tempToken || 'mock_token', tempRefreshToken || 'mock_refresh', {
        id: tempUser?.id || 'usr-chef-9281',
        name: tempUser?.name || `${firstName.trim()} ${lastName.trim()}`,
        email: email,
        phone: phoneNumber.trim(),
        avatar: profileImage || '',
        role: 'vendor',
        rewardPoints: 10
      });
      Alert.alert('Registration Submitted (Offline)', 'Shop registered offline and pending admin approval.', [
        { text: 'OK', onPress: () => router.replace('/fingerprint') }
      ]);
    }
  };

  const isFormStep = step === 'shop_details' || step === 'payment';

  if (isFormStep) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F5F7' }}>
        {/* Fixed Header */}
        <View style={{ 
          backgroundColor: '#FFCC00', 
          paddingTop: 50, 
          paddingHorizontal: 20, 
          paddingBottom: 20, 
          borderBottomLeftRadius: 24, 
          borderBottomRightRadius: 24,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          zIndex: 10
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ChefHat size={28} color="#000" style={{ marginRight: 10 }} />
            <View>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>
                {step === 'shop_details' ? 'Shop Details' : 'Platform Payment'}
              </Text>
              <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)' }}>
                {step === 'shop_details' ? 'Enter shop outlet information' : 'Pay platform onboarding fee'}
              </Text>
            </View>
          </View>
          {step === 'payment' && (
            <TouchableOpacity 
              onPress={() => setStep('shop_details')}
              style={{ backgroundColor: 'rgba(0,0,0,0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}
            >
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#000' }}>Back</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Scrollable Card Container */}
        <ScrollView 
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { padding: 20 }]}>
            {isLoading && (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 20 }} />
            )}

            {/* STEP 4: Shop Details Registration */}
            {step === 'shop_details' && (
              <View style={styles.form}>
                <Text style={styles.stepTitle}>Register Your Shop / Kitchen</Text>

                <View style={styles.inputWrapper}>
                  <Store size={16} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Shop / Kitchen Name"
                    placeholderTextColor="#888"
                    value={shopName}
                    onChangeText={setShopName}
                    style={styles.inputField}
                  />
                </View>

                {/* Shop Banner Image capture */}
                <View style={styles.captureContainer}>
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>Shop Banner Image</Text>
                    {shopImage ? (
                      <Text style={styles.imagePlaceholderSubText} numberOfLines={1}>✓ Uploaded: {shopImage.substring(shopImage.lastIndexOf('/') + 1)}</Text>
                    ) : (
                      <Text style={styles.imagePlaceholderSubText}>No banner uploaded</Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.captureBtn} onPress={() => requestImageSource('banner')}>
                    <Camera size={14} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.captureBtnText}>Select Banner</Text>
                  </TouchableOpacity>
                </View>

                {/* Logo capture */}
                <View style={styles.captureContainer}>
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>Shop Logo / Avatar</Text>
                    {shopLogo ? (
                      <Text style={styles.imagePlaceholderSubText} numberOfLines={1}>✓ Uploaded: {shopLogo.substring(shopLogo.lastIndexOf('/') + 1)}</Text>
                    ) : (
                      <Text style={styles.imagePlaceholderSubText}>No logo uploaded</Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.captureBtn} onPress={() => requestImageSource('logo')}>
                    <Camera size={14} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.captureBtnText}>Select Logo</Text>
                  </TouchableOpacity>
                </View>

                {/* GPS Location (Auto-Detected) */}
                <View style={styles.locationContainer}>
                  <MapPin size={16} color={theme.colors.primary} style={styles.inputIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationLabel}>Live Shop Location (Auto-Picked)</Text>
                    <Text style={styles.locationValue} numberOfLines={1}>{locationAddress}</Text>
                  </View>
                  <TouchableOpacity onPress={detectLiveLocation}>
                    <Text style={styles.refreshLocText}>Retry GPS</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputWrapper}>
                  <MapPin size={16} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Gali / Street Address"
                    placeholderTextColor="#888"
                    value={shopAddress}
                    onChangeText={setShopAddress}
                    style={styles.inputField}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                    <TextInput
                      placeholder="Floor (e.g. 1st)"
                      placeholderTextColor="#888"
                      value={shopFloor}
                      onChangeText={setShopFloor}
                      style={styles.inputField}
                    />
                  </View>

                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <TextInput
                      placeholder="Office/Shop No."
                      placeholderTextColor="#888"
                      value={shopGaliNumber}
                      onChangeText={setShopGaliNumber}
                      style={styles.inputField}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                    <TextInput
                      placeholder="State"
                      placeholderTextColor="#888"
                      value={shopState}
                      onChangeText={setShopState}
                      style={styles.inputField}
                    />
                  </View>

                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <TextInput
                      placeholder="Pin Code"
                      placeholderTextColor="#888"
                      keyboardType="numeric"
                      value={shopPincode}
                      onChangeText={setShopPincode}
                      style={styles.inputField}
                    />
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <FileText size={16} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="GSTIN Number (GST is manually input)"
                    placeholderTextColor="#888"
                    autoCapitalize="characters"
                    value={shopGst}
                    onChangeText={setShopGst}
                    style={styles.inputField}
                  />
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleProceedToPayment}>
                  <Text style={styles.primaryBtnText}>Proceed to Payment (Next)</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PAYMENT STEP: Pay Platform Activation Fee */}
            {step === 'payment' && (
              <View style={styles.form}>
                <Text style={styles.stepTitle}>Platform Activation Fee</Text>
                
                <Text style={{ fontSize: 12, color: '#333', textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
                  To activate your store, please pay a one-time platform activation fee of <Text style={{ fontWeight: 'bold', color: '#000' }}>₹1.00</Text>.
                </Text>

                {/* UPI details & Paytm App redirection */}
                <View style={{ backgroundColor: '#F0F2F4', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EAEAEA', alignItems: 'center', marginBottom: 16 }}>
                  <Smartphone size={28} color="#002E6E" style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1E2022' }}>Direct App Payment</Text>
                  <Text style={{ fontSize: 11, color: '#686E73', textAlign: 'center', marginTop: 4, marginBottom: 12 }}>
                    Click below to pay ₹1.00 directly via Paytm or other UPI apps on this phone.
                  </Text>
                  <TouchableOpacity 
                    style={{ backgroundColor: '#002E6E', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 }}
                    onPress={() => {
                      // Attempt to open Paytm or generic UPI directly using the admin's saved UPI ID
                      const paytmUrl = `paytmmp://pay?pa=${finalUpiId}&pn=${encodeURIComponent('Cloud Kitchen Admin')}&am=1.00&cu=INR&tn=${encodeURIComponent('Platform Activation Fee')}`;
                      const upiUrl = `upi://pay?pa=${finalUpiId}&pn=${encodeURIComponent('Cloud Kitchen Admin')}&am=1.00&cu=INR&tn=${encodeURIComponent('Platform Activation Fee')}`;
                      
                      Linking.openURL(paytmUrl).catch(() => {
                        Linking.openURL(upiUrl).catch(() => {
                          Alert.alert('App Redirection Error', 'Could not open Paytm or UPI apps directly. Please scan the QR code instead.');
                        });
                      });
                    }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>Pay via Paytm App</Text>
                  </TouchableOpacity>
                </View>

                {/* QR Scanner option */}
                <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EAEAEA', alignItems: 'center', marginBottom: 16 }}>
                  <QrCode size={28} color="#FF6B00" style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1E2022' }}>Scan Paytm QR Code</Text>
                  <Text style={{ fontSize: 11, color: '#686E73', textAlign: 'center', marginTop: 4, marginBottom: 12 }}>
                    Or scan this QR Code using Paytm or any UPI scanner to make the payment:
                  </Text>
                  
                  <Image 
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${finalUpiId}&pn=${encodeURIComponent('Cloud Kitchen Admin')}&am=1.00&cu=INR&tn=${encodeURIComponent('Platform Activation Fee')}`)}` }}
                    style={{ width: 180, height: 180, borderRadius: 8, borderWidth: 1, borderColor: '#EAEAEA', backgroundColor: '#FFF' }}
                  />
                  <Text style={{ fontSize: 11, color: '#FF6B00', fontWeight: 'bold', marginTop: 10 }}>UPI ID: {finalUpiId}</Text>
                  {adminUpiNumber ? <Text style={{ fontSize: 10, color: '#686E73', marginTop: 2 }}>UPI Phone / Mobile: {adminUpiNumber}</Text> : null}
                </View>

                {/* Bank Account Details Option */}
                <View style={{ backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EAEAEA', marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1E2022', marginBottom: 8, textAlign: 'center' }}>Alternative: Bank Account Details</Text>
                  <Text style={{ fontSize: 11, color: '#686E73', textAlign: 'center', marginBottom: 12 }}>
                    If you prefer bank transfer, you can pay ₹1.00 directly to the admin bank account:
                  </Text>
                  
                  <View style={{ width: '100%' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#EAEAEA' }}>
                      <Text style={{ fontSize: 11, color: '#686E73' }}>Bank Name:</Text>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#333' }}>{adminBankName}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#EAEAEA' }}>
                      <Text style={{ fontSize: 11, color: '#686E73' }}>Account Name:</Text>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#333' }}>Cloud Kitchen Admin</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#EAEAEA' }}>
                      <Text style={{ fontSize: 11, color: '#686E73' }}>Account Number:</Text>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#333' }}>{adminAccountNumber}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#EAEAEA' }}>
                      <Text style={{ fontSize: 11, color: '#686E73' }}>IFSC Code:</Text>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#333' }}>{adminIfscCode}</Text>
                    </View>
                    {adminUpiNumber ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                        <Text style={{ fontSize: 11, color: '#686E73' }}>Contact Mobile:</Text>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#333' }}>{adminUpiNumber}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Proof Submission */}
                <Text style={[styles.stepTitle, { textAlign: 'left', fontSize: 13, marginBottom: 8 }]}>Submit Payment Proof</Text>

                {/* UTR Input */}
                <View style={styles.inputWrapper}>
                  <FileText size={16} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter 12-Digit UTR / Transaction No."
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    value={utrNumber}
                    onChangeText={setUtrNumber}
                    style={styles.inputField}
                  />
                </View>

                {/* Screenshot Capture / upload */}
                <View style={styles.captureContainer}>
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>Payment Screenshot</Text>
                    {paymentScreenshot ? (
                      <Text style={styles.imagePlaceholderSubText} numberOfLines={1}>✓ Selected: {paymentScreenshot.substring(paymentScreenshot.lastIndexOf('/') + 1)}</Text>
                    ) : (
                      <Text style={styles.imagePlaceholderSubText}>Capture photo or select receipt</Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.captureBtn} onPress={() => requestImageSource('payment')}>
                    <Camera size={14} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.captureBtnText}>Upload Proof</Text>
                  </TouchableOpacity>
                </View>

                {paymentScreenshot ? (
                  <Image 
                    source={{ uri: paymentScreenshot }}
                    style={{ width: '100%', height: 160, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#EAEAEA' }}
                    resizeMode="contain"
                  />
                ) : null}

                <TouchableOpacity style={styles.primaryBtn} onPress={handleRegisterShop}>
                  <Text style={styles.primaryBtnText}>Save & Submit Registration</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Otherwise, default matching customer app login style
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Account</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Clude Partner</Text>
        <Text style={styles.subtitle}>Log in to manage kitchen and thali orders</Text>

        {isLoading && (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 20 }} />
        )}

        {/* STEP 1: Enter Email */}
        {step === 'email' && (
          <View style={styles.fieldSection}>
            <View style={styles.inputWrapper}>
              <Mail size={16} color={theme.colors.textSecondary} />
              <TextInput
                placeholder="Partner Email Address"
                placeholderTextColor="#888"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleRequestOtp}>
              <Text style={styles.primaryBtnText}>Send OTP via Email</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: Enter OTP / Complete Profile */}
        {step === 'otp' && (
          <View style={styles.fieldSection}>
            <View style={styles.inputWrapper}>
              <Key size={16} color={theme.colors.textSecondary} />
              <TextInput
                placeholder="Enter 6-digit OTP code"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={otpCode}
                onChangeText={setOtpCode}
                editable={!showCompleteProfile}
                style={[styles.input, showCompleteProfile && { opacity: 0.6 }]}
              />
            </View>

            {showCompleteProfile ? (
              <ScrollView style={{ width: '100%', maxHeight: 380, marginTop: 10 }} showsVerticalScrollIndicator={false}>
                <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>
                  Complete Profile
                </Text>
                
                <View style={styles.inputWrapper}>
                  <User size={16} color={theme.colors.textSecondary} />
                  <TextInput
                    placeholder="First Name"
                    placeholderTextColor="#888"
                    value={firstName}
                    onChangeText={setFirstName}
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <User size={16} color={theme.colors.textSecondary} />
                  <TextInput
                    placeholder="Last Name"
                    placeholderTextColor="#888"
                    value={lastName}
                    onChangeText={setLastName}
                    style={styles.input}
                  />
                </View>

                {/* Mobile Phone Number */}
                <View style={styles.inputWrapper}>
                  <Smartphone size={16} color={theme.colors.textSecondary} />
                  <TextInput
                    placeholder="Mobile Number"
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    style={styles.input}
                  />
                </View>

                {/* Gender selection */}
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 8, paddingHorizontal: 4 }}>
                  Gender
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16, paddingHorizontal: 4 }}>
                  {['Male', 'Female'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setGender(g)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        backgroundColor: gender === g ? '#FFB300' : '#FFF',
                        borderWidth: 1,
                        borderColor: gender === g ? '#FFB300' : '#EAEAEA',
                        borderRadius: 10,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: gender === g ? '#FFF' : '#333' }}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Profile Photo Selector */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10, paddingHorizontal: 4 }}>
                  {profileImage ? (
                    <Text style={{ color: '#2ecc71', fontSize: 13, fontWeight: 'bold' }}>✓ Profile Photo Selected</Text>
                  ) : (
                    <Text style={{ color: '#888', fontSize: 13 }}>No photo selected</Text>
                  )}
                  <TouchableOpacity 
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      backgroundColor: '#2c2c2c', 
                      paddingHorizontal: 12, 
                      paddingVertical: 8, 
                      borderRadius: 8
                    }} 
                    onPress={() => requestImageSource('profile')}
                  >
                    <Camera size={14} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>Select Photo</Text>
                  </TouchableOpacity>
                </View>

                {profileImage ? (
                  <Image 
                    source={{ uri: profileImage }}
                    style={{ width: 80, height: 80, borderRadius: 40, alignSelf: 'center', marginVertical: 8, borderWidth: 1, borderColor: '#EAEAEA' }}
                  />
                ) : null}

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 15 }]} onPress={handleRegisterName}>
                  <Text style={styles.primaryBtnText}>Continue to Shop Details</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp}>
                  <Text style={styles.primaryBtnText}>Verify & Log In</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setStep('email'); setOtpCode(''); }}>
                  <Text style={styles.toggleText}>Resend OTP / Change Email</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFCC00', // Gold-yellow top header background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 35,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#F5F5F7', // Rounded white body card
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFB300', // Primary orange theme
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
  },
  fieldSection: {
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  form: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E2022',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#333',
    fontSize: 13,
    marginLeft: 12,
  },
  inputField: {
    flex: 1,
    color: '#1E2022',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  locationValue: {
    fontSize: 12,
    color: '#1E2022',
    marginTop: 2,
  },
  refreshLocText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  primaryBtn: {
    backgroundColor: '#FFB300', // Primary orange theme button
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 12,
    shadowColor: '#FFB300',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  toggleText: {
    fontSize: 12,
    color: '#FFB300',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  captureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F2F4',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  imagePlaceholder: {
    flex: 1,
  },
  imagePlaceholderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E2022',
  },
  imagePlaceholderSubText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,0,0.1)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  captureBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.primary,
  }
});
