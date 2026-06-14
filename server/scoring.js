const calculateRoundScore = (answerTime, maxScore = 1000) =>
    Math.max(0, maxScore - Math.round(Math.sqrt(Math.max(0, answerTime))));

const MAX_ROUND_SCORE = calculateRoundScore(0);

module.exports = {
    MAX_ROUND_SCORE,
    calculateRoundScore,
};
