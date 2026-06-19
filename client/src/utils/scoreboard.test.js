import { buildScoreRows, formatScoreDelta, getWinners } from './scoreboard';

describe('scoreboard helpers', () => {
  test('formats score deltas defensively', () => {
    expect(formatScoreDelta(100)).toBe('+100');
    expect(formatScoreDelta(0)).toBe('+0');
    expect(formatScoreDelta(-5)).toBe('-5');
    expect(formatScoreDelta(undefined)).toBe('+0');
  });

  test('sorts scores and gives tied players the same rank', () => {
    const rows = buildScoreRows({
      1: { username: 'Zed', score: 500, delta: 20 },
      2: { username: 'Ana', score: 900, delta: 50 },
      3: { username: 'Bea', score: 900 },
      4: { username: 'Cam', score: 300, delta: 0 },
    });

    expect(
      rows.map(({ username, rank, isLeader, deltaLabel }) => ({
        username,
        rank,
        isLeader,
        deltaLabel,
      }))
    ).toEqual([
      { username: 'Ana', rank: 1, isLeader: true, deltaLabel: '+50' },
      { username: 'Bea', rank: 1, isLeader: true, deltaLabel: '+0' },
      { username: 'Zed', rank: 3, isLeader: false, deltaLabel: '+20' },
      { username: 'Cam', rank: 4, isLeader: false, deltaLabel: '+0' },
    ]);
  });

  test('returns all tied winners', () => {
    expect(
      getWinners({
        1: { username: 'A', score: 10 },
        2: { username: 'B', score: 10 },
        3: { username: 'C', score: 8 },
      }).map((row) => row.username)
    ).toEqual(['A', 'B']);
  });
});
