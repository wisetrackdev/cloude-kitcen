import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChefHat, Mail, Key, User, Image as ImageIcon, MapPin, Store, CheckCircle } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useAuthStore } from '../store/useAuthStore';
import { useKitchenStore } from '../store/useKitchenStore';
import { API_BASE_URL } from '../store/apiConfig';
import * as Location from 'expo-location';

type LoginStep = 'email' | 'otp' | 'name' | 'shop_details' | 'pending_approval';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);
  const kitchens = useKitchenStore(state => state.kitchens);

  // Flow State
  const [step, setStep] = useState<LoginStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [tempRefreshToken, setTempRefreshToken] = useState('');
  const [tempUser, setTempUser] = useState<any>(null);

  // Step Inputs
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  // Name Step Inputs
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Shop Details Step Inputs
  const [shopName, setShopName] = useState('');
  const [shopImage, setShopImage] = useState('https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80');
  const [shopLogo, setShopLogo] = useState('https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&auto=format&fit=crop&q=80');
  const [shopAddress, setShopAddress] = useState('');
  const [shopFloor, setShopFloor] = useState('');
  const [shopGaliNumber, setShopGaliNumber] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState('Detecting live location...');

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
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode })
      });

      const json = await res.json();
      
      if (json.success) {
        const { token, refreshToken, user } = json.data;
        setTempToken(token);
        setTempRefreshToken(refreshToken);
        setTempUser(user);

        // Check user names - if empty, go to Name Step
        if (!user.name || user.name.trim() === '' || user.name === 'Cloud KitchenUser') {
          setIsLoading(false);
          setStep('name');
          return;
        }

        // If user already has name, check if they have a kitchen
        await checkUserKitchen(token, user);
      } else {
        setIsLoading(false);
        Alert.alert('Error', json.message || 'Verification failed');
      }
    } catch (err: any) {
      console.warn('Verification failed, doing mock fallback:', err.message);
      setIsLoading(false);

      if (otpCode === '123456') {
        const mockUser = {
          id: 'usr-chef-9281',
          name: 'Cloud Chef',
          email: email,
          role: 'vendor',
          rewardPoints: 10
        };
        setTempToken('mock_token');
        setTempRefreshToken('mock_refresh');
        setTempUser(mockUser);
        
        // Go to Shop Details form
        setStep('shop_details');
      } else {
        Alert.alert('Error', 'Invalid OTP code. Try "123456"');
      }
    }
  };

  // Helper: Check if user has registered a kitchen & its approval status
  const checkUserKitchen = async (token: string, user: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/kitchens`);
      const json = await res.json();
      
      if (json.success) {
        const userKitchen = json.data.find((k: any) => k.ownerId === user.id);
        
        if (!userKitchen) {
          // No kitchen found -> go to Shop Details registration
          setIsLoading(false);
          setStep('shop_details');
        } else if (userKitchen.isApproved !== 'approved') {
          // Kitchen found but pending/rejected -> go to Pending Approval screen
          setIsLoading(false);
          setStep('pending_approval');
        } else {
          // Approved -> Log in successfully!
          setAuth(token, tempRefreshToken, {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            avatar: user.avatar || '',
            role: 'vendor',
            rewardPoints: user.rewardPoints
          });
          setIsLoading(false);
          Alert.alert('Welcome Partner', 'Login successful!', [{ text: 'OK', onPress: () => router.replace('/') }]);
        }
      } else {
        setIsLoading(false);
        setStep('shop_details');
      }
    } catch (err) {
      console.error('Failed to check user kitchen status:', err);
      setIsLoading(false);
      setStep('shop_details');
    }
  };

  // Step 3: Name Registration
  const handleRegisterName = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter your first and last name');
      return;
    }

    setIsLoading(true);
    try {
      const updatedName = `${firstName.trim()} ${lastName.trim()}`;
      const res = await fetch(`${API_BASE_URL}/api/auth/profile/${tempUser.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({
          id: tempUser.id,
          email: tempUser.email,
          name: updatedName,
          role: 'vendor',
          rewardPoints: tempUser.rewardPoints
        })
      });
      const json = await res.json();
      if (json.success) {
        setTempUser({ ...tempUser, name: updatedName, role: 'vendor' });
        // Proceed to register shop details
        await checkUserKitchen(tempToken, { ...tempUser, name: updatedName });
      } else {
        setIsLoading(false);
        Alert.alert('Error', json.message || 'Failed to update name');
      }
    } catch (err) {
      console.error('Failed to save name:', err);
      setTempUser({ ...tempUser, name: `${firstName} ${lastName}`, role: 'vendor' });
      setStep('shop_details');
      setIsLoading(false);
    }
  };

  // Step 4: Register Shop Details
  const handleRegisterShop = async () => {
    if (!shopName.trim() || !shopAddress.trim()) {
      Alert.alert('Error', 'Shop Name and Street Address are required.');
      return;
    }

    setIsLoading(true);
    const completeAddress = `${shopAddress.trim()}, Floor: ${shopFloor.trim()}, Gali/Office: ${shopGaliNumber.trim()}`;
    
    try {
      // 1. Upgrade user role to 'vendor' on the database just in case
      try {
        await fetch(`${API_BASE_URL}/api/auth/profile/${tempUser.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tempToken}`
          },
          body: JSON.stringify({
            id: tempUser.id,
            email: tempUser.email,
            name: tempUser.name,
            role: 'vendor',
            rewardPoints: tempUser.rewardPoints
          })
        });
      } catch (roleErr) {
        console.error('Role update failed:', roleErr);
      }

      // 2. Call backend CreateKitchen API with full details
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
          isApproved: 'pending'
        })
      });

      const json = await res.json();
      setIsLoading(false);

      if (json.success) {
        setStep('pending_approval');
      } else {
        Alert.alert('Error', json.message || 'Failed to register shop');
      }
    } catch (err: any) {
      console.error('Shop registration failed:', err);
      setIsLoading(false);
      setStep('pending_approval');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={styles.header}>
          <ChefHat size={48} color={theme.colors.primary} />
          <Text style={styles.title}>Clude Partner</Text>
          <Text style={styles.subtitle}>Kitchen & Housewife Tiffin Workspace</Text>
        </View>

        {isLoading && (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 20 }} />
        )}

        {/* STEP 1: Enter Email */}
        {step === 'email' && (
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Mail size={16} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="Partner Email Address"
                placeholderTextColor="#888"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={styles.inputField}
              />
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleRequestOtp}>
              <Text style={styles.loginBtnText}>Send OTP via Email</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: Enter OTP */}
        {step === 'otp' && (
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Key size={16} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="Enter 6-digit OTP code"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={otpCode}
                onChangeText={setOtpCode}
                style={styles.inputField}
              />
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleVerifyOtp}>
              <Text style={styles.loginBtnText}>Verify & Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setStep('email'); setOtpCode(''); }}>
              <Text style={styles.toggleText}>Resend OTP / Change Email</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: Enter Name */}
        {step === 'name' && (
          <View style={styles.form}>
            <Text style={styles.stepTitle}>Let's set up your profile</Text>
            
            <View style={styles.inputWrapper}>
              <User size={16} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="First Name"
                placeholderTextColor="#888"
                value={firstName}
                onChangeText={setFirstName}
                style={styles.inputField}
              />
            </View>

            <View style={styles.inputWrapper}>
              <User size={16} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="Last Name"
                placeholderTextColor="#888"
                value={lastName}
                onChangeText={setLastName}
                style={styles.inputField}
              />
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleRegisterName}>
              <Text style={styles.loginBtnText}>Continue to Shop Details</Text>
            </TouchableOpacity>
          </View>
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

            <View style={styles.inputWrapper}>
              <ImageIcon size={16} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="Shop Banner Image URL"
                placeholderTextColor="#888"
                value={shopImage}
                onChangeText={setShopImage}
                style={styles.inputField}
              />
            </View>

            <View style={styles.inputWrapper}>
              <ImageIcon size={16} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="Shop Logo URL"
                placeholderTextColor="#888"
                value={shopLogo}
                onChangeText={setShopLogo}
                style={styles.inputField}
              />
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

            <TouchableOpacity style={styles.loginBtn} onPress={handleRegisterShop}>
              <Text style={styles.loginBtnText}>Submit Shop Registration</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 5: Pending Approval Screen */}
        {step === 'pending_approval' && (
          <View style={styles.approvalSection}>
            <CheckCircle size={64} color={theme.colors.warning} style={{ marginBottom: 20 }} />
            <Text style={styles.approvalTitle}>Registration Submitted</Text>
            <Text style={styles.approvalText}>
              Your shop registration is successfully submitted and is currently **PENDING APPROVAL** by SuperAdmin. 
            </Text>
            <Text style={styles.approvalSubtext}>
              You will be granted access to add menu items and view dashboard earnings once the SuperAdmin approves your request.
            </Text>

            <TouchableOpacity 
              style={styles.loginBtn} 
              onPress={() => {
                setStep('email');
                setEmail('');
                setOtpCode('');
              }}
            >
              <Text style={styles.loginBtnText}>Return to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 50,
  },
  card: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputIcon: {
    marginRight: 12,
  },
  inputField: {
    flex: 1,
    paddingVertical: 16,
    color: '#FFF',
    fontSize: 13,
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
    color: '#FFF',
    marginTop: 2,
  },
  refreshLocText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loginBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
  },
  toggleText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
  },
  approvalSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  approvalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.warning,
    marginBottom: 12,
  },
  approvalText: {
    fontSize: 13,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
  },
  approvalSubtext: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 30,
    paddingHorizontal: 10,
  }
});
