import Tetris from "./modules/tetris.js"
import Sound from "./modules/sound.js"

//Definitions of variables and constants

let COLS = 10;
let ROWS = 20;
let BLOCK_SIZE = window.innerHeight / 25;

let canvas;
let ctx;

let block_canvas;
let blockctx;

let holding_canvas;
let holdingctx;

let grid_canvas;
let gridctx;
let vorigeScore = 0;

let play = false;
let play_sound = true;
let id2;

let index = 0;

let tetris;
let scorebord;
let loadedData;

let totalGameTime = 0;
let gameTimer;

let gameOverScreen;

// Start of sound effect settings
let sound = new Sound(document.getElementById("sound-div")),
    // Create 5 sound effects: Buttons (Play, Pause, reset), rotate, moveLeft == MoveRight, GameOver, BackgroundMusic
    buttonSound = sound.create("assets/sounds/block-rotate.mp3", "button_sound"),
    rotateSound = sound.create("assets/sounds/select.mp3", "rotate_sound"),
    moveSound = sound.create("assets/sounds/whoosh.mp3", "move_sound");

// Function to handle various keypresses from keyboard
let keyHandler = (k) => {
    if (play) {
        if (k.keyCode === 40) {
            tetris.moveDown(false);
        } else if (k.keyCode === 37) {
            tetris.moveLeft();
            moveSound.play();
        } else if (k.keyCode === 39) {
            tetris.moveRight();
            moveSound.play();
        } else if (k.keyCode === 38) {
            tetris.rotate();
            rotateSound.play();
        } else if (k.key === " ") {
            tetris.drop(false);
            buttonSound.play();
        } else if (k.keyCode === 16) {
            if (tetris.holding === false) {
                if (tetris.holdShape === undefined) {
                    tetris.setHoldShape();
                } else {
                    tetris.useHoldShape();
                }
            }
        }
    }
}

/**
 * Function to disable scrolling on canvas when pressing the arrow keys
 */
let arrowKeysHandler = function (e) {
    if (play) {
        switch (e.code) {
            case "ArrowUp":
            case "ArrowDown":
            case "ArrowLeft":
            case "ArrowRight":
            case "Space":
                e.preventDefault();
                break;
            default:
                break; // do not block other keys
        }
    } else if (!play) {
        switch (e.code) {
            case "Space":
                e.preventDefault();
                break;
        }
    }
};

// Various functions to Start, Pause and reset the game
function startGame() {
    gameTimer = setInterval(() => { totalGameTime += 0.1 }, 100);

    if (tetris.died) {
        resetGame();
    }

    clearInterval(id2);
    id2 = setInterval(move, tetris.speed, tetris);

    play = true;
    play_sound = true;

    buttonSound.play();
    gameOverScreen.setAttribute("visibility", "hidden")
}

function resetGame() {
    clearInterval(id2);

    tetris.reset();

    index = 0;
    play = false;

    play_sound = true;
    buttonSound.play();

    vorigeScore = 0;

    gameOverScreen.setAttribute("visibility", "hidden")
}

function pauseGame() {
    clearInterval(id2);
    clearInterval(gameTimer);

    play = false;
    if (play_sound) {
        buttonSound.play();
    }
}

//various functions for the movement of the game for user and AI
function move(tetris) {
    tetris.moveDown(false);
    if (tetris.speed > 150) updateSpeed(tetris);

}

function scoreUpdater(scoreType, scoreElement) {
    loadedData = localStorage.getItem(scoreType);
    let data = JSON.parse(loadedData);

    if (data < tetris.score) {
        data = tetris.score;
        let gameDataJson = JSON.stringify(data);
        localStorage.setItem(scoreType, gameDataJson);
    }

    let docEl = document.getElementById(scoreElement);
    docEl.innerText = data;
}

