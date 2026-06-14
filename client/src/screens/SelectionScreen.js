import React, { useEffect, useMemo, useState } from 'react';
import OptionCard from '../components/OptionCard';
import RoundStatus from '../components/RoundStatus';
import Screen from '../components/Screen';

const shuffleSelections = (selections) => {
  const options = Object.values(selections || {}).filter(
    (selection) => selection?.name && selection?.artists
  );
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
};

const selectionKey = (selection, index) =>
  `${selection?.name || ''}-${selection?.artists || ''}-${index}`;

const SelectionScreen = ({ selections, onGuess }) => {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedKey, setSubmittedKey] = useState('');
  const shuffledSelections = useMemo(
    () => shuffleSelections(selections),
    [selections]
  );

  useEffect(() => {
    setHasSubmitted(false);
    setSubmittedKey('');
  }, [selections]);

  const handleClick = (selection, key) => {
    if (hasSubmitted) return;
    const sent = onGuess(selection);
    if (!sent) return;
    setHasSubmitted(true);
    setSubmittedKey(key);
  };

  return (
    <Screen containerClassName="fade-in" contentClassName="answer-stage">
      <RoundStatus
        round={selections?.round}
        total={selections?.total}
        startedAt={selections?.roundStartedAt}
        deadlineAt={selections?.answerDeadlineAt}
        serverSentAt={selections?.serverSentAt}
        maxScore={selections?.maxScore}
      />
      <div className="grid">
        {shuffledSelections.map((selection, index) => {
          const key = selectionKey(selection, index);
          return (
            <OptionCard
              key={key}
              title={selection.name}
              description={selection.artists}
              submitted={submittedKey === key}
              onClick={() => handleClick(selection, key)}
              disabled={hasSubmitted}
            />
          );
        })}
      </div>
    </Screen>
  );
};

export default SelectionScreen;
