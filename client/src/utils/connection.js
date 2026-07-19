import {
  GAME_STATES,
  isGameListPayload,
  isColoursRoundPayload,
  isColoursSetupPayload,
  isPlaylistPayload,
  isScoreboardPayload,
  isSelectionPayload,
  isTriviaQuestionPayload,
  isTriviaSetupPayload,
} from './gameState';

export const CONNECT_TIMEOUT_MS = 20000;
export const INITIAL_RECONNECT_DELAY = 1000;
export const MAX_RECONNECT_DELAY = 30000;
export const SOCKET_READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
};

export const canUseNetwork = () =>
  typeof navigator === 'undefined' || navigator.onLine !== false;

export const isSocketConnecting = (socket) =>
  socket?.readyState === SOCKET_READY_STATE.CONNECTING;

export const isSocketOpen = (socket) =>
  socket?.readyState === SOCKET_READY_STATE.OPEN;

export const isSocketActive = (socket) =>
  isSocketConnecting(socket) || isSocketOpen(socket);

export const closeActiveSocket = (socket, code, reason) => {
  if (!isSocketActive(socket)) {
    return false;
  }
  socket.close(code, reason);
  return true;
};

export const getInitialConnectionStatus = (url) => {
  if (!url) return 'offline';
  return canUseNetwork() ? 'connecting' : 'offline';
};

export const getConnectionTitle = (status) => {
  if (status === 'connecting') return 'Connecting to the room...';
  if (status === 'reconnecting') return 'Connection lost. Reconnecting...';
  if (status === 'offline') return 'No room connection available.';
  return 'Connection issue. Retrying...';
};

export const getConnectionDetail = (status, remainingMs = 0) => {
  if (status === 'offline') {
    return 'Waiting for your browser to come online.';
  }
  if (status === 'error') {
    return 'Retrying automatically. You can also retry now.';
  }
  if (status === 'connecting') {
    return 'Joining the room now.';
  }
  if (status !== 'reconnecting') return '';

  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return seconds ? `Next attempt in ${seconds}s` : 'Retrying now...';
};

export const getConnectionActionLabel = (status) => {
  if (status === 'offline') return 'Check again';
  if (status === 'connecting') return 'Reconnect';
  return 'Retry now';
};

export const getReconnectProgressPercent = (totalMs, remainingMs) => {
  if (!Number.isFinite(totalMs) || totalMs <= 0) {
    return 0;
  }
  const safeRemaining = Number.isFinite(remainingMs)
    ? Math.min(Math.max(remainingMs, 0), totalMs)
    : totalMs;
  return Math.round(((totalMs - safeRemaining) / totalMs) * 100);
};

export const getNextReconnectDelay = (
  currentDelay = INITIAL_RECONNECT_DELAY,
  maxDelay = MAX_RECONNECT_DELAY
) => {
  const safeCurrent = Number.isFinite(currentDelay)
    ? currentDelay
    : INITIAL_RECONNECT_DELAY;
  const safeMax = Number.isFinite(maxDelay) ? maxDelay : MAX_RECONNECT_DELAY;
  return Math.min(Math.max(INITIAL_RECONNECT_DELAY, safeCurrent * 2), safeMax);
};

export const parseSocketMessage = (data) => {
  if (typeof data !== 'string') return null;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

export const deriveStateFromPayload = (payload) => {
  if (isGameListPayload(payload)) return GAME_STATES.SELECT_GAME;
  if (
    isTriviaSetupPayload(payload) ||
    isColoursSetupPayload(payload) ||
    isPlaylistPayload(payload)
  ) {
    return GAME_STATES.SETUP;
  }
  if (isTriviaQuestionPayload(payload) || isSelectionPayload(payload)) {
    return GAME_STATES.SELECT_ANSWER;
  }
  if (isColoursRoundPayload(payload)) {
    return payload.canBet || payload.canChooseColour
      ? GAME_STATES.SELECT_ANSWER
      : GAME_STATES.WAITING;
  }
  if (isScoreboardPayload(payload)) return GAME_STATES.SCOREBOARD;
  return null;
};
