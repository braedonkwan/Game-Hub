const WebSocket = require('ws');

const isOpen = (ws) => ws?.readyState === WebSocket.OPEN;

const sendJson = (ws, payload) => {
    if (!isOpen(ws)) {
        return false;
    }
    ws.send(JSON.stringify(payload));
    return true;
};

const sendState = (ws, state) => {
    if (!isOpen(ws)) {
        return false;
    }
    ws.send(`state ${state}`);
    return true;
};

const updateClientState = (client, state, payload) => {
    client.state = state;
    return payload === undefined
        ? sendState(client.ws, state)
        : sendJson(client.ws, payload);
};

module.exports = {
    isOpen,
    sendJson,
    sendState,
    updateClientState,
};
