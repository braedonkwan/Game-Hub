const test = require('node:test');
const assert = require('node:assert/strict');
const { parseUsernamePayload } = require('./utils');

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

test('parseUsernamePayload keeps legacy names compatible', () => {
    assert.deepEqual(parseUsernamePayload(' Player Two '), {
        username: 'Player Two',
        resumeToken: '',
    });
});
