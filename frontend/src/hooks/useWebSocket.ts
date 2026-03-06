import { useEffect, useRef, useCallback, useState } from "react";

type MessageHandler = (data: Record<string, unknown>) => void;

export function useWebSocket(path: string, onMessage: MessageHandler, enabled = true) {
  const wsRef = useRef<WebSocket | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return;

    const token = localStorage.getItem("access_token");
    const baseWs = (import.meta.env.VITE_WS_URL ?? "ws://localhost:8000").replace(/\/$/, "");
    const url = `${baseWs}${path}${token ? `?token=${token}` : ""}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;
    setReadyState(WebSocket.CONNECTING);

    ws.onopen = () => setReadyState(WebSocket.OPEN);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        // ignore bad JSON
      }
    };

    ws.onerror = () => setReadyState(WebSocket.CLOSED);

    ws.onclose = () => {
      setReadyState(WebSocket.CLOSED);
      if (mountedRef.current && enabled) {
        reconnectTimeout.current = setTimeout(connect, 3000);
      }
    };
  }, [path, enabled, onMessage]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { readyState, sendMessage };
}
