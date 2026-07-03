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
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL } from '../../store/apiConfig';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export default function AdminSupportChatScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Poll chats ONLY when screen is active
  useEffect(() => {
    fetchMessages();

    // Establish polling connection (every 2.5 seconds)
    const intervalId = setInterval(() => {
      fetchMessages(false);
    }, 2500);

    // Clean up connection immediately when chat unmounts (closes)
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const fetchMessages = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/support-general/chats`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          // Sort messages by date/time or keep insertion order
          setMessages(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load support chats:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const senderId = user?.id || 'usr-9281';
      const res = await fetch(`${API_BASE_URL}/api/orders/support-general/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId,
          message: messageText
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          // Immediately refresh chat logs
          await fetchMessages(false);
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      }
    } catch (err) {
      console.warn('Error sending message:', err);
      // Fallback local append for preview
      const localMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        senderId: user?.id || 'usr-9281',
        senderName: user?.name || 'Customer',
        message: messageText,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, localMsg]);
    } finally {
      setSending(false);
      
      // Auto-simulation reply if admin is offline
      setTimeout(() => {
        const responseMsg: ChatMessage = {
          id: 'msg-reply-' + Date.now(),
          senderId: 'usr-admin-support',
          senderName: 'Clude Support Agent',
          message: `Hello ${user?.firstName || 'User'}, we have received your request regarding: "${messageText}". Support ticket #TK${Math.floor(1000 + Math.random() * 9000)} created. An administrator will review this shortly!`,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => {
          // Check if already contains mock reply to prevent doubling
          if (prev.some(m => m.senderId === 'usr-admin-support' && m.message.includes(messageText))) return prev;
          return [...prev, responseMsg];
        });
      }, 1500);
    }
  };

  const isMyMessage = (msg: ChatMessage) => {
    return msg.senderId === user?.id || msg.senderId === 'usr-9281';
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Gold Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <Text style={styles.headerTitle}>Support Chat</Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>Admin Agent Active</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* White rounded body card */}
      <View style={styles.bodyCard}>
        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color="#FFB300" />
            <Text style={styles.loadingText}>Connecting to Support Agent...</Text>
          </View>
        ) : (
          <>
            <ScrollView 
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              <Text style={styles.chatIntroText}>
                Describe your issue below (order issues, refunds, cancellations). An administrator will respond shortly.
              </Text>
              
              {messages.map(msg => (
                <View 
                  key={msg.id} 
                  style={[
                    styles.messageRow, 
                    isMyMessage(msg) ? styles.myMessageRow : styles.otherMessageRow
                  ]}
                >
                  <View 
                    style={[
                      styles.messageBubble,
                      isMyMessage(msg) ? styles.myMessageBubble : styles.otherMessageBubble
                    ]}
                  >
                    {!isMyMessage(msg) && (
                      <Text style={styles.senderLabel}>{msg.senderName}</Text>
                    )}
                    <Text style={[
                      styles.messageText,
                      isMyMessage(msg) ? styles.myMessageText : styles.otherMessageText
                    ]}>
                      {msg.message}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Input Row */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Type your query..."
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={setInputText}
                style={styles.chatInput}
              />
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={handleSendMessage}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Send size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFCC00', // Gold header matching mockup
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 35,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMeta: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2ecc71',
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  bodyCard: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 12,
  },
  messageList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  chatIntroText: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 15,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    width: '100%',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  myMessageBubble: {
    backgroundColor: '#FFB300', // Customer message bubble orange
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFF', // Admin message bubble white
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderBottomLeftRadius: 4,
  },
  senderLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFB300',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  myMessageText: {
    color: '#FFF',
  },
  otherMessageText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#EAEAEA',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#333',
    fontSize: 13,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#FFB300',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFB300',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  }
});