// Function to show the blocks on the canvas
function print(tetris) {
    if (tetris.died) {
        if (totalGameTime != 0) {
            scoreUpdater("highscorePlayer", "highscore-player");
        }

        index++;

        gameOverScreen.setAttribute("visibility", "visible");
        play_sound = false;

        pauseGame();
    }

    ctx.clearRect(0, 0, COLS, ROWS)

    let shape = tetris.endUp();
    for (let y = 0; y < Object.values(shape.shape)[0].length; y++) {
        for (let x = 0; x < Object.values(shape.shape)[0][0].length; x++) {
            if (Object.values(shape.shape)[0][y][x] !== 0) {
                ctx.fillStyle = "#808080";
                ctx.fillRect(x + shape.x, y + shape.y - 1, 1, 1);
            }
        }
    }

    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            let value = tetris.grid[y][x];
            if (value > 0) {
                ctx.fillStyle = tetris.colors[value];
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    scorebord.textContent = tetris.score;

    blockctx.clearRect(0, 0, COLS, ROWS)
    if (tetris.upcomingShape.shape !== undefined && tetris.upcomingShape.shape !== null) {
        for (let y = 0; y < Object.values(tetris.upcomingShape.shape)[0].length; y++) {
            for (let x = 0; x < Object.values(tetris.upcomingShape.shape)[0][0].length; x++) {
                let waarde = Object.values(tetris.upcomingShape.shape)[0][y][x];
                if (waarde !== 0) {
                    blockctx.fillStyle = tetris.colors[waarde];
                    blockctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    holdingctx.clearRect(0, 0, COLS, ROWS)
    if (tetris.holdShape !== undefined) {
        for (let y = 0; y < Object.values(tetris.holdShape.shape)[0].length; y++) {
            for (let x = 0; x < Object.values(tetris.holdShape.shape)[0][0].length; x++) {
                let waarde = Object.values(tetris.holdShape.shape)[0][y][x];
                if (waarde !== 0) {
                    holdingctx.fillStyle = tetris.colors[waarde];
                    holdingctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

}
//function to draw the grid
function drawGrid(ctx) {
    ctx.beginPath();

    for (let i = 1; i < 10; i++) { //Draws vertical lines
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }

    for (let i = 1; i < 20; i++) { //Draws horizontal lines
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, i * BLOCK_SIZE);
        ctx.stroke();
    }
}
//function to change the speed of the game when a criteria is met
function updateSpeed(tetris) {
    if (tetris.score >= vorigeScore + 4000) {
        clearInterval(id2)
        tetris.speed -= 50;

        id2 = setInterval(move, tetris.speed, tetris);
        vorigeScore = tetris.score;
    }
}

// helpfunction to configure localStorage components
function localStorageLoader(storageList, itemList) {
    for (let i = 0; i < itemList.length; i++) {
        let item = itemList[i];
        let storageitem = storageList[i];

        loadedData = localStorage.getItem(storageitem);
        let docEl = document.getElementById(item);

        if (loadedData !== null) {
            let data = JSON.parse(loadedData);
            docEl.textContent = data;
        } else {
            let data = 0;
            let dataJson = JSON.stringify(data);

            localStorage.setItem(storageitem, dataJson);
            docEl.textContent = data;
        }
    }
}

//Initializes the game
function init() {
    tetris = new Tetris();

    scorebord = document.getElementById("scoreboard");

    localStorageLoader(["highscorePlayer"],["highscore-player"])
    gameOverScreen = document.getElementById("game-over");

    //Initializes the main canvas
    canvas = document.getElementById("game-board");
    ctx = canvas.getContext("2d");
    ctx.canvas.width = COLS * BLOCK_SIZE;
    ctx.canvas.height = ROWS * BLOCK_SIZE;
    ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

    //Initializes the canvas to display the upcoming tetromino
    block_canvas = document.getElementById("upcoming-shape");
    blockctx = block_canvas.getContext("2d");
    blockctx.canvas.width = 4 * BLOCK_SIZE;
    blockctx.canvas.height = 2 * BLOCK_SIZE;
    blockctx.scale(BLOCK_SIZE, BLOCK_SIZE);

    //Initializes the canvas to display the upcoming tetromino
    holding_canvas = document.getElementById("holding-shape");
    holdingctx = holding_canvas.getContext("2d");
    holdingctx.canvas.width = 4 * BLOCK_SIZE;
    holdingctx.canvas.height = 4 * BLOCK_SIZE;
    holdingctx.scale(BLOCK_SIZE, BLOCK_SIZE);

    grid_canvas = document.getElementById('grid');
    gridctx = grid_canvas.getContext("2d");
    gridctx.canvas.width = COLS * BLOCK_SIZE;
    gridctx.canvas.height = ROWS * BLOCK_SIZE;
    gridctx.strokeStyle = "#484848";

    drawGrid(gridctx);

    gameOverScreen.setAttribute("height", (ROWS * BLOCK_SIZE + 5).toString());
    gameOverScreen.setAttribute("width", (COLS * BLOCK_SIZE + 5).toString());

    //Sets all the button events, touch controls and keyboard controls
    document.getElementById("start-button").addEventListener("click", startGame);
    document.getElementById("pause-button").addEventListener("click", pauseGame);
    document.getElementById("reset-button").addEventListener("click", resetGame);

    document.addEventListener("keydown", keyHandler);

    // Disable default keyhandler when playing (Stops the canvas from scrolling)
    window.addEventListener("keydown", arrowKeysHandler, false);

    //Initializes the display of the game
    //60fps
    setInterval(print, 1000 / 60, tetris);

    //Displays first tetromino
    tetris.applyShape();

    //Initializes sounds
    sound.muteToggle();
    sound.soundSettings();
}

init();
