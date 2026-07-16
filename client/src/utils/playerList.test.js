import {
  buildPlayerListView,
  getPlayerListSummary,
  toPlayerViewModel,
} from './playerList';

describe('player list view model', () => {
  test('normalizes display name and reconnecting status', () => {
    expect(
      toPlayerViewModel(
        {
          id: 1,
          username: 'Sam',
          isConnected: false,
        },
        'sam'
      )
    ).toEqual({
      id: 1,
      username: 'Sam',
      isConnected: false,
      displayName: 'Sam',
      isCurrentPlayer: true,
      isOffline: true,
      status: 'Reconnecting',
    });

    expect(toPlayerViewModel({ id: 2, username: '' }).displayName).toBe(
      'Joining...'
    );
  });

  test('marks and sorts the current player first', () => {
    const players = buildPlayerListView(
      [
        { id: 1, username: 'Ada', isConnected: true, isLeader: true },
        { id: 2, username: 'Grace', isConnected: true },
      ],
      'Grace'
    );

    expect(players.map((player) => player.username)).toEqual(['Grace', 'Ada']);
    expect(players[0].isCurrentPlayer).toBe(true);
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

  test('summarizes online and reconnecting players', () => {
    expect(
      getPlayerListSummary([
        { id: 1, username: 'A', isConnected: true },
        { id: 2, username: 'B', isConnected: true },
        { id: 3, username: 'C', isConnected: false },
      ])
    ).toBe('2 online, 1 reconnecting');

    expect(getPlayerListSummary([{ id: 1, username: 'A', isConnected: true }])).toBe(
      '1 online'
    );
    expect(getPlayerListSummary([])).toBe('');
  });
});
