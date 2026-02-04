import React from 'react';
import { ChatSession, Device, ConnectionState } from '../types';
import { Icons } from './Icon';

interface ChatListProps {
  sessions: ChatSession[];
  nearbyDevices: Device[];
  connectionState: ConnectionState;
  onSelectSession: (sessionId: string) => void;
  onConnectDevice: (device: Device) => void;
  isBluetoothOn: boolean;
  toggleBluetooth: () => void;
  onScanReal: () => void; // Function to trigger real scan
  currentUser: string;
  toggleTheme: () => void;
  isDarkMode: boolean;
  onInstallApp: () => void;
  canInstallApp: boolean;
}

const ChatList: React.FC<ChatListProps> = ({
  sessions,
  nearbyDevices,
  connectionState,
  onSelectSession,
  onConnectDevice,
  isBluetoothOn,
  toggleBluetooth,
  onScanReal,
  currentUser,
  toggleTheme,
  isDarkMode,
  onInstallApp,
  canInstallApp
}) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-whatsapp-darkPanel border-r dark:border-gray-700">
      {/* Header */}
      <header className="bg-whatsapp-teal dark:bg-whatsapp-darkPanel p-4 flex justify-between items-center text-white shrink-0 shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center text-gray-600">
            <Icons.User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg truncate w-32 md:w-auto">{currentUser}</h1>
            <p className="text-xs opacity-90">
              {isBluetoothOn ? 'Visível via Bluetooth' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {canInstallApp && (
            <button 
              onClick={onInstallApp} 
              className="p-1.5 md:p-2 rounded-full bg-white/20 hover:bg-white/30 transition text-white"
              title="Instalar Aplicativo"
            >
              <Icons.Download size={20} />
            </button>
          )}
          <button onClick={toggleTheme} className="p-1 rounded-full hover:bg-white/10 transition">
             {isDarkMode ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
          </button>
          <button 
            onClick={toggleBluetooth}
            className={`p-2 rounded-full transition-all ${isBluetoothOn ? 'bg-whatsapp-light text-white' : 'bg-red-500 text-white'}`}
            title={isBluetoothOn ? "Bluetooth Ligado" : "Bluetooth Desligado"}
          >
            {isBluetoothOn ? <Icons.Bluetooth size={20} /> : <Icons.BluetoothOff size={20} />}
          </button>
        </div>
      </header>

      {/* Connection Status / Scanner */}
      {!isBluetoothOn && (
        <div className="bg-red-100 dark:bg-red-900/30 p-4 text-center">
          <p className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center justify-center gap-2">
            <Icons.BluetoothOff size={16} />
            Ative o Bluetooth para conectar
          </p>
        </div>
      )}

      {isBluetoothOn && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-gray-500 uppercase">Dispositivos</h2>
              {connectionState === ConnectionState.SCANNING && (
                 <Icons.RefreshCw className="animate-spin text-whatsapp-teal" size={14} />
              )}
            </div>
            
            {/* Real Scan Button */}
            <button 
              onClick={onScanReal}
              className="flex items-center gap-1 text-xs bg-whatsapp-teal/10 hover:bg-whatsapp-teal/20 text-whatsapp-teal px-2 py-1 rounded transition"
            >
              <Icons.Search size={12} />
              Buscar (Real)
            </button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide min-h-[60px]">
            {nearbyDevices.length === 0 ? (
               <div className="flex items-center justify-center w-full text-sm text-gray-400 italic py-2">
                 <span>Nenhum dispositivo encontrado</span>
               </div>
            ) : (
              nearbyDevices.map(device => (
                <button
                  key={device.id}
                  onClick={() => onConnectDevice(device)}
                  className="flex flex-col items-center min-w-[70px] p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-whatsapp-teal/20 text-whatsapp-teal flex items-center justify-center mb-1">
                    <Icons.Bluetooth size={20} />
                  </div>
                  <span className="text-xs font-medium truncate w-full text-center dark:text-gray-200">{device.name}</span>
                </button>
              ))
            )}
          </div>
          
          <div className="mt-1 text-[10px] text-gray-400 text-center px-4">
            Nota: Navegadores Web só encontram dispositivos em modo de pareamento (fones, etc). Para conversar, use o simulador (Abas diferentes).
          </div>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 mt-10">
            <p className="mb-2">Nenhuma conversa iniciada.</p>
            <p className="text-sm">Conecte-se a um dispositivo acima para começar.</p>
          </div>
        ) : (
          sessions.map(session => (
            <div
              key={session.peerId}
              onClick={() => onSelectSession(session.peerId)}
              className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-whatsapp-darkPanel cursor-pointer border-b border-gray-100 dark:border-gray-800 transition"
            >
              <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 mr-3 flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br from-teal-400 to-blue-500">
                {session.peerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {session.peerName}
                  </h3>
                  {session.lastTimestamp && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(session.lastTimestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate pr-2">
                    {session.isTyping ? (
                      <span className="text-whatsapp-teal font-medium">digitando...</span>
                    ) : (
                      session.lastMessage || <span className="italic opacity-50">Toque para conversar</span>
                    )}
                  </p>
                  {session.unreadCount > 0 && (
                    <span className="bg-whatsapp-light text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {session.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;