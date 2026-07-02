import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  FlatList,
  Modal,
  TextInput,
  Alert,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  MapPin, 
  Search, 
  Star, 
  Clock, 
  ShieldCheck, 
  Mic, 
  Plus, 
  Sparkles,
  Award,
  Gift,
  ShoppingBag,
  Flame
} from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useCartStore } from '../../store/useCartStore';
import { API_BASE_URL } from '../../store/apiConfig';

const mindCategories = [
  { id: '1', name: 'Meals', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120' },
  { id: '2', name: 'Paneer', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=120' },
  { id: '3', name: 'Thali', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=120' },
  { id: '4', name: 'Rolls', image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=120' },
  { id: '5', name: 'Cakes', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=120' }
];

type TopCategory = 'food' | 'instamart' | 'dineout' | 'scenes' | 'giftable';

export default function HomeScreen() {
  const router = useRouter();
  const location = useAuthStore(state => state.location);
  const user = useAuthStore(state => state.user);
  const isDarkMode = useAuthStore(state => state.isDarkMode);
  const detectLocation = useAuthStore(state => state.detectLocation);
  const setAddressName = useAuthStore(state => state.setAddressName);

  const kitchens = useKitchenStore(state => state.kitchens);
  const allProducts = useKitchenStore(state => state.allProducts);
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);
  const fetchAllProducts = useKitchenStore(state => state.fetchAllProducts);

  const addItem = useCartStore(state => state.addItem);
  const cartItems = useCartStore(state => state.items);
  const cartTotals = useCartStore(state => state.getTotals());

  // Home controls
  const [activeCategory, setActiveCategory] = useState<TopCategory>('food');
  const [selectedMindCategory, setSelectedMindCategory] = useState<string | null>(null);
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [newAddressInput, setNewAddressInput] = useState('');

  // Dynamic Banners
  const [liveBanners, setLiveBanners] = useState<any[]>([]);

  // Fetch initial data
  useEffect(() => {
    fetchKitchens();
    fetchAllProducts();
    detectLocation();
    fetchLiveBanners();
  }, []);

  const fetchLiveBanners = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/banners`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setLiveBanners(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load live banners:', err);
    }
  };

  const themeColors = {
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    searchBg: isDarkMode ? '#1C1C1E' : '#FFFFFF'
  };

  const handleAddProductToCart = (prod: any) => {
    const kId = prod.kitchenId || 'shp-seed-10';
    const kName = prod.kitchenName || 'Rumali By Enoki';

    addItem(kId, kName, {
      id: prod.id,
      productId: prod.id,
      name: prod.name,
      price: prod.price,
      image: prod.image
    });

    Alert.alert('Added to Cart', `${prod.name} has been added to your basket!`);
  };

  const handleUpdateAddress = () => {
    if (!newAddressInput.trim()) {
      Alert.alert('Error', 'Please enter a valid address');
      return;
    }
    setAddressName(newAddressInput.trim());
    setAddressModalVisible(false);
    Alert.alert('Address Updated', 'Delivery location changed successfully.');
  };

  const handleDetectLiveAddress = async () => {
    await detectLocation();
    setAddressModalVisible(false);
    Alert.alert('GPS Location', 'Live location detected successfully.');
  };

  // Filtered Products
  const getFilteredDishes = () => {
    let list = allProducts || [];
    if (selectedMindCategory) {
      const catLower = selectedMindCategory.toLowerCase();
      list = list.filter(p => 
        p.category.toLowerCase().includes(catLower) || 
        p.name.toLowerCase().includes(catLower) ||
        (p.desc && p.desc.toLowerCase().includes(catLower))
      );
    }
    if (isVegOnly) {
      list = list.filter(p => p.isVeg);
    }
    return list;
  };

  const filteredDishes = getFilteredDishes();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      
      {/* Top Header Address Bar (Fixed) */}
      <View style={[styles.header, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity 
          style={styles.locationContainer} 
          onPress={() => setAddressModalVisible(true)}
        >
          <MapPin size={18} color="#FF5252" />
          <View style={styles.locationTextContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.locationTitle, { color: themeColors.text }]}>Office</Text>
              <Text style={{ fontSize: 10, color: '#FF5252', marginLeft: 4 }}>▼</Text>
            </View>
            <Text style={[styles.locationName, { color: themeColors.textSecondary }]} numberOfLines={1}>
              {location?.addressName || 'Detecting GPS...'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>LIFETIME FREE</Text>
          </View>
          <TouchableOpacity style={[styles.menuBtn, { backgroundColor: isDarkMode ? '#222' : '#EAEAEA' }]} onPress={() => router.push('/profile')}>
            <View style={[styles.menuLine, { backgroundColor: themeColors.text }]} />
            <View style={[styles.menuLine, { width: 14, backgroundColor: themeColors.text }]} />
            <View style={[styles.menuLine, { backgroundColor: themeColors.text }]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Swiggy-Style Category Tab Slider */}
      <View style={[styles.topTabsContainer, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topTabsScroll}>
          {(['food', 'instamart', 'dineout', 'scenes', 'giftable'] as TopCategory[]).map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity 
                key={cat} 
                style={[
                  styles.topTabBtn, 
                  isActive && { borderBottomColor: '#0C5E37', borderBottomWidth: 3 }
                ]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.topTabLabel, { color: isActive ? '#0C5E37' : themeColors.textSecondary, fontWeight: isActive ? 'bold' : 'normal' }]}>
                  {cat === 'food' ? '🍔 Food' : cat === 'instamart' ? '🛒 Instamart' : cat === 'dineout' ? '🍽 Dineout' : cat === 'scenes' ? '🔮 Scenes' : '🎁 Giftable'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        
        {/* Search Bar Row with Veg Toggle */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: themeColors.searchBg, borderColor: themeColors.border }]}>
            <Search size={18} color="#8E8E93" />
            <TextInput
              placeholder="Search for dishes, rolls, sweets..."
              placeholderTextColor="#8E8E93"
              style={[styles.searchInput, { color: themeColors.text }]}
              onSubmitEditing={() => router.push('/search')}
            />
            <Mic size={18} color="#FF5252" style={{ marginLeft: 8 }} />
          </View>

          <View style={[styles.vegToggleContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.vegText, { color: themeColors.text }]}>VEG</Text>
            <Switch
              value={isVegOnly}
              onValueChange={setIsVegOnly}
              trackColor={{ false: '#767577', true: '#2ecc71' }}
              thumbColor={isVegOnly ? '#FFF' : '#f4f3f4'}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>

        {/* Dynamic & Static Promo Banners Slider */}
        {liveBanners.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16, marginVertical: 12 }}>
            {liveBanners.map((banner) => (
              <View key={banner.id} style={styles.dynamicBannerWrapper}>
                <Image source={{ uri: banner.imageUrl }} style={styles.dynamicBannerImg} />
                <View style={styles.dynamicBannerOverlay}>
                  <Text style={styles.dynamicBannerText}>{banner.linkUrl}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          /* Fallback Payday Banner */
          <View style={styles.payDayBanner}>
            <Text style={styles.payDayHeader}>PAY DAY</Text>
            <Text style={styles.payDaySub}>FLAT ₹200 OFF & MORE</Text>
            <View style={styles.payDayBadge}>
              <Text style={styles.payDayBadgeText}>ORDER NOW</Text>
            </View>
          </View>
        )}

        {/* Purple Promotion Banner (EatRight) */}
        <View style={styles.purplePromoBanner}>
          <View style={styles.purplePromoLeft}>
            <Text style={styles.purplePromoSubtitle}>Order from EatRight &</Text>
            <Text style={styles.purplePromoTitle}>Win upto ₹300!</Text>
            <TouchableOpacity style={styles.purpleLinkBtn}>
              <Text style={styles.purpleLinkText}>How to win Free Cash & Pixel Watch ❯</Text>
            </TouchableOpacity>
          </View>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150' }} 
            style={styles.purplePromoImg} 
          />
        </View>

        {/* What's on your mind? Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>What's on your mind?</Text>
          <Text style={styles.sectionSubtitle}>Tap a category bubble to filter local dishes</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.circularSlider}>
          {mindCategories.map((item) => {
            const isSelected = selectedMindCategory === item.name;
            return (
              <TouchableOpacity 
                key={item.id} 
                style={styles.circularCard} 
                onPress={() => setSelectedMindCategory(isSelected ? null : item.name)}
              >
                <Image 
                  source={{ uri: item.image }} 
                  style={[
                    styles.circularImage, 
                    isSelected && { borderWidth: 3, borderColor: '#FF5252' }
                  ]} 
                />
                <Text style={[styles.circularName, { color: themeColors.text, fontWeight: isSelected ? 'bold' : 'normal' }]}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Dynamic Filtered Products Grid (Takes place of Top Kitchens Nearby) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {selectedMindCategory ? `Popular ${selectedMindCategory} Menu` : 'Fresh Featured Dishes'}
          </Text>
          <Text style={styles.sectionSubtitle}>Prepared live by approved Cloud Partners</Text>
        </View>

        <View style={styles.featuredGrid}>
          {filteredDishes.map((prod) => (
            <View 
              key={prod.id} 
              style={[
                styles.gridCard, 
                { backgroundColor: themeColors.card, borderColor: themeColors.border }
              ]}
            >
              <Image source={{ uri: prod.image }} style={styles.gridImg} />
              
              {/* Veg Indicator */}
              <View style={[styles.vegOverlayBadge, { borderColor: prod.isVeg ? theme.colors.veg : theme.colors.nonVeg }]}>
                <View style={[styles.vegDot, { backgroundColor: prod.isVeg ? theme.colors.veg : theme.colors.nonVeg }]} />
              </View>

              <View style={styles.gridDetails}>
                <Text style={[styles.gridName, { color: themeColors.text }]} numberOfLines={1}>{prod.name}</Text>
                <Text style={[styles.gridDesc, { color: themeColors.textSecondary }]} numberOfLines={1}>{prod.desc}</Text>
                
                <TouchableOpacity onPress={() => router.push(`/restaurant/${prod.kitchenId}`)}>
                  <Text style={styles.gridKitchenLink}>★ {prod.kitchenName}</Text>
                </TouchableOpacity>

                <View style={styles.gridPriceRow}>
                  <Text style={[styles.gridPriceText, { color: themeColors.text }]}>₹{prod.price}</Text>
                  
                  <TouchableOpacity 
                    style={styles.gridAddBtn}
                    onPress={() => handleAddProductToCart(prod)}
                  >
                    <Text style={styles.gridAddBtnText}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {filteredDishes.length === 0 && (
            <View style={styles.emptySearchWrapper}>
              <Text style={{ color: themeColors.textSecondary, fontSize: 12 }}>No dishes found matching selection.</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Floating Checkout Cart Badge (Swiggy pattern) */}
      {cartItems.length > 0 && (
        <TouchableOpacity 
          style={styles.floatingCartNotification}
          activeOpacity={0.9}
          onPress={() => router.push('/cart')}
        >
          <View style={styles.cartInfoWrapper}>
            <ShoppingBag size={18} color="#FFF" />
            <Text style={styles.floatingCartQtyText}>{cartItems.reduce((acc, c) => acc + c.quantity, 0)} Items</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', marginHorizontal: 8 }}>|</Text>
            <Text style={styles.floatingCartPriceText}>₹{cartTotals.total}</Text>
          </View>
          <Text style={styles.viewCartActionText}>View Basket ❯</Text>
        </TouchableOpacity>
      )}

      {/* Address Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addressModalVisible}
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Delivery Address</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <Text style={{ color: '#FF5252', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.gpsRow}
              onPress={handleDetectLiveAddress}
            >
              <MapPin size={18} color="#FF5252" />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ color: '#FF5252', fontWeight: 'bold', fontSize: 13 }}>Detect Live GPS Location</Text>
                <Text style={{ color: '#888', fontSize: 10, marginTop: 2 }}>Uses device satellite telemetry</Text>
              </View>
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Enter Manual Address</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: themeColors.searchBg, color: themeColors.text, borderColor: themeColors.border }]}
              placeholder="e.g. 314, A, Jaypee Wishtown, Noida"
              placeholderTextColor="#888"
              value={newAddressInput}
              onChangeText={setNewAddressInput}
            />

            <TouchableOpacity style={styles.saveAddressBtn} onPress={handleUpdateAddress}>
              <Text style={styles.saveAddressText}>Save and Apply Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  locationTextContainer: {
    marginLeft: 8,
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationName: {
    fontSize: 11,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  freeBadge: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  freeBadgeText: {
    color: '#FFD700',
    fontSize: 8,
    fontWeight: 'bold',
  },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  menuLine: {
    height: 2,
    width: 18,
    marginVertical: 1.5,
    borderRadius: 1,
  },
  topTabsContainer: {
    borderBottomWidth: 1,
    height: 44,
  },
  topTabsScroll: {
    paddingHorizontal: 16,
  },
  topTabBtn: {
    justifyContent: 'center',
    paddingHorizontal: 14,
    height: '100%',
  },
  topTabLabel: {
    fontSize: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 42,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    marginLeft: 8,
  },
  vegToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 8,
    height: 42,
  },
  vegText: {
    fontSize: 9,
    fontWeight: 'bold',
    marginRight: 2,
  },
  payDayBanner: {
    backgroundColor: '#004B23',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginVertical: 12,
  },
  payDayHeader: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  payDaySub: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  payDayBadge: {
    backgroundColor: '#FFCC00',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  payDayBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: 'bold',
  },
  purplePromoBanner: {
    backgroundColor: '#2b1055',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  purplePromoLeft: {
    flex: 1,
  },
  purplePromoSubtitle: {
    color: '#ccc',
    fontSize: 12,
  },
  purplePromoTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  purpleLinkBtn: {
    marginTop: 8,
  },
  purpleLinkText: {
    color: '#FFCC00',
    fontSize: 10,
    fontWeight: 'bold',
  },
  purplePromoImg: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  circularSlider: {
    paddingLeft: 16,
    marginBottom: 16,
  },
  circularCard: {
    alignItems: 'center',
    marginRight: 16,
  },
  circularImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eee',
  },
  circularName: {
    fontSize: 11,
    marginTop: 6,
  },
  featuredGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gridImg: {
    width: '100%',
    height: 110,
    backgroundColor: '#eee',
  },
  vegOverlayBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gridDetails: {
    padding: 10,
  },
  gridName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  gridDesc: {
    fontSize: 9,
    marginTop: 2,
  },
  gridKitchenLink: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FF5252',
    marginTop: 4,
  },
  gridPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  gridPriceText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  gridAddBtn: {
    borderWidth: 1,
    borderColor: '#2ecc71',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(46,204,113,0.1)',
  },
  gridAddBtnText: {
    color: '#2ecc71',
    fontSize: 8,
    fontWeight: 'bold',
  },
  emptySearchWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 30,
  },
  floatingCartNotification: {
    position: 'absolute',
    bottom: 25,
    left: 16,
    right: 16,
    backgroundColor: '#E23744',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCartQtyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 6,
  },
  floatingCartPriceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  viewCartActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  dynamicBannerWrapper: {
    width: 280,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  dynamicBannerImg: {
    width: '100%',
    height: '100%',
  },
  dynamicBannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  dynamicBannerText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,82,82,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 20,
  },
  saveAddressBtn: {
    backgroundColor: '#FF5252',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveAddressText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  }
});
