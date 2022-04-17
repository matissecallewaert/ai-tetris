import Tetris from "./modules/tetris.js"
import Sound from "./modules/sound.js"

//alert("Script detected")

//Definitions of variables and constants
let COLS = 10;
let ROWS = 20;
let BLOCK_SIZE = 45;

let canvas;
let ctx;

let block_canvas;
let blockctx;

let grid_canvas;
let gridctx;

let speed = 700;
let play = false;
let id2;

let x;
let y;

// Length of time we want the user to touch before we do something
let touchduration;
let timer;

let tetris;
let scorebord;

// Start of sound effect settings
let sound = new Sound(document.getElementById("sound-div")),
    // Create 5 sound effects: Buttons (Play, Pause, Reset), Rotate, MoveLeft == MoveRight, GameOver, BackgroundMusic
    buttonSound = sound.create("assets/sounds/block-rotate.mp3", "button_sound"),
    rotateSound = sound.create("assets/sounds/select.mp3", "rotate_sound"),
    moveSound = sound.create("assets/sounds/whoosh.mp3", "move_sound"),
    gameOverSound = sound.create("assets/sounds/gameover.mp3", "gameOver_sound"),
    backgroundMusic = sound.create("assets/sounds/pause.mp3", "backgroundMusic");


// Function to handle various keypresses from keyboard
let keyHandler = (k) => {
    if (play) {
        if (k.keyCode === 40) {
            tetris.MoveDown();
        } else if (k.keyCode === 37) {
            tetris.MoveLeft();
            moveSound.play();
        } else if (k.keyCode === 39) {
            tetris.MoveRight();
            moveSound.play();
        } else if (k.keyCode === 38) {
            tetris.Rotate();
            rotateSound.play();
        } else if (k.key === "s") {
            clearInterval(id2)
            speed -= 50;
            id2 = setInterval(move, speed, tetris);
        } else if (k.key === " ") {
            tetris.Drop();
            buttonSound.play();
        }
    }
}

/** Function to handle touchscreen swipe controls:
    - Swipe left to move the block to left
    - Swipe right to move the block to right
    - Long press for Hard-Drop
**/

let getTouchCoordinates = (event) => {
    x = event.touches[0].clientX;
    y = event.touches[0].clientY;
}

let mobileControl = (event) => {
    let difX = event.changedTouches[0].clientX - x;
    let difY = event.changedTouches[0].clientY - y;
    if ( Math.abs( difX ) > Math.abs( difY ) ) {
        if (difX > 0) {
            tetris.MoveRight();
        } else {
            tetris.MoveLeft();
        }
    } else {
        if (difY > 0) {
            tetris.MoveDown();
        } else {
            tetris.Rotate();
        }
    }
    x = null;
    y = null;
}

// Functions for Hard-Dropping the tetris block when long pressing the screen
function touchstart(e) {
    e.preventDefault();
    if (!timer) {
        timer = setTimeout(onlongtouch, touchduration);
    }
}

function touchend() {
    //stops short touches from firing the event
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
}

function onlongtouch() {
    timer = null;
    tetris.Drop();
}

// Various functions to Start, Pause and Reset the game
function startGame() {
    clearInterval(id2);
    id2 = setInterval(move, 700, tetris);
    play = true;
    buttonSound.play();
}

function resetGame() {
    clearInterval(id2);
    speed = 700;
    tetris.Reset();
    play = false;
    buttonSound.play();
}

function pauseGame() {
    clearInterval(id2);
    play = false;
    buttonSound.play();
}

function move(tetris) {
    tetris.MoveDown();
}

// Function to show the blocks on the canvas
function print(tetris) {

    ctx.clearRect(0, 0, COLS, ROWS)

    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            let value = tetris.grid[y][x];
            if (value > 0) {
                ctx.fillStyle = tetris.colors[value];
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    scorebord.style.color = "#FFFFFF";
    scorebord.textContent = tetris.score;

    blockctx.clearRect(0, 0, COLS, ROWS)
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

function drawGrid(ctx) {
    ctx.beginPath();
    for(let i = 1; i < 10; i++){                                                                        //Draws vertical lines
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }
    for(let i = 1; i < 20; i++){                                                                        //Draws horizontal lines
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, i * BLOCK_SIZE);
        ctx.stroke();
    }
}

function init(){
    tetris = new Tetris();                                                                              //Initializes the game
    scorebord = document.getElementById("scoreboard");

    touchduration = 800;                                                                                //Time the player has to touch the screen to hard drop current tetromino

    x = null;
    y = null;

    canvas = document.getElementById("board");                                                  //Initializes the main canvas
    ctx = canvas.getContext("2d");
    ctx.canvas.width = COLS * BLOCK_SIZE;
    ctx.canvas.height = ROWS * BLOCK_SIZE;
    ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

    block_canvas = document.getElementById("upcomingShape");                                    //Initializes the canvas to display the upcoming tetromino
    blockctx = block_canvas.getContext("2d");
    blockctx.scale(40, 40);

    grid_canvas = document.getElementById('grid');
    gridctx = grid_canvas.getContext("2d");
    gridctx.canvas.width = COLS * BLOCK_SIZE;
    gridctx.canvas.height = ROWS * BLOCK_SIZE;
    gridctx.strokeStyle = "#484848";
    drawGrid(gridctx);

    document.getElementById("startButton").addEventListener("click", startGame);            //Sets all the button events, touch controls and keyboard controls
    document.getElementById("pauseButton").addEventListener("click", pauseGame);
    document.getElementById("resetButton").addEventListener("click", resetGame);
    document.addEventListener("longpressevent", function(event) {
        window.addEventListener("touchstart", touchstart, false);
        window.addEventListener("touchend", touchend, false);
    });
    document.addEventListener('touchcoordinates', getTouchCoordinates, false);
    document.addEventListener('touchcontrols', mobileControl, false);
    document.addEventListener("keydown", keyHandler);

    setInterval(print, 100, tetris);                                                                //Initializes the display of the game

    tetris.ApplyShape();                                                                                    //Displays first tetromino

    sound.MuteToggle();                                                                                     //Initializes sounds
    sound.SoundSettings();
}

init();