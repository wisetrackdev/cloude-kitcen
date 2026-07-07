import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  BackHandler
} from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { safeStorage } from '../store/safeStorage';
import { Fingerprint, Lock, LogOut } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';

export default function LockScreen() {
  const router = useRouter();
  const logoutUser = useAuthStore(state => state.logout);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Automatically trigger biometrics on mount
    triggerBiometricAuth();

    // Prevent Android hardware back button from closing lock screen
    const backAction = () => {
      Alert.alert("App Locked", "Please authenticate to open the application.", [
        { text: "OK", style: "cancel" }
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const triggerBiometricAuth = async () => {
    try {
      setIsAuthenticating(true);
      
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Not Supported', 'Your device does not support biometric authentication.');
        setIsAuthenticating(false);
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert('No Biometrics Found', 'Please set up fingerprint or face authentication on your phone first.');
        setIsAuthenticating(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to unlock Clude Rider',
        fallbackLabel: 'Enter Passcode',
        disableDeviceFallback: false,
      });

      setIsAuthenticating(false);

      if (result.success) {
        router.replace('/');
      } else {
        console.log('Biometric auth failed or cancelled');
      }
    } catch (err) {
      console.warn('Biometric error:', err);
      setIsAuthenticating(false);
      Alert.alert('Authentication Error', 'Biometric login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out and disable fingerprint lock?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            await safeStorage.removeItem('isFingerprintEnabled');
            logoutUser();
            router.replace('/login');
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.lockIconWrapper}>
          <Lock size={32} color="#FFF" />
        </View>
        
        <Text style={styles.title}>Clude Rider Locked</Text>
        <Text style={styles.subtitle}>Unlock using your phone fingerprint</Text>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={triggerBiometricAuth}
          style={[styles.scannerButton, isAuthenticating && styles.scannerButtonLoading]}
        >
          {isAuthenticating ? (
            <ActivityIndicator size="large" color="#FFCC00" />
          ) : (
            <Fingerprint size={80} color="#FFB300" strokeWidth={1.5} />
          )}
        </TouchableOpacity>

        <Text style={styles.statusText}>
          {isAuthenticating ? 'Waiting for biometric sensor...' : 'Tap icon to scan fingerprint'}
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={16} color="#FF3B30" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Switch Account / Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'space-between',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 60,
  },
  scannerButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#1F1F1F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFB300',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  scannerButtonLoading: {
    borderColor: '#FFCC00',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    marginTop: 20,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
