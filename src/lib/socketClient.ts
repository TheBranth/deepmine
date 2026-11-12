// Real-time WebSocket Client for Deepmine Multiplayer

export interface ServerMessage {
  type: string;
  [key: string]: unknown;
}

type MessageHandler = (data: ServerMessage) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;

  constructor() {
    this.connect();
  }

  public connect() {
    if (typeof window === 'undefined' || this.isConnecting) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;

    // Detect URL: If running in Vite dev (port 5173), point to server port 3000
    // In production on Render, connect directly to same host via wss://
    let wsUrl = '';
    const isHttps = window.location.protocol === 'https:';
    const host = window.location.host;

    if (host.includes('localhost:5173') || host.includes('127.0.0.1:5173')) {
      wsUrl = 'ws://localhost:3000/ws';
    } else {
      wsUrl = `${isHttps ? 'wss:' : 'ws:'}//${host}/ws`;
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        console.log('[Multiplayer] Connected to game server at', wsUrl);
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ServerMessage;
          this.handlers.forEach(handler => handler(data));
        } catch (e) {
          console.warn('[Multiplayer] Invalid message received:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
      };
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, 3000);
    }
  }

  public send(data: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const socketClient = new SocketClient();
