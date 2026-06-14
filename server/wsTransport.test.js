const test = require('node:test');
const assert = require('node:assert/strict');
const WebSocket = require('ws');
const {
    sendJson,
    sendState,
    updateClientState,
} = require('./wsTransport');

const createSocket = (readyState = WebSocket.OPEN) => ({
    readyState,
    sent: [],
    send(value) {
        this.sent.push(value);
    },
});

test('sendJson and sendState serialize open-socket messages', () => {
    const ws = createSocket();

    assert.equal(sendJson(ws, { type: 'test' }), true);
    assert.equal(sendState(ws, 4), true);
    assert.deepEqual(ws.sent, ['{"type":"test"}', 'state 4']);
});

test('transport helpers ignore closed sockets', () => {
    const ws = createSocket(WebSocket.CLOSED);

    assert.equal(sendJson(ws, { type: 'test' }), false);
    assert.equal(sendState(ws, 4), false);
    assert.deepEqual(ws.sent, []);
});

test('updateClientState updates local state before sending', () => {
    const client = { state: 1, ws: createSocket() };

    assert.equal(updateClientState(client, 2), true);
    assert.equal(client.state, 2);
    assert.deepEqual(client.ws.sent, ['state 2']);
});
