import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  CreditCard,
  Clock,
  DollarSign,
  ShoppingBag
} from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';

const { width } = Dimensions.get('window');

export default function KitchenDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const kitchens = useKitchenStore(state => state.kitchens);
  const approveKitchen = useKitchenStore(state => state.approveKitchen);

  const kitchen = kitchens.find(k => k.id === id);

  if (!kitchen) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Kitchen Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Parse Address & GST from formatted string
  const addressStr = kitchen.address || '';
  const gstMatch = addressStr.match(/GST:\s*([A-Za-z0-9]+)/i);
  const gstNumber = gstMatch ? gstMatch[1] : 'Not Provided';
  const cleanAddress = addressStr.split('|')[0].trim();

  const handleApprove = async () => {
    Alert.alert(
      'Approve Kitchen',
      `Are you sure you want to approve "${kitchen.name}"? This will allow them to go online and receive orders.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: async () => {
            await approveKitchen(kitchen.id, 'approved');
            Alert.alert('Success', `Kitchen "${kitchen.name}" approved successfully!`);
            router.back();
          } 
        }
      ]
    );
  };

  const handleReject = async () => {
    Alert.alert(
      'Reject Kitchen',
      `Are you sure you want to reject "${kitchen.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: async () => {
            await approveKitchen(kitchen.id, 'rejected');
            Alert.alert('Rejected', `Kitchen "${kitchen.name}" has been rejected.`);
            router.back();
          } 
        }
      ]
    );
  };

  const getStatusBadge = () => {
    if (kitchen.isApproved === 'approved') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: 'rgba(52, 199, 89, 0.1)', borderColor: '#34C759' }]}>
          <CheckCircle size={14} color="#34C759" />
          <Text style={[styles.statusText, { color: '#34C759' }]}>APPROVED</Text>
        </View>
      );
    } else if (kitchen.isApproved === 'rejected') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderColor: '#FF3B30' }]}>
          <XCircle size={14} color="#FF3B30" />
          <Text style={[styles.statusText, { color: '#FF3B30' }]}>REJECTED</Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 179, 0, 0.1)', borderColor: '#FFB300' }]}>
          <Clock size={14} color="#FFB300" />
          <Text style={[styles.statusText, { color: '#FFB300' }]}>PENDING APPROVAL</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner & Logo */}
        <View style={styles.imageSection}>
          <Image 
            source={{ uri: kitchen.image || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80' }} 
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.logoWrapper}>
            <Image 
              source={{ uri: kitchen.logoUrl || 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&auto=format&fit=crop&q=80' }} 
              style={styles.logoImage} 
            />
          </View>
        </View>

        {/* Shop Name & Status */}
        <View style={styles.titleSection}>
          <Text style={styles.shopName}>{kitchen.name}</Text>
          <Text style={styles.cuisines}>{kitchen.cuisines || 'Home Cooked Food, Thalis'}</Text>
          <View style={{ marginTop: 10 }}>
            {getStatusBadge()}
          </View>
        </View>

        {/* Stats Panel */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <DollarSign size={20} color="#34C759" />
            <Text style={styles.statValue}>₹{kitchen.revenue || 0}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <ShoppingBag size={20} color="#FFB300" />
            <Text style={styles.statValue}>{kitchen.ordersCount || 0}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={20} color="#5856D6" />
            <Text style={styles.statValue}>{kitchen.time || '30 mins'}</Text>
            <Text style={styles.statLabel}>Prep Time</Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller Profile</Text>
          
          <View style={styles.infoRow}>
            <User size={18} color="#FFB300" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Owner Name</Text>
              <Text style={styles.infoValue}>{kitchen.ownerName || 'Housewife Partner'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Phone size={18} color="#FFB300" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Owner Phone</Text>
              <Text style={styles.infoValue}>{kitchen.ownerPhone || 'Not Provided'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop Location Details</Text>
          
          <View style={styles.infoRow}>
            <MapPin size={18} color="#FFB300" style={styles.infoIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Complete Shop Address</Text>
              <Text style={styles.infoValue}>{cleanAddress}</Text>
            </View>
          </View>

          {(kitchen.floor || kitchen.officeGaliNumber) && (
            <View style={styles.row}>
              {kitchen.floor && (
                <View style={[styles.infoRow, { flex: 1 }]}>
                  <MapPin size={16} color="#8E8E93" style={styles.infoIcon} />
                  <View>
                    <Text style={styles.infoLabel}>Floor</Text>
                    <Text style={styles.infoValue}>{kitchen.floor}</Text>
                  </View>
                </View>
              )}
              {kitchen.officeGaliNumber && (
                <View style={[styles.infoRow, { flex: 1 }]}>
                  <MapPin size={16} color="#8E8E93" style={styles.infoIcon} />
                  <View>
                    <Text style={styles.infoLabel}>Shop / Gali No.</Text>
                    <Text style={styles.infoValue}>{kitchen.officeGaliNumber}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Regulatory & Bank Info</Text>

          <View style={styles.infoRow}>
            <FileText size={18} color="#FFB300" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>GSTIN / Tax ID</Text>
              <Text style={[styles.infoValue, { fontWeight: 'bold', color: '#FFB300' }]}>{gstNumber}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <CreditCard size={18} color="#FFB300" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Bank Account Details</Text>
              <Text style={styles.infoValue}>
                {kitchen.bankName ? `${kitchen.bankName} - A/C ${kitchen.accountNumber}` : 'SBI A/C 30948576291'}
              </Text>
              <Text style={styles.bankSubtext}>
                IFSC: {kitchen.ifscCode || 'SBIN0001043'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Fee Payment Proof</Text>

          <View style={styles.infoRow}>
            <FileText size={18} color="#FFB300" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Transaction UTR Number</Text>
              <Text style={[styles.infoValue, { fontWeight: 'bold', color: '#FFB300' }]}>
                {kitchen.utrNumber || 'Not Uploaded'}
              </Text>
            </View>
          </View>

          {kitchen.paymentScreenshot ? (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.infoLabel, { marginBottom: 8 }]}>Payment Screenshot / Proof</Text>
              <Image 
                source={{ uri: kitchen.paymentScreenshot }} 
                style={{ width: '100%', height: 260, borderRadius: 12, borderWidth: 1, borderColor: '#1F1F22', backgroundColor: '#111' }}
                resizeMode="contain"
              />
            </View>
          ) : (
            <Text style={{ color: '#8E8E93', fontSize: 12, fontStyle: 'italic', marginTop: 6 }}>
              No screenshot proof uploaded by the seller.
            </Text>
          )}
        </View>

        {/* Verification Action Buttons */}
        {kitchen.isApproved !== 'approved' && kitchen.isApproved !== 'rejected' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.actionBtn, styles.approveBtn]} 
              onPress={handleApprove}
            >
              <CheckCircle size={18} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.approveBtnText}>Approve & Onboard</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.actionBtn, styles.rejectBtn]} 
              onPress={handleReject}
            >
              <XCircle size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.rejectBtnText}>Reject Request</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#FFB300',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#000',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#1F1F1F',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageSection: {
    height: 180,
    width: '100%',
    position: 'relative',
    marginBottom: 50,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  logoWrapper: {
    position: 'absolute',
    bottom: -40,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#0A0A0A',
    backgroundColor: '#121212',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cuisines: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#1F1F1F',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  infoValue: {
    fontSize: 14,
    color: '#FFF',
    marginTop: 2,
    lineHeight: 18,
  },
  bankSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  approveBtn: {
    backgroundColor: '#FFB300',
  },
  approveBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rejectBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  rejectBtnText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
