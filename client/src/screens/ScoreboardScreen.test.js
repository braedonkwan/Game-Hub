import { fireEvent, render, screen } from '@testing-library/react';
import ScoreboardScreen from './ScoreboardScreen';

const scoreboard = {
  1: {
    username: 'Ada',
    score: 1200,
    delta: 150,
    streak: 2,
    roundOutcome: { answered: true, correct: true, answerTimeMs: 800 },
  },
};

describe('ScoreboardScreen', () => {
  test('renders progress and locks ready after a successful send', () => {
    const onReady = jest.fn(() => true);

    render(
      <ScoreboardScreen
        scoreboard={scoreboard}
        round={2}
        total={5}
        roundResult={{ answer: 'Song A' }}
        currentUsername="Ada"
        onReady={onReady}
      />
    );

    expect(
      screen.getByText('Round 2 of 5. Faster correct guesses earn more points.')
    ).toBeTruthy();
    expect(screen.getByText('Ada')).toBeTruthy();
    expect(screen.getByText('You')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Ready' }));

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Ready' }).disabled).toBe(true);
  });

  test('keeps ready enabled when send fails', () => {
    const onReady = jest.fn(() => false);

    render(
      <ScoreboardScreen
        scoreboard={null}
        round={null}
        total={null}
        roundResult={null}
        onReady={onReady}
      />
    );

    expect(screen.getByText('No scores yet.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Ready' }));

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Ready' }).disabled).toBe(false);
  });
});
