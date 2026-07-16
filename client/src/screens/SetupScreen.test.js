import { fireEvent, render, screen } from '@testing-library/react';
import SetupScreen from './SetupScreen';

const playlists = [
  { playlistID: 'playlist-a', name: 'Playlist A' },
  { playlistID: 'playlist-b', name: 'Playlist B' },
];

const config = {
  maxRoundsDefault: 4,
  maxRoundsMin: 1,
  maxRoundsMax: 10,
  guessSecondsDefault: 25,
  guessSecondsMin: 5,
  guessSecondsMax: 60,
};

describe('SetupScreen', () => {
  test('submits setup payload and locks after a successful send', () => {
    const onStart = jest.fn(() => true);

    render(
      <SetupScreen
        playlists={playlists}
        config={config}
        onStart={onStart}
        error={null}
      />
    );

    expect(screen.getByText('4 rounds, 25s per guess')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Number of Rounds (1-10)'), {
      target: { value: '6' },
    });
    fireEvent.change(screen.getByLabelText('Guess Time (5-60 seconds)'), {
      target: { value: '30' },
    });
    fireEvent.change(screen.getByLabelText('Select Playlist'), {
      target: { value: 'playlist-b' },
    });
    expect(screen.getByText('6 rounds, 30s per guess')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }));

    expect(onStart).toHaveBeenCalledWith({
      maxRounds: 6,
      playlistId: 'playlist-b',
      guessSeconds: 30,
    });
    expect(screen.getByRole('button', { name: 'Start Game' }).disabled).toBe(
      true
    );
  });

  test('keeps setup retryable when send fails and resets on error changes', () => {
    const onStart = jest.fn(() => false);
    const { rerender } = render(
      <SetupScreen
        playlists={playlists}
        config={config}
        onStart={onStart}
        error={null}
      />
    );

    expect(screen.getByText('4 rounds, 25s per guess')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Start Game' }).disabled).toBe(
      false
    );

    rerender(
      <SetupScreen
        playlists={playlists}
        config={config}
        onStart={jest.fn(() => true)}
        error="Could not start game"
      />
    );

    expect(screen.getByText('Could not start game')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start Game' }).disabled).toBe(
      false
    );
  });

  test('disables setup when playlists are unavailable', () => {
    render(
      <SetupScreen
        playlists={[]}
        config={config}
        onStart={jest.fn()}
        error={null}
      />
    );

    expect(screen.getByText('No playlists are available yet.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start Game' }).disabled).toBe(
      true
    );
  });
});
