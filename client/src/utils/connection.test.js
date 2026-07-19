import {
  SOCKET_READY_STATE,
  closeActiveSocket,
  deriveStateFromPayload,
  getConnectionActionLabel,
  getConnectionDetail,
  getConnectionTitle,
  getInitialConnectionStatus,
  getNextReconnectDelay,
  getReconnectProgressPercent,
  isSocketActive,
  isSocketConnecting,
  isSocketOpen,
  parseSocketMessage,
} from './connection';
import { GAME_STATES } from './gameState';

const setNavigatorOnline = (value) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
};

describe('connection helpers', () => {
  afterEach(() => {
    setNavigatorOnline(true);
  });

  test('parses JSON socket messages and preserves legacy state strings', () => {
    expect(parseSocketMessage('{"type":"scoreboard","scores":{}}')).toEqual({
      type: 'scoreboard',
      scores: {},
    });
    expect(parseSocketMessage('state 2')).toBe('state 2');
    expect(parseSocketMessage({ type: 'ignored' })).toBeNull();
  });

  test('derives screen state from structured payloads', () => {
    expect(
      deriveStateFromPayload({
        type: 'game_list',
        games: [{ id: 'trivia', name: 'Trivia' }],
      })
    ).toBe(GAME_STATES.SELECT_GAME);
    expect(
      deriveStateFromPayload({ type: 'playlist_list', playlists: [] })
    ).toBe(GAME_STATES.SETUP);
    expect(deriveStateFromPayload({ type: 'trivia_setup' })).toBe(
      GAME_STATES.SETUP
    );
    expect(deriveStateFromPayload({ type: 'colours_setup' })).toBe(
      GAME_STATES.SETUP
    );
    expect(
      deriveStateFromPayload({
        type: 'colours_round',
        colours: ['red'],
        canBet: true,
      })
    ).toBe(GAME_STATES.SELECT_ANSWER);
    expect(
      deriveStateFromPayload({
        type: 'colours_round',
        colours: ['red'],
        canBet: false,
      })
    ).toBe(GAME_STATES.WAITING);
    expect(
      deriveStateFromPayload({
        type: 'colours_round',
        colours: ['red'],
        canBet: false,
        canChooseColour: true,
      })
    ).toBe(GAME_STATES.SELECT_ANSWER);
    expect(deriveStateFromPayload({ type: 'trivia_question' })).toBe(
      GAME_STATES.SELECT_ANSWER
    );
    expect(
      deriveStateFromPayload({ 'current track': { name: 'Song' } })
    ).toBe(GAME_STATES.SELECT_ANSWER);
    expect(deriveStateFromPayload({ type: 'scoreboard', scores: {} })).toBe(
      GAME_STATES.SCOREBOARD
    );
    expect(deriveStateFromPayload({ type: 'player_list', players: [] })).toBeNull();
  });

  test('reports initial status from url and browser network state', () => {
    expect(getInitialConnectionStatus('')).toBe('offline');
    setNavigatorOnline(true);
    expect(getInitialConnectionStatus('ws://localhost')).toBe('connecting');
    setNavigatorOnline(false);
    expect(getInitialConnectionStatus('ws://localhost')).toBe('offline');
  });

  test('formats connection banner detail text', () => {
    expect(getConnectionDetail('connecting')).toBe('Joining the room now.');
    expect(getConnectionDetail('offline')).toBe(
      'Waiting for your browser to come online.'
    );
    expect(getConnectionDetail('error')).toBe(
      'Retrying automatically. You can also retry now.'
    );
    expect(getConnectionDetail('reconnecting', 8200)).toBe('Next attempt in 9s');
    expect(getConnectionDetail('reconnecting', 0)).toBe('Retrying now...');
  });

  test('formats connection banner titles', () => {
    expect(getConnectionTitle('connecting')).toBe('Connecting to the room...');
    expect(getConnectionTitle('reconnecting')).toBe(
      'Connection lost. Reconnecting...'
    );
    expect(getConnectionTitle('offline')).toBe('No room connection available.');
    expect(getConnectionTitle('error')).toBe('Connection issue. Retrying...');
    expect(getConnectionTitle('unknown')).toBe('Connection issue. Retrying...');
  });

  test('formats connection banner action labels', () => {
    expect(getConnectionActionLabel('offline')).toBe('Check again');
    expect(getConnectionActionLabel('connecting')).toBe('Reconnect');
    expect(getConnectionActionLabel('reconnecting')).toBe('Retry now');
    expect(getConnectionActionLabel('error')).toBe('Retry now');
  });

  test('calculates reconnect backoff delays defensively', () => {
    expect(getNextReconnectDelay(1000)).toBe(2000);
    expect(getNextReconnectDelay(16000)).toBe(30000);
    expect(getNextReconnectDelay(0)).toBe(1000);
    expect(getNextReconnectDelay(undefined)).toBe(2000);
    expect(getNextReconnectDelay(5000, 6000)).toBe(6000);
  });

  test('calculates reconnect progress defensively', () => {
    expect(getReconnectProgressPercent(1000, 1000)).toBe(0);
    expect(getReconnectProgressPercent(1000, 250)).toBe(75);
    expect(getReconnectProgressPercent(1000, -100)).toBe(100);
    expect(getReconnectProgressPercent(1000, 2000)).toBe(0);
    expect(getReconnectProgressPercent(0, 0)).toBe(0);
    expect(getReconnectProgressPercent(undefined, 0)).toBe(0);
  });

  test('classifies socket ready states', () => {
    const connecting = { readyState: SOCKET_READY_STATE.CONNECTING };
    const open = { readyState: SOCKET_READY_STATE.OPEN };
    const closed = { readyState: 3 };

    expect(isSocketConnecting(connecting)).toBe(true);
    expect(isSocketConnecting(open)).toBe(false);
    expect(isSocketOpen(open)).toBe(true);
    expect(isSocketOpen(connecting)).toBe(false);
    expect(isSocketActive(connecting)).toBe(true);
    expect(isSocketActive(open)).toBe(true);
    expect(isSocketActive(closed)).toBe(false);
    expect(isSocketActive(null)).toBe(false);
  });

  test('closes only active sockets', () => {
    const activeSocket = {
      readyState: SOCKET_READY_STATE.OPEN,
      close: jest.fn(),
    };
    const closedSocket = {
      readyState: 3,
      close: jest.fn(),
    };

    expect(closeActiveSocket(activeSocket, 1000, 'Manual reconnect')).toBe(true);
    expect(activeSocket.close).toHaveBeenCalledWith(1000, 'Manual reconnect');
    expect(closeActiveSocket(closedSocket, 1000, 'Manual reconnect')).toBe(false);
    expect(closedSocket.close).not.toHaveBeenCalled();
    expect(closeActiveSocket(null)).toBe(false);
  });
});
