const assert = require('node:assert/strict');
const test = require('node:test');

const {
    COLOUR_NAMES,
    beginColoursBankerChoice,
    buildColoursSetupPayload,
    formatCents,
    getColoursLimits,
    getColoursWinner,
    haveAllEligiblePlayersBet,
    initializeColoursGame,
    parseCurrencyToCents,
    prepareColoursRound,
    removeColoursPlayer,
    rotateColoursBanker,
    selectColoursWinningColour,
    settleColoursRound,
    submitColoursBet,
    validateColoursSetup,
} = require('./colours');

const zeroBets = (overrides = {}) =>
    Object.fromEntries(COLOUR_NAMES.map((colour) => [colour, overrides[colour] ?? '0.00']));

test('currency parsing uses exact integer cents', () => {
    assert.equal(parseCurrencyToCents('12'), 1200);
    assert.equal(parseCurrencyToCents('12.3'), 1230);
    assert.equal(parseCurrencyToCents('12.34'), 1234);
    assert.equal(parseCurrencyToCents('12.345'), null);
    assert.equal(parseCurrencyToCents('-1.00'), null);
    assert.equal(formatCents(1234), '12.34');
});

test('Colours setup publishes and validates starting cash bounds', () => {
    assert.deepEqual(buildColoursSetupPayload(), {
        type: 'colours_setup',
        startingCashDefault: '100.00',
        startingCashMin: '1.00',
        startingCashMax: '10000.00',
        betSecondsDefault: 30,
        betSecondsMin: 5,
        betSecondsMax: 120,
    });
    assert.deepEqual(validateColoursSetup({ startingCash: '25.55' }), {
        ok: true,
        startingCashCents: 2555,
        betTimeoutMs: 30000,
    });
    assert.equal(validateColoursSetup({ startingCash: '0.99' }).ok, false);
    assert.equal(validateColoursSetup({ startingCash: '10000.01' }).ok, false);
    assert.deepEqual(
        validateColoursSetup({ startingCash: '25.55', betSeconds: 45 }),
        { ok: true, startingCashCents: 2555, betTimeoutMs: 45000 }
    );
    assert.equal(
        validateColoursSetup({ startingCash: '25.55', betSeconds: 4 }).ok,
        false
    );
    assert.equal(
        validateColoursSetup({ startingCash: '25.55', betSeconds: 12.5 }).ok,
        false
    );
    assert.equal(validateColoursSetup({ startingCash: '0.99' }, 3).ok, false);
    assert.deepEqual(validateColoursSetup({ startingCash: '1.00' }, 3), {
        ok: true,
        startingCashCents: 100,
        betTimeoutMs: 30000,
    });
    assert.equal(validateColoursSetup({ startingCash: '1.04' }, 22).ok, false);
    assert.equal(validateColoursSetup({ startingCash: '1.05' }, 22).ok, true);
    assert.equal(validateColoursSetup({ startingCash: '2.44' }, 50).ok, false);
    assert.equal(validateColoursSetup({ startingCash: '2.45' }, 50).ok, true);
});

test('initial banker is selected randomly from a stable player order', () => {
    const state = initializeColoursGame(['Ada', 'Bea', 'Cam'], 10000, () => 1);
    assert.deepEqual(state.playerOrder, ['ada', 'bea', 'cam']);
    assert.equal(state.bankerKey, 'bea');
    assert.equal(state.players.ada.balanceCents, 10000);
});

test('limits floor to cents using every solvent non-banker', () => {
    const state = initializeColoursGame(['Ada', 'Bea', 'Cam'], 10001, () => 0);
    assert.deepEqual(getColoursLimits(state), {
        perColourMaxCents: 1000,
        totalMaxCents: 5000,
    });
    prepareColoursRound(state, 1000);
    assert.equal(state.betDeadlineAt, 31000);
    assert.deepEqual(state.eligibleKeys, ['bea', 'cam']);
});

test('round deadlines use the configured betting duration', () => {
    const state = initializeColoursGame(
        ['Ada', 'Bea'],
        10000,
        () => 0,
        45000
    );
    prepareColoursRound(state, 1000);
    assert.equal(state.betDeadlineAt, 46000);
});

