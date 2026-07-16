import { render, screen } from '@testing-library/react';
import WinnerScreen from './WinnerScreen';

describe('WinnerScreen', () => {
  test('renders the winner and final leaderboard', () => {
    const { container } = render(
      <WinnerScreen
        currentUsername="Grace"
        scoreboard={{
          1: {
            username: 'Ada',
            score: 1200,
            delta: 200,
            streak: 2,
            roundOutcome: { answered: true, answerTimeMs: 750, correct: true },
          },
          2: {
            username: 'Grace',
            score: 900,
            delta: 0,
            roundOutcome: { answered: true, answerTimeMs: 1400, correct: false },
          },
        }}
      />
    );

    expect(
      screen.getByText('The winner is Ada with a score of 1200')
    ).toBeTruthy();
    expect(screen.getByText('Final leaderboard')).toBeTruthy();
    expect(screen.getByText('Ada')).toBeTruthy();
    expect(screen.getByText('Grace')).toBeTruthy();
    expect(screen.getByText('You')).toBeTruthy();
    expect(screen.getByText('2 streak')).toBeTruthy();
    expect(container.querySelector('.fireworks')).toBeTruthy();
  });

  test('renders a game-over fallback without scores', () => {
    const { container } = render(<WinnerScreen scoreboard={null} />);

    expect(screen.getByText('Game over')).toBeTruthy();
    expect(container.querySelector('.fireworks')).toBeNull();
  });
});
