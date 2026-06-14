export const calculateRoundScore = (elapsedMs, maxScore = 1000) =>
  Math.max(0, maxScore - Math.round(Math.sqrt(Math.max(0, elapsedMs))));

export const formatElapsedSeconds = (elapsedMs) =>
  (Math.max(0, elapsedMs) / 1000).toFixed(1);
