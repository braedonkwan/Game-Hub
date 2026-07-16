import { fireEvent, render, screen } from '@testing-library/react';
import useOptionShortcuts from './useOptionShortcuts';

const items = [{ label: 'A', shortcutKeys: ['a', '1'] }];

const findOptionByKey = (list, key) =>
  list.find((item) => item.shortcutKeys.includes(String(key).toLowerCase())) ||
  null;

const Harness = ({ disabled = false, onSelect = jest.fn() }) => {
  useOptionShortcuts({
    disabled,
    findOptionByKey,
    items,
    onSelect,
  });

  return (
    <>
      <input aria-label="Name" />
      <div>Shortcut harness</div>
    </>
  );
};

describe('useOptionShortcuts', () => {
  test('selects a matching option and prevents default', () => {
    const onSelect = jest.fn();

    render(<Harness onSelect={onSelect} />);

    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'A',
    });
    const prevented = !window.dispatchEvent(event);

    expect(prevented).toBe(true);
    expect(onSelect).toHaveBeenCalledWith(items[0]);
  });

  test('ignores repeated keys, disabled state, and focused form controls', () => {
    const onSelect = jest.fn();
    const { rerender } = render(<Harness onSelect={onSelect} />);

    fireEvent.keyDown(window, { key: 'A', repeat: true });
    expect(onSelect).not.toHaveBeenCalled();

    screen.getByLabelText('Name').focus();
    fireEvent.keyDown(window, { key: 'A' });
    expect(onSelect).not.toHaveBeenCalled();

    screen.getByLabelText('Name').blur();
    rerender(<Harness disabled onSelect={onSelect} />);
    fireEvent.keyDown(window, { key: 'A' });

    expect(onSelect).not.toHaveBeenCalled();
  });

  test('ignores non-matching keys', () => {
    const onSelect = jest.fn();

    render(<Harness onSelect={onSelect} />);

    fireEvent.keyDown(window, { key: 'x' });

    expect(onSelect).not.toHaveBeenCalled();
  });
});
