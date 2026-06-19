import {
  deriveStateFromPayload,
  getConnectionDetail,
  getInitialConnectionStatus,
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
    expect(getConnectionDetail('connecting')).toBe('Keep this tab open.');
    expect(getConnectionDetail('reconnecting', 8200)).toBe('Next attempt in 9s');
    expect(getConnectionDetail('reconnecting', 0)).toBe('Retrying now...');
  });
});
