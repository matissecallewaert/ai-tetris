/* 

This page fixes the leaderboard on the website.

 */
let amountOfPlayers = 25; //amount of users to fetch from tetr.io api
let jsonusercount = "N/A"; //amount of users on tetr.io
let jsonrankedcount = "N/A"; //amount of users that play ranked on tetr.io
let table = document.getElementById("highscoreTable");
table.hidden = true; //hide table while getting data
let toAddGlobalPlayerData;
let topPlayerData = [];

let td; //define here so the js doesn't have to create these every time
let tr;
let th;

let learnMore = document.getElementById("learnMore");
let learnMoreText = document.getElementById("learnMoreText");
let learnMoreText2 = document.getElementById("learnMoreText2");
let amountofplayersinfo = document.getElementById("amountofplayersinfo");

let language;

learnMore.addEventListener("click", toggleExplanation);
learnMoreText.hidden = true; //hide text while not sure if fetch is successful
learnMoreText2.hidden = true;
document.getElementById("dataError").hidden = true; //hide these while loading/fetching data
document.getElementById("source").hidden = true;

document.getElementById("localeSwitcher").addEventListener("change", checkLanguage);

//checks selected language and calls function to set up extra info in the correct language
function checkLanguage() {
    let select = document.getElementById("localeSwitcher");
    language = select.options[select.selectedIndex].value;
    setUpExtraInfo();
}

async function setUpExtraInfo() {
    let noErrorInFetch = true;
    let currentplayers = document.getElementById("currentplayers");
    let rankedplayers = document.getElementById("rankedplayers");
    if (jsonrankedcount === "N/A" && jsonusercount === "N/A") { //if fetch hasn't been done yet
        fetch("http://localhost:8010/proxy/api/general/stats") //fetching and updating (ranked) playercount
            .then(data => data.json())
            .then(jsondata => {
                jsonusercount = jsondata.data.usercount;
                jsonrankedcount = jsondata.data.rankedcount;
            })
            .catch(() => {
                document.getElementById("amountofplayers").hidden = true; //don't show if the fetch fails
                noErrorInFetch = false;
            })
        if (noErrorInFetch) await waitUntil(() => jsonrankedcount != "N/A" && jsonusercount != "N/A") //wait for fetch to finish
    }

    let topplayer = document.getElementById("topplayer");
    let trrating = document.getElementById("trrating");
    let pps = document.getElementById("pps");
    let topinfo = document.getElementById("topinfo");

    //fills in the extra info in the correct language 
    //(doing this via assets/lang/*.json is unnecessarily complicated since this info isn't hardcoded)
    if (language === "en") {

        currentplayers.innerText = "There are currently " + jsonusercount + " players registered on the website.";
        rankedplayers.innerText = jsonrankedcount + " of those play competitively.\n\n";
        topplayer.innerText = "The top player right now is " + topPlayerData[1];
        trrating.innerText = " with a TR Rating of " + topPlayerData[2];
        pps.innerText = " and an average of " + topPlayerData[3] + " pieces placed per second.";

    }
    else if (language === "nl") {
        currentplayers.innerText = "Er zijn momenteel " + jsonusercount + " spelers geregistreerd op de website.";
        rankedplayers.innerText = jsonrankedcount + " van die spelers spelen competitief.\n\n";
        topplayer.innerText = "De beste speler momenteel is " + topPlayerData[1];
        trrating.innerText = " met een TR Rating van " + topPlayerData[2];
        pps.innerText = " en een gemiddelde van " + topPlayerData[3] + " blokken geplaatst per seconde.";
    }

    if (topPlayerData[1] === undefined || topPlayerData[2] === undefined || topPlayerData[3] === undefined) {
        topinfo.hidden = true; //if something went wrong, don't show this particular piece of info
    }

    if (jsonrankedcount == "N/A" || jsonusercount == "N/A") {
        amountofplayersinfo.hidden = true; //if something went wrong, don't show this particular piece of info
    }

}

function scrollDown() {
    setTimeout(function () {
        document.getElementById('learnMoreText').scrollIntoView();
    }, 50);
}

function toggleExplanation() {
    if (learnMoreText.hidden) scrollDown(); //if hidden, show info and scroll down
    learnMoreText.hidden = !learnMoreText.hidden; //if hidden, show and the other way around
    learnMoreText2.hidden = !learnMoreText2.hidden;
}

//the fetching of the actual leaderboard
function addGlobalHighScores() {
    fetch("http://localhost:8010/proxy/api/users/lists/league?limit=" + amountOfPlayers)
        .then(data => data.json())
        .then(jsondata => {
            for (let i = 0; i < amountOfPlayers; i++) {
                //setting up stats to have the right format
                let pps = Number((jsondata.data.users[i].league.pps).toFixed(2)).toString();
                if (pps.length == 1) {
                    pps += ".0";
                }
                while (pps.split(".")[1].length < 2) pps += "0";

                let trRating = Number((jsondata.data.users[i].league.rating).toFixed(3)).toString();
                if (!trRating.includes(".")) {
                    trRating += ".0";
                }
                while (trRating.split(".")[1].length < 3) trRating += "0";

                //initialising which data to add per player
                toAddGlobalPlayerData = [i + 1, jsondata.data.users[i].username.trim(),
                    trRating, pps]

                if (i === 0) topPlayerData = toAddGlobalPlayerData; //top player = first fetched player

                tr = document.createElement("tr"); //adding stats per player to the table
                for (let playerData of toAddGlobalPlayerData) {
                    td = document.createElement("td");
                    td.innerText = playerData;
                    tr.appendChild(td);
                }
                table.appendChild(tr);

            }
            checkLanguage(); //after fetch, set up info with correct language
            setTimeout(function () {
                //stop showing loadscreen, show table and source 
                //with delay to make sure loadscreen is shown for at least 1.5s
                table.hidden = false;
                document.getElementById("loading...").hidden = true;
                document.getElementById("loadingGif").hidden = true;
                document.getElementById("source").hidden = false;
                document.getElementById("dataError").hidden = true;
            }, 1500);
        })
        .catch(() => {
            checkLanguage();
            setTimeout(function () {
                //if something goes wrong, hide loadscreen and show error after +1.5s
                document.getElementById("loading...").hidden = true;
                document.getElementById("loadingGif").hidden = true;
                document.getElementById("dataError").hidden = false;
            }, 1500);
        })

}

//same function as in main, waits untill promise is fulfilled
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

addGlobalHighScores(); //call main fetch function, functions call eachother so everything is called in the correct order
