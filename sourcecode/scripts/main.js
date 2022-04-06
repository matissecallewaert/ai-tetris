import Tetris from "./modules/tetris.js"

//alert("Script detected")

let tetris = new Tetris();

function move(tetris) {
    tetris.MoveDown();
}

let speed = 500;

let keyHandler = (k) => {
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
    }
}

function startGame() {
    clearInterval(id2)
    id2 = setInterval(move, 500, tetris);
    //console.log(id2)
}

function resetGame() {
    clearInterval(id2)
    speed = 500;
    tetris.Reset();
}

function pauseGame() {
    clearInterval(id2);
    //console.log(id2)
}

document.getElementById("startButton").addEventListener("click", startGame)
document.getElementById("pauseButton").addEventListener("click", pauseGame)
document.getElementById("resetButton").addEventListener("click", resetGame)

document.addEventListener("keydown", keyHandler);

setInterval(print, 100, tetris);
let scorebord = document.getElementById("scoreboard");
let upcomingShape = document.getElementById("upcomingShape");
tetris.ApplyShape();
let id2;

function print(tetris) {
    let grid = document.getElementById("tetris");
    let e = document.getElementById("tetris");
    let child = e.lastElementChild;
    while (child) {
        e.removeChild(child);
        child = e.lastElementChild;
    }
    for (let y = 0; y < 20; y++) {
        let zin = document.createElement("p");
        for (let x = 0; x < 10; x++) {
            let letter = document.createElement("span");
            letter.style.color = tetris.colors[tetris.grid[y][x]];
            letter.textContent += tetris.grid[y][x];
            zin.appendChild(letter);
        }
        grid.appendChild(zin);
    }
    scorebord.style.color = "#FFFFFF";
    scorebord.textContent = tetris.score;
    let letter;
    child = upcomingShape.lastElementChild;
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