export const formatScoreDelta = (value) => {
  const delta = Number.isFinite(value) ? value : 0;
  return delta >= 0 ? `+${delta}` : `${delta}`;
};

export const getRoundOutcome = (outcome) => {
  if (!outcome || typeof outcome !== 'object') {
    return { label: '', tone: 'neutral' };
  }
  if (outcome.correct) {
    return { label: 'Correct', tone: 'correct' };
  }
  if (outcome.answered) {
    return { label: 'Incorrect', tone: 'incorrect' };
  }
  return { label: 'No answer', tone: 'neutral' };
};

export const formatStreak = (value) => {
  const streak = Number.isFinite(value) ? value : 0;
  return streak > 1 ? `${streak} streak` : '';
};

export const formatAnswerTime = (value) => {
  if (!Number.isFinite(value)) {
    return '';
  }
  const seconds = Math.max(0, value) / 1000;
  return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`;
};

const isCurrentUsername = (entry, currentUsername) =>
  Boolean(
    entry?.username &&
      currentUsername &&
      entry.username.toLowerCase() === currentUsername.toLowerCase()
  );

export const buildScoreRows = (scoreboard, currentUsername = '') => {
  const entries = Object.values(scoreboard || {}).sort((left, right) => {
    const scoreDelta = right.score - left.score;
    if (scoreDelta !== 0) return scoreDelta;
    return String(left.username || '').localeCompare(String(right.username || ''), undefined, {
      sensitivity: 'base',
    });
  });

  let lastScore = null;
  let lastRank = 0;
  const bestRoundDelta = entries.reduce((best, entry) => {
    const delta = Number.isFinite(entry.delta) ? entry.delta : 0;
    return Math.max(best, delta);
  }, 0);

  return entries.map((entry, index) => {
    const rank = entry.score === lastScore ? lastRank : index + 1;
    lastScore = entry.score;
    lastRank = rank;
    const delta = Number.isFinite(entry.delta) ? entry.delta : 0;
    const roundOutcome = getRoundOutcome(entry.roundOutcome);

    return {
      ...entry,
      delta,
      deltaLabel: formatScoreDelta(delta),
      isCurrentPlayer: isCurrentUsername(entry, currentUsername),
      isLeader: rank === 1,
      key: `${entry.username || 'player'}-${index}`,
      rank,
      roundOutcomeLabel: roundOutcome.label,
      roundOutcomeTone: roundOutcome.tone,
      answerTimeLabel: entry.roundOutcome?.answered
        ? formatAnswerTime(entry.roundOutcome.answerTimeMs)
        : '',
      roundBestLabel: delta > 0 && delta === bestRoundDelta ? 'Fastest' : '',
      streakLabel: formatStreak(entry.streak),
    };
  });
};

export const getWinners = (scoreboard) => {
  const rows = buildScoreRows(scoreboard);
  return rows.filter((row) => row.isLeader);
};

export const getWinnerSummary = (scoreboard) => {
  const winners = getWinners(scoreboard);
  if (!winners.length) {
    return {
      hasWinner: false,
      text: 'Game over',
      winners,
    };
  }

  const winnerScore = winners[0].score;
  const winnerNames = winners.map((entry) => entry.username).join(', ');
  return {
    hasWinner: true,
    text:
      winners.length === 1
        ? `The winner is ${winnerNames} with a score of ${winnerScore}`
        : `Tie game: ${winnerNames} with ${winnerScore} points`,
    winners,
  };
};
