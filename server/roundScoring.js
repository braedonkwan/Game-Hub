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
    const spotifyAnswerKey = currentTrack ? selectionKey(currentTrack) : '';

    clients.forEach((client, id) => {
        if (
            client.state !== waitingState ||
            !client.answer ||
            !nextScoreboard[id]
        ) {
            return;
        }
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
    });

    return {
        scoreboard: nextScoreboard,
        deltas,
    };
};

module.exports = {
    scoreRound,
};
