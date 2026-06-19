const { GAME_STATES } = require('./constants');
const { getStateName } = require('./gameStateLabels');

const buildHealthPayload = ({
    activeClientCount = 0,
    activeGameId = null,
    clientCount = 0,
    phase = GAME_STATES.SET_USERNAME,
    spotifyConfigured = false,
    spotifyDisabled = false,
    spotifyReady = false,
    timestamp = new Date().toISOString(),
} = {}) => ({
    ok: true,
    timestamp,
    room: {
        activeGameId,
        phase,
        phaseName: getStateName(phase),
        clientCount,
        activeClientCount,
    },
    spotify: {
        configured: Boolean(spotifyConfigured),
        disabled: Boolean(spotifyDisabled),
        ready: Boolean(spotifyReady),
    },
});

module.exports = {
    buildHealthPayload,
};
