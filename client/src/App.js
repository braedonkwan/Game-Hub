import React, { useMemo } from 'react';
import './App.css';
import ConnectionBanner from './components/ConnectionBanner';
import GameScreenRouter from './components/GameScreenRouter';
import useGameConnection from './hooks/useGameConnection';
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

  return (
    <main className="app-shell">
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
