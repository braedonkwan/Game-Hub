import { buildSetupSummary, pluralize } from './setupSummary';

describe('setup summary helpers', () => {
  test('pluralizes simple labels', () => {
    expect(pluralize(1, 'round')).toBe('round');
    expect(pluralize(2, 'round')).toBe('rounds');
    expect(pluralize(2, 'quiz', 'quizzes')).toBe('quizzes');
  });

  test('builds live setup summary text', () => {
    expect(buildSetupSummary({ rounds: 1, guessSeconds: 30 })).toBe(
      '1 round, 30s per guess'
    );
    expect(
      buildSetupSummary({
        rounds: 4,
        guessSeconds: 45,
        roundLabel: 'question',
        timerLabel: 'answer',
      })
    ).toBe('4 questions, 45s per answer');
    expect(buildSetupSummary({ rounds: null, guessSeconds: 30 })).toBe(
      'Fix setup values to start.'
    );
  });
});
