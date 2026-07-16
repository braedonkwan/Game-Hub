import React from 'react';

const SetupSummary = ({ text }) => {
  if (!text) {
    return null;
  }

  return <div className="setup-summary">{text}</div>;
};

export default SetupSummary;
