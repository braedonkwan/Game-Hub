import { useCallback, useMemo, useRef, useState } from 'react';
import {
  GAME_STATES,
  isPlayerListPayload,
  isSessionPayload,
  isUsernameErrorPayload,
  parseStateMessage,
} from '../utils/gameState';
import { deriveStateFromPayload } from '../utils/connection';
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
import useReconnectingSocket from './useReconnectingSocket';

const useGameConnection = (url) => {
  const initialSessionRef = useRef(undefined);
  if (initialSessionRef.current === undefined) {
    initialSessionRef.current = loadStoredSession();
  }

  const [gameState, setGameState] = useState(GAME_STATES.SET_USERNAME);
  const [gameData, setGameData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentUsername, setCurrentUsername] = useState(
    initialSessionRef.current?.username || ''
  );
  const lastUsernameRef = useRef(initialSessionRef.current?.username || '');
  const resumeTokenRef = useRef(initialSessionRef.current?.resumeToken || '');

  const handleMessage = useCallback((message) => {
    if (typeof message === 'string') {
      const state = parseStateMessage(message);
      if (state === null) return;
      setGameState(state);
      if (state === GAME_STATES.SET_USERNAME) setGameData(null);
      return;
    }

    if (isSessionPayload(message)) {
      lastUsernameRef.current = message.username;
      resumeTokenRef.current = message.resumeToken;
      setCurrentUsername(message.username);
      saveStoredSession(message);
      return;
    }
    if (isPlayerListPayload(message)) {
      setPlayers(message.players);
      return;
    }
    if (isUsernameErrorPayload(message)) {
      lastUsernameRef.current = '';
      resumeTokenRef.current = '';
      setCurrentUsername('');
      clearStoredSession();
      setGameData(message);
      setGameState(GAME_STATES.SET_USERNAME);
      return;
    }

    setGameData(message);
    const state = deriveStateFromPayload(message);
    if (state !== null) setGameState(state);
  }, []);

  const handleOpen = useCallback((socket) => {
    if (lastUsernameRef.current) {
      socket.send(
        buildUsernameMessage({
          username: lastUsernameRef.current,
          resumeToken: resumeTokenRef.current,
        })
      );
    }
  }, []);

  const {
    connectionStatus,
    isConnected,
    reconnect,
    reconnectDelayMs,
    send,
  } = useReconnectingSocket(url, {
    onMessage: handleMessage,
    onOpen: handleOpen,
  });

  const sendUsername = useCallback(
    (username) => {
      const previousUsername = lastUsernameRef.current;
      if (
        previousUsername &&
        previousUsername.toLowerCase() !== username.toLowerCase()
      ) {
        resumeTokenRef.current = '';
        setCurrentUsername('');
        clearStoredSession();
      }
      lastUsernameRef.current = username;
      setGameData(null);
      return send(
        buildUsernameMessage({ username, resumeToken: resumeTokenRef.current })
      );
    },
    [send]
  );

  const startGame = useCallback(
    (setup) => send(buildStartGameMessage(setup)),
    [send]
  );
  const selectGame = useCallback(
    (gameId) => send(buildGameSelectMessage(gameId)),
    [send]
  );
  const sendReady = useCallback(() => send(READY_MESSAGE), [send]);
  const playAgain = useCallback(() => send(PLAY_AGAIN_MESSAGE), [send]);
  const setupGame = useCallback(() => send(SETUP_GAME_MESSAGE), [send]);
  const newGame = useCallback(() => send(NEW_GAME_MESSAGE), [send]);

  const submitAnswer = useCallback(
    (message) => {
      const sent = send(message);
      if (sent) setGameState(GAME_STATES.WAITING);
      return sent;
    },
    [send]
  );
  const sendGuess = useCallback(
    (selection) => submitAnswer(buildGuessMessage(selection)),
    [submitAnswer]
  );
  const sendTriviaAnswer = useCallback(
    (answer) => submitAnswer(buildTriviaAnswerMessage(answer)),
    [submitAnswer]
  );

  const actions = useMemo(
    () => ({
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
    }),
    [
      newGame,
      playAgain,
      reconnect,
      selectGame,
      sendGuess,
      sendReady,
      sendTriviaAnswer,
      sendUsername,
      setupGame,
      startGame,
    ]
  );

  return {
    gameState,
    gameData,
    isConnected,
    connectionStatus,
    reconnectDelayMs,
    players,
    currentUsername,
    actions,
  };
};

export default useGameConnection;
