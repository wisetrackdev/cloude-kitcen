import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { safeStorage } from '../store/safeStorage';
import * as LocalAuthentication from 'expo-local-authentication';
import { 
  ArrowLeft, 
  Fingerprint, 
  ShieldCheck
} from 'lucide-react-native';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

export default function FingerprintScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const startScanning = async () => {
    if (isRegistered) {
      Alert.alert('Registered', 'Fingerprint has already been registered.');
      return;
    }
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Biometrics Not Found',
          'No enrolled fingerprint/biometrics found on your device. Would you like to simulate a fingerprint setup for testing?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Simulate Setup', 
              onPress: async () => {
                setIsScanning(true);
                setTimeout(async () => {
                  setIsScanning(false);
                  setIsRegistered(true);
                  await safeStorage.setItem('isFingerprintEnabled', 'true');
                  Alert.alert('Simulated Success', 'Fingerprint simulated and enabled successfully!');
                }, 1200);
              }
            }
          ]
        );
        return;
      }

      setIsScanning(true);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Place your finger on the scanner to register',
        fallbackLabel: 'Use Passcode',
      });
      setIsScanning(false);

      if (result.success) {
        setIsRegistered(true);
        await safeStorage.setItem('isFingerprintEnabled', 'true');
        Alert.alert('Success', 'Biometric lock enabled successfully!');
      } else {
        Alert.alert('Failed', 'Biometric verification failed.');
      }
    } catch (err) {
      console.warn(err);
      setIsScanning(false);
      Alert.alert('Error', 'Failed to initialize biometric hardware.');
    }
  };

  const handleContinue = () => {
    if (!isRegistered) {
      Alert.alert(
        'Register Fingerprint',
        'Please touch the fingerprint scanner to scan your fingerprint first, or tap Skip.',
        [
          { text: 'Scan Now', onPress: startScanning },
          { text: 'Skip', onPress: () => router.replace('/') }
        ]
      );
      return;
    }
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Your Fingerprint</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <View style={[
            styles.fingerprintCircle,
            isRegistered && styles.fingerprintCircleRegistered
          ]}>
            <Fingerprint 
              size={100} 
              color={isRegistered ? '#34C759' : isScanning ? '#FFCC00' : '#FFB300'} 
              strokeWidth={1.5} 
            />
          </View>
          <Text style={styles.statusTitle}>
            {isScanning 
              ? "Scanning fingerprint... keep touching" 
              : isRegistered 
              ? "Fingerprint Registered!" 
              : "Touch fingerprint sensor to register"}
          </Text>
          <Text style={styles.statusSubtitle}>
            Adding biometrics makes your Admin workspace secure and enables quick login next time.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.btnGroup}>
          {!isRegistered && (
            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.scanButton} 
              onPress={startScanning}
            >
              {isScanning ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.scanButtonText}>Register Fingerprint</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.continueButton, !isRegistered && styles.skipBtn]} 
            onPress={handleContinue}
          >
            <Text style={[styles.continueBtnText, !isRegistered && { color: '#8E8E93' }]}>
              {isRegistered ? 'Continue' : 'Skip Setup'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#1F1F1F',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerprintCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 179, 0, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 179, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#FFB300',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  fingerprintCircleRegistered: {
    backgroundColor: 'rgba(52, 199, 89, 0.05)',
    borderColor: 'rgba(52, 199, 89, 0.2)',
    shadowColor: '#34C759',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  btnGroup: {
    gap: 12,
  },
  scanButton: {
    backgroundColor: '#FFB300',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
  },
  continueBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  }
});
