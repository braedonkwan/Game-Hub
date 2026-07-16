const test = require('node:test');
const assert = require('node:assert/strict');
const {
    decodeHtml,
    MAX_USERNAME_LENGTH,
    normalizeUsername,
    parseUsernamePayload,
} = require('./utils');

test('normalizeUsername trims and limits display names', () => {
    assert.equal(normalizeUsername('  Ada  '), 'Ada');
    assert.equal(
        normalizeUsername('A'.repeat(MAX_USERNAME_LENGTH + 4)).length,
        MAX_USERNAME_LENGTH
    );
});

test('parseUsernamePayload reads structured reconnect credentials', () => {
    assert.deepEqual(
        parseUsernamePayload(
            JSON.stringify({
                type: 'set_username',
                username: '  Player One  ',
                resumeToken: 'token-123',
            })
        ),
        {
            username: 'Player One',
            resumeToken: 'token-123',
        }
    );
});

test('parseUsernamePayload limits long legacy names', () => {
    assert.equal(
        parseUsernamePayload('A'.repeat(MAX_USERNAME_LENGTH + 4)).username.length,
        MAX_USERNAME_LENGTH
    );
});

test('parseUsernamePayload keeps legacy names compatible', () => {
    assert.deepEqual(parseUsernamePayload(' Player Two '), {
        username: 'Player Two',
        resumeToken: '',
    });
});

test('decodeHtml handles Open Trivia DB entities', () => {
    assert.equal(
        decodeHtml(
            'Tom &amp; Jerry said &quot;it&#039;s fine&quot; &rsquo;til Caf&eacute;&#33;'
        ),
        'Tom & Jerry said "it\'s fine" \'til Cafe!'
    );
});

test('decodeHtml preserves unknown entities for visibility', () => {
    assert.equal(
        decodeHtml('Question &unknown; answer &#99999999;'),
        'Question &unknown; answer &#99999999;'
    );
});
