const compareNames = (left, right) =>
  left.displayName.localeCompare(right.displayName, undefined, {
    sensitivity: 'base',
  });

const isCurrentUsername = (player, currentUsername) =>
  Boolean(
    player?.username &&
      currentUsername &&
      player.username.toLowerCase() === currentUsername.toLowerCase()
  );

export const toPlayerViewModel = (player, currentUsername = '') => {
  const displayName = player?.username || 'Joining...';
  const isOffline = Boolean(player?.username && player?.isConnected === false);
  return {
    ...player,
    displayName,
    isCurrentPlayer: isCurrentUsername(player, currentUsername),
    isOffline,
    status: player?.status || (isOffline ? 'Reconnecting' : ''),
  };
};

export const buildPlayerListView = (players, currentUsername = '') => {
  const list = Array.isArray(players) ? players : [];
  return list
    .map((player) => toPlayerViewModel(player, currentUsername))
    .sort((left, right) => {
      if (left.isCurrentPlayer !== right.isCurrentPlayer) {
        return left.isCurrentPlayer ? -1 : 1;
      }
      if (left.isLeader !== right.isLeader) {
        return left.isLeader ? -1 : 1;
      }
      if (left.isOffline !== right.isOffline) {
        return left.isOffline ? 1 : -1;
      }
      return compareNames(left, right);
    });
};

export const getPlayerListSummary = (players) => {
  const list = buildPlayerListView(players);
  if (!list.length) {
    return '';
  }
  const onlineCount = list.filter((player) => !player.isOffline).length;
  const offlineCount = list.length - onlineCount;
  return offlineCount
    ? `${onlineCount} online, ${offlineCount} reconnecting`
    : `${onlineCount} online`;
};
