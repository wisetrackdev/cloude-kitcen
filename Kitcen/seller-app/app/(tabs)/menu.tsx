import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  Alert,
  Image,
  ActivityIndicator 
} from 'react-native';
import { Plus, Trash2, ChefHat, Tag, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { safeStorage } from '../../store/safeStorage';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';
import { uploadImageToServer } from '../../store/uploadHelper';

export default function SellerMenuScreen() {
  const user = useAuthStore(state => state.user);
  const kitchens = useKitchenStore(state => state.kitchens);

  const isDarkMode = useAuthStore(state => state.isDarkMode);

  const themeColors = {
    background: isDarkMode ? '#0A0A0A' : '#F5F6F8',
    card: isDarkMode ? '#121212' : '#FFFFFF',
    border: isDarkMode ? '#1F1F1F' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    inputBg: isDarkMode ? '#0F0F0F' : '#F0F2F4',
    primary: '#FFB300', // Gold/Yellow primary
  };
  const products = useKitchenStore(state => state.products);
  const categories = useKitchenStore(state => state.categories);
  const isLoading = useKitchenStore(state => state.isLoading);
  
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);
  const fetchProducts = useKitchenStore(state => state.fetchProducts);
  const fetchCategories = useKitchenStore(state => state.fetchCategories);
  const createCategory = useKitchenStore(state => state.createCategory);
  const addProduct = useKitchenStore(state => state.addProduct);
  const deleteProduct = useKitchenStore(state => state.deleteProduct);

  // Find user's kitchen by ownerId
  const myKitchen = kitchens.find(k => k.owner === user?.id);
  const selectedKitchenId = myKitchen?.id || '';

  const kitchenInfo = myKitchen || { name: 'My Kitchen', isApproved: 'pending' };
  const kitchenProducts = selectedKitchenId ? (products[selectedKitchenId] || []) : [];

  // Fetch kitchens, categories and products on mount
  useEffect(() => {
    fetchKitchens();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedKitchenId) {
      fetchProducts(selectedKitchenId);
    }
  }, [selectedKitchenId]);

  useEffect(() => {
    if (showAddDishModal) {
      fetchCategories();
    }
  }, [showAddDishModal]);

  useEffect(() => {
    if (showAddDishModal && categories.length > 0) {
      const exists = categories.some(c => c.name === newDishCat);
      if (!exists) {
        setNewDishCat(categories[0].name);
      }
    }
  }, [showAddDishModal, categories]);

  // Local Form states
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishImage, setNewDishImage] = useState('');
  const [newDishVeg, setNewDishVeg] = useState(true);
  const [newDishCat, setNewDishCat] = useState('Tiffin Meals');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('All');

  const getNext7Days = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const list = [{ name: 'All', dateStr: 'All Items' }];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dayName = days[d.getDay()];
      const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      list.push({ name: dayName, dateStr: `${dayName.substring(0, 3)}, ${dateStr}` });
    }
    return list;
  };
  const filterDaysList = getNext7Days();

  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadHidden = async () => {
      if (selectedKitchenId) {
        const val = await safeStorage.getItem(`hidden_categories_${selectedKitchenId}`);
        if (val) {
          setHiddenCategories(JSON.parse(val));
        }
      }
    };
    loadHidden();
  }, [selectedKitchenId]);

  const handleHideCategory = async (catName: string) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${catName}" and hide all its items temporarily from your shop?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = [...hiddenCategories, catName.toLowerCase()];
            setHiddenCategories(updated);
            await safeStorage.setItem(`hidden_categories_${selectedKitchenId}`, JSON.stringify(updated));
            Alert.alert('Deleted', `Category "${catName}" has been deleted from your shop.`);
          }
        }
      ]
    );
  };

  const handleRestoreCategories = async () => {
    setHiddenCategories([]);
    await safeStorage.removeItem(`hidden_categories_${selectedKitchenId}`);
    Alert.alert('Restored', 'All deleted categories have been restored.');
  };

  const visibleProducts = kitchenProducts.filter(
    item => !hiddenCategories.includes(item.category.toLowerCase()) &&
            (selectedDayFilter === 'All' || (item.availableDays && item.availableDays.includes(selectedDayFilter)))
  );

  const pickFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewDishImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Camera Error', 'Could not open camera');
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewDishImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Gallery Error', 'Could not open gallery');
    }
  };

  const handleAddDish = async () => {
    if (!newDishName || !newDishPrice) {
      Alert.alert('Error', 'Please fill name and price');
      return;
    }

    let finalCategory = newDishCat;

    // Upload local image URI to Cloudinary if set, otherwise fallback to placeholder
    let finalImageUrl = '';
    if (newDishImage.trim() !== '') {
      try {
        finalImageUrl = await uploadImageToServer(newDishImage);
      } catch (err: any) {
        console.warn('Image upload failed:', err.message);
        Alert.alert('Upload Failed', 'Could not upload food image. Using default placeholder image.');
        finalImageUrl = newDishVeg 
          ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80';
      }
    } else {
      finalImageUrl = newDishVeg 
        ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80';
    }

    const daysStr = selectedDays.length > 0 ? selectedDays.join(',') : 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday';
    await addProduct(selectedKitchenId, {
      name: newDishName,
      price: parseFloat(newDishPrice),
      desc: newDishDesc,
      category: finalCategory,
      isVeg: newDishVeg,
      image: finalImageUrl,
      availableDays: daysStr
    });

    setNewDishName('');
    setNewDishPrice('');
    setNewDishDesc('');
    setNewDishImage('');
    setShowAddDishModal(false);
    Alert.alert('Success', 'Dish added successfully to your kitchen!');
  };

  const isApproved = myKitchen?.isApproved === 'approved';

  if (isLoading && !myKitchen) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!isApproved) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <ChefHat size={64} color={theme.colors.warning} style={{ marginBottom: 20 }} />
        <Text style={{ color: theme.colors.warning, fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
          Approval Pending
        </Text>
        <Text style={{ color: themeColors.text, fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 }}>
          Your kitchen "{kitchenInfo.name}" is pending approval from the SuperAdmin.
        </Text>
        <Text style={{ color: themeColors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 8, lineHeight: 18, paddingHorizontal: 20 }}>
          Once approved, you will be able to manage orders, setup categories, and add items to your menu.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.85)', marginBottom: 2 }]}>Manage available items for {kitchenInfo.name}</Text>
            <Text style={[styles.title, { color: '#FFF' }]}>Menu Catalog</Text>
          </View>
          <TouchableOpacity 
            style={styles.addDishBtn}
            onPress={() => setShowAddDishModal(true)}
          >
            <Plus size={14} color="#000" />
            <Text style={styles.addDishBtnText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16 }}>

      {/* Day / Date availability filter */}
      <View style={{ marginTop: 15 }}>
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: themeColors.text, marginBottom: 8 }}>Filter by Scheduled Day:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
          {filterDaysList.map((dayItem) => (
            <TouchableOpacity
              key={dayItem.name}
              style={{
                backgroundColor: selectedDayFilter === dayItem.name ? '#FFCC00' : themeColors.card,
                borderWidth: 1,
                borderColor: selectedDayFilter === dayItem.name ? '#FFCC00' : themeColors.border,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 20,
                marginRight: 8
              }}
              onPress={() => setSelectedDayFilter(dayItem.name)}
            >
              <Text style={{ fontSize: 12, fontWeight: selectedDayFilter === dayItem.name ? 'bold' : 'normal', color: selectedDayFilter === dayItem.name ? '#000' : themeColors.text }}>
                {dayItem.dateStr}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Shop Categories Section with Delete option */}
      <View style={[styles.shopCategoriesSection, { marginTop: 20 }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Shop Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {Array.from(new Set(kitchenProducts.map(p => p.category)))
            .filter(catName => catName && catName.trim() !== '')
            .map((catName, idx) => {
              const isHidden = hiddenCategories.includes(catName.toLowerCase());
              if (isHidden) return null;
              return (
                <View key={idx} style={[styles.catChip, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <Text style={[styles.catChipText, { color: themeColors.text }]}>{catName}</Text>
                  <TouchableOpacity onPress={() => handleHideCategory(catName)} style={styles.catDeleteBtn}>
                    <Text style={styles.catDeleteBtnText}>×</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          }
          {hiddenCategories.length > 0 && (
            <TouchableOpacity style={styles.restoreBtn} onPress={handleRestoreCategories}>
              <Text style={styles.restoreBtnText}>Restore All</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <View style={[styles.dishList, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        {visibleProducts.map((item) => (
          <View key={item.id} style={[styles.dishCard, { borderBottomColor: themeColors.border }]}>
            <View style={styles.dishCardMeta}>
              <View style={[styles.vegBadge, { borderColor: item.isVeg ? theme.colors.veg : theme.colors.nonVeg }]}>
                <View style={[styles.vegDot, { backgroundColor: item.isVeg ? theme.colors.veg : theme.colors.nonVeg }]} />
              </View>
              
              {item.image ? (
                <Image source={{ uri: item.image }} style={{ width: 44, height: 44, borderRadius: 8, marginLeft: 10 }} />
              ) : (
                <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: themeColors.inputBg, alignItems: 'center', justifyContent: 'center', marginLeft: 10 }}>
                  <ChefHat size={16} color={themeColors.textSecondary} />
                </View>
              )}

              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.dishCardName, { color: themeColors.text }]}>{item.name}</Text>
                <Text style={[styles.dishCardPrice, { color: themeColors.textSecondary }]}>₹{item.price} • {item.category}</Text>
                {item.availableDays && (
                  <Text style={{ fontSize: 9, color: '#FFCC00', marginTop: 2, fontWeight: 'bold' }}>
                    Days: {item.availableDays.split(',').map(d => d.substring(0, 3)).join(', ')}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => deleteProduct(selectedKitchenId, item.id)}>
              <Trash2 size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ))}
        {visibleProducts.length === 0 && (
          <Text style={{ color: themeColors.textSecondary, fontSize: 12, textAlign: 'center', marginVertical: 30 }}>
            No items visible. Add a dish or restore hidden categories.
          </Text>
        )}
      </View>
    </View>

      {/* Add item Modal */}
      <Modal
        visible={showAddDishModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddDishModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Add Dish or Tiffin Package</Text>

              <TextInput
                placeholder="Dish Name (e.g. Kadhai Paneer Tiffin)"
                placeholderTextColor="#888"
                value={newDishName}
                onChangeText={setNewDishName}
                style={[styles.inputField, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
              />

              <TextInput
                placeholder="Price (₹)"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={newDishPrice}
                onChangeText={setNewDishPrice}
                style={[styles.inputField, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
              />

              <TextInput
                placeholder="Description (e.g. 4 rotis, paneer, salad)"
                placeholderTextColor="#888"
                value={newDishDesc}
                onChangeText={setNewDishDesc}
                style={[styles.inputField, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
              />

              <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Dish Photo Image</Text>
              <View style={styles.imagePickerRow}>
                {newDishImage ? <Image source={{ uri: newDishImage }} style={styles.pickerThumb} /> : <View style={[styles.noThumb, { backgroundColor: themeColors.inputBg }]}><ImageIcon size={20} color="#666" /></View>}
                <View style={styles.pickerButtons}>
                  <TouchableOpacity style={[styles.pickerActionBtn, { backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]} onPress={pickFromCamera}>
                    <Camera size={12} color={themeColors.text} style={{ marginRight: 4 }} />
                    <Text style={[styles.pickerActionText, { color: themeColors.text }]}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.pickerActionBtn, { backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]} onPress={pickFromGallery}>
                    <ImageIcon size={12} color={themeColors.text} style={{ marginRight: 4 }} />
                    <Text style={[styles.pickerActionText, { color: themeColors.text }]}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TextInput
                placeholder="Or paste custom Dish Image URL..."
                placeholderTextColor="#888"
                value={newDishImage}
                onChangeText={setNewDishImage}
                style={[styles.inputField, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
              />

              {/* Category Selection */}
              <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Choose Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryBubble,
                      newDishCat === cat.name ? { backgroundColor: themeColors.primary, borderColor: themeColors.primary } : { backgroundColor: themeColors.inputBg, borderColor: themeColors.border }
                    ]}
                    onPress={() => {
                      setNewDishCat(cat.name);
                    }}
                  >
                    <Tag size={10} color={newDishCat === cat.name ? '#000' : '#888'} style={{ marginRight: 4 }} />
                    <Text style={[
                      styles.categoryBubbleText,
                      newDishCat === cat.name ? { color: '#000', fontWeight: 'bold' } : { color: themeColors.textSecondary }
                    ]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: themeColors.textSecondary }]}>Dietary Status: Veg Item</Text>
                <TouchableOpacity 
                  style={[styles.toggleBtn, newDishVeg ? { backgroundColor: theme.colors.veg } : { backgroundColor: themeColors.inputBg, borderWidth: 1, borderColor: themeColors.border }]}
                  onPress={() => setNewDishVeg(!newDishVeg)}
                >
                  <Text style={[styles.toggleBtnText, newDishVeg ? { color: '#FFF' } : { color: themeColors.textSecondary }]}>
                    {newDishVeg ? 'VEG' : 'NON-VEG'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Day Scheduling Selection */}
              <Text style={[styles.sectionLabel, { color: themeColors.text, marginTop: 10 }]}>Schedule Available Days</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      style={{
                        backgroundColor: isSelected ? '#FFCC00' : themeColors.inputBg,
                        borderWidth: 1,
                        borderColor: isSelected ? '#FFCC00' : themeColors.border,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 6
                      }}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedDays(selectedDays.filter(d => d !== day));
                        } else {
                          setSelectedDays([...selectedDays, day]);
                        }
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? '#000' : themeColors.textSecondary }}>
                        {day.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.saveDishBtn} onPress={handleAddDish}>
                <Text style={styles.saveDishBtnText}>Save to Menu</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setShowAddDishModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: '#FFCC00',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
  },
  addDishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addDishBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 4,
  },
  dishList: {
    backgroundColor: '#121212',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  dishCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  dishCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vegBadge: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dishCardName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  dishCardPrice: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  categoryBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  categoryBubbleActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryBubbleText: {
    fontSize: 11,
    color: '#888',
  },
  categoryBubbleTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputField: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 12,
    color: '#FFF',
    fontSize: 13,
    marginBottom: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  toggleBtn: {
    backgroundColor: '#222',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.veg,
  },
  toggleBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#888',
  },
  toggleBtnTextActive: {
    color: '#000',
  },
  saveDishBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveDishBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  pickerThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#222',
    marginRight: 12,
  },
  noThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pickerButtons: {
    flexDirection: 'row',
  },
  pickerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  pickerActionText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
  shopCategoriesSection: {
    marginTop: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 16,
    marginBottom: 6,
  },
  categoriesScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  catChipText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  catDeleteBtn: {
    marginLeft: 6,
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catDeleteBtnText: {
    color: '#FFB300',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  restoreBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  restoreBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  }
});
