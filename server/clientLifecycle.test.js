const assert = require('node:assert/strict');
const test = require('node:test');

const { GAME_STATES } = require('./constants');
const {
    cancelReconnectCleanup,
    createClientRecord,
    markClientDisconnected,
    removeDisconnectedClient,
} = require('./clientLifecycle');

test('createClientRecord initializes connection state consistently', () => {
    const ws = { id: 'socket' };

    assert.deepEqual(createClientRecord({ id: 7, ws }), {
        id: 7,
        ws,
        state: GAME_STATES.SET_USERNAME,
        username: '',
        resumeToken: '',
        answer: null,
        answerTime: 0,
        gameleader: false,
        disconnectedAt: null,
        reconnectCleanup: null,
    });
});

test('createClientRecord accepts an explicit initial state', () => {
    const client = createClientRecord({
        id: 8,
        ws: {},
        state: GAME_STATES.READY,
    });

    assert.equal(client.state, GAME_STATES.READY);
});

test('cancelReconnectCleanup clears pending reconnect cleanup timers', () => {
    const calls = [];
    const client = { reconnectCleanup: 'timer-id' };

    const cleared = cancelReconnectCleanup(client, (timer) => calls.push(timer));

    assert.equal(cleared, true);
    assert.deepEqual(calls, ['timer-id']);
    assert.equal(client.reconnectCleanup, null);
});

test('cancelReconnectCleanup ignores clients without cleanup timers', () => {
    const client = { reconnectCleanup: null };

    const cleared = cancelReconnectCleanup(client, () => {
        throw new Error('should not clear missing timer');
    });

    assert.equal(cleared, false);
    assert.equal(client.reconnectCleanup, null);
});

test('markClientDisconnected records disconnect time defensively', () => {
    const client = {};

    assert.equal(markClientDisconnected(client, 1234), 1234);
    assert.equal(client.disconnectedAt, 1234);
    assert.equal(markClientDisconnected(null, 5678), null);
});

test('removeDisconnectedClient removes only the expected stale client', () => {
    const staleClient = { username: 'Ada' };
    const replacementClient = { username: 'Ada' };
    const clients = new Map([[1, replacementClient]]);
    const scoreboard = { 1: { username: 'Ada', score: 300 } };

    const result = removeDisconnectedClient({
        clients,
        clientID: 1,
        client: staleClient,
        scoreboard,
    });

    assert.deepEqual(result, { removed: false, roomEmpty: false });
    assert.equal(clients.get(1), replacementClient);
    assert.deepEqual(scoreboard, { 1: { username: 'Ada', score: 300 } });
});

test('removeDisconnectedClient removes stale scoreboard entries', () => {
    const client = { username: 'Ada' };
    const clients = new Map([
        [1, client],
        [2, { username: 'Grace' }],
    ]);
    const scoreboard = {
        1: { username: 'Ada', score: 300 },
        2: { username: 'Grace', score: 200 },
    };

    const result = removeDisconnectedClient({
        clients,
        clientID: 1,
        client,
        scoreboard,
    });

    assert.deepEqual(result, { removed: true, roomEmpty: false });
    assert.equal(clients.has(1), false);
    assert.deepEqual(scoreboard, {
        2: { username: 'Grace', score: 200 },
    });
});

test('removeDisconnectedClient reports when the room is empty', () => {
    const client = { username: 'Ada' };
    const clients = new Map([[1, client]]);

    const result = removeDisconnectedClient({
        clients,
        clientID: 1,
        client,
        scoreboard: {},
    });

    assert.deepEqual(result, { removed: true, roomEmpty: true });
    assert.equal(clients.size, 0);
});
