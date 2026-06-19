export const READY_MESSAGE = 'ready';
export const PLAY_AGAIN_MESSAGE = 'play again';
export const SETUP_GAME_MESSAGE = 'setup game';
export const NEW_GAME_MESSAGE = 'new game';

export const buildUsernameMessage = ({ username, resumeToken = '' }) =>
  JSON.stringify({
    type: 'set_username',
    username,
    resumeToken,
  });

export const buildStartGameMessage = ({
  maxRounds,
  playlistId,
  category,
  difficulty,
  type,
  guessSeconds,
}) => {
  const payload = { 'max rounds': maxRounds };
  if (playlistId) payload['playlist ID'] = playlistId;
  if (guessSeconds) payload.guessSeconds = guessSeconds;
  if (category) payload.category = category;
  if (difficulty) payload.difficulty = difficulty;
  if (type) payload.type = type;
  return JSON.stringify(payload);
};

export const buildGameSelectMessage = (gameId) => JSON.stringify({ gameId });

export const buildTriviaAnswerMessage = (answer) =>
  JSON.stringify({ type: 'trivia_answer', answer });

export const buildGuessMessage = (selection) => JSON.stringify(selection);
