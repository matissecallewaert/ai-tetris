import { ROWS, SHAPES, SPAWN_X } from "../constants.js";
import Tetris from "../tetris.js";
import { evaluateBoard } from "./board-evaluator.js";
import { scoreGenome } from "./genome-scoring.js";

export function canSpawn(grid, pieceKey) {
    return !Tetris.collides(grid, { x: SPAWN_X, y: 0, shape: SHAPES[pieceKey] });
}

export function countErodedCells(placedGrid, matrix, y, linesCleared) {
    if (linesCleared === 0) {
        return 0;
    }
    let pieceCellsCleared = 0;
    for (let matrixRow = 0; matrixRow < matrix.length; matrixRow += 1) {
        if (!placedGrid[y + matrixRow].every((cell) => cell !== 0)) {
            continue;
        }
        for (let x = 0; x < matrix[matrixRow].length; x += 1) {
            if (matrix[matrixRow][x] !== 0) {
                pieceCellsCleared += 1;
            }
        }
    }
    return linesCleared * pieceCellsCleared;
}

export function enumerateMoves(grid, pieceKey) {
    const orientations = Tetris.getOrientations(pieceKey);
    const candidates = [];
    for (let orientationIndex = 0; orientationIndex < orientations.length; orientationIndex += 1) {
        const matrix = orientations[orientationIndex];
        const width = matrix[0].length;
        for (let x = 0; x <= grid[0].length - width; x += 1) {
            if (Tetris.collides(grid, { x, y: 0, shape: matrix })) {
                continue;
            }
            let y = 0;
            while (!Tetris.collides(grid, { x, y: y + 1, shape: matrix })) {
                y += 1;
            }
            const placedGrid = Tetris.placeShape(grid, { x, y, shape: matrix });
            const { grid: resultingGrid, linesCleared } = Tetris.clearFullRows(placedGrid);
            const landingHeight = ROWS - (y + matrix.length / 2);
            const erodedCells = countErodedCells(placedGrid, matrix, y, linesCleared);
            const features = evaluateBoard(resultingGrid, { linesCleared, landingHeight, erodedCells });
            candidates.push({ x, y, orientationIndex, linesCleared, resultingGrid, features });
        }
    }
    return candidates;
}

function bestScoreAfterNextPiece(grid, nextPieceKey, genome) {
    const nextBest = findBestMove(grid, nextPieceKey, genome);
    return nextBest ? nextBest.score : -Infinity;
}

export function findBestMove(grid, pieceKey, genome, nextPieceKey = null) {
    let best = null;
    for (const candidate of enumerateMoves(grid, pieceKey)) {
        const immediateScore = scoreGenome(candidate.features, genome);
        const score = nextPieceKey
            ? bestScoreAfterNextPiece(candidate.resultingGrid, nextPieceKey, genome)
            : immediateScore;
        if (!best || score > best.score) {
            best = {
                x: candidate.x,
                y: candidate.y,
                orientationIndex: candidate.orientationIndex,
                linesCleared: candidate.linesCleared,
                resultingGrid: candidate.resultingGrid,
                score
            };
        }
    }
    return best;
}
