const { SPOTIFY_GAME_ID, TRIVIA_GAME_ID } = require('./gameCatalog');
const { calculateRoundScore } = require('./scoring');
const { selectionKey } = require('./spotifyGame');

const cloneScoreboard = (scoreboard) =>
    Object.fromEntries(
        Object.entries(scoreboard || {}).map(([id, entry]) => [
            id,
            { ...entry },
        ])
    );

const getNextStreak = (entry, isCorrect) => {
    if (!isCorrect) {
        return 0;
    }
    const currentStreak = Number.isFinite(entry?.streak) ? entry.streak : 0;
    return currentStreak + 1;
};

const getAnswerTimeMs = (client) =>
    Number.isFinite(client?.answerTime) ? Math.max(0, client.answerTime) : 0;

const scoreRound = ({
    activeGameId,
    triviaAnswer,
    currentTrack,
    clients,
    scoreboard,
    waitingState,
}) => {
    const nextScoreboard = cloneScoreboard(scoreboard);
    const deltas = Object.fromEntries(
        Object.keys(nextScoreboard).map((id) => [id, 0])
    );
    const outcomes = Object.fromEntries(
        Object.keys(nextScoreboard).map((id) => [
            id,
            { answered: false, correct: false },
        ])
    );
    const spotifyAnswerKey = currentTrack ? selectionKey(currentTrack) : '';

    clients.forEach((client, id) => {
        if (
            client.state !== waitingState ||
            !client.answer ||
            !nextScoreboard[id]
        ) {
            return;
        }
        outcomes[id] = {
            answered: true,
            answerTimeMs: getAnswerTimeMs(client),
            correct: false,
        };
        const isCorrect =
            (activeGameId === TRIVIA_GAME_ID &&
                triviaAnswer &&
                client.answer === triviaAnswer) ||
            (activeGameId === SPOTIFY_GAME_ID &&
                spotifyAnswerKey &&
                selectionKey(client.answer) === spotifyAnswerKey);
        if (!isCorrect) {
            return;
        }
        const points = calculateRoundScore(client.answerTime);
        nextScoreboard[id].score += points;
        deltas[id] = points;
        outcomes[id].correct = true;
    });

    Object.entries(outcomes).forEach(([id, outcome]) => {
        if (!nextScoreboard[id]) {
            return;
        }
        nextScoreboard[id].streak = getNextStreak(
            nextScoreboard[id],
            outcome.correct
        );
    });

    return {
        scoreboard: nextScoreboard,
        deltas,
        outcomes,
    };
};

module.exports = {
    scoreRound,
};
