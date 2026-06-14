const test = require('node:test');
const assert = require('node:assert/strict');
const { MAX_ROUND_SCORE, calculateRoundScore } = require('./scoring');

test('calculateRoundScore awards full points for instant answers', () => {
    assert.equal(calculateRoundScore(0), 1000);
    assert.equal(MAX_ROUND_SCORE, 1000);
});

test('calculateRoundScore decreases with elapsed time', () => {
    assert.equal(calculateRoundScore(100), 990);
    assert.equal(calculateRoundScore(10000), 900);
});

test('calculateRoundScore never returns negative points', () => {
    assert.equal(calculateRoundScore(100000000), 0);
});

test('calculateRoundScore handles negative elapsed time defensively', () => {
    assert.equal(calculateRoundScore(-100), 1000);
});
