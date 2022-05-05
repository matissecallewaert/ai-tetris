import Tetris from "./tetris.js";

export default class AI {

    constructor() {
        this.populationNumber = 0;
        this.populationSize = 5;
        this.maxGeneration = 25;
        this.genes = [];
        this.population = [];
        this.fittest = null;
        this.secondFittest = null;
        this.scores = [];
        this.moves = [];
        this.crossoverRate = 0.3;
        this.mutationRate = 0.1;
        this.firstPopulation();
    }

    firstPopulation() {
        for (let i = 0; i < this.populationSize; i++) {
            for (let j = 0; j < 5; j++) {
                this.genes[j] = Math.random();
            }
            this.population[i] = JSON.parse(JSON.stringify(this.genes));
        }
    }

    getfittest() {
        let maxS = this.scores.reduce(function (a, b) {
            return Math.max(a, b);
        })
        let maxM = 0;
        for (let i = 0; i < this.scores; i++) {
            if (maxS === this.scores[i]) {
                maxM = Math.max(maxM,this.moves[i]);
            }
        }
        let index = this.scores.indexOf(maxM);
        this.fittest = JSON.parse(JSON.stringify(this.population[index]));
    }

    getsecondfittest() {
        let bufferscores = this.scores;
        let maxM = 0;
        bufferscores.sort((a, b) => a - b);
        for (let i = 0; i < this.scores; i++) {
            if (bufferscores[3] === this.scores[i]) {
                maxM = Math.max(maxM,this.moves[i]);
            }
        }
        let index = this.scores.indexOf(maxM);
        this.secondFittest = JSON.parse(JSON.stringify(this.population[index]));
    }

    crossover() {
        if (Math.random() > this.crossoverRate) {
            this.genes[0] = Math.min(this.fittest[0], this.secondFittest[0]);
        } else {
            this.genes[0] = Math.max(this.fittest[0], this.secondFittest[0]);
        }
        if (Math.random() > this.crossoverRate) {
            this.genes[1] = Math.min(this.fittest[1], this.secondFittest[1]);
        } else {
            this.genes[1] = Math.max(this.fittest[1], this.secondFittest[1]);
        }
        if (Math.random() > this.crossoverRate) {
            this.genes[2] = Math.min(this.fittest[2], this.secondFittest[2]);
        } else {
            this.genes[2] = Math.max(this.fittest[2], this.secondFittest[2]);
        }
        if (Math.random() > this.crossoverRate) {
            this.genes[3] = Math.min(this.fittest[3], this.secondFittest[3]);
        } else {
            this.genes[3] = Math.max(this.fittest[3], this.secondFittest[3]);
        }
    }

    mutation() {
        if (this.mutationRate > Math.random()) {
            this.genes[0] = this.genes[0] + (Math.random() * 0.4) - 0.2;
        }
        if (this.mutationRate > Math.random()) {
            this.genes[1] = this.genes[1] + (Math.random() * 0.4) - 0.2;
        }
        if (this.mutationRate > Math.random()) {
            this.genes[2] = this.genes[2] + (Math.random() * 0.4) - 0.2;
        }
        if (this.mutationRate > Math.random()) {
            this.genes[3] = this.genes[3] + (Math.random() * 0.4) - 0.2;
        }
    }

    populate() {
        this.getfittest();
        this.getsecondfittest();
        for (let i = 0; i < this.populationSize; i++) {
            this.crossover();
            this.mutation();
            this.population[i] = JSON.parse(JSON.stringify(this.genes));
        }
    }

    reset() {
        this.firstPopulation();
        this.fittest = null;
        this.secondFittest = null;
        this.scores = [];
        this.populationNumber = 0;
    }

    calcAggregateHeight(height, gene) {
        let aHeight = 0;
        for (let column of height) {
            aHeight += column;
        }
        return aHeight * gene[0];
    }

    calcClearlines(linesCleared, gene) {
        return linesCleared * gene[1];
    }

    calcHoles(holes, gene) {
        return holes * gene[2];
    }

    calcBumpiness(height, gene) {
        let bumpiness = 0;
        for (let i; i < height.length - 1; i++) {
            bumpiness += Math.abs(height[i] - height[i + 1]);
        }
        return bumpiness * gene[3];
    }

    calcRating(height, linesCleared, holes, gene) {
        let rating = this.calcClearlines(linesCleared, gene) -
            this.calcAggregateHeight(height, gene) -
            this.calcHoles(holes, gene) -
            this.calcBumpiness(height, gene)
        return rating;
    }

}