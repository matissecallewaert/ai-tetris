let amountOfPlayers = 10;
let table = document.getElementsByTagName("table")[0];
let toAddData;
let toAddTableTitles = ["Rank", "Player", "Rating", "XP"];
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

addTitles();

fetch("http://localhost:8010/proxy/api/users/lists/league?limit=" + amountOfPlayers)
    .then(data => data.json())
    .then(jsondata => {

        for (let i = 0; i < amountOfPlayers; i++) {
            toAddData = [i + 1, jsondata.data.users[i].username,
            Number((jsondata.data.users[i].league.rating).toFixed(3)),
            Number((jsondata.data.users[i].xp).toFixed(0))];

            tr = document.createElement("tr");
            for (let playerData of toAddData) {
                td = document.createElement("td");
                td.innerText = playerData;
                tr.appendChild(td);
            }
            table.appendChild(tr);

        }
        console.log(jsondata);
    }).catch(() => {
        let p = document.createElement("p");
        let main = document.getElementsByTagName("main")[0];
        p.innerText = "Something went wrong while loading the scores.";
        main.appendChild(p);
    }
    )
