import Tetris from "./tetris.js";

export default class AI {

    constructor() {
        this.populationNumber = 0;
        this.populationSize = 50;
        this.maxGeneration = 50;
        this.chromosomes = 9;
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
            for (let j = 0; j < this.chromosomes; j++) {
                this.genes[j] = (Math.random() * 2) - 1;
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
        let bufferScores = JSON.parse(JSON.stringify(this.scores));
        let maxM = 0;
        let maxS = bufferScores.reduce(function (a, b) {
            return Math.max(a, b);
        })
        let maxIndex = bufferScores.indexOf(maxS);
        bufferScores[maxIndex] = -1;
        maxS = bufferScores.reduce(function (a, b) {
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
        for (let i = 0; i < this.chromosomes; i++) {
            if (this.random < this.crossoverRate) {
                this.genes[i] = Math.min(this.fittest[i], this.secondFittest[i]);
            } else {
                this.genes[i] = Math.max(this.fittest[i], this.secondFittest[i]);
            }
        }
    }

    mutation() {
        this.random = Math.random();
        for (let i = 0; i < this.chromosomes; i++) {
            if (this.mutationRate > this.random) {
                this.genes[i] = this.genes[i] + (Math.random() * 0.5) - 0.25;
            }
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

    calcMaxHeight(height, gene) {
        let mHeight = height.reduce(function (a, b) {
            return Math.max(a, b);
        })

        return mHeight * gene[2]
    }

    calcClearlines(linesCleared, gene) {
        if(linesCleared !== 0){
            return linesCleared * gene[3];
        }
        return gene[3] * -1;
    }

    calcHoles(holes, gene) {
        if(holes !== 0){
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
        return  gene[6] * -1;
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
            this.calcHoles(holes, gene) +
            this.calcLastColumn(height, gene) +
            this.calcMultipleLinesClear(linesCleared, gene) +
            this.calcMaxLinesClear(linesCleared, gene);
        return rating;
    }

}