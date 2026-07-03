import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image
} from 'react-native';
import { 
  Users, 
  TrendingUp, 
  ShoppingBag, 
  Store,
  CheckCircle,
  Clock,
  X,
  Trash2,
  Send
} from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useKitchenStore } from '../../store/useKitchenStore';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL } from '../../store/apiConfig';

export default function AdminDashboard() {
  const kitchens = useKitchenStore(state => state.kitchens);
  const orders = useKitchenStore(state => state.orders);
  const categories = useKitchenStore(state => state.categories);
  const fetchKitchens = useKitchenStore(state => state.fetchKitchens);
  const fetchOrders = useKitchenStore(state => state.fetchOrders);
  const fetchCategories = useKitchenStore(state => state.fetchCategories);
  const approveKitchen = useKitchenStore(state => state.approveKitchen);
  const createCategory = useKitchenStore(state => state.createCategory);
  const deleteCategory = useKitchenStore(state => state.deleteCategory);

  // Theme support
  const isDarkMode = useAuthStore(state => state.isDarkMode);

  const [selectedKitchen, setSelectedKitchen] = useState<any>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');

  // Support chat states
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [supportInput, setSupportInput] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);

  useEffect(() => {
    if (!showSupportModal) return;
    
    const fetchSupport = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders/support-general/chats`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setSupportMessages(json.data);
          }
        }
      } catch (err) {
        console.warn('Failed to load support chats in admin:', err);
      }
    };

    fetchSupport();
    const interval = setInterval(fetchSupport, 2500);
    return () => clearInterval(interval);
  }, [showSupportModal]);

  const handleSendSupportReply = async () => {
    if (!supportInput.trim()) return;
    const text = supportInput.trim();
    setSupportInput('');
    setSendingSupport(true);
    try {
      await fetch(`${API_BASE_URL}/api/orders/support-general/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'usr-admin-support',
          message: text
        })
      });
      // Refresh local list
      const res = await fetch(`${API_BASE_URL}/api/orders/support-general/chats`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSupportMessages(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to send admin support reply:', err);
    } finally {
      setSendingSupport(false);
    }
  };

  const selectedKitchenOrders = selectedKitchen 
    ? orders.filter(o => o.kitchenId === selectedKitchen.id) 
    : [];

  const selectedKitchenStats = {
    total: selectedKitchenOrders.length,
    pending: selectedKitchenOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length,
    returned: selectedKitchenOrders.filter(o => o.status === 'cancelled').length,
    earnings: selectedKitchenOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0),
    lastUpdated: selectedKitchenOrders.length > 0 ? selectedKitchenOrders[0].date : 'No orders yet'
  };

  useEffect(() => {
    fetchKitchens();
    fetchOrders();
    fetchCategories();
    const interval = setInterval(() => {
      fetchKitchens();
      fetchOrders();
      fetchCategories();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalSales = kitchens.reduce((sum, k) => sum + k.revenue, 0);
  const totalOrdersCount = orders.length;
  const totalShopsCount = kitchens.length;

  const themeColors = {
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    inputBg: isDarkMode ? '#0F0F0F' : '#F0F2F4'
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.sellerHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Users size={28} color="#FFB300" />
          <View style={styles.sellerHeaderMeta}>
            <Text style={styles.sellerRoleText}>Super Admin Panel</Text>
            <Text style={[styles.sellerKitchenName, { color: themeColors.text }]}>Global Analytics</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.adminSupportBtn}
          onPress={() => setShowSupportModal(true)}
        >
          <Text style={styles.adminSupportBtnText}>Support Center</Text>
        </TouchableOpacity>
      </View>

      {/* Global KPI Counters */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <TrendingUp size={16} color="#2ecc71" />
          <Text style={[styles.kpiValue, { color: themeColors.text }]}>₹{totalSales}</Text>
          <Text style={[styles.kpiLabel, { color: themeColors.textSecondary }]}>Platform Sales</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <ShoppingBag size={16} color="#FFB300" />
          <Text style={[styles.kpiValue, { color: themeColors.text }]}>{totalOrdersCount}</Text>
          <Text style={[styles.kpiLabel, { color: themeColors.textSecondary }]}>Orders Handled</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Store size={16} color="#00C49F" />
          <Text style={[styles.kpiValue, { color: themeColors.text }]}>{totalShopsCount}</Text>
          <Text style={[styles.kpiLabel, { color: themeColors.textSecondary }]}>Active Shops</Text>
        </View>
      </View>

      {/* Kitchen Sales breakdowns */}
      <View style={styles.sellerSection}>
        <Text style={[styles.sellerSectionTitle, { color: themeColors.text }]}>Listed Kitchens & Performance</Text>
        {kitchens.map((kitchen) => (
          <TouchableOpacity 
            key={kitchen.id} 
            style={[styles.kitchenAdminCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => setSelectedKitchen(kitchen)}
          >
            <View style={[styles.kitchenAdminMeta, { flex: 1, marginRight: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.kitchenAdminName, { color: themeColors.text }]}>{kitchen.name}</Text>
                {kitchen.address ? (
                  <Text style={[styles.kitchenAdminOwner, { fontSize: 10 }]}>Addr: {kitchen.address}</Text>
                ) : null}
                <Text style={[styles.kitchenAdminOwner, { color: themeColors.textSecondary }]}>Owner ID: {kitchen.owner}</Text>
                <Text style={styles.kitchenAdminType}>
                  {kitchen.type === 'home_tiffin' ? 'Housewife Homestyle Tiffin' : 'Standard Restaurant'}
                </Text>
                
                {/* Approval status badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  {kitchen.isApproved === 'approved' ? (
                    <View style={styles.statusApprovedBadge}>
                      <CheckCircle size={10} color="#2ecc71" />
                      <Text style={styles.statusApprovedText}>APPROVED</Text>
                    </View>
                  ) : kitchen.isApproved === 'rejected' ? (
                    <View style={styles.statusRejectedBadge}>
                      <Clock size={10} color="#FF3B30" />
                      <Text style={styles.statusRejectedText}>REJECTED</Text>
                    </View>
                  ) : (
                    <View style={styles.statusPendingBadge}>
                      <Clock size={10} color="#FF9500" />
                      <Text style={styles.statusPendingText}>PENDING APPROVAL</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.kitchenAdminStats}>
              <Text style={styles.adminStatVal}>₹{kitchen.revenue}</Text>
              <Text style={[styles.adminStatLabel, { color: themeColors.textSecondary }]}>{kitchen.ordersCount} Orders</Text>
              
              {kitchen.isApproved !== 'approved' && kitchen.isApproved !== 'rejected' && (
                <View style={{ marginTop: 8, flexDirection: 'row' }}>
                  <TouchableOpacity
                    style={[styles.approveActionBtn, { marginRight: 6 }]}
                    onPress={() => {
                      approveKitchen(kitchen.id, 'approved');
                      Alert.alert('Approved', `Kitchen "${kitchen.name}" approved!`);
                    }}
                  >
                    <Text style={styles.approveActionText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.approveActionBtn, { backgroundColor: '#FF3B30' }]}
                    onPress={() => {
                      approveKitchen(kitchen.id, 'rejected');
                      Alert.alert('Rejected', `Kitchen "${kitchen.name}" rejected.`);
                    }}
                  >
                    <Text style={[styles.approveActionText, { color: '#FFF' }]}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* System transaction log feed */}
      <View style={styles.sellerSection}>
        <Text style={[styles.sellerSectionTitle, { color: themeColors.text }]}>Global Transactions Log</Text>
        {orders.map((order) => (
          <View key={order.id} style={[styles.logCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.logHeader}>
              <Text style={[styles.logId, { color: themeColors.text }]}>{order.id}</Text>
              <Text style={[styles.logDate, { color: themeColors.textSecondary }]}>{order.date}</Text>
            </View>
            <Text style={[styles.logSummary, { color: themeColors.textSecondary }]}>
              Customer <Text style={{ color: themeColors.text }}>{order.customerName}</Text> paid <Text style={{ color: themeColors.text }}>₹{order.total}</Text> to <Text style={{ color: themeColors.text }}>{order.kitchenName}</Text>
            </Text>
            <View style={[styles.logStatus, { 
              backgroundColor: order.status === 'delivered' ? 'rgba(52,199,89,0.1)' : 'rgba(255,107,0,0.1)',
            }]}>
              <Text style={{ 
                fontSize: 9, 
                fontWeight: 'bold', 
                color: order.status === 'delivered' ? '#2ecc71' : '#FFB300' 
              }}>
                {order.status.toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Category Management */}
      <View style={styles.sellerSection}>
        <Text style={[styles.sellerSectionTitle, { color: themeColors.text }]}>Category Management</Text>
        
        {/* Add Category Box */}
        <View style={[styles.addCatBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <TextInput
            placeholder="Category Name (e.g. Pizza, Cake, Coffee)"
            placeholderTextColor="#888"
            value={newCatName}
            onChangeText={setNewCatName}
            style={[styles.adminInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
          />
          <TextInput
            placeholder="Image URL (Unsplash/Web Link)"
            placeholderTextColor="#888"
            value={newCatImage}
            onChangeText={setNewCatImage}
            style={[styles.adminInput, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
          />
          <TouchableOpacity 
            style={styles.addCatBtn}
            onPress={async () => {
              if (!newCatName.trim()) {
                Alert.alert('Error', 'Please enter a category name');
                return;
              }
              await createCategory(newCatName.trim(), newCatImage.trim());
              setNewCatName('');
              setNewCatImage('');
              Alert.alert('Success', 'Category added globally!');
            }}
          >
            <Text style={styles.addCatBtnText}>Add Category Tag</Text>
          </TouchableOpacity>
        </View>

        {/* Categories Grid */}
        <View style={styles.categoriesGrid}>
          {categories.map((cat) => (
            <View key={cat.id} style={[styles.catCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              {cat.image ? (
                <Image source={{ uri: cat.image }} style={styles.catCardImage} />
              ) : (
                <View style={styles.catCardPlaceholder} />
              )}
              <View style={styles.catCardInfo}>
                <Text style={[styles.catCardName, { color: themeColors.text }]} numberOfLines={1}>{cat.name}</Text>
                <TouchableOpacity onPress={() => {
                  Alert.alert(
                    'Delete Category',
                    `Are you sure you want to delete category "${cat.name}" globally?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Delete', 
                        style: 'destructive',
                        onPress: () => {
                          deleteCategory(cat.id);
                          Alert.alert('Deleted', 'Category deleted globally.');
                        }
                      }
                    ]
                  );
                }}>
                  <Trash2 size={14} color="#FFB300" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={{ height: 40 }} />

      {selectedKitchen && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={selectedKitchen !== null}
          onRequestClose={() => setSelectedKitchen(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
                <Text style={styles.modalTitle}>Shop Administration Details</Text>
                <TouchableOpacity onPress={() => setSelectedKitchen(null)} style={[styles.closeBtn, { backgroundColor: themeColors.border }]}>
                  <X size={18} color={themeColors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                {/* Shop Basic Details */}
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionHeader, { color: themeColors.textSecondary }]}>Basic Information</Text>
                  
                  <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Shop Name:</Text>
                    <Text style={[styles.detailValue, { color: themeColors.text }]}>{selectedKitchen.name}</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Owner Name:</Text>
                    <Text style={[styles.detailValue, { color: themeColors.text }]}>{selectedKitchen.ownerName || 'Housewife Partner'}</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Bank Account:</Text>
                    <Text style={[styles.detailValue, { color: themeColors.text }]}>{selectedKitchen.bankAccount || 'SBI A/C 30948576291'}</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Cuisines:</Text>
                    <Text style={[styles.detailValue, { color: themeColors.text }]}>{selectedKitchen.cuisines}</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Address:</Text>
                    <Text style={[styles.detailValue, { color: themeColors.text }]}>{selectedKitchen.address || 'Not Specified'}</Text>
                  </View>
                </View>

                {/* Dynamic Orders Stats */}
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionHeader, { color: themeColors.textSecondary }]}>Operational Metrics</Text>
                  
                  <View style={styles.metricsGrid}>
                    <View style={[styles.metricItem, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                      <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Total Orders</Text>
                      <Text style={[styles.metricVal, { color: themeColors.text }]}>{selectedKitchenStats.total}</Text>
                    </View>
                    <View style={[styles.metricItem, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                      <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Pending</Text>
                      <Text style={[styles.metricVal, { color: '#FF9500' }]}>{selectedKitchenStats.pending}</Text>
                    </View>
                    <View style={[styles.metricItem, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                      <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Returned</Text>
                      <Text style={[styles.metricVal, { color: '#FF3B30' }]}>{selectedKitchenStats.returned}</Text>
                    </View>
                  </View>

                  <View style={[styles.detailRow, { marginTop: 15, borderTopWidth: 1, borderTopColor: themeColors.border, paddingTop: 10 }]}>
                    <Text style={[styles.detailLabel, { fontWeight: 'bold', color: themeColors.text }]}>Total Earnings:</Text>
                    <Text style={[styles.detailValue, { fontWeight: 'bold', color: '#2ecc71', fontSize: 16 }]}>
                      ₹{selectedKitchenStats.earnings}
                    </Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomColor: 'transparent' }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Last Transaction:</Text>
                    <Text style={[styles.detailValue, { fontSize: 11, color: themeColors.textSecondary }]}>{selectedKitchenStats.lastUpdated}</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {showSupportModal && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showSupportModal}
          onRequestClose={() => setShowSupportModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card, borderColor: themeColors.border, height: '70%' }]}>
              <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
                <Text style={styles.modalTitle}>User Support Messages</Text>
                <TouchableOpacity onPress={() => setShowSupportModal(false)} style={[styles.closeBtn, { backgroundColor: themeColors.border }]}>
                  <X size={18} color={themeColors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {supportMessages.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: themeColors.textSecondary, marginTop: 40 }}>
                    No support chats received yet.
                  </Text>
                ) : (
                  supportMessages.map((msg) => (
                    <View 
                      key={msg.id} 
                      style={{ 
                        marginVertical: 6,
                        alignSelf: msg.senderId === 'usr-admin-support' ? 'flex-end' : 'flex-start',
                        backgroundColor: msg.senderId === 'usr-admin-support' ? '#FFB300' : themeColors.background,
                        padding: 12,
                        borderRadius: 12,
                        maxWidth: '80%'
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: msg.senderId === 'usr-admin-support' ? '#FFF' : '#FFB300', marginBottom: 2 }}>
                        {msg.senderName}
                      </Text>
                      <Text style={{ fontSize: 13, color: msg.senderId === 'usr-admin-support' ? '#FFF' : themeColors.text }}>
                        {msg.message}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Admin Input Row */}
              <View style={{ flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: themeColors.border, alignItems: 'center' }}>
                <TextInput
                  placeholder="Type administrator response..."
                  placeholderTextColor="#888"
                  value={supportInput}
                  onChangeText={setSupportInput}
                  style={[styles.adminInput, { flex: 1, marginBottom: 0, marginRight: 10, backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
                />
                <TouchableOpacity 
                  style={{ backgroundColor: '#FFB300', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
                  onPress={handleSendSupportReply}
                  disabled={sendingSupport}
                >
                  <Send size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sellerHeaderMeta: {
    marginLeft: 12,
  },
  sellerRoleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFB300',
    textTransform: 'uppercase',
  },
  sellerKitchenName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  kpiLabel: {
    fontSize: 9,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  sellerSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sellerSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  kitchenAdminCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  kitchenAdminMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kitchenAdminName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  kitchenAdminOwner: {
    fontSize: 11,
    marginTop: 2,
  },
  kitchenAdminType: {
    fontSize: 9,
    color: '#FFB300',
    fontWeight: '600',
    marginTop: 4,
  },
  kitchenAdminStats: {
    alignItems: 'flex-end',
  },
  adminStatVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  adminStatLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  logCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB300',
    borderWidth: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  logId: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  logDate: {
    fontSize: 9,
  },
  logSummary: {
    fontSize: 11,
    lineHeight: 16,
  },
  logStatus: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 8,
  },
  statusApprovedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46,204,113,0.1)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusApprovedText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginLeft: 4,
  },
  statusPendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,204,0,0.1)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusPendingText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FF9500',
    marginLeft: 4,
  },
  statusRejectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusRejectedText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginLeft: 4,
  },
  approveActionBtn: {
    backgroundColor: '#FFB300',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  approveActionText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '80%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFB300',
  },
  closeBtn: {
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 6,
  },
  addCatBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  adminInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  addCatBtn: {
    backgroundColor: '#FFB300',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCatBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  catCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  catCardImage: {
    width: '100%',
    height: 90,
    backgroundColor: '#333',
  },
  catCardPlaceholder: {
    width: '100%',
    height: 90,
    backgroundColor: '#222',
  },
  catCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  catCardName: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  adminSupportBtn: {
    backgroundColor: '#FFB300',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adminSupportBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  }
});
