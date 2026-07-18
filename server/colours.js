const crypto = require('crypto');

const COLOURS_GAME_ID = 'colours';
const COLOUR_NAMES = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
const COLOURS_GROSS_PAYOUT_MULTIPLIER = 6;
const COLOURS_NET_PAYOUT_LIABILITY_MULTIPLIER =
    COLOURS_GROSS_PAYOUT_MULTIPLIER - 1;
const COLOURS_BET_TIMEOUT_MS = 30000;
const COLOURS_MIN_BET_SECONDS = 5;
const COLOURS_DEFAULT_BET_SECONDS = COLOURS_BET_TIMEOUT_MS / 1000;
const COLOURS_MAX_BET_SECONDS = 120;
const COLOURS_MIN_STARTING_CASH_CENTS = 100;
const COLOURS_DEFAULT_STARTING_CASH_CENTS = 10000;
const COLOURS_MAX_STARTING_CASH_CENTS = 1000000;

const playerKey = (username) => String(username || '').trim().toLowerCase();

const parseCurrencyToCents = (value) => {
    const text = String(value ?? '').trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
        return null;
    }
    const [whole, fraction = ''] = text.split('.');
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    return Number.isSafeInteger(cents) ? cents : null;
};

const formatCents = (cents) => (Math.max(0, cents) / 100).toFixed(2);

const getColoursMinimumStartingCashCents = (playerCount = 2) =>
    Math.max(
        100,
        5 * (Math.max(2, Number.isInteger(playerCount) ? playerCount : 2) - 1)
    );

const validateColoursSetup = (cfg, playerCount = 2) => {
    const startingCashCents = parseCurrencyToCents(cfg?.startingCash);
    if (startingCashCents === null) {
        return { ok: false, error: 'Starting cash must be a valid dollar amount.' };
    }
    const minimumStartingCashCents = getColoursMinimumStartingCashCents(playerCount);
    if (startingCashCents < minimumStartingCashCents || startingCashCents > COLOURS_MAX_STARTING_CASH_CENTS) {
        return {
            ok: false,
            error: `Starting cash must be between $${formatCents(minimumStartingCashCents)} and $10,000.00 for ${Math.max(2, playerCount)} players.`,
        };
    }
    const betSeconds = Number(cfg?.betSeconds ?? COLOURS_DEFAULT_BET_SECONDS);
    if (!Number.isInteger(betSeconds)) {
        return { ok: false, error: 'Betting time must be a whole number.' };
    }
    if (betSeconds < COLOURS_MIN_BET_SECONDS || betSeconds > COLOURS_MAX_BET_SECONDS) {
        return {
            ok: false,
            error: `Betting time must be between ${COLOURS_MIN_BET_SECONDS} and ${COLOURS_MAX_BET_SECONDS} seconds.`,
        };
    }
    return { ok: true, startingCashCents, betTimeoutMs: betSeconds * 1000 };
};

const buildColoursSetupPayload = (error, playerCount = 2) => ({
    type: 'colours_setup',
    startingCashDefault: formatCents(COLOURS_DEFAULT_STARTING_CASH_CENTS),
    startingCashMin: formatCents(getColoursMinimumStartingCashCents(playerCount)),
    startingCashMax: formatCents(COLOURS_MAX_STARTING_CASH_CENTS),
    betSecondsDefault: COLOURS_DEFAULT_BET_SECONDS,
    betSecondsMin: COLOURS_MIN_BET_SECONDS,
    betSecondsMax: COLOURS_MAX_BET_SECONDS,
    ...(error ? { error } : {}),
});

const createColoursState = (overrides = {}) => ({
    startingCashCents: COLOURS_DEFAULT_STARTING_CASH_CENTS,
    betTimeoutMs: COLOURS_BET_TIMEOUT_MS,
    playerOrder: [],
    players: {},
    bankerKey: null,
    roundBankerKey: null,
    roundBankerUsername: '',
    bankerAdvancedForRemoval: false,
    round: 0,
    eligibleKeys: [],
    bets: {},
    perColourMaxCents: 0,
    totalMaxCents: 0,
    roundStartedAt: 0,
    betDeadlineAt: 0,
    openingBalances: {},
    lastDeltas: {},
    winningColour: null,
    skipped: false,
    ...overrides,
});

