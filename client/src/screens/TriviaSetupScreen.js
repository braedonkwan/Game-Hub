import React, { useEffect, useState } from 'react';
import NumberField from '../components/NumberField';
import Screen from '../components/Screen';
import SetupSelect from '../components/SetupSelect';
import SetupSummary from '../components/SetupSummary';
import useSingleSendAction from '../hooks/useSingleSendAction';
import { parseSetupNumber } from '../utils/setupNumber';
import { buildSetupSummary } from '../utils/setupSummary';

const TriviaSetupScreen = ({ config, onStart }) => {
  const defaultRounds = config?.maxRoundsDefault ?? 5;
  const minRounds = config?.maxRoundsMin ?? 1;
  const maxRounds = config?.maxRoundsMax ?? 20;
  const defaultGuessSeconds = config?.guessSecondsDefault ?? 30;
  const minGuessSeconds = config?.guessSecondsMin ?? 5;
  const maxGuessSeconds = config?.guessSecondsMax ?? 120;
  const categories = Array.isArray(config?.categories) ? config.categories : [];
  const difficultyOptions =
    Array.isArray(config?.difficulties) && config.difficulties.length
      ? config.difficulties
      : [
          { id: 'any', name: 'Any difficulty' },
          { id: 'easy', name: 'Easy' },
          { id: 'medium', name: 'Medium' },
          { id: 'hard', name: 'Hard' },
      ];
  const typeOptions =
    Array.isArray(config?.types) && config.types.length
      ? config.types
      : [
          { id: 'multiple', name: 'Multiple choice' },
          { id: 'boolean', name: 'True or false' },
      ];
  const defaultCategory = config?.defaultCategory ?? 'any';
  const defaultDifficulty = config?.defaultDifficulty ?? 'any';
  const defaultType = config?.defaultType ?? 'multiple';
  const setupId = config?.setupId ?? 0;
  const errorMessage = config?.error;
  const [rounds, setRounds] = useState(String(defaultRounds));
  const [guessSeconds, setGuessSeconds] = useState(String(defaultGuessSeconds));
  const [category, setCategory] = useState(String(defaultCategory));
  const [difficulty, setDifficulty] = useState(String(defaultDifficulty));
  const [type, setType] = useState(String(defaultType));
  const { isLocked, reset, run } = useSingleSendAction();

  useEffect(() => {
    setRounds(String(defaultRounds));
    setGuessSeconds(String(defaultGuessSeconds));
    setCategory(String(defaultCategory));
    setDifficulty(String(defaultDifficulty));
    setType(String(defaultType));
    reset();
  }, [
    defaultRounds,
    defaultGuessSeconds,
    defaultCategory,
    defaultDifficulty,
    defaultType,
    setupId,
    reset,
  ]);

  const parsedRounds = parseSetupNumber(rounds, minRounds, maxRounds);
  const parsedGuessSeconds = parseSetupNumber(
    guessSeconds,
    minGuessSeconds,
    maxGuessSeconds
  );
  const categoryOptions = [
    { value: 'any', label: 'Any category' },
    ...categories.map((entry) => ({
      value: String(entry.id),
      label: entry.name,
    })),
  ];
  const difficultySelectOptions = difficultyOptions.map((entry) => ({
    value: entry.id,
    label: entry.name,
  }));
  const typeSelectOptions = typeOptions.map((entry) => ({
    value: entry.id,
    label: entry.name,
  }));
  const canSubmit = Boolean(parsedRounds && parsedGuessSeconds) && !isLocked;
  const setupSummary = buildSetupSummary({
    rounds: parsedRounds,
    guessSeconds: parsedGuessSeconds,
    roundLabel: 'question',
    timerLabel: 'answer',
  });

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    run(onStart, {
      maxRounds: parsedRounds,
      category,
      difficulty,
      type,
      guessSeconds: parsedGuessSeconds,
    });
  };

  return (
    <Screen>
      <div className="title">Trivia setup</div>
      <div className="subtitle">Choose your topic, difficulty, and question count.</div>
      {errorMessage ? <div className="error-text">{errorMessage}</div> : null}
      <SetupSummary text={setupSummary} />
      <NumberField
        label="Number of Questions"
        value={rounds}
        min={minRounds}
        max={maxRounds}
        onChange={setRounds}
      />
      <NumberField
        label="Answer Time"
        value={guessSeconds}
        min={minGuessSeconds}
        max={maxGuessSeconds}
        unit="seconds"
        onChange={setGuessSeconds}
      />
      <SetupSelect
        label="Category"
        value={category}
        options={categoryOptions}
        onChange={setCategory}
      />
      <SetupSelect
        label="Difficulty"
        value={difficulty}
        options={difficultySelectOptions}
        onChange={setDifficulty}
      />
      <SetupSelect
        label="Question Type"
        value={type}
        options={typeSelectOptions}
        onChange={setType}
      />
      <input
        type="button"
        value="Start Trivia"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="button"
      />
    </Screen>
  );
};

export default TriviaSetupScreen;
