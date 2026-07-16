import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CONNECT_TIMEOUT_MS,
  INITIAL_RECONNECT_DELAY,
  canUseNetwork,
  closeActiveSocket,
  getInitialConnectionStatus,
  getNextReconnectDelay,
  isSocketActive,
  isSocketConnecting,
  isSocketOpen,
  parseSocketMessage,
} from '../utils/connection';

const clearTimer = (timerRef) => {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
};

const useLatest = (value) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
};

const useReconnectingSocket = (url, { onMessage, onOpen } = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(
    getInitialConnectionStatus(url)
  );
  const [reconnectDelayMs, setReconnectDelayMs] = useState(0);
  const [connectVersion, setConnectVersion] = useState(0);
  const socketRef = useRef(null);
  const connectTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const shouldReconnectRef = useRef(true);
  const socketIdRef = useRef(0);
  const onMessageRef = useLatest(onMessage);
  const onOpenRef = useLatest(onOpen);

  const send = useCallback(
    (payload) => {
      const socket = socketRef.current;
      if (!isSocketOpen(socket)) {
        setConnectionStatus(getInitialConnectionStatus(url));
        return false;
      }
      socket.send(payload);
      return true;
    },
    [url]
  );

  useEffect(() => {
    const resetConnection = () => {
      setIsConnected(false);
      setConnectionStatus(getInitialConnectionStatus(url));
      setReconnectDelayMs(0);
    };

    const connect = () => {
      if (!url) {
        resetConnection();
        return;
      }
      if (!canUseNetwork()) {
        setConnectionStatus('offline');
        setReconnectDelayMs(0);
        return;
      }
      if (isSocketActive(socketRef.current)) return;

      setConnectionStatus((status) =>
        status === 'reconnecting' ? status : 'connecting'
      );
      const socketId = ++socketIdRef.current;
      const socket = new WebSocket(url);
      socketRef.current = socket;
      const isCurrent = () =>
        socketRef.current === socket && socketIdRef.current === socketId;

      clearTimer(connectTimeoutRef);
      connectTimeoutRef.current = setTimeout(() => {
        if (isCurrent() && isSocketConnecting(socket)) socket.close();
      }, CONNECT_TIMEOUT_MS);

      socket.onopen = () => {
        if (!isCurrent()) {
          socket.close();
          return;
        }
        clearTimer(connectTimeoutRef);
        clearTimer(reconnectTimeoutRef);
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
        setReconnectDelayMs(0);
        setConnectionStatus('connected');
        setIsConnected(true);
        onOpenRef.current?.(socket);
      };

      socket.onmessage = (event) => {
        if (!isCurrent()) return;
        const message = parseSocketMessage(event.data);
        if (message !== null) onMessageRef.current?.(message);
      };

      socket.onerror = () => {
        if (isCurrent()) setConnectionStatus('error');
      };

      socket.onclose = () => {
        if (!isCurrent()) return;
        clearTimer(connectTimeoutRef);
        setIsConnected(false);
        socketRef.current = null;
        if (!shouldReconnectRef.current) return;
        if (!canUseNetwork()) {
          setConnectionStatus('offline');
          setReconnectDelayMs(0);
          return;
        }
        const delay = reconnectDelayRef.current;
        setConnectionStatus('reconnecting');
        setReconnectDelayMs(delay);
        reconnectDelayRef.current = getNextReconnectDelay(delay);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };
    };

    const retryNow = () => {
      if (!url || !shouldReconnectRef.current || !canUseNetwork()) return;
      clearTimer(reconnectTimeoutRef);
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
      setReconnectDelayMs(0);
      setConnectionStatus('connecting');
      connect();
    };

    const handleVisibility = () => {
      if (
        shouldReconnectRef.current &&
        document.visibilityState === 'visible' &&
        !isSocketOpen(socketRef.current)
      ) {
        retryNow();
      }
    };
    const handleOnline = () => retryNow();
    const handleOffline = () => {
      clearTimer(reconnectTimeoutRef);
      setIsConnected(false);
      setReconnectDelayMs(0);
      setConnectionStatus('offline');
      socketRef.current?.close();
    };
    const handleBeforeUnload = () => {
      shouldReconnectRef.current = false;
      socketRef.current?.close();
    };

    shouldReconnectRef.current = true;
    connect();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      shouldReconnectRef.current = false;
      clearTimer(reconnectTimeoutRef);
      clearTimer(connectTimeoutRef);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connectVersion, onMessageRef, onOpenRef, url]);

  const reconnect = useCallback(() => {
    clearTimer(reconnectTimeoutRef);
    clearTimer(connectTimeoutRef);
    shouldReconnectRef.current = true;
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
    setReconnectDelayMs(0);
    setConnectionStatus(getInitialConnectionStatus(url));
    if (closeActiveSocket(socketRef.current, 1000, 'Manual reconnect')) {
      socketRef.current = null;
    }
    setConnectVersion((version) => version + 1);
  }, [url]);

  return { connectionStatus, isConnected, reconnect, reconnectDelayMs, send };
};

export default useReconnectingSocket;
