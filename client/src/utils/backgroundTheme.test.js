import { getGameBackgroundTheme } from './backgroundTheme';

describe('game background themes', () => {
  test.each([
    [{ type: 'colours_round' }, 'colours'],
    [{ type: 'trivia_question' }, 'trivia'],
    [{ type: 'playlist_list' }, 'music'],
    [{ type: 'scoreboard', gameId: 'spotify' }, 'music'],
    [{ 'current track': { name: 'Song' } }, 'music'],
    [{ type: 'game_list' }, 'hub'],
    [null, 'hub'],
  ])('selects the right theme for %p', (payload, expected) => {
    expect(getGameBackgroundTheme(payload)).toBe(expected);
  });
});
