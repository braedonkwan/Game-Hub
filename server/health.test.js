const test = require('node:test');
const assert = require('node:assert/strict');
const { GAME_STATES } = require('./constants');
const { buildHealthPayload } = require('./health');

test('buildHealthPayload reports room and spotify status without secrets', () => {
    assert.deepEqual(
        buildHealthPayload({
            activeClientCount: 2,
            activeGameId: 'trivia',
            clientCount: 3,
            phase: GAME_STATES.SELECT_ANSWER,
            spotifyConfigured: true,
            spotifyDisabled: false,
            spotifyReady: true,
            timestamp: '2026-06-19T00:00:00.000Z',
        }),
        {
            ok: true,
            timestamp: '2026-06-19T00:00:00.000Z',
            room: {
                activeGameId: 'trivia',
                phase: GAME_STATES.SELECT_ANSWER,
                phaseName: 'SELECT_ANSWER',
                clientCount: 3,
                activeClientCount: 2,
            },
            spotify: {
                configured: true,
                disabled: false,
                ready: true,
            },
        }
    );
});

test('buildHealthPayload handles unknown phases defensively', () => {
    assert.equal(buildHealthPayload({ phase: 999 }).room.phaseName, 'UNKNOWN');
});
