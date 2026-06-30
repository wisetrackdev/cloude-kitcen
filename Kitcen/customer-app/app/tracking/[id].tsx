import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Phone, MessageSquare, ShieldCheck, MapPin, Navigation } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const orders = useKitchenStore(state => state.orders);
  const activeOrder = orders.find(o => o.id === id);

  const getStatusNumber = (status: string) => {
    switch (status) {
      case 'placed': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'on_the_way': return 4;
      case 'delivered': return 5;
      default: return 1;
    }
  };

  const currentStatus = activeOrder ? activeOrder.status : 'placed';
  const statusStep = getStatusNumber(currentStatus);

  const getEta = (status: string) => {
    if (status === 'placed') return 30;
    if (status === 'preparing') return 20;
    if (status === 'ready') return 15;
    if (status === 'on_the_way') return 8;
    return 0;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracker ({id})</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Map visual section */}
      <View style={styles.mapMock}>
        <View style={styles.mapOverlayInfo}>
          <Navigation size={18} color={theme.colors.primary} />
          <Text style={styles.mapEtaText}>
            {currentStatus === 'delivered' ? 'Order Delivered 🎉' : 
             currentStatus === 'cancelled' ? 'Order Cancelled ❌' : 
             `Arriving in ${getEta(currentStatus)} mins`}
          </Text>
        </View>

        {/* Dummy Map Route */}
        <View style={styles.mapGraphicWrapper}>
          <MapPin size={24} color={theme.colors.veg} style={styles.restaurantPin} />
          <View style={styles.mapDottedPath} />
          <MapPin size={24} color={theme.colors.primary} style={styles.homePin} />
        </View>
      </View>

      <ScrollView style={styles.statusSection} showsVerticalScrollIndicator={false}>
        {/* Rider profile card */}
        <View style={styles.riderCard}>
          <View style={styles.riderMeta}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' }} 
              style={styles.riderAvatar} 
            />
            <View>
              <Text style={styles.riderName}>Vikram Singh</Text>
              <Text style={styles.riderVehicle}>Hero Splendor (MH-02-AB-9831)</Text>
            </View>
          </View>
          <View style={styles.riderActions}>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => Alert.alert('Call Rider', 'Simulating call to +91 9876543210')}
            >
              <Phone size={16} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => Alert.alert('Chat Rider', 'Rider is driving and will respond once stopped.')}
            >
              <MessageSquare size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vertical status tracker */}
        <View style={styles.trackerWrapper}>
          {[
            { step: 1, label: 'Order Confirmed', sub: 'We have received your order' },
            { step: 2, label: 'Cooking & Preparing', sub: 'Chef is preparing your fresh meal' },
            { step: 3, label: 'Ready for Pickup', sub: 'Kitchen has packed your order' },
            { step: 4, label: 'On The Way', sub: 'Rider is speeding towards your house' },
            { step: 5, label: 'Delivered', sub: 'Enjoy your delicious tiffin/food!' }
          ].map((item) => {
            const isCompleted = statusStep >= item.step;
            return (
              <View key={item.step} style={styles.trackerStep}>
                <View style={styles.bulletCol}>
                  <View style={[
                    styles.trackerCircle, 
                    isCompleted && styles.trackerCircleActive
                  ]}>
                    {isCompleted && <View style={styles.trackerDot} />}
                  </View>
                  {item.step !== 5 && <View style={[styles.trackerLine, isCompleted && styles.trackerLineActive]} />}
                </View>
                <View style={styles.trackerTextContainer}>
                  <Text style={[styles.stepLabel, isCompleted && styles.stepLabelActive]}>
                    {item.label}
                  </Text>
                  <Text style={styles.stepSub}>{item.sub}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Safety standards */}
        <View style={styles.safetyCard}>
          <ShieldCheck size={16} color={theme.colors.veg} />
          <Text style={styles.safetyText}>
            Our riders undergo daily temperature screenings and follow strictly contactless delivery protocols.
          </Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  mapMock: {
    height: 220,
    backgroundColor: '#151515',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapOverlayInfo: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapEtaText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 8,
  },
  mapGraphicWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '60%',
  },
  restaurantPin: {
    transform: [{ scale: 1.2 }],
  },
  mapDottedPath: {
    flex: 1,
    height: 2,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginHorizontal: 10,
  },
  homePin: {
    transform: [{ scale: 1.2 }],
  },
  statusSection: {
    flex: 1,
    padding: 16,
  },
  riderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  riderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222',
    marginRight: 12,
  },
  riderName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  riderVehicle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  riderActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F1F1F',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  trackerWrapper: {
    paddingLeft: 8,
    marginBottom: 24,
  },
  trackerStep: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  bulletCol: {
    alignItems: 'center',
    marginRight: 16,
  },
  trackerCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackerCircleActive: {
    borderColor: theme.colors.primary,
  },
  trackerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  trackerLine: {
    width: 2,
    height: 40,
    backgroundColor: '#333',
    marginTop: 4,
  },
  trackerLineActive: {
    backgroundColor: theme.colors.primary,
  },
  trackerTextContainer: {
    flex: 1,
    paddingTop: 1,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#444',
  },
  stepLabelActive: {
    color: '#FFF',
  },
  stepSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,199,89,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  safetyText: {
    flex: 1,
    fontSize: 10,
    color: theme.colors.veg,
    lineHeight: 14,
    marginLeft: 8,
  }
});
