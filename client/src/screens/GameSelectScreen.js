import React, { useState } from 'react';
import OptionCard from '../components/OptionCard';
import PlayerList from '../components/PlayerList';
import Screen from '../components/Screen';

const GameSelectScreen = ({ games, onSelect, players }) => {
  const [selectedGameId, setSelectedGameId] = useState(null);
  const hasSelected = selectedGameId !== null;

  const handleSelect = (gameId) => {
    if (hasSelected) return;
    const sent = onSelect(gameId);
    if (sent) {
      setSelectedGameId(gameId);
    }
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
          <PlayerList players={players} className="hub-card" />
        </div>
        <div className="grid hub-grid">
          {games.length === 0 ? (
            <div className="hub-empty">No games available yet.</div>
          ) : (
            <>
              {games.map((game) => {
                const isSelected = selectedGameId === game.id;
                return (
                  <OptionCard
                    key={game.id}
                    title={game.name}
                    description={game.description}
                    eyebrow={game.tag}
                    meta={game.meta}
                    highlights={game.highlights}
                    status={game.available === false ? game.unavailableReason : null}
                    selected={isSelected}
                    onClick={() => handleSelect(game.id)}
                    disabled={hasSelected || game.available === false}
                  />
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
