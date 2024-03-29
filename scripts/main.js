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

let piecesPerSecondArray = localStorage.getItem("piecesPerSecondArray") !== null ? JSON.parse(localStorage.getItem("piecesPerSecondArray")) : [];
let totalGameTime = 0;
let gameTimer;
let playerUsedHold = false;
let averagePPS;
let resetClickCounter = 0;
let resetRecentlyClicked = false;

let gameOverScreen;

let bestGenes = [
    [-0.3274278876986266, -0.007075121788763072, 0.05270705704302858, -0.2183704769131798, -0.0004217920314675827, 0.04944277614656406, -0.11269676747075646],
    [-0.3844816998888039, -0.24725242374712542, 0.28888351574170557, -0.4302544631974703, -0.15554115150324466, -0.5951115204831836, -0.20720235959084943],
    [-0.4439956106238234, -0.11566159949412824, 0.00891266544810354, -0.07481877528546887, -0.37936237231974923, -0.43438580331879606, -0.1631567931460367],
    [-0.21400960098347788, 0.023825587149766014, -0.04639033054744757, -0.35520437658154413, -0.22662625299064276, -0.4052965499192043, -0.11707341140536986],
    [-0.4439956106238234, -0.11566159949412824, -0.04639033054744757, -0.35520437658154413, -0.37936237231974923, -0.43438580331879606, -0.1631567931460367],
    [-0.2670130412144588, -0.15064933154009175, 0.19208730009343522, -0.27346689053661155, -0.22973653193346233, -0.4056078257701441, -0.18592724488486645],
    [-0.2670130412144588, -0.15064933154009175, 0.19208730009343522, -0.27346689053661155, -0.22973653193346233, -0.4056078257701441, -0.18592724488486645],
    [-0.21400960098347788, 0.023825587149766014, 0.19208730009343522, -0.27346689053661155, -0.22662625299064276, -0.4052965499192043, -0.11707341140536986],
    [-0.4439956106238234, -0.11566159949412824, 0.00891266544810354, -0.07481877528546887, -0.37936237231974923, -0.43438580331879606, -0.1631567931460367]];
let best_activated = false;

