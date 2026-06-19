const test = require('node:test');
const assert = require('node:assert/strict');
const { createTriviaState } = require('./trivia');
const { applySpotifySetup, applyTriviaSetup } = require('./gameSetup');

test('applySpotifySetup initializes shared round settings', () => {
    const game = {
        rounds: 7,
        maxRounds: 0,
        answerTimeoutMs: 0,
        scoreboard: { 1: { username: 'Old', score: 100 } },
    };

    applySpotifySetup(game, {
        rounds: 5,
        guessMs: 45000,
    });

    assert.deepEqual(game, {
        rounds: 1,
        maxRounds: 5,
        answerTimeoutMs: 45000,
        scoreboard: {},
    });
});

test('applyTriviaSetup initializes trivia settings', () => {
    const game = {
        rounds: 2,
        maxRounds: 0,
        answerTimeoutMs: 0,
        scoreboard: { 1: { username: 'Old', score: 100 } },
        trivia: createTriviaState(),
    };

    applyTriviaSetup(game, {
        rounds: 4,
        guessMs: 20000,
        category: 9,
        difficulty: 'hard',
        type: 'boolean',
    });

    assert.equal(game.rounds, 1);
    assert.equal(game.maxRounds, 4);
    assert.equal(game.answerTimeoutMs, 20000);
    assert.deepEqual(game.scoreboard, {});
    assert.equal(game.trivia.category, 9);
    assert.equal(game.trivia.difficulty, 'hard');
    assert.equal(game.trivia.type, 'boolean');
});
