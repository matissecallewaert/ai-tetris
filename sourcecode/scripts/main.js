import Tetris from "./modules/tetris.js"
import Sound from "./modules/sound.js"
import AI from "./modules/ai.js";

//Definitions of variables and constants

let COLS = 10;
let ROWS = 20;
let BLOCK_SIZE = window.innerHeight / 25;

let canvas;
let chart;
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

let gameOverScreen;

let bestGenes = [
                [-0.3274278876986266,-0.007075121788763072,0.05270705704302858,-0.2183704769131798,-0.0004217920314675827,0.04944277614656406,-0.11269676747075646],
                [-0.3844816998888039,-0.24725242374712542,0.28888351574170557,-0.4302544631974703,-0.15554115150324466,-0.5951115204831836,-0.20720235959084943],
                [-0.4439956106238234,-0.11566159949412824,0.00891266544810354,-0.07481877528546887,-0.37936237231974923,-0.43438580331879606,-0.1631567931460367],
                [-0.21400960098347788,0.023825587149766014,-0.04639033054744757,-0.35520437658154413,-0.22662625299064276,-0.4052965499192043,-0.11707341140536986],
                [-0.4439956106238234,-0.11566159949412824,-0.04639033054744757,-0.35520437658154413,-0.37936237231974923,-0.43438580331879606,-0.1631567931460367],
                [-0.2670130412144588,-0.15064933154009175,0.19208730009343522,-0.27346689053661155,-0.22973653193346233,-0.4056078257701441,-0.18592724488486645],
                [-0.2670130412144588,-0.15064933154009175,0.19208730009343522,-0.27346689053661155,-0.22973653193346233,-0.4056078257701441,-0.18592724488486645],
                [-0.21400960098347788, 0.023825587149766014,0.19208730009343522,-0.27346689053661155,-0.22662625299064276,-0.4052965499192043,-0.11707341140536986],
                [-0.4439956106238234,-0.11566159949412824,0.00891266544810354,-0.07481877528546887,-0.37936237231974923,-0.43438580331879606,-0.1631567931460367]];
let best_activated = false;

let bestAIButton;

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
    if (k.key === "p") {
        buttonSound.play();
        startGame();
    } else if (k.key === "h") {
        buttonSound.play();
        pauseGame();
    } else if (k.key === "r") {
        buttonSound.play();
        resetGame();
    }
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
                best_activated = false;
                bestAIButton.style.visibility = "hidden";
                clearInterval(id2);
                tetris.speed = 700;
                tetris.speed -= Math.floor(tetris.score /4000) *50;
                id2 = setInterval(move, tetris.speed, tetris);
                console.log(tetris.speed);
            } else {
                tetris.ai_activated = true;
                bestAIButton.style.visibility = "visible";
                auto();
            }
        } else if (k.key === "s") {
            tetris.speed = Math.max(1000 / 60, tetris.speed - 50);
            clearInterval(id2);
            id2 = setInterval(move, tetris.speed, tetris);
        } if (tetris.ai_activated) {
            if (k.key === "d") {
                tetris.speed = tetris.speed + 50;
                if(tetris.speed > 700){
                    tetris.speed = 700;
                }
                clearInterval(id2)
                id2 = setInterval(move, tetris.speed, tetris);
            }
        }
    }
}

/**
 * Function to disable scrolling on canvas when pressing the arrow keys
 */
let arrow_keys_handler = function (e) {
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
    tetris.Reset();
    ai.reset();
    ai_level.innerText = 1;
    ai_gene.innerText = "1" + " / " + (ai.populationSize).toString();
    index = 0;
    play = false;
    tetris.ai_activated = false;
    best_activated = false;
    play_sound = true;
    buttonSound.play();
    vorigeScore = 0;
    graphData.data.datasets[0].data = [];
    graphData.data.labels = [];
    chart.destroy();
    refreshChart();
    gameOverScreen.setAttribute("visibility", "hidden")
}

function pauseGame() {
    clearInterval(id2);
    play = false;
    if (play_sound) {
        buttonSound.play();
    }
}

async function toggleBestAI(){
    best_activated = !best_activated;
    if(best_activated) {
        bestAIButton.style.visibility = "hidden";
        await BestAI()
    }
}

//various functions for the movement of the game for user and AI
function move(tetris) {
    if (tetris.ai_activated) {
        tetris.AIMoveDown();
    } else {
        tetris.MoveDown();
        if (tetris.speed > 150) UpdateSpeed(tetris);
    }
}

async function auto() {
    await algorithm();
}

