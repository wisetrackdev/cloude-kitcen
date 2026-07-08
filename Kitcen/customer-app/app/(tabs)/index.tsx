import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput,
  Alert,
  Switch,
  Dimensions,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Search, 
  SlidersHorizontal, 
  ShoppingBag, 
  Bell, 
  User, 
  Star, 
  Heart,
  ChevronRight,
  Soup, 
  Utensils, 
  Grape, 
  Cookie, 
  GlassWater,
  X
} from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useCartStore } from '../../store/useCartStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { API_BASE_URL } from '../../store/apiConfig';

const { width } = Dimensions.get('window');

// Category list mapping with Lucide icons
const categoryMeta = [
  { name: 'Snacks', icon: Soup },
  { name: 'Meal', icon: Utensils },
  { name: 'Vegan', icon: Grape },
  { name: 'Dessert', icon: Cookie },
  { name: 'Drinks', icon: GlassWater }
];

export default function HomeScreen() {
  const router = useRouter();
  const location = useAuthStore(state => state.location);
  const user = useAuthStore(state => state.user);
  
  const kitchens = useKitchenStore(state => state.kitchens);
  const isLoading = useKitchenStore(state => state.isLoading);
  const allProducts = useKitchenStore(state => state.allProducts);
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);
  const fetchAllProducts = useKitchenStore(state => state.fetchAllProducts);

  const addItem = useCartStore(state => state.addItem);
  const cartItems = useCartStore(state => state.items);
  const cartTotals = useCartStore(state => state.getTotals());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [liveBanners, setLiveBanners] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = useNotificationStore(state => state.notifications);
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const markAllAsRead = useNotificationStore(state => state.markAllAsRead);
  const clearAllNotifs = useNotificationStore(state => state.clearAll);

  useEffect(() => {
    fetchKitchens();
    fetchAllProducts();
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

  // Filter products dynamically
  const getFilteredDishes = () => {
    let list = allProducts || [];
    
    // Filter out products belonging to offline or unapproved kitchens
    list = list.filter(p => {
      const k = kitchens.find(store => store.id === p.kitchenId);
      return k && k.isApproved === 'approved' && k.isLive !== false;
    });

    if (selectedCategory) {
      list = list.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.desc?.toLowerCase().includes(q));
    }
    return list;
  };

  // Compile categories dynamically (combine custom categories from sellers with static ones)
  const getDynamicCategories = () => {
    const list = [...categoryMeta];
    allProducts.forEach(p => {
      if (p.category && p.category.trim() !== '') {
        const exists = list.some(c => c.name.toLowerCase() === p.category.toLowerCase());
        if (!exists) {
          list.push({
            name: p.category,
            icon: Utensils // Default icon for dynamic seller categories
          });
        }
      }
    });
    return list;
  };

  const filteredDishes = getFilteredDishes();
  const categories = getDynamicCategories();

  // Add directly to cart helper
  const handleAddToCart = (prod: any) => {
    const kId = prod.kitchenId || 'k1';
    const kName = prod.kitchenName || 'Seller Partner';
    addItem(kId, kName, {
      id: prod.id,
      productId: prod.id,
      name: prod.name,
      price: prod.price,
      image: prod.image,
      selectedCustomizations: []
    });
    Alert.alert('Cart Updated', `${prod.name} has been added to your basket.`);
  };

  // Best seller fallback items matching home-screen.png
  const fallbackBestSellers = [
    { id: 'bs1', name: 'Sushi Wave', price: 103.00, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200', kitchenId: 'shp-seed-10', kitchenName: 'Rumali By Enoki' },
    { id: 'bs2', name: 'Butter Chicken', price: 50.00, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200', kitchenId: 'shp-seed-1', kitchenName: 'Burger King' },
    { id: 'bs3', name: 'Veg Lasagna', price: 12.99, image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=200', kitchenId: 'shp-seed-2', kitchenName: 'Pizza Hut' },
    { id: 'bs4', name: 'Sweet Cupcake', price: 8.20, image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=200', kitchenId: 'shp-seed-4', kitchenName: 'Starbucks Coffee' },
  ];

  // Recommendations fallback matching home-screen.png
  const fallbackRecommends = [
    { id: 'rc1', name: 'Classic Burger', price: 10.00, rating: 5.0, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300', kitchenId: 'shp-seed-1', kitchenName: 'Burger King' },
    { id: 'rc2', name: 'Fresh Spring Rolls', price: 25.00, rating: 5.0, image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300', kitchenId: 'shp-seed-9', kitchenName: 'Chaayos Chai' },
  ];

  const getBestSellers = () => {
    if (allProducts && allProducts.length > 0) {
      const activeProds = allProducts.filter(p => {
        const k = kitchens.find(store => store.id === p.kitchenId);
        return k && k.isApproved === 'approved' && k.isLive !== false;
      });
      return activeProds.slice(0, 4);
    }
    return [];
  };

  const [visibleRecommendCount, setVisibleRecommendCount] = useState(4);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    // Check if scrolled 90% of the way to the bottom
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 150;
    if (isCloseToBottom && !selectedCategory) {
      const totalProds = allProducts?.length || 0;
      if (visibleRecommendCount < totalProds) {
        setVisibleRecommendCount(prev => prev + 4);
      }
    }
  };

  const getRecommendations = () => {
    if (selectedCategory || searchQuery.trim() !== '') {
      return filteredDishes;
    }
    const list = allProducts && allProducts.length > 0 ? allProducts : [];
    return list.slice(0, visibleRecommendCount);
  };

  return (
    <View style={styles.container}>
      
      {/* 1. Gold/Yellow Top Header Block */}
      <View style={styles.goldHeader}>
        {/* Search bar & Actions Row */}
        <View style={styles.headerTopRow}>
          <View style={styles.searchBar}>
            <Search size={16} color="#8E8E93" />
            <TextInput
              placeholder="Search"
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            <TouchableOpacity style={styles.filterBtn}>
              <SlidersHorizontal size={14} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Quick Header Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionCircle} onPress={() => router.push('/cart')}>
              <ShoppingBag size={16} color="#FFB300" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCircle} onPress={() => setShowNotifications(true)}>
              <Bell size={16} color="#FFB300" />
              {unreadCount > 0 && (
                <View style={styles.badgeWrapper}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCircle} onPress={() => router.push('/profile')}>
              <User size={16} color="#FFB300" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting Banner */}
        <View style={styles.greetingWrapper}>
          <View style={styles.greetingHeaderRow}>
            <Text style={styles.greetingTitle}>
              Good Morning {user?.firstName || user?.name?.split(' ')[0] || 'Dev'} {user?.lastName || user?.name?.split(' ').slice(1).join(' ') || 'Kumar'}
            </Text>
            <View style={styles.cyanUnderline} />
          </View>
          <Text style={styles.greetingSubtitle}>Rise And Shine! It's Breakfast Time</Text>
        </View>
      </View>

      {/* 2. White Card Container for Body Scroll */}
      <View style={styles.bodyCard}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 100 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {isLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 }}>
              <ActivityIndicator size="large" color="#FFB300" />
            </View>
          ) : kitchens.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Soup size={64} color="#FFB300" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No Shop Available</Text>
              <Text style={styles.emptySubtitle}>We couldn't find any active kitchens in your area right now. Please check back later!</Text>
            </View>
          ) : (
            <>
              {/* Categories Horizontal Slider */}
              <View style={styles.categoryContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                  {categories.map((cat, index) => {
                    const IconComponent = cat.icon || Utensils;
                    const isSelected = selectedCategory?.toLowerCase() === cat.name.toLowerCase();
                    return (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.categoryItem}
                        onPress={() => setSelectedCategory(isSelected ? null : cat.name)}
                      >
                        <View style={[styles.categoryCircle, isSelected && styles.categoryCircleSelected]}>
                          <IconComponent size={22} color={isSelected ? "#FFF" : "#FFB300"} strokeWidth={1.8} />
                        </View>
                        <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>{cat.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Best Seller Section */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Best Seller</Text>
                <TouchableOpacity onPress={() => router.push('/search')}>
                  <Text style={styles.viewAllText}>View All ❯</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bestSellerScroll}>
                {getBestSellers().map((item: any) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.bestSellerCard}
                    onPress={() => router.push(`/restaurant/${item.kitchenId || 'shp-seed-1'}`)}
                  >
                    <Image source={{ uri: item.image }} style={styles.bestSellerImage} />
                    <View style={styles.pricePill}>
                      <Text style={styles.pricePillText}>₹{item.price}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Dynamic Promo Banners Slider */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
                {liveBanners.map((banner, index) => (
                  <TouchableOpacity 
                    key={banner.id || index} 
                    style={[styles.promoBanner, { marginRight: 15, width: width - 40 }]}
                    onPress={() => {
                      const targetRoute = banner.linkUrl || 'restaurant/shp-seed-1';
                      router.push(`/${targetRoute}`);
                    }}
                  >
                    <View style={styles.promoLeft}>
                      <Text style={styles.promoTextMain}>Chef Special</Text>
                      <Text style={styles.promoTextMain}>Exclusive Offer</Text>
                      <Text style={styles.promoDiscount}>30% OFF</Text>
                    </View>
                    <Image 
                      source={{ uri: banner.image_url || banner.imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300' }} 
                      style={styles.promoImage} 
                    />
                  </TouchableOpacity>
                ))}

                {liveBanners.length === 0 && (
                  /* Fallback Promo Banner if empty */
                  <TouchableOpacity 
                    style={[styles.promoBanner, { width: width - 40, marginHorizontal: 20 }]}
                    onPress={() => router.push('/restaurant/shp-seed-2')}
                  >
                    <View style={styles.promoLeft}>
                      <Text style={styles.promoTextMain}>Experience our</Text>
                      <Text style={styles.promoTextMain}>delicious new dish</Text>
                      <Text style={styles.promoDiscount}>30% OFF</Text>
                    </View>
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300' }} 
                      style={styles.promoImage} 
                    />
                  </TouchableOpacity>
                )}
              </ScrollView>
              
              {/* Carousel dots indicator */}
              <View style={styles.dotsRow}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
              </View>

              {/* Recommend Section */}
              <Text style={[styles.sectionTitle, { marginLeft: 20, marginBottom: 15 }]}>
                {searchQuery.trim() !== '' ? `Search: "${searchQuery}"` : (selectedCategory ? `${selectedCategory} Matches` : 'Recommend')}
              </Text>

              <View style={styles.recommendGrid}>
                {getRecommendations().map((item: any) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.recommendCard}
                    onPress={() => router.push(`/restaurant/${item.kitchenId || 'shp-seed-1'}`)}
                  >
                    <Image source={{ uri: item.image }} style={styles.recommendImage} />
                    
                    {/* Rating Badge */}
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>{item.rating || '5.0'}</Text>
                      <Star size={9} color="#FFD700" fill="#FFD700" style={{ marginLeft: 2 }} />
                    </View>

                    {/* Heart Badge */}
                    <TouchableOpacity style={styles.heartBadge}>
                      <Heart size={12} color="#FF3B30" fill="#FF3B30" />
                    </TouchableOpacity>

                    {/* Bottom Details */}
                    <View style={styles.recommendDetails}>
                      <Text style={styles.recommendName} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.recommendPricePill}>
                        <Text style={styles.recommendPriceText}>₹{item.price}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {/* Floating Cart checkout helper */}
      {cartItems.length > 0 && (
        <TouchableOpacity 
          style={styles.floatingCart}
          activeOpacity={0.9}
          onPress={() => router.push('/cart')}
        >
          <View style={styles.cartLeft}>
            <ShoppingBag size={18} color="#FFF" />
            <Text style={styles.cartQtyText}>{cartItems.reduce((acc, c) => acc + c.quantity, 0)} items</Text>
            <Text style={styles.cartDivider}>|</Text>
            <Text style={styles.cartPriceText}>₹{cartTotals.total}</Text>
          </View>
          <Text style={styles.cartActionText}>Go to Basket ❯</Text>
        </TouchableOpacity>
      )}
      {showNotifications && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showNotifications}
          onRequestClose={() => setShowNotifications(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Notifications</Text>
                <TouchableOpacity 
                  onPress={() => setShowNotifications(false)} 
                  style={styles.closeBtn}
                >
                  <X size={18} color="#FFB300" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {notifications.length === 0 ? (
                  <Text style={styles.emptyNotifText}>
                    No notifications available.
                  </Text>
                ) : (
                  notifications.map((item) => (
                    <View 
                      key={item.id} 
                      style={[
                        styles.notifCard, 
                        !item.isRead && styles.unreadNotifCard
                      ]}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.notifTitle}>{item.title}</Text>
                        {!item.isRead && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notifBody}>{item.body}</Text>
                      <Text style={styles.notifTime}>{item.timestamp}</Text>
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.markReadBtn}
                  onPress={() => {
                    markAllAsRead();
                    Alert.alert('Success', 'All notifications marked as read.');
                  }}
                >
                  <Text style={styles.markReadText}>Mark all as read</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.clearAllBtn}
                  onPress={() => {
                    clearAllNotifs();
                    Alert.alert('Cleared', 'Notification inbox cleared.');
                  }}
                >
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFCC00', // Solid gold-yellow theme top background
  },
  goldHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 22,
    paddingLeft: 16,
    paddingRight: 6,
    height: 44,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#333',
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFB300',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FFE6D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  greetingWrapper: {
    marginTop: 5,
  },
  greetingHeaderRow: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    fontFamily: 'System',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  cyanUnderline: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#00B4D8',
    opacity: 0.8,
    borderRadius: 2,
    zIndex: -1,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: '#E43B3F', // Red subtitle matching mockups
    fontWeight: 'bold',
    marginTop: 4,
  },
  bodyCard: {
    flex: 1,
    backgroundColor: '#F7F7F9', // Light gray background
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryScroll: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 18,
  },
  categoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF0E6', // Light gold circle background
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE0CC',
  },
  categoryCircleSelected: {
    backgroundColor: '#FFB300',
    borderColor: '#FFB300',
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    marginTop: 8,
  },
  categoryLabelSelected: {
    color: '#FFB300',
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B2B2B',
  },
  viewAllText: {
    fontSize: 11,
    color: '#FFB300',
    fontWeight: 'bold',
  },
  bestSellerScroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  bestSellerCard: {
    width: 110,
    height: 110,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 14,
    backgroundColor: '#FFF',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  bestSellerImage: {
    width: '100%',
    height: '100%',
  },
  pricePill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFB300',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pricePillText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  promoBanner: {
    marginHorizontal: 20,
    height: 130,
    borderRadius: 24,
    backgroundColor: '#FFB300', // Orange-red background banner
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    position: 'relative',
    shadowColor: '#FFB300',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  promoLeft: {
    flex: 1.2,
  },
  promoTextMain: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  promoDiscount: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
  },
  promoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginLeft: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginVertical: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFE6D5',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#FFB300',
    width: 12,
  },
  recommendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  recommendCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 8,
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  recommendImage: {
    width: '100%',
    height: 120,
    borderRadius: 14,
  },
  ratingBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
  },
  heartBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendDetails: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  recommendName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  recommendPricePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFB300',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 8,
  },
  recommendPriceText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  floatingCart: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FFB300',
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  cartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartQtyText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 8,
  },
  cartDivider: {
    color: 'rgba(255,255,255,0.4)',
    marginHorizontal: 8,
  },
  cartPriceText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cartActionText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  badgeWrapper: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F5F5F7',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '80%',
    minHeight: '50%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#EAEAEA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFB300',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyNotifText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 13,
  },
  notifCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  unreadNotifCard: {
    borderColor: '#FFFFE0',
    backgroundColor: '#FFFBE6',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  notifBody: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 9,
    color: '#999',
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#EAEAEA',
  },
  markReadBtn: {
    flex: 1,
    backgroundColor: '#FFB300',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  markReadText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clearAllBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FFB300',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearAllText: {
    color: '#FFB300',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2B2B2B',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  }
});
