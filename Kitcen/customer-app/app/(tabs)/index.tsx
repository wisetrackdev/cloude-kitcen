import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  FlatList 
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  MapPin, 
  Bell, 
  Search, 
  Star, 
  Clock, 
  ShieldCheck 
} from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useKitchenStore } from '../../store/useKitchenStore';

const categories = [
  { id: '1', name: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=120&auto=format&fit=crop&q=60' },
  { id: '2', name: 'Burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&auto=format&fit=crop&q=60' },
  { id: '3', name: 'Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=120&auto=format&fit=crop&q=60' },
  { id: '4', name: 'Tiffin', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=60' },
  { id: '5', name: 'Drinks', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=120&auto=format&fit=crop&q=60' }
];

export default function HomeScreen() {
  const router = useRouter();
  const location = useAuthStore(state => state.location);
  const user = useAuthStore(state => state.user);
  
  const kitchens = useKitchenStore(state => state.kitchens);
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);
  const detectLocation = useAuthStore(state => state.detectLocation);

  React.useEffect(() => {
    fetchKitchens();
    detectLocation();
    const interval = setInterval(() => {
      fetchKitchens();
    }, 10000); // Poll kitchens every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.locationContainer}>
          <MapPin size={18} color={theme.colors.primary} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle}>Delivery Location</Text>
            <Text style={styles.locationName} numberOfLines={1}>
              {location?.addressName || 'Detecting GPS...'}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bellButton}>
          <Bell size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Greeting info */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Hello, {user?.name || 'Clude Guest'} 👋</Text>
        <Text style={styles.subWelcomeText}>Order healthy housewife tiffins and restaurant specials</Text>
      </View>

      {/* Quick Search */}
      <TouchableOpacity 
        style={styles.searchBar} 
        activeOpacity={0.8}
        onPress={() => router.push('/search')}
      >
        <Search size={18} color={theme.colors.textSecondary} />
        <Text style={styles.searchPlaceholder}>Search for pizza, tiffins, home-food...</Text>
      </TouchableOpacity>

      {/* Quick Categories */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>What's on your mind?</Text>
      </View>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.categoryCard}>
            <Image source={{ uri: item.image }} style={styles.categoryImage} />
            <Text style={styles.categoryName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
      />

      {/* Food Outlets */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Kitchens Nearby</Text>
      </View>
      <View style={styles.restaurantContainer}>
        {kitchens.map((kitchen) => (
          <TouchableOpacity 
            key={kitchen.id}
            style={styles.restaurantCard}
            activeOpacity={0.95}
            onPress={() => router.push(`/restaurant/${kitchen.id}`)}
          >
            <Image source={{ uri: kitchen.image }} style={styles.restaurantImage} />
            
            <View style={styles.offerBadge}>
              <Text style={styles.offerText}>{kitchen.offer}</Text>
            </View>

            <View style={styles.restaurantDetails}>
              <View style={styles.restaurantRow}>
                <Text style={styles.restaurantName}>{kitchen.name}</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>{kitchen.rating}</Text>
                  <Star size={10} color="#000" style={styles.starIcon} />
                </View>
              </View>
              <View style={styles.typeBadgeRow}>
                <Text style={styles.restaurantCuisines}>{kitchen.cuisines}</Text>
                <Text style={[styles.kitchenTypeTag, { 
                  backgroundColor: kitchen.type === 'home_tiffin' ? 'rgba(52,199,89,0.1)' : 'rgba(255,107,0,0.1)',
                  color: kitchen.type === 'home_tiffin' ? theme.colors.veg : theme.colors.primary
                }]}>
                  {kitchen.type === 'home_tiffin' ? 'Housewife Tiffin' : 'Restaurant'}
                </Text>
              </View>
              
              <View style={styles.deliveryRow}>
                <View style={styles.statItem}>
                  <Clock size={12} color={theme.colors.textSecondary} />
                  <Text style={styles.statText}>{kitchen.time}</Text>
                </View>
                <Text style={styles.bulletSeparator}>•</Text>
                <Text style={styles.statText}>{kitchen.distance}</Text>
                <Text style={styles.bulletSeparator}>•</Text>
                <View style={styles.statItem}>
                  <ShieldCheck size={12} color={theme.colors.veg} />
                  <Text style={styles.statText}>Safe Homestyle Cooking</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  locationTextContainer: {
    marginLeft: 8,
  },
  locationTitle: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  locationName: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  welcomeSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subWelcomeText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  searchPlaceholder: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginLeft: 10,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  categoryList: {
    paddingLeft: 16,
    marginBottom: 24,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 18,
  },
  categoryImage: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  categoryName: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '600',
    marginTop: 8,
  },
  restaurantContainer: {
    paddingHorizontal: 16,
  },
  restaurantCard: {
    backgroundColor: '#121212',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    marginBottom: 20,
    overflow: 'hidden',
  },
  restaurantImage: {
    width: '100%',
    height: 180,
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
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
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
    color: '#FFF',
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
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  starIcon: {
    marginLeft: 2,
  },
  restaurantCuisines: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    flex: 1,
    marginRight: 10,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    paddingTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginLeft: 4,
  },
  bulletSeparator: {
    color: theme.colors.textSecondary,
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
  }
});
