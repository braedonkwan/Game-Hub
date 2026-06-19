export const formatScoreDelta = (value) => {
  const delta = Number.isFinite(value) ? value : 0;
  return delta >= 0 ? `+${delta}` : `${delta}`;
};

export const buildScoreRows = (scoreboard) => {
  const entries = Object.values(scoreboard || {}).sort((left, right) => {
    const scoreDelta = right.score - left.score;
    if (scoreDelta !== 0) return scoreDelta;
    return String(left.username || '').localeCompare(String(right.username || ''), undefined, {
      sensitivity: 'base',
    });
  });

  let lastScore = null;
  let lastRank = 0;

  return entries.map((entry, index) => {
    const rank = entry.score === lastScore ? lastRank : index + 1;
    lastScore = entry.score;
    lastRank = rank;
    const delta = Number.isFinite(entry.delta) ? entry.delta : 0;

    return {
      ...entry,
      delta,
      deltaLabel: formatScoreDelta(delta),
      isLeader: rank === 1,
      key: `${entry.username || 'player'}-${index}`,
      rank,
    };
  });
};

export const getWinners = (scoreboard) => {
  const rows = buildScoreRows(scoreboard);
  return rows.filter((row) => row.isLeader);
};
