import assert from "node:assert/strict";
import test from "node:test";
import { COLS, ROWS, SHAPES, SPAWN_X } from "../../scripts/modules/constants.js";
import Tetris from "../../scripts/modules/tetris.js";
import { evaluateBoard, scoreFeatures } from "../../scripts/modules/ai/board-evaluator.js";
import { FEATURE_ORDER } from "../../scripts/modules/ai/feature-schema.js";
import { canSpawn, countErodedCells, enumerateMoves, findBestMove } from "../../scripts/modules/ai/move-search.js";

function emptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function weightsFor(overrides) {
    return { weights: FEATURE_ORDER.map((key) => overrides[key] ?? 0) };
}

test("findBestMove returns null when no placement is possible", () => {
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(1));
    assert.equal(findBestMove(grid, "O", weightsFor({})), null);
});

test("findBestMove on an empty board settles at the floor regardless of which x ties are broken to", () => {
    const best = findBestMove(emptyGrid(), "O", weightsFor({ aggregateHeight: -1 }));
    assert.ok(best);
    assert.equal(best.y, ROWS - 2);
});

test("findBestMove avoids a hole-creating placement in favor of a clean well-fill that also clears a line", () => {
    const grid = emptyGrid();
    for (let x = 1; x < COLS; x += 1) {
        grid[ROWS - 1][x] = 1;
    }
    const best = findBestMove(
        grid,
        "I",
        weightsFor({ holes: -10, aggregateHeight: -1, bumpiness: -1 })
    );
    assert.ok(best);
    assert.equal(best.x, 0);
    assert.equal(best.linesCleared, 1);
    const features = evaluateBoard(best.resultingGrid, { linesCleared: best.linesCleared });
    assert.equal(features.holes, 0);
});

test("findBestMove picks the line-clearing placement when linesCleared is weighted positively", () => {
    const grid = emptyGrid();
    for (let x = 0; x < COLS - 1; x += 1) {
        grid[ROWS - 1][x] = 1;
    }
    const best = findBestMove(grid, "I", weightsFor({ linesCleared: 100 }));
    assert.ok(best);
    assert.equal(best.linesCleared, 1);
});

test("findBestMove does not mutate the input grid", () => {
    const grid = emptyGrid();
    const before = Tetris.cloneGrid(grid);
    findBestMove(grid, "T", weightsFor({}));
    assert.deepEqual(grid, before);
});

test("canSpawn is true for every piece on an empty board", () => {
    for (const pieceKey of Object.keys(SHAPES)) {
        assert.equal(canSpawn(emptyGrid(), pieceKey), true);
    }
});

test("canSpawn is false when the fixed spawn column is blocked, even if other columns have room", () => {
    const grid = emptyGrid();
    for (let x = SPAWN_X; x < SPAWN_X + 4; x += 1) {
        grid[0][x] = 1;
        grid[1][x] = 1;
    }
    for (const pieceKey of Object.keys(SHAPES)) {
        assert.equal(canSpawn(grid, pieceKey), false);
    }
    const stillFindsSomewhereElse = findBestMove(grid, "T", weightsFor({}));
    assert.ok(stillFindsSomewhereElse);
});

test("canSpawn is true when only non-spawn columns are stacked high", () => {
    const grid = emptyGrid();
    for (const x of [0, 1, 2, 7, 8, 9]) {
        for (let y = 0; y < ROWS - 2; y += 1) {
            grid[y][x] = 1;
        }
    }
    for (const pieceKey of Object.keys(SHAPES)) {
        assert.equal(canSpawn(grid, pieceKey), true);
    }
});

test("countErodedCells is 0 when no lines were cleared, regardless of the placement", () => {
    assert.equal(countErodedCells(emptyGrid(), [[1, 1, 1, 1]], 0, 0), 0);
});

test("countErodedCells only credits the piece's cells that fall in a row that actually cleared", () => {
    const placedGrid = emptyGrid();
    for (let x = 0; x < 8; x += 1) {
        placedGrid[ROWS - 1][x] = 1;
    }
    placedGrid[ROWS - 2][8] = 1;
    placedGrid[ROWS - 2][9] = 1;
    placedGrid[ROWS - 1][8] = 1;
    placedGrid[ROWS - 1][9] = 1;
    const matrix = [[1, 1], [1, 1]];
    assert.equal(countErodedCells(placedGrid, matrix, ROWS - 2, 1), 2);
});

test("countErodedCells scales with both lines cleared and the piece's own contribution across all of them", () => {
    const placedGrid = emptyGrid();
    for (let y = ROWS - 4; y < ROWS; y += 1) {
        for (let x = 0; x < 9; x += 1) {
            placedGrid[y][x] = 1;
        }
        placedGrid[y][9] = 1;
    }
    const matrix = [[1], [1], [1], [1]];
    assert.equal(countErodedCells(placedGrid, matrix, ROWS - 4, 4), 16);
});

