const createTaskQueue = (onError = () => {}) => {
    let pending = Promise.resolve();

    return (task) => {
        pending = pending.then(task).catch(onError);
        return pending;
    };
};

module.exports = { createTaskQueue };
