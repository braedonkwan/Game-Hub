const { TRIVIA_GAME_ID } = require('./gameCatalog');
const { buildRoundResult } = require('./roundResult');
const { MAX_ROUND_SCORE } = require('./scoring');

const addRoundMetadata = (
    payload,
    {
        round,
        total,
        roundStartedAt,
        answerDeadlineAt,
        serverSentAt = Date.now(),
        maxScore = MAX_ROUND_SCORE,
    }
) => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return payload;
    }
    return {
        ...payload,
        round,
        total,
        roundStartedAt,
        answerDeadlineAt,
        serverSentAt,
        maxScore,
    };
};

const buildSelectionPayload = ({ activeGameId, trivia, selections, roundInfo }) => {
    const payload =
        activeGameId === TRIVIA_GAME_ID ? trivia?.currentPayload : selections;
    return addRoundMetadata(payload, roundInfo);
};

const buildScoreboardPayload = ({
    activeGameId,
    lastRoundDeltas,
    maxRounds,
    round,
    scoreboard,
    selections,
    trivia,
}) => ({
    type: 'scoreboard',
    scores: Object.fromEntries(
        Object.entries(scoreboard || {}).map(([id, entry]) => [
            id,
            {
                ...entry,
                delta: lastRoundDeltas?.[id] ?? 0,
            },
        ])
    ),
    round,
    total: maxRounds,
    gameId: activeGameId,
    roundResult: buildRoundResult({
        activeGameId,
        triviaAnswer: trivia?.correctAnswer,
        currentTrack: selections?.['current track'],
    }),
});

module.exports = {
    addRoundMetadata,
    buildScoreboardPayload,
    buildSelectionPayload,
};
