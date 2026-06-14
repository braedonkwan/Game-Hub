import React, { useMemo } from 'react';
import './App.css';
import ConnectionBanner from './components/ConnectionBanner';
import useGameConnection from './hooks/useGameConnection';
import { GAME_STATES } from './utils/gameState';
import getWebSocketUrl from './utils/websocketUrl';
import GameSelectScreen from './screens/GameSelectScreen';
import PlayAgainScreen from './screens/PlayAgainScreen';
import ScoreboardScreen from './screens/ScoreboardScreen';
import SelectionScreen from './screens/SelectionScreen';
import SetupScreen from './screens/SetupScreen';
import TriviaQuestionScreen from './screens/TriviaQuestionScreen';
import TriviaSetupScreen from './screens/TriviaSetupScreen';
import UsernameScreen from './screens/UsernameScreen';
import WaitingScreen from './screens/WaitingScreen';
import WinnerScreen from './screens/WinnerScreen';

const App = () => {
  const websocketUrl = getWebSocketUrl();
  const {
    gameState,
    gameData,
    isConnected,
    connectionStatus,
    reconnectDelayMs,
    players,
    actions: {
      sendUsername,
      startGame,
      selectGame,
      sendGuess,
      sendTriviaAnswer,
      sendReady,
      playAgain,
      setupGame,
      newGame,
      reconnect,
    },
  } = useGameConnection(websocketUrl);

  const listData = useMemo(() => {
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
  }, [gameData]);

  const playlistError =
    gameData?.type === 'playlist_list' ? gameData.error : null;
  const playlistSetupConfig =
    gameData?.type === 'playlist_list' ? gameData : null;
  const isTriviaSetup = gameData?.type === 'trivia_setup';
  const isTriviaQuestion = gameData?.type === 'trivia_question';
  const usernameError =
    gameData?.type === 'username_error' ? gameData.message : null;
  const scoreboardPayload = gameData?.type === 'scoreboard' ? gameData : null;
  const scoreboardData = scoreboardPayload?.scores ?? gameData;

  const renderScreen = () => {
    switch (gameState) {
      case GAME_STATES.SET_USERNAME:
        return (
          <UsernameScreen
            onSubmit={sendUsername}
            isConnected={isConnected}
            error={usernameError}
          />
        );
      case GAME_STATES.READY:
        return (
          <WaitingScreen
            message="Waiting for game leader to start the game..."
            players={players}
          />
        );
      case GAME_STATES.SELECT_GAME:
        return (
          <GameSelectScreen games={listData} onSelect={selectGame} players={players} />
        );
      case GAME_STATES.SETUP:
        return isTriviaSetup ? (
          <TriviaSetupScreen config={gameData} onStart={startGame} />
        ) : (
          <SetupScreen
            playlists={listData}
            config={playlistSetupConfig}
            onStart={startGame}
            error={playlistError}
          />
        );
      case GAME_STATES.SELECT_ANSWER:
        return isTriviaQuestion ? (
          <TriviaQuestionScreen
            question={gameData.question}
            options={gameData.options}
            round={gameData.round}
            total={gameData.total}
            startedAt={gameData.roundStartedAt}
            deadlineAt={gameData.answerDeadlineAt}
            serverSentAt={gameData.serverSentAt}
            maxScore={gameData.maxScore}
            onAnswer={sendTriviaAnswer}
          />
        ) : (
          <SelectionScreen selections={gameData} onGuess={sendGuess} />
        );
      case GAME_STATES.WAITING:
        return (
          <WaitingScreen message="Waiting for other players to guess..." players={players} />
        );
      case GAME_STATES.SCOREBOARD:
        return (
          <ScoreboardScreen
            scoreboard={scoreboardData}
            round={scoreboardPayload?.round}
            total={scoreboardPayload?.total}
            roundResult={scoreboardPayload?.roundResult}
            onReady={sendReady}
          />
        );
      case GAME_STATES.GAME_OVER:
        return <WinnerScreen scoreboard={scoreboardData} />;
      case GAME_STATES.PLAY_AGAIN:
        return (
          <PlayAgainScreen
            onPlayAgain={playAgain}
            onSetupGame={setupGame}
            onNewGame={newGame}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="app-shell">
      <div className="bg-particles" aria-hidden="true" />
      <ConnectionBanner
        status={connectionStatus}
        reconnectDelayMs={reconnectDelayMs}
        onReconnect={reconnect}
      />
      {renderScreen()}
    </main>
  );
};

export default App;
