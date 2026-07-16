import React from 'react';
import { buildPlayerListView, getPlayerListSummary } from '../utils/playerList';

const PlayerList = ({
  players,
  className = '',
  currentUsername = '',
  title = 'Players',
  emptyText = 'Waiting for players to join...',
}) => {
  const playerList = buildPlayerListView(players, currentUsername);
  const summary = getPlayerListSummary(players);

  return (
    <div className={className}>
      {title ? <div className="player-list-title">{title}</div> : null}
      {summary ? <div className="player-list-summary">{summary}</div> : null}
      {playerList.length ? (
        <div className="player-list">
          {playerList.map((player) => {
            return (
              <div
                key={player.id}
                className={`player-chip${
                  player.isCurrentPlayer ? ' player-chip--current' : ''
                }${
                  player.isLeader ? ' player-chip--leader' : ''
                }${player.isOffline ? ' player-chip--offline' : ''}`}
              >
                <span className="player-name">{player.displayName}</span>
                {player.isCurrentPlayer ? (
                  <span className="player-current">You</span>
                ) : null}
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
