import { COLORS, COLS, ROWS, scoreForLineClear } from "../constants.js";
import { createSevenBagRandomizer } from "../tetris.js";
import { clearCanvas, drawGridSnapshot } from "../renderer.js";
import { canSpawn, findBestMove } from "./move-search.js";
import { DEFAULT_MAX_MOVES } from "./play-episode.js";

export const DEFAULT_STEP_INTERVAL_MS = 120;
export { DEFAULT_MAX_MOVES };

function emptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

export function createReplay({
    genome,
    context,
    rng = Math.random,
    maxMoves = DEFAULT_MAX_MOVES,
    stepIntervalMs = DEFAULT_STEP_INTERVAL_MS,
    onStep = () => {},
    onFinish = () => {}
}) {
    const bag = createSevenBagRandomizer(rng);
    let grid = emptyGrid();
    let score = 0;
    let movesTaken = 0;
    let timer = null;

    function render() {
        clearCanvas(context, COLS, ROWS);
        drawGridSnapshot(context, grid, COLORS);
    }

    function stop() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    function step() {
        if (movesTaken >= maxMoves) {
            stop();
            onFinish({ score, movesTaken, terminationReason: "move-limit" });
            return;
        }
        const pieceKey = bag.next();
        if (!canSpawn(grid, pieceKey)) {
            stop();
            onFinish({ score, movesTaken, terminationReason: "death" });
            return;
        }
        const best = findBestMove(grid, pieceKey, genome, bag.peek());
        if (!best) {
            stop();
            onFinish({ score, movesTaken, terminationReason: "death" });
            return;
        }
        grid = best.resultingGrid;
        score += scoreForLineClear(best.linesCleared);
        movesTaken += 1;
        render();
        onStep({ score, movesTaken });
    }

    function start() {
        stop();
        render();
        timer = setInterval(step, stepIntervalMs);
    }

    return { start, stop };
}
