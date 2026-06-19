const {
    SPOTIFY_DEFAULT_GUESS_SECONDS,
    SPOTIFY_DEFAULT_ROUNDS,
    SPOTIFY_MAX_GUESS_SECONDS,
    SPOTIFY_MAX_ROUNDS,
    SPOTIFY_MIN_GUESS_SECONDS,
    SPOTIFY_MIN_ROUNDS,
} = require('./constants');

const parseInteger = (value) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
};

const buildSpotifySetupPayload = (playlists, error) => ({
    type: 'playlist_list',
    playlists: Array.isArray(playlists) ? playlists : [],
    maxRoundsDefault: SPOTIFY_DEFAULT_ROUNDS,
    maxRoundsMin: SPOTIFY_MIN_ROUNDS,
    maxRoundsMax: SPOTIFY_MAX_ROUNDS,
    guessSecondsDefault: SPOTIFY_DEFAULT_GUESS_SECONDS,
    guessSecondsMin: SPOTIFY_MIN_GUESS_SECONDS,
    guessSecondsMax: SPOTIFY_MAX_GUESS_SECONDS,
    ...(error ? { error } : {}),
});

const validateSpotifySetup = (cfg) => {
    const rounds = parseInteger(cfg?.['max rounds'] ?? cfg?.maxRounds);
    if (rounds === null) {
        return { ok: false, error: 'Rounds must be a whole number.' };
    }
    if (rounds < SPOTIFY_MIN_ROUNDS || rounds > SPOTIFY_MAX_ROUNDS) {
        return {
            ok: false,
            error: `Rounds must be between ${SPOTIFY_MIN_ROUNDS} and ${SPOTIFY_MAX_ROUNDS}.`,
        };
    }

    const guessSeconds =
        parseInteger(cfg?.guessSeconds ?? cfg?.['guess seconds']) ??
        SPOTIFY_DEFAULT_GUESS_SECONDS;
    if (
        guessSeconds < SPOTIFY_MIN_GUESS_SECONDS ||
        guessSeconds > SPOTIFY_MAX_GUESS_SECONDS
    ) {
        return {
            ok: false,
            error: `Guess time must be between ${SPOTIFY_MIN_GUESS_SECONDS} and ${SPOTIFY_MAX_GUESS_SECONDS} seconds.`,
        };
    }

    const playlistId = cfg?.['playlist ID'] ?? cfg?.playlistId;
    if (!playlistId) {
        return { ok: false, error: 'Choose a playlist to start.' };
    }

    return {
        ok: true,
        rounds,
        guessMs: guessSeconds * 1000,
        playlistId,
    };
};

module.exports = {
    buildSpotifySetupPayload,
    validateSpotifySetup,
};
