let amountOfPlayers = 25;
let table = document.getElementsByTagName("table")[0];
let toAddGlobalPlayerData;
let toAddTableTitles = ["Rank", "Player", "TR-Rating", "PPS"];
let topPlayerData = [];

let hscore = JSON.parse(localStorage.getItem("highScores")).Highscore;

let td;
let tr;
let th;

let learnMore = document.getElementById("learnMore");
let learnMoreText = document.getElementById("learnMoreText");
learnMore.addEventListener("click", toggleExplanation);
learnMoreText.hidden = true;

function setUpExtraInfo() {
    let currentplayers = document.getElementById("currentplayers");
    let rankedplayers = document.getElementById("rankedplayers");
    fetch("http://localhost:8010/proxy/api/general/stats")
        .then(data => data.json())
        .then(jsondata => { currentplayers.innerText = jsondata.data.usercount; rankedplayers.innerText = jsondata.data.rankedcount; })
        .catch(() => {
            currentplayers.innerText = "N/A";
            rankedplayers.innerText = "N/A";
            document.getElementById("amountofplayers").hidden = true;
        })
    let topplayer = document.getElementById("topplayer");
    let trrating = document.getElementById("trrating");
    let pps = document.getElementById("pps");
    let topinfo = document.getElementById("topinfo");

    topplayer.innerText = topPlayerData[1];
    trrating.innerText = topPlayerData[2];
    pps.innerText = topPlayerData[3];

    if (topPlayerData[1] == undefined || topPlayerData[2] == undefined || topPlayerData[3] == undefined) { topinfo.hidden = true; }



}

function scrollDown() {
    setTimeout(function () { document.getElementById('learnMoreText').scrollIntoView(); }, 50);
}

function toggleExplanation() {
    if (learnMoreText.hidden) {
        learnMore.innerText = "Hide info";
        scrollDown();
    }
    else {
        learnMore.innerText = "Show info";
    }
    learnMoreText.hidden = !learnMoreText.hidden;
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



function addGlobalHighScores() {
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

                if (i === 0) topPlayerData = toAddGlobalPlayerData;

                tr = document.createElement("tr");
                for (let playerData of toAddGlobalPlayerData) {
                    td = document.createElement("td");
                    td.innerText = playerData;
                    tr.appendChild(td);
                }
                table.appendChild(tr);

            }
            //console.log(jsondata);
            setUpExtraInfo();
            //addHighScore(false);

        })
        .catch(() => {
            let p = document.createElement("p");
            let main = document.getElementById("maindiv");
            p.innerText = "\nSomething went wrong while loading the global scores.";
            p.style.textAlign = "center";
            main.appendChild(p);
            setUpExtraInfo();
            //addHighScore(true);
        })

}



//not in use anymore

/* function addHighScore(fetchError) {
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

} */

addTitles();
addGlobalHighScores();
