export const pluralize = (count, singular, plural = `${singular}s`) =>
  count === 1 ? singular : plural;

export const buildSetupSummary = ({
  rounds,
  guessSeconds,
  roundLabel = 'round',
  timerLabel = 'guess',
} = {}) => {
  if (!rounds || !guessSeconds) {
    return 'Fix setup values to start.';
  }

  return `${rounds} ${pluralize(rounds, roundLabel)}, ${guessSeconds}s per ${timerLabel}`;
};
