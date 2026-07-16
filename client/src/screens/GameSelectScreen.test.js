import { fireEvent, render, screen } from '@testing-library/react';
import GameSelectScreen from './GameSelectScreen';

const games = [
  {
    id: 'spotify',
    name: 'Spotify Guess the Song',
    description: 'Guess tracks.',
    tag: 'Music',
    available: false,
    unavailableReason: 'Spotify is unavailable.',
  },
  {
    id: 'trivia',
    name: 'Trivia Challenge',
    description: 'Answer questions.',
    tag: 'Trivia',
    available: true,
  },
];

describe('GameSelectScreen', () => {
  test('renders labeled game options and ignores unavailable shortcuts', () => {
    const onSelect = jest.fn(() => true);

    render(<GameSelectScreen games={games} onSelect={onSelect} players={[]} />);

    expect(screen.getByText('Press A-D or 1-4 to pick a game.')).toBeTruthy();
    expect(screen.getByText('1 game ready, 1 unavailable')).toBeTruthy();
    expect(screen.getByText('A - Music')).toBeTruthy();
    expect(screen.getByText('B - Trivia')).toBeTruthy();
    expect(screen.getByText('Spotify is unavailable.')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'A' });
    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'B' });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('trivia');

    fireEvent.keyDown(window, { key: 'B' });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test('keeps games selectable when sending fails', () => {
    const onSelect = jest.fn(() => false);

    render(<GameSelectScreen games={games} onSelect={onSelect} players={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /Trivia Challenge/ }));
    fireEvent.click(screen.getByRole('button', { name: /Trivia Challenge/ }));

    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  test('renders empty game state without shortcut hint', () => {
    render(<GameSelectScreen games={[]} onSelect={jest.fn()} players={[]} />);

    expect(screen.getByText('No games available yet.')).toBeTruthy();
    expect(screen.queryByText(/games ready/)).toBeNull();
    expect(screen.queryByText('Press A-D or 1-4 to pick a game.')).toBeNull();
  });
});