// Start of sound effect settings
let sound = new Sound(document.getElementById("sound-div")),
    // Create 5 sound effects: Buttons (Play, Pause, reset), rotate, moveLeft == MoveRight, GameOver, BackgroundMusic
    buttonSound = sound.create("assets/sounds/block-rotate.mp3", "button_sound"),
    rotateSound = sound.create("assets/sounds/select.mp3", "rotate_sound"),
    moveSound = sound.create("assets/sounds/whoosh.mp3", "move_sound");

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
        if (!tetris.aiActivated) {
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
                playerUsedHold = true;
                if (tetris.holding === false) {
                    if (tetris.holdShape === undefined) {
                        tetris.setHoldShape();
                    } else {
                        tetris.useHoldShape();
                    }
                }
            }
        }
        if (k.key === "a") {
            buttonSound.play();
            if (tetris.aiActivated) {
                tetris.aiActivated = false;
                toggleShowAIStats();

                best_activated = false;
                document.getElementById("bestAI").hidden = true;

                clearInterval(id2);

                tetris.speed = 700;
                tetris.speed -= Math.floor(tetris.score / 4000) * 50;

                id2 = setInterval(move, tetris.speed, tetris);
            } else {
                toggleShowAIStats();

                ai_level.innerText = ai.populationNumber + 1;
                tetris.aiActivated = true;

                document.getElementById("bestAI").hidden = false;
                auto();
            }
        } else if (k.key === "s") {
            tetris.speed = Math.max(1000 / 60, tetris.speed - 50);

            clearInterval(id2);
            id2 = setInterval(move, tetris.speed, tetris);
        } if (tetris.aiActivated) {
            if (k.key === "d") {
                if (tetris.speed < 700) {
                    tetris.speed = tetris.speed + 50;
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

/** Function to handle touchscreen swipe controls:
 - Swipe left to move the block to left
 - Swipe right to move the block to right
 - Long press for Hard-drop
 **/

// let getTouchCoordinates = (event) => {
//     x = event.touches[0].clientX;
//     y = event.touches[0].clientY;
// }

// let mobileControl = (event) => {
//     let difX = event.changedTouches[0].clientX - x;
//     let difY = event.changedTouches[0].clientY - y;
//     if (Math.abs(difX) > Math.abs(difY)) {
//         if (difX > 0) {
//             tetris.moveRight();
//         } else {
//             tetris.moveLeft();
//         }
//     } else {
//         if (difY > 0) {
//             tetris.moveDown();
//         } else {
//             tetris.rotate();
//         }
//     }
//     x = null;
//     y = null;
// }

// // Functions for Hard-dropping the tetris block when long pressing the screen
// function touchStart(e) {
//     e.preventDefault();
//     if (!timer) {
//         timer = setTimeout(onLongTouch, touchduration);
//     }
// }

// function touchEnd() {
//     //stops short touches from firing the event
//     if (timer) {
//         clearTimeout(timer);
//         timer = null;
//     }
// }

// function onLongTouch() {
//     timer = null;
//     tetris.drop(false);
// }

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
    ai.reset();

    ai_level.innerText = 1;
    ai_gene.innerText = "1" + " / " + (ai.populationSize).toString();

    index = 0;
    play = false;

    tetris.aiActivated = false;
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
    clearInterval(gameTimer);

    play = false;
    if (play_sound) {
        buttonSound.play();
    }
}

async function toggleBestAI() {
    best_activated = !best_activated;

    if (best_activated) {
        document.getElementById("bestAI").hidden = true;

        await bestAI()
    }
}

//function to calculate pieces per second and add to storage
function calculatePPS() {
    let piecesPlaced;
    clearInterval(gameTimer);

    if (!tetris.aiActivated) {
        piecesPlaced = playerUsedHold ? tetris.movesTaken - 1 : tetris.movesTaken;
        let pps = (piecesPlaced / totalGameTime).toFixed(2);
        piecesPerSecondArray.push(pps);

        let JSONpiecesPerSecondArray = JSON.stringify(piecesPerSecondArray);
        localStorage.setItem("piecesPerSecondArray", JSONpiecesPerSecondArray);
        
        calculateAveragePPS();
    }

    piecesPlaced = playerUsedHold ? tetris.movesTaken - 1 : tetris.movesTaken;
    let pps = (piecesPlaced / totalGameTime).toFixed(2);
    console.log(pps);

    totalGameTime = 0;
    piecesPlaced = 0;
}

function calculateAveragePPS() {
    let JSONallPps = localStorage.getItem("piecesPerSecondArray");

    if (JSONallPps !== null) {
        let totalPps = 0.0;
        let allPps = JSON.parse(JSONallPps);

        for (let i = 0; i < allPps.length; i++) {
            totalPps += Number(allPps[i]);
        }

        averagePPS = (totalPps / allPps.length).toFixed(2);
    }

    localStorage.setItem("PPS", JSON.stringify(averagePPS));
    document.getElementById("PPS").innerText = averagePPS;
}

function resetHSPPS() { //resets the highscores and pieces per second

    console.log("resetting...");
    localStorage.setItem("highscorePlayer", 0);
    localStorage.setItem("highscoreAI", 0);
    localStorage.setItem("PPS", 0);
    localStorage.setItem("piecesPerSecondArray", []);

    document.getElementById("PPS").innerText = JSON.parse(localStorage.getItem("PPS"));
    document.getElementById("highscoreAI").innerText = JSON.parse(localStorage.getItem("highscoreAI"));
    document.getElementById("highscorePlayer").innerText = JSON.parse(localStorage.getItem("highscorePlayer"));

}

function tryToReset() { //click "tetris" 10 times (eventListener) within 3 seconds to call resetHSPPS
    if (!resetRecentlyClicked) setTimeout(() => { resetClickCounter = 0; resetRecentlyClicked = false; }, 3000);
    resetRecentlyClicked = true;
    resetClickCounter++;
    if (resetClickCounter == 10 && resetRecentlyClicked == true) resetHSPPS();
}

function toggleShowAIStats() {
    document.getElementById("AIlevel").hidden = !document.getElementById("AIlevel").hidden;
    document.getElementById("AIgene").hidden = !document.getElementById("AIgene").hidden;
    document.getElementById("AImoves").hidden = !document.getElementById("AImoves").hidden;
    document.getElementById("AIchromosomes").hidden = !document.getElementById("AIchromosomes").hidden;
}


//various functions for the movement of the game for user and AI
function move(tetris) {
    if (tetris.aiActivated) {

        tetris.moveDown(true);
    } else {

        tetris.moveDown(false);
        if (tetris.speed > 150) updateSpeed(tetris);
    }
}

async function auto() {
    await algorithm();
}

async function algorithm() {
    for (let i = ai.populationNumber; i < ai.maxGeneration; i++) {
        for (let j = index; j < ai.populationSize; j++) {
            if (!tetris.aiActivated || best_activated) {
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
async function bestAI() {
    let teller = 0;
    ai_level.innerText = "Beste Genes";
    ai_gene.innerText = "";

    while (best_activated) {
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
        teller %= bestGenes.length;
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
        tetris.rotate();

        for (let x = -10; x < 10; x++) {
            tetris.copyCurrentShape();

            if (x < 0) {
                for (let xl = 0; xl < Math.abs(x); xl++) {
                    tetris.moveLeft();
                }
            } else if (x > 0) {
                for (let xr = 0; xr < x; xr++) {
                    tetris.moveRight();
                }
            }

            tetris.drop(true);
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

            allMoves.push({ ...move });
            tetris.fakeDied = false;
            tetris.removeShape(tetris.oldShape);
        }
    }

    return allMoves;
}


async function makeMoves() {
    done = false;

    while (!tetris.died && tetris.movesTaken <= 499) {
        let move = getBestMove();

        for (let rot = 0; rot < move.rotation; rot++) {
            tetris.rotate();
        }

        if (move.sideMoves < 0) {
            for (let xl = 0; xl < Math.abs(move.sideMoves); xl++) {
                tetris.moveLeft();
            }
        } else if (move.sideMoves > 0) {
            for (let xr = 0; xr < move.sideMoves; xr++) {
                tetris.moveRight();
            }
        }

        await waitUntil(() => tetris.ground === true);
        if (!tetris.aiActivated) {
            tetris.ground = false;
            break;
        }

        tetris.updateScore();
        tetris.nextShape();
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

function scoreUpdater(scoreType) {
    loadedData = localStorage.getItem(scoreType);
    let data = JSON.parse(loadedData);

    if (data < tetris.score) {
        data = tetris.score;
        let gameDataJson = JSON.stringify(data);
        localStorage.setItem(scoreType, gameDataJson);
    }

    let docEl = document.getElementById(scoreType);
    docEl.innerText = data;
}

// Function to show the blocks on the canvas
function print(tetris) {
    if (tetris.died) {
        if (totalGameTime != 0) {
            calculatePPS();

            if (tetris.aiActivated) scoreUpdater("highscoreAI");
            else scoreUpdater("highscorePlayer");
        }

        ai.scores[index] = JSON.parse(JSON.stringify(tetris.score));
        ai.moves[index] = JSON.parse(JSON.stringify(tetris.movesTaken));
        index++;

        if (!tetris.aiActivated) {
            gameOverScreen.setAttribute("visibility", "visible");
            play_sound = false;

            pauseGame();
            ai.reset();

            ai_level.innerText = 1;
        } else {
            tetris.reset();
        }
    }

    ctx.clearRect(0, 0, COLS, ROWS)

    if (!tetris.aiActivated && !best_activated) {
        ai_chromosomes.innerText = "Player plays!";
    }

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
function updateSpeed(tetris) {
    if (tetris.score >= vorigeScore + 4000) {
        clearInterval(id2)
        tetris.speed -= 50;

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
    if (tetris.aiActivated) {

        let sum = ai.moves.reduce(function (a, b) {
            return a + b;
        })

        graphData.data.datasets[0].data.push(sum / ai.populationSize);
        graphData.data.labels.push(ai.populationNumber);
    }

    chart.destroy();
    refreshChart();
};

// End of graph

// helpfunction to configure localStorage components
function localStorageLoader(itemList) {
    for (let i = 0; i < itemList.length; i++) {
        let item = itemList[i];

        loadedData = localStorage.getItem(item);
        let docEl = document.getElementById(item);

        if (loadedData !== null) {
            let data = JSON.parse(loadedData);
            docEl.textContent = data;
        } else {
            let data = 0;
            let dataJson = JSON.stringify(data);

            localStorage.setItem(item, dataJson);
            docEl.textContent = data;
        }
    }
}

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

    localStorageLoader(["highscorePlayer", "highscoreAI", "PPS"])
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

    document.getElementById("title").addEventListener("click", tryToReset);

    document.getElementById("bestAI").addEventListener("click", toggleBestAI);

    // document.addEventListener("longpressevent", function (event) {
    //     window.addEventListener("touchStart", touchStart, false);
    //     window.addEventListener("touchEnd", touchEnd, false);
    // });
    // document.addEventListener('touchcoordinates', getTouchCoordinates, false);
    // document.addEventListener('touchcontrols', mobileControl, false);
    document.addEventListener("keydown", keyHandler);


    // Disable default keyhandler when playing (Stops the canvas from scrolling)
    window.addEventListener("keydown", arrowKeysHandler, false);

    window.onload = function () {
        refreshChart();
    }

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
