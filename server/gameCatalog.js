const SPOTIFY_GAME_ID = 'spotify';
const TRIVIA_GAME_ID = 'trivia';
const COLOURS_GAME_ID = 'colours';

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
    {
        id: COLOURS_GAME_ID,
        name: 'Colours',
        description: 'Bet against a rotating banker and outlast the table.',
        type: 'game',
        tag: 'Banking',
        badge: 'CO',
        meta: {
            players: '2+',
            rounds: 'Last player standing',
            time: 'Varies',
            difficulty: 'Easy',
        },
        highlights: ['Six-colour betting', 'Rotating banker'],
    },
];

const cloneGameCatalogEntry = (game) => ({
    ...game,
    highlights: Array.isArray(game.highlights) ? [...game.highlights] : [],
    meta: game.meta ? { ...game.meta } : {},
});

const buildGameCatalog = ({
    spotifyAvailable = true,
    spotifyUnavailableReason = '',
} = {}) =>
    GAME_CATALOG.map((game) =>
        game.id === SPOTIFY_GAME_ID && !spotifyAvailable
            ? {
                ...cloneGameCatalogEntry(game),
                available: false,
                unavailableReason:
                    spotifyUnavailableReason || 'Spotify is unavailable.',
            }
            : { ...cloneGameCatalogEntry(game), available: true }
    );

module.exports = {
    buildGameCatalog,
    COLOURS_GAME_ID,
    GAME_CATALOG,
    SPOTIFY_GAME_ID,
    TRIVIA_GAME_ID,
};
