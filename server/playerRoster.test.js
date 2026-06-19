const test = require('node:test');
const assert = require('node:assert/strict');
const { GAME_STATES } = require('./constants');
const {
    buildPlayerListPayload,
    getActiveLeader,
    getLeaderCandidates,
    getPlayerStatusLabel,
} = require('./playerRoster');

const isActive = (client) => client.connected;

test('buildPlayerListPayload retains named disconnected players', () => {
    const payload = buildPlayerListPayload(
        new Map([
            [1, { id: 1, username: 'Online', connected: true, gameleader: true, state: 2 }],
            [2, { id: 2, username: 'Returning', connected: false, gameleader: false, state: 5 }],
            [3, { id: 3, username: '', connected: false, gameleader: false, state: 1 }],
        ]),
        isActive
    );

    assert.deepEqual(
        payload.players.map(({ id, isConnected, status }) => ({
            id,
            isConnected,
            status,
        })),
        [
            { id: 1, isConnected: true, status: 'Ready' },
            { id: 2, isConnected: false, status: 'Reconnecting' },
        ]
    );
});

test('getPlayerStatusLabel describes common player states', () => {
    assert.equal(
        getPlayerStatusLabel(
            { username: 'A', connected: true, state: GAME_STATES.SELECT_ANSWER },
            isActive
        ),
        'Answering'
    );
    assert.equal(
        getPlayerStatusLabel(
            { username: 'B', connected: true, state: GAME_STATES.SCOREBOARD },
            isActive
        ),
        'Reviewing score'
    );
    assert.equal(
        getPlayerStatusLabel(
            { username: '', connected: false, state: GAME_STATES.SET_USERNAME },
            isActive
        ),
        'Disconnected'
    );
});

test('getActiveLeader ignores a disconnected leader', () => {
    const clients = new Map([
        [1, { username: 'Old', connected: false, gameleader: true }],
        [2, { username: 'New', connected: true, gameleader: true }],
    ]);

    assert.equal(getActiveLeader(clients, isActive).username, 'New');
});

test('getLeaderCandidates prefers players participating in active rounds', () => {
    const clients = new Map([
        [1, { username: 'Waiting lobby', connected: true, state: GAME_STATES.READY }],
        [2, { username: 'Playing', connected: true, state: GAME_STATES.WAITING }],
    ]);

    const candidates = getLeaderCandidates(
        clients,
        isActive,
        GAME_STATES.SELECT_ANSWER
    );

    assert.deepEqual(candidates.map(([id]) => id), [2]);
});
