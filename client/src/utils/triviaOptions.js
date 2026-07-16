import {
  findAnswerOptionByKey,
  getOptionLabel,
  getOptionShortcutKeys,
} from './answerOptions';

export const buildTriviaOptions = (options) =>
  (Array.isArray(options) ? options : []).map((title, index) => ({
    title,
    label: getOptionLabel(index),
    shortcutKeys: getOptionShortcutKeys(index),
  }));

export const findTriviaOptionByKey = findAnswerOptionByKey;
