import {
  GAME_STATES,
  isGameListPayload,
  isPlaylistPayload,
  isScoreboardPayload,
  isSelectionPayload,
  isTriviaQuestionPayload,
  isTriviaSetupPayload,
} from './gameState';

export const CONNECT_TIMEOUT_MS = 20000;
export const INITIAL_RECONNECT_DELAY = 1000;
export const MAX_RECONNECT_DELAY = 30000;

export const canUseNetwork = () =>
  typeof navigator === 'undefined' || navigator.onLine !== false;

export const getInitialConnectionStatus = (url) => {
  if (!url) return 'offline';
  return canUseNetwork() ? 'connecting' : 'offline';
};

export const getConnectionDetail = (status, remainingMs = 0) => {
  if (status !== 'reconnecting') {
    return 'Keep this tab open.';
  }
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return seconds ? `Next attempt in ${seconds}s` : 'Retrying now...';
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
  if (isTriviaSetupPayload(payload) || isPlaylistPayload(payload)) {
    return GAME_STATES.SETUP;
  }
  if (isTriviaQuestionPayload(payload) || isSelectionPayload(payload)) {
    return GAME_STATES.SELECT_ANSWER;
  }
  if (isScoreboardPayload(payload)) return GAME_STATES.SCOREBOARD;
  return null;
};
