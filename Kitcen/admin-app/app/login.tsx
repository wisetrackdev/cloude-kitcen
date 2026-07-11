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
import { Mail, Key, User, ArrowLeft, Smartphone, Camera, FileText } from 'lucide-react-native';
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

  // Flow State
  const [tempToken, setTempToken] = useState('');
  const [tempRefreshToken, setTempRefreshToken] = useState('');
  const [tempUser, setTempUser] = useState<any>(null);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);

  // Profile Inputs
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [upiNumber, setUpiNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

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
          phone: '8527430152',
          avatar: '',
          role: 'superadmin',
          rewardPoints: 100,
          upiNumber: '8527430152',
          upiId: '8527430152@slc',
          bankName: 'State Bank of India',
          accountNumber: '30948576291',
          ifscCode: 'SBIN0001043'
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

        // Force complete profile if user's name or bank details are missing
        const isProfileIncomplete = !user.firstName || !user.lastName || !user.bankName || !user.accountNumber || !user.upiId;
        if (isNewUser || isProfileIncomplete) {
          setIsLoading(false);
          setShowCompleteProfile(true);
        } else {
          setAuth(token, refreshToken, {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            avatar: user.avatar || '',
            role: 'superadmin',
            rewardPoints: user.rewardPoints,
            upiNumber: user.upiNumber,
            upiId: user.upiId,
            bankName: user.bankName,
            accountNumber: user.accountNumber,
            ifscCode: user.ifscCode
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

  const handleCompleteProfile = async () => {
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim() || !bankName.trim() || !accountNumber.trim() || !ifscCode.trim() || !upiId.trim() || !upiNumber.trim()) {
      Alert.alert('Error', 'All profile, bank, and UPI details are mandatory.');
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
          avatar: profileImage.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
          phone: phoneNumber.trim(),
          role: 'superadmin',
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
        const updatedUser = json.data;
        setAuth(tempToken, tempRefreshToken, updatedUser);
        Alert.alert('Success', 'Profile completed successfully!', [
          { text: 'OK', onPress: () => router.replace('/fingerprint') }
        ]);
      } else {
        Alert.alert('Error', json.message || 'Failed to complete profile');
      }
    } catch (err) {
      setIsLoading(false);
      const mockUpdated = {
        id: tempUser.id,
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: tempUser.email,
        phone: phoneNumber.trim(),
        avatar: profileImage.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
        role: 'superadmin',
        rewardPoints: 100,
        upiNumber: upiNumber.trim(),
        upiId: upiId.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim()
      };
      setAuth(tempToken, tempRefreshToken, mockUpdated);
      Alert.alert('Offline Mode', 'Profile completed locally.', [
        { text: 'OK', onPress: () => router.replace('/fingerprint') }
      ]);
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

                {/* UPI Number */}
                <View style={styles.inputWrapper}>
                  <Smartphone size={16} color={theme.colors.textSecondary} />
                  <TextInput
                    placeholder="UPI Mobile Number"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    value={upiNumber}
                    onChangeText={setUpiNumber}
                    style={styles.input}
                  />
                </View>

                {/* UPI ID */}
                <View style={styles.inputWrapper}>
                  <FileText size={16} color={theme.colors.textSecondary} />
                  <TextInput
                    placeholder="UPI ID (e.g. name@paytm)"
                    placeholderTextColor="#888"
                    autoCapitalize="none"
                    value={upiId}
                    onChangeText={setUpiId}
                    style={styles.input}
                  />
                </View>

                {/* Bank Name */}
                <View style={styles.inputWrapper}>
                  <FileText size={16} color={theme.colors.textSecondary} />
                  <TextInput
                    placeholder="Bank Name (e.g. State Bank of India)"
                    placeholderTextColor="#888"
                    value={bankName}
                    onChangeText={setBankName}
                    style={styles.input}
                  />
                </View>

                {/* Bank Account Number */}
                <View style={styles.inputWrapper}>
                  <FileText size={16} color={theme.colors.textSecondary} />
                  <TextInput
                    placeholder="Bank Account Number"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    style={styles.input}
                  />
                </View>

                {/* IFSC Code */}
                <View style={styles.inputWrapper}>
                  <FileText size={16} color={theme.colors.textSecondary} />
                  <TextInput
                    placeholder="IFSC Code"
                    placeholderTextColor="#888"
                    autoCapitalize="characters"
                    value={ifscCode}
                    onChangeText={setIfscCode}
                    style={styles.input}
                  />
                </View>

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 15 }]} onPress={handleCompleteProfile}>
                  <Text style={styles.primaryBtnText}>Complete Profile Setup</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp}>
                  <Text style={styles.primaryBtnText}>Verify & Log In</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setStep('email'); setOtpCode(''); }}>
                  <Text style={styles.toggleText}>Change Email</Text>
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
