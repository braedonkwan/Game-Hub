// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');

const { PORT, HOST, DISPLAY_HOST } = require('./server/config');
const {
    GAME_STATES,
    REFRESH_FREQUENCY_MINUTES,
    CONNECTION_HEARTBEAT_MS,
} = require('./server/constants');
const {
    refreshAccessToken,
    getUserPlaylists,
    loadPlaylist,
    playPlaylist,
    getCurrentTrack,
    nextTrack,
} = require('./server/spotify');

const {
    SET_USERNAME,
    READY,
    SETUP,
    SELECT_ANSWER,
    WAITING,
    SCOREBOARD,
    GAME_OVER,
    PLAY_AGAIN,
    SELECT_GAME,
} = GAME_STATES;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const parseJson = (value) => {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};
const normalizeUsername = (value) => String(value || '').trim();
const parseUsernamePayload = (value) => {
    const payload = parseJson(value);
    if (payload && typeof payload === 'object') {
        return { username: normalizeUsername(payload.username) };
    }
    return { username: normalizeUsername(value) };
};
const isSameUsername = (left, right) => {
    const leftName = normalizeUsername(left);
    const rightName = normalizeUsername(right);
    if (!leftName || !rightName) {
        return false;
    }
    return leftName.toLowerCase() === rightName.toLowerCase();
};
const decodeHtml = (value) => {
    if (!value) return '';
    return value
        .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) =>
            String.fromCharCode(parseInt(hex, 16))
        )
        .replace(/&#(\d+);/g, (_match, num) =>
            String.fromCharCode(parseInt(num, 10))
        )
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&ldquo;|&rdquo;/g, '"')
        .replace(/&hellip;/g, '...');
};
const shuffleArray = (list) => {
    const items = [...list];
    for (let i = items.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
};
const selectionKey = (selection) =>
    `${selection?.name || ''}::${selection?.artists || ''}`;
const SELECTION_DELAY_MS = 500;
const TRIVIA_MIN_ROUNDS = 1;
const TRIVIA_MAX_ROUNDS = 20;
const TRIVIA_DEFAULT_ROUNDS = 5;
const TRIVIA_DEFAULT_CATEGORY = 'any';
const TRIVIA_DEFAULT_DIFFICULTY = 'any';
const TRIVIA_DIFFICULTIES = [
    { id: 'any', name: 'Any difficulty' },
    { id: 'easy', name: 'Easy' },
    { id: 'medium', name: 'Medium' },
    { id: 'hard', name: 'Hard' },
];
const createTriviaState = (overrides = {}) => ({
    questions: [],
    index: 0,
    correctAnswer: '',
    currentPayload: null,
    category: TRIVIA_DEFAULT_CATEGORY,
    difficulty: TRIVIA_DEFAULT_DIFFICULTY,
    ...overrides,
});
const GAME_CATALOG = [
    {
        id: 'spotify',
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
        id: 'trivia',
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
const SPOTIFY_GAME_ID = 'spotify';
const TRIVIA_GAME_ID = 'trivia';
let triviaCategoriesCache = [];
let triviaCategoriesPromise = null;
let triviaSetupId = 0;
let playlistCache = [];

const loadTriviaCategories = async () => {
    if (triviaCategoriesCache.length) {
        return triviaCategoriesCache;
    }
    if (triviaCategoriesPromise) {
        return triviaCategoriesPromise;
    }
    triviaCategoriesPromise = axios
        .get('https://opentdb.com/api_category.php')
        .then((resp) => {
            const categories = Array.isArray(resp.data?.trivia_categories)
                ? resp.data.trivia_categories
                : [];
            triviaCategoriesCache = categories.map((category) => ({
                id: category.id,
                name: decodeHtml(category.name),
            }));
            return triviaCategoriesCache;
        })
        .catch((err) => {
            console.error('[ERROR] Failed to load trivia categories.', err?.message || err);
            return [];
        })
        .finally(() => {
            triviaCategoriesPromise = null;
        });
    return triviaCategoriesPromise;
};

const getTriviaSetupPayload = async (overrides = {}) => {
    const categories = await loadTriviaCategories();
    triviaSetupId += 1;
    return {
        type: 'trivia_setup',
        maxRoundsDefault: TRIVIA_DEFAULT_ROUNDS,
        maxRoundsMax: TRIVIA_MAX_ROUNDS,
        categories,
        difficulties: TRIVIA_DIFFICULTIES,
        defaultCategory: TRIVIA_DEFAULT_CATEGORY,
        defaultDifficulty: TRIVIA_DEFAULT_DIFFICULTY,
        setupId: triviaSetupId,
        ...overrides,
    };
};
const GAME_HANDLERS = {
    [SPOTIFY_GAME_ID]: {
        setup: async (client) => {
            await loadPlaylistsForClient(client);
        },
    },
    [TRIVIA_GAME_ID]: {
        setup: async (client) => {
            await sendTriviaSetup(client);
        },
    },
};

// helper functions
function getRandomTrack(playlist) {
    if (!playlist?.length) {
        throw new Error('Selected playlist is empty. Choose a playlist with tracks.');
    }
    const i = Math.floor(Math.random() * playlist.length);
    return playlist[i];
}

async function songSelection(playlist) {
    const clean = (name) => name.replace(/\s(?:\(feat\..*|\(with.*)/i, '');
    const current = await getCurrentTrack();
    if (!current) {
        throw new Error('No track currently playing. Start Spotify playback and try again.');
    }
    if (playlist.length < 4) {
        throw new Error('Playlist must have at least 4 tracks.');
    }
    const out = {
        'current track': {
            name: clean(current.name),
            artists: current.artists.map((artist) => artist.name).join(', '),
        },
    };
    const seen = new Set([current.id]);
    for (let i = 1; i <= 3; i++) {
        let rnd;
        do {
            rnd = getRandomTrack(playlist);
        } while (seen.has(rnd.id));
        seen.add(rnd.id);
        out[`random track ${i}`] = {
            name: clean(rnd.name),
            artists: rnd.artists.map((artist) => artist.name).join(', '),
        };
    }
    return out;
}

const toTriviaQuestion = (question) => ({
    question: decodeHtml(question.question),
    correctAnswer: decodeHtml(question.correct_answer),
    incorrectAnswers: question.incorrect_answers.map((answer) => decodeHtml(answer)),
});

const TRIVIA_DIFFICULTY_SET = new Set(['easy', 'medium', 'hard']);
const normalizeTriviaCategory = (value) => {
    if (!value || value === TRIVIA_DEFAULT_CATEGORY) {
        return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};
const normalizeTriviaDifficulty = (value) => {
    if (!value || value === TRIVIA_DEFAULT_DIFFICULTY) {
        return null;
    }
    const normalized = String(value).toLowerCase();
    return TRIVIA_DIFFICULTY_SET.has(normalized) ? normalized : null;
};

const buildTriviaPayload = (round) => {
    const trivia = game.trivia;
    const question = trivia.questions[trivia.index];
    if (!question) {
        return null;
    }
    const options = shuffleArray([...question.incorrectAnswers, question.correctAnswer]);
    trivia.correctAnswer = question.correctAnswer;
    trivia.currentPayload = {
        type: 'trivia_question',
        question: question.question,
        options,
        round,
        total: game.maxRounds,
    };
    return trivia.currentPayload;
};

async function loadTriviaQuestions(amount, { category, difficulty } = {}) {
    const count = Math.min(Math.max(amount, TRIVIA_MIN_ROUNDS), TRIVIA_MAX_ROUNDS);
    const normalizedCategory = normalizeTriviaCategory(category);
    const normalizedDifficulty = normalizeTriviaDifficulty(difficulty);
    try {
        const resp = await axios.get('https://opentdb.com/api.php', {
            params: {
                amount: count,
                type: 'multiple',
                ...(normalizedCategory ? { category: normalizedCategory } : {}),
                ...(normalizedDifficulty ? { difficulty: normalizedDifficulty } : {}),
            },
        });
        if (resp.data?.response_code !== 0) {
            console.error('[ERROR] Trivia API returned no results.');
            return [];
        }
        return (resp.data.results || []).map(toTriviaQuestion);
    } catch (err) {
        console.error('[ERROR] Failed to load trivia questions.', err?.message || err);
        return [];
    }
}

// express + websocket setup
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, perMessageDeflate: false });
app.use('/game', express.static(path.join(__dirname, 'client', 'build')));
app.get('/game/*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

// keep-alive heartbeat to prevent idle disconnects
const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, CONNECTION_HEARTBEAT_MS);

wss.on('close', () => clearInterval(heartbeatInterval));

const clients = new Map();
let clientIDCounter = 0;
const game = {
    activeGameId: null,
    playlist: [],
    selections: null,
    scoreboard: {},
    rounds: 1,
    maxRounds: 0,
    startTime: 0,
    phase: SET_USERNAME,
    trivia: createTriviaState(),
    lastRoundDeltas: null,
};

const isOpen = (ws) => ws.readyState === WebSocket.OPEN;
const isActiveClient = (client) => !!client && isOpen(client.ws);
const sendJson = (ws, payload) => {
    if (isOpen(ws)) {
        ws.send(JSON.stringify(payload));
    }
};
const sendState = (ws, state) => {
    if (isOpen(ws)) {
        ws.send(`state ${state}`);
    }
};
const updateClientState = (client, state, payload) => {
    client.state = state;
    if (payload === undefined) {
        sendState(client.ws, state);
    } else {
        sendJson(client.ws, payload);
    }
};
const setPlaylistCache = (playlists) => {
    playlistCache = Array.isArray(playlists) ? playlists : [];
    return playlistCache;
};
const getPlaylistCache = () => playlistCache;
const buildGameListPayload = () => ({ type: 'game_list', games: GAME_CATALOG });
const buildPlaylistPayload = (playlists, error) => ({
    type: 'playlist_list',
    playlists: Array.isArray(playlists) ? playlists : [],
    ...(error ? { error } : {}),
});
const sendGameList = (client) =>
    updateClientState(client, SELECT_GAME, buildGameListPayload());
const sendPlaylistList = (client, playlists, error) =>
    updateClientState(client, SETUP, buildPlaylistPayload(playlists, error));
const loadPlaylistsForClient = async (client, errorMessage) => {
    try {
        const playlists = setPlaylistCache(await getUserPlaylists());
        sendPlaylistList(client, playlists, errorMessage);
    } catch (err) {
        console.error(
            '[ERROR] Failed to load playlists.',
            err?.message || err?.response?.data || err
        );
        sendPlaylistList(client, getPlaylistCache(), errorMessage || 'Unable to load playlists.');
    }
};
const sendTriviaSetup = async (client, error) => {
    const payload = await getTriviaSetupPayload(error ? { error } : {});
    updateClientState(client, SETUP, payload);
};
const buildPlayerListPayload = () => ({
    type: 'player_list',
    players: [...clients.values()]
        .filter((client) => isActiveClient(client))
        .map((client) => ({
            id: client.id,
            username: client.username || '',
            isLeader: client.gameleader,
            state: client.state,
        })),
});
const broadcastPlayers = () => {
    const payload = buildPlayerListPayload();
    broadcast((client) => isActiveClient(client), (client) => {
        sendJson(client.ws, payload);
    });
};
const buildScoreboardPayload = () => ({
    type: 'scoreboard',
    scores: Object.fromEntries(
        Object.entries(game.scoreboard).map(([id, entry]) => [
            id,
            {
                ...entry,
                delta: game.lastRoundDeltas?.[id] ?? 0,
            },
        ])
    ),
    round: game.rounds,
    total: game.maxRounds,
    gameId: game.activeGameId,
});
const sendScoreboardState = (client, state) => {
    sendJson(client.ws, buildScoreboardPayload());
    updateClientState(client, state);
};
const getCurrentSelectionPayload = () => {
    if (game.activeGameId === TRIVIA_GAME_ID) {
        return game.trivia.currentPayload;
    }
    return game.selections;
};
const startSelectionPhase = (predicate, payload, { resetScores = false } = {}) => {
    game.startTime = Date.now();
    game.phase = SELECT_ANSWER;
    game.lastRoundDeltas = null;
    broadcast(predicate, (client, id) => {
        client.answer = null;
        client.answerTime = 0;
        if (resetScores || !game.scoreboard[id]) {
            game.scoreboard[id] = { username: client.username, score: 0 };
        }
        updateClientState(client, SELECT_ANSWER, payload);
    });
};
const allClientsNotInState = (state) => {
    for (const client of clients.values()) {
        if (isActiveClient(client) && client.state === state) {
            return false;
        }
    }
    return true;
};
const broadcast = (predicate, cb) => {
    clients.forEach((client, id) => {
        if (predicate(client)) {
            cb(client, id);
        }
    });
};

const getActiveLeader = () => {
    for (const client of clients.values()) {
        if (client.gameleader && isActiveClient(client)) {
            return client;
        }
    }
    return null;
};

const hasActiveLeader = () => Boolean(getActiveLeader());

const getLeaderCandidates = () => {
    const entries = [...clients.entries()].filter(
        ([, client]) => client.username && isActiveClient(client)
    );
    if (!entries.length) {
        return [];
    }
    if (![SET_USERNAME, SELECT_GAME, SETUP].includes(game.phase)) {
        const active = entries.filter(([, client]) => client.state !== READY);
        return active.length ? active : entries;
    }
    return entries;
};

const promoteNextLeader = async () => {
    if (clients.size === 0 || hasActiveLeader()) {
        return;
    }
    const candidates = getLeaderCandidates().sort(([a], [b]) => a - b);
    if (!candidates.length) {
        return;
    }
    const [, nextLeader] = candidates[0];
    clients.forEach((client) => {
        client.gameleader = false;
    });
    nextLeader.gameleader = true;
    broadcastPlayers();
    if (game.phase === SET_USERNAME || game.phase === SELECT_GAME) {
        game.phase = SELECT_GAME;
        sendGameList(nextLeader);
        return;
    }
    if (game.phase === SETUP) {
        if (game.activeGameId === SPOTIFY_GAME_ID) {
            await loadPlaylistsForClient(nextLeader);
            return;
        }
        if (game.activeGameId === TRIVIA_GAME_ID) {
            await sendTriviaSetup(nextLeader);
            return;
        }
    }
    if (game.phase === PLAY_AGAIN) {
        updateClientState(nextLeader, PLAY_AGAIN);
    }
};

const ensureLeaderAssigned = async () => {
    if (hasActiveLeader()) {
        return;
    }
    await promoteNextLeader();
};

const ensureScoreboardEntry = (client) => {
    const clientId = client?.id;
    if (clientId === undefined || clientId === null) {
        return;
    }
    if (!game.scoreboard[clientId]) {
        game.scoreboard[clientId] = { username: client.username, score: 0 };
    }
};

const syncClientState = async (client) => {
    if (!client?.username) {
        updateClientState(client, SET_USERNAME);
        return;
    }
    if (game.phase === SET_USERNAME || game.phase === SELECT_GAME) {
        if (client.gameleader) {
            game.phase = SELECT_GAME;
            sendGameList(client);
            return;
        }
        updateClientState(client, READY);
        return;
    }
    if (game.phase === SETUP) {
        if (client.gameleader) {
            if (game.activeGameId === SPOTIFY_GAME_ID) {
                await loadPlaylistsForClient(client);
                return;
            }
            if (game.activeGameId === TRIVIA_GAME_ID) {
                await sendTriviaSetup(client);
                return;
            }
        }
        updateClientState(client, READY);
        return;
    }
    if (game.phase === SELECT_ANSWER) {
        const payload = getCurrentSelectionPayload();
        if (payload) {
            ensureScoreboardEntry(client);
            if (client.answer) {
                updateClientState(client, WAITING);
            } else {
                updateClientState(client, SELECT_ANSWER, payload);
            }
            return;
        }
        updateClientState(client, READY);
        return;
    }
    if (game.phase === SCOREBOARD) {
        sendScoreboardState(client, SCOREBOARD);
        return;
    }
    if (game.phase === GAME_OVER) {
        sendScoreboardState(client, GAME_OVER);
        return;
    }
    if (game.phase === PLAY_AGAIN) {
        if (client.gameleader) {
            updateClientState(client, PLAY_AGAIN);
        } else {
            updateClientState(client, READY);
        }
        return;
    }
    updateClientState(client, READY);
};

function scoreCurrentRound() {
    const deltas = {};
    Object.keys(game.scoreboard).forEach((id) => {
        deltas[id] = 0;
    });

    if (game.activeGameId === TRIVIA_GAME_ID) {
        const correctAnswer = game.trivia.correctAnswer;
        if (!correctAnswer) {
            game.lastRoundDeltas = deltas;
            return;
        }
        clients.forEach((client, id) => {
            if (client.state !== WAITING || !client.answer || !game.scoreboard[id]) {
                return;
            }
            if (client.answer === correctAnswer) {
                const points = 1000 - Math.round(Math.sqrt(client.answerTime));
                game.scoreboard[id].score += points;
                deltas[id] = points;
            }
        });
        game.lastRoundDeltas = deltas;
        return;
    }
    const currentSelection = game.selections?.['current track'];
    if (!currentSelection) {
        game.lastRoundDeltas = deltas;
        return;
    }
    const currentKey = selectionKey(currentSelection);
    clients.forEach((client, id) => {
        if (client.state !== WAITING || !client.answer || !game.scoreboard[id]) {
            return;
        }
        if (selectionKey(client.answer) === currentKey) {
            const points = 1000 - Math.round(Math.sqrt(client.answerTime));
            game.scoreboard[id].score += points;
            deltas[id] = points;
        }
    });
    game.lastRoundDeltas = deltas;
}

async function setSelectionsAndStart(predicate, { resetScores = false } = {}) {
    game.selections = await songSelection(game.playlist);
    startSelectionPhase(predicate, game.selections, { resetScores });
}

async function advanceTrackAndStart(predicate, { resetScores = false } = {}) {
    await nextTrack();
    await sleep(SELECTION_DELAY_MS);
    await setSelectionsAndStart(predicate, { resetScores });
}

async function startTriviaRound(predicate, { resetScores = false } = {}) {
    const payload = buildTriviaPayload(game.rounds);
    if (!payload) {
        return;
    }
    startSelectionPhase(predicate, payload, { resetScores });
}

async function startTriviaGame(predicate, { resetScores = false } = {}) {
    const questions = await loadTriviaQuestions(game.maxRounds, {
        category: game.trivia.category,
        difficulty: game.trivia.difficulty,
    });
    if (!questions.length) {
        console.error('[ERROR] Trivia questions unavailable. Try again.');
        return false;
    }
    if (questions.length < game.maxRounds) {
        game.maxRounds = questions.length;
    }
    game.trivia.questions = questions;
    game.trivia.index = 0;
    await startTriviaRound(predicate, { resetScores });
    return true;
}

function resetRoundState() {
    game.rounds = 1;
    game.scoreboard = {};
    game.startTime = 0;
    game.trivia.correctAnswer = '';
    game.trivia.currentPayload = null;
    game.trivia.index = 0;
    game.lastRoundDeltas = null;
}

function resetGameState() {
    resetActiveGameData();
    game.activeGameId = null;
    game.phase = SET_USERNAME;
}

function resetActiveGameData() {
    resetRoundState();
    game.maxRounds = 0;
    game.playlist = [];
    game.selections = null;
    game.trivia = createTriviaState();
}

async function resetToSetupWithError(errorMessage) {
    resetActiveGameData();
    game.phase = SETUP;
    const leader = getActiveLeader();
    broadcast(
        (client) => isActiveClient(client) && !client.gameleader,
        (client) => {
            updateClientState(client, READY);
        }
    );
    if (!leader) {
        return;
    }
    if (game.activeGameId === SPOTIFY_GAME_ID) {
        await loadPlaylistsForClient(leader, errorMessage);
        return;
    }
    if (game.activeGameId === TRIVIA_GAME_ID) {
        await sendTriviaSetup(leader, errorMessage);
        return;
    }
    updateClientState(leader, READY);
}

async function handleSetUsername(client, text) {
    const { username } = parseUsernamePayload(text);
    const trimmed = normalizeUsername(username);
    if (!trimmed) {
        return;
    }
    const existingEntry = [...clients.entries()].find(
        ([id, entry]) => id !== client.id && isSameUsername(entry.username, trimmed)
    );
    if (existingEntry) {
        const [existingId, existingClient] = existingEntry;
        if (existingClient.gameleader) {
            existingClient.gameleader = false;
            client.gameleader = true;
        }
        if (game.scoreboard[existingId]) {
            game.scoreboard[client.id] = {
                ...game.scoreboard[existingId],
                username: trimmed,
            };
            delete game.scoreboard[existingId];
        }
        client.state = existingClient.state;
        client.answer = existingClient.answer;
        client.answerTime = existingClient.answerTime;
        if (isOpen(existingClient.ws)) {
            existingClient.ws.close(1000, 'Reconnected');
        }
        clients.delete(existingId);
    }
    client.username = trimmed;
    if (!client.gameleader) {
        await ensureLeaderAssigned();
    }
    broadcastPlayers();
    await syncClientState(client);
}

async function handleGameSelect(client, text) {
    if (!client.gameleader) {
        return;
    }
    const cfg = parseJson(text);
    const gameId = cfg?.gameId;
    if (!gameId) {
        return;
    }
    const selectedGame = GAME_CATALOG.find((entry) => entry.id === gameId);
    if (!selectedGame) {
        return;
    }
    resetActiveGameData();
    game.activeGameId = selectedGame.id;
    game.phase = SETUP;
    const handler = GAME_HANDLERS[game.activeGameId];
    if (handler?.setup) {
        await handler.setup(client);
        return;
    }
    updateClientState(client, READY);
}

async function handleSetup(client, text) {
    if (!client.gameleader) {
        return;
    }
    if (![SPOTIFY_GAME_ID, TRIVIA_GAME_ID].includes(game.activeGameId)) {
        return;
    }
    const cfg = parseJson(text);
    if (!cfg) {
        return;
    }
    const requestedRounds = Number(cfg['max rounds'] ?? cfg.maxRounds);
    if (!requestedRounds) {
        return;
    }
    if (game.activeGameId === SPOTIFY_GAME_ID) {
        const playlistId = cfg['playlist ID'] ?? cfg.playlistId;
        if (!playlistId) {
            return;
        }
        try {
            game.rounds = 1;
            game.maxRounds = requestedRounds;
            game.playlist = await loadPlaylist(playlistId);
            await playPlaylist(playlistId);
            await sleep(SELECTION_DELAY_MS);
            game.scoreboard = {};
            await setSelectionsAndStart(
                (clientEntry) => clientEntry.state === READY || clientEntry.state === SETUP,
                { resetScores: true }
            );
        } catch (err) {
            console.error(
                '[ERROR] Failed to start Spotify game.',
                err?.message || err?.response?.data || err
            );
            resetActiveGameData();
            game.phase = SETUP;
            sendPlaylistList(
                client,
                getPlaylistCache(),
                err?.message || 'Unable to start Spotify game.'
            );
        }
        return;
    }
    if (game.activeGameId === TRIVIA_GAME_ID) {
        game.rounds = 1;
        game.maxRounds = Math.min(
            Math.max(requestedRounds, TRIVIA_MIN_ROUNDS),
            TRIVIA_MAX_ROUNDS
        );
        const normalizedCategory = normalizeTriviaCategory(cfg.category);
        const normalizedDifficulty = normalizeTriviaDifficulty(cfg.difficulty);
        game.trivia.category = normalizedCategory ?? TRIVIA_DEFAULT_CATEGORY;
        game.trivia.difficulty = normalizedDifficulty ?? TRIVIA_DEFAULT_DIFFICULTY;
        game.scoreboard = {};
        const started = await startTriviaGame(
            (clientEntry) => clientEntry.state === READY || clientEntry.state === SETUP,
            { resetScores: true }
        );
        if (!started) {
            await sendTriviaSetup(
                client,
                'No trivia questions found for that topic and difficulty.'
            );
        }
    }
}

function handleSelectAnswer(client, text) {
    const payload = parseJson(text);
    if (!payload) {
        return;
    }
    const elapsed = game.startTime ? Date.now() - game.startTime : 0;
    client.answerTime = elapsed;
    if (game.activeGameId === TRIVIA_GAME_ID) {
        if (payload.type !== 'trivia_answer') {
            return;
        }
        client.answer = String(payload.answer || '');
    } else {
        client.answer = payload;
    }
    client.state = WAITING;

    if (allClientsNotInState(SELECT_ANSWER)) {
        scoreCurrentRound();
        game.phase = SCOREBOARD;
        broadcast((c) => c.state === WAITING, (c) => {
            updateClientState(c, SCOREBOARD, buildScoreboardPayload());
        });
    }
}

async function handleScoreboard(client) {
    client.state = WAITING;
    if (!allClientsNotInState(SCOREBOARD)) {
        return;
    }
    if (game.rounds === game.maxRounds) {
        game.phase = GAME_OVER;
        broadcast((c) => c.state === WAITING, (c) => {
            updateClientState(c, GAME_OVER);
        });
        await sleep(5000);
        game.phase = PLAY_AGAIN;
        broadcast((c) => c.state === GAME_OVER && c.gameleader, (c) => {
            updateClientState(c, PLAY_AGAIN);
        });
        return;
    }

    game.rounds += 1;
    if (game.activeGameId === TRIVIA_GAME_ID) {
        game.trivia.index = game.rounds - 1;
        await startTriviaRound((c) => c.state === WAITING);
        return;
    }
    try {
        await advanceTrackAndStart((c) => c.state === WAITING);
    } catch (err) {
        console.error(
            '[ERROR] Failed to advance Spotify round.',
            err?.message || err?.response?.data || err
        );
        await resetToSetupWithError(err?.message || 'Unable to advance the Spotify round.');
    }
}

async function handlePlayAgain(client, text) {
    if (text === 'setup game') {
        if (!client.gameleader) {
            return;
        }
        if (![SPOTIFY_GAME_ID, TRIVIA_GAME_ID].includes(game.activeGameId)) {
            return;
        }
        resetActiveGameData();
        game.phase = SETUP;
        broadcast((c) => c.state === GAME_OVER || c.state === PLAY_AGAIN, (c) => {
            if (!c.gameleader) {
                updateClientState(c, READY);
            }
        });
        if (game.activeGameId === SPOTIFY_GAME_ID) {
            await loadPlaylistsForClient(client);
            return;
        }
        if (game.activeGameId === TRIVIA_GAME_ID) {
            await sendTriviaSetup(client);
        }
        return;
    }
    if (text === 'play again') {
        resetRoundState();
        if (game.activeGameId === TRIVIA_GAME_ID) {
            game.rounds = 1;
            await startTriviaGame(
                (c) => c.state === GAME_OVER || c.state === PLAY_AGAIN,
                { resetScores: true }
            );
            return;
        }
        await advanceTrackAndStart((c) => c.state === GAME_OVER || c.state === PLAY_AGAIN, {
            resetScores: true,
        });
        return;
    }
    if (text === 'new game') {
        resetGameState();
        broadcast((c) => c.state === GAME_OVER || c.state === PLAY_AGAIN, (c) => {
            updateClientState(c, SET_USERNAME);
        });
    }
}

// on client connection
wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
    });
    const remoteAddress = req?.socket?.remoteAddress || 'unknown';
    const userAgent = req?.headers?.['user-agent'] || 'unknown';
    const forwardedFor = req?.headers?.['x-forwarded-for'] || '';

    const clientID = clientIDCounter++;
    clients.set(clientID, {
        id: clientID,
        ws,
        state: SET_USERNAME,
        username: '',
        answer: null,
        answerTime: 0,
        gameleader: false,
    });
    console.log(
        `[ws] Connected (id: ${clientID}). Waiting for username. IP=${remoteAddress} UA=${userAgent} ${forwardedFor ? `XFF=${forwardedFor}` : ''}`
    );
    broadcastPlayers();

    ws.on('error', (err) => {
        console.error(`[ws] Error (id: ${clientID}).`, err?.message || err);
    });

    ws.on('message', async (msg) => {
        const client = clients.get(clientID);
        if (!client) {
            return;
        }
        const text = msg.toString();

        try {
            switch (client.state) {
                case SET_USERNAME:
                    await handleSetUsername(client, text);
                    return;

                case SETUP:
                    await handleSetup(client, text);
                    return;

                case SELECT_GAME:
                    await handleGameSelect(client, text);
                    return;

                case SELECT_ANSWER:
                    handleSelectAnswer(client, text);
                    return;

                case SCOREBOARD:
                    await handleScoreboard(client);
                    return;

                case PLAY_AGAIN:
                    await handlePlayAgain(client, text);
                    return;

                case READY:
                case WAITING:
                case GAME_OVER:
                default:
                    return;
            }
        } catch (err) {
            console.error('[ERROR] Failed to handle client message.', err?.message || err);
        }
    });

    // on client close
    ws.on('close', (code, reason) => {
        const reasonText = reason ? reason.toString() : '';
        console.log(
            `[ws] Disconnected (id: ${clientID}). Code=${code}${reasonText ? ` Reason=${reasonText}` : ''}`
        );
        const disconnectedClient = clients.get(clientID);
        const wasLeader = disconnectedClient?.gameleader;
        clients.delete(clientID);
        if (game.scoreboard[clientID]) {
            delete game.scoreboard[clientID];
        }
        if (clients.size === 0) {
            clientIDCounter = 0;
            resetGameState();
            return;
        }
        broadcastPlayers();
        if (wasLeader || !hasActiveLeader()) {
            promoteNextLeader().catch((err) => {
                console.error(
                    '[ERROR] Failed to promote leader after disconnect.',
                    err?.message || err
                );
            });
        }
    });
});

async function startServer() {
    await refreshAccessToken(5000);
    setInterval(() => {
        refreshAccessToken(5000).catch((err) => {
            console.error(
                '[ERROR] Failed to refresh access token after retries. Shutting down.',
                err?.response?.data || err?.message || err
            );
            process.exit(1);
        });
    }, REFRESH_FREQUENCY_MINUTES * 60 * 1000);

    server.listen(PORT, HOST, () => {
        console.log(`[server] Listening on http://${DISPLAY_HOST}:${PORT}`);
    });
}

// run server
startServer().catch((err) => {
    console.error('[ERROR] Failed to start server.', err?.response?.data || err?.message || err);
    process.exit(1);
});
