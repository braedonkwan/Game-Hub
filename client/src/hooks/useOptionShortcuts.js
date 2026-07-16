import { useEffect } from 'react';

const FORM_CONTROL_TAGS = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'];

const isFormControlFocused = () =>
  FORM_CONTROL_TAGS.includes(document.activeElement?.tagName);

const useOptionShortcuts = ({
  disabled = false,
  findOptionByKey,
  items,
  onSelect,
}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (disabled || event.repeat || isFormControlFocused()) return;
      const option = findOptionByKey?.(items, event.key);
      if (!option) return;
      event.preventDefault();
      onSelect(option);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, findOptionByKey, items, onSelect]);
};

export default useOptionShortcuts;
