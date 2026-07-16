const assert = require('node:assert/strict');
const test = require('node:test');

const {
    applyResumeHandoff,
    findUsernameConflict,
    getUsernameConflictMessage,
} = require('./clientResume');

test('findUsernameConflict matches other clients case-insensitively', () => {
    const currentClient = { id: 1, username: 'Ada' };
    const clients = new Map([
        [1, currentClient],
        [2, { id: 2, username: 'Grace' }],
        [3, { id: 3, username: '  ADA  ' }],
    ]);

    assert.deepEqual(findUsernameConflict(clients, 1, 'ada'), [
        3,
        clients.get(3),
    ]);
    assert.equal(findUsernameConflict(clients, 1, 'new name'), null);
});

test('getUsernameConflictMessage distinguishes active and reserved names', () => {
    const client = { username: 'Ada' };

    assert.equal(
        getUsernameConflictMessage(client, () => true),
        'That name is already in use.'
    );
    assert.equal(
        getUsernameConflictMessage(client, () => false),
        'That name is reserved while the player reconnects.'
    );
});

test('applyResumeHandoff transfers reconnecting player state and closes old socket', () => {
    const closeCalls = [];
    const existingClient = {
        id: 4,
        state: 5,
        answer: { name: 'Song' },
        answerTime: 1234,
        gameleader: true,
        ws: {
            close: (...args) => closeCalls.push(args),
        },
    };
    const newClient = {
        id: 9,
        state: 1,
        answer: null,
        answerTime: 0,
        gameleader: false,
    };
    const clients = new Map([
        [4, existingClient],
        [9, newClient],
    ]);
    const scoreboard = {
        4: { username: 'Old', score: 500, streak: 2 },
    };
    const cleanupCalls = [];

    applyResumeHandoff({
        clients,
        existingId: 4,
        existingClient,
        newClient,
        username: 'Ada',
        scoreboard,
        cancelCleanup: (client) => cleanupCalls.push(client.id),
        isSocketOpen: () => true,
    });

    assert.deepEqual(cleanupCalls, [4]);
    assert.equal(existingClient.gameleader, false);
    assert.equal(newClient.gameleader, true);
    assert.equal(newClient.state, 5);
    assert.deepEqual(newClient.answer, { name: 'Song' });
    assert.equal(newClient.answerTime, 1234);
    assert.deepEqual(scoreboard, {
        9: { username: 'Ada', score: 500, streak: 2 },
    });
    assert.equal(clients.has(4), false);
    assert.equal(clients.get(9), newClient);
    assert.deepEqual(closeCalls, [[1000, 'Reconnected']]);
});

test('applyResumeHandoff leaves score and socket alone when absent', () => {
    const existingClient = {
        id: 4,
        state: 5,
        answer: 'answer',
        answerTime: 20,
        gameleader: false,
        ws: { close: () => assert.fail('socket should not close') },
    };
    const newClient = { id: 9, gameleader: false };
    const clients = new Map([
        [4, existingClient],
        [9, newClient],
    ]);
    const scoreboard = {};

    applyResumeHandoff({
        clients,
        existingId: 4,
        existingClient,
        newClient,
        username: 'Ada',
        scoreboard,
        cancelCleanup: () => false,
        isSocketOpen: () => false,
    });

    assert.deepEqual(scoreboard, {});
    assert.equal(newClient.gameleader, false);
    assert.equal(newClient.state, 5);
    assert.equal(newClient.answer, 'answer');
    assert.equal(newClient.answerTime, 20);
    assert.equal(clients.has(4), false);
});
