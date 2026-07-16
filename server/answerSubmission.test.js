const assert = require('node:assert/strict');
const test = require('node:test');

const { TRIVIA_GAME_ID } = require('./gameCatalog');
const {
    applyAnswerSubmission,
    getAnswerElapsedMs,
    normalizeSubmittedAnswer,
} = require('./answerSubmission');

test('getAnswerElapsedMs calculates elapsed time defensively', () => {
    assert.equal(getAnswerElapsedMs(1000, 1750), 750);
    assert.equal(getAnswerElapsedMs(2000, 1500), 0);
    assert.equal(getAnswerElapsedMs(0, 1500), 0);
});

test('normalizeSubmittedAnswer accepts trivia answer payloads only for trivia', () => {
    assert.equal(
        normalizeSubmittedAnswer(TRIVIA_GAME_ID, {
            type: 'trivia_answer',
            answer: ' Mercury ',
        }),
        'Mercury'
    );
    assert.equal(
        normalizeSubmittedAnswer(TRIVIA_GAME_ID, { answer: 'Mercury' }),
        null
    );
    assert.equal(
        normalizeSubmittedAnswer(TRIVIA_GAME_ID, {
            type: 'trivia_answer',
            answer: null,
        }),
        null
    );
    assert.equal(
        normalizeSubmittedAnswer(TRIVIA_GAME_ID, {
            type: 'trivia_answer',
            answer: '   ',
        }),
        null
    );
});

test('normalizeSubmittedAnswer accepts Spotify-style selections', () => {
    const selection = { name: ' Song ', artists: ' Artist ' };

    assert.deepEqual(normalizeSubmittedAnswer('spotify', selection), {
        name: 'Song',
        artists: 'Artist',
    });
    assert.equal(normalizeSubmittedAnswer('spotify', { name: 'Song' }), null);
    assert.equal(
        normalizeSubmittedAnswer('spotify', { name: 'Song', artists: '' }),
        null
    );
    assert.equal(normalizeSubmittedAnswer('spotify', 'Song'), null);
});

test('applyAnswerSubmission stores accepted answers and waiting state', () => {
    const client = {
        answer: null,
        answerTime: 0,
        state: 4,
    };

    const accepted = applyAnswerSubmission({
        activeGameId: TRIVIA_GAME_ID,
        answeredAt: 1500,
        client,
        payload: { type: 'trivia_answer', answer: 'Venus' },
        startedAt: 1000,
        waitingState: 5,
    });

    assert.equal(accepted, true);
    assert.deepEqual(client, {
        answer: 'Venus',
        answerTime: 500,
        state: 5,
    });
});

test('applyAnswerSubmission leaves clients unchanged for invalid answers', () => {
    const client = {
        answer: null,
        answerTime: 0,
        state: 4,
    };

    const accepted = applyAnswerSubmission({
        activeGameId: TRIVIA_GAME_ID,
        answeredAt: 1500,
        client,
        payload: { answer: 'Venus' },
        startedAt: 1000,
        waitingState: 5,
    });

    assert.equal(accepted, false);
    assert.deepEqual(client, {
        answer: null,
        answerTime: 0,
        state: 4,
    });
});
