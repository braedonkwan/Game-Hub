import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GAME_STATES,
  isPlayerListPayload,
  isSessionPayload,
  isUsernameErrorPayload,
  parseStateMessage,
} from '../utils/gameState';
import {
  CONNECT_TIMEOUT_MS,
  INITIAL_RECONNECT_DELAY,
  MAX_RECONNECT_DELAY,
  canUseNetwork,
  deriveStateFromPayload,
  getInitialConnectionStatus,
  parseSocketMessage,
} from '../utils/connection';
import {
  NEW_GAME_MESSAGE,
  PLAY_AGAIN_MESSAGE,
  READY_MESSAGE,
  SETUP_GAME_MESSAGE,
  buildGameSelectMessage,
  buildGuessMessage,
  buildStartGameMessage,
  buildTriviaAnswerMessage,
  buildUsernameMessage,
} from '../utils/clientMessages';
import {
  clearStoredSession,
  loadStoredSession,
  saveStoredSession,
} from '../utils/session';

const useGameConnection = (url) => {
  const initialSessionRef = useRef(undefined);
  if (initialSessionRef.current === undefined) {
    initialSessionRef.current = loadStoredSession();
  }
  const [gameState, setGameState] = useState(GAME_STATES.SET_USERNAME);
  const [gameData, setGameData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(
    getInitialConnectionStatus(url)
  );
  const [reconnectDelayMs, setReconnectDelayMs] = useState(0);
  const [connectVersion, setConnectVersion] = useState(0);
  const [players, setPlayers] = useState([]);
  const socketRef = useRef(null);
  const connectTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const shouldReconnectRef = useRef(true);
  const lastUsernameRef = useRef(initialSessionRef.current?.username || '');
  const resumeTokenRef = useRef(initialSessionRef.current?.resumeToken || '');
  const socketIdRef = useRef(0);

  const sendMessage = useCallback((payload) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setConnectionStatus(getInitialConnectionStatus(url));
      return false;
    }
    socket.send(payload);
    return true;
  }, [url]);

  useEffect(() => {
    const handleParsedData = (parsedData) => {
      if (isSessionPayload(parsedData)) {
        lastUsernameRef.current = parsedData.username;
        resumeTokenRef.current = parsedData.resumeToken;
        saveStoredSession({
          username: parsedData.username,
          resumeToken: parsedData.resumeToken,
        });
        return;
      }
      if (isPlayerListPayload(parsedData)) {
        setPlayers(parsedData.players);
        return;
      }
      if (isUsernameErrorPayload(parsedData)) {
        lastUsernameRef.current = '';
        resumeTokenRef.current = '';
        clearStoredSession();
        setGameData(parsedData);
        setGameState(GAME_STATES.SET_USERNAME);
        return;
      }
      setGameData(parsedData);
      const nextState = deriveStateFromPayload(parsedData);
      if (nextState !== null) {
        setGameState(nextState);
      }
    };

    const handleStateString = (data) => {
      const numericState = parseStateMessage(data);
      if (!numericState) return;
      setGameState(numericState);
      if (numericState === GAME_STATES.SET_USERNAME) {
        setGameData(null);
      }
    };

    const resetConnectionState = () => {
      setGameState(GAME_STATES.SET_USERNAME);
      setGameData(null);
      setIsConnected(false);
      setPlayers([]);
      setConnectionStatus(getInitialConnectionStatus(url));
      setReconnectDelayMs(0);
    };

    const connect = () => {
      if (!url) {
        resetConnectionState();
        return;
      }
      if (!canUseNetwork()) {
        setConnectionStatus('offline');
        setReconnectDelayMs(0);
        return;
      }
      const existingSocket = socketRef.current;
      if (
        existingSocket &&
        (existingSocket.readyState === WebSocket.OPEN ||
          existingSocket.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }
      setConnectionStatus((currentStatus) =>
        currentStatus === 'reconnecting' ? 'reconnecting' : 'connecting'
      );
      socketIdRef.current += 1;
      const socketId = socketIdRef.current;
      const ws = new WebSocket(url);
      socketRef.current = ws;
      const isCurrentSocket = () =>
        socketRef.current === ws && socketIdRef.current === socketId;
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }
      connectTimeoutRef.current = setTimeout(() => {
        if (isCurrentSocket() && ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      }, CONNECT_TIMEOUT_MS);

      ws.onopen = () => {
        if (!isCurrentSocket()) {
          ws.close();
          return;
        }
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
        setReconnectDelayMs(0);
        setConnectionStatus('connected');
        setIsConnected(true);
        if (lastUsernameRef.current) {
          ws.send(
            buildUsernameMessage({
              username: lastUsernameRef.current,
              resumeToken: resumeTokenRef.current,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        if (!isCurrentSocket()) {
          return;
        }
        const parsedData = parseSocketMessage(event.data);
        if (!parsedData) return;
        if (typeof parsedData === 'string') {
          handleStateString(parsedData);
        } else {
          handleParsedData(parsedData);
        }
      };

      ws.onerror = () => {
        if (isCurrentSocket()) {
          setConnectionStatus('error');
        }
      };

      ws.onclose = () => {
        if (!isCurrentSocket()) {
          return;
        }
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
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
        reconnectDelayRef.current = Math.min(
          reconnectDelayRef.current * 2,
          MAX_RECONNECT_DELAY
        );
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };
    };

    const retryNow = () => {
      if (!url || !shouldReconnectRef.current || !canUseNetwork()) return;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
      setReconnectDelayMs(0);
      setConnectionStatus('connecting');
      connect();
    };

    const handleVisibilityChange = () => {
      if (!shouldReconnectRef.current) return;
      if (document.visibilityState !== 'visible') return;
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        retryNow();
      }
    };

    const handleOnline = () => {
      retryNow();
    };

    const handleOffline = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setIsConnected(false);
      setReconnectDelayMs(0);
      setConnectionStatus('offline');
      if (socketRef.current) {
        socketRef.current.close();
      }
    };

    const handleBeforeUnload = () => {
      shouldReconnectRef.current = false;
      if (socketRef.current) {
        socketRef.current.close();
      }
    };

    shouldReconnectRef.current = true;
    connect();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [url, connectVersion]);

  const sendUsername = useCallback(
    (username) => {
      const previousUsername = lastUsernameRef.current;
      if (
        previousUsername &&
        previousUsername.toLowerCase() !== username.toLowerCase()
      ) {
        resumeTokenRef.current = '';
        clearStoredSession();
      }
      lastUsernameRef.current = username;
      setGameData(null);
      return sendMessage(
        buildUsernameMessage({ username, resumeToken: resumeTokenRef.current })
      );
    },
    [sendMessage]
  );

  const startGame = useCallback(
    (setup) => sendMessage(buildStartGameMessage(setup)),
    [sendMessage]
  );

  const selectGame = useCallback(
    (gameId) => {
      return sendMessage(buildGameSelectMessage(gameId));
    },
    [sendMessage]
  );

  const sendTriviaAnswer = useCallback(
    (answer) => {
      const sent = sendMessage(buildTriviaAnswerMessage(answer));
      if (sent) {
        setGameState(GAME_STATES.WAITING);
      }
      return sent;
    },
    [sendMessage]
  );

  const sendGuess = useCallback(
    (selection) => {
      const sent = sendMessage(buildGuessMessage(selection));
      if (sent) {
        setGameState(GAME_STATES.WAITING);
      }
      return sent;
    },
    [sendMessage]
  );

  const sendReady = useCallback(() => {
    return sendMessage(READY_MESSAGE);
  }, [sendMessage]);

  const playAgain = useCallback(() => {
    return sendMessage(PLAY_AGAIN_MESSAGE);
  }, [sendMessage]);

  const setupGame = useCallback(() => {
    return sendMessage(SETUP_GAME_MESSAGE);
  }, [sendMessage]);

  const newGame = useCallback(() => {
    return sendMessage(NEW_GAME_MESSAGE);
  }, [sendMessage]);

  const reconnect = useCallback(() => {
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
    setReconnectDelayMs(0);
    setConnectionStatus(getInitialConnectionStatus(url));
    setConnectVersion((version) => version + 1);
  }, [url]);

  return {
    gameState,
    gameData,
    isConnected,
    connectionStatus,
    reconnectDelayMs,
    players,
    actions: {
      sendUsername,
      startGame,
      selectGame,
      sendGuess,
      sendTriviaAnswer,
      sendReady,
      playAgain,
      setupGame,
      newGame,
      reconnect,
    },
  };
};

export default useGameConnection;
