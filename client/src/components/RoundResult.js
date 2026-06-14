import React from 'react';

const RoundResult = ({ result }) => {
  if (!result?.answer) {
    return null;
  }

  return (
    <div className="round-result">
      <span className="round-result-label">Correct answer</span>
      <strong>{result.answer}</strong>
      {result.detail ? <span>{result.detail}</span> : null}
    </div>
  );
};

export default RoundResult;
