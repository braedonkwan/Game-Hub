import React from 'react';
import Screen from '../components/Screen';

const WaitingScreen = ({ message, players }) => {
  const playerList = Array.isArray(players) ? players : [];
  return (
    <Screen>
      <div className="text-container slide-up">{message}</div>
      {playerList.length ? (
        <div className="player-panel">
          <div className="player-list-title">Players</div>
          <div className="player-list">
            {playerList.map((player) => {
              const displayName = player.username || 'Joining...';
              return (
                <div
                  key={player.id}
                  className={`player-chip${
                    player.isLeader ? ' player-chip--leader' : ''
                  }`}
                >
                  <span className="player-name">{displayName}</span>
                  {player.isLeader ? (
                    <span className="player-leader">Leader</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </Screen>
  );
};

export default WaitingScreen;
