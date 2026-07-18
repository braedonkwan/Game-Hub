import React from 'react';
import { formatCurrency } from '../utils/colours';

const ColoursScoreboardTable = ({ rows }) => (
  <div className="scoreboard-table-wrap" role="region" aria-label="Colours balances" tabIndex="0">
    <table className="scoreboard-table colours-scoreboard-table">
      <thead>
        <tr>
          <th>Player</th>
          <th>Change</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((entry) => (
          <tr
            key={entry.username}
            className={`scoreboard-row${entry.isCurrentPlayer ? ' scoreboard-row--current' : ''}`}
          >
            <td>
              <div className="scoreboard-player">
                <span className="scoreboard-rank">{entry.rank}</span>
                <span className="scoreboard-name">{entry.username}</span>
                {entry.isCurrentPlayer ? <span className="scoreboard-you">You</span> : null}
                {entry.isBanker ? <span className="scoreboard-streak">Banker</span> : null}
                {entry.eliminated ? <span className="scoreboard-outcome scoreboard-outcome--incorrect">Eliminated</span> : null}
              </div>
            </td>
            <td>
              <span className={`scoreboard-delta${entry.deltaCents ? ' scoreboard-delta--points' : ''}`}>
                {formatCurrency(entry.deltaCents, { signed: true })}
              </span>
            </td>
            <td className="scoreboard-score">{formatCurrency(entry.balanceCents)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ColoursScoreboardTable;
