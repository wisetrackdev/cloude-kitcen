import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Users, Mail, Lock } from 'lucide-react-native';
import { theme } from '../styles/theme';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleCredentialsLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    Alert.alert('Welcome Admin', 'Super Admin authentication successful!', [{ text: 'OK', onPress: () => router.replace('/') }]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Users size={48} color={theme.colors.primary} />
        <Text style={styles.title}>Clude Admin</Text>
        <Text style={styles.subtitle}>Super Admin Panel Control Center</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Admin Email Address"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          style={styles.inputField}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.inputField}
        />

        <TouchableOpacity style={styles.loginBtn} onPress={handleCredentialsLogin}>
          <Text style={styles.loginBtnText}>Authenticate Admin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
  inputField: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 13,
    marginBottom: 16,
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
  }
});
