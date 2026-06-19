export const getListData = (gameData) => {
  if (Array.isArray(gameData)) {
    return gameData;
  }
  if (gameData?.type === 'game_list') {
    return Array.isArray(gameData.games) ? gameData.games : [];
  }
  if (gameData?.type === 'playlist_list') {
    return Array.isArray(gameData.playlists) ? gameData.playlists : [];
  }
  return [];
};

export const getScreenData = (gameData) => {
  const scoreboardPayload = gameData?.type === 'scoreboard' ? gameData : null;
  return {
    listData: getListData(gameData),
    playlistError: gameData?.type === 'playlist_list' ? gameData.error : null,
    playlistSetupConfig: gameData?.type === 'playlist_list' ? gameData : null,
    isTriviaSetup: gameData?.type === 'trivia_setup',
    isTriviaQuestion: gameData?.type === 'trivia_question',
    usernameError:
      gameData?.type === 'username_error' ? gameData.message : null,
    scoreboardPayload,
    scoreboardData: scoreboardPayload?.scores ?? gameData,
  };
};
