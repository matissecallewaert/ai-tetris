import Tetris from "./modules/tetris.js"
import Sound from "./modules/sound.js"

//alert("Script detected")

// Create canvas
let COLS = 10
let ROWS = 20
let BLOCK_SIZE = 45

let canvas = document.getElementById("board")
let ctx = canvas.getContext("2d")

ctx.canvas.width = COLS * BLOCK_SIZE;
ctx.canvas.height = ROWS * BLOCK_SIZE;

ctx.scale(BLOCK_SIZE, BLOCK_SIZE)

// Start of sound effect settings
let sound = new Sound(document.getElementById("sound-div")),
    // Create 5 sound effects: Buttons (Play, Pause, Reset), Rotate, MoveLeft == MoveRight, GameOver, BackgroundMusic
    buttonSound = sound.create("assets/sounds/block-rotate.mp3", "button_sound"),
    rotateSound = sound.create("assets/sounds/select.mp3", "rotate_sound"),
    moveSound = sound.create("assets/sounds/whoosh.mp3", "move_sound"),
    gameOverSound = sound.create("assets/sounds/gameover.mp3", "gameOver_sound"),
    backgroundMusic = sound.create("assets/sounds/pause.mp3", "backgroundMusic");

sound.MuteToggle();
sound.SoundSettings();

// Functions to handle various keypresses from keyboard
let speed = 500;
let play = false;
let id2;

let keyHandler = (k) => {
    if(play){
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
        }else if(k.key === " "){
            tetris.Drop();
            buttonSound.play();
        }
    }
}

document.addEventListener("keydown", keyHandler);

// Various functions to Star, Pause and Reset the game
function startGame() {
    clearInterval(id2);
    id2 = setInterval(move, 500, tetris);
    play = true;
    buttonSound.play();
}

function resetGame() {
    clearInterval(id2);
    speed = 500;
    tetris.Reset();
    play = false;
    buttonSound.play();
}

function pauseGame() {
    clearInterval(id2);
    //console.log(id2)
    play = false;
    buttonSound.play();
}

document.getElementById("startButton").addEventListener("click", startGame)
document.getElementById("pauseButton").addEventListener("click", pauseGame)
document.getElementById("resetButton").addEventListener("click", resetGame)

// Create a new Tetris game
let tetris = new Tetris();

let printinterval = setInterval(print, 100, tetris);

let scorebord = document.getElementById("scoreboard");
let upcomingShape = document.getElementById("upcomingShape");

tetris.ApplyShape();

function move(tetris) {
    tetris.MoveDown();
}

function print(tetris) {

    let grid = document.getElementById("board");
    let e = document.getElementById("board");

    ctx.clearRect(0, 0, COLS, ROWS)

    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            let value = tetris.grid[y][x];
            if (value > 0){
                ctx.fillStyle = tetris.colors[value];
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    scorebord.style.color = "#FFFFFF";
    scorebord.textContent = tetris.score;
    let letter;
    let child = upcomingShape.lastElementChild;
    while (child) {
        upcomingShape.removeChild(child);
        child = upcomingShape.lastElementChild;
    }
    for (let y = 0; y < Object.values(tetris.upcomingShape.shape)[0].length; y++) {
        let zin = document.createElement("p");
        for (let x = 0; x < Object.values(tetris.upcomingShape.shape)[0][0].length; x++) {
            letter = document.createElement("span");
            let waarde = Object.values(tetris.upcomingShape.shape)[0][y][x];
            if (waarde !== 0) {
                letter.style.color = tetris.colors[waarde];
                letter.textContent = waarde;
                zin.appendChild(letter);
            } else {
                letter.textContent = waarde;
                letter.style.visibility = "hidden";
                zin.appendChild(letter);
            }
        }
        upcomingShape.appendChild(zin);
    }
}
