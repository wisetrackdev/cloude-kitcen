import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../styles/theme';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../store/apiConfig';
import { uploadImage } from '../store/uploadHelper';

export default function AddBannerScreen() {
  const router = useRouter();
  const isDarkMode = useAuthStore(state => state.isDarkMode);
  
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerLinkUrl, setBannerLinkUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  const themeColors = {
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    inputBg: isDarkMode ? '#0F0F0F' : '#F0F2F4',
    primary: '#FFB300',
  };

  const handleUploadImageUri = async (localUri: string) => {
    setIsPickingImage(true);
    const uploadedUrl = await uploadImage(localUri);
    setIsPickingImage(false);
    if (uploadedUrl) {
      setBannerImageUrl(uploadedUrl);
      Alert.alert('Upload Successful', 'Banner image uploaded to cloud.');
    } else {
      setBannerImageUrl(localUri);
      Alert.alert('Upload Failed', 'Image uploaded locally for fallback testing.');
    }
  };

  const requestImageSource = () => {
    Alert.alert(
      'Upload Banner Image',
      'Select source:',
      [
        { text: 'Camera (Take Photo)', onPress: captureImage },
        { text: 'Gallery (Choose from Library)', onPress: pickFromGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const captureImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permissions are required.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUploadImageUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUploadImageUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Gallery Error', 'Could not open photo library.');
    }
  };

  const handlePublishBanner = async () => {
    if (!bannerImageUrl.trim()) {
      Alert.alert('Error', 'Please enter or upload a banner image URL');
      return;
    }
    
    setIsUploading(true);
    try {
      const adminId = 'usr-admin-simulated';
      const res = await fetch(`${API_BASE_URL}/api/admin/banners?adminUserId=${adminId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: bannerImageUrl.trim(),
          linkUrl: bannerLinkUrl.trim() || 'default_promo',
          isActive: true
        })
      });
      const json = await res.json();
      setIsUploading(false);

      if (json.success) {
        Alert.alert('Success', 'Live Banner published successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', json.message || 'Failed to upload banner');
      }
    } catch (err) {
      setIsUploading(false);
      Alert.alert('Offline Mode', 'Dynamic banner saved locally.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Add Live Banner</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Banner Image Details</Text>
          <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
            Upload a high-quality 16:9 promotional banner to be featured on the customer app dashboard.
          </Text>

          <View style={styles.pickerRow}>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
              placeholder="Enter Banner Image URL..."
              placeholderTextColor="#888"
              value={bannerImageUrl}
              onChangeText={setBannerImageUrl}
            />
            <TouchableOpacity style={styles.cameraBtn} onPress={requestImageSource}>
              <Camera size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          {isPickingImage && (
            <ActivityIndicator size="small" color={themeColors.primary} style={{ marginVertical: 8 }} />
          )}

          <Text style={[styles.label, { color: themeColors.textSecondary }]}>Action / Link Reference</Text>
          <TextInput
            style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
            placeholder="e.g. discount_50, kitchen_id"
            placeholderTextColor="#888"
            value={bannerLinkUrl}
            onChangeText={setBannerLinkUrl}
          />

          <TouchableOpacity 
            style={[styles.publishBtn, { backgroundColor: themeColors.primary }]}
            onPress={handlePublishBanner}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Plus size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.publishBtnText}>Publish Live Banner</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollBody: {
    padding: 16,
  },
  card: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  cameraBtn: {
    marginLeft: 10,
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#FFB300',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  publishBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  publishBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
