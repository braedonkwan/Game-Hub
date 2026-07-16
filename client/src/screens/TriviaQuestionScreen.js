import React, { useCallback, useEffect, useMemo, useState } from 'react';
import OptionCard from '../components/OptionCard';
import RoundStatus from '../components/RoundStatus';
import Screen from '../components/Screen';
import useOptionShortcuts from '../hooks/useOptionShortcuts';
import { buildTriviaOptions, findTriviaOptionByKey } from '../utils/triviaOptions';

const TriviaQuestionScreen = ({
  category,
  difficulty,
  question,
  questionType,
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
  const optionItems = useMemo(() => buildTriviaOptions(options), [options]);
  const title = useMemo(
    () => (round && total ? `Question ${round} of ${total}` : 'Trivia'),
    [round, total]
  );
  const metaItems = [category, difficulty, questionType]
    .filter(Boolean)
    .map((value) => String(value));

  useEffect(() => {
    setHasSubmitted(false);
    setSubmittedAnswer('');
  }, [question]);

  const submitAnswer = useCallback((answer) => {
    if (hasSubmitted) return;
    const sent = onAnswer(answer);
    if (!sent) return;
    setHasSubmitted(true);
    setSubmittedAnswer(answer);
  }, [hasSubmitted, onAnswer]);
  const submitShortcutAnswer = useCallback(
    (option) => submitAnswer(option.title),
    [submitAnswer]
  );

  useOptionShortcuts({
    disabled: hasSubmitted,
    findOptionByKey: findTriviaOptionByKey,
    items: optionItems,
    onSelect: submitShortcutAnswer,
  });

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
      {metaItems.length ? (
        <div className="question-meta">
          {metaItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}
      <div className="text-container">{question}</div>
      <div className="shortcut-hint">Press A-D or 1-4 to answer.</div>
      <div className="grid">
        {optionItems.map((option, index) => (
          <OptionCard
            key={`${option.title}-${index}`}
            eyebrow={option.label}
            title={option.title}
            submitted={submittedAnswer === option.title}
            onClick={() => submitAnswer(option.title)}
            disabled={hasSubmitted}
          />
        ))}
      </div>
    </Screen>
  );
};

export default TriviaQuestionScreen;
