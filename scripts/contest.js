import { loadRoster, saveRoster } from "./modules/ai/roster.js";
import { runContest } from "./modules/ai/contest-runner.js";
import { createReplay } from "./modules/ai/replay.js";
import { createScaledContext } from "./modules/renderer.js";
import { AI_ROSTER_STORAGE_KEY, COLS, ROWS } from "./modules/constants.js";

const REPLAY_BLOCK_SIZE = 20;
const MIN_GAMES_PER_ENTRANT = 1;
const MAX_GAMES_PER_ENTRANT = 20;
const DEFAULT_GAMES_PER_ENTRANT = 3;
const MIN_MAX_MOVES = 50;
const MAX_MAX_MOVES = 50000;
const DEFAULT_MAX_MOVES = 2000;
const ALGORITHM_LABELS = {
    "genetic-algorithm": "Genetic Algorithm",
    "cma-es": "CMA-ES",
    neat: "NEAT",
    rl: "Reinforcement Learning"
};

const rosterListElement = document.getElementById("roster-list");
const gamesPerEntrantInput = document.getElementById("games-per-entrant");
const contestMaxMovesInput = document.getElementById("contest-max-moves");
const runContestButton = document.getElementById("run-contest");
const contestStatus = document.getElementById("contest-status");
const contestResultsTable = document.getElementById("contest-results-table");
const contestReplayStatus = document.getElementById("contest-replay-status");

const replayContext = createScaledContext("contest-replay-board", COLS, ROWS, REPLAY_BLOCK_SIZE);

let roster = [];
let resultsChart = null;
let activeReplay = null;

function clampNumber(value, min, max, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

function algorithmLabel(key) {
    return ALGORITHM_LABELS[key] ?? key;
}

function watchGenome(genome, label) {
    activeReplay?.stop();
    contestReplayStatus.textContent = `Watching ${label}...`;
    activeReplay = createReplay({
        genome,
        context: replayContext,
        onStep: ({ score, movesTaken }) => {
            contestReplayStatus.textContent = `${label}: score ${Math.round(score)} - move ${movesTaken}`;
        },
        onFinish: ({ score, movesTaken, terminationReason }) => {
            contestReplayStatus.textContent =
                `${label} finished (${terminationReason}) - score ${Math.round(score)} in ${movesTaken} moves`;
        }
    });
    activeReplay.start();
}

function deleteEntry(id) {
    roster = roster.filter((entry) => entry.id !== id);
    saveRoster(AI_ROSTER_STORAGE_KEY, roster);
    renderRoster();
}

function downloadEntry(entry) {
    const blob = new Blob([JSON.stringify(entry, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${entry.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function renderRoster() {
    rosterListElement.replaceChildren();
    if (roster.length === 0) {
        const empty = document.createElement("p");
        empty.className = "dashboard-status";
        empty.textContent = "No saved AIs yet.";
        rosterListElement.appendChild(empty);
        return;
    }
    for (const entry of roster) {
        const row = document.createElement("div");
        row.className = "roster-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "form-check-input";
        checkbox.dataset.entryId = entry.id;
        checkbox.checked = true;

        const name = document.createElement("span");
        name.className = "roster-item-name";
        name.textContent = entry.name;

        const meta = document.createElement("span");
        meta.className = "roster-item-meta";
        meta.textContent = `${algorithmLabel(entry.algorithm)} - score ${entry.score}`;

        const watchButton = document.createElement("button");
        watchButton.type = "button";
        watchButton.className = "btn btn-outline-light btn-sm";
        watchButton.textContent = "Watch";
        watchButton.addEventListener("click", () => watchGenome(entry.genome, entry.name));

        const downloadEntryButton = document.createElement("button");
        downloadEntryButton.type = "button";
        downloadEntryButton.className = "btn btn-outline-light btn-sm";
        downloadEntryButton.textContent = "Download";
        downloadEntryButton.addEventListener("click", () => downloadEntry(entry));

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn btn-outline-danger btn-sm";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deleteEntry(entry.id));

        row.append(checkbox, name, meta, watchButton, downloadEntryButton, deleteButton);
        rosterListElement.appendChild(row);
    }
}

function selectedEntrants() {
    const checkedIds = new Set(
        Array.from(rosterListElement.querySelectorAll("input[type=checkbox]:checked"))
            .map((checkbox) => checkbox.dataset.entryId)
    );
    return roster.filter((entry) => checkedIds.has(entry.id));
}

function createResultsChart() {
    resultsChart = new Chart(document.getElementById("contest-chart"), {
        type: "bar",
        data: {
            labels: [],
            datasets: [{ label: "Average score", data: [], backgroundColor: "#FFE600" }]
        },
        options: {
            responsive: true,
            animation: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

function renderResults(results) {
    resultsChart.data.labels = results.map((result) => result.name);
    resultsChart.data.datasets[0].data = results.map((result) => Math.round(result.averageScore));
    resultsChart.update();

    contestResultsTable.replaceChildren();
    const table = document.createElement("table");
    table.className = "results-table";
    const headerRow = document.createElement("tr");
    for (const label of ["Rank", "Name", "Algorithm", "Average score", "Best score", "Scores"]) {
        const th = document.createElement("th");
        th.textContent = label;
        headerRow.appendChild(th);
    }
    table.appendChild(headerRow);
    results.forEach((result, index) => {
        const row = document.createElement("tr");
        const cells = [
            index + 1,
            result.name,
            algorithmLabel(result.algorithm),
            Math.round(result.averageScore),
            result.bestScore,
            result.scores.join(", ")
        ];
        for (const value of cells) {
            const td = document.createElement("td");
            td.textContent = value;
            row.appendChild(td);
        }
        table.appendChild(row);
    });
    contestResultsTable.appendChild(table);
}

function wireControls() {
    runContestButton.addEventListener("click", async () => {
        const entrants = selectedEntrants();
        if (entrants.length < 2) {
            contestStatus.textContent = "Select at least two AIs to run a contest.";
            return;
        }
        const gamesPerEntrant = clampNumber(
            gamesPerEntrantInput.value, MIN_GAMES_PER_ENTRANT, MAX_GAMES_PER_ENTRANT, DEFAULT_GAMES_PER_ENTRANT
        );
        const maxMoves = clampNumber(
            contestMaxMovesInput.value, MIN_MAX_MOVES, MAX_MAX_MOVES, DEFAULT_MAX_MOVES
        );
        runContestButton.disabled = true;
        contestStatus.textContent = `Running ${entrants.length} AIs x ${gamesPerEntrant} games...`;
        const results = await runContest({
            entrants,
            gamesPerEntrant,
            maxMoves,
            onProgress: ({ completed, total }) => {
                contestStatus.textContent = `Running... ${completed}/${total} games finished.`;
            }
        });
        renderResults(results);
        contestStatus.textContent = `Done. Winner: ${results[0].name}.`;
        runContestButton.disabled = false;
    });
}

function init() {
    roster = loadRoster(AI_ROSTER_STORAGE_KEY);
    renderRoster();
    createResultsChart();
    wireControls();
}

init();
