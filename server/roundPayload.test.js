const test = require('node:test');
const assert = require('node:assert/strict');
const { SPOTIFY_GAME_ID, TRIVIA_GAME_ID } = require('./gameCatalog');
const {
    addRoundMetadata,
    buildScoreboardPayload,
    buildSelectionPayload,
} = require('./roundPayload');

test('addRoundMetadata decorates object payloads only', () => {
    assert.deepEqual(
        addRoundMetadata(
            { type: 'trivia_question', question: 'Ready?' },
            {
                round: 2,
                total: 5,
                roundStartedAt: 1000,
                answerDeadlineAt: 31000,
                serverSentAt: 1200,
                maxScore: 500,
            }
        ),
        {
            type: 'trivia_question',
            question: 'Ready?',
            round: 2,
            total: 5,
            roundStartedAt: 1000,
            answerDeadlineAt: 31000,
            serverSentAt: 1200,
            maxScore: 500,
        }
    );
    assert.equal(addRoundMetadata(null, {}), null);
    assert.deepEqual(addRoundMetadata(['not', 'decorated'], {}), [
        'not',
        'decorated',
    ]);
});

test('buildSelectionPayload chooses trivia or spotify payload', () => {
    const roundInfo = {
        round: 1,
        total: 3,
        roundStartedAt: 100,
        answerDeadlineAt: 400,
        serverSentAt: 150,
    };

    assert.equal(
        buildSelectionPayload({
            activeGameId: TRIVIA_GAME_ID,
            trivia: { currentPayload: { type: 'trivia_question' } },
            selections: { 'current track': { name: 'Song' } },
            roundInfo,
        }).type,
        'trivia_question'
    );
    assert.deepEqual(
        buildSelectionPayload({
            activeGameId: SPOTIFY_GAME_ID,
            trivia: { currentPayload: { type: 'trivia_question' } },
            selections: { option: { name: 'Song', artists: 'Artist' } },
            roundInfo,
        }).option,
        { name: 'Song', artists: 'Artist' }
    );
});

test('buildScoreboardPayload includes deltas and round answer', () => {
    assert.deepEqual(
        buildScoreboardPayload({
            activeGameId: TRIVIA_GAME_ID,
            lastRoundDeltas: { 1: 100 },
            lastRoundOutcomes: {
                1: { answered: true, answerTimeMs: 720, correct: true },
                2: { answered: true, answerTimeMs: 1450, correct: false },
            },
            maxRounds: 3,
            round: 2,
            scoreboard: {
                1: { username: 'A', score: 500 },
                2: { username: 'B', score: 200 },
            },
            trivia: { correctAnswer: 'True' },
        }),
        {
            type: 'scoreboard',
            scores: {
                1: {
                    username: 'A',
                    score: 500,
                    delta: 100,
                    roundOutcome: {
                        answered: true,
                        answerTimeMs: 720,
                        correct: true,
                    },
                },
                2: {
                    username: 'B',
                    score: 200,
                    delta: 0,
                    roundOutcome: {
                        answered: true,
                        answerTimeMs: 1450,
                        correct: false,
                    },
                },
            },
            round: 2,
            total: 3,
            gameId: TRIVIA_GAME_ID,
            roundResult: { answer: 'True' },
        }
    );
});

test('buildScoreboardPayload defaults missing round outcomes', () => {
    const payload = buildScoreboardPayload({
        activeGameId: TRIVIA_GAME_ID,
        maxRounds: 1,
        round: 1,
        scoreboard: {
            1: { username: 'A', score: 0 },
        },
        trivia: { correctAnswer: 'True' },
    });

    assert.deepEqual(payload.scores[1].roundOutcome, {
        answered: false,
        correct: false,
    });
});
