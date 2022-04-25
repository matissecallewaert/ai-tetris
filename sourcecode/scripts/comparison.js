let amountOfPlayers = 20;
let table = document.getElementsByTagName("table")[0];
let toAddGlobalPlayerData;
let toAddTableTitles = ["Rank", "Player", "Rating", "XP"];
let hscore = JSON.parse(localStorage.getItem("highScores")).Highscore;

let toAddUserData = ["---", "You", "no rating", hscore];
let td;
let tr;
let th;

function addTitles() {
    tr = document.createElement("tr");
    for (let title of toAddTableTitles) {
        th = document.createElement("th");
        th.innerText = title;
        tr.appendChild(th);
    }
    table.appendChild(tr);
}

function addHighScore() {
    table = document.getElementsByTagName("table")[1];
    tr = document.createElement("tr");
    for (let title of toAddTableTitles) {
        th = document.createElement("th");
        th.innerText = title;
        tr.appendChild(th);
    }
    table.appendChild(tr);

    tr = document.createElement("tr");
    for (let userData of toAddUserData) {
        td = document.createElement("td");
        td.innerText = userData;
        tr.appendChild(td);
    }
    table.appendChild(tr);
}

function addGlobalHighScores() {
    fetch("http://localhost:8010/proxy/api/users/lists/league?limit=" + amountOfPlayers)
        .then(data => data.json())
        .then(jsondata => {
            table = document.getElementsByTagName("table")[0];
            for (let i = 0; i < amountOfPlayers; i++) {
                toAddGlobalPlayerData = [i + 1, jsondata.data.users[i].username.trim(),
                Number((jsondata.data.users[i].league.rating).toFixed(3)),
                Number((jsondata.data.users[i].xp).toFixed(0))];

                tr = document.createElement("tr");
                for (let playerData of toAddGlobalPlayerData) {
                    td = document.createElement("td");
                    td.innerText = playerData;
                    tr.appendChild(td);
                }
                table.appendChild(tr);
            }
            console.log(jsondata);
        })
        .catch(() => {
            let p = document.createElement("p");
            let main = document.getElementsByTagName("main")[0];
            p.innerText = "Something went wrong while loading the global scores.";
            main.appendChild(p);
        })

}

addTitles();
addGlobalHighScores();
addHighScore();
