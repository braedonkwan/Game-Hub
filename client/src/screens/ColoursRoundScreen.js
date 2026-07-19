import React, { useEffect, useMemo, useRef, useState } from 'react';
import Screen from '../components/Screen';
import {
  COLOUR_LABELS,
  formatCurrency,
  getBetTotalCents,
  isPartialCurrency,
  parseCurrencyCents,
} from '../utils/colours';

const createEmptyBets = (colours) =>
  Object.fromEntries((colours || []).map((colour) => [colour, '0.00']));

const roleMessage = {
  banker: 'You are the banker. Watch the table while the other players bet.',
  eliminated: 'You have been eliminated, but you can keep watching the game.',
  spectator: 'This game is already underway. You are watching as a spectator.',
  submitted: 'Your bet is locked in. Waiting for the rest of the table.',
  waiting_for_banker: 'All bets are locked in. Waiting for the banker to choose a colour.',
};

const ColoursRoundScreen = ({ data, onBet, onChooseColour }) => {
  const colours = useMemo(
    () => (Array.isArray(data?.colours) ? data.colours : []),
    [data?.colours]
  );
  const [bets, setBets] = useState(() => createEmptyBets(colours));
  const [sent, setSent] = useState(false);
  const [now, setNow] = useState(Date.now());
  const receivedAtRef = useRef(Date.now());

  useEffect(() => {
    setBets(createEmptyBets(colours));
    setSent(false);
    receivedAtRef.current = Date.now();
    setNow(Date.now());
  }, [data?.round, data?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (data?.error) setSent(false);
  }, [data?.error]);

  useEffect(() => {
    if (!data?.betDeadlineAt) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [data?.betDeadlineAt]);

  const totalCents = useMemo(
    () => getBetTotalCents(bets, colours),
    [bets, colours]
  );
  const amountsValid = colours.every((colour) => {
    const cents = parseCurrencyCents(bets[colour]);
    return cents !== null && cents <= (data?.perColourMaxCents ?? 0);
  });
  const totalValid =
    Number.isFinite(totalCents) && totalCents <= (data?.totalMaxCents ?? 0);
  const canSubmit = data?.canBet && amountsValid && totalValid && !sent;
  const initialRemaining = Math.max(
    0,
    (data?.betDeadlineAt ?? 0) - (data?.serverSentAt ?? data?.betDeadlineAt ?? 0)
  );
  const remainingMs = Math.max(0, initialRemaining - (now - receivedAtRef.current));
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  const updateBet = (colour, value) => {
    if (isPartialCurrency(value)) {
      setBets((current) => ({ ...current, [colour]: value }));
    }
  };

  const submit = (nextBets) => {
    if (sent) return;
    const normalized = Object.fromEntries(
      colours.map((colour) => [colour, nextBets[colour] || '0.00'])
    );
    if (onBet(normalized)) setSent(true);
  };

  const chooseColour = (colour) => {
    if (sent || typeof onChooseColour !== 'function') return;
    if (onChooseColour(colour)) setSent(true);
  };

  return (
    <Screen containerClassName="colours-container">
      <div className="colours-round-header">
        <div>
          <div className="title">Colours</div>
          <div className="subtitle">Round {data?.round} · Banker: {data?.banker?.username}</div>
        </div>
        {data?.betDeadlineAt ? (
          <div className={`colours-timer${remainingSeconds <= 5 ? ' colours-timer--urgent' : ''}`}>
            {remainingSeconds}s
          </div>
        ) : null}
      </div>

      <div className="colours-balance-strip">
        {data?.balanceCents !== null ? (
          <span>Your balance: <strong>{formatCurrency(data?.balanceCents)}</strong></span>
        ) : null}
        <span>
          Bets submitted: <strong>{data?.submittedCount ?? 0}/{data?.eligibleCount ?? 0}</strong>
        </span>
      </div>

      {data?.error ? <div className="error-text">{data.error}</div> : null}

      {data?.canChooseColour ? (
        <>
          <div className="subtitle">
            All bets are locked in. Choose the winning colour.
          </div>
          <div className="colour-choice-grid">
            {colours.map((colour) => (
              <button
                key={colour}
                type="button"
                className={`colour-choice-button colour-bet--${colour}`}
                disabled={sent}
                onClick={() => chooseColour(colour)}
              >
                <span className="colour-swatch" aria-hidden="true" />
                <strong>{COLOUR_LABELS[colour] || colour}</strong>
              </button>
            ))}
          </div>
          {sent ? <div className="setup-summary">Colour selected</div> : null}
        </>
      ) : data?.canBet ? (
        <>
          <div className="subtitle">
            Up to {formatCurrency(data.perColourMaxCents)} per colour and{' '}
            {formatCurrency(data.totalMaxCents)} total.
          </div>
          <div className="colour-bet-grid">
            {colours.map((colour) => (
              <label key={colour} className={`colour-bet colour-bet--${colour}`}>
                <span className="colour-swatch" aria-hidden="true" />
                <strong>{COLOUR_LABELS[colour] || colour}</strong>
                <span className="currency-input-wrap colour-bet-input">
                  <span aria-hidden="true">$</span>
                  <input
                    aria-label={`${COLOUR_LABELS[colour] || colour} bet`}
                    type="text"
                    inputMode="decimal"
                    value={bets[colour] ?? '0.00'}
                    onChange={(event) => updateBet(colour, event.target.value)}
                    disabled={sent}
                  />
                </span>
              </label>
            ))}
          </div>
          <div className={`bet-total${totalValid ? '' : ' bet-total--invalid'}`}>
            Total bet: <strong>{formatCurrency(Number.isFinite(totalCents) ? totalCents : 0)}</strong>
            {' / '}{formatCurrency(data.totalMaxCents)}
          </div>
          <div className="colour-actions">
            <button type="button" className="button" disabled={!canSubmit} onClick={() => submit(bets)}>
              {sent ? 'Bet submitted' : 'Submit bet'}
            </button>
            <button
              type="button"
              className="button button-small"
              disabled={sent}
              onClick={() => submit(createEmptyBets(colours))}
            >
              Pass ($0)
            </button>
          </div>
        </>
      ) : (
        <div className="colours-watch-card">
          <div className="colour-wheel" aria-hidden="true" />
          <div>{roleMessage[data?.role] || 'Waiting for the colour draw.'}</div>
          <strong>{data?.submittedCount ?? 0} of {data?.eligibleCount ?? 0} bets submitted</strong>
        </div>
      )}
    </Screen>
  );
};

export default ColoursRoundScreen;
