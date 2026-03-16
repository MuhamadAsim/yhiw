// components/provider/ChatPopup.tsx (Provider Side)
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://yhiw-backend.onrender.com';

interface Message {
  id: string;
  text: string;
  sender: 'provider' | 'customer';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface ChatPopupProps {
  visible: boolean;
  onClose: () => void;
  bookingId: string;
  customerName: string;
  onChatClosed?: () => void; // Add this prop to match customer version
}

const ChatPopup: React.FC<ChatPopupProps> = ({
  visible,
  onClose,
  bookingId,
  customerName,
  onChatClosed,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pollingTimer = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  // Load chat history when modal opens
  useEffect(() => {
    if (visible) {
      loadChatHistory();
      startPolling();
      // Immediately notify parent to clear the dot when opening
      if (onChatClosed) {
        onChatClosed();
      }
    } else {
      // Stop polling when modal closes
      if (pollingTimer.current) {
        clearTimeout(pollingTimer.current);
        pollingTimer.current = null;
      }
      // Call onChatClosed when modal closes
      if (onChatClosed) {
        onChatClosed();
      }
    }

    return () => {
      isMounted.current = false;
      if (pollingTimer.current) {
        clearTimeout(pollingTimer.current);
        pollingTimer.current = null;
      }
    };
  }, [visible]);

  const loadChatHistory = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        console.log('❌ No token found for chat');
        return;
      }

      console.log('📡 Loading chat history for booking:', bookingId);
      const response = await fetch(`${API_BASE_URL}/api/chat/${bookingId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.messages) {
        // Transform backend messages to our format
        const formattedMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg._id || msg.id || Date.now().toString(),
          text: msg.text,
          sender: msg.senderType === 'customer' ? 'customer' : 'provider',
          timestamp: new Date(msg.timestamp),
          status: msg.status || 'delivered',
        }));
        
        setMessages(formattedMessages);
        console.log(`✅ Loaded ${formattedMessages.length} messages`);
        
        // Scroll to bottom after loading
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error('❌ Error loading chat history:', error);
      // Only show sample messages in development
      if (__DEV__) {
        setMessages(getSampleMessages());
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for new messages
  const pollForMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const lastMessage = messages[messages.length - 1];
      const lastMessageId = lastMessage?.id;
      
      // Build URL with last message ID for efficient polling
      let url = `${API_BASE_URL}/api/chat/${bookingId}/poll`;
      if (lastMessageId && !lastMessageId.startsWith('temp-')) {
        url += `?lastMessageId=${lastMessageId}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      
      if (data.success && data.newMessages && data.newMessages.length > 0) {
        // Add new messages to the list
        const newMessages: Message[] = data.newMessages.map((msg: any) => ({
          id: msg._id || msg.id || Date.now().toString(),
          text: msg.text,
          sender: msg.senderType === 'customer' ? 'customer' : 'provider',
          timestamp: new Date(msg.timestamp),
          status: msg.status || 'delivered',
        }));
        
        setMessages(prev => [...prev, ...newMessages]);
        console.log(`📨 Received ${newMessages.length} new messages`);
        
        // Scroll to bottom when new messages arrive
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error('❌ Error polling messages:', error);
    }
  };

  const startPolling = () => {
    const poll = async () => {
      if (!isMounted.current || !visible) return;
      
      await pollForMessages();
      
      if (isMounted.current && visible) {
        pollingTimer.current = setTimeout(poll, 3000); // Poll every 3 seconds
      }
    };
    
    // Start polling after 2 seconds
    setTimeout(poll, 2000);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sendingMessage) return;

    const messageText = inputText.trim();
    setInputText('');
    setSendingMessage(true);

    // Create temporary message
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      sender: 'provider',
      timestamp: new Date(),
      status: 'sending',
    };

