import React, { useEffect, useState } from 'react';
import Screen from '../components/Screen';

const TriviaSetupScreen = ({ config, onStart }) => {
  const defaultRounds = config?.maxRoundsDefault ?? 5;
  const maxRounds = config?.maxRoundsMax ?? 20;
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
  const defaultCategory = config?.defaultCategory ?? 'any';
  const defaultDifficulty = config?.defaultDifficulty ?? 'any';
  const setupId = config?.setupId ?? 0;
  const errorMessage = config?.error;
  const [rounds, setRounds] = useState(String(defaultRounds));
  const [category, setCategory] = useState(String(defaultCategory));
  const [difficulty, setDifficulty] = useState(String(defaultDifficulty));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRounds(String(defaultRounds));
    setCategory(String(defaultCategory));
    setDifficulty(String(defaultDifficulty));
    setIsSubmitting(false);
  }, [defaultRounds, defaultCategory, defaultDifficulty, setupId]);

  const handleRoundsChange = (event) => {
    const value = event.target.value;
    if (/^([1-9][0-9]{0,2})?$/.test(value)) {
      setRounds(value);
    }
  };

  const handleSubmit = () => {
    const max = parseInt(rounds, 10);
    if (!max || max < 1 || max > maxRounds) return;
    const sent = onStart({ maxRounds: max, category, difficulty });
    if (sent) {
      setIsSubmitting(true);
    }
  };

  return (
    <Screen>
      <div className="title">Trivia setup</div>
      <div className="subtitle">Choose your topic, difficulty, and question count.</div>
      {errorMessage ? <div className="error-text">{errorMessage}</div> : null}
      <label className="muted-label">Number of Questions (1-{maxRounds})</label>
      <input
        type="text"
        value={rounds}
        onChange={handleRoundsChange}
        className="short-input"
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
      <input
        type="button"
        value="Start Trivia"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="button"
      />
    </Screen>
  );
};

export default TriviaSetupScreen;
