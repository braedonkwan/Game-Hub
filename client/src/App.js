import React, { useMemo } from 'react';
import './App.css';
import ConnectionBanner from './components/ConnectionBanner';
import GameBackground from './components/GameBackground';
import GameScreenRouter from './components/GameScreenRouter';
import useGameConnection from './hooks/useGameConnection';
import { getGameBackgroundTheme } from './utils/backgroundTheme';
import { getScreenData } from './utils/screenData';
import getWebSocketUrl from './utils/websocketUrl';

const App = () => {
  const websocketUrl = getWebSocketUrl();
  const {
    gameState,
    gameData,
    isConnected,
    connectionStatus,
    reconnectDelayMs,
    players,
    currentUsername,
    actions,
  } = useGameConnection(websocketUrl);

  const screenData = useMemo(() => getScreenData(gameData), [gameData]);
  const backgroundTheme = useMemo(
    () => getGameBackgroundTheme(gameData),
    [gameData]
  );

  return (
    <main className="app-shell">
      <GameBackground theme={backgroundTheme} />
      <div className="bg-particles" aria-hidden="true" />
      <ConnectionBanner
        status={connectionStatus}
        reconnectDelayMs={reconnectDelayMs}
        onReconnect={actions.reconnect}
      />
      <GameScreenRouter
        gameState={gameState}
        gameData={gameData}
        isConnected={isConnected}
        players={players}
        currentUsername={currentUsername}
        screenData={screenData}
        actions={actions}
      />
    </main>
  );
};

export default App;
