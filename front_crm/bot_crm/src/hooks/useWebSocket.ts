import { useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  empresaId?: string;
  usuarioId?: string;
  data?: unknown;
  [key: string]: unknown;
}

interface UseWebSocketOptions {
  url: string;
  empresaId: string;
  onMessage?: (data: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = ({
  url,
  empresaId,
  onMessage,
  onConnect,
  onDisconnect,
  onError
}: UseWebSocketOptions) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const connect = useCallback(() => {
    try {
      console.log('🔌 Conectando WebSocket...', url);
      console.log('🏢 Empresa ID:', empresaId);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket conectado exitosamente');
        console.log('🔗 ReadyState:', ws.readyState);
        reconnectAttemptsRef.current = 0;
        
        // Suscribirse a la empresa
        const subscribeMsg = {
          type: 'subscribe',
          empresaId
        };
        console.log('📤 Enviando suscripción:', subscribeMsg);
        ws.send(JSON.stringify(subscribeMsg));
        
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Mensaje WebSocket recibido:', data);
          onMessage?.(data);
        } catch (error) {
          console.error('❌ Error parseando mensaje WebSocket:', error);
        }
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket desconectado');
        onDisconnect?.();
        
        // Intentar reconectar
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Reintentando conexión (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay);
        } else {
          console.error('❌ Máximo de intentos de reconexión alcanzado');
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Error WebSocket:', error);
        console.error('🔗 URL intentada:', url);
        console.error('🔗 ReadyState en error:', ws.readyState);
        console.error('🔗 Estados: CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3');
        onError?.(error);
      };
    } catch (error) {
      console.error('❌ Error creando WebSocket:', error);
    }
  }, [url, empresaId, onMessage, onConnect, onDisconnect, onError]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket no está conectado');
    }
  }, []);

  return { sendMessage };
};
