const crypto = require('crypto');

const createResumeToken = () => crypto.randomBytes(32).toString('base64url');

const isValidResumeToken = (expected, received) => {
    if (typeof expected !== 'string' || typeof received !== 'string') {
        return false;
    }
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    return (
        expectedBuffer.length > 0 &&
        expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    );
};

module.exports = {
    createResumeToken,
    isValidResumeToken,
};
