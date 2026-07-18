import { fireEvent, render, screen } from '@testing-library/react';
import ColoursRoundScreen from './ColoursRoundScreen';

const payload = {
  type: 'colours_round',
  round: 2,
  banker: { username: 'Ada', balanceCents: 10000 },
  colours: ['red', 'orange', 'yellow', 'green', 'blue', 'purple'],
  role: 'bettor',
  canBet: true,
  balanceCents: 10000,
  perColourMaxCents: 1666,
  totalMaxCents: 10000,
  roundStartedAt: Date.now(),
  betDeadlineAt: Date.now() + 30000,
  serverSentAt: Date.now(),
  submittedCount: 0,
  eligibleCount: 1,
};

describe('ColoursRoundScreen', () => {
  test('collects six bets and submits their decimal strings', () => {
    const onBet = jest.fn(() => true);
    render(<ColoursRoundScreen data={payload} onBet={onBet} />);

    fireEvent.change(screen.getByLabelText('Red bet'), { target: { value: '5.25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit bet' }));

    expect(onBet).toHaveBeenCalledWith({
      red: '5.25',
      orange: '0.00',
      yellow: '0.00',
      green: '0.00',
      blue: '0.00',
      purple: '0.00',
    });
  });

  test('prevents a colour bet above its cap', () => {
    render(<ColoursRoundScreen data={payload} onBet={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Blue bet'), { target: { value: '16.67' } });
    expect(screen.getByRole('button', { name: 'Submit bet' }).disabled).toBe(true);
  });

  test('renders a read-only banker view', () => {
    render(
      <ColoursRoundScreen
        data={{ ...payload, canBet: false, role: 'banker' }}
        onBet={jest.fn()}
      />
    );
    expect(screen.getByText(/You are the banker/)).toBeTruthy();
    expect(screen.queryByLabelText('Red bet')).toBeNull();
  });
});
