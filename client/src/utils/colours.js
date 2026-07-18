export const COLOUR_LABELS = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  purple: 'Purple',
};

export const isPartialCurrency = (value) => /^\d{0,5}(?:\.\d{0,2})?$/.test(value);

export const parseCurrencyCents = (value) => {
  const text = String(value ?? '').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : null;
};

export const formatCurrency = (cents, { signed = false } = {}) => {
  const safeCents = Number.isFinite(cents) ? Math.trunc(cents) : 0;
  const sign = safeCents < 0 ? '-' : signed && safeCents > 0 ? '+' : '';
  const amount = (Math.abs(safeCents) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${amount}`;
};

export const getBetTotalCents = (bets, colours) =>
  (Array.isArray(colours) ? colours : []).reduce((total, colour) => {
    const cents = parseCurrencyCents(bets?.[colour] || '0');
    return cents === null ? Number.NaN : total + cents;
  }, 0);

export const buildColoursScoreRows = (scores, currentUsername = '') =>
  Object.values(scores || {})
    .sort((left, right) => {
      const balanceDelta = (right.balanceCents ?? right.score ?? 0) - (left.balanceCents ?? left.score ?? 0);
      return balanceDelta || String(left.username || '').localeCompare(String(right.username || ''));
    })
    .map((entry, index) => ({
      ...entry,
      balanceCents: entry.balanceCents ?? entry.score ?? 0,
      deltaCents: entry.deltaCents ?? 0,
      isCurrentPlayer:
        Boolean(currentUsername) &&
        String(entry.username || '').toLowerCase() === currentUsername.toLowerCase(),
      rank: index + 1,
    }));
