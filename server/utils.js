const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseJson = (value) => {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const normalizeUsername = (value) => String(value || '').trim();

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

const decodeHtml = (value) => {
    if (!value) return '';
    return value
        .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) =>
            String.fromCharCode(parseInt(hex, 16))
        )
        .replace(/&#(\d+);/g, (_match, num) =>
            String.fromCharCode(parseInt(num, 10))
        )
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&ldquo;|&rdquo;/g, '"')
        .replace(/&hellip;/g, '...');
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
    normalizeUsername,
    parseJson,
    parseUsernamePayload,
    shuffleArray,
    sleep,
};
