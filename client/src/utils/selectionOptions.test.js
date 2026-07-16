import {
  buildSelectionOptions,
  findSelectionOptionByKey,
} from './selectionOptions';

describe('selection option helpers', () => {
  test('filters invalid selections and adds labels and shortcuts', () => {
    const options = buildSelectionOptions(
      {
        first: { name: 'Song A', artists: 'Artist A' },
        skipped: { name: 'Missing artist' },
        second: { name: 'Song B', artists: 'Artist B' },
      },
      { random: () => 0.99 }
    );

    expect(options.map((option) => option.title)).toEqual(['Song A', 'Song B']);
    expect(options[0]).toMatchObject({
      label: 'A',
      shortcutKeys: ['a', '1'],
      description: 'Artist A',
      selection: { name: 'Song A', artists: 'Artist A' },
    });
    expect(options[1]).toMatchObject({
      label: 'B',
      shortcutKeys: ['b', '2'],
    });
  });

  test('shuffles selections with injectable randomness', () => {
    const options = buildSelectionOptions(
      {
        first: { name: 'Song A', artists: 'Artist A' },
        second: { name: 'Song B', artists: 'Artist B' },
        third: { name: 'Song C', artists: 'Artist C' },
      },
      { random: () => 0 }
    );

    expect(options.map((option) => option.title)).toEqual([
      'Song B',
      'Song C',
      'Song A',
    ]);
  });

  test('keeps equivalent selection payloads in a stable display order', () => {
    const firstPayload = {
      first: { name: 'Song A', artists: 'Artist A' },
      second: { name: 'Song B', artists: 'Artist B' },
      third: { name: 'Song C', artists: 'Artist C' },
      fourth: { name: 'Song D', artists: 'Artist D' },
      round: 1,
      roundStartedAt: 1000,
      answerDeadlineAt: 11000,
    };
    const secondPayload = {
      fourth: { name: 'Song D', artists: 'Artist D' },
      second: { name: 'Song B', artists: 'Artist B' },
      first: { name: 'Song A', artists: 'Artist A' },
      third: { name: 'Song C', artists: 'Artist C' },
      answerDeadlineAt: 11000,
      roundStartedAt: 1000,
      round: 1,
    };

    expect(buildSelectionOptions(firstPayload).map((option) => option.title)).toEqual(
      buildSelectionOptions(secondPayload).map((option) => option.title)
    );
  });

  test('varies stable display order between rounds', () => {
    const selections = {
      first: { name: 'Song A', artists: 'Artist A' },
      second: { name: 'Song B', artists: 'Artist B' },
      third: { name: 'Song C', artists: 'Artist C' },
      fourth: { name: 'Song D', artists: 'Artist D' },
      round: 1,
      roundStartedAt: 1000,
      answerDeadlineAt: 11000,
    };
    const nextRoundSelections = {
      ...selections,
      round: 2,
      roundStartedAt: 2000,
      answerDeadlineAt: 12000,
    };

    expect(buildSelectionOptions(selections).map((option) => option.title)).not.toEqual(
      buildSelectionOptions(nextRoundSelections).map((option) => option.title)
    );
  });

  test('finds options by letter or number key', () => {
    const options = buildSelectionOptions(
      {
        first: { name: 'Song A', artists: 'Artist A' },
        second: { name: 'Song B', artists: 'Artist B' },
      },
      { random: () => 0.99 }
    );

    expect(findSelectionOptionByKey(options, 'A')?.title).toBe('Song A');
    expect(findSelectionOptionByKey(options, '2')?.title).toBe('Song B');
    expect(findSelectionOptionByKey(options, 'x')).toBeNull();
  });
});
