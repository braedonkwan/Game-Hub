import {
  findAnswerOptionByKey,
  getOptionLabel,
  getOptionShortcutKeys,
} from './answerOptions';

export const buildGameOptions = (games) =>
  (Array.isArray(games) ? games : []).map((game, index) => {
    const label = getOptionLabel(index);
    return {
      ...game,
      label,
      eyebrow: game.tag ? `${label} - ${game.tag}` : label,
      isAvailable: game.available !== false,
      shortcutKeys: getOptionShortcutKeys(index),
    };
  });

export const findGameOptionByKey = (items, key) =>
  findAnswerOptionByKey(
    (Array.isArray(items) ? items : []).filter((item) => item.isAvailable),
    key
  );

export const getGameAvailabilitySummary = (games) => {
  const options = buildGameOptions(games);
  if (!options.length) {
    return '';
  }
  const availableCount = options.filter((game) => game.isAvailable).length;
  const unavailableCount = options.length - availableCount;
  const availableLabel =
    availableCount === 1 ? '1 game ready' : `${availableCount} games ready`;
  return unavailableCount
    ? `${availableLabel}, ${unavailableCount} unavailable`
    : availableLabel;
};
