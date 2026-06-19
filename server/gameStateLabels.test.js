const test = require('node:test');
const assert = require('node:assert/strict');
const { GAME_STATES } = require('./constants');
const { getPlayerStateLabel, getStateName } = require('./gameStateLabels');

test('getStateName maps numeric states to constant names', () => {
    assert.equal(getStateName(GAME_STATES.SELECT_ANSWER), 'SELECT_ANSWER');
    assert.equal(getStateName(GAME_STATES.PLAY_AGAIN), 'PLAY_AGAIN');
    assert.equal(getStateName(999), 'UNKNOWN');
});

test('getPlayerStateLabel maps states to player-facing labels', () => {
    assert.equal(getPlayerStateLabel(GAME_STATES.READY), 'Ready');
    assert.equal(getPlayerStateLabel(GAME_STATES.SCOREBOARD), 'Reviewing score');
    assert.equal(getPlayerStateLabel(999), 'Online');
});
