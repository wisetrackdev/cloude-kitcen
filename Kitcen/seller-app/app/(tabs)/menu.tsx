import React, { useState } from 'react';
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
import { Plus, Trash2 } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';

export default function SellerMenuScreen() {
  const selectedKitchenId = 'k3'; // default to Auntie's Homely Tiffin for housewife tiffin demo
  
  const kitchens = useKitchenStore(state => state.kitchens);
  const products = useKitchenStore(state => state.products);
  
  const addProduct = useKitchenStore(state => state.addProduct);
  const deleteProduct = useKitchenStore(state => state.deleteProduct);

  const kitchenInfo = kitchens.find(k => k.id === selectedKitchenId) || kitchens[0];
  const kitchenProducts = products[selectedKitchenId] || [];

  // Local Form states
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishVeg, setNewDishVeg] = useState(true);
  const [newDishCat, setNewDishCat] = useState('Tiffin Meals');

  const handleAddDish = () => {
    if (!newDishName || !newDishPrice) {
      Alert.alert('Error', 'Please fill name and price');
      return;
    }

    addProduct(selectedKitchenId, {
      name: newDishName,
      price: parseFloat(newDishPrice),
      desc: newDishDesc,
      category: newDishCat,
      isVeg: newDishVeg,
      image: newDishVeg 
        ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80'
    });

    setNewDishName('');
    setNewDishPrice('');
    setNewDishDesc('');
    setShowAddDishModal(false);
    Alert.alert('Success', 'Dish added successfully to your kitchen!');
  };

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
                <Text style={styles.dishCardPrice}>₹{item.price}</Text>
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
