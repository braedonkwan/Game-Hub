const markSocketAlive = (ws) => {
    if (!ws) {
        return false;
    }
    ws.isAlive = true;
    return true;
};

const checkSocketHeartbeat = (ws) => {
    if (!ws) {
        return false;
    }
    if (ws.isAlive === false) {
        ws.terminate();
        return false;
    }
    ws.isAlive = false;
    ws.ping();
    return true;
};

const attachSocketHeartbeat = (ws) => {
    if (!markSocketAlive(ws)) {
        return false;
    }
    ws.on('pong', () => {
        markSocketAlive(ws);
    });
    return true;
};

const startHeartbeat = (wss, intervalMs) => {
    const interval = setInterval(() => {
        wss.clients.forEach(checkSocketHeartbeat);
    }, intervalMs);
    const stopHeartbeat = () => clearInterval(interval);
    wss.on('close', stopHeartbeat);
    return stopHeartbeat;
};

module.exports = {
    attachSocketHeartbeat,
    checkSocketHeartbeat,
    markSocketAlive,
    startHeartbeat,
};
