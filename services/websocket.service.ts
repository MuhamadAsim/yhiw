// services/websocket.service.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
type UserType = 'customer' | 'provider';
type MessageCallback = (data: any) => void;
type ConnectionCallback = (isConnected: boolean) => void;

interface PendingMessage {
  type: string;
  payload: any;
}

interface WebSocketMessage {
  type: string;
  data: any; // Backend sends { type: string, data: any }
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 10;
  private readonly reconnectTimeout: number = 2000;
  private listeners: Map<string, MessageCallback[]> = new Map();
  private connectionListeners: ConnectionCallback[] = [];
  private pendingMessages: PendingMessage[] = [];
  private userId: string | null = null;
  private userType: UserType | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private bookingId: string | undefined = undefined; // Changed from null to undefined

  async connect(userType: UserType, bookingId?: string): Promise<boolean> {
    try {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }

      const token = await AsyncStorage.getItem('userToken');
      const userDataStr = await AsyncStorage.getItem('userData');
      
      if (!token || !userDataStr) {
        console.error('No auth data for WebSocket connection');
        return false;
      }

      const userData = JSON.parse(userDataStr);
      this.userId = userData.firebaseUserId || userData.uid || userData.id;
      this.userType = userType;

      // Handle bookingId - convert null to undefined
      if (bookingId) {
        this.bookingId = bookingId;
      } else {
        this.bookingId = undefined;
      }

      if (!this.userId) {
        console.error('No user ID for WebSocket connection');
        return false;
      }

      if (this.socket) {
        this.socket.close(1000, 'Reconnecting');
      }

      const wsUrl = `wss://yhiw-backend.onrender.com/ws?userId=${this.userId}&userType=${userType}&token=${token}`;
      
      console.log(`🔌 Connecting WebSocket as ${userType} with userId: ${this.userId}`);

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners(true);
        
        // Send subscription to job updates
        if (userType === 'customer' && this.bookingId) {
          console.log(`🔔 Subscribing to job updates for booking: ${this.bookingId}`);
          this.send('subscribe_to_job', { bookingId: this.bookingId });
        } else if (userType === 'provider') {
          console.log('🔔 Provider ready to receive job requests');
          this.send('provider_ready', { 
            isOnline: true,
            timestamp: new Date().toISOString()
          });
        }
        
        // Send any pending messages
        this.pendingMessages.forEach(msg => {
          this.send(msg.type, msg.payload);
        });
        this.pendingMessages = [];
        
        // Set up ping interval to keep connection alive
        this.pingInterval = setInterval(() => {
          if (this.isConnected()) {
            this.send('ping', { timestamp: new Date().toISOString() });
          }
        }, 30000);
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      this.socket.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason || 'No reason');
        this.notifyConnectionListeners(false);
        
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        
        // Attempt reconnect for abnormal closures
        if (event.code !== 1000 && event.code !== 1001) {
          this.attemptReconnect(userType, this.bookingId);
        }
      };

      return true;
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      return false;
    }
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      console.log('📨 WebSocket message received:', message.type);
      
      // Log full message for debugging (can be commented out in production)
      if (__DEV__) {
        console.log('📨 Message data:', JSON.stringify(message.data, null, 2));
      }

      // Handle ping responses
      if (message.type === 'pong') {
        console.log('🏓 Pong received');
        return;
      }

      // Notify specific listeners for this message type
      const listeners = this.listeners.get(message.type) || [];
      listeners.forEach(callback => {
        try {
          callback(message);
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

  // Send a message - matches backend expected format { type, payload }
  send(type: string, payload: any): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('📤 WebSocket not connected, queueing message:', type);
      this.pendingMessages.push({ type, payload });
      return false;
    }

    try {
      // Backend expects { type, payload }
      const message = JSON.stringify({ type, payload });
      this.socket.send(message);
      console.log('📤 WebSocket message sent:', type);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  // Subscribe to a job as a customer
  subscribeToJob(bookingId: string): boolean {
    this.bookingId = bookingId;
    return this.send('subscribe_to_job', { bookingId });
  }

  // Provider accepts a job
  acceptJob(jobId: string, bookingId?: string): boolean {
    return this.send('accept_job', { 
      jobId, 
      bookingId,
      acceptedAt: new Date().toISOString()
    });
  }

  // Provider declines a job
  declineJob(jobId: string, bookingId?: string): boolean {
    return this.send('decline_job', { 
      jobId, 
      bookingId,
      declinedAt: new Date().toISOString()
    });
  }

  // Provider sends location update
  updateLocation(location: { latitude: number; longitude: number; address?: string }): boolean {
    return this.send('location_update', {
      ...location,
      timestamp: new Date().toISOString()
    });
  }

  // Provider updates status
  updateStatus(isOnline: boolean): boolean {
    return this.send('provider_status', {
      isOnline,
      timestamp: new Date().toISOString()
    });
  }

  private attemptReconnect(userType: UserType, bookingId?: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('⚠️ Max reconnection attempts reached');
      this.notifyConnectionListeners(false);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectTimeout * Math.pow(1.5, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(() => {
      this.connect(userType, bookingId);
    }, delay);
  }

  on(eventType: string, callback: MessageCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)?.push(callback);
    console.log(`👂 Listener added for event: ${eventType}`);
  }

  off(eventType: string, callback: MessageCallback): void {
    if (!this.listeners.has(eventType)) return;
    
    const callbacks = this.listeners.get(eventType)?.filter(cb => cb !== callback) || [];
    
    if (callbacks.length > 0) {
      this.listeners.set(eventType, callbacks);
    } else {
      this.listeners.delete(eventType);
    }
    
    console.log(`👂 Listener removed for event: ${eventType}`);
  }

  onConnectionChange(callback: ConnectionCallback): void {
    this.connectionListeners.push(callback);
  }

  offConnectionChange(callback: ConnectionCallback): void {
    this.connectionListeners = this.connectionListeners.filter(cb => cb !== callback);
  }

  private notifyConnectionListeners(isConnected: boolean): void {
    this.connectionListeners.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  disconnect(): void {
    console.log('🔌 Disconnecting WebSocket...');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.socket) {
      this.socket.close(1000, 'Normal closure');
      this.socket = null;
    }
    
    this.listeners.clear();
    this.connectionListeners = [];
    this.pendingMessages = [];
    this.reconnectAttempts = 0;
    this.bookingId = undefined; // Changed from null to undefined
    this.userId = null;
    this.userType = null;
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  getReadyState(): number | null {
    return this.socket ? this.socket.readyState : null;
  }

  getReadyStateString(): string {
    const state = this.getReadyState();
    if (state === null) return 'CLOSED';
    
    switch (state) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }

  // Get current connection info
  getConnectionInfo(): object {
    return {
      userId: this.userId,
      userType: this.userType,
      bookingId: this.bookingId,
      isConnected: this.isConnected(),
      readyState: this.getReadyStateString(),
      reconnectAttempts: this.reconnectAttempts,
      pendingMessages: this.pendingMessages.length
    };
  }
}

// Create singleton instances
export const customerWebSocket = new WebSocketService();
export const providerWebSocket = new WebSocketService();

export default WebSocketService;