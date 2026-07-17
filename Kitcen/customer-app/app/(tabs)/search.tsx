import React, { useState, useEffect } from 'react';
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
import { Search, Star, Clock, MapPin, Store, Sparkles } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';

type FilterType = 'all' | 'home_tiffin' | 'restaurant';

export default function StoresScreen() {
  const router = useRouter();
  const isDarkMode = useAuthStore(state => state.isDarkMode);
  
  const kitchens = useKitchenStore(state => state.kitchens);
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    fetchKitchens();
  }, []);

  const themeColors = {
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    inputBg: isDarkMode ? '#121212' : '#FFFFFF'
  };

  const getFilteredKitchens = () => {
    // Only show kitchens that are approved AND are live (isLive !== false)
    let list = kitchens.filter(k => k.isApproved === 'approved' && k.isLive !== false);
    
    // Type Filter
    if (activeFilter !== 'all') {
      list = list.filter(k => k.type === activeFilter);
    }
    
    // Search Query Filter
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(k => 
        k.name.toLowerCase().includes(q) || 
        k.cuisines.toLowerCase().includes(q)
      );
    }
    
    return list;
  };

  const filteredList = getFilteredKitchens();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      
      {/* Search Header */}
      <View style={[styles.searchHeader, { borderBottomColor: themeColors.border, backgroundColor: themeColors.card }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Cloude Stores</Text>
        <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>Browse local kitchens & housewife tiffins</Text>
        
        <View style={[styles.inputWrapper, { backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}>
          <Search size={18} color={themeColors.textSecondary} />
          <TextInput
            placeholder="Search stores by name or cuisine..."
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            style={[styles.input, { color: themeColors.text }]}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'home_tiffin', 'restaurant'] as FilterType[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              { backgroundColor: themeColors.card, borderColor: themeColors.border },
              activeFilter === filter && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                { color: themeColors.textSecondary },
                activeFilter === filter && { color: '#000', fontWeight: 'bold' }
              ]}
            >
              {filter === 'all' ? 'All Stores' : filter === 'home_tiffin' ? 'Housewife Tiffin' : 'Restaurants'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Store list */}
      <FlatList
        data={filteredList}
        contentContainerStyle={styles.resultsList}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyResults}>
            <Store size={44} color="#555" style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              {kitchens.length === 0 
                ? 'No stores available at the moment.' 
                : 'No store matches your filter criteria.'
              }
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.resultItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => router.push(`/restaurant/${item.id}`)}
          >
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.offerBadge}>
              <Text style={styles.offerText}>{item.offer || 'Flat 50% OFF'}</Text>
            </View>

            <View style={styles.itemDetails}>
              <View style={styles.nameRow}>
                <Text style={[styles.itemName, { color: themeColors.text }]} numberOfLines={1}>{item.name}</Text>
              </View>

              <Text style={[styles.itemCuisines, { color: themeColors.textSecondary }]} numberOfLines={1}>
                {item.cuisines}
              </Text>

              <View style={styles.metaRow}>
                <MapPin size={11} color={themeColors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>{item.distance || '1.5 km'}</Text>
                
                <View style={[styles.typeBadge, { 
                  backgroundColor: item.type === 'home_tiffin' ? 'rgba(46,204,113,0.1)' : 'rgba(255,107,0,0.1)',
                  marginLeft: 10
                }]}>
                  <Text style={[styles.typeText, { 
                    color: item.type === 'home_tiffin' ? theme.colors.veg : theme.colors.primary 
                  }]}>
                    {item.type === 'home_tiffin' ? 'Tiffin' : 'Shop'}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 13,
    marginLeft: 12,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 14,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  resultItem: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  itemImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#222',
  },
  offerBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    backgroundColor: theme.colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  offerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
  },
  itemDetails: {
    padding: 14,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFCC00',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
  },
  itemCuisines: {
    fontSize: 11,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 10,
    marginLeft: 4,
    marginRight: 6,
  },
  typeBadge: {
    marginLeft: 'auto',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  emptyResults: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 12,
  }
});
