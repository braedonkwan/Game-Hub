import React from 'react';
import { isPartialSetupNumber } from '../utils/setupNumber';

const NumberField = ({ label, id, value, min, max, unit, onChange }) => {
  const suffix = unit ? ` ${unit}` : '';
  const inputId =
    id ||
    `number-field-${String(label || 'field')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}`;

  const handleChange = (event) => {
    const nextValue = event.target.value;
    if (isPartialSetupNumber(nextValue)) {
      onChange(nextValue);
    }
  };

  return (
    <>
      <label className="muted-label" htmlFor={inputId}>
        {label} ({min}-{max}
        {suffix})
      </label>
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        className="short-input"
      />
    </>
  );
};

export default NumberField;
