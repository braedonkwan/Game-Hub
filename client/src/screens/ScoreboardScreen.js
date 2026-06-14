import React, { useMemo, useState } from 'react';
import RoundResult from '../components/RoundResult';
import Screen from '../components/Screen';

const formatDelta = (value) => {
  const delta = Number.isFinite(value) ? value : 0;
  return delta >= 0 ? `+${delta}` : `${delta}`;
};

const ScoreboardScreen = ({ scoreboard, round, total, roundResult, onReady }) => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const sortedScores = useMemo(
    () => Object.values(scoreboard || {}).sort((a, b) => b.score - a.score),
    [scoreboard]
  );
  const hasProgress = Number.isFinite(round) && Number.isFinite(total) && total > 0;

  const handleReady = () => {
    const sent = onReady();
    if (sent) {
      setIsButtonDisabled(true);
    }
  };

  return (
    <Screen>
      <div className="scoreboard">
        <div className="title slide-up">Scoreboard</div>
        <div className="subtitle">
          {hasProgress
            ? `Round ${round} of ${total}. Faster correct guesses earn more points.`
            : 'Faster correct guesses earn more points.'}
        </div>
        <RoundResult result={roundResult} />
        {sortedScores.length ? (
          <table className="scoreboard-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {sortedScores.map((entry, index) => (
                <tr
                  key={`${entry.username}-${index}`}
                  className={`scoreboard-row${
                    index === 0 ? ' scoreboard-row--leader' : ''
                  }`}
                >
                  <td>
                    <span className="scoreboard-rank">{index + 1}</span>
                    <span className="scoreboard-name">{entry.username}</span>
                    <span className="scoreboard-delta">
                      {formatDelta(entry.delta)}
                    </span>
                  </td>
                  <td className="scoreboard-score">{entry.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="hub-empty">No scores yet.</div>
        )}
      </div>
      <input
        type="button"
        value="Ready"
        onClick={handleReady}
        disabled={isButtonDisabled}
        className="button"
      />
    </Screen>
  );
};

export default ScoreboardScreen;
