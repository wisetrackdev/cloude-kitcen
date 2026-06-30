import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, ArrowLeft, Star, Clock } from 'lucide-react-native';
import { theme } from '../../styles/theme';

const trendingSearches = ['Pizza Margherita', 'Burgers Near Me', 'Hyderabadi Biryani', 'Sushi Rolls', 'Cold Brew Coffee'];

const mockDishes = [
  { id: 'p1', name: 'Margherita Pizza', price: 249, restaurant: 'The Pizza Box', rating: 4.8, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=120&auto=format&fit=crop&q=80' },
  { id: 'p3', name: 'Crunchy Chicken Burger', price: 189, restaurant: 'Burger Bistro', rating: 4.5, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&auto=format&fit=crop&q=80' },
  { id: 'p4', name: 'Garlic Breadsticks', price: 129, restaurant: 'The Pizza Box', rating: 4.2, image: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=120&auto=format&fit=crop&q=80' }
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = query 
    ? mockDishes.filter(dish => dish.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.inputWrapper}>
          <Search size={18} color={theme.colors.textSecondary} />
          <TextInput
            placeholder="Search for restaurants or dishes..."
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            style={styles.input}
          />
        </View>
      </View>

      {query.length === 0 ? (
        // Trending/Recent search page
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Trending Searches</Text>
          <View style={styles.chipsRow}>
            {trendingSearches.map((term) => (
              <TouchableOpacity 
                key={term}
                style={styles.chip}
                onPress={() => setQuery(term)}
              >
                <Text style={styles.chipText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        // Results
        <FlatList
          data={filtered}
          contentContainerStyle={styles.resultsList}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View style={styles.emptyResults}>
              <Text style={styles.emptyText}>No food items match "{query}"</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.resultItem}
              onPress={() => router.push('/restaurant/1')} // Redirect to mock restaurant page
            >
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemRestaurant}>By {item.restaurant}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
                
                <View style={styles.ratingRow}>
                  <Star size={10} color="#FFD700" style={{ fill: '#FFD700' }} />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 50,
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    marginLeft: 12,
  },
  recentSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 10,
  },
  chipText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  resultsList: {
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#222',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  itemRestaurant: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#222',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 4,
  },
  emptyResults: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  }
});
