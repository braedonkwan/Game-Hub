import React, { useEffect, useState } from 'react';
import { buildRoundTimer } from '../utils/roundStatus';

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

  useEffect(() => {
    const received = Date.now();
    setReceivedAt(received);
    setNow(received);
  }, [startedAt, deadlineAt, serverSentAt]);

  useEffect(() => {
    if (!hasTimer) return undefined;
    const intervalId = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(intervalId);
  }, [hasTimer]);

  if (!hasRound && !hasTimer) {
    return null;
  }

  const timer = buildRoundTimer({
    answerDeadlineAt: deadlineAt,
    maxScore,
    now,
    receivedAt,
    roundStartedAt: startedAt,
    serverSentAt,
  });

  return (
    <div className="round-status" aria-live="polite">
      {hasRound ? (
        <span>
          Round <strong>{round}</strong> of <strong>{total}</strong>
        </span>
      ) : null}
      {timer ? (
        <>
          <span
            className={`round-status-meter round-status-meter--${timer.urgencyLevel}`}
          >
            {timer.progressPercent !== null ? (
              <span
                className="round-status-meter-fill"
                style={{ width: `${timer.progressPercent}%` }}
              />
            ) : null}
            <strong>{timer.label}</strong>
          </span>
          <span>
            <strong>{timer.score}</strong> pts available
          </span>
        </>
      ) : null}
    </div>
  );
};

export default RoundStatus;
