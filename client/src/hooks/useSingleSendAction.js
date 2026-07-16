import { useCallback, useRef, useState } from 'react';

const useSingleSendAction = () => {
  const lockedRef = useRef(false);
  const [isLocked, setIsLocked] = useState(false);

  const run = useCallback((action, ...args) => {
    if (lockedRef.current || typeof action !== 'function') {
      return false;
    }

    const sent = action(...args);
    if (sent) {
      lockedRef.current = true;
      setIsLocked(true);
    }
    return sent;
  }, []);

  const reset = useCallback(() => {
    lockedRef.current = false;
    setIsLocked(false);
  }, []);

  return { isLocked, run, reset };
};

export default useSingleSendAction;
