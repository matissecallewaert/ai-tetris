import { createTrainingManager, DEFAULT_MAX_MOVES } from "./modules/ai/training-manager.js";
import { createGeneticAlgorithmStrategy } from "./modules/ai/genetic-algorithm.js";
import { createCmaEsStrategy } from "./modules/ai/cma-es.js";
import { GENE_COUNT } from "./modules/ai/genome.js";
import { createNeatStrategy } from "./modules/ai/neat/neat.js";
import { createRlStrategy } from "./modules/ai/rl/td-learning.js";
import { createReplay } from "./modules/ai/replay.js";
import {
    deserializeTrainingState,
    loadTrainingState,
    saveTrainingState,
    serializeTrainingState
} from "./modules/ai/persistence.js";
import { createRosterEntry, loadRoster, saveRoster } from "./modules/ai/roster.js";
import { createScaledContext } from "./modules/renderer.js";
import { FEATURE_ORDER } from "./modules/ai/feature-schema.js";
import { isNeatGenome } from "./modules/ai/genome-shape.js";
import { AI_ROSTER_STORAGE_KEY, AI_TRAINING_STORAGE_KEY, COLS, ROWS } from "./modules/constants.js";

const MIN_POPULATION_SIZE = 4;
const MAX_POPULATION_SIZE = 200;
const MIN_WORKER_COUNT = 1;
const MAX_WORKER_COUNT = 8;
const MIN_MAX_MOVES = 50;
const MAX_MAX_MOVES = 50000;
const DEFAULT_POPULATION_SIZE = 50;
const DEFAULT_WORKER_COUNT = 4;
const REPLAY_BLOCK_SIZE = 20;
const STATUS_CLEAR_DELAY_MS = 4000;

const ALGORITHM_META = {
    "genetic-algorithm": {
        label: "Genetic Algorithm",
        colors: { best: "#00FF00", avg: "#FFA500", moves: "#0000FF" },
        createStrategy: () => createGeneticAlgorithmStrategy()
    },
    "cma-es": {
        label: "CMA-ES",
        colors: { best: "#00FFFF", avg: "#FF00FF", moves: "#FFE600" },
        createStrategy: () => createCmaEsStrategy(GENE_COUNT)
    },
    neat: {
        label: "NEAT",
        colors: { best: "#FF4FA3", avg: "#4FD1FF", moves: "#B4FF4F" },
        createStrategy: () => createNeatStrategy()
    },
    rl: {
        label: "Reinforcement Learning",
        colors: { best: "#FF8C00", avg: "#00CED1", moves: "#ADFF2F" },
        createStrategy: () => createRlStrategy(),
        createWorker: () => new Worker(new URL("./modules/ai/rl/rl-worker.js", import.meta.url), { type: "module" })
    }
};
const STAT_FIELDS = [
    ["Generation", "generation"],
    ["Best score (this generation)", "bestScore"],
    ["Best score (all time)", "bestEverScore"],
    ["Average score", "averageScore"],
    ["Average moves", "averageMoves"],
    ["Active workers", "workerCount"]
];

const algorithmSelect = document.getElementById("algorithm-select");
const algorithmSelectRow = document.getElementById("algorithm-select-row");
const algorithmPicker = document.getElementById("algorithm-picker");
const clearCompareSelectionButton = document.getElementById("clear-compare-selection");
const genomeSourceRow = document.getElementById("genome-source-row");
const genomeSourceSelect = document.getElementById("genome-source");
const bestGenomeCard = document.getElementById("best-genome-card");
const populationSizeInput = document.getElementById("population-size");
const workerCountInput = document.getElementById("worker-count");
const maxMovesInput = document.getElementById("max-moves");
const startButton = document.getElementById("start-training");
const pauseButton = document.getElementById("pause-training");
const resetButton = document.getElementById("reset-training");
const saveButton = document.getElementById("save-best-genome");
const downloadButton = document.getElementById("download-best-genome");
const loadFileInput = document.getElementById("load-genome-file");
const watchButton = document.getElementById("watch-best-agent");
const rosterNameInput = document.getElementById("roster-name-input");
const addToRosterButton = document.getElementById("add-to-roster");
const persistenceStatus = document.getElementById("persistence-status");
const replayStatus = document.getElementById("replay-status");
const statsPanelsContainer = document.getElementById("stats-panels");
const bestGenesPanelsContainer = document.getElementById("best-genes-panels");

