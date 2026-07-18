import React, { useMemo } from 'react';
import ColoursScoreboardTable from '../components/ColoursScoreboardTable';
import Fireworks from '../components/Fireworks';
import Screen from '../components/Screen';
import { buildColoursScoreRows, formatCurrency } from '../utils/colours';

const ColoursWinnerScreen = ({ payload, currentUsername }) => {
  const rows = useMemo(
    () => buildColoursScoreRows(payload?.scores, currentUsername),
    [payload?.scores, currentUsername]
  );
  const winner = rows.find((entry) => !entry.eliminated);

  return (
    <>
      {winner ? <Fireworks /> : null}
      <Screen containerClassName="winner-screen">
        <div className="text-container">
          {winner
            ? `${winner.username} wins Colours with ${formatCurrency(winner.balanceCents)}!`
            : 'Colours game over'}
        </div>
        <div className="scoreboard winner-board">
          <div className="title">Final balances</div>
          <ColoursScoreboardTable rows={rows} />
        </div>
      </Screen>
    </>
  );
};

export default ColoursWinnerScreen;
