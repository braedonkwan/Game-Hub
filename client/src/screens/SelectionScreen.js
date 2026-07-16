import React, { useCallback, useEffect, useMemo, useState } from 'react';
import OptionCard from '../components/OptionCard';
import RoundStatus from '../components/RoundStatus';
import Screen from '../components/Screen';
import useOptionShortcuts from '../hooks/useOptionShortcuts';
import {
  buildSelectionOptions,
  findSelectionOptionByKey,
} from '../utils/selectionOptions';

const SelectionScreen = ({ selections, onGuess }) => {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedKey, setSubmittedKey] = useState('');
  const optionItems = useMemo(
    () => buildSelectionOptions(selections),
    [selections]
  );

  useEffect(() => {
    setHasSubmitted(false);
    setSubmittedKey('');
  }, [selections]);

  const submitGuess = useCallback((option) => {
    if (hasSubmitted) return;
    const sent = onGuess(option.selection);
    if (!sent) return;
    setHasSubmitted(true);
    setSubmittedKey(option.key);
  }, [hasSubmitted, onGuess]);

  useOptionShortcuts({
    disabled: hasSubmitted,
    findOptionByKey: findSelectionOptionByKey,
    items: optionItems,
    onSelect: submitGuess,
  });

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
      <div className="shortcut-hint">Press A-D or 1-4 to guess.</div>
      <div className="grid">
        {optionItems.map((option) => (
          <OptionCard
            key={option.key}
            eyebrow={option.label}
            title={option.title}
            description={option.description}
            submitted={submittedKey === option.key}
            onClick={() => submitGuess(option)}
            disabled={hasSubmitted}
          />
        ))}
      </div>
    </Screen>
  );
};

export default SelectionScreen;
