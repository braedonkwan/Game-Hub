const { GAME_STATES, ROUND_ANSWER_TIMEOUT_MS } = require('./constants');
const { createTriviaState } = require('./trivia');

const resetRoundState = (game, clearRoundTimeout = () => {}) => {
    clearRoundTimeout();
    game.rounds = 1;
    game.scoreboard = {};
    game.startTime = 0;
    game.answerDeadlineAt = 0;
    game.trivia.correctAnswer = '';
    game.trivia.currentPayload = null;
    game.trivia.index = 0;
    game.lastRoundDeltas = null;
    game.lastRoundOutcomes = null;
};

const resetActiveGameData = (game, clearRoundTimeout = () => {}) => {
    resetRoundState(game, clearRoundTimeout);
    game.maxRounds = 0;
    game.answerTimeoutMs = ROUND_ANSWER_TIMEOUT_MS;
    game.playlist = [];
    game.selections = null;
    game.trivia = createTriviaState();
};

const resetRoomState = (game, clearRoundTimeout = () => {}) => {
    resetActiveGameData(game, clearRoundTimeout);
    game.activeGameId = null;
    game.phase = GAME_STATES.SET_USERNAME;
};

module.exports = {
    resetActiveGameData,
    resetRoomState,
    resetRoundState,
};