const randomIndex = (length) => crypto.randomInt(length);

const initializeColoursGame = (
    usernames,
    startingCashCents,
    chooseIndex = randomIndex,
    betTimeoutMs = COLOURS_BET_TIMEOUT_MS
) => {
    const names = Array.isArray(usernames) ? usernames : [];
    const state = createColoursState({ startingCashCents, betTimeoutMs });
    names.forEach((username) => {
        const key = playerKey(username);
        if (!key || state.players[key]) return;
        state.playerOrder.push(key);
        state.players[key] = {
            username: String(username).trim(),
            balanceCents: startingCashCents,
            eliminated: false,
        };
    });
    if (state.playerOrder.length < 2) {
        throw new Error('At least two players are required to start Colours.');
    }
    const selectedIndex = chooseIndex(state.playerOrder.length);
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= state.playerOrder.length) {
        throw new Error('Unable to select the initial banker.');
    }
    state.bankerKey = state.playerOrder[selectedIndex];
    return state;
};

const getActivePlayerKeys = (state) =>
    state.playerOrder.filter((key) => {
        const entry = state.players[key];
        return entry && !entry.eliminated && entry.balanceCents > 0;
    });

const getEligiblePlayerKeys = (state) =>
    getActivePlayerKeys(state).filter((key) => key !== state.bankerKey);

const getColoursLimits = (state) => {
    const bankerBalanceCents = state.players[state.bankerKey]?.balanceCents ?? 0;
    const bettingPlayers = getEligiblePlayerKeys(state).length;
    if (!bettingPlayers) {
        return { perColourMaxCents: 0, totalMaxCents: 0 };
    }
    return {
        perColourMaxCents: Math.floor(
            bankerBalanceCents /
                bettingPlayers /
                COLOURS_NET_PAYOUT_LIABILITY_MULTIPLIER
        ),
        totalMaxCents: Math.floor(bankerBalanceCents / bettingPlayers),
    };
};

const prepareColoursRound = (state, now = Date.now()) => {
    state.round += 1;
    state.bets = {};
    state.roundBankerKey = state.bankerKey;
    state.roundBankerUsername = state.players[state.bankerKey]?.username || '';
    state.eligibleKeys = getEligiblePlayerKeys(state);
    const limits = getColoursLimits(state);
    state.perColourMaxCents = limits.perColourMaxCents;
    state.totalMaxCents = limits.totalMaxCents;
    state.roundStartedAt = now;
    state.skipped = limits.perColourMaxCents === 0;
    state.betDeadlineAt = state.skipped ? 0 : now + state.betTimeoutMs;
    state.winningColour = null;
    state.openingBalances = Object.fromEntries(
        state.playerOrder.map((key) => [key, state.players[key]?.balanceCents ?? 0])
    );
    state.lastDeltas = Object.fromEntries(state.playerOrder.map((key) => [key, 0]));
    return state;
};

const normalizeBets = (bets) => {
    if (!bets || typeof bets !== 'object' || Array.isArray(bets)) return null;
    if (Object.keys(bets).some((key) => !COLOUR_NAMES.includes(key))) return null;
    const normalized = {};
    for (const colour of COLOUR_NAMES) {
        const cents = parseCurrencyToCents(bets[colour] ?? '0');
        if (cents === null) return null;
        normalized[colour] = cents;
    }
    return normalized;
};

const submitColoursBet = (state, username, bets) => {
    const key = playerKey(username);
    const player = state.players[key];
    if (!player || !state.eligibleKeys.includes(key) || state.bets[key]) {
        return { ok: false, error: 'You cannot bet in this round.' };
    }
    const normalized = normalizeBets(bets);
    if (!normalized) {
        return { ok: false, error: 'Enter valid amounts with no more than two decimal places.' };
    }
    if (Object.values(normalized).some((amount) => amount > state.perColourMaxCents)) {
        return { ok: false, error: 'A colour bet exceeds the per-colour maximum.' };
    }
    const totalCents = Object.values(normalized).reduce((sum, amount) => sum + amount, 0);
    const playerTotalMax = Math.min(state.totalMaxCents, player.balanceCents);
    if (totalCents > playerTotalMax) {
        return { ok: false, error: 'Your total bet exceeds the allowed maximum.' };
    }
    state.bets[key] = normalized;
    return { ok: true, totalCents };
};

