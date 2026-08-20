import assert from "node:assert/strict";
import test from "node:test";

import { SHAPES } from "../../scripts/modules/constants.js";
import Tetris, {
    createSevenBagRandomizer
} from "../../scripts/modules/tetris.js";

const PIECE_KEYS = Object.keys(SHAPES).sort();

function createSeededRng(seed) {
    let state = seed >>> 0;

    return () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}

test("each seven-bag cycle contains every piece exactly once", () => {
    const randomizer = createSevenBagRandomizer(createSeededRng(12345));

    for (let cycle = 0; cycle < 20; cycle += 1) {
        const pieces = Array.from({ length: 7 }, () => randomizer.next());
        assert.deepEqual([...pieces].sort(), PIECE_KEYS);
    }
});

test("peek reports the next piece without consuming it", () => {
    const randomizer = createSevenBagRandomizer(createSeededRng(555));
    for (let draw = 0; draw < 50; draw += 1) {
        const peeked = randomizer.peek();
        assert.equal(randomizer.peek(), peeked);
        assert.equal(randomizer.next(), peeked);
    }
});

test("peek across a bag boundary matches the first piece of the freshly reshuffled bag", () => {
    const randomizer = createSevenBagRandomizer(createSeededRng(777));
    for (let draw = 0; draw < 6; draw += 1) {
        randomizer.next();
    }
    const peekedAcrossBoundary = randomizer.peek();
    const actualNext = randomizer.next();
    assert.equal(peekedAcrossBoundary, actualNext);
});

test("a seeded randomizer is reproducible and yields varied cycles forever", () => {
    const first = createSevenBagRandomizer(createSeededRng(98765));
    const second = createSevenBagRandomizer(createSeededRng(98765));
    const cycles = [];

    for (let cycle = 0; cycle < 301; cycle += 1) {
        const firstCycle = Array.from({ length: 7 }, () => first.next());
        const secondCycle = Array.from({ length: 7 }, () => second.next());
        assert.deepEqual(firstCycle, secondCycle);
        cycles.push(firstCycle);
    }

    assert.equal(cycles.flat().length, 2107);
    for (const pieces of cycles) {
        assert.deepEqual([...pieces].sort(), PIECE_KEYS);
    }
    assert.ok(new Set(cycles.map(JSON.stringify)).size >= 4);
});

test("a real engine preserves seven-bag sequencing past the old boundary", () => {
    const tetris = new Tetris(createSeededRng(24680));
    const pieceKeys = [];
    let previousCurrent;
    let expectedCurrentKey;

    for (let draw = 0; draw < 560; draw += 1) {
        if (draw > 0) {
            tetris.grid = Array.from({ length: 20 }, () => Array(10).fill(0));
            tetris.nextShape();
            assert.equal(Object.keys(tetris.currentShape.shape)[0], expectedCurrentKey);
            assert.notStrictEqual(tetris.currentShape, previousCurrent);
        }

        assert.ok(tetris.currentShape.shape);
        assert.ok(tetris.upcomingShape.shape);
        assert.equal(tetris.bag.length, 7);

        const currentKey = Object.keys(tetris.currentShape.shape)[0];
        const upcomingKey = Object.keys(tetris.upcomingShape.shape)[0];
        const currentMatrix = tetris.currentShape.shape[currentKey];
        const upcomingMatrix = tetris.upcomingShape.shape[upcomingKey];

        assert.notStrictEqual(currentMatrix, SHAPES[currentKey]);
        assert.notStrictEqual(upcomingMatrix, SHAPES[upcomingKey]);
        assert.notStrictEqual(currentMatrix, upcomingMatrix);
        for (let row = 0; row < currentMatrix.length; row += 1) {
            assert.notStrictEqual(currentMatrix[row], SHAPES[currentKey][row]);
        }
        for (let row = 0; row < upcomingMatrix.length; row += 1) {
            assert.notStrictEqual(upcomingMatrix[row], SHAPES[upcomingKey][row]);
        }

        pieceKeys.push(currentKey);
        previousCurrent = tetris.currentShape;
        expectedCurrentKey = upcomingKey;
    }

    for (let index = 0; index < pieceKeys.length; index += 7) {
        assert.deepEqual(pieceKeys.slice(index, index + 7).sort(), PIECE_KEYS);
    }

    assert.equal(tetris.died, false);
});
