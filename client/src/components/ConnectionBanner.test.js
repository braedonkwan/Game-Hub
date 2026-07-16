import { act, fireEvent, render, screen } from '@testing-library/react';
import ConnectionBanner from './ConnectionBanner';

describe('ConnectionBanner', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('does not render while connected', () => {
    const { container } = render(
      <ConnectionBanner status="connected" reconnectDelayMs={0} />
    );

    expect(container.firstChild).toBeNull();
  });

  test('renders offline status and retry action', () => {
    const onReconnect = jest.fn();

    render(
      <ConnectionBanner
        status="offline"
        reconnectDelayMs={0}
        onReconnect={onReconnect}
      />
    );

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('No room connection available.')).toBeTruthy();
    expect(
      screen.getByText('Waiting for your browser to come online.')
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Check again' }));

    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  test('updates reconnect countdown text', () => {
    jest.useFakeTimers();

    render(
      <ConnectionBanner
        status="reconnecting"
        reconnectDelayMs={2200}
        onReconnect={jest.fn()}
      />
    );

    expect(screen.getByText('Next attempt in 3s')).toBeTruthy();
    expect(
      screen
        .getByRole('progressbar', { name: 'Reconnect progress' })
        .getAttribute('aria-valuenow')
    ).toBe('0');

    act(() => {
      jest.advanceTimersByTime(1250);
    });

    expect(screen.getByText('Next attempt in 1s')).toBeTruthy();
    expect(
      screen
        .getByRole('progressbar', { name: 'Reconnect progress' })
        .getAttribute('aria-valuenow')
    ).toBe('57');

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Retrying now...')).toBeTruthy();
  });
});
