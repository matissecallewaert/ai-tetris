import Tetris from "./modules/tetris.js"
import Sound from "./modules/sound.js"
import AI from "./modules/ai.js";


//alert("Script detected")
//alert(window.innerHeight)

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
let id2;

let x;
let y;

let done = false;
let printBuffer = false;
let index = 0;

// Length of time we want the user to touch before we do something
let touchduration;
let timer;
let ai;
let tetris;
let scorebord;
let moves;
let ai_level;
let ai_gene;
let ai_chromosomes;
let gene;
let loadedData;
let gameData;
let highscore;

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
        if (!tetris.ai_activated) {
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
            } else if (k.key === " ") {
                tetris.Drop();
                buttonSound.play();
            } else if (k.keyCode === 16) {
                if (tetris.holding === false) {
                    if (tetris.holdShape === undefined) {
                        tetris.HoldShape();
                    } else {
                        tetris.UseHoldShape();
                    }
                }
            }
        }
        if (k.key === "a") {
            buttonSound.play();
            if (tetris.ai_activated) {
                tetris.ai_activated = false;
            } else {
                tetris.ai_activated = true;
                auto();
            }
        } else if (k.key === "s") {
            clearInterval(id2)
            tetris.speed -= 50;
            id2 = setInterval(move, tetris.speed, tetris);
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
    if (Math.abs(difX) > Math.abs(difY)) {
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
    id2 = setInterval(move, tetris.speed, tetris);
    play = true;
    buttonSound.play();
}

function resetGame() {
    clearInterval(id2);
    tetris.Reset();
    ai.reset();
    ai_level.innerText = 1;
    index = 0;
    play = false;
    tetris.ai_activated = false;
    buttonSound.play();
    vorigeScore = 0;
}

function pauseGame() {
    clearInterval(id2);
    play = false;
    buttonSound.play();
}

function move(tetris) {
    if (tetris.ai_activated) {
        tetris.fakeMoveDown1();
    } else {
        tetris.MoveDown();
    }
    tetris.score++;
    UpdateSpeed(tetris);
}

async function auto() {
    await algorithm();
    while (tetris.ai_activated === true) {
        await makeMoves();
    }
}

async function algorithm() {
    for (let i = ai.populationNumber; i < ai.maxGeneration; i++) {
        for (let j = index; j < ai.populationSize; j++) {
            ai_gene.innerText = (index + 1).toString() + " / " + (ai.populationSize).toString();
            gene = ai.population[j];
            ai_chromosomes.innerText = "AggregateHeight: " + gene[0] + "\n" +
                "RelativeHeight: " + gene[1] + "\n" +
                "MaxHeight: " + gene[2] + "\n" +
                "Clearlines: " + gene[3] + "\n" +
                "Holes: " + gene[4] + "\n" +
                "Bumpiness: " + gene[5] + "\n" +
                "LastColumn: " + gene[6] + "\n" +
                "MultipleLinesClear: " + gene[7] + "\n" +
                "MaxLinesClear: " + gene[8] + "\n";
            makeMoves();
            await waitUntil(() => done === true);
            await waitUntil(() => printBuffer === true);
            printBuffer = false;
        }
        console.log(ai.moves.reduce(function (a, b) {
            return Math.max(a, b);
        }) + " in generation " + (ai.populationNumber + 1));
        index = 0;
        ai.populationNumber++;
        ai_level.innerText = ai.populationNumber + 1;
        ai.populate();
    }
}


function getBestMove() {
    let moves = getAllMoves();
    let bestMove = moves[0];
    for (let i = 0; i < moves.length; i++) {
        if (bestMove.rating < moves[i].rating) {
            bestMove = JSON.parse(JSON.stringify(moves[i]));
        }
    }
    return bestMove;
}

function getAllMoves() {
    let allMoves = [];
    let move = [{
        rating: 0,
        sideMoves: 0,
        rotation: 0
    }]
    for (let rot = 0; rot < 4; rot++) {
        tetris.Rotate();
        for (let x = -5; x < 5; x++) {
            tetris.fakeGenerateBag();
            if (x < 0) {
                for (let xl = -1; xl >= x; xl--) {
                    tetris.MoveLeft();
                }
            } else {
                for (let xr = 0; xr <= x; xr++) {
                    tetris.MoveRight();
                }
            }
            tetris.fakeDrop1();
            tetris.fakeUpdateScore();
            tetris.getData();

            move.rating = ai.calcRating(tetris.data.height, tetris.data.linesCleared, tetris.data.holes, gene);
            move.sideMoves = x;
            move.rotation = rot + 1;
            tetris.fakeDrop2();
            if (tetris.fakeDied) {
                move.rating = move.rating - 1000;
            }
            allMoves.push({...move});
            tetris.fakeDied = false;
            tetris.fakeRemoveShape();
        }
    }
    return allMoves;
}


async function makeMoves() {
    done = false;
    while (!tetris.died && tetris.movesTaken < 500) {
        let move = getBestMove();
        for (let rot = 0; rot < move.rotation; rot++) {
            tetris.Rotate();
        }
        if (move.sideMoves < 0) {
            for (let xl = -1; xl >= move.sideMoves; xl--) {
                tetris.MoveLeft();
            }
        } else {
            for (let xr = 0; xr <= move.sideMoves; xr++) {
                tetris.MoveRight();
            }
        }
        await waitUntil(() => tetris.ground === true);
        tetris.fakeMoveDown2();
        tetris.ground = false
        if (!tetris.ai_activated) {
            break;
        }
    }
    done = true;
}

const waitUntil = (condition) => {
    return new Promise((resolve) => {
        let interval = setInterval(() => {
            if (!condition()) {
                return
            }

            clearInterval(interval)
            resolve()
        }, 100)
    })
}


// Function to show the blocks on the canvas
function print(tetris) {
    if (tetris.died) {
        ai.scores[index] = JSON.parse(JSON.stringify(tetris.score));
        ai.moves[index] = JSON.parse(JSON.stringify(tetris.movesTaken));
        index++;
        loadedData = localStorage.getItem("highScores");
        let data = JSON.parse(loadedData);
        if (data.Highscore < tetris.score) {
            data.Highscore = tetris.score;
            let gameDataJson = JSON.stringify(data);
            localStorage.setItem("highScores", gameDataJson);
        }
        highscore = document.getElementById("highscore");
        highscore.textContent = data.Highscore;
        tetris.Reset();
        if (!tetris.ai_activated) {
            resetGame();
        }
    }
    ctx.clearRect(0, 0, COLS, ROWS)

    let shape = tetris.EndUp();
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


    scorebord.style.color = "#FFFFFF";
    scorebord.textContent = tetris.score;

    moves.style.color = "#FFFFFF";
    moves.textContent = tetris.movesTaken;

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
    printBuffer = true;
}

function drawGrid(ctx) {
    ctx.beginPath();
    for (let i = 1; i < 10; i++) {                                                                        //Draws vertical lines
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }
    for (let i = 1; i < 20; i++) {                                                                        //Draws horizontal lines
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, i * BLOCK_SIZE);
        ctx.stroke();
    }
}

