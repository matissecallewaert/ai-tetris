import assert from "node:assert/strict";
import test from "node:test";
import { COLS, ROWS, SCORE_TABLE, SHAPES } from "../../scripts/modules/constants.js";
import Tetris from "../../scripts/modules/tetris.js";
function emptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}
function cloneMatrix(matrix) {
    return matrix.map((row) => [...row]);
}
function rotateClockwise(matrix) {
    const result = Array.from(
        { length: matrix[0].length },
        () => Array(matrix.length).fill(0)
    );
    for (let y = 0; y < matrix.length; y += 1) {
        for (let x = 0; x < matrix[y].length; x += 1) {
            result[x][matrix.length - y - 1] = matrix[y][x];
        }
    }
    return result;
}
function stateFor(pieceKey, x = 3, y = 0) {
    return { x, y, shape: cloneMatrix(SHAPES[pieceKey]) };
}
function keyedStateFor(pieceKey, x = 3, y = 0) {
    return {
        x,
        y,
        shape: { [pieceKey]: cloneMatrix(SHAPES[pieceKey]) },
        linesCleared: 0
    };
}
function clearActiveCells(grid, shapeState) {
    const result = Tetris.cloneGrid(grid);
    const matrix = Object.values(shapeState.shape)[0];
    for (let y = 0; y < matrix.length; y += 1) {
        for (let x = 0; x < matrix[y].length; x += 1) {
            if (matrix[y][x] !== 0) {
                result[shapeState.y + y][shapeState.x + x] = 0;
            }
        }
    }
    return result;
}
test("Tetris.collides detects boundaries, locked cells, and valid space", async (t) => {
    const grid = emptyGrid();
    await t.test("left and top boundary placements", () => {
        assert.equal(Tetris.collides(grid, stateFor("T", 0, 0)), false);
        assert.equal(Tetris.collides(grid, stateFor("T", 3, -1)), true);
        assert.equal(Tetris.collides(grid, stateFor("T", 3, 0)), false);
    });
    await t.test("off the left edge", () => {
        assert.equal(Tetris.collides(grid, stateFor("T", -1, 0)), true);
    });
    await t.test("off the right edge", () => {
        assert.equal(Tetris.collides(grid, stateFor("I", COLS - 3, 0)), true);
    });
    await t.test("exactly against the right edge", () => {
        assert.equal(Tetris.collides(grid, stateFor("I", COLS - 4, 0)), false);
    });
    await t.test("boundary violation detected even when the overhanging cell is zero", () => {
        const rightOverhang = { x: COLS - 1, y: 0, shape: [[1, 0]] };
        assert.equal(Tetris.collides(grid, rightOverhang), true);
        const bottomOverhang = { x: 0, y: ROWS - 1, shape: [[1], [0]] };
        assert.equal(Tetris.collides(grid, bottomOverhang), true);
    });
    await t.test("off the bottom edge", () => {
        assert.equal(Tetris.collides(grid, stateFor("O", 3, ROWS - 1)), true);
    });
    await t.test("exactly against the bottom edge", () => {
        assert.equal(Tetris.collides(grid, stateFor("O", 3, ROWS - 2)), false);
    });
    await t.test("overlap with a locked cell", () => {
        grid[1][4] = 7;
        assert.equal(Tetris.collides(grid, stateFor("O", 3, 0)), true);
    });
    await t.test("valid placement on an empty grid", () => {
        assert.equal(Tetris.collides(emptyGrid(), stateFor("L", 3, 5)), false);
    });
    await t.test("locked cell under a zero matrix entry", () => {
        const zeroEntryGrid = emptyGrid();
        zeroEntryGrid[0][3] = 7;
        assert.equal(Tetris.collides(zeroEntryGrid, stateFor("T", 3, 0)), false);
    });
});
test("Tetris.placeShape returns a placed clone without mutating its input", () => {
    const grid = emptyGrid();
    grid[6][4] = 7;
    const before = Tetris.cloneGrid(grid);
    const placed = Tetris.placeShape(grid, stateFor("T", 4, 6));
    const expected = Tetris.cloneGrid(before);
    expected[6][5] = 6;
    expected[7][4] = 6;
    expected[7][5] = 6;
    expected[7][6] = 6;
    assert.deepEqual(grid, before);
    assert.deepEqual(placed, expected);
    assert.notStrictEqual(placed, grid);
    assert.equal(new Set(placed).size, placed.length);
    for (let y = 0; y < placed.length; y += 1) {
        assert.notStrictEqual(placed[y], grid[y]);
        placed[y][0] = y + 20;
    }
    assert.deepEqual(grid, before);
});
test("Tetris.clearFullRows removes a row and shifts rows above down", () => {
    const grid = emptyGrid();
    grid[ROWS - 1].fill(3);
    grid[ROWS - 2][2] = 6;
    const before = Tetris.cloneGrid(grid);
    const result = Tetris.clearFullRows(grid);
    assert.equal(result.linesCleared, 1);
    assert.equal(result.grid[ROWS - 1][2], 6);
    assert.ok(result.grid[0].every((cell) => cell === 0));
    assert.deepEqual(grid, before);
});
for (const lineCount of [2, 3, 4]) {
    test(`Tetris.clearFullRows returns the exact ${lineCount}-row result`, () => {
        const grid = emptyGrid();
        for (let y = ROWS - lineCount; y < ROWS; y += 1) {
            grid[y].fill(1);
        }
        grid[ROWS - lineCount - 1][0] = 7;
        grid[2][lineCount] = lineCount;
        const before = Tetris.cloneGrid(grid);
        const expected = [
            ...Array.from({ length: lineCount }, () => Array(COLS).fill(0)),
            ...before.slice(0, ROWS - lineCount)
        ];
        const result = Tetris.clearFullRows(grid);
        assert.equal(result.linesCleared, lineCount);
        assert.deepEqual(result.grid, expected);
        assert.equal(new Set(result.grid).size, result.grid.length);
        for (let y = 0; y < result.grid.length; y += 1) {
            assert.notStrictEqual(result.grid[y], grid[y]);
            result.grid[y][0] = y + 30;
        }
        assert.deepEqual(grid, before);
    });
}
test("Tetris.clearFullRows preserves non-full rows around separated clears", () => {
    const grid = emptyGrid();
    grid[4][1] = 2;
    grid[5].fill(1);
    grid[9][3] = 4;
    grid[12].fill(7);
    grid[17][8] = 6;
    const expectedRows = grid.filter((row) => row.some((cell) => cell === 0));
    const result = Tetris.clearFullRows(grid);
    assert.equal(result.linesCleared, 2);
    assert.deepEqual(result.grid.slice(2), expectedRows);
});
test("instance placement and movement preserve live grid references", () => {
    const tetris = new Tetris(() => 0.4);
    const gridReference = tetris.grid;
    const rowReferences = [...tetris.grid];
    tetris.applyShape();
    assert.strictEqual(tetris.grid, gridReference);
    for (let y = 0; y < ROWS; y += 1) {
        assert.strictEqual(tetris.grid[y], rowReferences[y]);
    }
    const beforeGhost = Tetris.cloneGrid(tetris.grid);
    tetris.endUp();
    assert.strictEqual(tetris.grid, gridReference);
    assert.deepEqual(tetris.grid, beforeGhost);
    for (let y = 0; y < ROWS; y += 1) {
        assert.strictEqual(tetris.grid[y], rowReferences[y]);
    }
    tetris.moveLeft();
    tetris.moveRight();
    tetris.moveDown();
    assert.strictEqual(tetris.grid, gridReference);
    for (let y = 0; y < ROWS; y += 1) {
        assert.strictEqual(tetris.grid[y], rowReferences[y]);
    }
});
test("rotation helpers are stable, unique, and non-mutating", () => {
    const expectedCounts = { O: 1, I: 2, S: 2, Z: 2, J: 4, L: 4, T: 4 };
    for (const [pieceKey, count] of Object.entries(expectedCounts)) {
        const source = cloneMatrix(SHAPES[pieceKey]);
        const sourceBefore = cloneMatrix(source);
        const orientations = Tetris.getOrientations(pieceKey);
        const freshOrientations = Tetris.getOrientations(pieceKey);
        const freshBefore = freshOrientations.map(cloneMatrix);
        assert.equal(orientations.length, count);
        assert.equal(new Set(orientations.map(JSON.stringify)).size, count);
        let expectedOrientation = sourceBefore;
        for (let index = 0; index < orientations.length; index += 1) {
            assert.deepEqual(orientations[index], expectedOrientation);
            assert.notStrictEqual(orientations[index], freshOrientations[index]);
            for (let row = 0; row < orientations[index].length; row += 1) {
                assert.notStrictEqual(
                    orientations[index][row],
                    freshOrientations[index][row]
                );
            }
            expectedOrientation = rotateClockwise(expectedOrientation);
        }
        const rows = orientations.flatMap((matrix) => matrix);
        assert.equal(new Set(rows).size, rows.length);
        assert.deepEqual(source, sourceBefore);
        assert.notStrictEqual(orientations[0], SHAPES[pieceKey]);
        assert.notStrictEqual(orientations[0][0], SHAPES[pieceKey][0]);
        let rotated = source;
        for (let turn = 0; turn < 4; turn += 1) {
            const previous = rotated;
            rotated = Tetris.rotateMatrix(rotated);
            assert.notStrictEqual(rotated, previous);
        }
        assert.deepEqual(rotated, sourceBefore);
        const otherOrientationsBefore = orientations.slice(1).map(cloneMatrix);
        orientations[0][0][0] = 99;
        assert.deepEqual(orientations.slice(1), otherOrientationsBefore);
        assert.deepEqual(freshOrientations, freshBefore);
        assert.deepEqual(SHAPES[pieceKey], sourceBefore);
    }
    assert.equal(Object.isFrozen(SHAPES), true);
    for (const matrix of Object.values(SHAPES)) {
        assert.equal(Object.isFrozen(matrix), true);
        assert.equal(Object.isFrozen(matrix[0]), false);
    }
});
test("rotating an engine piece cannot mutate templates or another piece", () => {
    const tetris = new Tetris(() => 0.5);
    const otherPiece = keyedStateFor("T");
    const otherBefore = cloneMatrix(otherPiece.shape.T);
    const templateBefore = cloneMatrix(SHAPES.T);
    tetris.currentShape = keyedStateFor("T");
    tetris.grid = emptyGrid();
    tetris.applyShape();
    tetris.rotate();
    assert.deepEqual(otherPiece.shape.T, otherBefore);
    assert.deepEqual(SHAPES.T, templateBefore);
    assert.notDeepEqual(tetris.currentShape.shape.T, templateBefore);
});
test("instance rotation retains the legacy right-wall-only adjustment", () => {
    const tetris = new Tetris(() => 0.5);
    tetris.grid = emptyGrid();
    tetris.currentShape = {
        ...keyedStateFor("I", COLS - 1, 0),
        shape: { I: [[3], [3], [3], [3]] }
    };
    tetris.applyShape();
    tetris.rotate();
    assert.equal(tetris.currentShape.x, COLS - 4);
    assert.deepEqual(tetris.currentShape.shape.I, SHAPES.I);
    tetris.removeShape(tetris.currentShape);
    tetris.grid[2][3] = 7;
    tetris.currentShape = keyedStateFor("T", 3, 0);
    tetris.applyShape();
    const beforeBlockedRotation = cloneMatrix(tetris.currentShape.shape.T);
    tetris.rotate();
    assert.deepEqual(tetris.currentShape.shape.T, beforeBlockedRotation);
});
test("the score table and legacy effective clear totals remain unchanged", () => {
    assert.deepEqual(SCORE_TABLE, { 0: 0, 1: 0, 2: 100, 3: 600, 4: 3100 });
    const effectiveTotals = { 1: 100, 2: 300, 3: 900, 4: 3500 };
    for (const [lineCountText, expectedScore] of Object.entries(effectiveTotals)) {
        const lineCount = Number(lineCountText);
        const tetris = new Tetris(() => 0.25);
        tetris.grid = emptyGrid();
        for (let y = ROWS - lineCount; y < ROWS; y += 1) {
            tetris.grid[y].fill(1);
        }
        tetris.updateScore();
        assert.equal(tetris.score, expectedScore);
        assert.equal(tetris.currentShape.linesCleared, lineCount);
    }
});
test("drop bonus uses starting y across floors and obstacles", () => {
    const cases = [
        { startY: 0, landingY: ROWS - 2 },
        { startY: 5, landingY: ROWS - 2 },
        { startY: 17, landingY: ROWS - 2 },
        { startY: 2, obstacleY: 15, landingY: 13 }
    ];
    for (const { startY, obstacleY, landingY } of cases) {
        const tetris = new Tetris(() => 0.75);
        tetris.grid = emptyGrid();
        if (obstacleY !== undefined) {
            tetris.grid[obstacleY][3] = 7;
            tetris.grid[obstacleY][4] = 7;
        }
        tetris.currentShape = keyedStateFor("O", 3, startY);
        tetris.applyShape();
        tetris.drop();
        assert.equal(tetris.score, (ROWS - startY) * 2);
        assert.equal(tetris.grid[landingY][3], 4);
        assert.equal(tetris.grid[landingY + 1][4], 4);
    }
});
test("hold swaps pieces and blocks a second hold until the next piece", () => {
    const tetris = new Tetris(() => 0.42);
    const { currentShape: initialCurrent, grid: initialGrid } = tetris;
    const initialGridContents = Tetris.cloneGrid(tetris.grid);
    tetris.useHoldShape();
    assert.strictEqual(tetris.currentShape, initialCurrent);
    assert.equal(tetris.holdShape, undefined);
    assert.equal(tetris.holding, false);
    assert.strictEqual(tetris.grid, initialGrid);
    assert.deepEqual(tetris.grid, initialGridContents);
    tetris.applyShape();
    const firstKey = Object.keys(tetris.currentShape.shape)[0];
    const nextKey = Object.keys(tetris.upcomingShape.shape)[0];
    tetris.setHoldShape();
    assert.equal(Object.keys(tetris.holdShape.shape)[0], firstKey);
    assert.equal(Object.keys(tetris.currentShape.shape)[0], nextKey);
    assert.equal(tetris.holding, true);
    const heldAfterFirst = tetris.holdShape;
    const currentAfterFirst = tetris.currentShape;
    const gridAfterFirst = Tetris.cloneGrid(tetris.grid);
    tetris.setHoldShape();
    tetris.useHoldShape();
    assert.strictEqual(tetris.holdShape, heldAfterFirst);
    assert.strictEqual(tetris.currentShape, currentAfterFirst);
    assert.deepEqual(tetris.grid, gridAfterFirst);
    tetris.removeShape(tetris.currentShape);
    tetris.nextShape();
    assert.equal(tetris.holding, false);
    tetris.removeShape(tetris.currentShape);
    tetris.currentShape.x = 5;
    tetris.currentShape.y = 4;
    tetris.applyShape();
    const outgoingKey = Object.keys(tetris.currentShape.shape)[0];
    tetris.useHoldShape();
    assert.equal(Object.keys(tetris.currentShape.shape)[0], firstKey);
    assert.equal(Object.keys(tetris.holdShape.shape)[0], outgoingKey);
    assert.deepEqual(
        { x: tetris.currentShape.x, y: tetris.currentShape.y },
        { x: 5, y: 4 }
    );
    assert.deepEqual(
        { x: tetris.holdShape.x, y: tetris.holdShape.y },
        { x: 5, y: 4 }
    );
    assert.equal(tetris.holding, true);
    const currentAfterSwap = tetris.currentShape;
    const heldAfterSwap = tetris.holdShape;
    const gridAfterSwap = Tetris.cloneGrid(tetris.grid);
    tetris.useHoldShape();
    assert.strictEqual(tetris.currentShape, currentAfterSwap);
    assert.strictEqual(tetris.holdShape, heldAfterSwap);
    assert.deepEqual(tetris.grid, gridAfterSwap);
});
test("reset restores a fresh engine while retaining the active-grid lifecycle", () => {
    const tetris = new Tetris(() => 0.6);
    const previousBag = tetris.bag;
    const previousGrid = tetris.grid;
    tetris.score = 999;
    tetris.died = true;
    tetris.speed = 200;
    tetris.holding = true;
    tetris.movesTaken = 42;
    tetris.ground = true;
    tetris.tetrisReset = false;
    tetris.holdShape = keyedStateFor("Z");
    tetris.currentShape.linesCleared = 9;
    tetris.currentShape.lost = true;
    tetris.oldShape.linesCleared = 8;
    tetris.oldShape.lost = true;
    tetris.nextBag = [{ sentinel: true }];
    tetris.grid[ROWS - 1].fill(7);
    tetris.reset();
    assert.notStrictEqual(tetris.grid, previousGrid);
    assert.equal(new Set(tetris.grid).size, ROWS);
    assert.equal(tetris.score, 0);
    assert.equal(tetris.died, false);
    assert.equal(tetris.speed, 700);
    assert.equal(tetris.holding, false);
    assert.equal(tetris.holdShape, undefined);
    assert.equal(tetris.movesTaken, 0);
    assert.equal(tetris.ground, false);
    assert.equal(tetris.tetrisReset, true);
    assert.notStrictEqual(tetris.bag, previousBag);
    assert.equal(tetris.bag.length, 7);
    assert.equal(tetris.bagindex, 1);
    assert.equal(tetris.nextBag, undefined);
    assert.ok(tetris.currentShape.shape);
    assert.ok(tetris.upcomingShape.shape);
    assert.equal(tetris.currentShape.linesCleared, 0);
    assert.equal(tetris.currentShape.lost, false);
    assert.equal(tetris.upcomingShape.linesCleared, 0);
    assert.equal(tetris.upcomingShape.lost, false);
    assert.equal(tetris.oldShape.linesCleared, 0);
    assert.equal(tetris.oldShape.lost, false);
    assert.notStrictEqual(tetris.oldShape, tetris.currentShape);
    const currentKey = Object.keys(tetris.currentShape.shape)[0];
    const oldKey = Object.keys(tetris.oldShape.shape)[0];
    assert.equal(oldKey, currentKey);
    assert.notStrictEqual(
        tetris.oldShape.shape[oldKey],
        tetris.currentShape.shape[currentKey]
    );
    assert.notStrictEqual(
        tetris.oldShape.shape[oldKey][0],
        tetris.currentShape.shape[currentKey][0]
    );
    assert.ok(tetris.grid.flat().some((cell) => cell !== 0));
    const lockedOnly = clearActiveCells(tetris.grid, tetris.currentShape);
    assert.ok(lockedOnly.flat().every((cell) => cell === 0));
});
