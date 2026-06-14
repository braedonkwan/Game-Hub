const SPOTIFY_GAME_ID = 'spotify';
const TRIVIA_GAME_ID = 'trivia';

const GAME_CATALOG = [
    {
        id: SPOTIFY_GAME_ID,
        name: 'Spotify Guess the Song',
        description: 'Guess the currently playing Spotify track.',
        type: 'game',
        tag: 'Music',
        badge: 'SP',
        meta: {
            players: '2-8',
            rounds: 'Leader set',
            time: '10-20 min',
            difficulty: 'Easy',
        },
        highlights: ['Live Spotify playback', 'Fastest guess wins'],
    },
    {
        id: TRIVIA_GAME_ID,
        name: 'Trivia Challenge',
        description: 'Answer general trivia questions as fast as you can.',
        type: 'game',
        tag: 'Trivia',
        badge: 'TR',
        meta: {
            players: '2-8',
            rounds: '1-20',
            time: '8-15 min',
            difficulty: 'Varies',
        },
        highlights: ['Multiple choice', 'Timed scoring'],
    },
];

const buildGameCatalog = ({
    spotifyAvailable = true,
    spotifyUnavailableReason = '',
} = {}) =>
    GAME_CATALOG.map((game) =>
        game.id === SPOTIFY_GAME_ID && !spotifyAvailable
            ? {
                ...game,
                available: false,
                unavailableReason:
                    spotifyUnavailableReason || 'Spotify is unavailable.',
            }
            : { ...game, available: true }
    );

module.exports = {
    buildGameCatalog,
    GAME_CATALOG,
    SPOTIFY_GAME_ID,
    TRIVIA_GAME_ID,
};
