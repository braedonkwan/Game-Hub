import { isPartialSetupNumber, parseSetupNumber } from './setupNumber';

describe('setup number helpers', () => {
  test('allows empty or positive partial numeric input', () => {
    expect(isPartialSetupNumber('')).toBe(true);
    expect(isPartialSetupNumber('7')).toBe(true);
    expect(isPartialSetupNumber('120')).toBe(true);
  });

  test('rejects zero, excessive length, and non-numeric input', () => {
    expect(isPartialSetupNumber('0')).toBe(false);
    expect(isPartialSetupNumber('1000')).toBe(false);
    expect(isPartialSetupNumber('1a')).toBe(false);
  });

  test('parses only whole numbers inside bounds', () => {
    expect(parseSetupNumber('5', 1, 10)).toBe(5);
    expect(parseSetupNumber('0', 1, 10)).toBeNull();
    expect(parseSetupNumber('11', 1, 10)).toBeNull();
    expect(parseSetupNumber('')).toBeNull();
  });
});
