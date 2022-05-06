import Tetris from "./tetris.js";

export default class AI {

    constructor() {
        this.populationNumber = 0;
        this.populationSize = 50;
        this.maxGeneration = 50;
        this.genes = [];
        this.population = [];
        this.fittest = null;
        this.secondFittest = null;
        this.scores = [];
        this.moves = [];
        this.crossoverRate = 0.3;
        this.mutationRate = 0.05;
        this.random = 0;
        this.firstPopulation();
    }

    firstPopulation() {
        for (let i = 0; i < this.populationSize; i++) {
            for (let j = 0; j < 5; j++) {
                this.genes[j] = (Math.random()*2) -1;
            }
            this.population[i] = JSON.parse(JSON.stringify(this.genes));
        }
    }

    getfittest() {
        let maxS = this.scores.reduce(function (a, b) {
            return Math.max(a, b);
        })
        let maxM = 0;
        for (let i = 0; i < this.scores.length; i++) {
            if (maxS === this.scores[i]) {
                maxM = Math.max(maxM, this.moves[i]);
            }
        }
        let index = this.moves.indexOf(maxM);
        this.fittest = JSON.parse(JSON.stringify(this.population[index]));
    }

    getsecondfittest() {
        let bufferscores = JSON.parse(JSON.stringify(this.scores));
        let maxM = 0;
        let maxS = bufferscores.reduce(function (a, b) {
            return Math.max(a, b);
        })
        let maxIndex = bufferscores.indexOf(maxS);
        bufferscores[maxIndex] = -1;
        maxS = bufferscores.reduce(function (a, b) {
            return Math.max(a, b);
        })
        for (let i = 0; i < this.scores.length; i++) {
            if (maxS === this.scores[i]) {
                maxM = Math.max(maxM, this.moves[i]);
            }
        }
        let index = this.moves.indexOf(maxM);
        this.secondFittest = JSON.parse(JSON.stringify(this.population[index]));
    }

    crossover() {
        this.random = Math.random();
        if (this.random > this.crossoverRate) {
            this.genes[0] = Math.min(this.fittest[0], this.secondFittest[0]);
        } else {
            this.genes[0] = Math.max(this.fittest[0], this.secondFittest[0]);
        }
        if (this.random > this.crossoverRate) {
            this.genes[1] = Math.min(this.fittest[1], this.secondFittest[1]);
        } else {
            this.genes[1] = Math.max(this.fittest[1], this.secondFittest[1]);
        }
        if (this.random > this.crossoverRate) {
            this.genes[2] = Math.min(this.fittest[2], this.secondFittest[2]);
        } else {
            this.genes[2] = Math.max(this.fittest[2], this.secondFittest[2]);
        }
        if (this.random > this.crossoverRate) {
            this.genes[3] = Math.min(this.fittest[3], this.secondFittest[3]);
        } else {
            this.genes[3] = Math.max(this.fittest[3], this.secondFittest[3]);
        }
        if (this.random > this.crossoverRate) {
            this.genes[4] = Math.min(this.fittest[4], this.secondFittest[4]);
        } else {
            this.genes[4] = Math.max(this.fittest[4], this.secondFittest[4]);
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
        if (this.mutationRate > Math.random()) {
            this.genes[4] = this.genes[4] + (Math.random() * 0.4) - 0.2;
        }
    }

    populate() {
        this.getfittest();
        this.getsecondfittest();
        this.population = [];
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

    calcRelativeHeight(height, gene) {
        let max = height.reduce(function (a, b) {
            return Math.max(a, b);
        })

        let min = height.reduce(function (a, b) {
            return Math.min(a, b);
        })

        let rHeight = max - min;
        return rHeight * gene[1];

    }

    calcClearlines(linesCleared, gene) {
        return linesCleared * gene[2];
    }

    calcHoles(holes, gene) {
        return holes * gene[3];
    }

    calcBumpiness(height, gene) {
        let bumpiness = 0;
        for (let i = 0; i < height.length - 1; i++) {
            bumpiness += Math.abs((height[i] - height[i + 1]));
        }
        return bumpiness * gene[4];
    }

    calcRating(height, linesCleared, holes, gene) {
        let rating = this.calcClearlines(linesCleared,gene) +
            this.calcBumpiness(height,gene) +
            this.calcAggregateHeight(height,gene) +
            this.calcRelativeHeight(height,gene) +
            this.calcHoles(holes,gene)
        return rating;
    }

}