import React from 'react';

const PlayerList = ({
  players,
  className = '',
  title = 'Players',
  emptyText = 'Waiting for players to join...',
}) => {
  const playerList = Array.isArray(players) ? players : [];

  return (
    <div className={className}>
      {title ? <div className="player-list-title">{title}</div> : null}
      {playerList.length ? (
        <div className="player-list">
          {playerList.map((player) => {
            const displayName = player.username || 'Joining...';
            const isOffline = player.username && player.isConnected === false;
            return (
              <div
                key={player.id}
                className={`player-chip${
                  player.isLeader ? ' player-chip--leader' : ''
                }${isOffline ? ' player-chip--offline' : ''}`}
              >
                <span className="player-name">{displayName}</span>
                {player.isLeader ? (
                  <span className="player-leader">Leader</span>
                ) : null}
                {isOffline ? (
                  <span className="player-status">Reconnecting</span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="player-empty">{emptyText}</div>
      )}
    </div>
  );
};

export default PlayerList;
