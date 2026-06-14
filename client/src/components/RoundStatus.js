import React, { useEffect, useState } from 'react';
import { calculateRoundScore, formatElapsedSeconds } from '../utils/scoring';

const RoundStatus = ({
  round,
  total,
  startedAt,
  deadlineAt,
  serverSentAt,
  maxScore,
}) => {
  const [receivedAt, setReceivedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const hasRound = Number.isFinite(round) && Number.isFinite(total) && total > 0;
  const hasTimer =
    Number.isFinite(startedAt) &&
    Number.isFinite(serverSentAt) &&
    Number.isFinite(maxScore);
  const hasDeadline =
    hasTimer &&
    Number.isFinite(deadlineAt) &&
    deadlineAt > startedAt;

  useEffect(() => {
    const received = Date.now();
    setReceivedAt(received);
    setNow(received);
  }, [startedAt, deadlineAt, serverSentAt]);

  useEffect(() => {
    if (!hasTimer && !hasDeadline) return undefined;
    const intervalId = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(intervalId);
  }, [hasDeadline, hasTimer]);

  if (!hasRound && !hasTimer) {
    return null;
  }

  const elapsedMs = hasTimer
    ? Math.max(0, serverSentAt - startedAt) + (now - receivedAt)
    : 0;
  const score = hasTimer ? calculateRoundScore(elapsedMs, maxScore) : null;
  const remainingMs = hasDeadline
    ? Math.max(0, deadlineAt - serverSentAt - (now - receivedAt))
    : null;
  const remainingSeconds =
    remainingMs === null ? null : Math.ceil(remainingMs / 1000);

  return (
    <div className="round-status" aria-live="polite">
      {hasRound ? (
        <span>
          Round <strong>{round}</strong> of <strong>{total}</strong>
        </span>
      ) : null}
      {hasTimer ? (
        <>
          <span>
            {hasDeadline
              ? remainingSeconds > 0
                ? `${remainingSeconds}s left`
                : "Time's up"
              : `${formatElapsedSeconds(elapsedMs)}s`}
          </span>
          <span>
            <strong>{score}</strong> pts available
          </span>
        </>
      ) : null}
    </div>
  );
};

export default RoundStatus;
