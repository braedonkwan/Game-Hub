import React, { useEffect, useState } from 'react';
import { getConnectionDetail } from '../utils/connection';

const statusCopy = {
  connecting: 'Connecting to the room...',
  reconnecting: 'Connection lost. Reconnecting...',
  offline: 'No room connection available.',
  error: 'Connection issue. Retrying...',
};

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

  return (
    <div className="connection-banner" role="status" aria-live="polite">
      <div>
        <strong>{statusCopy[status] || statusCopy.error}</strong>
        <span>{detail}</span>
      </div>
      <button type="button" className="button button-small" onClick={onReconnect}>
        Retry now
      </button>
    </div>
  );
};

export default ConnectionBanner;
