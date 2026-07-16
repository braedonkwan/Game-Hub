const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const {
    buildTriviaPayload,
    buildTriviaSetupPayload,
    createTriviaState,
    loadTriviaQuestions,
    validateTriviaSetup,
} = require('./trivia');

test('buildTriviaSetupPayload includes round and answer-time bounds', () => {
    const payload = buildTriviaSetupPayload([{ id: 9, name: 'General' }], {
        setupId: 12,
    });

    assert.equal(payload.type, 'trivia_setup');
    assert.equal(payload.maxRoundsDefault, 5);
    assert.equal(payload.maxRoundsMin, 1);
    assert.equal(payload.maxRoundsMax, 20);
    assert.equal(payload.guessSecondsDefault, 30);
    assert.equal(payload.guessSecondsMin, 5);
    assert.equal(payload.guessSecondsMax, 120);
    assert.deepEqual(payload.types, [
        { id: 'multiple', name: 'Multiple choice' },
        { id: 'boolean', name: 'True or false' },
    ]);
    assert.equal(payload.defaultType, 'multiple');
    assert.deepEqual(payload.categories, [{ id: 9, name: 'General' }]);
    assert.equal(payload.setupId, 12);
});

test('validateTriviaSetup accepts category, difficulty, type, and answer time', () => {
    assert.deepEqual(
        validateTriviaSetup({
            maxRounds: 4,
            category: 9,
            difficulty: 'hard',
            type: 'boolean',
            guessSeconds: 45,
        }),
        {
            ok: true,
            rounds: 4,
            guessMs: 45000,
            category: 9,
            difficulty: 'hard',
            type: 'boolean',
        }
    );
});

test('validateTriviaSetup rejects invalid answer time', () => {
    assert.deepEqual(
        validateTriviaSetup({
            maxRounds: 4,
            guessSeconds: 121,
        }),
        {
            ok: false,
            error: 'Answer time must be between 5 and 120 seconds.',
        }
    );
});

test('loadTriviaQuestions requests configured question type', async () => {
    const originalGet = axios.get;
    const calls = [];
    axios.get = async (url, options) => {
        calls.push({ url, options });
        return {
            data: {
                response_code: 0,
                results: [
                    {
                        category: 'Science &amp; Nature',
                        difficulty: 'easy',
                        type: 'boolean',
                        question: 'Is this a test?',
                        correct_answer: 'True',
                        incorrect_answers: ['False'],
                    },
                ],
            },
        };
    };

    try {
        const questions = await loadTriviaQuestions(1, {
            category: 9,
            difficulty: 'easy',
            type: 'boolean',
        });

        assert.equal(calls.length, 1);
        assert.equal(calls[0].url, 'https://opentdb.com/api.php');
        assert.deepEqual(calls[0].options.params, {
            amount: 1,
            encode: 'url3986',
            type: 'boolean',
            category: 9,
            difficulty: 'easy',
        });
        assert.deepEqual(questions, [
            {
                category: 'Science & Nature',
                difficulty: 'easy',
                question: 'Is this a test?',
                type: 'boolean',
                correctAnswer: 'True',
                incorrectAnswers: ['False'],
            },
        ]);
    } finally {
        axios.get = originalGet;
    }
});

test('loadTriviaQuestions cleans encoded trivia text', async () => {
    const originalGet = axios.get;
    axios.get = async () => ({
        data: {
            response_code: 0,
            results: [
                {
                    category: 'Entertainment: Film',
                    difficulty: 'medium',
                    type: 'multiple',
                    question: 'Who%20said%20%22I%27ll%20be%20back%22%3F',
                    correct_answer: 'Arnold%20%26%20Co.',
                    incorrect_answers: [
                        'Someone%20else',
                        'No%20one',
                        'Cafe%20owner%21',
                    ],
                },
            ],
        },
    });

    try {
        const questions = await loadTriviaQuestions(1);

        assert.deepEqual(questions[0], {
            category: 'Entertainment: Film',
            difficulty: 'medium',
            question: 'Who said "I\'ll be back"?',
            type: 'multiple',
            correctAnswer: 'Arnold & Co.',
            incorrectAnswers: ['Someone else', 'No one', 'Cafe owner!'],
        });
    } finally {
        axios.get = originalGet;
    }
});

test('buildTriviaPayload includes question metadata', () => {
    const trivia = createTriviaState({
        questions: [
            {
                category: 'Entertainment: Music',
                difficulty: 'medium',
                type: 'multiple',
                question: 'Which album came first?',
                correctAnswer: 'A',
                incorrectAnswers: ['B', 'C', 'D'],
            },
        ],
    });

    const payload = buildTriviaPayload({ trivia, round: 1, total: 3 });

    assert.equal(payload.type, 'trivia_question');
    assert.equal(payload.category, 'Entertainment: Music');
    assert.equal(payload.difficulty, 'medium');
    assert.equal(payload.questionType, 'multiple');
    assert.equal(payload.round, 1);
    assert.equal(payload.total, 3);
});
