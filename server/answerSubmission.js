const { TRIVIA_GAME_ID } = require('./gameCatalog');

const getAnswerElapsedMs = (startedAt, answeredAt) =>
    startedAt ? Math.max(0, answeredAt - startedAt) : 0;

const normalizeNonEmptyText = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const normalized = value.trim();
    return normalized ? normalized : null;
};

const normalizeSubmittedAnswer = (activeGameId, payload) => {
    if (!payload || typeof payload !== 'object') {
        return null;
    }
    if (activeGameId === TRIVIA_GAME_ID) {
        if (payload.type !== 'trivia_answer') {
            return null;
        }
        return normalizeNonEmptyText(payload.answer);
    }
    const name = normalizeNonEmptyText(payload.name);
    const artists = normalizeNonEmptyText(payload.artists);
    return name && artists ? { ...payload, name, artists } : null;
};

const applyAnswerSubmission = ({
    activeGameId,
    answeredAt,
    client,
    payload,
    startedAt,
    waitingState,
}) => {
    const answer = normalizeSubmittedAnswer(activeGameId, payload);
    if (answer === null) {
        return false;
    }

    client.answer = answer;
    client.answerTime = getAnswerElapsedMs(startedAt, answeredAt);
    client.state = waitingState;
    return true;
};

module.exports = {
    applyAnswerSubmission,
    getAnswerElapsedMs,
    normalizeSubmittedAnswer,
};
