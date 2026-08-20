import {
    COLORS,
    COLS,
    DROP_SCORE_MULTIPLIER,
    LINE_CLEAR_SCORE,
    ROTATION_ROLLBACK_TURNS,
    ROWS,
    SCORE_TABLE,
    SHAPES,
    SPAWN_X,
    START_SPEED
} from "./constants.js";
function cloneMatrix(matrix) {
    return matrix.map((row) => [...row]);
}
function getMatrix(shape) {
    return Array.isArray(shape) ? shape : Object.values(shape)[0];
}
function getPieceKey(shape) {
    return Array.isArray(shape) ? undefined : Object.keys(shape)[0];
}
function clonePiece(pieceKey) {
    return { [pieceKey]: cloneMatrix(SHAPES[pieceKey]) };
}
function createShapeState(pieceKey) {
    return {
        x: SPAWN_X,
        y: 0,
        shape: clonePiece(pieceKey),
        linesCleared: 0,
        lost: false
    };
}
function shuffledPieceKeys(rng) {
    const keys = Object.keys(SHAPES);
    for (let index = keys.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(rng() * (index + 1));
        [keys[index], keys[swapIndex]] = [keys[swapIndex], keys[index]];
    }
    return keys;
}
export function createSevenBagRandomizer(rng = Math.random) {
    let bag = [];
    let index = 0;
    function ensureBag() {
        if (index >= bag.length) {
            bag = shuffledPieceKeys(rng);
            index = 0;
        }
    }
    return {
        next() {
            ensureBag();
            const pieceKey = bag[index];
            index += 1;
            return pieceKey;
        },
        peek() {
            ensureBag();
            return bag[index];
        }
    };
}
export default class Tetris {
    static cloneGrid(grid) {
        return grid.map((row) => [...row]);
    }
    static collides(grid, shapeState) {
        const matrix = getMatrix(shapeState.shape);
        const width = matrix[0].length;
        const height = matrix.length;
        if (
            shapeState.x < 0 ||
            shapeState.x + width > grid[0].length ||
            shapeState.y < 0 ||
            shapeState.y + height > grid.length
        ) {
            return true;
        }
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                if (
                    matrix[y][x] !== 0 &&
                    grid[shapeState.y + y][shapeState.x + x] !== 0
                ) {
                    return true;
                }
            }
        }
        return false;
    }
    static placeShape(grid, shapeState) {
        const placedGrid = Tetris.cloneGrid(grid);
        const matrix = getMatrix(shapeState.shape);
        for (let y = 0; y < matrix.length; y += 1) {
            for (let x = 0; x < matrix[y].length; x += 1) {
                if (matrix[y][x] !== 0) {
                    placedGrid[shapeState.y + y][shapeState.x + x] = matrix[y][x];
                }
            }
        }
        return placedGrid;
    }
    static clearFullRows(grid) {
        const remainingRows = grid
            .filter((row) => row.some((cell) => cell === 0))
            .map((row) => [...row]);
        const linesCleared = grid.length - remainingRows.length;
        const width = grid[0]?.length ?? COLS;
        const emptyRows = Array.from(
            { length: linesCleared },
            () => Array(width).fill(0)
        );
        return { grid: [...emptyRows, ...remainingRows], linesCleared };
    }
    static rotateMatrix(matrix) {
        return matrix[0].map((_, x) => (
            matrix.map((row) => row[x]).reverse()
        ));
    }
    static getOrientations(pieceKey) {
        if (!SHAPES[pieceKey]) {
            throw new RangeError(`Unknown piece: ${pieceKey}`);
        }
        const orientations = [];
        let orientation = cloneMatrix(SHAPES[pieceKey]);
        while (!orientations.some((item) => (
            JSON.stringify(item) === JSON.stringify(orientation)
        ))) {
            orientations.push(cloneMatrix(orientation));
            orientation = Tetris.rotateMatrix(orientation);
        }
        return orientations.map(cloneMatrix);
    }
    constructor(rng = Math.random) {
        this.rng = rng;
        this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        this.shapes = Object.fromEntries(
            Object.entries(SHAPES).map(([key, matrix]) => [key, cloneMatrix(matrix)])
        );
        this.colors = [...COLORS];
        this.bag = [];
        this.bagindex = 0;
        this.nextBag = undefined;
        this.generateBag();
        this.score = 0;
        const currentKey = this.consumePieceKey();
        this.currentShape = createShapeState(currentKey);
        this.upcomingShape = createShapeState(this.previewPieceKey());
        this.oldShape = createShapeState(currentKey);
        this.aiActivated = false;
        this.movesTaken = 0;
        this.data = {
            height: [],
            holes: 0,
            blockades: 0,
            linesCleared: 0,
            movesIndex: 0
        };
        this.ground = false;
        this.holdShape = undefined;
        this.holding = false;
        this.speed = START_SPEED;
        this.died = false;
        this.tetrisReset = false;
    }
    generateBag() {
        this.bag = shuffledPieceKeys(this.rng).map(clonePiece);
        this.bagindex = 0;
        this.nextBag = undefined;
        return this.bag;
    }
    ensureNextBag() {
        if (!this.nextBag) {
            this.nextBag = shuffledPieceKeys(this.rng).map(clonePiece);
        }
        return this.nextBag;
    }
    consumePieceKey() {
        if (this.bagindex >= this.bag.length) {
            this.bag = this.ensureNextBag();
            this.nextBag = undefined;
            this.bagindex = 0;
        }
        const pieceKey = getPieceKey(this.bag[this.bagindex]);
        this.bagindex += 1;
        return pieceKey;
    }
    previewPieceKey() {
        const piece = this.bagindex < this.bag.length
            ? this.bag[this.bagindex]
            : this.ensureNextBag()[0];
        return getPieceKey(piece);
    }
    nextShape() {
        this.currentShape = createShapeState(this.consumePieceKey());
        this.upcomingShape = createShapeState(this.previewPieceKey());
        this.movesTaken += 1;
        if (this.collides(this.currentShape)) {
            this.died = true;
        } else {
            this.applyShape();
        }
        this.holding = false;
    }
    setHoldShape() {
        if (this.holding) {
            return;
        }
        this.removeShape(this.currentShape);
        this.holdShape = this.currentShape;
        this.holdShape.x = SPAWN_X;
        this.holdShape.y = 0;
        this.nextShape();
        this.holding = true;
    }
    useHoldShape() {
        if (this.holding || !this.holdShape) {
            return;
        }
        this.removeShape(this.currentShape);
        const heldShape = this.holdShape;
        this.holdShape = this.currentShape;
        this.currentShape = heldShape;
        this.holding = true;
        this.currentShape.x = this.holdShape.x;
        this.currentShape.y = this.holdShape.y;
        const matrix = getMatrix(this.currentShape.shape);
        this.currentShape.x = Math.max(
            0,
            Math.min(this.currentShape.x, COLS - matrix[0].length)
        );
        this.currentShape.y = Math.max(
            0,
            Math.min(this.currentShape.y, ROWS - matrix.length)
        );
        this.applyShape();
    }
    applyShape() {
        const matrix = getMatrix(this.currentShape.shape);
        for (let y = 0; y < matrix.length; y += 1) {
            for (let x = 0; x < matrix[y].length; x += 1) {
                if (matrix[y][x] !== 0) {
                    this.grid[this.currentShape.y + y][this.currentShape.x + x]
                        = matrix[y][x];
                }
            }
        }
    }
    moveDown() {
        this.ground = false;
        this.removeShape(this.currentShape);
        this.currentShape.y += 1;
        if (!this.collides(this.currentShape)) {
            this.applyShape();
            return;
        }
        this.ground = true;
        this.currentShape.y -= 1;
        this.applyShape();
        this.updateScore();
        this.nextShape();
    }
    moveLeft() {
        this.moveHorizontally(-1);
    }
    moveRight() {
        this.moveHorizontally(1);
    }
    moveHorizontally(offset) {
        this.removeShape(this.currentShape);
        this.currentShape.x += offset;
        if (this.collides(this.currentShape)) {
            this.currentShape.x -= offset;
        }
        this.applyShape();
    }
    drop() {
        this.removeShape(this.currentShape);
        this.score += (
            ROWS - this.currentShape.y
        ) * DROP_SCORE_MULTIPLIER;
        while (!this.collides(this.currentShape)) {
            this.currentShape.y += 1;
        }
        this.currentShape.y -= 1;
        this.applyShape();
        this.updateScore();
        this.nextShape();
    }
    rotate() {
        this.removeShape(this.currentShape);
        const pieceKey = getPieceKey(this.currentShape.shape);
        let matrix = Tetris.rotateMatrix(getMatrix(this.currentShape.shape));
        this.currentShape.shape = { [pieceKey]: matrix };
        if (this.collides(this.currentShape) && !this.touchesRightWall()) {
            for (let turn = 0; turn < ROTATION_ROLLBACK_TURNS; turn += 1) {
                matrix = Tetris.rotateMatrix(matrix);
            }
            this.currentShape.shape = { [pieceKey]: matrix };
        }
        while (this.touchesRightWall()) {
            this.currentShape.x -= 1;
        }
        this.applyShape();
    }
    touchesRightWall() {
        return (
            this.currentShape.x + getMatrix(this.currentShape.shape)[0].length
            > this.grid[0].length
        );
    }
    removeRow(y) {
        this.grid[y] = Array(COLS).fill(0);
        let rowIndex = y - 1;
        while (this.grid[rowIndex]?.some((cell) => cell !== 0)) {
            for (let x = 0; x < COLS; x += 1) {
                this.grid[rowIndex + 1][x] = this.grid[rowIndex][x];
                this.grid[rowIndex][x] = 0;
            }
            rowIndex -= 1;
        }
    }
    collides(shape) {
        return Tetris.collides(this.grid, shape);
    }
    updateScore() {
        let linesCleared = 0;
        for (let y = 0; y < ROWS; y += 1) {
            if (this.grid[y].every((item) => item !== 0)) {
                linesCleared += 1;
                this.removeRow(y);
                this.currentShape.linesCleared += 1;
                this.score += LINE_CLEAR_SCORE;
            }
        }
        this.score += SCORE_TABLE[linesCleared];
    }
    removeShape(shape) {
        const matrix = getMatrix(shape.shape);
        for (let y = 0; y < matrix.length; y += 1) {
            for (let x = 0; x < matrix[y].length; x += 1) {
                if (matrix[y][x] !== 0) {
                    this.grid[shape.y + y][shape.x + x] = 0;
                }
            }
        }
    }
    transpose() {
        const pieceKey = getPieceKey(this.currentShape.shape);
        const matrix = getMatrix(this.currentShape.shape);
        const transposed = matrix[0].map((_, x) => (
            matrix.map((row) => row[x])
        ));
        this.currentShape.shape = { [pieceKey]: transposed };
    }
    endUp() {
        this.removeShape(this.currentShape);
        const endShape = {
            x: this.currentShape.x,
            y: this.currentShape.y,
            shape: this.currentShape.shape
        };
        while (!this.collides(endShape)) {
            endShape.y += 1;
        }
        this.applyShape();
        return endShape;
    }
    reset() {
        this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        this.generateBag();
        this.score = 0;
        const currentKey = this.consumePieceKey();
        this.currentShape = createShapeState(currentKey);
        this.upcomingShape = createShapeState(this.previewPieceKey());
        this.oldShape = createShapeState(currentKey);
        this.holdShape = undefined;
        this.applyShape();
        this.movesTaken = 0;
        this.speed = START_SPEED;
        this.died = false;
        this.holding = false;
        this.ground = false;
        this.tetrisReset = true;
    }
}
