const assert = require('node:assert/strict');
const test = require('node:test');

const { GAME_STATES, ROUND_ANSWER_TIMEOUT_MS } = require('./constants');
const {
    resetActiveGameData,
    resetRoomState,
    resetRoundState,
} = require('./gameLifecycle');
const { createTriviaState } = require('./trivia');
const { createColoursState } = require('./colours');

const createGame = () => ({
    activeGameId: 'trivia',
    playlist: ['track'],
    selections: { answer: 'Song' },
    scoreboard: { 1: { username: 'Ada', score: 100 } },
    rounds: 4,
    maxRounds: 7,
    startTime: 1234,
    answerDeadlineAt: 5678,
    answerTimeoutMs: 45000,
    phase: GAME_STATES.SELECT_ANSWER,
    trivia: {
        ...createTriviaState(),
        category: 9,
        correctAnswer: 'Mercury',
        currentPayload: { question: 'Question' },
        difficulty: 'hard',
        index: 3,
        questions: [{ question: 'Question' }],
        type: 'multiple',
    },
    lastRoundDeltas: { 1: 100 },
    lastRoundOutcomes: { 1: { answered: true, correct: true } },
    colours: createColoursState({ round: 3, bankerKey: 'ada' }),
});

test('resetRoundState clears only round-specific data', () => {
    const game = createGame();
    let cleared = false;

    resetRoundState(game, () => {
        cleared = true;
    });

    assert.equal(cleared, true);
    assert.equal(game.activeGameId, 'trivia');
    assert.deepEqual(game.playlist, ['track']);
    assert.deepEqual(game.selections, { answer: 'Song' });
    assert.equal(game.maxRounds, 7);
    assert.equal(game.answerTimeoutMs, 45000);
    assert.equal(game.phase, GAME_STATES.SELECT_ANSWER);
    assert.equal(game.trivia.category, 9);
    assert.equal(game.trivia.difficulty, 'hard');
    assert.equal(game.trivia.type, 'multiple');
    assert.deepEqual(game.trivia.questions, [{ question: 'Question' }]);
    assert.equal(game.rounds, 1);
    assert.deepEqual(game.scoreboard, {});
    assert.equal(game.startTime, 0);
    assert.equal(game.answerDeadlineAt, 0);
    assert.equal(game.trivia.correctAnswer, '');
    assert.equal(game.trivia.currentPayload, null);
    assert.equal(game.trivia.index, 0);
    assert.equal(game.lastRoundDeltas, null);
    assert.equal(game.lastRoundOutcomes, null);
});

test('resetActiveGameData clears game-specific data but keeps room identity', () => {
    const game = createGame();

    resetActiveGameData(game);

    assert.equal(game.activeGameId, 'trivia');
    assert.equal(game.phase, GAME_STATES.SELECT_ANSWER);
    assert.deepEqual(game.playlist, []);
    assert.equal(game.selections, null);
    assert.equal(game.maxRounds, 0);
    assert.equal(game.answerTimeoutMs, ROUND_ANSWER_TIMEOUT_MS);
    assert.deepEqual(game.trivia, createTriviaState());
    assert.deepEqual(game.colours, createColoursState());
});

test('resetRoomState clears active game and returns to username phase', () => {
    const game = createGame();

    resetRoomState(game);

    assert.equal(game.activeGameId, null);
    assert.equal(game.phase, GAME_STATES.SET_USERNAME);
    assert.deepEqual(game.scoreboard, {});
    assert.deepEqual(game.playlist, []);
    assert.equal(game.selections, null);
});
