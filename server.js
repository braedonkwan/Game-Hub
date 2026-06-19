// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const {
    PORT,
    HOST,
    DISPLAY_HOST,
    SPOTIFY_CONFIGURED,
    SPOTIFY_DISABLED,
} = require('./server/config');
const {
    GAME_STATES,
    REFRESH_FREQUENCY_MINUTES,
    CONNECTION_HEARTBEAT_MS,
    CONNECTION_RECONNECT_GRACE_MS,
    GAME_OVER_DISPLAY_MS,
    ROUND_ANSWER_TIMEOUT_MS,
} = require('./server/constants');
const {
    refreshAccessToken,
    isSpotifyReady,
    getUserPlaylists,
    loadPlaylist,
    playPlaylist,
    nextTrack,
} = require('./server/spotify');
const {
    buildGameCatalog,
    GAME_CATALOG,
    SPOTIFY_GAME_ID,
    TRIVIA_GAME_ID,
} = require('./server/gameCatalog');
const { applySpotifySetup, applyTriviaSetup } = require('./server/gameSetup');
const { buildHealthPayload } = require('./server/health');
const {
    canAdvancePastState,
    isDeadlineExpired,
} = require('./server/phaseCoordinator');
const { scoreRound } = require('./server/roundScoring');
const {
    addRoundMetadata,
    buildScoreboardPayload: createScoreboardPayload,
    buildSelectionPayload,
} = require('./server/roundPayload');
const { createResumeToken, isValidResumeToken } = require('./server/session');
const {
    buildPlayerListPayload: createPlayerListPayload,
    getActiveLeader: findActiveLeader,
    getLeaderCandidates: findLeaderCandidates,
} = require('./server/playerRoster');
const { songSelection } = require('./server/spotifyGame');
const {
    buildSpotifySetupPayload,
    validateSpotifySetup,
} = require('./server/spotifySetup');
const {
    buildTriviaPayload,
    createTriviaState,
    getTriviaSetupPayload,
    loadTriviaQuestions,
    validateTriviaSetup,
} = require('./server/trivia');
const {
    isSameUsername,
    normalizeUsername,
    parseJson,
    parseUsernamePayload,
    sleep,
} = require('./server/utils');
const {
    isOpen,
    sendJson,
    updateClientState,
} = require('./server/wsTransport');

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

const SELECTION_DELAY_MS = 500;
let playlistCache = [];
let roundTimeout = null;
let scoreboardTransitionInProgress = false;

// express + websocket setup
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, perMessageDeflate: false });
app.get('/health', (_req, res) => {
    res.json(
        buildHealthPayload({
            activeClientCount: [...clients.values()].filter(isActiveClient).length,
            activeGameId: game.activeGameId,
            clientCount: clients.size,
            phase: game.phase,
            spotifyConfigured: SPOTIFY_CONFIGURED,
            spotifyDisabled: SPOTIFY_DISABLED,
            spotifyReady: isSpotifyReady(),
        })
    );
});
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
    answerDeadlineAt: 0,
    answerTimeoutMs: ROUND_ANSWER_TIMEOUT_MS,
    phase: SET_USERNAME,
    trivia: createTriviaState(),
    lastRoundDeltas: null,
};

const isActiveClient = (client) => !!client && isOpen(client.ws);
const setPlaylistCache = (playlists) => {
    playlistCache = Array.isArray(playlists) ? playlists : [];
    return playlistCache;
};
const getPlaylistCache = () => playlistCache;
const getSpotifyUnavailableReason = () => {
    if (!SPOTIFY_CONFIGURED) {
        return SPOTIFY_DISABLED
            ? 'Spotify is disabled on this server.'
            : 'Spotify credentials are not configured.';
    }
    return 'Spotify is connecting. Try again shortly.';
};
const buildGameListPayload = () => ({
    type: 'game_list',
    games: buildGameCatalog({
        spotifyAvailable: isSpotifyReady(),
        spotifyUnavailableReason: getSpotifyUnavailableReason(),
    }),
});
const sendGameList = (client) =>
    updateClientState(client, SELECT_GAME, buildGameListPayload());
const sendPlaylistList = (client, playlists, error) =>
    updateClientState(client, SETUP, buildSpotifySetupPayload(playlists, error));
