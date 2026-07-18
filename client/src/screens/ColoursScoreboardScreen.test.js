import { fireEvent, render, screen } from '@testing-library/react';
import ColoursScoreboardScreen from './ColoursScoreboardScreen';

const payload = {
  type: 'scoreboard',
  gameId: 'colours',
  round: 3,
  banker: 'Ada',
  winningColour: 'blue',
  skipped: false,
  scores: {
    ada: { username: 'Ada', balanceCents: 12000, deltaCents: 2000, isBanker: true },
    bea: { username: 'Bea', balanceCents: 0, deltaCents: -10000, eliminated: true },
  },
};

test('renders winning colour, balances, elimination, and readiness', () => {
  const onReady = jest.fn(() => true);
  render(
    <ColoursScoreboardScreen payload={payload} currentUsername="Bea" onReady={onReady} />
  );
  expect(screen.getByText('Blue')).toBeTruthy();
  expect(screen.getByText('$120.00')).toBeTruthy();
  expect(screen.getByText('Eliminated')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ready' }));
  expect(onReady).toHaveBeenCalledTimes(1);
});
