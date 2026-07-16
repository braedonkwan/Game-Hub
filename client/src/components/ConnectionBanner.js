import React, { useEffect, useState } from 'react';
import {
  getConnectionActionLabel,
  getConnectionDetail,
  getConnectionTitle,
  getReconnectProgressPercent,
} from '../utils/connection';

const ConnectionBanner = ({ status, reconnectDelayMs, onReconnect }) => {
  const [remainingMs, setRemainingMs] = useState(reconnectDelayMs || 0);

  useEffect(() => {
    if (status !== 'reconnecting' || !reconnectDelayMs) {
      setRemainingMs(0);
      return undefined;
    }

    const startedAt = Date.now();
    setRemainingMs(reconnectDelayMs);
    const intervalId = window.setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      setRemainingMs(Math.max(0, reconnectDelayMs - elapsedMs));
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [reconnectDelayMs, status]);

  if (!status || status === 'connected') {
    return null;
  }

  const detail = getConnectionDetail(status, remainingMs);
  const actionLabel = getConnectionActionLabel(status);
  const reconnectProgress = getReconnectProgressPercent(
    reconnectDelayMs,
    remainingMs
  );

  return (
    <div
      className={`connection-banner connection-banner--${status}`}
      role="status"
      aria-live="polite"
    >
      <div>
        <strong>{getConnectionTitle(status)}</strong>
        <span>{detail}</span>
        {status === 'reconnecting' ? (
          <span
            className="connection-progress"
            role="progressbar"
            aria-label="Reconnect progress"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={reconnectProgress}
          >
            <span
              className="connection-progress-fill"
              style={{ width: `${reconnectProgress}%` }}
            />
          </span>
        ) : null}
      </div>
      <button type="button" className="button button-small" onClick={onReconnect}>
        {actionLabel}
      </button>
    </div>
  );
};

export default ConnectionBanner;
