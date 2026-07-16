import { render, screen } from '@testing-library/react';
import RoundStatus from './RoundStatus';

describe('RoundStatus', () => {
  let dateNowSpy;

  beforeEach(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(8000);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  test('renders round progress and warning timer state', () => {
    const { container } = render(
      <RoundStatus
        round={2}
        total={5}
        startedAt={1000}
        deadlineAt={11000}
        serverSentAt={7000}
        maxScore={1000}
      />
    );

    expect(
      screen.getByText((_, node) => node?.textContent === 'Round 2 of 5')
    ).toBeTruthy();
    expect(screen.getByText('4s left')).toBeTruthy();
    expect(container.querySelector('.round-status-meter--warning')).toBeTruthy();
  });

  test('renders nothing without round or timer data', () => {
    const { container } = render(<RoundStatus />);

    expect(container.firstChild).toBeNull();
  });
});
