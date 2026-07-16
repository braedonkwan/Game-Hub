import { buildTriviaOptions, findTriviaOptionByKey } from './triviaOptions';

describe('trivia option helpers', () => {
  test('adds labels and keyboard shortcuts', () => {
    expect(buildTriviaOptions(['Mercury', 'Venus'])).toEqual([
      {
        title: 'Mercury',
        label: 'A',
        shortcutKeys: ['a', '1'],
      },
      {
        title: 'Venus',
        label: 'B',
        shortcutKeys: ['b', '2'],
      },
    ]);
  });

  test('finds options by letter or number key', () => {
    const options = buildTriviaOptions(['Mercury', 'Venus']);

    expect(findTriviaOptionByKey(options, 'A')?.title).toBe('Mercury');
    expect(findTriviaOptionByKey(options, '2')?.title).toBe('Venus');
    expect(findTriviaOptionByKey(options, 'x')).toBeNull();
  });
});
