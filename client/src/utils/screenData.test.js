import { getListData, getScreenData } from './screenData';

describe('screen data selectors', () => {
  test('reads list data from legacy arrays and structured payloads', () => {
    const legacy = [{ name: 'Playlist', playlistID: '1' }];
    const games = [{ id: 'trivia', name: 'Trivia' }];
    const playlists = [{ name: 'Mix', playlistID: '2' }];

    expect(getListData(legacy)).toBe(legacy);
    expect(getListData({ type: 'game_list', games })).toBe(games);
    expect(getListData({ type: 'playlist_list', playlists })).toBe(playlists);
    expect(getListData({ type: 'playlist_list', playlists: null })).toEqual([]);
  });

  test('derives setup, username, and scoreboard data', () => {
    const playlistPayload = {
      type: 'playlist_list',
      playlists: [],
      error: 'No playlists',
    };
    expect(getScreenData(playlistPayload)).toMatchObject({
      playlistError: 'No playlists',
      playlistSetupConfig: playlistPayload,
      isTriviaSetup: false,
      isTriviaQuestion: false,
    });

    expect(getScreenData({ type: 'trivia_setup' }).isTriviaSetup).toBe(true);
    expect(getScreenData({ type: 'trivia_question' }).isTriviaQuestion).toBe(true);
    expect(getScreenData({ type: 'colours_setup' }).isColoursSetup).toBe(true);
    expect(getScreenData({ type: 'colours_round' }).isColoursRound).toBe(true);
    expect(
      getScreenData({ type: 'username_error', message: 'Taken' }).usernameError
    ).toBe('Taken');

    const scoreboard = { type: 'scoreboard', scores: { 1: { score: 2 } } };
    expect(getScreenData(scoreboard).scoreboardPayload).toBe(scoreboard);
    expect(getScreenData(scoreboard).scoreboardData).toBe(scoreboard.scores);
  });
});
