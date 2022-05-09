import Tetris from "./tetris.js";

export default class AI {

    constructor() {
        this.populationNumber = 0;
        this.populationSize = 50;
        this.maxGeneration = 5000;
        this.chromosomes = 6;
        this.genes = [];
        this.population = [];
        this.breeder = [];
        this.breederSize = Math.floor((this.populationSize * this.parentRate));
        this.parentRate = 0.5
        this.fitness = this.chromosomes;
        this.fittest = null;
        this.gene1 = null;
        this.gene2 = null;
        this.scores = [];
        this.moves = [];
        this.crossoverRate = 0.3;
        this.mutationRate = 0.05;
        this.random = 0;
        this.extra = false;
        this.firstPopulation();
    }

    firstPopulation() {
        for (let i = 0; i < this.populationSize; i++) {
            for (let j = 0; j < this.chromosomes; j++) {
                this.genes[j] = (Math.random() * 2) - 1;
            }
            this.population[i] = JSON.parse(JSON.stringify(this.genes));
        }
    }

    getFittest() {
        let maxS = this.scores.reduce(function (a, b) {
            return Math.max(a, b);
        })

        let index = this.scores.indexOf(maxS);
        this.fittest = JSON.parse(JSON.stringify(this.population[index]));
        this.fittest[this.fitness] = maxS;
        this.scores[index] = -1;
    }

    fillBreeder() {
        for (let i = 0; i < this.breederSize; i++) {
            this.getFittest();
            this.breeder[i] = JSON.parse(JSON.stringify(this.fittest));
        }
    }

    makeParents() {
        this.gene1 = JSON.parse(JSON.stringify(this.breeder[Math.floor(Math.random() * (this.breeder.length))]));
        this.gene2 = JSON.parse(JSON.stringify(this.breeder[Math.floor(Math.random() * (this.breeder.length))]));
    }

    crossover() {
        this.random = Math.random();
        let gene1;
        let gene2;

        if (this.gene1[this.chromosomes] > this.gene2[this.chromosomes]) {
            gene1 = JSON.parse(JSON.stringify(this.gene1));
            gene2 = JSON.parse(JSON.stringify(this.gene2));
        } else {
            gene2 = JSON.parse(JSON.stringify(this.gene1));
            gene1 = JSON.parse(JSON.stringify(this.gene2));
        }

        for (let i = 0; i < this.chromosomes; i++) {
            if (this.random < this.crossoverRate) {
                this.genes[i] = Math.min(gene1[i], gene2[i]);
            } else {
                this.genes[i] = Math.max(gene1[i], gene2[i]);
            }
        }
    }

    mutation() {
        this.random = Math.random();
        let genes = JSON.parse(JSON.stringify(this.genes));
        for (let i = 0; i < this.chromosomes; i++) {
            if (this.random < this.mutationRate) {
                this.genes[i] = genes[i] + (Math.random() * 0.5) - 0.25;
            }
        }
    }

    populate() {
        this.fillBreeder();
        this.population = [];
        for (let i = 0; i < this.populationSize; i++) {
            this.makeParents();
            this.crossover();
            this.mutation();
            this.population[i] = JSON.parse(JSON.stringify(this.genes));
        }
    }

    reset() {
        this.firstPopulation();
        this.fittest = null;
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

    calcMaxHeight(height, gene) {
        let mHeight = height.reduce(function (a, b) {
            return Math.max(a, b);
        })

        return mHeight * gene[2]
    }

    calcClearlines(linesCleared, gene) {
        if (linesCleared !== 0) {
            return linesCleared * gene[3];
        }
        return gene[3] * -1;
    }

    calcHoles(holes, gene) {
        if (holes !== 0) {
            return holes * gene[4];
        }
        return gene[4] * -1;
    }

    calcBumpiness(height, gene) {
        let bumpiness = 0;
        for (let i = 0; i < height.length - 1; i++) {
            bumpiness += Math.abs((height[i] - height[i + 1]));
        }

        return bumpiness * gene[5];
    }

    calcLastColumn(height, gene) {
        let min = height.reduce(function (a, b) {
            return Math.min(a, b);
        })

        if (height[9] === min) {
            return gene[6];
        }
        return gene[6] * -1;
    }

    calcMultipleLinesClear(linesCleared, gene) {
        if (linesCleared > 1) {
            return linesCleared * gene[7];
        }
        return this.calcClearlines(linesCleared, gene);
    }

    calcMaxLinesClear(linesCleared, gene) {
        if (linesCleared === 4) {
            return linesCleared * gene[8];
        }
        return this.calcMultipleLinesClear(linesCleared, gene);
    }

    calcRating(height, linesCleared, holes, gene) {
        let rating = this.calcClearlines(linesCleared, gene) +
            this.calcBumpiness(height, gene) +
            this.calcAggregateHeight(height, gene) +
            this.calcRelativeHeight(height, gene) +
            this.calcMaxHeight(height, gene) +
            this.calcHoles(holes, gene);
        return rating;
    }

}