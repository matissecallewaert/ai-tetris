import Tetris from "./modules/tetris.js";
import Sound from "./modules/sound.js";
import { arrowKeysHandler, createKeyHandler } from "./modules/input.js";
import { clearCanvas, createScaledContext, drawGridLines, drawGridSnapshot, drawShape } from "./modules/renderer.js";
import { getOrInitNumber, setHighScoreIfHigher } from "./modules/storage.js";
import {
    BLOCK_SIZE_DIVISOR, CANVAS_BORDER_OFFSET, CLOCK_SECOND_MS, COLORS, COLS,
    FRAME_RATE, GAME_TIME_INCREMENT, GAME_TIMER_INTERVAL_MS, GHOST_COLOR,
    GHOST_Y_OFFSET, GRID_COLOR,
    HOLD_PREVIEW_HEIGHT, MIN_SPEED, NEXT_PREVIEW_HEIGHT, PREVIEW_WIDTH, ROWS,
    PLAYER_HIGH_SCORE_KEY, SPEED_SCORE_INTERVAL, SPEED_STEP
} from "./modules/constants.js";

const blockSize = window.innerHeight / BLOCK_SIZE_DIVISOR;
let boardContext;
let upcomingContext;
let holdingContext;
let tetris;
let scoreboard;
let gameOverScreen;
let playing = false;
let playSound = true;
let moveInterval;
let gameTimer;
let previousScore = 0;
let totalGameTime = 0;

const sound = new Sound(document.getElementById("sound-div"));
const buttonSound = sound.create("assets/sounds/block-rotate.mp3", "button_sound");
const rotateSound = sound.create("assets/sounds/select.mp3", "rotate_sound");
const moveSound = sound.create("assets/sounds/whoosh.mp3", "move_sound");

function imageFeedback(id, name) {
    return {
        element: document.getElementById(id),
        pressedSrc: `assets/images/${name}-pressed.png`,
        releasedSrc: `assets/images/${name}.png`
    };
}

const keyHandler = createKeyHandler({
    isPlaying: () => playing,
    onMoveDown: () => tetris.moveDown(false),
    onMoveLeft: () => {
        tetris.moveLeft();
        moveSound.play();
    },
    onMoveRight: () => {
        tetris.moveRight();
        moveSound.play();
    },
    onRotate: () => {
        tetris.rotate();
        rotateSound.play();
    },
    onDrop: () => {
        tetris.drop(false);
        buttonSound.play();
    },
    onHold: () => {
        if (!tetris.holding) {
            if (tetris.holdShape === undefined) {
                tetris.setHoldShape();
            } else {
                tetris.useHoldShape();
            }
        }
    },
    feedback: {
        down: imageFeedback("arrow-down", "down-arrow"),
        left: imageFeedback("arrow-left", "left-arrow"),
        right: imageFeedback("arrow-right", "right-arrow"),
        up: imageFeedback("arrow-up", "up-arrow"),
        space: imageFeedback("space", "space"),
        shift: imageFeedback("shift", "shift")
    }
});

function startGame() {
    gameTimer = setInterval(() => {
        totalGameTime += GAME_TIME_INCREMENT;
    }, GAME_TIMER_INTERVAL_MS);
    if (tetris.died) {
        resetGame();
    }
    clearInterval(moveInterval);
    moveInterval = setInterval(move, tetris.speed, tetris);
    playing = true;
    playSound = true;
    buttonSound.play();
    gameOverScreen.setAttribute("visibility", "hidden");
}

function resetGame() {
    clearInterval(moveInterval);
    tetris.reset();
    playing = false;
    playSound = true;
    buttonSound.play();
    previousScore = 0;
    gameOverScreen.setAttribute("visibility", "hidden");
}

function pauseGame() {
    clearInterval(moveInterval);
    clearInterval(gameTimer);
    playing = false;
    if (playSound) {
        buttonSound.play();
    }
}

function move(game) {
    game.moveDown(false);
    if (game.speed > MIN_SPEED) {
        updateSpeed(game);
    }
}

function updateSpeed(game) {
    if (game.score >= previousScore + SPEED_SCORE_INTERVAL) {
        clearInterval(moveInterval);
        game.speed -= SPEED_STEP;
        moveInterval = setInterval(move, game.speed, game);
        previousScore = game.score;
    }
}

function drawPreview(context, shapeState, height) {
    clearCanvas(context, PREVIEW_WIDTH, height);
    if (shapeState?.shape) {
        drawShape(context, { x: 0, y: 0, shape: shapeState.shape }, COLORS);
    }
}

function render(game) {
    if (game.died) {
        if (totalGameTime !== 0) {
            const highScore = setHighScoreIfHigher(PLAYER_HIGH_SCORE_KEY, game.score);
            document.getElementById("highscore-player").innerText = highScore;
        }
        gameOverScreen.setAttribute("visibility", "visible");
        playSound = false;
        pauseGame();
    }

    clearCanvas(boardContext, COLS, ROWS);
    drawShape(boardContext, game.endUp(), COLORS, GHOST_COLOR, GHOST_Y_OFFSET);
    drawGridSnapshot(boardContext, game.grid, COLORS);
    scoreboard.textContent = game.score;
    drawPreview(upcomingContext, game.upcomingShape, NEXT_PREVIEW_HEIGHT);
    drawPreview(holdingContext, game.holdShape, HOLD_PREVIEW_HEIGHT);
}

function initGridCanvas() {
    const context = document.getElementById("grid").getContext("2d");
    context.canvas.width = COLS * blockSize;
    context.canvas.height = ROWS * blockSize;
    context.strokeStyle = GRID_COLOR;
    drawGridLines(context, COLS, ROWS, blockSize);
}

function init() {
    tetris = new Tetris();
    scoreboard = document.getElementById("scoreboard");
    document.getElementById("highscore-player").textContent = getOrInitNumber(PLAYER_HIGH_SCORE_KEY, 0);
    gameOverScreen = document.getElementById("game-over");
    boardContext = createScaledContext("game-board", COLS, ROWS, blockSize);
    upcomingContext = createScaledContext("upcoming-shape", PREVIEW_WIDTH, NEXT_PREVIEW_HEIGHT, blockSize);
    holdingContext = createScaledContext("holding-shape", PREVIEW_WIDTH, HOLD_PREVIEW_HEIGHT, blockSize);
    initGridCanvas();
    gameOverScreen.setAttribute("height", String(ROWS * blockSize + CANVAS_BORDER_OFFSET));
    gameOverScreen.setAttribute("width", String(COLS * blockSize + CANVAS_BORDER_OFFSET));
    document.getElementById("start-button").addEventListener("click", startGame);
    document.getElementById("pause-button").addEventListener("click", pauseGame);
    document.getElementById("reset-button").addEventListener("click", resetGame);
    document.addEventListener("keydown", keyHandler);
    window.addEventListener("keydown", (event) => arrowKeysHandler(event, playing), false);
    setInterval(render, CLOCK_SECOND_MS / FRAME_RATE, tetris);
    tetris.applyShape();
    sound.muteToggle();
    sound.soundSettings();
}

init();
