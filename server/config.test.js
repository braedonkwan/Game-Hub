const test = require('node:test');
const assert = require('node:assert/strict');
const { getMissingSpotifyEnv, isTruthyEnv } = require('./config');

test('getMissingSpotifyEnv reports only absent Spotify credentials', () => {
    assert.deepEqual(
        getMissingSpotifyEnv({
            CLIENT_ID: 'client',
            CLIENT_SECRET: '',
            REFRESH_TOKEN: 'refresh',
        }),
        ['CLIENT_SECRET']
    );
});

test('getMissingSpotifyEnv accepts a complete Spotify configuration', () => {
    assert.deepEqual(
        getMissingSpotifyEnv({
            CLIENT_ID: 'client',
            CLIENT_SECRET: 'secret',
            REFRESH_TOKEN: 'refresh',
        }),
        []
    );
});

test('isTruthyEnv recognizes explicit configuration switches', () => {
    assert.equal(isTruthyEnv('true'), true);
    assert.equal(isTruthyEnv('YES'), true);
    assert.equal(isTruthyEnv('1'), true);
    assert.equal(isTruthyEnv('false'), false);
    assert.equal(isTruthyEnv('0'), false);
});
