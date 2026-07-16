import {
  buildScoreRows,
  formatAnswerTime,
  formatScoreDelta,
  formatStreak,
  getRoundOutcome,
  getWinnerSummary,
  getWinners,
} from './scoreboard';

describe('scoreboard helpers', () => {
  test('formats score deltas defensively', () => {
    expect(formatScoreDelta(100)).toBe('+100');
    expect(formatScoreDelta(0)).toBe('+0');
    expect(formatScoreDelta(-5)).toBe('-5');
    expect(formatScoreDelta(undefined)).toBe('+0');
  });

  test('formats streaks only after consecutive correct rounds', () => {
    expect(formatStreak(1)).toBe('');
    expect(formatStreak(2)).toBe('2 streak');
    expect(formatStreak(5)).toBe('5 streak');
    expect(formatStreak(undefined)).toBe('');
  });

  test('formats answer times defensively', () => {
    expect(formatAnswerTime(0)).toBe('0.0s');
    expect(formatAnswerTime(720)).toBe('0.7s');
    expect(formatAnswerTime(12345)).toBe('12s');
    expect(formatAnswerTime(-400)).toBe('0.0s');
    expect(formatAnswerTime(undefined)).toBe('');
  });

  test('sorts scores and gives tied players the same rank', () => {
    const rows = buildScoreRows(
      {
        1: { username: 'Zed', score: 500, delta: 20 },
        2: {
          username: 'Ana',
          score: 900,
          delta: 50,
          streak: 3,
          roundOutcome: { answered: true, answerTimeMs: 720, correct: true },
        },
        3: {
          username: 'Bea',
          score: 900,
          roundOutcome: { answered: true, answerTimeMs: 1450, correct: false },
        },
        4: {
          username: 'Cam',
          score: 300,
          delta: 0,
          roundOutcome: { answered: false, correct: false },
        },
      },
      'bea'
    );

    expect(
      rows.map(
        ({
          username,
          rank,
          isLeader,
          deltaLabel,
          answerTimeLabel,
          roundOutcomeLabel,
          roundBestLabel,
          isCurrentPlayer,
          streakLabel,
        }) => ({
          username,
          rank,
          isLeader,
          deltaLabel,
          answerTimeLabel,
          roundOutcomeLabel,
          roundBestLabel,
          isCurrentPlayer,
          streakLabel,
        })
      )
    ).toEqual([
      {
        username: 'Ana',
        rank: 1,
        isLeader: true,
        deltaLabel: '+50',
        answerTimeLabel: '0.7s',
        roundOutcomeLabel: 'Correct',
        roundBestLabel: 'Fastest',
        isCurrentPlayer: false,
        streakLabel: '3 streak',
      },
      {
        username: 'Bea',
        rank: 1,
        isLeader: true,
        deltaLabel: '+0',
        answerTimeLabel: '1.4s',
        roundOutcomeLabel: 'Incorrect',
        roundBestLabel: '',
        isCurrentPlayer: true,
        streakLabel: '',
      },
      {
        username: 'Zed',
        rank: 3,
        isLeader: false,
        deltaLabel: '+20',
        answerTimeLabel: '',
        roundOutcomeLabel: '',
        roundBestLabel: '',
        isCurrentPlayer: false,
        streakLabel: '',
      },
      {
        username: 'Cam',
        rank: 4,
        isLeader: false,
        deltaLabel: '+0',
        answerTimeLabel: '',
        roundOutcomeLabel: 'No answer',
        roundBestLabel: '',
        isCurrentPlayer: false,
        streakLabel: '',
      },
    ]);
  });

  test('marks tied fastest round scorers', () => {
    const rows = buildScoreRows({
      1: { username: 'A', score: 100, delta: 30 },
      2: { username: 'B', score: 90, delta: 30 },
      3: { username: 'C', score: 80, delta: 10 },
    });

    expect(
      rows.map(({ username, roundBestLabel }) => ({ username, roundBestLabel }))
    ).toEqual([
      { username: 'A', roundBestLabel: 'Fastest' },
      { username: 'B', roundBestLabel: 'Fastest' },
      { username: 'C', roundBestLabel: '' },
    ]);
  });

  test('does not mark fastest when nobody scored this round', () => {
    const rows = buildScoreRows({
      1: { username: 'A', score: 100, delta: 0 },
      2: { username: 'B', score: 90 },
    });

    expect(rows.map((row) => row.roundBestLabel)).toEqual(['', '']);
  });

  test('formats round outcomes', () => {
    expect(getRoundOutcome({ answered: true, correct: true })).toEqual({
      label: 'Correct',
      tone: 'correct',
    });
    expect(getRoundOutcome({ answered: true, correct: false })).toEqual({
      label: 'Incorrect',
      tone: 'incorrect',
    });
    expect(getRoundOutcome({ answered: false, correct: false })).toEqual({
      label: 'No answer',
      tone: 'neutral',
    });
    expect(getRoundOutcome(null)).toEqual({ label: '', tone: 'neutral' });
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

  test('summarizes a single winner', () => {
    expect(
      getWinnerSummary({
        1: { username: 'Ada', score: 12 },
        2: { username: 'Grace', score: 8 },
      }).text
    ).toBe('The winner is Ada with a score of 12');
  });

  test('summarizes tied winners', () => {
    expect(
      getWinnerSummary({
        1: { username: 'Ada', score: 12 },
        2: { username: 'Grace', score: 12 },
      }).text
    ).toBe('Tie game: Ada, Grace with 12 points');
  });

  test('summarizes empty scoreboards', () => {
    expect(getWinnerSummary(null)).toEqual({
      hasWinner: false,
      text: 'Game over',
      winners: [],
    });
  });
});
