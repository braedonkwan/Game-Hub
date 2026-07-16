import React from 'react';
import GameSelectScreen from '../screens/GameSelectScreen';
import PlayAgainScreen from '../screens/PlayAgainScreen';
import ScoreboardScreen from '../screens/ScoreboardScreen';
import SelectionScreen from '../screens/SelectionScreen';
import SetupScreen from '../screens/SetupScreen';
import TriviaQuestionScreen from '../screens/TriviaQuestionScreen';
import TriviaSetupScreen from '../screens/TriviaSetupScreen';
import UsernameScreen from '../screens/UsernameScreen';
import WaitingScreen from '../screens/WaitingScreen';
import WinnerScreen from '../screens/WinnerScreen';
import { GAME_STATES } from '../utils/gameState';

const GameScreenRouter = ({
  gameState,
  gameData,
  isConnected,
  players,
  currentUsername,
  screenData,
  actions,
}) => {
  const {
    listData,
    playlistError,
    playlistSetupConfig,
    isTriviaSetup,
    isTriviaQuestion,
    usernameError,
    scoreboardPayload,
    scoreboardData,
  } = screenData;

  switch (gameState) {
    case GAME_STATES.SET_USERNAME:
      return (
        <UsernameScreen
          onSubmit={actions.sendUsername}
          isConnected={isConnected}
          error={usernameError}
        />
      );
    case GAME_STATES.READY:
      return (
        <WaitingScreen
          message="Waiting for game leader to start the game..."
          players={players}
          currentUsername={currentUsername}
        />
      );
    case GAME_STATES.SELECT_GAME:
      return (
        <GameSelectScreen
          games={listData}
          onSelect={actions.selectGame}
          players={players}
          currentUsername={currentUsername}
        />
      );
    case GAME_STATES.SETUP:
      return isTriviaSetup ? (
        <TriviaSetupScreen config={gameData} onStart={actions.startGame} />
      ) : (
        <SetupScreen
          playlists={listData}
          config={playlistSetupConfig}
          onStart={actions.startGame}
          error={playlistError}
        />
      );
    case GAME_STATES.SELECT_ANSWER:
      return isTriviaQuestion ? (
        <TriviaQuestionScreen
          category={gameData.category}
          difficulty={gameData.difficulty}
          question={gameData.question}
          questionType={gameData.questionType}
          options={gameData.options}
          round={gameData.round}
          total={gameData.total}
          startedAt={gameData.roundStartedAt}
          deadlineAt={gameData.answerDeadlineAt}
          serverSentAt={gameData.serverSentAt}
          maxScore={gameData.maxScore}
          onAnswer={actions.sendTriviaAnswer}
        />
      ) : (
        <SelectionScreen selections={gameData} onGuess={actions.sendGuess} />
      );
    case GAME_STATES.WAITING:
      return (
        <WaitingScreen
          message="Waiting for other players to guess..."
          players={players}
          currentUsername={currentUsername}
        />
      );
    case GAME_STATES.SCOREBOARD:
      return (
        <ScoreboardScreen
          scoreboard={scoreboardData}
          round={scoreboardPayload?.round}
          total={scoreboardPayload?.total}
          roundResult={scoreboardPayload?.roundResult}
          currentUsername={currentUsername}
          onReady={actions.sendReady}
        />
      );
    case GAME_STATES.GAME_OVER:
      return (
        <WinnerScreen
          scoreboard={scoreboardData}
          currentUsername={currentUsername}
        />
      );
    case GAME_STATES.PLAY_AGAIN:
      return (
        <PlayAgainScreen
          onPlayAgain={actions.playAgain}
          onSetupGame={actions.setupGame}
          onNewGame={actions.newGame}
        />
      );
    default:
      return null;
  }
};

export default GameScreenRouter;
