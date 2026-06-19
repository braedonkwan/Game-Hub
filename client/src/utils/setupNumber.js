export const isPartialSetupNumber = (value) => /^([1-9][0-9]{0,2})?$/.test(value);

export const parseSetupNumber = (value, min, max) => {
  if (value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }
  return parsed;
};
