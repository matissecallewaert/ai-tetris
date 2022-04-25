let amountOfPlayers = 25;
let table = document.getElementsByTagName("table")[0];
let toAddGlobalPlayerData;
let toAddTableTitles = ["Rank", "Player", "TR-Rating", "Pieces per second"];
let hscore = JSON.parse(localStorage.getItem("highScores")).Highscore;

let td;
let tr;
let th;

function waitForNSeconds(n) {
    return new Promise(function (resolve) {
        setTimeout(resolve, n * 1000);
    });
}


function addTitles() {
    tr = document.createElement("tr");
    for (let title of toAddTableTitles) {
        th = document.createElement("th");
        th.innerText = title;
        tr.appendChild(th);
    }
    table.appendChild(tr);
}



async function addGlobalHighScores() {
    fetch("http://localhost:8010/proxy/api/users/lists/league?limit=" + amountOfPlayers)
        .then(data => data.json())
        .then(jsondata => {
            for (let i = 0; i < amountOfPlayers; i++) {
                let pps = Number((jsondata.data.users[i].league.pps).toFixed(2)).toString();
                if (pps.split(".")[1].length < 2) pps += "0";

                let trRating = Number((jsondata.data.users[i].league.rating).toFixed(3)).toString();
                if (trRating.split(".")[1].length < 3) trRating += "0";

                toAddGlobalPlayerData = [i + 1, jsondata.data.users[i].username.trim(),
                    trRating, pps]


                tr = document.createElement("tr");
                for (let playerData of toAddGlobalPlayerData) {
                    td = document.createElement("td");
                    td.innerText = playerData;
                    tr.appendChild(td);
                }
                table.appendChild(tr);

            }
            console.log(jsondata);
            //addHighScore(false);

        })
    /*.catch(() => {
        let p = document.createElement("p");
        let main = document.getElementById("maindiv");
        p.innerText = "\nSomething went wrong while loading the global scores.";
        main.appendChild(p);
        //addHighScore(true);
    })*/

}

function addHighScore(fetchError) {
    let toAddUserData = ["99+", "You", "no rating", hscore];
    if (fetchError) toAddUserData[0] = "N/A";
    tr = document.createElement("tr");
    for (let userData of toAddUserData) {
        td = document.createElement("td");
        td.innerText = "...";
        tr.appendChild(td);
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

addTitles();
addGlobalHighScores();
