import React, { useState } from 'react';
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
import { Users, Mail, Key, User, Camera, ArrowLeft } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../store/apiConfig';
import * as ImagePicker from 'expo-image-picker';

type LoginStep = 'email' | 'otp' | 'name';

export default function AdminLoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  const [step, setStep] = useState<LoginStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  // Basic Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [tempRefreshToken, setTempRefreshToken] = useState('');
  const [tempUser, setTempUser] = useState<any>(null);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);

  // Alert Selector (Camera or Gallery)
  const requestPhotoSource = () => {
    Alert.alert(
      'Profile Photo Source',
      'Select how you want to upload your photo:',
      [
        {
          text: 'Camera (Take Photo)',
          onPress: captureProfileImage
        },
        {
          text: 'Gallery (Choose from Library)',
          onPress: pickProfileImageFromGallery
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  // Capture Profile Image via Camera
  const captureProfileImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permissions are required to take a profile picture.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Camera failed:', err);
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  // Pick Profile Image from Gallery
  const pickProfileImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery permissions are required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Gallery failed:', err);
      Alert.alert('Gallery Error', 'Could not open photo library.');
    }
  };

  // Step 1: Send OTP
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
      console.warn('API offline, using fallback:', err.message);
      setIsLoading(false);
      setStep('otp');
      Alert.alert('Offline Mode', 'Simulated OTP: "123456"');
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
        id: 'usr-admin-7711',
        name: '',
        email: email,
        role: 'superadmin',
        rewardPoints: 100
      };

      setTempToken('mock_token');
      setTempRefreshToken('mock_refresh');
      setTempUser(mockUser);

      if (isMockNew) {
        setShowCompleteProfile(true);
      } else {
        setAuth('mock_token', 'mock_refresh', {
          id: 'usr-admin-7711',
          name: 'Super Admin',
          email: email,
          role: 'superadmin',
          rewardPoints: 100
        });
        Alert.alert('Authentication Successful', 'Welcome SuperAdmin!', [
          { text: 'OK', onPress: () => router.replace('/') }
        ]);
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
          // Complete login and store session
          setAuth(token, refreshToken, {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            avatar: user.avatar || '',
            role: 'superadmin',
            rewardPoints: user.rewardPoints
          });
          setIsLoading(false);
          Alert.alert('Authentication Successful', 'Welcome SuperAdmin!', [
            { text: 'OK', onPress: () => router.replace('/') }
          ]);
        }
      } else {
        setIsLoading(false);
        Alert.alert('Error', json.message || 'Verification failed');
      }
    } catch (err: any) {
      console.warn('Verify failed, doing fallback:', err.message);
      setIsLoading(false);
      Alert.alert('Error', 'Verification failed and could not connect to server.');
    }
  };

  // Step 3: Register Basic Details (First & Last Name) - POST complete-profile
  const handleRegisterAdminDetails = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter your first and last name');
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
          avatar: profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
        })
      });
      const json = await res.json();
      setIsLoading(false);

      if (json.success) {
        const updatedUser = json.data;
        setAuth(tempToken, tempRefreshToken, {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone || '',
          avatar: updatedUser.avatar || '',
          role: 'superadmin',
          rewardPoints: updatedUser.rewardPoints
        });
        Alert.alert('Authentication Successful', 'Welcome SuperAdmin!', [
          { text: 'OK', onPress: () => router.replace('/') }
        ]);
      } else {
        Alert.alert('Error', json.message || 'Failed to update details');
      }
    } catch (err) {
      console.error('Failed to save details:', err);
      setIsLoading(false);
      const updatedName = `${firstName.trim()} ${lastName.trim()}`;
      setAuth(tempToken, tempRefreshToken, {
        id: tempUser.id,
        name: updatedName,
        email: tempUser.email,
        phone: tempUser.phone || '',
        avatar: profileImage || tempUser.avatar || '',
        role: 'superadmin',
        rewardPoints: tempUser.rewardPoints
      });
      Alert.alert('Authentication Successful (Offline Mode)', 'Welcome SuperAdmin!', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Gold Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Control Login</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Form Area in White Rounded Card */}
      <View style={styles.formContainer}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Users size={48} color="#FFB300" style={{ alignSelf: 'center', marginBottom: 12 }} />
          <Text style={styles.title}>Clude Control</Text>
          <Text style={styles.subtitle}>Super Admin Panel Authenticator</Text>

          {isLoading && (
            <ActivityIndicator size="large" color="#FFB300" style={{ marginBottom: 20 }} />
          )}

          {/* STEP 1: Enter Email */}
          {step === 'email' && (
            <View style={styles.fieldSection}>
              <View style={styles.inputWrapper}>
                <Mail size={16} color="#888" />
                <TextInput
                  placeholder="Admin Email Address"
                  placeholderTextColor="#888"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                />
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleRequestOtp}>
                <Text style={styles.primaryBtnText}>Request OTP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Enter OTP / Name Details */}
          {step === 'otp' && (
            <View style={styles.fieldSection}>
              <View style={styles.inputWrapper}>
                <Key size={16} color="#888" />
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
                <View style={{ width: '100%', marginTop: 10 }}>
                  <Text style={{ color: '#FFB300', fontWeight: 'bold', fontSize: 15, marginBottom: 12, textAlign: 'center' }}>
                    Complete Profile
                  </Text>
                  
                  <View style={styles.inputWrapper}>
                    <User size={16} color="#888" />
                    <TextInput
                      placeholder="First Name"
                      placeholderTextColor="#888"
                      value={firstName}
                      onChangeText={setFirstName}
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <User size={16} color="#888" />
                    <TextInput
                      placeholder="Last Name"
                      placeholderTextColor="#888"
                      value={lastName}
                      onChangeText={setLastName}
                      style={styles.input}
                    />
                  </View>

                  {/* Profile Photo Selector (Open Dialog) */}
                  <View style={styles.captureContainer}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#333' }}>Profile Photo</Text>
                      {profileImage ? (
                        <Text style={{ fontSize: 10, color: '#2ecc71', marginTop: 2 }}>✓ Image Selected</Text>
                      ) : (
                        <Text style={{ fontSize: 10, color: '#888', marginTop: 2 }}>No photo selected</Text>
                      )}
                    </View>
                    <TouchableOpacity style={styles.captureBtn} onPress={requestPhotoSource}>
                      <Camera size={14} color="#FFB300" style={{ marginRight: 6 }} />
                      <Text style={styles.captureBtnText}>Upload Photo</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.primaryBtn} onPress={handleRegisterAdminDetails}>
                    <Text style={styles.primaryBtnText}>Submit & Access Panel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp}>
                    <Text style={styles.primaryBtnText}>Verify OTP</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => { setStep('email'); setOtpCode(''); }}>
                    <Text style={styles.toggleText}>Change Email</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </ScrollView>
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
    color: '#FFB300', // Golden amber primary theme
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
  input: {
    flex: 1,
    color: '#333',
    fontSize: 13,
    marginLeft: 12,
  },
  primaryBtn: {
    backgroundColor: '#FFB300', // Golden amber primary theme button
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
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,179,0,0.1)',
    borderWidth: 1,
    borderColor: '#FFB300',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  captureBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFB300',
  }
});
