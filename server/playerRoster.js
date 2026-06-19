const { GAME_STATES } = require('./constants');
const { getPlayerStateLabel } = require('./gameStateLabels');

const {
    READY,
    SELECT_GAME,
    SETUP,
    SET_USERNAME,
} = GAME_STATES;

const getPlayerStatusLabel = (client, isActiveClient) => {
    if (!isActiveClient(client)) {
        return client.username ? 'Reconnecting' : 'Disconnected';
    }
    return getPlayerStateLabel(client.state);
};

const buildPlayerListPayload = (clients, isActiveClient) => ({
    type: 'player_list',
    players: [...clients.values()]
        .filter((client) => isActiveClient(client) || client.username)
        .map((client) => ({
            id: client.id,
            username: client.username || '',
            isLeader: client.gameleader,
            isConnected: isActiveClient(client),
            state: client.state,
            status: getPlayerStatusLabel(client, isActiveClient),
        })),
});

const getActiveLeader = (clients, isActiveClient) =>
    [...clients.values()].find(
        (client) => client.gameleader && isActiveClient(client)
    ) || null;

const getLeaderCandidates = (clients, isActiveClient, phase) => {
    const entries = [...clients.entries()].filter(
        ([, client]) => client.username && isActiveClient(client)
    );
    if (
        !entries.length ||
        [SET_USERNAME, SELECT_GAME, SETUP].includes(phase)
    ) {
        return entries;
    }
    const activePlayers = entries.filter(([, client]) => client.state !== READY);
    return activePlayers.length ? activePlayers : entries;
};

module.exports = {
    buildPlayerListPayload,
    getActiveLeader,
    getLeaderCandidates,
    getPlayerStatusLabel,
};
