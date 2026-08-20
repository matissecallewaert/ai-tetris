import { COLS, ROWS, scoreForLineClear } from "../constants.js";
import { createSevenBagRandomizer } from "../tetris.js";
import { canSpawn, findBestMove } from "./move-search.js";

export const DEFAULT_MAX_MOVES = 5000;

function emptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

export function playEpisode(genome, { rng = Math.random, maxMoves = DEFAULT_MAX_MOVES } = {}) {
    const bag = createSevenBagRandomizer(rng);
    let grid = emptyGrid();
    let score = 0;
    let linesCleared = 0;
    let movesTaken = 0;
    let terminationReason = "move-limit";
    while (movesTaken < maxMoves) {
        const pieceKey = bag.next();
        if (!canSpawn(grid, pieceKey)) {
            terminationReason = "death";
            break;
        }
        const best = findBestMove(grid, pieceKey, genome, bag.peek());
        if (!best) {
            terminationReason = "death";
            break;
        }
        grid = best.resultingGrid;
        linesCleared += best.linesCleared;
        score += scoreForLineClear(best.linesCleared);
        movesTaken += 1;
    }
    return { score, movesTaken, linesCleared, terminationReason };
}
