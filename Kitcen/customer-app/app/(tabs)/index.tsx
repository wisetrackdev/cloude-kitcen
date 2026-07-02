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
  ArrowRight,
  Flame,
  Award,
  Gift,
  Compass,
  LayoutGrid
} from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useCartStore } from '../../store/useCartStore';

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

  // Home controls
  const [activeCategory, setActiveCategory] = useState<TopCategory>('food');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [newAddressInput, setNewAddressInput] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchKitchens();
    fetchAllProducts();
    detectLocation();
  }, []);

  const themeColors = {
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    searchBg: isDarkMode ? '#1C1C1E' : '#FFFFFF'
  };

  const handleAddProductToCart = (prod: any) => {
    // Find kitchen details
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

  // Filtered lists for sections
  const highProteinDishes = allProducts.filter(p => p.name.includes('Roll'));
  const store99Dishes = allProducts.filter(p => p.price <= 99);
  const boltScoops = allProducts.filter(p => p.desc.includes('SCOOPS'));

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

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Search Bar Row with Veg Toggle */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: themeColors.searchBg, borderColor: themeColors.border }]}>
            <Search size={18} color="#8E8E93" />
            <TextInput
              placeholder="Search for 'Biryani'"
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

        {/* PAY DAY Discount Slider Banner */}
        <View style={styles.payDayBanner}>
          <Text style={styles.payDayHeader}>PAY DAY</Text>
          <Text style={styles.payDaySub}>FLAT ₹200 OFF & MORE</Text>
          <View style={styles.payDayBadge}>
            <Text style={styles.payDayBadgeText}>ORDER NOW</Text>
          </View>
        </View>

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
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.circularSlider}>
          {mindCategories.map((item) => (
            <TouchableOpacity key={item.id} style={styles.circularCard} onPress={() => router.push('/search')}>
              <Image source={{ uri: item.image }} style={styles.circularImage} />
              <Text style={[styles.circularName, { color: themeColors.text }]}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Section 1: High Protein Low Cal Dishes (customer-view-1) */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>High Protein Low Cal Dishes</Text>
            <Text style={styles.sectionSubtitle}>Dishes to support your fitness goals</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalProductsScroll}>
          {highProteinDishes.map((prod) => (
            <View key={prod.id} style={[styles.productCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Image source={{ uri: prod.image }} style={styles.productImg} />
              <View style={styles.highProteinBadge}>
                <Award size={10} color="#FFF" style={{ marginRight: 2 }} />
                <Text style={styles.highProteinBadgeText}>HIGH PROTEIN</Text>
              </View>

              <View style={styles.prodDetails}>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>★ 4.2 (16)</Text>
                </View>
                <Text style={[styles.prodName, { color: themeColors.text }]} numberOfLines={1}>{prod.name}</Text>
                <Text style={styles.prodDesc} numberOfLines={1}>{prod.desc}</Text>
                
                <Text style={[styles.prodKitchen, { color: themeColors.textSecondary }]}>By {prod.kitchenName}</Text>
                
                <View style={styles.priceRow}>
                  <Text style={[styles.prodPrice, { color: themeColors.text }]}>₹{prod.price}</Text>
                  <TouchableOpacity style={styles.addBtn} onPress={() => handleAddProductToCart(prod)}>
                    <Text style={styles.addBtnText}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Section 2: 99 Store Banner & items (customer-view-2) */}
        <View style={[styles.store99Banner, { backgroundColor: '#0083B0' }]}>
          <View style={styles.store99Content}>
            <Text style={styles.store99Title}>99 store</Text>
            <Text style={styles.store99Sub}>Meals at ₹99 + Free Delivery</Text>
          </View>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150' }} 
            style={styles.store99Img} 
          />
        </View>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}><Flame size={16} color="#FFCC00" /> Trending dishes near you!</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalProductsScroll}>
          {store99Dishes.map((prod) => (
            <View key={prod.id} style={[styles.productCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Image source={{ uri: prod.image }} style={styles.productImg} />
              
              <View style={styles.yellowDiscountBadge}>
                <Text style={styles.yellowDiscountText}>₹{prod.price}</Text>
              </View>

              <View style={styles.prodDetails}>
                <Text style={[styles.prodName, { color: themeColors.text }]} numberOfLines={1}>{prod.name}</Text>
                <Text style={[styles.prodKitchen, { color: themeColors.textSecondary }]}>By {prod.kitchenName}</Text>
                
                <View style={styles.priceRow}>
                  <Text style={[styles.prodPrice, { color: themeColors.text }]}>₹{prod.price}</Text>
                  <TouchableOpacity style={styles.addBtn} onPress={() => handleAddProductToCart(prod)}>
                    <Text style={styles.addBtnText}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Section 3: Bolt (15 Min Delivery) scoops (customer-view-3) */}
        <View style={[styles.boltBanner, { backgroundColor: '#800020' }]}>
          <View style={styles.boltContent}>
            <Text style={styles.boltTitle}>Bolt ⚡</Text>
            <Text style={styles.boltSub}>Food in 15 mins! Fresh, Hot & Crisp</Text>
          </View>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=150' }} 
            style={styles.boltImg} 
          />
        </View>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>15 MIN SCOOPS</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalProductsScroll}>
          {boltScoops.map((prod) => (
            <View key={prod.id} style={[styles.productCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Image source={{ uri: prod.image }} style={styles.productImg} />
              
              <View style={styles.yellowDiscountBadge}>
                <Text style={styles.yellowDiscountText}>₹169</Text>
              </View>

              <View style={styles.prodDetails}>
                <Text style={[styles.prodName, { color: themeColors.text }]} numberOfLines={1}>{prod.name}</Text>
                <Text style={styles.prodDesc} numberOfLines={1}>{prod.desc}</Text>
                <Text style={[styles.prodKitchen, { color: themeColors.textSecondary }]}>By {prod.kitchenName}</Text>
                
                <View style={styles.priceRow}>
                  <Text style={[styles.prodPrice, { color: themeColors.text }]}>₹{prod.price}</Text>
                  <TouchableOpacity style={styles.addBtn} onPress={() => handleAddProductToCart(prod)}>
                    <Text style={styles.addBtnText}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Section 4: Top Outlets (customer-view-4) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Top Kitchens Nearby</Text>
        </View>
        <View style={styles.restaurantContainer}>
          {kitchens.map((kitchen) => (
            <TouchableOpacity 
              key={kitchen.id}
              style={[styles.restaurantCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              activeOpacity={0.95}
              onPress={() => router.push(`/restaurant/${kitchen.id}`)}
            >
              <Image source={{ uri: kitchen.image }} style={styles.restaurantImage} />
              
              <View style={styles.itemsOverlayBadge}>
                <Text style={styles.itemsOverlayText}>ITEMS AT ₹99</Text>
              </View>

              <View style={styles.restaurantDetails}>
                <View style={styles.restaurantRow}>
                  <Text style={[styles.restaurantName, { color: themeColors.text }]}>{kitchen.name}</Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingTextVal}>{kitchen.rating || '4.5'}</Text>
                    <Star size={8} color="#000" style={{ marginLeft: 2 }} />
                  </View>
                </View>
                <View style={styles.typeBadgeRow}>
                  <Text style={[styles.restaurantCuisines, { color: themeColors.textSecondary }]}>{kitchen.cuisines}</Text>
                  <Text style={[styles.kitchenTypeTag, { 
                    backgroundColor: kitchen.type === 'home_tiffin' ? 'rgba(52,199,89,0.1)' : 'rgba(255,107,0,0.1)',
                    color: kitchen.type === 'home_tiffin' ? theme.colors.veg : theme.colors.primary
                  }]}>
                    {kitchen.type === 'home_tiffin' ? 'Housewife Tiffin' : 'Restaurant'}
                  </Text>
                </View>
                
                <View style={[styles.deliveryRow, { borderTopColor: themeColors.border }]}>
                  <View style={styles.statItem}>
                    <Clock size={12} color={themeColors.textSecondary} />
                    <Text style={[styles.statText, { color: themeColors.textSecondary }]}>{kitchen.time}</Text>
                  </View>
                  <Text style={[styles.bulletSeparator, { color: themeColors.textSecondary }]}>•</Text>
                  <Text style={[styles.statText, { color: themeColors.textSecondary }]}>{kitchen.distance}</Text>
                  <Text style={[styles.bulletSeparator, { color: themeColors.textSecondary }]}>•</Text>
                  <View style={styles.statItem}>
                    <ShieldCheck size={12} color={theme.colors.veg} />
                    <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>Safe Homestyle Cooking</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

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

            {/* Detect live location */}
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
    fontWeight: '600',
  },
  horizontalProductsScroll: {
    paddingLeft: 16,
    paddingBottom: 16,
  },
  productCard: {
    width: 160,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: 14,
  },
  productImg: {
    width: '100%',
    height: 100,
    backgroundColor: '#eee',
  },
  highProteinBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
    backgroundColor: '#FF5252',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  highProteinBadgeText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: 'bold',
  },
  yellowDiscountBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
    backgroundColor: '#FFCC00',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  yellowDiscountText: {
    color: '#000',
    fontSize: 8,
    fontWeight: 'bold',
  },
  prodDetails: {
    padding: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  prodName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  prodDesc: {
    fontSize: 9,
    color: '#888',
    marginTop: 2,
  },
  prodKitchen: {
    fontSize: 9,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  prodPrice: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  addBtn: {
    borderWidth: 1,
    borderColor: '#2ecc71',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(46,204,113,0.1)',
  },
  addBtnText: {
    color: '#2ecc71',
    fontSize: 9,
    fontWeight: 'bold',
  },
  store99Banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 14,
    marginVertical: 12,
  },
  store99Content: {
    flex: 1,
  },
  store99Title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  store99Sub: {
    fontSize: 11,
    color: '#FFF',
    marginTop: 2,
  },
  store99Img: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  boltBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 14,
    marginVertical: 12,
  },
  boltContent: {
    flex: 1,
  },
  boltTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  boltSub: {
    fontSize: 11,
    color: '#FFF',
    marginTop: 2,
  },
  boltImg: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  restaurantContainer: {
    paddingHorizontal: 16,
  },
  restaurantCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  restaurantImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#222',
  },
  itemsOverlayBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    backgroundColor: '#000',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#FFD700',
  },
  itemsOverlayText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  restaurantDetails: {
    padding: 16,
  },
  restaurantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFCC00',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  ratingTextVal: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  restaurantCuisines: {
    fontSize: 12,
    flex: 1,
    marginRight: 10,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  bulletSeparator: {
    marginHorizontal: 8,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  kitchenTypeTag: {
    fontSize: 9,
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
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
