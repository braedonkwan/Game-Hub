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

export const parseStateMessage = (message) => {
  const match = message.match(/^state (\d+)$/);
  return match ? Number(match[1]) : null;
};

const isPlaylistArrayPayload = (payload) =>
  Array.isArray(payload) &&
  payload.length > 0 &&
  payload.every((item) => item?.name && item?.playlistID);

export const isSelectionPayload = (payload) =>
  payload && typeof payload === 'object' && payload['current track'];

const isGameListArrayPayload = (payload) =>
  Array.isArray(payload) &&
  payload.length > 0 &&
  payload.every((item) => item?.type === 'game' && item?.id && item?.name);

export const isPlaylistPayload = (payload) =>
  (payload &&
    typeof payload === 'object' &&
    payload.type === 'playlist_list' &&
    Array.isArray(payload.playlists)) ||
  isPlaylistArrayPayload(payload);

export const isGameListPayload = (payload) =>
  (payload &&
    typeof payload === 'object' &&
    payload.type === 'game_list' &&
    Array.isArray(payload.games)) ||
  isGameListArrayPayload(payload);

export const isTriviaSetupPayload = (payload) =>
  payload && typeof payload === 'object' && payload.type === 'trivia_setup';

export const isTriviaQuestionPayload = (payload) =>
  payload && typeof payload === 'object' && payload.type === 'trivia_question';

export const isScoreboardPayload = (payload) =>
  payload &&
  typeof payload === 'object' &&
  payload.type === 'scoreboard' &&
  payload.scores &&
  typeof payload.scores === 'object';

export const isPlayerListPayload = (payload) =>
  payload &&
  typeof payload === 'object' &&
  payload.type === 'player_list' &&
  Array.isArray(payload.players);

export const isUsernameErrorPayload = (payload) =>
  payload && typeof payload === 'object' && payload.type === 'username_error';

export const isSessionPayload = (payload) =>
  payload &&
  typeof payload === 'object' &&
  payload.type === 'session' &&
  typeof payload.username === 'string' &&
  typeof payload.resumeToken === 'string';
