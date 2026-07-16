const { GAME_STATES } = require('./constants');

const createClientRecord = ({ id, ws, state = GAME_STATES.SET_USERNAME }) => ({
    id,
    ws,
    state,
    username: '',
    resumeToken: '',
    answer: null,
    answerTime: 0,
    gameleader: false,
    disconnectedAt: null,
    reconnectCleanup: null,
});

const cancelReconnectCleanup = (client, clearTimeoutFn = clearTimeout) => {
    if (!client?.reconnectCleanup) {
        return false;
    }
    clearTimeoutFn(client.reconnectCleanup);
    client.reconnectCleanup = null;
    return true;
};

const markClientDisconnected = (client, now = Date.now()) => {
    if (!client) {
        return null;
    }
    client.disconnectedAt = now;
    return client.disconnectedAt;
};

const removeDisconnectedClient = ({ clients, clientID, client, scoreboard }) => {
    if (!clients || clients.get(clientID) !== client) {
        return { removed: false, roomEmpty: false };
    }

    clients.delete(clientID);
    if (scoreboard?.[clientID]) {
        delete scoreboard[clientID];
    }

    return {
        removed: true,
        roomEmpty: clients.size === 0,
    };
};

module.exports = {
    cancelReconnectCleanup,
    createClientRecord,
    markClientDisconnected,
    removeDisconnectedClient,
};