async function algorithm() {
    for (let i = ai.populationNumber; i < ai.maxGeneration; i++) {
        for (let j = index; j < ai.populationSize; j++) {
            if (!tetris.ai_activated || best_activated) {
                return;
            }
            ai_gene.innerText = (index + 1).toString() + " / " + (ai.populationSize).toString();
            gene = ai.population[j];
            ai_chromosomes.innerText = "AggregateHeight: " + gene[0] + "\n" +
                "RelativeHeight: " + gene[1] + "\n" +
                "MaxHeight: " + gene[2] + "\n" +
                "ClearLines: " + gene[3] + "\n" +
                "Holes: " + gene[4] + "\n" +
                "Blockades: " + gene[6] + "\n" +
                "Bumpiness: " + gene[5] + "\n";
            makeMoves();
            await waitUntil(() => done === true);
            await waitUntil(() => printBuffer === true);
            await waitUntil(() => tetris.tetrisReset === true);
            printBuffer = false;
            tetris.tetrisReset = false;
        }
        console.log(ai.moves.reduce(function (a, b) {
            return Math.max(a, b);
        }) + " in generation " + (ai.populationNumber + 1));
        index = 0;
        ai.populationNumber++;
        handleRandomDataset();
        ai_level.innerText = ai.populationNumber + 1;
        ai.populate();
    }
}
async function BestAI(){
    let teller = 0;
    ai_level.innerText = "Beste Genes";
    ai_gene.innerText = "";
    while(best_activated){
        gene = bestGenes[teller];
        ai_chromosomes.innerText = "AggregateHeight: " + gene[0] + "\n" +
            "RelativeHeight: " + gene[1] + "\n" +
            "MaxHeight: " + gene[2] + "\n" +
            "ClearLines: " + gene[3] + "\n" +
            "Holes: " + gene[4] + "\n" +
            "Blockades: " + gene[6] + "\n" +
            "Bumpiness: " + gene[5] + "\n";
        makeMoves();
        await waitUntil(() => done === true);
        await waitUntil(() => printBuffer === true);
        await waitUntil(() => tetris.tetrisReset === true);
        printBuffer = false;
        tetris.tetrisReset = false;
        teller++;
        teller%=bestGenes.length;
        console.log(teller);
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
        rating: -100000,
        sideMoves: 0,
        rotation: 0
    }]
    for (let rot = 0; rot < 4; rot++) {
        tetris.Rotate();
        for (let x = -10; x < 10; x++) {
            tetris.CopyCurrentShape();
            if (x < 0) {
                for (let xl = 0; xl < Math.abs(x); xl++) {
                    tetris.MoveLeft();
                }
            } else if (x > 0) {
                for (let xr = 0; xr < x; xr++) {
                    tetris.MoveRight();
                }
            }
            tetris.AIDrop();
            tetris.AIUpdateScore();
            tetris.getData();
            tetris.grid = JSON.parse(JSON.stringify(tetris.fakeGrid));
            move.rating = ai.calcRating(tetris.data.height, tetris.data.linesCleared, tetris.data.holes, tetris.data.blockades, gene);
            move.sideMoves = x;
            move.rotation = rot + 1;
            tetris.oldShape = JSON.parse(JSON.stringify(tetris.currentShape));
            tetris.AINextShape();
            if (tetris.fakeDied) {
                move.rating = move.rating - 1000;
            }
            allMoves.push({...move});
            tetris.fakeDied = false;
            tetris.RemoveShape(tetris.oldShape);
        }
    }
    return allMoves;
}


async function makeMoves() {
    done = false;

    while (!tetris.died && tetris.movesTaken <= 499) {
        let move = getBestMove();
        for (let rot = 0; rot < move.rotation; rot++) {
            tetris.Rotate();
        }
        if (move.sideMoves < 0) {
            for (let xl = 0; xl < Math.abs(move.sideMoves); xl++) {
                tetris.MoveLeft();
            }
        } else if (move.sideMoves > 0) {
            for (let xr = 0; xr < move.sideMoves; xr++) {
                tetris.MoveRight();
            }
        }
        await waitUntil(() => tetris.ground === true);
        if (!tetris.ai_activated) {
            tetris.ground = false;
            break;
        }
        tetris.UpdateScore();
        tetris.NextShape();
        tetris.ground = false;
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
        if (!tetris.ai_activated) {
            gameOverScreen.setAttribute("visibility", "visible");
            play_sound = false;
            pauseGame();
            ai.reset();
            ai_level.innerText = 1;
        } else {
            tetris.Reset();
        }
    }
    ctx.clearRect(0, 0, COLS, ROWS)

    if(!tetris.ai_activated && !best_activated){
        ai_chromosomes.innerText = "Player plays!";
    }

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

    scorebord.textContent = tetris.score;

    moves.textContent = tetris.movesTaken;

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
    printBuffer = true;
}
//function to draw the grid
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
//function to change the speed of the game when a criteria is met
function UpdateSpeed(tetris) {
    if (tetris.score >= vorigeScore + 4000) {
        clearInterval(id2)
        tetris.speed -= 50;
        console.log("Je score is: " + tetris.score + ", dus je speed is: " + tetris.speed);
        id2 = setInterval(move, tetris.speed, tetris);
        vorigeScore = tetris.score;
    }
}

