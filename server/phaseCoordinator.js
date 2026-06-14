const getActiveClients = (clients, isActive) =>
    [...clients.values()].filter((client) => isActive(client));

const canAdvancePastState = (clients, blockingState, isActive) => {
    const activeClients = getActiveClients(clients, isActive);
    return (
        activeClients.length > 0 &&
        activeClients.every((client) => client.state !== blockingState)
    );
};

const isDeadlineExpired = (deadlineAt, now = Date.now()) =>
    Number.isFinite(deadlineAt) && deadlineAt > 0 && now >= deadlineAt;

module.exports = {
    canAdvancePastState,
    getActiveClients,
    isDeadlineExpired,
};
