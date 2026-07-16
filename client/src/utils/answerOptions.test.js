import {
  findAnswerOptionByKey,
  getOptionLabel,
  getOptionShortcutKeys,
  orderAnswerOptions,
  shuffleAnswerOptions,
} from './answerOptions';

describe('answer option helpers', () => {
  test('labels options beyond the shortcut range with numbers', () => {
    expect(getOptionLabel(0)).toBe('A');
    expect(getOptionLabel(3)).toBe('D');
    expect(getOptionLabel(4)).toBe('5');
  });

  test('builds shortcut keys for supported answer positions', () => {
    expect(getOptionShortcutKeys(0)).toEqual(['a', '1']);
    expect(getOptionShortcutKeys(3)).toEqual(['d', '4']);
    expect(getOptionShortcutKeys(4)).toEqual(['5']);
  });

  test('finds an answer option by normalized keyboard key', () => {
    const items = [
      { title: 'Mercury', shortcutKeys: ['a', '1'] },
      { title: 'Venus', shortcutKeys: ['b', '2'] },
    ];

    expect(findAnswerOptionByKey(items, 'A')?.title).toBe('Mercury');
    expect(findAnswerOptionByKey(items, '2')?.title).toBe('Venus');
    expect(findAnswerOptionByKey(items, 'x')).toBeNull();
  });

  test('shuffles options with injectable randomness', () => {
    expect(shuffleAnswerOptions(['A', 'B', 'C'], () => 0)).toEqual([
      'B',
      'C',
      'A',
    ]);
  });

  test('orders options deterministically by stable key', () => {
    const items = [
      { title: 'Song A', artists: 'Artist A' },
      { title: 'Song B', artists: 'Artist B' },
      { title: 'Song C', artists: 'Artist C' },
    ];
    const reversedItems = [...items].reverse();
    const getStableKey = (item) => `${item.title}::${item.artists}`;

    expect(
      orderAnswerOptions(items, { getStableKey }).map((item) => item.title)
    ).toEqual(
      orderAnswerOptions(reversedItems, { getStableKey }).map(
        (item) => item.title
      )
    );
  });

  test('allows a seeded stable order for different contexts', () => {
    const items = ['Alpha', 'Bravo', 'Charlie', 'Delta'];

    expect(orderAnswerOptions(items, { seed: 'round-1' })).toEqual(
      orderAnswerOptions(items, { seed: 'round-1' })
    );
    expect(orderAnswerOptions(items, { seed: 'round-2' })).toEqual(
      expect.arrayContaining(items)
    );
  });
});
