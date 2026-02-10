import React, { useState } from 'react';
import Screen from '../components/Screen';

const PlayAgainScreen = ({ onPlayAgain, onSetupGame, onNewGame }) => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const actions = [
    { label: 'Play Again', onClick: onPlayAgain },
    { label: 'Setup Game', onClick: onSetupGame },
    { label: 'New Game', onClick: onNewGame },
  ];

  const handleAction = (action) => () => {
    setIsButtonDisabled(true);
    action();
  };

  return (
    <Screen contentClassName="vertical play-again">
      <div className="title">Play again?</div>
      <div className="subtitle">Pick what happens next for the room.</div>
      <div className="action-grid">
        {actions.map((action) => (
          <input
            key={action.label}
            type="button"
            value={action.label}
            onClick={handleAction(action.onClick)}
            disabled={isButtonDisabled}
            className="button action-button"
          />
        ))}
      </div>
    </Screen>
  );
};

export default PlayAgainScreen;
