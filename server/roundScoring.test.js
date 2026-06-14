const test = require('node:test');
const assert = require('node:assert/strict');
const { SPOTIFY_GAME_ID, TRIVIA_GAME_ID } = require('./gameCatalog');
const { scoreRound } = require('./roundScoring');

const WAITING = 5;
const scoreboard = {
    1: { username: 'Correct', score: 100 },
    2: { username: 'Wrong', score: 200 },
    3: { username: 'Still answering', score: 300 },
};

test('scoreRound scores only correct submitted trivia answers', () => {
    const result = scoreRound({
        activeGameId: TRIVIA_GAME_ID,
        triviaAnswer: 'Mercury',
        clients: new Map([
            [1, { state: WAITING, answer: 'Mercury', answerTime: 100 }],
            [2, { state: WAITING, answer: 'Venus', answerTime: 100 }],
            [3, { state: 4, answer: 'Mercury', answerTime: 100 }],
        ]),
        scoreboard,
        waitingState: WAITING,
    });

    assert.deepEqual(result.deltas, { 1: 990, 2: 0, 3: 0 });
    assert.equal(result.scoreboard[1].score, 1090);
    assert.equal(result.scoreboard[2].score, 200);
    assert.equal(result.scoreboard[3].score, 300);
    assert.equal(scoreboard[1].score, 100);
});

test('scoreRound compares Spotify tracks by normalized selection key', () => {
    const result = scoreRound({
        activeGameId: SPOTIFY_GAME_ID,
        currentTrack: { name: 'Song', artists: 'Artist' },
        clients: new Map([
            [
                1,
                {
                    state: WAITING,
                    answer: { name: 'Song', artists: 'Artist' },
                    answerTime: 0,
                },
            ],
        ]),
        scoreboard: { 1: { username: 'Player', score: 0 } },
        waitingState: WAITING,
    });

    assert.deepEqual(result.deltas, { 1: 1000 });
    assert.equal(result.scoreboard[1].score, 1000);
});

test('scoreRound leaves all scores unchanged without a round answer', () => {
    const result = scoreRound({
        activeGameId: TRIVIA_GAME_ID,
        clients: new Map([
            [1, { state: WAITING, answer: 'Mercury', answerTime: 0 }],
        ]),
        scoreboard: { 1: { username: 'Player', score: 25 } },
        waitingState: WAITING,
    });

    assert.deepEqual(result.deltas, { 1: 0 });
    assert.equal(result.scoreboard[1].score, 25);
});
