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
  Home, 
  ChefHat, 
  Heart, 
  FileText, 
  Headphones 
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

  const handleSkip = () => {
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      {/* Yellow/Gold Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/login')}>
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Your Fingerprint</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main White Card body */}
      <View style={styles.cardContainer}>
        <Text style={styles.description}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore.
        </Text>

        {/* Scanner Container */}
        <View style={styles.scannerWrapper}>
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={startScanning}
            style={[
              styles.fingerprintCircle,
              isRegistered && styles.fingerprintCircleRegistered
            ]}
          >
            {isScanning ? (
              <ActivityIndicator size="large" color="#FFB300" />
            ) : (
              <Fingerprint 
                size={140} 
                color={isRegistered ? "#FFB300" : "#FCD5C5"} 
                strokeWidth={1.5}
              />
            )}
          </TouchableOpacity>
          <Text style={styles.scannerStatus}>
            {isScanning 
              ? "Scanning fingerprint... keep touching" 
              : isRegistered 
              ? "Fingerprint Registered!" 
              : "Touch fingerprint sensor to register"}
          </Text>
        </View>

        {/* Buttons Row */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.continueButton, isRegistered && styles.continueButtonActive]} 
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Mock Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Home size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <ChefHat size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Heart size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <FileText size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Headphones size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFCC00', // Gold/yellow top background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
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
    fontFamily: 'System',
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#F5F5F7', // Crisp light background like mockups
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 35,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  scannerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  fingerprintCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFB300',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  fingerprintCircleRegistered: {
    shadowOpacity: 0.15,
    shadowRadius: 20,
    borderColor: 'rgba(255, 107, 0, 0.2)',
  },
  scannerStatus: {
    fontSize: 13,
    color: '#999',
    marginTop: 24,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  skipButton: {
    flex: 1,
    marginRight: 12,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFEFEB', // Light peach background
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFB300', // Orange text
  },
  continueButton: {
    flex: 1.2,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E43B3F', // Lightened default primary red/orange
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  continueButtonActive: {
    backgroundColor: '#FFB300', // Active bold orange/red
    opacity: 1,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  bottomTabBar: {
    height: 75,
    backgroundColor: '#FFB300', // Bottom tab bar background matching mockup scheme
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 15,
  },
  tabItem: {
    padding: 10,
  }
});