function smallGrid(rows, cols) {
    return Array.from({ length: rows }, () => Array(cols).fill(0));
}

test("lookahead sacrifices an immediate line clear for a better two-piece outcome than greedy 1-ply search", () => {
    // 4-wide well scenario: bottom row filled except one column, everything else empty.
    // Greedy is tempted to clear that one line immediately with an L piece, but doing so
    // leaves a hole-prone board. Looking one piece ahead finds a placement that clears
    // nothing yet, but sets up a clean two-line clear once the next L piece lands.
    const grid = smallGrid(8, 4);
    grid[7][0] = 1;
    grid[7][1] = 1;
    grid[7][2] = 1;
    const genome = weightsFor({ holes: -1, linesCleared: 5, erodedCells: 1, aggregateHeight: -0.1 });

    const greedy = findBestMove(grid, "L", genome);
    const lookahead = findBestMove(grid, "L", genome, "L");

    assert.ok(greedy && lookahead);
    assert.ok(
        greedy.x !== lookahead.x || greedy.orientationIndex !== lookahead.orientationIndex,
        "lookahead should choose a different placement than greedy here"
    );
    assert.equal(greedy.linesCleared, 1);
    assert.equal(lookahead.linesCleared, 0);

    const greedyNext = findBestMove(greedy.resultingGrid, "L", genome);
    const lookaheadNext = findBestMove(lookahead.resultingGrid, "L", genome);
    const greedyTotalLines = greedy.linesCleared + (greedyNext ? greedyNext.linesCleared : 0);
    const lookaheadTotalLines = lookahead.linesCleared + (lookaheadNext ? lookaheadNext.linesCleared : 0);
    assert.ok(
        lookaheadTotalLines > greedyTotalLines,
        `expected lookahead's two-piece total (${lookaheadTotalLines}) to beat greedy's (${greedyTotalLines})`
    );
});

test("lookahead's chosen score is never worse than the 2-ply value of whatever greedy would have picked", () => {
    const grid = smallGrid(8, 4);
    grid[7][0] = 1;
    grid[7][1] = 1;
    grid[7][2] = 1;
    const genome = weightsFor({ holes: -1, linesCleared: 5, erodedCells: 1, aggregateHeight: -0.1 });

    const greedy = findBestMove(grid, "L", genome);
    const lookahead = findBestMove(grid, "L", genome, "L");
    const greedyNext = findBestMove(greedy.resultingGrid, "L", genome);
    const greedyTwoPlyValue = greedyNext ? greedyNext.score : -Infinity;

    assert.ok(lookahead.score >= greedyTwoPlyValue);
});

test("findBestMove without a next piece behaves exactly as before (lookahead is opt-in)", () => {
    const grid = emptyGrid();
    const withoutArg = findBestMove(grid, "T", weightsFor({ aggregateHeight: -1 }));
    const withExplicitNull = findBestMove(grid, "T", weightsFor({ aggregateHeight: -1 }), null);
    assert.deepEqual(withoutArg, withExplicitNull);
});

test("enumerateMoves returns every legal placement, each with its own board features", () => {
    const candidates = enumerateMoves(emptyGrid(), "T");
    assert.ok(candidates.length > 1, "a T piece has more than one legal placement on an empty board");
    for (const candidate of candidates) {
        assert.equal(typeof candidate.x, "number");
        assert.equal(typeof candidate.y, "number");
        assert.equal(typeof candidate.orientationIndex, "number");
        assert.equal(typeof candidate.linesCleared, "number");
        assert.ok(candidate.resultingGrid);
        for (const key of FEATURE_ORDER) {
            assert.equal(typeof candidate.features[key], "number");
        }
    }
});

test("enumerateMoves returns an empty array exactly when findBestMove returns null", () => {
    const fullGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(1));
    assert.deepEqual(enumerateMoves(fullGrid, "O"), []);
    assert.equal(findBestMove(fullGrid, "O", weightsFor({})), null);
});

test("findBestMove picks exactly the candidate enumerateMoves would score highest", () => {
    const grid = emptyGrid();
    const genome = weightsFor({ aggregateHeight: -1, holes: -5, bumpiness: -1 });
    const best = findBestMove(grid, "S", genome);
    const scored = enumerateMoves(grid, "S").map((candidate) => ({
        candidate,
        score: scoreFeatures(candidate.features, genome.weights)
    }));
    const expectedBest = scored.reduce((top, entry) => (entry.score > top.score ? entry : top));
    assert.equal(best.x, expectedBest.candidate.x);
    assert.equal(best.orientationIndex, expectedBest.candidate.orientationIndex);
    assert.ok(Math.abs(best.score - expectedBest.score) < 1e-9);
});
