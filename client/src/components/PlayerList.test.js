import { render, screen } from '@testing-library/react';
import PlayerList from './PlayerList';

test('renders player summary and connection chips', () => {
  render(
    <PlayerList
      currentUsername="Grace"
      players={[
        {
          id: 'leader',
          username: 'Ada',
          isConnected: true,
          isLeader: true,
          status: 'Choosing game',
        },
        { id: 'guest', username: 'Grace', isConnected: false },
      ]}
    />
  );

  expect(screen.getByText('Players')).toBeTruthy();
  expect(screen.getByText('1 online, 1 reconnecting')).toBeTruthy();
  expect(screen.getByText('Ada')).toBeTruthy();
  expect(screen.getByText('Leader')).toBeTruthy();
  expect(screen.getByText('Choosing game')).toBeTruthy();
  expect(screen.getByText('Grace')).toBeTruthy();
  expect(screen.getByText('You')).toBeTruthy();
  expect(screen.getByText('Reconnecting')).toBeTruthy();
});

test('renders custom empty state when no players have joined', () => {
  render(<PlayerList players={[]} emptyText="Nobody yet" />);

  expect(screen.getByText('Nobody yet')).toBeTruthy();
});
