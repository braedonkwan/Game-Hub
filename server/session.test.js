const test = require('node:test');
const assert = require('node:assert/strict');
const { createResumeToken, isValidResumeToken } = require('./session');

test('createResumeToken creates unique opaque tokens', () => {
    const first = createResumeToken();
    const second = createResumeToken();

    assert.match(first, /^[A-Za-z0-9_-]+$/);
    assert.ok(first.length >= 40);
    assert.notEqual(first, second);
});

test('isValidResumeToken accepts only an exact token match', () => {
    const token = createResumeToken();

    assert.equal(isValidResumeToken(token, token), true);
    assert.equal(isValidResumeToken(token, `${token}x`), false);
    assert.equal(isValidResumeToken(token, ''), false);
    assert.equal(isValidResumeToken(token, null), false);
});
