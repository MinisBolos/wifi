
export interface User {
  id: string;
  name: string;
  phoneNumber: string; // Added phone number
  avatar?: string;
  isSelf: boolean;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
}

export interface ChatSession {
  peerId: string;
  peerName: string;
  peerPhoneNumber?: string; // Optional: store peer phone number if available
  lastMessage?: string;
  lastTimestamp?: number;
  messages: Message[];
  unreadCount: number;
  isTyping?: boolean;
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  SCANNING = 'SCANNING',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
}

export interface Device {
  id: string;
  name: string;
  rssi?: number; // Signal strength simulation
}
