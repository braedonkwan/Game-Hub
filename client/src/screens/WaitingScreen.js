import React from 'react';
import PlayerList from '../components/PlayerList';
import Screen from '../components/Screen';

const WaitingScreen = ({ message, players }) => {
  return (
    <Screen>
      <div className="text-container slide-up">{message}</div>
      <PlayerList players={players} className="player-panel" />
    </Screen>
  );
};

export default WaitingScreen;
