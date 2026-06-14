import React from 'react';

const statusCopy = {
  connecting: 'Connecting to the room...',
  reconnecting: 'Connection lost. Reconnecting...',
  offline: 'No room connection available.',
  error: 'Connection issue. Retrying...',
};

const ConnectionBanner = ({ status, reconnectDelayMs, onReconnect }) => {
  if (!status || status === 'connected') {
    return null;
  }

  const seconds = reconnectDelayMs ? Math.ceil(reconnectDelayMs / 1000) : 0;
  const detail =
    status === 'reconnecting' && seconds
      ? `Next attempt in ${seconds}s`
      : 'Keep this tab open.';

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
