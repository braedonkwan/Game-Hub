import React, { useEffect, useMemo, useState } from 'react';
import OptionCard from '../components/OptionCard';
import RoundStatus from '../components/RoundStatus';
import Screen from '../components/Screen';

const TriviaQuestionScreen = ({
  question,
  options,
  round,
  total,
  startedAt,
  deadlineAt,
  serverSentAt,
  maxScore,
  onAnswer,
}) => {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedAnswer, setSubmittedAnswer] = useState('');
  const safeOptions = Array.isArray(options) ? options : [];
  const title = useMemo(
    () => (round && total ? `Question ${round} of ${total}` : 'Trivia'),
    [round, total]
  );

  useEffect(() => {
    setHasSubmitted(false);
    setSubmittedAnswer('');
  }, [question]);

  const handleClick = (answer) => {
    if (hasSubmitted) return;
    const sent = onAnswer(answer);
    if (!sent) return;
    setHasSubmitted(true);
    setSubmittedAnswer(answer);
  };

  return (
    <Screen containerClassName="fade-in" contentClassName="answer-stage">
      <RoundStatus
        round={round}
        total={total}
        startedAt={startedAt}
        deadlineAt={deadlineAt}
        serverSentAt={serverSentAt}
        maxScore={maxScore}
      />
      <div className="title">{title}</div>
      <div className="text-container">{question}</div>
      <div className="grid">
        {safeOptions.map((option, index) => (
          <OptionCard
            key={`${option}-${index}`}
            title={option}
            submitted={submittedAnswer === option}
            onClick={() => handleClick(option)}
            disabled={hasSubmitted}
          />
        ))}
      </div>
    </Screen>
  );
};

export default TriviaQuestionScreen;
