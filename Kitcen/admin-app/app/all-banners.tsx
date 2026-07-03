import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trash2, Image as ImageIcon } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../store/apiConfig';

export default function AllBannersScreen() {
  const router = useRouter();
  const isDarkMode = useAuthStore(state => state.isDarkMode);

  const [banners, setBanners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const themeColors = {
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    primary: '#FFB300',
  };

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/banners`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setBanners(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load dynamic banners:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDeleteBanner = (bannerId: string) => {
    Alert.alert(
      'Delete Banner',
      'Are you sure you want to delete this promotional banner?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Simulate API delete or trigger locally
              setBanners(prev => prev.filter(b => b.id !== bannerId));
              Alert.alert('Deleted', 'Banner deletion is simulated successfully.');
            } catch (err) {
              Alert.alert('Error', 'Could not delete banner.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>All Live Banners</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={{ color: themeColors.textSecondary, marginTop: 10 }}>Loading active banners...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Active Banners ({banners.length})</Text>

          {banners.map((b) => (
            <View key={b.id} style={[styles.bannerCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Image source={{ uri: b.imageUrl }} style={styles.bannerImage} />
              <View style={styles.bannerInfo}>
                <Text style={[styles.linkTitle, { color: themeColors.text }]} numberOfLines={1}>
                  Link: {b.linkUrl || 'None'}
                </Text>
                <Text style={{ color: themeColors.textSecondary, fontSize: 10 }} numberOfLines={1}>
                  ID: {b.id}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteBanner(b.id)} style={styles.deleteBtn}>
                <Trash2 size={18} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}

          {banners.length === 0 && (
            <View style={styles.emptyContainer}>
              <ImageIcon size={44} color={themeColors.textSecondary} style={{ marginBottom: 12 }} />
              <Text style={{ color: themeColors.textSecondary, fontSize: 13 }}>No active banners found.</Text>
            </View>
          )}
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },
  bannerImage: {
    width: 60,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#EEE',
  },
  bannerInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  linkTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  }
});
