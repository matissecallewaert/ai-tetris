export const COLS = 10;
export const ROWS = 20;

export const SHAPES = Object.freeze({
    L: Object.freeze([[0, 0, 1], [1, 1, 1]]),
    J: Object.freeze([[2, 0, 0], [2, 2, 2]]),
    I: Object.freeze([[3, 3, 3, 3]]),
    O: Object.freeze([[4, 4], [4, 4]]),
    S: Object.freeze([[0, 5, 5], [5, 5, 0]]),
    T: Object.freeze([[0, 6, 0], [6, 6, 6]]),
    Z: Object.freeze([[7, 7, 0], [0, 7, 7]])
});

export const COLORS = [
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFA500",
    "#FFE600",
    "#FF007F",
    "#6A0DAD"
];

export const KEY_CODES = {
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    UP: 38,
    SHIFT: 16
};

export const SCORE_TABLE = { 0: 0, 1: 0, 2: 100, 3: 600, 4: 3100 };

export const BLOCK_SIZE_DIVISOR = 25;
export const CANVAS_BORDER_OFFSET = 5;
export const CLOCK_SECOND_MS = 1000;
export const DROP_SCORE_MULTIPLIER = 2;
export const FRAME_RATE = 60;
export const GAME_TIME_INCREMENT = 0.1;
export const GAME_TIMER_INTERVAL_MS = 100;
export const GHOST_COLOR = "#808080";
export const GHOST_Y_OFFSET = -1;
export const GRID_COLOR = "#484848";
export const HOLD_PREVIEW_HEIGHT = 4;
export const INPUT_FEEDBACK_DURATION_MS = 250;
export const LINE_CLEAR_SCORE = 100;
export const MIN_SPEED = 150;
export const NEXT_PREVIEW_HEIGHT = 2;
export const PREVIEW_WIDTH = 4;
export const PLAYER_HIGH_SCORE_KEY = "highscorePlayer";
export const AI_TRAINING_STORAGE_KEY = "aiTrainingState";
export const AI_ROSTER_STORAGE_KEY = "aiTrainingRoster";
export const ROTATION_ROLLBACK_TURNS = 3;
export const SPAWN_X = 3;
export const SPEED_SCORE_INTERVAL = 4000;
export const SPEED_STEP = 50;
export const START_SPEED = 700;

export function scoreForLineClear(linesCleared) {
    return linesCleared * LINE_CLEAR_SCORE + (SCORE_TABLE[linesCleared] ?? 0);
}
