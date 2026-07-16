const assert = require('node:assert/strict');
const test = require('node:test');

const { GAME_STATES } = require('./constants');
const { SPOTIFY_GAME_ID, TRIVIA_GAME_ID } = require('./gameCatalog');
const {
    PLAY_AGAIN_ACTIONS,
    canSetupAgain,
    canStartNewGame,
    isPostGameClient,
    isReplayableGame,
} = require('./playAgainFlow');

test('PLAY_AGAIN_ACTIONS keeps room action wire values centralized', () => {
    assert.deepEqual(PLAY_AGAIN_ACTIONS, {
        PLAY_AGAIN: 'play again',
        SETUP_GAME: 'setup game',
        NEW_GAME: 'new game',
    });
});

test('isPostGameClient matches clients that can receive play-again transitions', () => {
    assert.equal(isPostGameClient({ state: GAME_STATES.GAME_OVER }), true);
    assert.equal(isPostGameClient({ state: GAME_STATES.PLAY_AGAIN }), true);
    assert.equal(isPostGameClient({ state: GAME_STATES.READY }), false);
    assert.equal(isPostGameClient(null), false);
});

test('isReplayableGame accepts supported active games', () => {
    assert.equal(isReplayableGame(SPOTIFY_GAME_ID), true);
    assert.equal(isReplayableGame(TRIVIA_GAME_ID), true);
    assert.equal(isReplayableGame('unknown'), false);
    assert.equal(isReplayableGame(null), false);
});

test('canSetupAgain requires a leader and supported active game', () => {
    assert.equal(canSetupAgain({ gameleader: true }, SPOTIFY_GAME_ID), true);
    assert.equal(canSetupAgain({ gameleader: true }, TRIVIA_GAME_ID), true);
    assert.equal(canSetupAgain({ gameleader: false }, TRIVIA_GAME_ID), false);
    assert.equal(canSetupAgain({ gameleader: true }, 'unknown'), false);
    assert.equal(canSetupAgain(null, TRIVIA_GAME_ID), false);
});

test('canStartNewGame requires a leader', () => {
    assert.equal(canStartNewGame({ gameleader: true }), true);
    assert.equal(canStartNewGame({ gameleader: false }), false);
    assert.equal(canStartNewGame(null), false);
});
