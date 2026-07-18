import React, { useEffect, useState } from 'react';
import Screen from '../components/Screen';
import NumberField from '../components/NumberField';
import useSingleSendAction from '../hooks/useSingleSendAction';
import {
  formatCurrency,
  isPartialCurrency,
  parseCurrencyCents,
} from '../utils/colours';
import { parseSetupNumber } from '../utils/setupNumber';

const ColoursSetupScreen = ({ config, onStart, players = [] }) => {
  const defaultCash = config?.startingCashDefault ?? '100.00';
  const connectedPlayerCount = Math.max(
    2,
    players.filter((player) => player?.username && player?.isConnected).length
  );
  const minCash = (
    Math.max(100, 5 * (connectedPlayerCount - 1)) / 100
  ).toFixed(2);
  const maxCash = config?.startingCashMax ?? '10000.00';
  const defaultBetSeconds = config?.betSecondsDefault ?? 30;
  const minBetSeconds = config?.betSecondsMin ?? 5;
  const maxBetSeconds = config?.betSecondsMax ?? 120;
  const [startingCash, setStartingCash] = useState(defaultCash);
  const [betSeconds, setBetSeconds] = useState(String(defaultBetSeconds));
  const { isLocked, reset, run } = useSingleSendAction();

  useEffect(() => {
    setStartingCash(defaultCash);
    setBetSeconds(String(defaultBetSeconds));
    reset();
  }, [defaultCash, defaultBetSeconds, reset]);

  const cents = parseCurrencyCents(startingCash);
  const minCents = parseCurrencyCents(minCash) ?? 100;
  const maxCents = parseCurrencyCents(maxCash) ?? 1000000;
  const formattedMinCash = formatCurrency(minCents);
  const formattedMaxCash = formatCurrency(maxCents);
  const isValid = cents !== null && cents >= minCents && cents <= maxCents;
  const parsedBetSeconds = parseSetupNumber(
    betSeconds,
    minBetSeconds,
    maxBetSeconds
  );

  const handleChange = (event) => {
    if (isPartialCurrency(event.target.value)) setStartingCash(event.target.value);
  };

  return (
    <Screen>
      <div className="title">Colours setup</div>
      <div className="subtitle">
        Give all {connectedPlayerCount} players the same starting balance. The initial banker is random.
      </div>
      {config?.error ? <div className="error-text">{config.error}</div> : null}
      <div className="setup-summary">
        Six colours · {parsedBetSeconds || '—'}-second bets · 6× gross payout
      </div>
      <label className="muted-label" htmlFor="colours-starting-cash">
        Starting cash per player ({formattedMinCash}–{formattedMaxCash}; based on {connectedPlayerCount} players)
      </label>
      <div className="currency-input-wrap">
        <span aria-hidden="true">$</span>
        <input
          id="colours-starting-cash"
          type="text"
          inputMode="decimal"
          value={startingCash}
          onChange={handleChange}
          className="short-input currency-input"
        />
      </div>
      {!isValid && startingCash ? (
        <div className="field-help">
          Enter an amount from {formattedMinCash} to {formattedMaxCash}.
        </div>
      ) : null}
      <NumberField
        label="Betting Time"
        value={betSeconds}
        min={minBetSeconds}
        max={maxBetSeconds}
        unit="seconds"
        onChange={setBetSeconds}
      />
      <input
        type="button"
        value="Start Colours"
        onClick={() =>
          run(onStart, { startingCash, betSeconds: parsedBetSeconds })
        }
        disabled={!isValid || !parsedBetSeconds || isLocked}
        className="button"
      />
    </Screen>
  );
};

export default ColoursSetupScreen;
