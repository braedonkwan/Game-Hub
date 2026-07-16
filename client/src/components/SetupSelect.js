import React from 'react';

const SetupSelect = ({
  label,
  id,
  value,
  options,
  onChange,
  disabled = false,
}) => {
  const selectId =
    id ||
    `setup-select-${String(label || 'field')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <>
      <label className="muted-label" htmlFor={selectId}>
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="long-input"
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  );
};

export default SetupSelect;
