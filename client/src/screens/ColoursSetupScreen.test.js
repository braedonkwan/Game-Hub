import { fireEvent, render, screen } from '@testing-library/react';
import ColoursSetupScreen from './ColoursSetupScreen';

describe('ColoursSetupScreen', () => {
  const config = {
    type: 'colours_setup',
    startingCashDefault: '100.00',
    startingCashMin: '1.00',
    startingCashMax: '10000.00',
    betSecondsDefault: 30,
    betSecondsMin: 5,
    betSecondsMax: 120,
  };

  test('submits a valid two-decimal starting balance', () => {
    const onStart = jest.fn(() => true);
    render(<ColoursSetupScreen config={config} onStart={onStart} />);

    const input = screen.getByLabelText(
      'Starting cash per player ($1.00–$10,000.00; based on 2 players)'
    );
    fireEvent.change(input, { target: { value: '250.55' } });
    fireEvent.change(screen.getByLabelText('Betting Time (5-120 seconds)'), {
      target: { value: '45' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start Colours' }));

    expect(onStart).toHaveBeenCalledWith({
      startingCash: '250.55',
      betSeconds: 45,
    });
  });

  test('rejects betting times outside the configured range', () => {
    render(<ColoursSetupScreen config={config} onStart={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Betting Time (5-120 seconds)'), {
      target: { value: '4' },
    });
    expect(screen.getByRole('button', { name: 'Start Colours' }).disabled).toBe(true);
  });

  test('rejects values outside the configured range', () => {
    render(<ColoursSetupScreen config={config} onStart={jest.fn()} />);
    const input = screen.getByLabelText(
      'Starting cash per player ($1.00–$10,000.00; based on 2 players)'
    );
    fireEvent.change(input, { target: { value: '0.99' } });
    expect(screen.getByRole('button', { name: 'Start Colours' }).disabled).toBe(true);
  });

  test('raises the minimum above one dollar for large rooms', () => {
    const players = Array.from({ length: 22 }, (_, index) => ({
      username: `Player ${index + 1}`,
      isConnected: true,
    }));
    render(
      <ColoursSetupScreen config={config} players={players} onStart={jest.fn()} />
    );
    const input = screen.getByLabelText(
      'Starting cash per player ($1.05–$10,000.00; based on 22 players)'
    );
    fireEvent.change(input, { target: { value: '1.04' } });
    expect(screen.getByRole('button', { name: 'Start Colours' }).disabled).toBe(true);
  });
});
