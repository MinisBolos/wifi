import { Message, User, Device } from '../types';

// Using BroadcastChannel to simulate P2P Bluetooth communication between browser tabs
// In a real Native Android environment, this would be replaced by BluetoothSocket logic.

type BluetoothEvent = 
  | { type: 'hello'; user: User }
  | { type: 'message'; message: Message; toPeerId: string }
  | { type: 'typing'; fromId: string; isTyping: boolean }
  | { type: 'delivery_receipt'; messageId: string; fromId: string };

class BluetoothManager {
  private channel: BroadcastChannel;
  private listeners: ((event: BluetoothEvent) => void)[] = [];
  private localUser: User | null = null;

  constructor() {
    this.channel = new BroadcastChannel('bluechat-simulation-channel');
    this.channel.onmessage = (ev) => {
      this.notifyListeners(ev.data as BluetoothEvent);
    };
  }

  private notifyListeners(event: BluetoothEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  public setLocalUser(user: User) {
    this.localUser = user;
    // Announce presence (Simulating Advertising)
    this.broadcast({ type: 'hello', user });
  }

  public scanForDevices() {
    // In simulation, we just ask who is out there
    if (this.localUser) {
      this.broadcast({ type: 'hello', user: this.localUser });
    }
  }

  // --- REAL WEB BLUETOOTH API ---
  public async scanRealDevices(): Promise<Device | null> {
    // 1. Check if browser supports it
    if (!('bluetooth' in navigator)) {
      alert('Seu navegador não suporta Web Bluetooth API.');
      return null;
    }

    const navBluetooth = (navigator as any).bluetooth;

    // 2. Check if adapter is available/powered on
    try {
      const isAvailable = await navBluetooth.getAvailability();
      if (!isAvailable) {
        alert('Bluetooth desligado ou indisponível. Ative o Bluetooth no seu dispositivo.');
        return null;
      }
    } catch (e) {
      console.warn('Erro ao verificar disponibilidade do Bluetooth:', e);
    }

    try {
      // Browsers require user gesture and filters or acceptAllDevices
      // Note: Scanning for phones is restricted in Web Bluetooth, but this will find BLE peripherals
      const device = await navBluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 0x1800, 0x1801] // Common services to try and bond
      });

      if (device) {
        return {
          id: device.id,
          name: device.name || 'Dispositivo Bluetooth',
          rssi: -50
        };
      }
      return null;
    } catch (error: any) {
      console.error('Erro na busca Bluetooth:', error);
      
      // Handle "adapter not available" specifically if getAvailability passed but request failed
      if (error.message && (error.message.includes('adapter not available') || error.message.includes('Bluetooth adapter not available'))) {
         alert('Adaptador Bluetooth não disponível no momento. Verifique se está ativado.');
         return null;
      }

      // Don't alert on cancellation (NotFoundError)
      if (error.name !== 'NotFoundError') {
        alert(`Erro ao buscar dispositivos: ${error.message || 'Erro desconhecido'}.`);
      }
      return null;
    }
  }

  public sendMessage(msg: Message, toPeerId: string) {
    this.broadcast({ type: 'message', message: msg, toPeerId });
  }

  public sendTyping(isTyping: boolean) {
    if (!this.localUser) return;
    this.broadcast({ type: 'typing', fromId: this.localUser.id, isTyping });
  }

  public sendDeliveryReceipt(messageId: string, toPeerId: string) {
    if (!this.localUser) return;
    // We broadcast it, but logic should filter
    this.broadcast({ type: 'delivery_receipt', messageId, fromId: this.localUser.id });
  }

  private broadcast(event: BluetoothEvent) {
    this.channel.postMessage(event);
  }

  public onEvent(callback: (event: BluetoothEvent) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
}

export const bluetoothManager = new BluetoothManager();