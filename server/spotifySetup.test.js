const test = require('node:test');
const assert = require('node:assert/strict');
const {
    buildSpotifySetupPayload,
    validateSpotifySetup,
} = require('./spotifySetup');

test('buildSpotifySetupPayload includes guess-time bounds', () => {
    assert.deepEqual(
        buildSpotifySetupPayload([{ name: 'Mix', playlistID: '1' }]),
        {
            type: 'playlist_list',
            playlists: [{ name: 'Mix', playlistID: '1' }],
            maxRoundsDefault: 5,
            maxRoundsMin: 1,
            maxRoundsMax: 50,
            guessSecondsDefault: 30,
            guessSecondsMin: 5,
            guessSecondsMax: 120,
        }
    );
});

test('validateSpotifySetup accepts configured guess time', () => {
    assert.deepEqual(
        validateSpotifySetup({
            maxRounds: 3,
            playlistId: 'playlist',
            guessSeconds: 45,
        }),
        {
            ok: true,
            rounds: 3,
            guessMs: 45000,
            playlistId: 'playlist',
        }
    );
});

test('validateSpotifySetup rejects guess time outside bounds', () => {
    assert.deepEqual(
        validateSpotifySetup({
            maxRounds: 3,
            playlistId: 'playlist',
            guessSeconds: 4,
        }),
        {
            ok: false,
            error: 'Guess time must be between 5 and 120 seconds.',
        }
    );
});
