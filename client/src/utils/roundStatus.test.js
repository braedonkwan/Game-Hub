import { buildRoundTimer } from './roundStatus';

describe('round status view model', () => {
  test('returns null when timer metadata is incomplete', () => {
    expect(
      buildRoundTimer({
        roundStartedAt: 1000,
        serverSentAt: undefined,
        maxScore: 1000,
        now: 1200,
        receivedAt: 1200,
      })
    ).toBeNull();
  });

  test('reports elapsed time when no deadline is available', () => {
    expect(
      buildRoundTimer({
        roundStartedAt: 1000,
        serverSentAt: 1500,
        maxScore: 1000,
        now: 2500,
        receivedAt: 2000,
      })
    ).toEqual({
      label: '1.0s elapsed',
      progressPercent: null,
      score: 968,
      urgencyLevel: 'elapsed',
    });
  });

  test('reports remaining time and progress before deadline', () => {
    expect(
      buildRoundTimer({
        answerDeadlineAt: 11000,
        roundStartedAt: 1000,
        serverSentAt: 2000,
        maxScore: 1000,
        now: 5000,
        receivedAt: 3000,
      })
    ).toEqual({
      label: '7s left',
      progressPercent: 70,
      score: 945,
      urgencyLevel: 'normal',
    });
  });

  test('marks timer as urgent near the deadline', () => {
    expect(
      buildRoundTimer({
        answerDeadlineAt: 11000,
        roundStartedAt: 1000,
        serverSentAt: 2000,
        maxScore: 1000,
        now: 8000,
        receivedAt: 3000,
      })
    ).toEqual({
      label: '4s left',
      progressPercent: 40,
      score: 923,
      urgencyLevel: 'warning',
    });
  });

  test('clamps progress at zero after deadline', () => {
    expect(
      buildRoundTimer({
        answerDeadlineAt: 3000,
        roundStartedAt: 1000,
        serverSentAt: 2000,
        maxScore: 1000,
        now: 6000,
        receivedAt: 3000,
      })
    ).toEqual({
      label: "Time's up",
      progressPercent: 0,
      score: 937,
      urgencyLevel: 'expired',
    });
  });
});
