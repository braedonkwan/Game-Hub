import {
  buildColoursScoreRows,
  formatCurrency,
  getBetTotalCents,
  isPartialCurrency,
  parseCurrencyCents,
} from './colours';

describe('Colours helpers', () => {
  test('parses and formats exact currency values', () => {
    expect(parseCurrencyCents('12.34')).toBe(1234);
    expect(parseCurrencyCents('12.3')).toBe(1230);
    expect(parseCurrencyCents('12.345')).toBeNull();
    expect(isPartialCurrency('100.2')).toBe(true);
    expect(isPartialCurrency('-1')).toBe(false);
    expect(formatCurrency(1234)).toBe('$12.34');
    expect(formatCurrency(123456)).toBe('$1,234.56');
    expect(formatCurrency(-50, { signed: true })).toBe('-$0.50');
    expect(formatCurrency(50, { signed: true })).toBe('+$0.50');
  });

  test('totals bets and builds balance rankings', () => {
    expect(getBetTotalCents({ red: '1.25', blue: '2.00' }, ['red', 'blue'])).toBe(325);
    expect(
      buildColoursScoreRows(
        {
          ada: { username: 'Ada', balanceCents: 500, deltaCents: -100 },
          bea: { username: 'Bea', balanceCents: 900, deltaCents: 100 },
        },
        'Ada'
      ).map(({ username, rank, isCurrentPlayer }) => ({ username, rank, isCurrentPlayer }))
    ).toEqual([
      { username: 'Bea', rank: 1, isCurrentPlayer: false },
      { username: 'Ada', rank: 2, isCurrentPlayer: true },
    ]);
  });
});
