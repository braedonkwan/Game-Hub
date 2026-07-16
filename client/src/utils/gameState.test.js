import {
  GAME_STATES,
  isGameListPayload,
  isKnownGameState,
  isPlayerListPayload,
  isPlaylistPayload,
  isScoreboardPayload,
  isSelectionPayload,
  isSessionPayload,
  isTriviaQuestionPayload,
  isTriviaSetupPayload,
  isUsernameErrorPayload,
  parseStateMessage,
} from './gameState';

describe('game state helpers', () => {
  test('parses only known state messages', () => {
    expect(parseStateMessage('state 1')).toBe(GAME_STATES.SET_USERNAME);
    expect(parseStateMessage('state 9')).toBe(GAME_STATES.SELECT_GAME);
    expect(parseStateMessage('state 999')).toBeNull();
    expect(parseStateMessage(' state 1')).toBeNull();
    expect(parseStateMessage({ state: 1 })).toBeNull();
  });

  test('recognizes known game state values', () => {
    expect(isKnownGameState(GAME_STATES.READY)).toBe(true);
    expect(isKnownGameState(999)).toBe(false);
  });

  test('recognizes legacy and structured list payloads', () => {
    expect(
      isPlaylistPayload([{ name: 'Mix', playlistID: 'playlist-1' }])
    ).toBe(true);
    expect(
      isPlaylistPayload({
        type: 'playlist_list',
        playlists: [{ name: 'Mix', playlistID: 'playlist-1' }],
      })
    ).toBe(true);
    expect(isPlaylistPayload({ type: 'playlist_list', playlists: null })).toBe(
      false
    );

    expect(isGameListPayload([{ type: 'game', id: 'trivia', name: 'Trivia' }])).toBe(
      true
    );
    expect(
      isGameListPayload({
        type: 'game_list',
        games: [{ type: 'game', id: 'trivia', name: 'Trivia' }],
      })
    ).toBe(true);
    expect(isGameListPayload({ type: 'game_list', games: null })).toBe(false);
  });

  test('recognizes structured game payloads defensively', () => {
    expect(
      isSelectionPayload({ 'current track': { name: 'Song', artists: 'Artist' } })
    ).toBe(true);
    expect(isSelectionPayload({ 'current track': 'Song' })).toBe(false);
    expect(isSelectionPayload([{ 'current track': {} }])).toBe(false);

    expect(isTriviaSetupPayload({ type: 'trivia_setup' })).toBe(true);
    expect(isTriviaQuestionPayload({ type: 'trivia_question' })).toBe(true);
    expect(isScoreboardPayload({ type: 'scoreboard', scores: { 1: {} } })).toBe(
      true
    );
    expect(isScoreboardPayload({ type: 'scoreboard', scores: [] })).toBe(false);
    expect(isPlayerListPayload({ type: 'player_list', players: [] })).toBe(true);
  });

  test('recognizes connection/session side-channel payloads', () => {
    expect(
      isUsernameErrorPayload({
        type: 'username_error',
        message: 'That name is already in use.',
      })
    ).toBe(true);
    expect(isUsernameErrorPayload({ type: 'username_error' })).toBe(false);

    expect(
      isSessionPayload({
        type: 'session',
        username: 'Ada',
        resumeToken: 'token',
      })
    ).toBe(true);
    expect(isSessionPayload({ type: 'session', username: 'Ada' })).toBe(false);
  });
});
