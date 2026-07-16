const assert = require('node:assert/strict');
const test = require('node:test');

const { createTaskQueue } = require('./taskQueue');

test('createTaskQueue runs asynchronous work in arrival order', async () => {
    const events = [];
    let releaseFirst;
    const firstBlocked = new Promise((resolve) => {
        releaseFirst = resolve;
    });
    const enqueue = createTaskQueue();

    const first = enqueue(async () => {
        events.push('first:start');
        await firstBlocked;
        events.push('first:end');
    });
    const second = enqueue(async () => {
        events.push('second');
    });

    await Promise.resolve();
    assert.deepEqual(events, ['first:start']);
    releaseFirst();
    await Promise.all([first, second]);

    assert.deepEqual(events, ['first:start', 'first:end', 'second']);
});

test('createTaskQueue reports failures and continues processing', async () => {
    const errors = [];
    const events = [];
    const enqueue = createTaskQueue((error) => errors.push(error.message));

    await enqueue(async () => {
        throw new Error('bad message');
    });
    await enqueue(async () => {
        events.push('recovered');
    });

    assert.deepEqual(errors, ['bad message']);
    assert.deepEqual(events, ['recovered']);
});
