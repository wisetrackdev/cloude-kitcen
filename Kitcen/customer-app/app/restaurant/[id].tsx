import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Modal 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Star, Clock, ShoppingBag, Check, ShieldCheck, MapPin } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useCartStore } from '../../store/useCartStore';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';
import { safeStorage } from '../../store/safeStorage';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const isDarkMode = useAuthStore(state => state.isDarkMode);

  // Zustand store mappings
  const kitchens = useKitchenStore(state => state.kitchens);
  const products = useKitchenStore(state => state.products);
  const fetchProducts = useKitchenStore(state => state.fetchProducts);

  const kitchenInfo = kitchens.find(k => k.id === id);
  const kitchenProducts = products[id as string] || [];

  const cartItems = useCartStore(state => state.items);
  const addItem = useCartStore(state => state.addItem);
  const cartTotals = useCartStore(state => state.getTotals());

  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadHiddenCategories = async () => {
      if (id) {
        const val = await safeStorage.getItem(`hidden_categories_${id}`);
        if (val) {
          setHiddenCategories(JSON.parse(val));
        }
      }
    };
    loadHiddenCategories();
  }, [id]);

  const visibleProducts = kitchenProducts.filter(item => !hiddenCategories.includes(item.category.toLowerCase()));
  const categories = Array.from(new Set(visibleProducts.map(item => item.category)));
  const [activeCategory, setActiveCategory] = useState('Tiffin Meals');

  useEffect(() => {
    if (id) {
      fetchProducts(id as string);
    }
  }, [id]);

  useEffect(() => {
    if (categories.length > 0) {
      if (!activeCategory || !categories.includes(activeCategory)) {
        setActiveCategory(categories[0]);
      }
    }
  }, [categories]);

  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<any | null>(null);
  const [selectedSize, setSelectedSize] = useState<'Regular' | 'Medium' | 'Large'>('Medium');
  const [extraCheese, setExtraCheese] = useState(false);

  const themeColors = {
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    inputBg: isDarkMode ? '#0F0F0F' : '#F0F2F4'
  };

  if (!kitchenInfo) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.coverWrapper}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <ShoppingBag size={48} color={themeColors.textSecondary} style={{ marginBottom: 16, opacity: 0.5 }} />
          <Text style={{ color: themeColors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>No Shop Available</Text>
          <Text style={{ color: themeColors.textSecondary, textAlign: 'center' }}>This store is currently not operating or could not be found.</Text>
        </View>
      </View>
    );
  }

  const handleAddPress = (item: any) => {
    if (kitchenInfo.isLive === false) {
      Alert.alert('Shop Closed', 'This kitchen is currently offline. You cannot add items to cart.');
      return;
    }
    if (item.customizable) {
      setSelectedItemForCustomization(item);
    } else {
      addItem(kitchenInfo.id, kitchenInfo.name, {
        id: item.id,
        productId: item.id,
        name: item.name,
        price: item.price,
        image: item.image
      });
    }
  };

  const submitCustomization = () => {
    if (kitchenInfo.isLive === false) {
      Alert.alert('Shop Closed', 'This kitchen is currently offline. You cannot add items to cart.');
      return;
    }
    if (!selectedItemForCustomization) return;
    
    let priceOffset = 0;
    if (selectedSize === 'Regular') priceOffset = -30;
    if (selectedSize === 'Large') priceOffset = 60;
    
    const cheeseOffset = extraCheese ? 40 : 0;
    const finalPrice = selectedItemForCustomization.price + priceOffset + cheeseOffset;

    const customId = `${selectedItemForCustomization.id}-${selectedSize}-${extraCheese ? 'cheese' : 'no-cheese'}`;

    addItem(kitchenInfo.id, kitchenInfo.name, {
      id: customId,
      productId: selectedItemForCustomization.id,
      name: `${selectedItemForCustomization.name} (${selectedSize})`,
      price: finalPrice,
      image: selectedItemForCustomization.image,
      selectedCustomizations: [
        { customizationName: 'Size', optionName: selectedSize, price: priceOffset },
        ...(extraCheese ? [{ customizationName: 'Extras', optionName: 'Extra Cheese', price: 40 }] : [])
      ]
    });

    setSelectedItemForCustomization(null);
    setSelectedSize('Medium');
    setExtraCheese(false);
  };

  const getQuantityInCart = (productId: string) => {
    return cartItems
      .filter(item => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header Cover Banner */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.coverWrapper}>
          <Image 
            source={{ uri: kitchenInfo.coverImageUrl && kitchenInfo.coverImageUrl.trim() !== '' ? kitchenInfo.coverImageUrl : kitchenInfo.image }} 
            style={styles.coverImage} 
          />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Info panel */}
        <View style={[styles.infoCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={[styles.restaurantName, { color: themeColors.text }]}>{kitchenInfo.name}</Text>
                {kitchenInfo.isLive === false && (
                  <View style={{ backgroundColor: '#FF3B30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'center' }}>
                    <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>CLOSED</Text>
                  </View>
                )}
              </View>
              <Text style={styles.ownerText}>By {kitchenInfo.owner}</Text>
            </View>
            {kitchenInfo.logoUrl && kitchenInfo.logoUrl.trim() !== '' && (
              <Image source={{ uri: kitchenInfo.logoUrl }} style={styles.shopLogoImage} />
            )}
          </View>
          <Text style={[styles.cuisines, { color: themeColors.textSecondary }]}>{kitchenInfo.cuisines}</Text>
          
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <MapPin size={14} color={themeColors.textSecondary} />
              <Text style={[styles.metricText, { color: themeColors.textSecondary }]}>{kitchenInfo.distance || '1.0 km'}</Text>
            </View>
          </View>

          <View style={styles.offerBanner}>
            <Text style={styles.offerText}>{kitchenInfo.offer || 'Flat 50% OFF'}</Text>
          </View>
        </View>

        {/* Categories selector */}
        {categories.length > 0 && (
          <View style={styles.categorySelector}>
            {categories.map(cat => (
              <TouchableOpacity 
                key={cat}
                style={[
                  styles.categoryBtn, 
                  { backgroundColor: themeColors.card, borderColor: themeColors.border },
                  activeCategory === cat && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                ]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[
                  styles.categoryBtnText, 
                  { color: themeColors.textSecondary },
                  activeCategory === cat && { color: '#000', fontWeight: 'bold' }
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Menu list */}
        <View style={styles.menuContainer}>
          {visibleProducts.filter(item => item.category === activeCategory).map(item => {
            const qty = getQuantityInCart(item.id);
            return (
              <View key={item.id} style={[styles.menuItem, { borderBottomColor: themeColors.border }]}>
                <View style={styles.itemInfo}>
                  <View style={[styles.vegBadge, { borderColor: item.isVeg ? theme.colors.veg : theme.colors.nonVeg }]}>
                    <View style={[styles.vegDot, { backgroundColor: item.isVeg ? theme.colors.veg : theme.colors.nonVeg }]} />
                  </View>
                  <Text style={[styles.itemName, { color: themeColors.text }]}>{item.name}</Text>
                  <Text style={[styles.itemPrice, { color: themeColors.text }]}>₹{item.price}</Text>
                  <Text style={[styles.itemDesc, { color: themeColors.textSecondary }]} numberOfLines={2}>{item.desc}</Text>
                </View>
                
                <View style={styles.itemImageContainer}>
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                  
                  {qty > 0 ? (
                    <View style={[styles.qtyControlContainer, { backgroundColor: themeColors.border }]}>
                      <Text style={[styles.qtyText, { color: themeColors.text }]}>{qty} in cart</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.addButton, { backgroundColor: themeColors.card, borderColor: theme.colors.primary }]}
                      onPress={() => handleAddPress(item)}
                    >
                      <Text style={styles.addButtonText}>ADD</Text>
                    </TouchableOpacity>
                  )}
                  {item.customizable && <Text style={[styles.customizableText, { color: themeColors.textSecondary }]}>Customizable</Text>}
                </View>
              </View>
            );
          })}
          {visibleProducts.length === 0 && (
            <Text style={[styles.noItemsText, { color: themeColors.textSecondary }]}>No items added to this kitchen yet.</Text>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating cart bar */}
      {cartItems.length > 0 && (
        <TouchableOpacity 
          style={styles.floatingCart}
          activeOpacity={0.9}
          onPress={() => router.push('/cart')}
        >
          <View style={styles.cartInfoWrapper}>
            <ShoppingBag size={18} color="#000" />
            <Text style={styles.floatingCartQty}>{cartItems.reduce((acc, c) => acc + c.quantity, 0)} Items</Text>
            <Text style={styles.floatingCartBullet}>|</Text>
            <Text style={styles.floatingCartPrice}>₹{cartTotals.total}</Text>
          </View>
          <Text style={styles.viewCartText}>View Cart</Text>
        </TouchableOpacity>
      )}

      {/* Customization modal */}
      {selectedItemForCustomization && (
        <Modal
          visible={!!selectedItemForCustomization}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedItemForCustomization(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Text style={styles.modalHeaderTitle}>Customize Item</Text>
              <Text style={[styles.modalItemName, { color: themeColors.text }]}>{selectedItemForCustomization.name}</Text>

              {/* Sizes */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: themeColors.text }]}>Choose Size</Text>
                {['Regular', 'Medium', 'Large'].map((size: any) => (
                  <TouchableOpacity 
                    key={size}
                    style={[styles.optionRow, { borderBottomColor: themeColors.border }]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text style={[styles.optionLabel, { color: themeColors.text }]}>
                      {size} {size === 'Regular' ? '(-₹30)' : size === 'Large' ? '(+₹60)' : ''}
                    </Text>
                    <View style={[styles.radioCircle, selectedSize === size && styles.radioCircleActive]}>
                      {selectedSize === size && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Addons */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: themeColors.text }]}>Extra Addons</Text>
                <TouchableOpacity 
                  style={[styles.optionRow, { borderBottomColor: themeColors.border }]}
                  onPress={() => setExtraCheese(!extraCheese)}
                >
                  <Text style={[styles.optionLabel, { color: themeColors.text }]}>Extra Mozzarella Cheese (+₹40)</Text>
                  <View style={[styles.checkbox, extraCheese && styles.checkboxActive]}>
                    {extraCheese && <Check size={12} color="#000" />}
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.modalSubmitButton}
                onPress={submitCustomization}
              >
                <Text style={styles.modalSubmitText}>Add to Cart</Text>
              </TouchableOpacity>
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
  },
  coverWrapper: {
    position: 'relative',
    height: 240,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: -30,
    padding: 20,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  shopLogoImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#1F1F1F',
    backgroundColor: '#1E1E1E',
  },
  ownerText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E23744',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  cuisines: {
    fontSize: 13,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  bullet: {
    marginHorizontal: 8,
  },
  offerBanner: {
    backgroundColor: 'rgba(255,107,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  offerText: {
    fontSize: 11,
    color: '#E23744',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
    rowGap: 10,
  },
  categoryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 10,
    marginBottom: 8,
  },
  categoryBtnActive: {
    backgroundColor: '#FF5252',
    borderColor: '#FF5252',
  },
  categoryBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryBtnTextActive: {
    color: '#000',
  },
  menuContainer: {
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  itemInfo: {
    flex: 1,
    marginRight: 16,
  },
  vegBadge: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    marginBottom: 6,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
  },
  itemDesc: {
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  itemImageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#121212',
  },
  addButton: {
    position: 'absolute',
    bottom: -10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  qtyControlContainer: {
    position: 'absolute',
    bottom: -10,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  qtyText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  customizableText: {
    fontSize: 9,
    marginTop: 14,
  },
  noItemsText: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 40,
  },
  floatingCart: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    backgroundColor: '#FFCC00',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  cartInfoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingCartQty: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 8,
  },
  floatingCartBullet: {
    marginHorizontal: 8,
    color: 'rgba(0,0,0,0.3)',
  },
  floatingCartPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
  },
  viewCartText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
  },
  modalHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF5252',
    textTransform: 'uppercase',
  },
  modalItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  optionLabel: {
    fontSize: 13,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#FF5252',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5252',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#555',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#FF5252',
    borderColor: '#FF5252',
  },
  modalSubmitButton: {
    backgroundColor: '#FF5252',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  }
});
