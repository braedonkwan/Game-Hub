import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GAME_STATES,
  isGameListPayload,
  isPlaylistPayload,
  isPlayerListPayload,
  isScoreboardPayload,
  isSelectionPayload,
  isSessionPayload,
  isTriviaQuestionPayload,
  isTriviaSetupPayload,
  isUsernameErrorPayload,
  parseStateMessage,
} from '../utils/gameState';
import {
  clearStoredSession,
  loadStoredSession,
  saveStoredSession,
} from '../utils/session';

const CONNECT_TIMEOUT_MS = 20000;
const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 1000;

const parseMessage = (data) => {
  if (typeof data !== 'string') return null;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

const deriveStateFromPayload = (payload) => {
  if (isGameListPayload(payload)) return GAME_STATES.SELECT_GAME;
  if (isTriviaSetupPayload(payload) || isPlaylistPayload(payload)) {
    return GAME_STATES.SETUP;
  }
  if (isTriviaQuestionPayload(payload) || isSelectionPayload(payload)) {
    return GAME_STATES.SELECT_ANSWER;
  }
  if (isScoreboardPayload(payload)) return GAME_STATES.SCOREBOARD;
  return null;
};

const useGameConnection = (url) => {
  const initialSessionRef = useRef(undefined);
  if (initialSessionRef.current === undefined) {
    initialSessionRef.current = loadStoredSession();
  }
  const [gameState, setGameState] = useState(GAME_STATES.SET_USERNAME);
  const [gameData, setGameData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(
    url ? 'connecting' : 'offline'
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
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(payload);
    return true;
  }, []);

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
      setConnectionStatus(url ? 'connecting' : 'offline');
      setReconnectDelayMs(0);
    };

    const connect = () => {
      if (!url) {
        resetConnectionState();
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
            JSON.stringify({
              type: 'set_username',
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
        const parsedData = parseMessage(event.data);
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

    const handleVisibilityChange = () => {
      if (!shouldReconnectRef.current) return;
      if (document.visibilityState !== 'visible') return;
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        if (socket && socket.readyState === WebSocket.CLOSING) {
          socket.close();
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
        setReconnectDelayMs(0);
        connect();
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
        JSON.stringify({
          type: 'set_username',
          username,
          resumeToken: resumeTokenRef.current,
        })
      );
    },
    [sendMessage]
  );

  const startGame = useCallback(
    ({ maxRounds, playlistId, category, difficulty }) => {
      const payload = { 'max rounds': maxRounds };
      if (playlistId) {
        payload['playlist ID'] = playlistId;
      }
      if (category) {
        payload.category = category;
      }
      if (difficulty) {
        payload.difficulty = difficulty;
      }
      return sendMessage(JSON.stringify(payload));
    },
    [sendMessage]
  );

  const selectGame = useCallback(
    (gameId) => {
      return sendMessage(JSON.stringify({ gameId }));
    },
    [sendMessage]
  );

  const sendTriviaAnswer = useCallback(
    (answer) => {
      const sent = sendMessage(JSON.stringify({ type: 'trivia_answer', answer }));
      if (sent) {
        setGameState(GAME_STATES.WAITING);
      }
      return sent;
    },
    [sendMessage]
  );

  const sendGuess = useCallback(
    (selection) => {
      const sent = sendMessage(JSON.stringify(selection));
      if (sent) {
        setGameState(GAME_STATES.WAITING);
      }
      return sent;
    },
    [sendMessage]
  );

  const sendReady = useCallback(() => {
    return sendMessage('ready');
  }, [sendMessage]);

  const playAgain = useCallback(() => {
    return sendMessage('play again');
  }, [sendMessage]);

  const setupGame = useCallback(() => {
    return sendMessage('setup game');
  }, [sendMessage]);

  const newGame = useCallback(() => {
    return sendMessage('new game');
  }, [sendMessage]);

  const reconnect = useCallback(() => {
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
    setReconnectDelayMs(0);
    setConnectionStatus(url ? 'connecting' : 'offline');
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