test('only the banker can choose a valid colour after betting', () => {
    const state = initializeColoursGame(['Ada', 'Bea'], 10000, () => 0, 45000);
    prepareColoursRound(state, 1000);
    assert.equal(selectColoursWinningColour(state, 'Ada', 'red').ok, false);

    beginColoursBankerChoice(state, 2000);
    assert.equal(state.betDeadlineAt, 47000);
    assert.equal(selectColoursWinningColour(state, 'Bea', 'red').ok, false);
    assert.equal(selectColoursWinningColour(state, 'Ada', 'pink').ok, false);
    assert.deepEqual(selectColoursWinningColour(state, 'Ada', 'purple'), {
        ok: true,
        colour: 'purple',
    });
    settleColoursRound(state, () => assert.fail('random choice should not run'));
    assert.equal(state.winningColour, 'purple');
    assert.equal(state.roundStage, 'settled');
});

test('bet validation enforces per-colour, total, balance, and one submission', () => {
    const state = initializeColoursGame(['Ada', 'Bea'], 10000, () => 0);
    prepareColoursRound(state);
    assert.equal(submitColoursBet(state, 'Bea', zeroBets({ red: '20.00' })).ok, true);
    assert.equal(haveAllEligiblePlayersBet(state), true);
    assert.equal(submitColoursBet(state, 'Bea', zeroBets()).ok, false);

    const next = initializeColoursGame(['Ada', 'Bea'], 10000, () => 0);
    prepareColoursRound(next);
    assert.equal(submitColoursBet(next, 'Bea', zeroBets({ red: '20.01' })).ok, false);
    assert.equal(submitColoursBet(next, 'Bea', zeroBets({ red: '1.001' })).ok, false);
});

test('settlement transfers stakes and pays the winner six times gross', () => {
    const state = initializeColoursGame(['Ada', 'Bea', 'Cam'], 10000, () => 0);
    prepareColoursRound(state);
    submitColoursBet(state, 'Bea', zeroBets({ red: '5.00', blue: '2.00' }));
    submitColoursBet(state, 'Cam', zeroBets({ green: '4.00' }));
    settleColoursRound(state, () => 0);

    assert.equal(state.winningColour, 'red');
    assert.equal(state.players.ada.balanceCents, 8100);
    assert.equal(state.players.bea.balanceCents, 12300);
    assert.equal(state.players.cam.balanceCents, 9600);
    assert.equal(Object.values(state.players).reduce((sum, player) => sum + player.balanceCents, 0), 30000);
});

test('per-colour cap limits worst-case net banker liability', () => {
    const state = initializeColoursGame(['Ada', 'Bea', 'Cam'], 10000, () => 0);
    prepareColoursRound(state);
    submitColoursBet(state, 'Bea', zeroBets({ red: '10.00' }));
    submitColoursBet(state, 'Cam', zeroBets({ red: '10.00' }));
    settleColoursRound(state, () => 0);

    assert.equal(state.players.ada.balanceCents, 0);
    assert.equal(state.players.ada.eliminated, true);
    assert.equal(state.players.bea.balanceCents, 15000);
    assert.equal(state.players.cam.balanceCents, 15000);
});

test('zero balances are eliminated and banker rotation skips them', () => {
    const state = initializeColoursGame(['Ada', 'Bea', 'Cam'], 10000, () => 0);
    state.players.bea.balanceCents = 0;
    state.players.bea.eliminated = true;
    assert.equal(rotateColoursBanker(state), 'cam');
    assert.equal(rotateColoursBanker(state), 'ada');
});

test('a zero per-colour cap creates a skipped round', () => {
    const state = initializeColoursGame(['Ada', 'Bea'], 100, () => 0);
    state.players.ada.balanceCents = 4;
    prepareColoursRound(state, 500);
    assert.equal(state.skipped, true);
    assert.equal(state.betDeadlineAt, 0);
});

test('winner detection and permanent removal cannot leave a stale banker', () => {
    const state = initializeColoursGame(['Ada', 'Bea', 'Cam'], 10000, () => 1);
    assert.equal(removeColoursPlayer(state, 'Bea'), true);
    assert.equal(state.bankerKey, 'cam');
    removeColoursPlayer(state, 'Cam');
    assert.equal(getColoursWinner(state).username, 'Ada');
});
