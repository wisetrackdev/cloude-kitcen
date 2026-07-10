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
import { Mail, Key, User, ArrowLeft } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../store/apiConfig';

type LoginStep = 'email' | 'otp';

export default function AdminLoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  const [step, setStep] = useState<LoginStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

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
        const { token, refreshToken, user } = json.data;
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Control</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Clude Admin</Text>
        <Text style={styles.subtitle}>Super Admin Panel Authenticator</Text>

        {isLoading && (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 20 }} />
        )}

        {/* STEP 1: Enter Email */}
        {step === 'email' && (
          <View style={styles.fieldSection}>
            <View style={styles.inputWrapper}>
              <Mail size={16} color={theme.colors.textSecondary} />
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

        {/* STEP 2: Enter OTP */}
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
                style={styles.input}
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp}>
              <Text style={styles.primaryBtnText}>Verify & Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setStep('email'); setOtpCode(''); }}>
              <Text style={styles.toggleText}>Change Email</Text>
            </TouchableOpacity>
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
  }
});
