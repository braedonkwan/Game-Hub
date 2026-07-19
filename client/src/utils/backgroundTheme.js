export const getGameBackgroundTheme = (gameData) => {
  const type = String(gameData?.type || '').toLowerCase();
  const gameId = String(gameData?.gameId || '').toLowerCase();

  if (gameId === 'colours' || type.startsWith('colours_')) return 'colours';
  if (gameId === 'trivia' || type.startsWith('trivia_')) return 'trivia';
  if (
    gameId === 'spotify' ||
    type === 'playlist_list' ||
    gameData?.['current track']
  ) {
    return 'music';
  }
  return 'hub';
};
