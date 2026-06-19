const axios = require('axios');
const { decodeHtml, shuffleArray } = require('./utils');

const TRIVIA_MIN_ROUNDS = 1;
const TRIVIA_MAX_ROUNDS = 20;
const TRIVIA_DEFAULT_ROUNDS = 5;
const TRIVIA_MIN_GUESS_SECONDS = 5;
const TRIVIA_DEFAULT_GUESS_SECONDS = 30;
const TRIVIA_MAX_GUESS_SECONDS = 120;
const TRIVIA_DEFAULT_CATEGORY = 'any';
const TRIVIA_DEFAULT_DIFFICULTY = 'any';
const TRIVIA_DEFAULT_TYPE = 'multiple';
const TRIVIA_DIFFICULTIES = [
    { id: 'any', name: 'Any difficulty' },
    { id: 'easy', name: 'Easy' },
    { id: 'medium', name: 'Medium' },
    { id: 'hard', name: 'Hard' },
];
const TRIVIA_TYPES = [
    { id: 'multiple', name: 'Multiple choice' },
    { id: 'boolean', name: 'True or false' },
];

const TRIVIA_DIFFICULTY_SET = new Set(['easy', 'medium', 'hard']);
const TRIVIA_TYPE_SET = new Set(['multiple', 'boolean']);

const parseInteger = (value) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
};

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
    type: TRIVIA_DEFAULT_TYPE,
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

const buildTriviaSetupPayload = (categories = [], overrides = {}) => {
    return {
        type: 'trivia_setup',
        maxRoundsDefault: TRIVIA_DEFAULT_ROUNDS,
        maxRoundsMin: TRIVIA_MIN_ROUNDS,
        maxRoundsMax: TRIVIA_MAX_ROUNDS,
        guessSecondsDefault: TRIVIA_DEFAULT_GUESS_SECONDS,
        guessSecondsMin: TRIVIA_MIN_GUESS_SECONDS,
        guessSecondsMax: TRIVIA_MAX_GUESS_SECONDS,
        categories,
        difficulties: TRIVIA_DIFFICULTIES,
        types: TRIVIA_TYPES,
        defaultCategory: TRIVIA_DEFAULT_CATEGORY,
        defaultDifficulty: TRIVIA_DEFAULT_DIFFICULTY,
        defaultType: TRIVIA_DEFAULT_TYPE,
        setupId: overrides.setupId ?? triviaSetupId,
        ...overrides,
    };
};

const getTriviaSetupPayload = async (overrides = {}) => {
    const categories = await loadTriviaCategories();
    triviaSetupId += 1;
    return buildTriviaSetupPayload(categories, {
        setupId: triviaSetupId,
        ...overrides,
    });
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

const normalizeTriviaType = (value) => {
    if (!value || value === TRIVIA_DEFAULT_TYPE) {
        return TRIVIA_DEFAULT_TYPE;
    }
    const normalized = String(value).toLowerCase();
    return TRIVIA_TYPE_SET.has(normalized) ? normalized : TRIVIA_DEFAULT_TYPE;
};

const validateTriviaSetup = (cfg) => {
    const rounds = parseInteger(cfg?.['max rounds'] ?? cfg?.maxRounds);
    if (rounds === null) {
        return { ok: false, error: 'Questions must be a whole number.' };
    }
    if (rounds < TRIVIA_MIN_ROUNDS || rounds > TRIVIA_MAX_ROUNDS) {
        return {
            ok: false,
            error: `Questions must be between ${TRIVIA_MIN_ROUNDS} and ${TRIVIA_MAX_ROUNDS}.`,
        };
    }

    const guessSeconds =
        parseInteger(cfg?.guessSeconds ?? cfg?.['guess seconds']) ??
        TRIVIA_DEFAULT_GUESS_SECONDS;
    if (
        guessSeconds < TRIVIA_MIN_GUESS_SECONDS ||
        guessSeconds > TRIVIA_MAX_GUESS_SECONDS
    ) {
        return {
            ok: false,
            error: `Answer time must be between ${TRIVIA_MIN_GUESS_SECONDS} and ${TRIVIA_MAX_GUESS_SECONDS} seconds.`,
        };
    }

    return {
        ok: true,
        rounds,
        guessMs: guessSeconds * 1000,
        category: normalizeTriviaCategory(cfg?.category) ?? TRIVIA_DEFAULT_CATEGORY,
        difficulty:
            normalizeTriviaDifficulty(cfg?.difficulty) ?? TRIVIA_DEFAULT_DIFFICULTY,
        type: normalizeTriviaType(cfg?.type),
    };
};

const toTriviaQuestion = (question) => ({
    category: decodeHtml(question.category || ''),
    difficulty: String(question.difficulty || ''),
    question: decodeHtml(question.question),
    type: String(question.type || TRIVIA_DEFAULT_TYPE),
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
        category: question.category,
        difficulty: question.difficulty,
        question: question.question,
        questionType: question.type,
        options,
        round,
        total,
    };
    return trivia.currentPayload;
};

async function loadTriviaQuestions(amount, { category, difficulty, type } = {}) {
    const count = Math.min(Math.max(amount, TRIVIA_MIN_ROUNDS), TRIVIA_MAX_ROUNDS);
    const normalizedCategory = normalizeTriviaCategory(category);
    const normalizedDifficulty = normalizeTriviaDifficulty(difficulty);
    const normalizedType = normalizeTriviaType(type);
    try {
        const resp = await axios.get('https://opentdb.com/api.php', {
            params: {
                amount: count,
                type: normalizedType,
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
    TRIVIA_DEFAULT_GUESS_SECONDS,
    TRIVIA_DEFAULT_TYPE,
    TRIVIA_MAX_ROUNDS,
    TRIVIA_MAX_GUESS_SECONDS,
    TRIVIA_MIN_ROUNDS,
    TRIVIA_MIN_GUESS_SECONDS,
    buildTriviaSetupPayload,
    buildTriviaPayload,
    createTriviaState,
    getTriviaSetupPayload,
    loadTriviaQuestions,
    normalizeTriviaCategory,
    normalizeTriviaDifficulty,
    normalizeTriviaType,
    validateTriviaSetup,
};
