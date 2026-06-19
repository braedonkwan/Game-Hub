const { GAME_STATES } = require('./constants');

const {
    GAME_OVER,
    PLAY_AGAIN,
    READY,
    SCOREBOARD,
    SELECT_ANSWER,
    SELECT_GAME,
    SETUP,
    SET_USERNAME,
    WAITING,
} = GAME_STATES;

const STATE_NAMES = Object.fromEntries(
    Object.entries(GAME_STATES).map(([name, value]) => [value, name])
);

const PLAYER_STATUS_BY_STATE = {
    [SET_USERNAME]: 'Joining',
    [READY]: 'Ready',
    [SETUP]: 'Setting up',
    [SELECT_ANSWER]: 'Answering',
    [WAITING]: 'Submitted',
    [SCOREBOARD]: 'Reviewing score',
    [GAME_OVER]: 'Game over',
    [PLAY_AGAIN]: 'Play again',
    [SELECT_GAME]: 'Choosing game',
};

const getStateName = (state) => STATE_NAMES[state] || 'UNKNOWN';

const getPlayerStateLabel = (state) => PLAYER_STATUS_BY_STATE[state] || 'Online';

module.exports = {
    getPlayerStateLabel,
    getStateName,
};