/**
 * Start of graph
 * @type {{data: {datasets: [{backgroundColor: string[], borderColor: string[], data: number[], borderWidth: number, label: string}], labels: string[]}, options: {scales: {y: {beginAtZero: boolean}}}, type: string}}
 */
const graphData = {
    type: "line",
    data: {
        labels: [],
        datasets: [
            {
                label: "Average moves per generation",
                data: [],
                backgroundColor: [
                    "rgba(255, 99, 132, 0.2)",
                    "rgba(54, 162, 235, 0.2)",
                    "rgba(255, 206, 86, 0.2)",
                    "rgba(75, 192, 192, 0.2)",
                    "rgba(153, 102, 255, 0.2)",
                    "rgba(255, 159, 64, 0.2)"
                ],
                borderColor: [
                    "rgba(255, 99, 132, 1)",
                    "rgba(54, 162, 235, 1)",
                    "rgba(255, 206, 86, 1)",
                    "rgba(75, 192, 192, 1)",
                    "rgba(153, 102, 255, 1)",
                    "rgba(255, 159, 64, 1)"
                ],
                borderWidth: 1
            }
        ]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
};

const refreshChart = () => {
    const graphctx = document.getElementById("myChart").getContext("2d");
    chart = new Chart(graphctx, graphData);
};

const handleRandomDataset = () => {
    if (tetris.ai_activated) {

        let bla = ai.moves.reduce(function (a, b) {
            return a + b;
        })
        graphData.data.datasets[0].data.push(bla / ai.populationSize);
        graphData.data.labels.push(ai.populationNumber);
    }
    chart.destroy();
    refreshChart();
};

// End of graph


//Initializes the game
function init() {
    tetris = new Tetris();
    ai = new AI();
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

    gameOverScreen = document.getElementById("game_over");

    //Time the player has to touch the screen to hard drop current tetromino
    touchduration = 800;

    x = null;
    y = null;

    //Initializes the main canvas
    canvas = document.getElementById("board");
    ctx = canvas.getContext("2d");
    ctx.canvas.width = COLS * BLOCK_SIZE;
    ctx.canvas.height = ROWS * BLOCK_SIZE;
    ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

    //Initializes the canvas to display the upcoming tetromino
    block_canvas = document.getElementById("upcomingShape");
    blockctx = block_canvas.getContext("2d");
    blockctx.canvas.width = 4 * BLOCK_SIZE;
    blockctx.canvas.height = 2 * BLOCK_SIZE;
    blockctx.scale(BLOCK_SIZE, BLOCK_SIZE);

    //Initializes the canvas to display the upcoming tetromino
    holding_canvas = document.getElementById("holdingShape");
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
    document.getElementById("startButton").addEventListener("click", startGame);
    document.getElementById("pauseButton").addEventListener("click", pauseGame);
    document.getElementById("resetButton").addEventListener("click", resetGame);
    bestAIButton = document.getElementById("bestAI");
    bestAIButton.addEventListener("click", toggleBestAI);

    document.addEventListener("longpressevent", function (event) {
        window.addEventListener("touchstart", touchstart, false);
        window.addEventListener("touchend", touchend, false);
    });
    document.addEventListener('touchcoordinates', getTouchCoordinates, false);
    document.addEventListener('touchcontrols', mobileControl, false);
    document.addEventListener("keydown", keyHandler);


    // Disable default keyhandler when playing (Stops the canvas from scrolling)
    window.addEventListener("keydown", arrow_keys_handler, false);

    window.onload = function () {
        refreshChart();
    }

    //Initializes the display of the game
    //60fps
    setInterval(print, 1000 / 60, tetris);

    //Displays first tetromino
    tetris.ApplyShape();

    //Initializes sounds
    sound.MuteToggle();
    sound.SoundSettings();
}

init();
