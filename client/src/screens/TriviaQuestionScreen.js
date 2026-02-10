import React, { useEffect, useMemo, useState } from 'react';
import Screen from '../components/Screen';

const TriviaQuestionScreen = ({ question, options, round, total, onAnswer }) => {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const safeOptions = Array.isArray(options) ? options : [];
  const title = useMemo(
    () => (round && total ? `Question ${round} of ${total}` : 'Trivia'),
    [round, total]
  );

  useEffect(() => {
    setHasSubmitted(false);
  }, [question]);

  const handleClick = (answer) => {
    if (hasSubmitted) return;
    setHasSubmitted(true);
    onAnswer(answer);
  };

  return (
    <Screen containerClassName="fade-in" contentClassName="">
      <div className="title">{title}</div>
      <div className="text-container">{question}</div>
      <div className="grid">
        {safeOptions.map((option, index) => (
          <button
            key={`${option}-${index}`}
            type="button"
            className="selection-box"
            onClick={() => handleClick(option)}
            disabled={hasSubmitted}
          >
            <div className="selection">
              <strong>{option}</strong>
            </div>
          </button>
        ))}
      </div>
    </Screen>
  );
};

export default TriviaQuestionScreen;
