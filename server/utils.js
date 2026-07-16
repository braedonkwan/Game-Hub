const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_USERNAME_LENGTH = 24;

const parseJson = (value) => {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const normalizeUsername = (value) =>
    String(value || '').trim().slice(0, MAX_USERNAME_LENGTH);

const parseUsernamePayload = (value) => {
    const payload = parseJson(value);
    if (payload && typeof payload === 'object') {
        return {
            username: normalizeUsername(payload.username),
            resumeToken:
                typeof payload.resumeToken === 'string' ? payload.resumeToken : '',
        };
    }
    return { username: normalizeUsername(value), resumeToken: '' };
};

const isSameUsername = (left, right) => {
    const leftName = normalizeUsername(left);
    const rightName = normalizeUsername(right);
    if (!leftName || !rightName) {
        return false;
    }
    return leftName.toLowerCase() === rightName.toLowerCase();
};

const HTML_ENTITY_MAP = {
    amp: '&',
    apos: "'",
    copy: '(c)',
    eacute: 'e',
    gt: '>',
    hellip: '...',
    ldquo: '"',
    lsquo: "'",
    lt: '<',
    mdash: '-',
    ndash: '-',
    nbsp: ' ',
    quot: '"',
    rdquo: '"',
    reg: '(r)',
    rsquo: "'",
    shy: '',
    trade: '(tm)',
};

const decodeHtml = (value) => {
    if (!value) return '';
    return String(value).replace(
        /&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]+);/g,
        (match, entity) => {
            if (entity.startsWith('#x')) {
                const codePoint = parseInt(entity.slice(2), 16);
                return Number.isFinite(codePoint) && codePoint <= 0x10ffff
                    ? String.fromCodePoint(codePoint)
                    : match;
            }
            if (entity.startsWith('#')) {
                const codePoint = parseInt(entity.slice(1), 10);
                return Number.isFinite(codePoint) && codePoint <= 0x10ffff
                    ? String.fromCodePoint(codePoint)
                    : match;
            }
            return HTML_ENTITY_MAP[entity.toLowerCase()] ?? match;
        }
    );
};

const shuffleArray = (list) => {
    const items = [...list];
    for (let i = items.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
};

module.exports = {
    decodeHtml,
    isSameUsername,
    MAX_USERNAME_LENGTH,
    normalizeUsername,
    parseJson,
    parseUsernamePayload,
    shuffleArray,
    sleep,
};
