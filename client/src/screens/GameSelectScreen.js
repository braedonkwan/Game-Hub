import React, { useState } from 'react';
import Screen from '../components/Screen';

const GameSelectScreen = ({ games, onSelect, players }) => {
  const [selectedGameId, setSelectedGameId] = useState(null);
  const hasSelected = selectedGameId !== null;
  const playerList = Array.isArray(players) ? players : [];
  const hasPlayers = playerList.length > 0;

  const handleSelect = (gameId) => {
    if (hasSelected) return;
    setSelectedGameId(gameId);
    onSelect(gameId);
  };

  return (
    <Screen containerClassName="game-hub-container" contentClassName="vertical game-hub">
      <div className="hub-header">
        <div>
          <div className="title">Game Hub</div>
          <div className="subtitle">Game leader: pick what everyone will play.</div>
        </div>
      </div>
      <div className="hub-body">
        <div className="hub-side">
          <div className="hub-card">
            <div className="hub-card-title">Players</div>
            {hasPlayers ? (
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
            ) : (
              <div className="player-empty">Waiting for players to join...</div>
            )}
          </div>
        </div>
        <div className="grid hub-grid">
          {games.length === 0 ? (
            <div className="hub-empty">No games available yet.</div>
          ) : (
            <>
              {games.map((game) => {
                const isSelected = selectedGameId === game.id;
                return (
                  <button
                    key={game.id}
                    type="button"
                    className={`selection-box${
                      isSelected ? ' selection-box--selected' : ''
                    }`}
                    onClick={() => handleSelect(game.id)}
                    disabled={hasSelected}
                    aria-pressed={isSelected}
                  >
                    <div className="selection">
                      <strong>{game.name}</strong>
                    </div>
                    {game.description && (
                      <div className="selection selection-description">
                        {game.description}
                      </div>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </Screen>
  );
};

export default GameSelectScreen;
