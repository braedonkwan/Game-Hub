const OPTION_KEYS = ['A', 'B', 'C', 'D'];

export const getOptionLabel = (index) => OPTION_KEYS[index] || String(index + 1);

export const getOptionShortcutKeys = (index) =>
  [OPTION_KEYS[index]?.toLowerCase(), String(index + 1)].filter(Boolean);

export const findAnswerOptionByKey = (items, key) => {
  const normalizedKey = String(key || '').toLowerCase();
  return (
    (Array.isArray(items) ? items : []).find((item) =>
      item.shortcutKeys?.includes(normalizedKey)
    ) || null
  );
};

export const shuffleAnswerOptions = (items, random = Math.random) => {
  const shuffled = [...(Array.isArray(items) ? items : [])];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const hashString = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const getDefaultStableKey = (item, index) => {
  if (item == null) return String(index);
  if (typeof item === 'string') return item;
  if (typeof item === 'number' || typeof item === 'boolean') return String(item);
  return JSON.stringify(item);
};

export const orderAnswerOptions = (
  items,
  { random, seed = '', getStableKey = getDefaultStableKey } = {}
) => {
  const source = Array.isArray(items) ? items : [];
  if (typeof random === 'function') {
    return shuffleAnswerOptions(source, random);
  }

  return source
    .map((item, index) => ({
      item,
      index,
      rank: hashString(`${seed}:${getStableKey(item, index)}`),
    }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map(({ item }) => item);
};