const haveAllEligiblePlayersBet = (state) =>
    state.eligibleKeys.every((key) => Boolean(state.bets[key]));

const settleColoursRound = (state, chooseIndex = randomIndex) => {
    if (state.skipped) return state;
    const selectedIndex = chooseIndex(COLOUR_NAMES.length);
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= COLOUR_NAMES.length) {
        throw new Error('Unable to select a winning colour.');
    }
    state.winningColour = COLOUR_NAMES[selectedIndex];
    const banker = state.players[state.bankerKey];
    state.eligibleKeys.forEach((key) => {
        const player = state.players[key];
        const bets = state.bets[key] || Object.fromEntries(COLOUR_NAMES.map((colour) => [colour, 0]));
        const totalStake = Object.values(bets).reduce((sum, amount) => sum + amount, 0);
        player.balanceCents -= totalStake;
        banker.balanceCents += totalStake;
        const payout =
            bets[state.winningColour] * COLOURS_GROSS_PAYOUT_MULTIPLIER;
        banker.balanceCents -= payout;
        player.balanceCents += payout;
    });
    state.playerOrder.forEach((key) => {
        const player = state.players[key];
        player.eliminated = player.balanceCents === 0;
        state.lastDeltas[key] = player.balanceCents - (state.openingBalances[key] ?? player.balanceCents);
    });
    return state;
};

const rotateColoursBanker = (state) => {
    if (!state.playerOrder.length) {
        state.bankerKey = null;
        return null;
    }
    const startIndex = Math.max(0, state.playerOrder.indexOf(state.bankerKey));
    for (let offset = 1; offset <= state.playerOrder.length; offset += 1) {
        const key = state.playerOrder[(startIndex + offset) % state.playerOrder.length];
        const player = state.players[key];
        if (player && !player.eliminated && player.balanceCents > 0) {
            state.bankerKey = key;
            return key;
        }
    }
    state.bankerKey = null;
    return null;
};

const removeColoursPlayer = (state, username) => {
    const key = playerKey(username);
    if (!state.players[key]) return false;
    const removedIndex = state.playerOrder.indexOf(key);
    const wasBanker = state.bankerKey === key;
    delete state.players[key];
    state.playerOrder = state.playerOrder.filter((entry) => entry !== key);
    state.eligibleKeys = state.eligibleKeys.filter((entry) => entry !== key);
    delete state.bets[key];
    if (wasBanker) {
        state.bankerKey = null;
        for (let offset = 0; offset < state.playerOrder.length; offset += 1) {
            const candidate = state.playerOrder[(Math.max(0, removedIndex) + offset) % state.playerOrder.length];
            const player = state.players[candidate];
            if (player && !player.eliminated && player.balanceCents > 0) {
                state.bankerKey = candidate;
                break;
            }
        }
    }
    return true;
};

const getColoursWinner = (state) => {
    const activeKeys = getActivePlayerKeys(state);
    return activeKeys.length === 1 ? state.players[activeKeys[0]] : null;
};

module.exports = {
    COLOURS_BET_TIMEOUT_MS,
    COLOURS_DEFAULT_STARTING_CASH_CENTS,
    COLOURS_DEFAULT_BET_SECONDS,
    COLOURS_GAME_ID,
    COLOURS_GROSS_PAYOUT_MULTIPLIER,
    COLOURS_NET_PAYOUT_LIABILITY_MULTIPLIER,
    COLOURS_MAX_STARTING_CASH_CENTS,
    COLOURS_MAX_BET_SECONDS,
    COLOURS_MIN_STARTING_CASH_CENTS,
    COLOURS_MIN_BET_SECONDS,
    COLOUR_NAMES,
    buildColoursSetupPayload,
    createColoursState,
    formatCents,
    getActivePlayerKeys,
    getColoursLimits,
    getColoursMinimumStartingCashCents,
    getColoursWinner,
    getEligiblePlayerKeys,
    haveAllEligiblePlayersBet,
    initializeColoursGame,
    parseCurrencyToCents,
    playerKey,
    prepareColoursRound,
    removeColoursPlayer,
    rotateColoursBanker,
    settleColoursRound,
    submitColoursBet,
    validateColoursSetup,
};
