const { GAME_STATES } = require('./constants');
const { SPOTIFY_GAME_ID, TRIVIA_GAME_ID } = require('./gameCatalog');

const PLAY_AGAIN_ACTIONS = {
    PLAY_AGAIN: 'play again',
    SETUP_GAME: 'setup game',
    NEW_GAME: 'new game',
};

const POST_GAME_STATES = new Set([
    GAME_STATES.GAME_OVER,
    GAME_STATES.PLAY_AGAIN,
]);

const isPostGameClient = (client) => POST_GAME_STATES.has(client?.state);

const isReplayableGame = (gameId) =>
    [SPOTIFY_GAME_ID, TRIVIA_GAME_ID].includes(gameId);

const canSetupAgain = (client, gameId) =>
    Boolean(client?.gameleader) && isReplayableGame(gameId);

const canStartNewGame = (client) => Boolean(client?.gameleader);

module.exports = {
    PLAY_AGAIN_ACTIONS,
    canSetupAgain,
    canStartNewGame,
    isPostGameClient,
    isReplayableGame,
};
