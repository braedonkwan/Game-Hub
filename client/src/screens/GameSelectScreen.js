import React, { useCallback, useMemo, useState } from 'react';
import OptionCard from '../components/OptionCard';
import PlayerList from '../components/PlayerList';
import Screen from '../components/Screen';
import useOptionShortcuts from '../hooks/useOptionShortcuts';
import {
  buildGameOptions,
  findGameOptionByKey,
  getGameAvailabilitySummary,
} from '../utils/gameOptions';

const GameSelectScreen = ({ games, onSelect, players, currentUsername = '' }) => {
  const [selectedGameId, setSelectedGameId] = useState(null);
  const gameOptions = useMemo(() => buildGameOptions(games), [games]);
  const availabilitySummary = useMemo(
    () => getGameAvailabilitySummary(games),
    [games]
  );
  const hasSelected = selectedGameId !== null;

  const handleSelect = useCallback((gameId) => {
    if (hasSelected) return;
    const sent = onSelect(gameId);
    if (sent) {
      setSelectedGameId(gameId);
    }
  }, [hasSelected, onSelect]);
  const handleShortcutSelect = useCallback(
    (option) => handleSelect(option.id),
    [handleSelect]
  );

  useOptionShortcuts({
    disabled: hasSelected,
    findOptionByKey: findGameOptionByKey,
    items: gameOptions,
    onSelect: handleShortcutSelect,
  });

  return (
    <Screen containerClassName="game-hub-container" contentClassName="vertical game-hub">
      <div className="hub-header">
        <div>
          <div className="title">Game Hub</div>
          <div className="subtitle">Game leader: pick what everyone will play.</div>
        </div>
        {availabilitySummary ? (
          <div className="hub-summary">{availabilitySummary}</div>
        ) : null}
      </div>
      <div className="hub-body">
        <div className="hub-side">
          <PlayerList
            players={players}
            currentUsername={currentUsername}
            className="hub-card"
          />
        </div>
        <div className="hub-main">
          {gameOptions.length ? (
            <div className="shortcut-hint hub-shortcut-hint">
              Press A-D or 1-4 to pick a game.
            </div>
          ) : null}
          <div className="grid hub-grid">
            {gameOptions.length === 0 ? (
              <div className="hub-empty">No games available yet.</div>
            ) : (
              <>
                {gameOptions.map((game) => {
                  const isSelected = selectedGameId === game.id;
                  return (
                    <OptionCard
                      key={game.id}
                      title={game.name}
                      description={game.description}
                      eyebrow={game.eyebrow}
                      meta={game.meta}
                      highlights={game.highlights}
                      status={
                        game.available === false ? game.unavailableReason : null
                      }
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
      </div>
    </Screen>
  );
};

export default GameSelectScreen;