const sendUsernameError = (client, message) =>
    sendJson(client.ws, { type: 'username_error', message });
const sendSession = (client) =>
    sendJson(client.ws, {
        type: 'session',
        username: client.username,
        resumeToken: client.resumeToken,
    });
const loadPlaylistsForClient = async (client, errorMessage) => {
    if (!isSpotifyReady()) {
        sendPlaylistList(client, [], errorMessage || getSpotifyUnavailableReason());
        return;
    }
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
const buildPlayerListPayload = () =>
    createPlayerListPayload(clients, isActiveClient);
const broadcastPlayers = () => {
    const payload = buildPlayerListPayload();
    broadcast((client) => isActiveClient(client), (client) => {
        sendJson(client.ws, payload);
    });
};
const getRoundInfo = () => ({
    round: game.rounds,
    total: game.maxRounds,
    roundStartedAt: game.startTime,
    answerDeadlineAt: game.answerDeadlineAt,
});
const buildScoreboardPayload = () =>
    createScoreboardPayload({
        activeGameId: game.activeGameId,
        lastRoundDeltas: game.lastRoundDeltas,
        maxRounds: game.maxRounds,
        round: game.rounds,
        scoreboard: game.scoreboard,
        selections: game.selections,
        trivia: game.trivia,
    });
const sendScoreboardState = (client, state) => {
    sendJson(client.ws, buildScoreboardPayload());
    updateClientState(client, state);
};
const setCurrentSelectionPayload = (payload) => {
    if (game.activeGameId === TRIVIA_GAME_ID) {
        game.trivia.currentPayload = payload;
        return;
    }
    game.selections = payload;
};
const getCurrentSelectionPayload = () =>
    buildSelectionPayload({
        activeGameId: game.activeGameId,
        trivia: game.trivia,
        selections: game.selections,
        roundInfo: getRoundInfo(),
    });
const startSelectionPhase = (predicate, payload, { resetScores = false } = {}) => {
    clearRoundTimeout();
    game.startTime = Date.now();
    game.answerDeadlineAt = game.startTime + game.answerTimeoutMs;
    game.phase = SELECT_ANSWER;
    game.lastRoundDeltas = null;
    const roundPayload = addRoundMetadata(payload, getRoundInfo());
    setCurrentSelectionPayload(roundPayload);
    broadcast(predicate, (client, id) => {
        client.answer = null;
        client.answerTime = 0;
        if (resetScores || !game.scoreboard[id]) {
            game.scoreboard[id] = { username: client.username, score: 0 };
        }
        updateClientState(client, SELECT_ANSWER, roundPayload);
    });
    roundTimeout = setTimeout(() => {
        finalizeCurrentRound();
    }, game.answerTimeoutMs);
};
const broadcast = (predicate, cb) => {
    clients.forEach((client, id) => {
        if (predicate(client)) {
            cb(client, id);
        }
    });
};

function clearRoundTimeout() {
    if (roundTimeout) {
        clearTimeout(roundTimeout);
        roundTimeout = null;
    }
}

const getActiveLeader = () => findActiveLeader(clients, isActiveClient);

const hasActiveLeader = () => Boolean(getActiveLeader());

const getLeaderCandidates = () =>
    findLeaderCandidates(clients, isActiveClient, game.phase);

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

const scheduleDisconnectedClientCleanup = (clientID, client) => {
    if (client.reconnectCleanup) {
        clearTimeout(client.reconnectCleanup);
    }
    client.disconnectedAt = Date.now();
    client.reconnectCleanup = setTimeout(() => {
        if (clients.get(clientID) !== client) {
            return;
        }
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
        if (!hasActiveLeader()) {
            promoteNextLeader().catch((err) => {
                console.error(
                    '[ERROR] Failed to promote leader after reconnect window expired.',
                    err?.message || err
                );
            });
        }
    }, CONNECTION_RECONNECT_GRACE_MS);
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
    const result = scoreRound({
        activeGameId: game.activeGameId,
        triviaAnswer: game.trivia.correctAnswer,
        currentTrack: game.selections?.['current track'],
        clients,
        scoreboard: game.scoreboard,
        waitingState: WAITING,
    });
    game.scoreboard = result.scoreboard;
    game.lastRoundDeltas = result.deltas;
}

function finalizeCurrentRound() {
    if (game.phase !== SELECT_ANSWER) {
        return false;
    }
    clearRoundTimeout();
    scoreCurrentRound();
    game.phase = SCOREBOARD;
    broadcast(
        (client) =>
            isActiveClient(client) &&
            (client.state === SELECT_ANSWER || client.state === WAITING),
        (client) => {
            updateClientState(client, SCOREBOARD, buildScoreboardPayload());
        }
    );
    return true;
}

async function advanceFromScoreboard() {
    if (
        game.phase !== SCOREBOARD ||
        scoreboardTransitionInProgress ||
        !canAdvancePastState(clients, SCOREBOARD, isActiveClient)
    ) {
        return false;
    }

    scoreboardTransitionInProgress = true;
    try {
        if (game.rounds >= game.maxRounds) {
            game.phase = GAME_OVER;
            broadcast(
                (client) => isActiveClient(client) && client.state === WAITING,
                (client) => {
                    sendScoreboardState(client, GAME_OVER);
                }
            );
            await sleep(GAME_OVER_DISPLAY_MS);
            game.phase = PLAY_AGAIN;
            broadcast(
                (client) =>
                    isActiveClient(client) &&
                    client.state === GAME_OVER &&
                    client.gameleader,
                (client) => {
                    updateClientState(client, PLAY_AGAIN);
                }
            );
            return true;
        }

        game.rounds += 1;
        if (game.activeGameId === TRIVIA_GAME_ID) {
            game.trivia.index = game.rounds - 1;
            await startTriviaRound((client) => client.state === WAITING);
            return true;
        }
        try {
            await advanceTrackAndStart((client) => client.state === WAITING);
        } catch (err) {
            console.error(
                '[ERROR] Failed to advance Spotify round.',
                err?.message || err?.response?.data || err
            );
            await resetToSetupWithError(
                err?.message || 'Unable to advance the Spotify round.'
            );
        }
        return true;
    } finally {
        scoreboardTransitionInProgress = false;
    }
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
    const payload = buildTriviaPayload({
        trivia: game.trivia,
        round: game.rounds,
        total: game.maxRounds,
    });
    if (!payload) {
        return;
    }
    startSelectionPhase(predicate, payload, { resetScores });
}

async function startTriviaGame(predicate, { resetScores = false } = {}) {
    const questions = await loadTriviaQuestions(game.maxRounds, {
        category: game.trivia.category,
        difficulty: game.trivia.difficulty,
        type: game.trivia.type,
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
    clearRoundTimeout();
    game.rounds = 1;
    game.scoreboard = {};
    game.startTime = 0;
    game.answerDeadlineAt = 0;
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
    game.answerTimeoutMs = ROUND_ANSWER_TIMEOUT_MS;
    game.playlist = [];
    game.selections = null;
    game.trivia = createTriviaState();
}

async function returnRoomToGameSelect() {
    resetActiveGameData();
    game.activeGameId = null;
    game.phase = SELECT_GAME;
    await ensureLeaderAssigned();
    broadcast((client) => isActiveClient(client), (client) => {
        if (client.gameleader) {
            sendGameList(client);
        } else {
            updateClientState(client, READY);
        }
    });
    broadcastPlayers();
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
    const { username, resumeToken } = parseUsernamePayload(text);
    const trimmed = normalizeUsername(username);
    if (!trimmed) {
        return;
    }
    const existingEntry = [...clients.entries()].find(
        ([id, entry]) => id !== client.id && isSameUsername(entry.username, trimmed)
    );
    if (existingEntry) {
        const [existingId, existingClient] = existingEntry;
        if (!isValidResumeToken(existingClient.resumeToken, resumeToken)) {
            sendUsernameError(
                client,
                isActiveClient(existingClient)
                    ? 'That name is already in use.'
                    : 'That name is reserved while the player reconnects.'
            );
            return;
        }
        if (existingClient.reconnectCleanup) {
            clearTimeout(existingClient.reconnectCleanup);
            existingClient.reconnectCleanup = null;
        }
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
    client.resumeToken = createResumeToken();
    if (!client.gameleader) {
        await ensureLeaderAssigned();
    }
    sendSession(client);
    broadcastPlayers();
    await syncClientState(client);
    if (
        game.phase === SELECT_ANSWER &&
        canAdvancePastState(clients, SELECT_ANSWER, isActiveClient)
    ) {
        finalizeCurrentRound();
    } else if (
        game.phase === SCOREBOARD &&
        canAdvancePastState(clients, SCOREBOARD, isActiveClient)
    ) {
        await advanceFromScoreboard();
    }
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
    if (selectedGame.id === SPOTIFY_GAME_ID && !isSpotifyReady()) {
        sendGameList(client);
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
    if (game.activeGameId === SPOTIFY_GAME_ID) {
        const setup = validateSpotifySetup(cfg);
        if (!setup.ok) {
            sendPlaylistList(client, getPlaylistCache(), setup.error);
            return;
        }
        try {
            applySpotifySetup(game, setup);
            game.playlist = await loadPlaylist(setup.playlistId);
            await playPlaylist(setup.playlistId);
            await sleep(SELECTION_DELAY_MS);
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
        const setup = validateTriviaSetup(cfg);
        if (!setup.ok) {
            await sendTriviaSetup(client, setup.error);
            return;
        }
        applyTriviaSetup(game, setup);
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
    const answeredAt = Date.now();
    if (isDeadlineExpired(game.answerDeadlineAt, answeredAt)) {
        finalizeCurrentRound();
        return;
    }
    const elapsed = game.startTime ? answeredAt - game.startTime : 0;
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

    if (canAdvancePastState(clients, SELECT_ANSWER, isActiveClient)) {
        finalizeCurrentRound();
    }
}

async function handleScoreboard(client, text) {
    if (text !== 'ready') {
        return;
    }
    client.state = WAITING;
    await advanceFromScoreboard();
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
        if (!client.gameleader) {
            return;
        }
        await returnRoomToGameSelect();
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
        resumeToken: '',
        answer: null,
        answerTime: 0,
        gameleader: false,
        disconnectedAt: null,
        reconnectCleanup: null,
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
                    await handleScoreboard(client, text);
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
        if (!disconnectedClient) {
            return;
        }
        const wasLeader = disconnectedClient?.gameleader;
        scheduleDisconnectedClientCleanup(clientID, disconnectedClient);
        broadcastPlayers();
        if (
            game.phase === SELECT_ANSWER &&
            canAdvancePastState(clients, SELECT_ANSWER, isActiveClient)
        ) {
            finalizeCurrentRound();
        } else if (
            game.phase === SCOREBOARD &&
            canAdvancePastState(clients, SCOREBOARD, isActiveClient)
        ) {
            advanceFromScoreboard().catch((err) => {
                console.error(
                    '[ERROR] Failed to advance after a scoreboard disconnect.',
                    err?.message || err
                );
            });
        }
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

const refreshSpotifyAvailability = async () => {
    try {
        await refreshAccessToken(5000);
    } catch (err) {
        console.error(
            '[spotify] Unavailable after refresh attempts.',
            err?.response?.data || err?.message || err
        );
    }
    broadcast(
        (client) =>
            isActiveClient(client) &&
            client.gameleader &&
            client.state === SELECT_GAME,
        (client) => sendGameList(client)
    );
};

async function startServer() {
    await new Promise((resolve, reject) => {
        const handleError = (err) => {
            server.off('listening', handleListening);
            reject(err);
        };
        const handleListening = () => {
            server.off('error', handleError);
            console.log(`[server] Listening on http://${DISPLAY_HOST}:${PORT}`);
            resolve();
        };
        server.once('error', handleError);
        server.once('listening', handleListening);
        server.listen(PORT, HOST);
    });

    if (!SPOTIFY_CONFIGURED) {
        return;
    }
    refreshSpotifyAvailability();
    setInterval(
        refreshSpotifyAvailability,
        REFRESH_FREQUENCY_MINUTES * 60 * 1000
    );
}

// run server
startServer().catch((err) => {
    console.error('[ERROR] Failed to start server.', err?.response?.data || err?.message || err);
    process.exit(1);
});
