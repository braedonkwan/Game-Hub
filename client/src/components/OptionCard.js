import React from 'react';

const OptionCard = ({
  title,
  description,
  eyebrow,
  meta,
  highlights,
  status,
  selected = false,
  submitted = false,
  disabled = false,
  onClick,
}) => (
  <button
    type="button"
    className={`selection-box${selected ? ' selection-box--selected' : ''}${
      submitted ? ' selection-box--submitted' : ''
    }`}
    onClick={onClick}
    disabled={disabled}
    aria-pressed={selected}
  >
    {eyebrow ? <span className="selection-eyebrow">{eyebrow}</span> : null}
    <span className="selection">
      <strong>{title}</strong>
    </span>
    {description ? (
      <span className="selection selection-description">{description}</span>
    ) : null}
    {meta ? (
      <span className="selection-meta">
        {Object.entries(meta).map(([key, value]) => (
          <span key={key} className="selection-pill">
            {value}
          </span>
        ))}
      </span>
    ) : null}
    {Array.isArray(highlights) && highlights.length ? (
      <span className="selection-highlights">
        {highlights.slice(0, 2).join(' | ')}
      </span>
    ) : null}
    {status ? <span className="selection-status">{status}</span> : null}
  </button>
);

export default OptionCard;
