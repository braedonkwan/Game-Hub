import { calculateRoundScore, formatElapsedSeconds } from './scoring';

const WARNING_REMAINING_MS = 5000;

export const buildRoundTimer = ({
  answerDeadlineAt,
  maxScore,
  now,
  receivedAt,
  roundStartedAt,
  serverSentAt,
}) => {
  const hasTimer =
    Number.isFinite(roundStartedAt) &&
    Number.isFinite(serverSentAt) &&
    Number.isFinite(maxScore);

  if (!hasTimer) {
    return null;
  }

  const elapsedMs = Math.max(0, serverSentAt - roundStartedAt) + (now - receivedAt);
  const score = calculateRoundScore(elapsedMs, maxScore);
  const hasDeadline =
    Number.isFinite(answerDeadlineAt) && answerDeadlineAt > roundStartedAt;

  if (!hasDeadline) {
    return {
      label: `${formatElapsedSeconds(elapsedMs)}s elapsed`,
      progressPercent: null,
      score,
      urgencyLevel: 'elapsed',
    };
  }

  const totalMs = Math.max(1, answerDeadlineAt - roundStartedAt);
  const remainingMs = Math.max(0, answerDeadlineAt - serverSentAt - (now - receivedAt));
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const urgencyLevel =
    remainingMs <= 0
      ? 'expired'
      : remainingMs <= WARNING_REMAINING_MS
        ? 'warning'
        : 'normal';

  return {
    label: remainingSeconds > 0 ? `${remainingSeconds}s left` : "Time's up",
    progressPercent: Math.max(0, Math.min(100, (remainingMs / totalMs) * 100)),
    score,
    urgencyLevel,
  };
};
