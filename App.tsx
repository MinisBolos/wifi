
import React, { useState, useEffect, useCallback } from 'react';
import SetupScreen from './components/SetupScreen';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import { User, Message, ChatSession, ConnectionState, Device } from './types';
import { bluetoothManager } from './services/bluetoothMock';
import { v4 as uuidv4 } from 'uuid';
import { Icons } from './components/Icon';

const STORAGE_KEY_USER = 'bluechat_user';
const STORAGE_KEY_SESSIONS = 'bluechat_sessions';

function App() {
  // --- State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isBluetoothOn, setIsBluetoothOn] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [nearbyDevices, setNearbyDevices] = useState<Device[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // --- Initialization ---
  useEffect(() => {
    // 1. Load User
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      bluetoothManager.setLocalUser(user);
    }
    
    // 2. Load History (Conversations)
    const storedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (storedSessions) {
      try {
        setSessions(JSON.parse(storedSessions));
      } catch (e) {
        console.error("Failed to parse sessions", e);
        setSessions([]);
      }
    }

    // Check system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Update HTML class for dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Bluetooth Simulation Listeners ---
  useEffect(() => {
    const unsubscribe = bluetoothManager.onEvent((event) => {
      if (!isBluetoothOn) return;

      switch (event.type) {
        case 'hello':
          if (event.user.id !== currentUser?.id) {
            handleDeviceDiscovered(event.user);
          }
          break;
        case 'message':
          if (event.toPeerId === currentUser?.id) {
            handleIncomingMessage(event.message, event.message.senderId);
          }
          break;
        case 'typing':
          handleTypingIndicator(event.fromId, event.isTyping);
          break;
        case 'delivery_receipt':
          handleDeliveryReceipt(event.messageId, event.fromId);
          break;
      }
    });
    return unsubscribe;
  }, [isBluetoothOn, currentUser, sessions]);

  // --- Handlers ---

  const handleSetupComplete = (name: string, phoneNumber: string) => {
    const newUser: User = {
      id: uuidv4(),
      name,
      phoneNumber,
      isSelf: true
    };
    
    // Save User Permanently
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    setCurrentUser(newUser);
    bluetoothManager.setLocalUser(newUser);
    
    // Auto turn on BT simulation
    setIsBluetoothOn(true);
    setConnectionState(ConnectionState.SCANNING);
    bluetoothManager.scanForDevices();
  };

  const handleDeviceDiscovered = (user: User) => {
    setNearbyDevices(prev => {
      if (prev.find(d => d.id === user.id)) return prev;
      return [...prev, { id: user.id, name: user.name }];
    });
  };

  // Explicit handler for Real Web Bluetooth API
  const handleScanReal = async () => {
    try {
      const device = await bluetoothManager.scanRealDevices();
      if (device) {
        setNearbyDevices(prev => {
          // If already in list, don't add
          if (prev.find(d => d.id === device.id)) return prev;
          return [...prev, device];
        });
      }
    } catch (error) {
      console.error("Scan cancelled or failed", error);
    }
  };

  const handleConnectDevice = (device: Device) => {
    // Check if session exists
    let session = sessions.find(s => s.peerId === device.id);
    
    if (!session) {
      const newSession: ChatSession = {
        peerId: device.id,
        peerName: device.name,
        messages: [],
        unreadCount: 0
      };
      
      const newSessionsList = [newSession, ...sessions];
      setSessions(newSessionsList);
      saveSessions(newSessionsList); // Save immediately on creation
      setActiveSessionId(device.id);
    } else {
      setActiveSessionId(device.id);
    }
    
    // Remove from discovered list once "connected" (chat started)
    setNearbyDevices(prev => prev.filter(d => d.id !== device.id));
  };

  const handleIncomingMessage = (msg: Message, senderId: string) => {
    setSessions(prevSessions => {
      const updated = prevSessions.map(session => {
        if (session.peerId === senderId) {
          return {
            ...session,
            messages: [...session.messages, msg],
            lastMessage: msg.text,
            lastTimestamp: msg.timestamp,
            unreadCount: activeSessionId === senderId ? 0 : session.unreadCount + 1,
            isTyping: false
          };
        }
        return session;
      });
      
      // If new session from unknown (shouldn't happen in this flow but for safety)
      if (!updated.find(s => s.peerId === senderId)) {
        // Find name from device list or default
        const device = nearbyDevices.find(d => d.id === senderId);
        const newSession: ChatSession = {
          peerId: senderId,
          peerName: device ? device.name : 'Desconhecido',
          messages: [msg],
          lastMessage: msg.text,
          lastTimestamp: msg.timestamp,
          unreadCount: 1,
          isTyping: false
        };
        const newList = [newSession, ...updated];
        saveSessions(newList); // Save new session
        return newList;
      }
      
      saveSessions(updated); // Save updated message
      return updated;
    });

    // Send delivery receipt back
    bluetoothManager.sendDeliveryReceipt(msg.id, senderId);
  };

  const handleSendMessage = (text: string) => {
    if (!currentUser || !activeSessionId) return;

    const newMessage: Message = {
      id: uuidv4(),
      text,
      senderId: currentUser.id,
      timestamp: Date.now(),
      status: 'sent'
    };

    // Update local state
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.peerId === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, newMessage],
            lastMessage: text,
            lastTimestamp: newMessage.timestamp
          };
        }
        return s;
      });
      saveSessions(updated);
      return updated;
    });

    // Transmit via Bluetooth
    bluetoothManager.sendMessage(newMessage, activeSessionId);
  };

  const handleDeliveryReceipt = (msgId: string, peerId: string) => {
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.peerId === peerId) {
          return {
            ...s,
            messages: s.messages.map(m => m.id === msgId ? { ...m, status: 'delivered' as const } : m)
          };
        }
        return s;
      });
      saveSessions(updated); // Save status update
      return updated;
    });
  };

  const handleTypingIndicator = (peerId: string, isTyping: boolean) => {
    setSessions(prev => prev.map(s => s.peerId === peerId ? { ...s, isTyping } : s));
  };

  const saveSessions = (sessionsToSave: ChatSession[]) => {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessionsToSave));
  };

  const toggleBluetooth = () => {
    const newState = !isBluetoothOn;
    setIsBluetoothOn(newState);
    if (newState) {
      setConnectionState(ConnectionState.SCANNING);
      bluetoothManager.scanForDevices();
    } else {
      setConnectionState(ConnectionState.DISCONNECTED);
      setNearbyDevices([]);
    }
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // --- Render ---

  if (!currentUser) {
    return <SetupScreen onComplete={handleSetupComplete} />;
  }

  // Mobile View Logic: Show List OR Window
  const isMobile = window.innerWidth < 768;
  const showList = !isMobile || (isMobile && !activeSessionId);
  const showChat = !isMobile || (isMobile && activeSessionId);

  const activeSession = sessions.find(s => s.peerId === activeSessionId);

  return (
    <div className="flex h-full w-full max-w-[1600px] mx-auto bg-white dark:bg-gray-900 shadow-xl overflow-hidden relative">
      {/* Sidebar / Chat List */}
      <div className={`${showList ? 'w-full md:w-[350px] lg:w-[400px]' : 'hidden md:flex md:w-[350px] lg:w-[400px]'} flex-shrink-0 transition-all`}>
        <ChatList
          sessions={sessions}
          nearbyDevices={nearbyDevices}
          connectionState={connectionState}
          onSelectSession={setActiveSessionId}
          onConnectDevice={handleConnectDevice}
          isBluetoothOn={isBluetoothOn}
          toggleBluetooth={toggleBluetooth}
          onScanReal={handleScanReal}
          currentUser={currentUser.name}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
          isDarkMode={isDarkMode}
          onInstallApp={handleInstallApp}
          canInstallApp={!!deferredPrompt}
        />
      </div>

      {/* Main Chat Area */}
      <div className={`${showChat ? 'flex-1 flex flex-col' : 'hidden md:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900 border-b-8 border-whatsapp-teal'}`}>
        {activeSessionId && activeSession ? (
          <ChatWindow
            peerUser={{ id: activeSession.peerId, name: activeSession.peerName }}
            messages={activeSession.messages}
            onSendMessage={handleSendMessage}
            onBack={() => setActiveSessionId(null)}
            currentUser={currentUser}
            isTyping={activeSession.isTyping || false}
            sendTyping={(isTyping) => bluetoothManager.sendTyping(isTyping)}
          />
        ) : (
          <div className="hidden md:flex flex-col items-center text-center p-10">
            <div className="w-60 h-60 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
               <img src="https://cdni.iconscout.com/illustration/premium/thumb/web-development-2974925-2477356.png" alt="No Chat" className="w-40 opacity-50 grayscale" />
            </div>
            <h2 className="text-3xl font-light text-gray-600 dark:text-gray-300 mb-4">BlueChat Web</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Mantenha seu celular conectado via Bluetooth para trocar mensagens sem internet.
            </p>
            <div className="mt-8 flex items-center text-gray-400 text-sm gap-2">
              <span className={`w-3 h-3 rounded-full ${isBluetoothOn ? 'bg-green-500' : 'bg-red-500'}`}></span>
              Bluetooth {isBluetoothOn ? 'Ativo' : 'Inativo'}
            </div>
          </div>
        )}
      </div>
      
      {/* Overlay Warning if Bluetooth Off inside chat */}
      {activeSessionId && !isBluetoothOn && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center shadow-2xl max-w-sm">
             <div className="text-red-500 mb-3 flex justify-center"><Icons.BluetoothOff size={48} /></div>
             <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Bluetooth Desconectado</h3>
             <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">A conexão com o usuário foi perdida. Ative o Bluetooth para continuar conversando.</p>
             <button 
               onClick={toggleBluetooth}
               className="bg-whatsapp-teal text-white px-6 py-2 rounded-full font-bold hover:bg-whatsapp-dark transition w-full"
             >
               Ativar Bluetooth
             </button>
           </div>
        </div>
      )}
    </div>
  );
}

export default App;
