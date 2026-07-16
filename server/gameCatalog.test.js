const test = require('node:test');
const assert = require('node:assert/strict');
const {
    buildGameCatalog,
    SPOTIFY_GAME_ID,
    TRIVIA_GAME_ID,
} = require('./gameCatalog');

test('buildGameCatalog keeps games available by default', () => {
    const games = buildGameCatalog();

    assert.equal(games.find((game) => game.id === SPOTIFY_GAME_ID).available, true);
    assert.equal(games.find((game) => game.id === TRIVIA_GAME_ID).available, true);
});

test('buildGameCatalog disables only Spotify with a reason', () => {
    const games = buildGameCatalog({
        spotifyAvailable: false,
        spotifyUnavailableReason: 'Spotify is connecting.',
    });

    const spotify = games.find((game) => game.id === SPOTIFY_GAME_ID);
    assert.equal(spotify.available, false);
    assert.equal(spotify.unavailableReason, 'Spotify is connecting.');
    assert.equal(games.find((game) => game.id === TRIVIA_GAME_ID).available, true);
});

test('buildGameCatalog returns isolated nested payload data', () => {
    const firstPayload = buildGameCatalog();
    firstPayload[0].meta.players = 'Changed';
    firstPayload[0].highlights.push('Changed');

    const nextPayload = buildGameCatalog();

    assert.notEqual(nextPayload[0].meta.players, 'Changed');
    assert.equal(nextPayload[0].highlights.includes('Changed'), false);
});
