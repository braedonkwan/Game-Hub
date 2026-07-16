import { fireEvent, render, screen } from '@testing-library/react';
import PlayAgainScreen from './PlayAgainScreen';

const renderPlayAgain = (overrides = {}) => {
  const actions = {
    onPlayAgain: jest.fn(() => true),
    onSetupGame: jest.fn(() => true),
    onNewGame: jest.fn(() => true),
    ...overrides,
  };

  render(<PlayAgainScreen {...actions} />);
  return actions;
};

describe('PlayAgainScreen', () => {
  test('locks all actions after a successful choice', () => {
    const actions = renderPlayAgain();

    fireEvent.click(screen.getByRole('button', { name: 'Setup Game' }));

    expect(actions.onSetupGame).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Play Again' }).disabled).toBe(
      true
    );
    expect(screen.getByRole('button', { name: 'Setup Game' }).disabled).toBe(
      true
    );
    expect(screen.getByRole('button', { name: 'New Game' }).disabled).toBe(true);
  });

  test('keeps actions enabled when a choice is not sent', () => {
    const actions = renderPlayAgain({
      onPlayAgain: jest.fn(() => false),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Play Again' }));

    expect(actions.onPlayAgain).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Play Again' }).disabled).toBe(
      false
    );
  });
});
