const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const test = require('node:test');

const {
    attachSocketHeartbeat,
    checkSocketHeartbeat,
    markSocketAlive,
    startHeartbeat,
} = require('./wsHeartbeat');

test('markSocketAlive records active sockets defensively', () => {
    const socket = {};

    assert.equal(markSocketAlive(socket), true);
    assert.equal(socket.isAlive, true);
    assert.equal(markSocketAlive(null), false);
});

test('checkSocketHeartbeat pings active sockets and terminates stale sockets', () => {
    const activeSocket = {
        isAlive: true,
        pingCalled: false,
        ping() {
            this.pingCalled = true;
        },
    };
    const staleSocket = {
        isAlive: false,
        terminated: false,
        terminate() {
            this.terminated = true;
        },
    };

    assert.equal(checkSocketHeartbeat(activeSocket), true);
    assert.equal(activeSocket.isAlive, false);
    assert.equal(activeSocket.pingCalled, true);
    assert.equal(checkSocketHeartbeat(staleSocket), false);
    assert.equal(staleSocket.terminated, true);
    assert.equal(checkSocketHeartbeat(null), false);
});

test('attachSocketHeartbeat refreshes sockets on pong', () => {
    const socket = new EventEmitter();

    assert.equal(attachSocketHeartbeat(socket), true);
    assert.equal(socket.isAlive, true);

    socket.isAlive = false;
    socket.emit('pong');

    assert.equal(socket.isAlive, true);
});

test('startHeartbeat sweeps clients and clears the interval on close', () => {
    const originalSetInterval = global.setInterval;
    const originalClearInterval = global.clearInterval;
    let sweep;
    let intervalMs;
    let clearedInterval;

    global.setInterval = (callback, ms) => {
        sweep = callback;
        intervalMs = ms;
        return 'heartbeat-timer';
    };
    global.clearInterval = (timer) => {
        clearedInterval = timer;
    };

    try {
        const socket = {
            isAlive: true,
            pingCalled: false,
            ping() {
                this.pingCalled = true;
            },
        };
        const wss = new EventEmitter();
        wss.clients = new Set([socket]);

        const stopHeartbeat = startHeartbeat(wss, 1234);
        assert.equal(intervalMs, 1234);

        sweep();
        assert.equal(socket.pingCalled, true);

        wss.emit('close');
        assert.equal(clearedInterval, 'heartbeat-timer');

        clearedInterval = null;
        stopHeartbeat();
        assert.equal(clearedInterval, 'heartbeat-timer');
    } finally {
        global.setInterval = originalSetInterval;
        global.clearInterval = originalClearInterval;
    }
});