function UpdateSpeed(tetris) {
    if (tetris.score >= vorigeScore + 1000) {
        clearInterval(id2)
        tetris.speed -= 50;
        id2 = setInterval(move, tetris.speed, tetris);
        vorigeScore = tetris.score;
    }
}

function init() {
    //Initializes the game
    tetris = new Tetris();
    ai = new AI();
    ai.reset();
    scorebord = document.getElementById("scoreboard");
    moves = document.getElementById("level");
    ai_level = document.getElementById("lines");
    ai_level.innerText = (ai.populationNumber + 1).toString();
    ai_gene = document.getElementById("gene");
    ai_gene.innerText = (index + 1).toString() + " / " + (ai.populationSize).toString();
    ai_chromosomes = document.getElementById("chromosomes");
    ai_chromosomes.innerText = "no data";
    highscore = document.getElementById("highscore");
    loadedData = localStorage.getItem("highScores");
    if (loadedData !== null) {
        let data = JSON.parse(loadedData);
        highscore.textContent = data.Highscore;
    } else {
        let data = {Highscore: 0};
        let dataJson = JSON.stringify(data);
        localStorage.setItem("highScores", dataJson);
    }

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
    blockctx.canvas.width = 4 * BLOCK_SIZE;
    blockctx.canvas.height = 2 * BLOCK_SIZE;
    blockctx.scale(BLOCK_SIZE, BLOCK_SIZE);

    holding_canvas = document.getElementById("holdingShape");                                    //Initializes the canvas to display the upcoming tetromino
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

    document.getElementById("startButton").addEventListener("click", startGame);            //Sets all the button events, touch controls and keyboard controls
    document.getElementById("pauseButton").addEventListener("click", pauseGame);
    document.getElementById("resetButton").addEventListener("click", resetGame);
    document.addEventListener("longpressevent", function (event) {
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
