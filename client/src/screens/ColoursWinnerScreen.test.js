import { render, screen } from '@testing-library/react';
import ColoursWinnerScreen from './ColoursWinnerScreen';

test('announces the sole remaining player with their balance', () => {
  render(
    <ColoursWinnerScreen
      currentUsername="Ada"
      payload={{
        scores: {
          ada: { username: 'Ada', balanceCents: 20000, eliminated: false },
          bea: { username: 'Bea', balanceCents: 0, eliminated: true },
        },
      }}
    />
  );
  expect(screen.getByText('Ada wins Colours with $200.00!')).toBeTruthy();
  expect(screen.getByText('Final balances')).toBeTruthy();
});
