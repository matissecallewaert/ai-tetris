import { FEATURE_ORDER } from "./feature-schema.js";

function computeColumnStats(grid) {
    const width = grid[0].length;
    const height = grid.length;
    const heights = new Array(width).fill(0);
    let holes = 0;
    let blockades = 0;
    for (let x = 0; x < width; x += 1) {
        let firstBlockRow = -1;
        let topmostHoleRow = -1;
        for (let y = 0; y < height; y += 1) {
            const filled = grid[y][x] !== 0;
            if (filled && firstBlockRow === -1) {
                firstBlockRow = y;
                heights[x] = height - y;
            }
            if (firstBlockRow !== -1 && !filled) {
                holes += 1;
                if (topmostHoleRow === -1) {
                    topmostHoleRow = y;
                }
            }
        }
        if (topmostHoleRow !== -1) {
            for (let y = firstBlockRow; y < topmostHoleRow; y += 1) {
                if (grid[y][x] !== 0) {
                    blockades += 1;
                }
            }
        }
    }
    return { heights, holes, blockades };
}

function computeBumpiness(heights) {
    let bumpiness = 0;
    for (let x = 0; x < heights.length - 1; x += 1) {
        bumpiness += Math.abs(heights[x] - heights[x + 1]);
    }
    return bumpiness;
}

function countRowTransitions(grid) {
    let transitions = 0;
    for (let y = 0; y < grid.length; y += 1) {
        let previous = 1;
        for (let x = 0; x < grid[y].length; x += 1) {
            const current = grid[y][x] !== 0 ? 1 : 0;
            if (current !== previous) {
                transitions += 1;
            }
            previous = current;
        }
        if (previous !== 1) {
            transitions += 1;
        }
    }
    return transitions;
}

function countColumnTransitions(grid) {
    const width = grid[0].length;
    let transitions = 0;
    for (let x = 0; x < width; x += 1) {
        let previous = 0;
        for (let y = 0; y < grid.length; y += 1) {
            const current = grid[y][x] !== 0 ? 1 : 0;
            if (current !== previous) {
                transitions += 1;
            }
            previous = current;
        }
        if (previous !== 1) {
            transitions += 1;
        }
    }
    return transitions;
}

export function evaluateBoard(grid, { linesCleared, landingHeight = 0, erodedCells = 0 }) {
    const { heights, holes, blockades } = computeColumnStats(grid);
    const aggregateHeight = heights.reduce((sum, value) => sum + value, 0);
    const maxHeight = heights.length ? Math.max(...heights) : 0;
    const minHeight = heights.length ? Math.min(...heights) : 0;
    return {
        aggregateHeight,
        maxHeight,
        relativeHeight: maxHeight - minHeight,
        linesCleared,
        holes,
        blockades,
        bumpiness: computeBumpiness(heights),
        rowTransitions: countRowTransitions(grid),
        columnTransitions: countColumnTransitions(grid),
        landingHeight,
        erodedCells
    };
}

export function scoreFeatures(features, weights) {
    return FEATURE_ORDER.reduce(
        (total, key, index) => total + features[key] * weights[index],
        0
    );
}
