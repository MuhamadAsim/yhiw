// services/websocket.service.js
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = 3000;
    this.listeners = new Map();
    this.connectionListeners = [];
    this.pendingMessages = [];
    this.userId = null;
    this.userType = null; // 'customer' or 'provider'
  }

  // Initialize WebSocket connection
  async connect(userType) {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userDataStr = await AsyncStorage.getItem('userData');
      
      if (!token || !userDataStr) {
        console.error('No auth data for WebSocket connection');
        return false;
      }

      const userData = JSON.parse(userDataStr);
      this.userId = userData.firebaseUserId || userData.uid;
      this.userType = userType;

      if (!this.userId) {
        console.error('No user ID for WebSocket connection');
        return false;
      }

      // Close existing connection
      if (this.socket) {
        this.socket.close();
      }

      // Construct WebSocket URL with query params
      const wsUrl = `wss://yhiw-backend.onrender.com/ws?userId=${this.userId}&userType=${userType}&token=${token}`;
      
      console.log(`Connecting WebSocket as ${userType}:`, wsUrl);

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners(true);
        
        // Send any pending messages
        this.pendingMessages.forEach(msg => {
          this.send(msg.type, msg.data);
        });
        this.pendingMessages = [];
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.notifyConnectionListeners(false);
        
        // Attempt to reconnect
        this.attemptReconnect(userType);
      };

      return true;
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      return false;
    }
  }

  // Handle incoming messages
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('WebSocket message received:', message.type, message);

      // Notify specific listeners for this message type
      const listeners = this.listeners.get(message.type) || [];
      listeners.forEach(callback => callback(message.data));

      // Also notify general listeners
      const generalListeners = this.listeners.get('*') || [];
      generalListeners.forEach(callback => callback(message));

    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  // Send a message
  send(type, data) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not connected, queueing message:', type);
      this.pendingMessages.push({ type, data });
      return false;
    }

    try {
      const message = JSON.stringify({ type, data });
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  // Attempt to reconnect
  attemptReconnect(userType) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectTimeout * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(userType);
    }, delay);
  }

  // Add event listener
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  // Remove event listener
  off(eventType, callback) {
    if (!this.listeners.has(eventType)) return;
    
    const callbacks = this.listeners.get(eventType).filter(cb => cb !== callback);
    this.listeners.set(eventType, callbacks);
  }

  // Add connection state listener
  onConnectionChange(callback) {
    this.connectionListeners.push(callback);
  }

  // Notify connection listeners
  notifyConnectionListeners(isConnected) {
    this.connectionListeners.forEach(callback => callback(isConnected));
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
    this.connectionListeners = [];
    this.pendingMessages = [];
  }

  // Get connection status
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

// Create singleton instances for customer and provider
export const customerWebSocket = new WebSocketService();
export const providerWebSocket = new WebSocketService();

export default WebSocketService;