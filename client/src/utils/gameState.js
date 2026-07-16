export const GAME_STATES = {
  SET_USERNAME: 1,
  READY: 2,
  SETUP: 3,
  SELECT_ANSWER: 4,
  WAITING: 5,
  SCOREBOARD: 6,
  GAME_OVER: 7,
  PLAY_AGAIN: 8,
  SELECT_GAME: 9,
};

const KNOWN_GAME_STATES = new Set(Object.values(GAME_STATES));

const isObjectPayload = (payload) =>
  payload && typeof payload === 'object' && !Array.isArray(payload);

export const isKnownGameState = (state) => KNOWN_GAME_STATES.has(state);

export const parseStateMessage = (message) => {
  if (typeof message !== 'string') return null;
  const match = message.match(/^state (\d+)$/);
  if (!match) return null;
  const state = Number(match[1]);
  return isKnownGameState(state) ? state : null;
};

const isPlaylistArrayPayload = (payload) =>
  Array.isArray(payload) &&
  payload.length > 0 &&
  payload.every((item) => item?.name && item?.playlistID);

export const isSelectionPayload = (payload) =>
  isObjectPayload(payload) && isObjectPayload(payload['current track']);

const isGameListArrayPayload = (payload) =>
  Array.isArray(payload) &&
  payload.length > 0 &&
  payload.every((item) => item?.type === 'game' && item?.id && item?.name);

export const isPlaylistPayload = (payload) =>
  (payload &&
    isObjectPayload(payload) &&
    payload.type === 'playlist_list' &&
    Array.isArray(payload.playlists)) ||
  isPlaylistArrayPayload(payload);

export const isGameListPayload = (payload) =>
  (payload &&
    isObjectPayload(payload) &&
    payload.type === 'game_list' &&
    Array.isArray(payload.games)) ||
  isGameListArrayPayload(payload);

export const isTriviaSetupPayload = (payload) =>
  isObjectPayload(payload) && payload.type === 'trivia_setup';

export const isTriviaQuestionPayload = (payload) =>
  isObjectPayload(payload) && payload.type === 'trivia_question';

export const isScoreboardPayload = (payload) =>
  isObjectPayload(payload) &&
  payload.type === 'scoreboard' &&
  isObjectPayload(payload.scores);

export const isPlayerListPayload = (payload) =>
  isObjectPayload(payload) &&
  payload.type === 'player_list' &&
  Array.isArray(payload.players);

export const isUsernameErrorPayload = (payload) =>
  isObjectPayload(payload) &&
  payload.type === 'username_error' &&
  typeof payload.message === 'string';

export const isSessionPayload = (payload) =>
  isObjectPayload(payload) &&
  payload.type === 'session' &&
  typeof payload.username === 'string' &&
  typeof payload.resumeToken === 'string';