    // Add to UI immediately
    setMessages(prev => [...prev, tempMessage]);
    flatListRef.current?.scrollToEnd({ animated: true });

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to send messages');
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        return;
      }

      // Simple request body - only text and a flag indicating sender is provider
      const requestBody = {
        text: messageText,
        senderType: 'provider', // Flag to indicate this is from provider side
      };

      console.log('📤 Sending message from provider...');
      const response = await fetch(`${API_BASE_URL}/api/chat/${bookingId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Send message error:', response.status, errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update temp message with real ID and status
        setMessages(prev =>
          prev.map(m =>
            m.id === tempMessage.id
              ? { 
                  ...m, 
                  id: data.messageId || data.message?._id || m.id, 
                  status: 'sent' 
                }
              : m
          )
        );
        console.log('✅ Message sent successfully');
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        Alert.alert('Error', data.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send message. Please check your connection.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Sample messages for demo when API is not available
  const getSampleMessages = (): Message[] => [
    {
      id: '1',
      text: `Hello! I'm on my way to your location.`,
      sender: 'provider',
      timestamp: new Date(Date.now() - 15 * 60000),
      status: 'read',
    },
    {
      id: '2',
      text: 'Great! I\'m waiting at the pickup location.',
      sender: 'customer',
      timestamp: new Date(Date.now() - 12 * 60000),
      status: 'read',
    },
    {
      id: '3',
      text: 'I should arrive in about 5-10 minutes.',
      sender: 'provider',
      timestamp: new Date(Date.now() - 5 * 60000),
      status: 'read',
    },
    {
      id: '4',
      text: 'Thanks for the update!',
      sender: 'customer',
      timestamp: new Date(Date.now() - 3 * 60000),
      status: 'delivered',
    },
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageRow,
      item.sender === 'provider' ? styles.providerMessageRow : styles.customerMessageRow
    ]}>
      {item.sender === 'customer' && (
        <View style={styles.customerAvatar}>
          <Text style={styles.customerAvatarText}>{customerName.charAt(0)}</Text>
        </View>
      )}
      
      <View style={[
        styles.messageBubble,
        item.sender === 'provider' ? styles.providerBubble : styles.customerBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.sender === 'provider' ? styles.providerMessageText : styles.customerMessageText
        ]}>
          {item.text}
        </Text>
        
        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            item.sender === 'provider' ? styles.providerMessageTime : styles.customerMessageTime
          ]}>
            {formatTime(item.timestamp)}
          </Text>
          
          {item.sender === 'provider' && item.status && (
            <Ionicons 
              name={
                item.status === 'sending' ? 'time-outline' :
                item.status === 'sent' ? 'checkmark' :
                item.status === 'delivered' ? 'checkmark-done' :
                'checkmark-done-circle'
              } 
              size={14} 
              color={item.status === 'read' ? '#4CAF50' : '#999999'} 
              style={styles.messageStatus}
            />
          )}
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#3c3c3c" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{customerName}</Text>
              <Text style={styles.headerSubtitle}>Chat</Text>
            </View>
            <View style={styles.placeholder} />
          </View>

          {/* Messages */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8fd1fb" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#b0b0b0"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!sendingMessage}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!inputText.trim() || sendingMessage) && styles.sendButtonDisabled
              ]} 
              onPress={sendMessage}
              disabled={!inputText.trim() || sendingMessage}
            >
              {sendingMessage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c3c3c',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8c8c8c',
    marginTop: 2,
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#8c8c8c',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  providerMessageRow: {
    justifyContent: 'flex-end',
  },
  customerMessageRow: {
    justifyContent: 'flex-start',
  },
  customerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8fd1fb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  customerAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  providerBubble: {
    backgroundColor: '#8fd1fb',
    borderBottomRightRadius: 4,
  },
  customerBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  providerMessageText: {
    color: '#FFFFFF',
  },
  customerMessageText: {
    color: '#3c3c3c',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
    marginRight: 4,
  },
  providerMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  customerMessageTime: {
    color: '#999999',
  },
  messageStatus: {
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    fontSize: 14,
    color: '#3c3c3c',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8fd1fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#b0b0b0',
  },
});

export default ChatPopup;