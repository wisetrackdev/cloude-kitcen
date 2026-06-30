import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  Alert 
} from 'react-native';
import { Plus, Trash2, ChefHat, Tag } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function SellerMenuScreen() {
  const user = useAuthStore(state => state.user);
  const kitchens = useKitchenStore(state => state.kitchens);
  const products = useKitchenStore(state => state.products);
  const categories = useKitchenStore(state => state.categories);
  
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);
  const fetchProducts = useKitchenStore(state => state.fetchProducts);
  const fetchCategories = useKitchenStore(state => state.fetchCategories);
  const createCategory = useKitchenStore(state => state.createCategory);
  const addProduct = useKitchenStore(state => state.addProduct);
  const deleteProduct = useKitchenStore(state => state.deleteProduct);

  // Find user's kitchen by ownerId
  const myKitchen = kitchens.find(k => k.owner === user?.id) || kitchens[0];
  const selectedKitchenId = myKitchen?.id || 'k3';

  const kitchenInfo = myKitchen || kitchens[0] || { name: 'My Kitchen', isApproved: 'pending' };
  const kitchenProducts = products[selectedKitchenId] || [];

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

  // Local Form states
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishVeg, setNewDishVeg] = useState(true);
  const [newDishCat, setNewDishCat] = useState('Tiffin Meals');
  const [customCategory, setCustomCategory] = useState('');

  const handleAddDish = async () => {
    if (!newDishName || !newDishPrice) {
      Alert.alert('Error', 'Please fill name and price');
      return;
    }

    let finalCategory = newDishCat;
    if (customCategory.trim() !== '') {
      finalCategory = customCategory.trim();
      // Call store to create category in database dynamically
      await createCategory(finalCategory);
    }

    await addProduct(selectedKitchenId, {
      name: newDishName,
      price: parseFloat(newDishPrice),
      desc: newDishDesc,
      category: finalCategory,
      isVeg: newDishVeg,
      image: newDishVeg 
        ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80'
    });

    setNewDishName('');
    setNewDishPrice('');
    setNewDishDesc('');
    setCustomCategory('');
    setShowAddDishModal(false);
    Alert.alert('Success', 'Dish added successfully to your kitchen!');
  };

  const isApproved = myKitchen?.isApproved === 'approved';

  if (!isApproved) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <ChefHat size={64} color={theme.colors.warning} style={{ marginBottom: 20 }} />
        <Text style={{ color: theme.colors.warning, fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
          Approval Pending
        </Text>
        <Text style={{ color: '#FFF', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 }}>
          Your kitchen "{kitchenInfo.name}" is pending approval from the SuperAdmin.
        </Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 8, lineHeight: 18, paddingHorizontal: 20 }}>
          Once approved, you will be able to manage orders, setup categories, and add items to your menu.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Menu Catalog</Text>
        <TouchableOpacity 
          style={styles.addDishBtn}
          onPress={() => setShowAddDishModal(true)}
        >
          <Plus size={14} color="#000" />
          <Text style={styles.addDishBtnText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Manage available items for {kitchenInfo.name}</Text>

      <View style={styles.dishList}>
        {kitchenProducts.map((item) => (
          <View key={item.id} style={styles.dishCard}>
            <View style={styles.dishCardMeta}>
              <View style={[styles.vegBadge, { borderColor: item.isVeg ? theme.colors.veg : theme.colors.nonVeg }]}>
                <View style={[styles.vegDot, { backgroundColor: item.isVeg ? theme.colors.veg : theme.colors.nonVeg }]} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.dishCardName}>{item.name}</Text>
                <Text style={styles.dishCardPrice}>₹{item.price} • {item.category}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => deleteProduct(selectedKitchenId, item.id)}>
              <Trash2 size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ))}
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
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Dish or Tiffin Package</Text>

              <TextInput
                placeholder="Dish Name (e.g. Kadhai Paneer Tiffin)"
                placeholderTextColor="#888"
                value={newDishName}
                onChangeText={setNewDishName}
                style={styles.inputField}
              />

              <TextInput
                placeholder="Price (₹)"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={newDishPrice}
                onChangeText={setNewDishPrice}
                style={styles.inputField}
              />

              <TextInput
                placeholder="Description (e.g. 4 rotis, paneer, salad)"
                placeholderTextColor="#888"
                value={newDishDesc}
                onChangeText={setNewDishDesc}
                style={styles.inputField}
              />

              {/* Category Selection */}
              <Text style={styles.sectionLabel}>Choose Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryBubble,
                      newDishCat === cat.name && styles.categoryBubbleActive
                    ]}
                    onPress={() => {
                      setNewDishCat(cat.name);
                      setCustomCategory('');
                    }}
                  >
                    <Tag size={10} color={newDishCat === cat.name ? '#000' : '#888'} style={{ marginRight: 4 }} />
                    <Text style={[
                      styles.categoryBubbleText,
                      newDishCat === cat.name && styles.categoryBubbleTextActive
                    ]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                placeholder="Or create new category (e.g. Desserts)"
                placeholderTextColor="#888"
                value={customCategory}
                onChangeText={(text) => {
                  setCustomCategory(text);
                  setNewDishCat(text);
                }}
                style={styles.inputField}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Dietary Status: Veg Item</Text>
                <TouchableOpacity 
                  style={[styles.toggleBtn, newDishVeg && styles.toggleBtnActive]}
                  onPress={() => setNewDishVeg(!newDishVeg)}
                >
                  <Text style={[styles.toggleBtnText, newDishVeg && styles.toggleBtnTextActive]}>
                    {newDishVeg ? 'VEG' : 'NON-VEG'}
                  </Text>
                </TouchableOpacity>
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
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  addDishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
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
  }
});
