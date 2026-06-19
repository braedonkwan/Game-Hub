const compareNames = (left, right) =>
  left.displayName.localeCompare(right.displayName, undefined, {
    sensitivity: 'base',
  });

export const toPlayerViewModel = (player) => {
  const displayName = player?.username || 'Joining...';
  const isOffline = Boolean(player?.username && player?.isConnected === false);
  return {
    ...player,
    displayName,
    isOffline,
    status: player?.status || (isOffline ? 'Reconnecting' : ''),
  };
};

export const buildPlayerListView = (players) => {
  const list = Array.isArray(players) ? players : [];
  return list
    .map(toPlayerViewModel)
    .sort((left, right) => {
      if (left.isLeader !== right.isLeader) {
        return left.isLeader ? -1 : 1;
      }
      if (left.isOffline !== right.isOffline) {
        return left.isOffline ? 1 : -1;
      }
      return compareNames(left, right);
    });
};
