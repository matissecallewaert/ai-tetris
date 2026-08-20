function getStorage(storage) {
    return storage ?? globalThis.localStorage;
}

export function getHighScore(key, storage) {
    const value = getStorage(storage).getItem(key);
    return value === null ? null : JSON.parse(value);
}

export function getOrInitNumber(key, fallback, storage) {
    const target = getStorage(storage);
    const storedValue = target.getItem(key);

    if (storedValue === null) {
        target.setItem(key, JSON.stringify(fallback));
        return fallback;
    }

    return Number(JSON.parse(storedValue));
}

export function setHighScoreIfHigher(key, score, storage) {
    const target = getStorage(storage);
    const currentValue = getOrInitNumber(key, 0, target);
    const newValue = Math.max(currentValue, score);

    if (newValue !== currentValue) {
        target.setItem(key, JSON.stringify(newValue));
    }

    return newValue;
}
