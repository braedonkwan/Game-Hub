import {
  findAnswerOptionByKey,
  getOptionLabel,
  getOptionShortcutKeys,
  orderAnswerOptions,
} from './answerOptions';

const hasSelectionLabel = (selection) => selection?.name && selection?.artists;

const getSelectionKey = (selection, index) =>
  `${selection?.name || ''}-${selection?.artists || ''}-${index}`;

const getSelectionStableKey = (selection) =>
  `${selection?.name || ''}::${selection?.artists || ''}`;

const getSelectionSeed = (selections) =>
  [
    selections?.gameId,
    selections?.round,
    selections?.roundStartedAt,
    selections?.answerDeadlineAt,
  ]
    .filter((value) => value !== undefined && value !== null && value !== '')
    .join(':');

export const buildSelectionOptions = (
  selections,
  { random } = {}
) =>
  orderAnswerOptions(Object.values(selections || {}).filter(hasSelectionLabel), {
    random,
    seed: getSelectionSeed(selections),
    getStableKey: getSelectionStableKey,
  }).map((selection, index) => ({
    key: getSelectionKey(selection, index),
    label: getOptionLabel(index),
    shortcutKeys: getOptionShortcutKeys(index),
    title: selection.name,
    description: selection.artists,
    selection,
  }));

export const findSelectionOptionByKey = findAnswerOptionByKey;
