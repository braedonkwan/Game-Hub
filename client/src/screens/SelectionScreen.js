import React, { useEffect, useMemo, useState } from 'react';
import Screen from '../components/Screen';

const shuffleSelections = (selections) => {
  const options = Object.values(selections || {});
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
};

const SelectionScreen = ({ selections, onGuess }) => {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const shuffledSelections = useMemo(
    () => shuffleSelections(selections),
    [selections]
  );

  useEffect(() => {
    setHasSubmitted(false);
  }, [selections]);

  const handleClick = (selection) => {
    if (hasSubmitted) return;
    setHasSubmitted(true);
    onGuess(selection);
  };

  return (
    <Screen containerClassName="fade-in" contentClassName="">
      <div className="grid">
        {shuffledSelections.map((selection, index) => (
          <button
            key={`${selection.name}-${selection.artists}-${index}`}
            type="button"
            className="selection-box"
            onClick={() => handleClick(selection)}
            disabled={hasSubmitted}
          >
            <div className="selection">
              <strong>{selection.name}</strong>
            </div>
            <div className="selection">{selection.artists}</div>
          </button>
        ))}
      </div>
    </Screen>
  );
};

export default SelectionScreen;
