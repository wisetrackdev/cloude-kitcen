import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../store/apiConfig';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export default function SellerCustomerChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  const customerName = (params.customerName as string) || 'Customer';

  const user = useAuthStore(state => state.user);
  const isDarkMode = useAuthStore(state => state.isDarkMode);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  const themeColors = {
    background: isDarkMode ? '#0B0B0C' : '#F5F6F8',
    card: isDarkMode ? '#121214' : '#FFFFFF',
    border: isDarkMode ? '#1F1F22' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    inputBg: isDarkMode ? '#0F0F0F' : '#F0F2F4',
    primary: '#FFB300',
  };

  const fetchChats = async (showLoading = true) => {
    if (!orderId) return;
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/chats`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setMessages(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch order chats offline');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(() => {
      fetchChats(false);
    }, 2500);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const msgText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'seller',
          message: msgText
        })
      });
      if (res.ok) {
        await fetchChats(false);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (err) {
      // Fallback local simulation
      const simulated: ChatMessage = {
        id: 'msg-' + Math.random(),
        senderId: 'seller',
        senderName: user?.name || 'Seller Partner',
        message: msgText,
        createdAt: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, simulated]);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border, backgroundColor: themeColors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: themeColors.text }]}>{customerName}</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Order ID: {orderId}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={{ color: themeColors.textSecondary, marginTop: 10 }}>Loading chat history...</Text>
          </View>
        ) : (
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((m) => {
              const isMe = m.senderId === 'seller';
              return (
                <View 
                  key={m.id} 
                  style={[
                    styles.messageBubble, 
                    isMe ? [styles.myBubble, { backgroundColor: themeColors.primary }] : [styles.theirBubble, { backgroundColor: themeColors.card, borderColor: themeColors.border }]
                  ]}
                >
                  {!isMe && (
                    <Text style={[styles.senderName, { color: themeColors.textSecondary }]}>
                      {m.senderName || 'Customer'}
                    </Text>
                  )}
                  <Text style={[styles.messageText, { color: isMe ? '#000' : themeColors.text }]}>
                    {m.message}
                  </Text>
                  <Text style={[styles.timeText, { color: isMe ? 'rgba(0,0,0,0.5)' : themeColors.textSecondary }]}>
                    {m.createdAt}
                  </Text>
                </View>
              );
            })}

            {messages.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={{ color: themeColors.textSecondary, fontSize: 13 }}>
                  No messages yet. Say Hello to the customer!
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: themeColors.card, borderTopColor: themeColors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: themeColors.primary }]}
            onPress={handleSendMessage}
            disabled={sending}
          >
            <Send size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  headerInfo: {
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  myBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  senderName: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  timeText: {
    fontSize: 8,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    marginRight: 10,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
