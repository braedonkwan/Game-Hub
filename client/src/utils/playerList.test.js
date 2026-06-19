import { buildPlayerListView, toPlayerViewModel } from './playerList';

describe('player list view model', () => {
  test('normalizes display name and reconnecting status', () => {
    expect(
      toPlayerViewModel({
        id: 1,
        username: 'Sam',
        isConnected: false,
      })
    ).toEqual({
      id: 1,
      username: 'Sam',
      isConnected: false,
      displayName: 'Sam',
      isOffline: true,
      status: 'Reconnecting',
    });

    expect(toPlayerViewModel({ id: 2, username: '' }).displayName).toBe(
      'Joining...'
    );
  });

  test('sorts leader first, online players next, offline players last', () => {
    const players = buildPlayerListView([
      { id: 1, username: 'Zed', isConnected: false },
      { id: 2, username: 'Bea', isConnected: true },
      { id: 3, username: 'Alex', isConnected: true, isLeader: true },
      { id: 4, username: 'Ari', isConnected: true },
    ]);

    expect(players.map((player) => player.username)).toEqual([
      'Alex',
      'Ari',
      'Bea',
      'Zed',
    ]);
  });
});
