import React from 'react';
import { isPartialSetupNumber } from '../utils/setupNumber';

const NumberField = ({ label, value, min, max, unit, onChange }) => {
  const suffix = unit ? ` ${unit}` : '';

  const handleChange = (event) => {
    const nextValue = event.target.value;
    if (isPartialSetupNumber(nextValue)) {
      onChange(nextValue);
    }
  };

  return (
    <>
      <label className="muted-label">
        {label} ({min}-{max}
        {suffix})
      </label>
      <input
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
