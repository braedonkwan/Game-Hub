const test = require('node:test');
const assert = require('node:assert/strict');
const {
    canAdvancePastState,
    getActiveClients,
    isDeadlineExpired,
} = require('./phaseCoordinator');

const clients = (...entries) =>
    new Map(entries.map((client, index) => [index, client]));
const isActive = (client) => client.connected;

test('getActiveClients excludes disconnected clients', () => {
    const activeClients = getActiveClients(
        clients(
            { connected: true, state: 1 },
            { connected: false, state: 1 },
            { connected: true, state: 2 }
        ),
        isActive
    );

    assert.equal(activeClients.length, 2);
});

test('canAdvancePastState waits for active clients in the blocking state', () => {
    assert.equal(
        canAdvancePastState(
            clients(
                { connected: true, state: 4 },
                { connected: true, state: 5 }
            ),
            4,
            isActive
        ),
        false
    );
});

test('canAdvancePastState ignores disconnected blockers', () => {
    assert.equal(
        canAdvancePastState(
            clients(
                { connected: false, state: 4 },
                { connected: true, state: 5 }
            ),
            4,
            isActive
        ),
        true
    );
});

test('canAdvancePastState does not advance an empty room', () => {
    assert.equal(
        canAdvancePastState(
            clients({ connected: false, state: 4 }),
            4,
            isActive
        ),
        false
    );
});

test('isDeadlineExpired closes the answer window at the deadline', () => {
    assert.equal(isDeadlineExpired(1000, 999), false);
    assert.equal(isDeadlineExpired(1000, 1000), true);
    assert.equal(isDeadlineExpired(1000, 1001), true);
});

test('isDeadlineExpired ignores missing deadlines', () => {
    assert.equal(isDeadlineExpired(0, 1000), false);
    assert.equal(isDeadlineExpired(undefined, 1000), false);
});
