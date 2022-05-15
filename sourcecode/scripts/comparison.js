let amountOfPlayers = 25;
let jsonusercount = "N/A";
let jsonrankedcount = "N/A";
let table = document.getElementById("highscoreTable");
table.hidden = true;
let toAddGlobalPlayerData;
let toAddTableTitles = ["Rank", "Player", "TR-Rating", "PPS"];
let topPlayerData = [];

let hscore = JSON.parse(localStorage.getItem("highScores")).Highscore;

let td;
let tr;
let th;

let learnMore = document.getElementById("learnMore");
let learnMoreText = document.getElementById("learnMoreText");
let learnMoreText2 = document.getElementById("learnMoreText2");

let language;

learnMore.addEventListener("click", toggleExplanation);
learnMoreText.hidden = true;
learnMoreText2.hidden = true;
document.getElementById("dataError").hidden = true;
document.getElementById("source").hidden = true;

document.getElementById("localeSwitcher").addEventListener("change", checkLanguage);

function checkLanguage() {
    let select = document.getElementById("localeSwitcher");
    language = select.options[select.selectedIndex].value;
    setUpExtraInfo();
}

function setUpExtraInfo() {
    let currentplayers = document.getElementById("currentplayers");
    let rankedplayers = document.getElementById("rankedplayers");
    let amountOfWait = 0;

    if (jsonrankedcount == "N/A" && jsonusercount == "N/A") {
        amountOfWait = 2000;
        fetch("http://localhost:8010/proxy/api/general/stats")
            .then(data => data.json())
            .then(jsondata => {
                jsonusercount = jsondata.data.usercount;
                jsonrankedcount = jsondata.data.rankedcount;
            })
            .catch(() => {
                document.getElementById("amountofplayers").hidden = true;
            })
    }

    let topplayer = document.getElementById("topplayer");
    let trrating = document.getElementById("trrating");
    let pps = document.getElementById("pps");
    let topinfo = document.getElementById("topinfo");

    setTimeout(() => {
        if (language == "en") {

            currentplayers.innerText = "There are currently " + jsonusercount + " players registered on the website.";
            rankedplayers.innerText = jsonrankedcount + " of those play competitively.\n\n";
            topplayer.innerText = "The top player right now is " + topPlayerData[1];
            trrating.innerText = " with a TR Rating of " + topPlayerData[2];
            pps.innerText = " and an average of " + topPlayerData[3] + " pieces placed per second.";

        }
        else if (language == "nl") {
            currentplayers.innerText = "Er zijn momenteel " + jsonusercount + " spelers geregistreerd op de website.";
            rankedplayers.innerText = jsonrankedcount + " van die spelers spelen competitief.\n\n";
            topplayer.innerText = "De beste speler momenteel is " + topPlayerData[1];
            trrating.innerText = " met een TR Rating van " + topPlayerData[2];
            pps.innerText = " en een gemiddelde van " + topPlayerData[3] + " blokken geplaatst per seconde.";
        }
    }, amountOfWait);

    if (topPlayerData[1] == undefined || topPlayerData[2] == undefined || topPlayerData[3] == undefined) {
        topinfo.hidden = true;
    }


}

function scrollDown() {
    setTimeout(function () {
        document.getElementById('learnMoreText').scrollIntoView();
    }, 50);
}

function toggleExplanation() {
    if (learnMoreText.hidden) scrollDown();
    learnMoreText.setAttribute("data-i18n-key", "lb-info");
    learnMoreText.hidden = !learnMoreText.hidden;
    learnMoreText2.hidden = !learnMoreText2.hidden;
}


function addGlobalHighScores() {
    fetch("http://localhost:8010/proxy/api/users/lists/league?limit=" + amountOfPlayers)
        .then(data => data.json())
        .then(jsondata => {
            for (let i = 0; i < amountOfPlayers; i++) {
                let pps = Number((jsondata.data.users[i].league.pps).toFixed(2)).toString();
                while (pps.split(".")[1].length < 2) pps += "0";

                let trRating = Number((jsondata.data.users[i].league.rating).toFixed(3)).toString();
                while (trRating.split(".")[1].length < 3) trRating += "0";

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
            checkLanguage();
            setTimeout(function () {
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
                document.getElementById("loading...").hidden = true;
                document.getElementById("loadingGif").hidden = true;
                document.getElementById("dataError").hidden = false;
            }, 1500);
        })

}

addGlobalHighScores();
