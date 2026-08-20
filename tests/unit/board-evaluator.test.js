import assert from "node:assert/strict";
import test from "node:test";
import { COLS, ROWS } from "../../scripts/modules/constants.js";
import { evaluateBoard, scoreFeatures } from "../../scripts/modules/ai/board-evaluator.js";
import { FEATURE_ORDER } from "../../scripts/modules/ai/feature-schema.js";

function emptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

test("evaluateBoard reports all-zero features for an empty board", () => {
    const features = evaluateBoard(emptyGrid(), { linesCleared: 0 });
    assert.equal(features.aggregateHeight, 0);
    assert.equal(features.maxHeight, 0);
    assert.equal(features.relativeHeight, 0);
    assert.equal(features.holes, 0);
    assert.equal(features.blockades, 0);
    assert.equal(features.bumpiness, 0);
    assert.equal(features.linesCleared, 0);
    assert.equal(features.rowTransitions, ROWS * 2);
    assert.equal(features.columnTransitions, COLS);
    assert.equal(features.landingHeight, 0);
    assert.equal(features.erodedCells, 0);
});

test("evaluateBoard never skips empty columns when computing height and bumpiness", () => {
    const grid = emptyGrid();
    grid[ROWS - 1][0] = 1;
    grid[ROWS - 1][2] = 1;
    const features = evaluateBoard(grid, { linesCleared: 0 });
    assert.equal(features.aggregateHeight, 2);
    assert.equal(features.maxHeight, 1);
    assert.equal(features.relativeHeight, 1);
    assert.equal(features.bumpiness, 3);
});

test("evaluateBoard counts holes and the blockades covering them", () => {
    const grid = emptyGrid();
    grid[ROWS - 1][0] = 1;
    grid[ROWS - 3][0] = 1;
    const features = evaluateBoard(grid, { linesCleared: 0 });
    assert.equal(features.holes, 1);
    assert.equal(features.blockades, 1);
});

test("evaluateBoard threads linesCleared through as given, it is transition data not grid-derived", () => {
    const features = evaluateBoard(emptyGrid(), { linesCleared: 4 });
    assert.equal(features.linesCleared, 4);
});

test("evaluateBoard threads landingHeight and erodedCells through as given, defaulting to 0", () => {
    const withoutExtras = evaluateBoard(emptyGrid(), { linesCleared: 0 });
    assert.equal(withoutExtras.landingHeight, 0);
    assert.equal(withoutExtras.erodedCells, 0);
    const withExtras = evaluateBoard(emptyGrid(), { linesCleared: 1, landingHeight: 7.5, erodedCells: 3 });
    assert.equal(withExtras.landingHeight, 7.5);
    assert.equal(withExtras.erodedCells, 3);
});

test("countRowTransitions counts a filled-vs-empty boundary crossing per row, walls counted as filled", () => {
    const grid = emptyGrid();
    const emptyRowTransitions = evaluateBoard(grid, { linesCleared: 0 }).rowTransitions;
    assert.equal(emptyRowTransitions, ROWS * 2);
    grid[ROWS - 1].fill(1);
    const fullRowTransitions = evaluateBoard(grid, { linesCleared: 0 }).rowTransitions;
    assert.equal(fullRowTransitions, emptyRowTransitions - 2);
    const resetGrid = emptyGrid();
    resetGrid[ROWS - 1][3] = 1;
    const singleCellRow = evaluateBoard(resetGrid, { linesCleared: 0 }).rowTransitions;
    assert.equal(singleCellRow, emptyRowTransitions + 2);
});

test("countColumnTransitions counts a filled-vs-empty boundary crossing per column, only the floor counted as filled", () => {
    const grid = emptyGrid();
    const emptyColumnTransitions = evaluateBoard(grid, { linesCleared: 0 }).columnTransitions;
    assert.equal(emptyColumnTransitions, COLS);
    grid[ROWS - 1][0] = 1;
    const flushWithFloor = evaluateBoard(grid, { linesCleared: 0 }).columnTransitions;
    assert.equal(flushWithFloor, emptyColumnTransitions);
    const holeGrid = emptyGrid();
    holeGrid[ROWS - 1][0] = 1;
    holeGrid[ROWS - 3][0] = 1;
    const withAHole = evaluateBoard(holeGrid, { linesCleared: 0 }).columnTransitions;
    assert.equal(withAHole, emptyColumnTransitions + 2);
});

test("scoreFeatures computes a weighted dot product in FEATURE_ORDER", () => {
    const features = Object.fromEntries(FEATURE_ORDER.map((key, index) => [key, index + 1]));
    const weights = FEATURE_ORDER.map((_, index) => index + 1);
    const expected = FEATURE_ORDER.reduce(
        (sum, key, index) => sum + features[key] * weights[index],
        0
    );
    assert.equal(scoreFeatures(features, weights), expected);
});
