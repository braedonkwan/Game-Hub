const test = require('node:test');
const assert = require('node:assert/strict');
const { SPOTIFY_GAME_ID, TRIVIA_GAME_ID } = require('./gameCatalog');
const { buildRoundResult } = require('./roundResult');

test('buildRoundResult formats trivia answers', () => {
    assert.deepEqual(
        buildRoundResult({
            activeGameId: TRIVIA_GAME_ID,
            triviaAnswer: 'Mercury',
        }),
        { answer: 'Mercury' }
    );
});

test('buildRoundResult formats Spotify tracks', () => {
    assert.deepEqual(
        buildRoundResult({
            activeGameId: SPOTIFY_GAME_ID,
            currentTrack: { name: 'Song', artists: 'Artist' },
        }),
        { answer: 'Song', detail: 'Artist' }
    );
});

test('buildRoundResult returns null without an answer', () => {
    assert.equal(
        buildRoundResult({ activeGameId: TRIVIA_GAME_ID }),
        null
    );
    assert.equal(
        buildRoundResult({ activeGameId: SPOTIFY_GAME_ID }),
        null
    );
});