const replayContext = createScaledContext("replay-board", COLS, ROWS, REPLAY_BLOCK_SIZE);

let runs = {};
let loadedGenome = null;
let activeReplay = null;
let scoreChart = null;
let movesChart = null;
let statElements = {};
let geneElements = {};
const compareSelection = new Set();
let scoreDatasetIndexByKey = {};
let movesDatasetIndexByKey = {};

function clampNumber(value, min, max, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

function readSettings() {
    return {
        populationSize: clampNumber(
            populationSizeInput.value, MIN_POPULATION_SIZE, MAX_POPULATION_SIZE, DEFAULT_POPULATION_SIZE
        ),
        workerCount: clampNumber(
            workerCountInput.value, MIN_WORKER_COUNT, MAX_WORKER_COUNT, DEFAULT_WORKER_COUNT
        ),
        maxMoves: clampNumber(
            maxMovesInput.value, MIN_MAX_MOVES, MAX_MAX_MOVES, DEFAULT_MAX_MOVES
        )
    };
}

function showStatus(element, message) {
    element.textContent = message;
    setTimeout(() => {
        if (element.textContent === message) {
            element.textContent = "";
        }
    }, STATUS_CLEAR_DELAY_MS);
}

function activeAlgorithmKeys() {
    return compareSelection.size > 0 ? [...compareSelection] : [algorithmSelect.value];
}

function selectedSourceKey() {
    return compareSelection.size > 0 ? genomeSourceSelect.value : algorithmSelect.value;
}

function storageKeyFor(key) {
    return `${AI_TRAINING_STORAGE_KEY}:${key}`;
}

function currentBestGenome(key) {
    return runs[key]?.manager.getBestGenome() ?? runs[key]?.restoredGenome ?? loadedGenome;
}

function currentBestScore(key) {
    const runHistory = runs[key]?.history ?? [];
    return runHistory.length ? Math.max(...runHistory.map((entry) => entry.bestEverScore)) : 0;
}

function persistProgress(key) {
    const genome = runs[key]?.manager.getBestGenome();
    if (!genome) {
        return;
    }
    saveTrainingState(storageKeyFor(key), {
        bestGenome: genome,
        bestScore: currentBestScore(key),
        history: runs[key].history
    });
}

function ensureChartDatasets(key) {
    if (scoreDatasetIndexByKey[key]) {
        return;
    }
    const { label, colors } = ALGORITHM_META[key];
    const bestIndex = scoreChart.data.datasets.length;
    scoreChart.data.datasets.push({ label: `${label} best`, data: [], borderColor: colors.best, tension: 0.2 });
    const avgIndex = scoreChart.data.datasets.length;
    scoreChart.data.datasets.push({ label: `${label} avg`, data: [], borderColor: colors.avg, tension: 0.2 });
    scoreDatasetIndexByKey[key] = { best: bestIndex, avg: avgIndex };

    const movesIndex = movesChart.data.datasets.length;
    movesChart.data.datasets.push({ label: `${label} avg moves`, data: [], borderColor: colors.moves, tension: 0.2 });
    movesDatasetIndexByKey[key] = movesIndex;
}

function appendChartPoint(key, summary) {
    ensureChartDatasets(key);
    const scoreIndex = scoreDatasetIndexByKey[key];
    scoreChart.data.datasets[scoreIndex.best].data.push({ x: summary.generation, y: summary.bestScore });
    scoreChart.data.datasets[scoreIndex.avg].data.push({ x: summary.generation, y: summary.averageScore });
    movesChart.data.datasets[movesDatasetIndexByKey[key]].data.push({ x: summary.generation, y: summary.averageMoves });
}

function pushChartData(key, summary) {
    appendChartPoint(key, summary);
    scoreChart.update();
    movesChart.update();
}

function restoreChartData(key, entries) {
    entries.forEach((summary) => appendChartPoint(key, summary));
    scoreChart.update();
    movesChart.update();
}

function updateStatsPanel(key, summary) {
    const elements = statElements[key];
    if (!elements) {
        return;
    }
    elements.generation.textContent = summary.generation;
    elements.bestScore.textContent = Math.round(summary.bestScore);
    elements.bestEverScore.textContent = Math.round(summary.bestEverScore);
    elements.averageScore.textContent = Math.round(summary.averageScore);
    elements.averageMoves.textContent = summary.averageMoves.toFixed(1);
    elements.workerCount.textContent = runs[key].manager.getState().workerCount;
}

function formatFeatureName(key) {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function algorithmHeading(key) {
    const heading = document.createElement("p");
    heading.className = "dashboard-status mb-1";
    heading.style.color = ALGORITHM_META[key].colors.best;
    heading.textContent = ALGORITHM_META[key].label;
    return heading;
}

function renderStatsPanels() {
    const keys = activeAlgorithmKeys();
    statsPanelsContainer.replaceChildren();
    statElements = {};
    for (const key of keys) {
        const wrapper = document.createElement("div");
        wrapper.className = "mb-3";
        if (keys.length > 1) {
            wrapper.appendChild(algorithmHeading(key));
        }
        const dl = document.createElement("dl");
        dl.className = "dashboard-stats";
        const elements = {};
        for (const [label, fieldKey] of STAT_FIELDS) {
            const dt = document.createElement("dt");
            dt.textContent = label;
            const dd = document.createElement("dd");
            dd.textContent = "0";
            elements[fieldKey] = dd;
            dl.append(dt, dd);
        }
        wrapper.appendChild(dl);
        statsPanelsContainer.appendChild(wrapper);
        statElements[key] = elements;
    }
}

function renderBestGenesPanels() {
    const keys = activeAlgorithmKeys();
    bestGenesPanelsContainer.replaceChildren();
    geneElements = {};
    for (const key of keys) {
        const wrapper = document.createElement("div");
        wrapper.className = "mb-3";
        if (keys.length > 1) {
            wrapper.appendChild(algorithmHeading(key));
        }
        const dl = document.createElement("dl");
        dl.className = "dashboard-stats";
        const empty = document.createElement("p");
        empty.className = "dashboard-status";
        empty.textContent = "No trained genome yet.";
        wrapper.append(dl, empty);
        bestGenesPanelsContainer.appendChild(wrapper);
        geneElements[key] = { dl, empty };
    }
}

function appendStatRow(dl, label, value) {
    const term = document.createElement("dt");
    term.textContent = label;
    const definition = document.createElement("dd");
    definition.textContent = value;
    dl.append(term, definition);
}

function renderNeatSummary(dl, genome) {
    const hiddenCount = genome.nodes.filter((node) => node.type === "hidden").length;
    const enabledCount = genome.connections.filter((connection) => connection.enabled).length;
    appendStatRow(dl, "Input nodes", FEATURE_ORDER.length);
    appendStatRow(dl, "Hidden nodes", hiddenCount);
    appendStatRow(dl, "Output nodes", 1);
    appendStatRow(dl, "Active connections", enabledCount);
    appendStatRow(dl, "Total connections", genome.connections.length);
}

function renderLinearGenes(dl, genome) {
    FEATURE_ORDER.forEach((featureKey, index) => {
        const weight = genome.weights[index];
        const term = document.createElement("dt");
        term.textContent = formatFeatureName(featureKey);
        const definition = document.createElement("dd");
        definition.textContent = weight.toFixed(3);
        definition.classList.add(weight >= 0 ? "gene-positive" : "gene-negative");
        dl.append(term, definition);
    });
}

function renderGenesFor(key) {
    const target = geneElements[key];
    if (!target) {
        return;
    }
    const genome = currentBestGenome(key);
    target.dl.replaceChildren();
    target.empty.style.display = genome ? "none" : "block";
    if (!genome) {
        return;
    }
    if (isNeatGenome(genome)) {
        renderNeatSummary(target.dl, genome);
    } else {
        renderLinearGenes(target.dl, genome);
    }
}

function refreshBestGenesDisplay() {
    activeAlgorithmKeys().forEach(renderGenesFor);
}

function handleGenerationComplete(key, summary) {
    runs[key].history.push(summary);
    updateStatsPanel(key, summary);
    pushChartData(key, summary);
    refreshBestGenesDisplay();
    updateBestGenomeCardVisibility();
    persistProgress(key);
}

function resetChartsAndStats() {
    scoreChart.data.datasets = [];
    scoreChart.update();
    movesChart.data.datasets = [];
    movesChart.update();
    scoreDatasetIndexByKey = {};
    movesDatasetIndexByKey = {};
    renderStatsPanels();
    renderBestGenesPanels();
}

function createManagerFor(key, workerCountForThisRun) {
    const { populationSize, maxMoves } = readSettings();
    const meta = ALGORITHM_META[key];
    return createTrainingManager({
        populationSize,
        workerCount: workerCountForThisRun,
        maxMoves,
        strategy: meta.createStrategy(),
        ...(meta.createWorker ? { createWorker: meta.createWorker } : {}),
        onGenerationComplete: (summary) => handleGenerationComplete(key, summary)
    });
}

function initializeRuns() {
    const keys = activeAlgorithmKeys();
    const { workerCount } = readSettings();
    const perRunWorkerCount = keys.length > 1 ? Math.max(1, Math.floor(workerCount / keys.length)) : workerCount;
    runs = {};
    for (const key of keys) {
        runs[key] = { manager: createManagerFor(key, perRunWorkerCount), history: [], restoredGenome: null };
    }
    renderStatsPanels();
    renderBestGenesPanels();
}

function resetAllRuns() {
    for (const run of Object.values(runs)) {
        run.manager.reset();
    }
    initializeRuns();
    resetChartsAndStats();
    updateBestGenomeCardVisibility();
}

function createCharts() {
    scoreChart = new Chart(document.getElementById("score-chart"), {
        type: "line",
        data: { datasets: [] },
        options: {
            responsive: true,
            animation: false,
            scales: { x: { type: "linear", title: { display: true, text: "Generation" } } }
        }
    });
    movesChart = new Chart(document.getElementById("moves-chart"), {
        type: "line",
        data: { datasets: [] },
        options: {
            responsive: true,
            animation: false,
            scales: { x: { type: "linear", title: { display: true, text: "Generation" } } }
        }
    });
}

function startReplay(genome) {
    activeReplay?.stop();
    replayStatus.textContent = "Watching...";
    activeReplay = createReplay({
        genome,
        context: replayContext,
        maxMoves: readSettings().maxMoves,
        onStep: ({ score, movesTaken }) => {
            replayStatus.textContent = `Score ${Math.round(score)} - move ${movesTaken}`;
        },
        onFinish: ({ score, movesTaken, terminationReason }) => {
            replayStatus.textContent =
                `Finished (${terminationReason}) - score ${Math.round(score)} in ${movesTaken} moves`;
        }
    });
    activeReplay.start();
}

function downloadJson(filename, content) {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

function updateAlgorithmPickerVisuals() {
    for (const chip of algorithmPicker.querySelectorAll(".algo-chip")) {
        chip.classList.toggle("active", compareSelection.has(chip.dataset.algorithm));
    }
    clearCompareSelectionButton.style.display = compareSelection.size > 0 ? "inline-block" : "none";
}

function updateGenomeSourceOptions() {
    genomeSourceSelect.replaceChildren();
    for (const key of compareSelection) {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = ALGORITHM_META[key].label;
        genomeSourceSelect.appendChild(option);
    }
}

function updateGenomeSourceVisibility() {
    const compareOn = compareSelection.size > 0;
    algorithmSelectRow.style.display = compareOn ? "none" : "block";
    genomeSourceRow.style.display = compareOn ? "block" : "none";
    if (compareOn) {
        updateGenomeSourceOptions();
    }
}

function updateBestGenomeCardVisibility() {
    const hasAnyGenome = activeAlgorithmKeys().some((key) => currentBestGenome(key) !== null);
    bestGenomeCard.style.display = hasAnyGenome ? "block" : "none";
}

function toggleCompareSelection(key) {
    if (compareSelection.has(key)) {
        compareSelection.delete(key);
    } else {
        compareSelection.add(key);
    }
    updateAlgorithmPickerVisuals();
    updateGenomeSourceVisibility();
}

function clearCompareSelection() {
    compareSelection.clear();
    updateAlgorithmPickerVisuals();
    updateGenomeSourceVisibility();
}

function wireControls() {
    startButton.addEventListener("click", () => {
        for (const run of Object.values(runs)) {
            run.manager.start();
        }
    });
    pauseButton.addEventListener("click", () => {
        for (const run of Object.values(runs)) {
            run.manager.pause();
        }
    });
    resetButton.addEventListener("click", resetAllRuns);
    for (const chip of algorithmPicker.querySelectorAll(".algo-chip")) {
        chip.addEventListener("click", () => toggleCompareSelection(chip.dataset.algorithm));
    }
    clearCompareSelectionButton.addEventListener("click", clearCompareSelection);

    saveButton.addEventListener("click", () => {
        const key = selectedSourceKey();
        if (!runs[key]?.manager.getBestGenome()) {
            showStatus(persistenceStatus, "No trained genome yet for this algorithm.");
            return;
        }
        persistProgress(key);
        showStatus(persistenceStatus, "Saved.");
    });
    downloadButton.addEventListener("click", () => {
        const key = selectedSourceKey();
        const genome = currentBestGenome(key);
        if (!genome) {
            showStatus(persistenceStatus, "No trained genome yet.");
            return;
        }
        downloadJson(
            "tetris-ai-genome.json",
            serializeTrainingState({ bestGenome: genome, bestScore: currentBestScore(key), history: runs[key]?.history ?? [] })
        );
    });
    loadFileInput.addEventListener("change", async () => {
        const [file] = loadFileInput.files;
        if (!file) {
            return;
        }
        const state = deserializeTrainingState(await readFileAsText(file));
        if (!state) {
            showStatus(persistenceStatus, "That file isn't a valid genome export.");
        } else {
            loadedGenome = state.bestGenome;
            refreshBestGenesDisplay();
            updateBestGenomeCardVisibility();
            showStatus(persistenceStatus, `Loaded genome (score ${Math.round(state.bestScore)}).`);
        }
        loadFileInput.value = "";
    });
    watchButton.addEventListener("click", () => {
        const genome = currentBestGenome(selectedSourceKey());
        if (!genome) {
            replayStatus.textContent = "No trained genome yet - start training first.";
            return;
        }
        startReplay(genome);
    });
    addToRosterButton.addEventListener("click", () => {
        const key = selectedSourceKey();
        const genome = currentBestGenome(key);
        const name = rosterNameInput.value.trim();
        if (!genome) {
            showStatus(persistenceStatus, "No trained genome yet to save.");
            return;
        }
        if (!name) {
            showStatus(persistenceStatus, "Give this AI a name first.");
            return;
        }
        const roster = loadRoster(AI_ROSTER_STORAGE_KEY);
        const entry = createRosterEntry({
            name,
            algorithm: key,
            score: Math.round(currentBestScore(key)),
            genome,
            savedAt: Date.now()
        });
        saveRoster(AI_ROSTER_STORAGE_KEY, [...roster, entry]);
        rosterNameInput.value = "";
        showStatus(persistenceStatus, `Added "${name}" to your AIs.`);
    });
}

function restoreProgress() {
    let restoredAny = false;
    for (const key of Object.keys(runs)) {
        const restored = loadTrainingState(storageKeyFor(key));
        if (!restored) {
            continue;
        }
        restoredAny = true;
        runs[key].history = restored.history;
        runs[key].restoredGenome = restored.bestGenome;
        restoreChartData(key, restored.history);
        if (restored.history.length) {
            updateStatsPanel(key, restored.history[restored.history.length - 1]);
        }
    }
    refreshBestGenesDisplay();
    updateBestGenomeCardVisibility();
    if (restoredAny) {
        showStatus(persistenceStatus, "Restored previous progress.");
    }
}

function init() {
    createCharts();
    initializeRuns();
    restoreProgress();
    wireControls();
    updateAlgorithmPickerVisuals();
    updateGenomeSourceVisibility();
    updateBestGenomeCardVisibility();
}

init();
