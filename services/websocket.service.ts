// services/websocket.service.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
type UserType = 'customer' | 'provider';
type MessageCallback = (data: any) => void;
type ConnectionCallback = (isConnected: boolean) => void;

interface PendingMessage {
  type: string;
  data: any;
}

interface WebSocketMessage {
  type: string;
  data: any;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly reconnectTimeout: number = 3000;
  private listeners: Map<string, MessageCallback[]> = new Map();
  private connectionListeners: ConnectionCallback[] = [];
  private pendingMessages: PendingMessage[] = [];
  private userId: string | null = null;
  private userType: UserType | null = null;

  // Initialize WebSocket connection
  async connect(userType: UserType): Promise<boolean> {
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

      this.socket.onmessage = (event: WebSocketMessageEvent) => {
        this.handleMessage(event.data);
      };

      this.socket.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
        this.notifyConnectionListeners(false);
      };

      this.socket.onclose = (event: WebSocketCloseEvent) => {
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
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      console.log('WebSocket message received:', message.type, message);

      // Notify specific listeners for this message type
      const listeners = this.listeners.get(message.type) || [];
      listeners.forEach(callback => {
        try {
          callback(message.data);
        } catch (error) {
          console.error(`Error in listener for ${message.type}:`, error);
        }
      });

      // Also notify general listeners
      const generalListeners = this.listeners.get('*') || [];
      generalListeners.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in general listener:', error);
        }
      });

    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  // Send a message
  send(type: string, data: any): boolean {
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
  private attemptReconnect(userType: UserType): void {
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
  on(eventType: string, callback: MessageCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)?.push(callback);
  }

  // Remove event listener
  off(eventType: string, callback: MessageCallback): void {
    if (!this.listeners.has(eventType)) return;
    
    const callbacks = this.listeners.get(eventType)?.filter(cb => cb !== callback) || [];
    this.listeners.set(eventType, callbacks);
  }

  // Add connection state listener
  onConnectionChange(callback: ConnectionCallback): void {
    this.connectionListeners.push(callback);
  }

  // Remove connection state listener
  offConnectionChange(callback: ConnectionCallback): void {
    this.connectionListeners = this.connectionListeners.filter(cb => cb !== callback);
  }

  // Notify connection listeners
  private notifyConnectionListeners(isConnected: boolean): void {
    this.connectionListeners.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  // Disconnect
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
    this.connectionListeners = [];
    this.pendingMessages = [];
    this.reconnectAttempts = 0;
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  // Get socket ready state
  getReadyState(): number | null {
    return this.socket ? this.socket.readyState : null;
  }
}

// Create singleton instances for customer and provider
export const customerWebSocket = new WebSocketService();
export const providerWebSocket = new WebSocketService();

export default WebSocketService;