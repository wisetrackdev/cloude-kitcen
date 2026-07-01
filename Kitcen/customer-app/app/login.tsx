import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Lock, Key, Camera, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../styles/theme';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../store/apiConfig';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isOtpFlow, setIsOtpFlow] = useState(true); // Default to OTP verification as requested
  const [isLoading, setIsLoading] = useState(false);

  // Profile completion states (Zomato-style onboarding)
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [tempRefreshToken, setTempRefreshToken] = useState('');
  const [tempUser, setTempUser] = useState<any>(null);

  // Email OTP - Requesting OTP code
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
        setOtpSent(true);
        Alert.alert('OTP Sent', json.message);
      } else {
        Alert.alert('Error', json.message || 'Failed to request OTP');
      }
    } catch (err: any) {
      console.warn('API connection failed, using mock fallback:', err.message);
      setIsLoading(false);
      
      // Fallback behavior
      setOtpSent(true);
      Alert.alert('Offline Mode', 'API offline. Using simulated OTP: "123456"');
    }
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
        setAvatar(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Camera failed:', err);
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  // Complete Profile
  const handleCompleteProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First Name and Last Name are required');
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
          avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
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
          role: updatedUser.role,
          rewardPoints: updatedUser.rewardPoints
        });
        Alert.alert('Welcome', 'Profile completed successfully!', [{ text: 'OK', onPress: () => router.replace('/') }]);
      } else {
        Alert.alert('Error', json.message || 'Failed to complete profile');
      }
    } catch (err: any) {
      console.warn('Profile completion API failed, doing mock fallback:', err.message);
      setIsLoading(false);
      
      // Fallback
      setAuth(tempToken, tempRefreshToken, {
        id: tempUser.id,
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email,
        avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        role: tempUser.role,
        rewardPoints: 10
      });
      Alert.alert('Welcome (Offline)', 'Profile Setup Completed offline!', [{ text: 'OK', onPress: () => router.replace('/') }]);
    }
  };

  // Email OTP - Verifying OTP code
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
      setIsLoading(false);

      if (json.success) {
        const { token, refreshToken, user, isNewUser } = json.data;
        if (isNewUser) {
          setTempToken(token);
          setTempRefreshToken(refreshToken);
          setTempUser(user);
          setShowCompleteProfile(true);
        } else {
          setAuth(token, refreshToken, {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            avatar: user.avatar || '',
            role: user.role,
            rewardPoints: user.rewardPoints
          });
          Alert.alert('Welcome', 'Login successful!', [{ text: 'OK', onPress: () => router.replace('/') }]);
        }
      } else {
        Alert.alert('Error', json.message || 'Verification failed');
      }
    } catch (err: any) {
      console.warn('API verify failed, doing mock fallback:', err.message);
      setIsLoading(false);

      // Offline fallback
      if (otpCode === '123456' || otpCode === '782910') {
        const parts = email.split('@')[0].split('.');
        const mockFirstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        const mockLastName = parts.length > 1 ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'User';
        const isMockNew = email.includes('new') || email.includes('test');

        const mockUser = {
          id: 'usr-9281',
          name: '',
          email: email,
          role: 'customer',
          rewardPoints: 10
        };

        if (isMockNew) {
          setTempToken('mock_token');
          setTempRefreshToken('mock_refresh');
          setTempUser(mockUser);
          setShowCompleteProfile(true);
        } else {
          setAuth('mock_token', 'mock_refresh', {
            id: 'usr-9281',
            name: `${mockFirstName} ${mockLastName}`,
            email: email,
            role: 'customer',
            rewardPoints: 10
          });
          Alert.alert('Welcome (Offline)', 'Offline Login Successful!', [{ text: 'OK', onPress: () => router.replace('/') }]);
        }
      } else {
        Alert.alert('Error', 'Invalid OTP code. Try "123456"');
      }
    }
  };

  // Traditional Email/Password Login
  const handleCredentialsLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    // Simulate login for credentials, set user profile
    setAuth('mock_access_token', 'mock_refresh_token', {
      id: 'usr-9281',
      name: 'Sneha Mehta',
      email: email,
      phone: '+91 9876543210',
      role: 'customer',
      rewardPoints: 120
    });
    Alert.alert('Welcome', 'Login successful!', [{ text: 'OK', onPress: () => router.replace('/') }]);
  };

  const handleSocialLogin = (provider: string) => {
    setAuth('mock_access_token', 'mock_refresh_token', {
      id: 'usr-9281',
      name: 'Google User',
      email: 'user@gmail.com',
      role: 'customer',
      rewardPoints: 0
    });
    Alert.alert('Welcome', `${provider} login successful!`, [{ text: 'OK', onPress: () => router.replace('/') }]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Login</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Clude Kitchen</Text>
        <Text style={styles.subtitle}>Log in to unlock chef specials and rewards</Text>

        {isLoading && (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 20 }} />
        )}

        {isOtpFlow ? (
          // OTP login flow
          <View style={styles.fieldSection}>
            {!otpSent ? (
              <>
                <View style={styles.inputWrapper}>
                  <Mail size={16} color={theme.colors.textSecondary} />
                  <TextInput
                    placeholder="Enter email address"
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
              </>
            ) : showCompleteProfile ? (
              <>
                <View style={styles.inputWrapper}>
                  <Key size={16} color={theme.colors.textSecondary} />
                  <TextInput
                    placeholder="Enter 6-digit OTP code"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    value={otpCode}
                    editable={false}
                    style={[styles.input, { opacity: 0.6 }]}
                  />
                </View>

                {/* Profile Completion Form (Expands below OTP input) */}
                <View style={{ width: '100%', marginTop: 10 }}>
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

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10, paddingHorizontal: 4 }}>
                    {avatar ? (
                      <Text style={{ color: '#2ecc71', fontSize: 13, fontWeight: 'bold' }}>✓ Photo Captured</Text>
                    ) : (
                      <Text style={{ color: '#888', fontSize: 13 }}>No photo captured</Text>
                    )}
                    <TouchableOpacity 
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        backgroundColor: '#2c2c2c', 
                        paddingHorizontal: 12, 
                        paddingVertical: 8, 
                        borderRadius: 6 
                      }} 
                      onPress={captureProfileImage}
                    >
                      <Camera size={14} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>Click Photo</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={[styles.primaryBtn, { marginTop: 10 }]} onPress={handleCompleteProfile}>
                    <Text style={styles.primaryBtnText}>Complete Profile</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputWrapper}>
                  <Key size={16} color={theme.colors.textSecondary} />
                  <TextInput
                    placeholder="Enter 6-digit OTP code"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    style={styles.input}
                  />
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp}>
                  <Text style={styles.primaryBtnText}>Verify & Log In</Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity onPress={() => { setIsOtpFlow(false); setOtpSent(false); }}>
              <Text style={styles.toggleText}>Use Email & Password instead</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Email/password login flow
          <View style={styles.fieldSection}>
            <View style={styles.inputWrapper}>
              <Mail size={16} color={theme.colors.textSecondary} />
              <TextInput
                placeholder="Email address"
                placeholderTextColor="#888"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock size={16} color={theme.colors.textSecondary} />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleCredentialsLogin}>
              <Text style={styles.primaryBtnText}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setIsOtpFlow(true); setOtpSent(false); }}>
              <Text style={styles.toggleText}>Login with Email OTP verification</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Social logins */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR CONNECT WITH</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialButtonsRow}>
          <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialLogin('Google')}>
            <Text style={styles.socialBtnText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialLogin('Apple')}>
            <Text style={styles.socialBtnText}>Apple</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  formContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  fieldSection: {
    spaceY: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    marginLeft: 12,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 12,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  toggleText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1F1F1F',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginHorizontal: 16,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialBtn: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  socialBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  }
});
