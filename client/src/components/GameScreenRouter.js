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
import ColoursRoundScreen from '../screens/ColoursRoundScreen';
import ColoursScoreboardScreen from '../screens/ColoursScoreboardScreen';
import ColoursSetupScreen from '../screens/ColoursSetupScreen';
import ColoursWinnerScreen from '../screens/ColoursWinnerScreen';
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
    isColoursSetup,
    isColoursRound,
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
      return isColoursSetup ? (
        <ColoursSetupScreen
          config={gameData}
          onStart={actions.startGame}
          players={players}
        />
      ) : isTriviaSetup ? (
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
      return isColoursRound ? (
        <ColoursRoundScreen data={gameData} onBet={actions.sendColoursBet} />
      ) : isTriviaQuestion ? (
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
      return isColoursRound ? (
        <ColoursRoundScreen data={gameData} onBet={actions.sendColoursBet} />
      ) : (
        <WaitingScreen
          message="Waiting for other players to guess..."
          players={players}
          currentUsername={currentUsername}
        />
      );
    case GAME_STATES.SCOREBOARD:
      return scoreboardPayload?.gameId === 'colours' ? (
        <ColoursScoreboardScreen
          payload={scoreboardPayload}
          currentUsername={currentUsername}
          onReady={actions.sendReady}
        />
      ) : (
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
      return scoreboardPayload?.gameId === 'colours' ? (
        <ColoursWinnerScreen
          payload={scoreboardPayload}
          currentUsername={currentUsername}
        />
      ) : (
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
