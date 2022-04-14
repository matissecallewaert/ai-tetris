import Tetris from "./modules/tetris.js"

//alert("Script detected")

let canvas = document.getElementById("board")
let ctx = canvas.getContext("2d")

let COLS = 10
let ROWS = 20
let BLOCK_SIZE = 45

ctx.canvas.width = COLS * BLOCK_SIZE;
ctx.canvas.height = ROWS * BLOCK_SIZE;

ctx.scale(BLOCK_SIZE, BLOCK_SIZE)

let tetris = new Tetris();

function move(tetris) {
    tetris.MoveDown();
}

let speed = 500;
let play = false;

let keyHandler = (k) => {
    if(play){
        if (k.keyCode === 40) {
            tetris.MoveDown();
        } else if (k.keyCode === 37) {
            tetris.MoveLeft();
        } else if (k.keyCode === 39) {
            tetris.MoveRight();
        } else if (k.keyCode === 38) {
            tetris.Rotate();
        } else if (k.key === "s") {
            clearInterval(id2)
            speed -= 50;
            id2 = setInterval(move, speed, tetris);
        }else if(k.key === " "){
            tetris.Drop();
        }
    }
}

function startGame() {
    clearInterval(id2);
    id2 = setInterval(move, 500, tetris);
    play = true;
}

function resetGame() {
    clearInterval(id2);
    speed = 500;
    tetris.Reset();
    play = false;
}

function pauseGame() {
    clearInterval(id2);
    //console.log(id2)
    play = false;
}

document.getElementById("startButton").addEventListener("click", startGame)
document.getElementById("pauseButton").addEventListener("click", pauseGame)
document.getElementById("resetButton").addEventListener("click", resetGame)

document.addEventListener("keydown", keyHandler);

let printinterval = setInterval(print, 100, tetris);
let scorebord = document.getElementById("scoreboard");
let upcomingShape = document.getElementById("upcomingShape");
tetris.ApplyShape();
let id2;

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