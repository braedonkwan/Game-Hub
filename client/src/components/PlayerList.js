import React from 'react';
import { buildPlayerListView } from '../utils/playerList';

const PlayerList = ({
  players,
  className = '',
  title = 'Players',
  emptyText = 'Waiting for players to join...',
}) => {
  const playerList = buildPlayerListView(players);

  return (
    <div className={className}>
      {title ? <div className="player-list-title">{title}</div> : null}
      {playerList.length ? (
        <div className="player-list">
          {playerList.map((player) => {
            return (
              <div
                key={player.id}
                className={`player-chip${
                  player.isLeader ? ' player-chip--leader' : ''
                }${player.isOffline ? ' player-chip--offline' : ''}`}
              >
                <span className="player-name">{player.displayName}</span>
                {player.isLeader ? (
                  <span className="player-leader">Leader</span>
                ) : null}
                {player.status ? (
                  <span className="player-status">{player.status}</span>
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
