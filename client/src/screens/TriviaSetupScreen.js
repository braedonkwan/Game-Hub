import React, { useEffect, useState } from 'react';
import NumberField from '../components/NumberField';
import Screen from '../components/Screen';
import { parseSetupNumber } from '../utils/setupNumber';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRounds(String(defaultRounds));
    setGuessSeconds(String(defaultGuessSeconds));
    setCategory(String(defaultCategory));
    setDifficulty(String(defaultDifficulty));
    setType(String(defaultType));
    setIsSubmitting(false);
  }, [
    defaultRounds,
    defaultGuessSeconds,
    defaultCategory,
    defaultDifficulty,
    defaultType,
    setupId,
  ]);

  const parsedRounds = parseSetupNumber(rounds, minRounds, maxRounds);
  const parsedGuessSeconds = parseSetupNumber(
    guessSeconds,
    minGuessSeconds,
    maxGuessSeconds
  );
  const canSubmit = Boolean(parsedRounds && parsedGuessSeconds) && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    const sent = onStart({
      maxRounds: parsedRounds,
      category,
      difficulty,
      type,
      guessSeconds: parsedGuessSeconds,
    });
    if (sent) {
      setIsSubmitting(true);
    }
  };

  return (
    <Screen>
      <div className="title">Trivia setup</div>
      <div className="subtitle">Choose your topic, difficulty, and question count.</div>
      {errorMessage ? <div className="error-text">{errorMessage}</div> : null}
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
      <label className="muted-label">Category</label>
      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        className="long-input"
      >
        <option value="any">Any category</option>
        {categories.map((entry) => (
          <option key={entry.id} value={String(entry.id)}>
            {entry.name}
          </option>
        ))}
      </select>
      <label className="muted-label">Difficulty</label>
      <select
        value={difficulty}
        onChange={(event) => setDifficulty(event.target.value)}
        className="long-input"
      >
        {difficultyOptions.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.name}
          </option>
        ))}
      </select>
      <label className="muted-label">Question Type</label>
      <select
        value={type}
        onChange={(event) => setType(event.target.value)}
        className="long-input"
      >
        {typeOptions.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.name}
          </option>
        ))}
      </select>
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
