const { cancelReconnectCleanup } = require('./clientLifecycle');
const { isSameUsername } = require('./utils');
const { isOpen } = require('./wsTransport');

const findUsernameConflict = (clients, clientId, username) =>
    [...clients.entries()].find(
        ([id, entry]) => id !== clientId && isSameUsername(entry.username, username)
    ) || null;

const getUsernameConflictMessage = (client, isActiveClient) =>
    isActiveClient(client)
        ? 'That name is already in use.'
        : 'That name is reserved while the player reconnects.';

const applyResumeHandoff = ({
    clients,
    existingId,
    existingClient,
    newClient,
    username,
    scoreboard,
    cancelCleanup = cancelReconnectCleanup,
    isSocketOpen = isOpen,
}) => {
    cancelCleanup(existingClient);

    if (existingClient.gameleader) {
        existingClient.gameleader = false;
        newClient.gameleader = true;
    }

    if (scoreboard?.[existingId]) {
        scoreboard[newClient.id] = {
            ...scoreboard[existingId],
            username,
        };
        delete scoreboard[existingId];
    }

    newClient.state = existingClient.state;
    newClient.answer = existingClient.answer;
    newClient.answerTime = existingClient.answerTime;

    if (isSocketOpen(existingClient.ws)) {
        existingClient.ws.close(1000, 'Reconnected');
    }

    clients.delete(existingId);
};

module.exports = {
    applyResumeHandoff,
    findUsernameConflict,
    getUsernameConflictMessage,
};
