import {
  buildGameOptions,
  findGameOptionByKey,
  getGameAvailabilitySummary,
} from './gameOptions';

describe('game option helpers', () => {
  test('adds shortcut labels while preserving game tag context', () => {
    expect(
      buildGameOptions([
        { id: 'spotify', name: 'Spotify', tag: 'Music', available: true },
        { id: 'trivia', name: 'Trivia', available: false },
      ])
    ).toEqual([
      {
        id: 'spotify',
        name: 'Spotify',
        tag: 'Music',
        available: true,
        label: 'A',
        eyebrow: 'A - Music',
        isAvailable: true,
        shortcutKeys: ['a', '1'],
      },
      {
        id: 'trivia',
        name: 'Trivia',
        available: false,
        label: 'B',
        eyebrow: 'B',
        isAvailable: false,
        shortcutKeys: ['b', '2'],
      },
    ]);
  });

  test('finds only available game options by shortcut', () => {
    const options = buildGameOptions([
      { id: 'spotify', name: 'Spotify', available: false },
      { id: 'trivia', name: 'Trivia', available: true },
    ]);

    expect(findGameOptionByKey(options, '1')).toBeNull();
    expect(findGameOptionByKey(options, 'B')?.id).toBe('trivia');
    expect(findGameOptionByKey(options, 'x')).toBeNull();
  });

  test('summarizes game availability', () => {
    expect(
      getGameAvailabilitySummary([
        { id: 'spotify', available: false },
        { id: 'trivia', available: true },
      ])
    ).toBe('1 game ready, 1 unavailable');

    expect(
      getGameAvailabilitySummary([
        { id: 'spotify', available: true },
        { id: 'trivia', available: true },
      ])
    ).toBe('2 games ready');

    expect(getGameAvailabilitySummary([])).toBe('');
  });
});
