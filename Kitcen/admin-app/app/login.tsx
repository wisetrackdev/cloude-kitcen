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
import { Users, Mail, Key, User, Camera } from 'lucide-react-native';
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
          { text: 'OK', onPress: () => router.replace('/fingerprint') }
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
            { text: 'OK', onPress: () => router.replace('/fingerprint') }
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
          { text: 'OK', onPress: () => router.replace('/fingerprint') }
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
        { text: 'OK', onPress: () => router.replace('/fingerprint') }
      ]);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Users size={48} color={theme.colors.primary} />
        <Text style={styles.title}>Clude Admin Control</Text>
        <Text style={styles.subtitle}>Super Admin Panel Authenticator</Text>
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
              placeholder="Admin Email Address"
              placeholderTextColor="#888"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.inputField}
            />
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleRequestOtp}>
            <Text style={styles.loginBtnText}>Request OTP</Text>
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
              editable={!showCompleteProfile}
              style={[styles.inputField, showCompleteProfile && { opacity: 0.6 }]}
            />
          </View>

          {showCompleteProfile ? (
            <View style={{ width: '100%', marginTop: 15 }}>
              <Text style={styles.stepTitle}>Enter Basic Details</Text>
              
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

              {/* Profile Photo Capture */}
              <View style={styles.captureContainer}>
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>Profile Photo</Text>
                  {profileImage ? (
                    <Text style={styles.imagePlaceholderSubText} numberOfLines={1}>✓ Clicked: {profileImage.substring(profileImage.lastIndexOf('/') + 1)}</Text>
                  ) : (
                    <Text style={styles.imagePlaceholderSubText}>No photo captured</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.captureBtn} onPress={captureProfileImage}>
                  <Camera size={14} color={theme.colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.captureBtnText}>Open Camera</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.loginBtn, { marginTop: 15 }]} onPress={handleRegisterAdminDetails}>
                <Text style={styles.loginBtnText}>Submit & Access Panel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.loginBtn} onPress={handleVerifyOtp}>
                <Text style={styles.loginBtnText}>Verify OTP</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setStep('email'); setOtpCode(''); }}>
                <Text style={styles.toggleText}>Change Email</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F5F6F8',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E2022',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E2022',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F4',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputField: {
    flex: 1,
    paddingVertical: 16,
    color: '#1E2022',
    fontSize: 13,
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
