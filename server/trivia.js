const axios = require('axios');
const { decodeHtml, shuffleArray } = require('./utils');

const TRIVIA_MIN_ROUNDS = 1;
const TRIVIA_MAX_ROUNDS = 20;
const TRIVIA_DEFAULT_ROUNDS = 5;
const TRIVIA_DEFAULT_CATEGORY = 'any';
const TRIVIA_DEFAULT_DIFFICULTY = 'any';
const TRIVIA_DIFFICULTIES = [
    { id: 'any', name: 'Any difficulty' },
    { id: 'easy', name: 'Easy' },
    { id: 'medium', name: 'Medium' },
    { id: 'hard', name: 'Hard' },
];

const TRIVIA_DIFFICULTY_SET = new Set(['easy', 'medium', 'hard']);

let triviaCategoriesCache = [];
let triviaCategoriesPromise = null;
let triviaSetupId = 0;

const createTriviaState = (overrides = {}) => ({
    questions: [],
    index: 0,
    correctAnswer: '',
    currentPayload: null,
    category: TRIVIA_DEFAULT_CATEGORY,
    difficulty: TRIVIA_DEFAULT_DIFFICULTY,
    ...overrides,
});

const loadTriviaCategories = async () => {
    if (triviaCategoriesCache.length) {
        return triviaCategoriesCache;
    }
    if (triviaCategoriesPromise) {
        return triviaCategoriesPromise;
    }
    triviaCategoriesPromise = axios
        .get('https://opentdb.com/api_category.php')
        .then((resp) => {
            const categories = Array.isArray(resp.data?.trivia_categories)
                ? resp.data.trivia_categories
                : [];
            triviaCategoriesCache = categories.map((category) => ({
                id: category.id,
                name: decodeHtml(category.name),
            }));
            return triviaCategoriesCache;
        })
        .catch((err) => {
            console.error('[ERROR] Failed to load trivia categories.', err?.message || err);
            return [];
        })
        .finally(() => {
            triviaCategoriesPromise = null;
        });
    return triviaCategoriesPromise;
};

const getTriviaSetupPayload = async (overrides = {}) => {
    const categories = await loadTriviaCategories();
    triviaSetupId += 1;
    return {
        type: 'trivia_setup',
        maxRoundsDefault: TRIVIA_DEFAULT_ROUNDS,
        maxRoundsMax: TRIVIA_MAX_ROUNDS,
        categories,
        difficulties: TRIVIA_DIFFICULTIES,
        defaultCategory: TRIVIA_DEFAULT_CATEGORY,
        defaultDifficulty: TRIVIA_DEFAULT_DIFFICULTY,
        setupId: triviaSetupId,
        ...overrides,
    };
};

const normalizeTriviaCategory = (value) => {
    if (!value || value === TRIVIA_DEFAULT_CATEGORY) {
        return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const normalizeTriviaDifficulty = (value) => {
    if (!value || value === TRIVIA_DEFAULT_DIFFICULTY) {
        return null;
    }
    const normalized = String(value).toLowerCase();
    return TRIVIA_DIFFICULTY_SET.has(normalized) ? normalized : null;
};

const toTriviaQuestion = (question) => ({
    question: decodeHtml(question.question),
    correctAnswer: decodeHtml(question.correct_answer),
    incorrectAnswers: question.incorrect_answers.map((answer) => decodeHtml(answer)),
});

const buildTriviaPayload = ({ trivia, round, total }) => {
    const question = trivia.questions[trivia.index];
    if (!question) {
        return null;
    }
    const options = shuffleArray([...question.incorrectAnswers, question.correctAnswer]);
    trivia.correctAnswer = question.correctAnswer;
    trivia.currentPayload = {
        type: 'trivia_question',
        question: question.question,
        options,
        round,
        total,
    };
    return trivia.currentPayload;
};

async function loadTriviaQuestions(amount, { category, difficulty } = {}) {
    const count = Math.min(Math.max(amount, TRIVIA_MIN_ROUNDS), TRIVIA_MAX_ROUNDS);
    const normalizedCategory = normalizeTriviaCategory(category);
    const normalizedDifficulty = normalizeTriviaDifficulty(difficulty);
    try {
        const resp = await axios.get('https://opentdb.com/api.php', {
            params: {
                amount: count,
                type: 'multiple',
                ...(normalizedCategory ? { category: normalizedCategory } : {}),
                ...(normalizedDifficulty ? { difficulty: normalizedDifficulty } : {}),
            },
        });
        if (resp.data?.response_code !== 0) {
            console.error('[ERROR] Trivia API returned no results.');
            return [];
        }
        return (resp.data.results || []).map(toTriviaQuestion);
    } catch (err) {
        console.error('[ERROR] Failed to load trivia questions.', err?.message || err);
        return [];
    }
}

module.exports = {
    TRIVIA_DEFAULT_CATEGORY,
    TRIVIA_DEFAULT_DIFFICULTY,
    TRIVIA_MAX_ROUNDS,
    TRIVIA_MIN_ROUNDS,
    buildTriviaPayload,
    createTriviaState,
    getTriviaSetupPayload,
    loadTriviaQuestions,
    normalizeTriviaCategory,
    normalizeTriviaDifficulty,
};
