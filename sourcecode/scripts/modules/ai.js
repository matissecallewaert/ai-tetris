export default class AI {

    constructor() {
        this.populationNumber = 0;
        this.populationSize = 50;
        this.maxGeneration = 5000;
        this.chromosomes = 7;
        this.genes = [];
        this.population = [];
        this.breeder = [];
        this.parentRate = 0.1;
        this.breederSize = Math.floor((this.populationSize * this.parentRate));
        this.fitness = this.chromosomes;
        this.fittest = null;
        this.gene1 = null;
        this.gene2 = null;
        this.scores = [];
        this.moves = [];
        this.crossoverRate = 0.4;
        this.mutationRate = 0.2;
        this.mutationValue = 0.5;
        this.geneInitValue = 0.5;
        this.random = 0;
        this.firstPopulation();
    }

    firstPopulation() {
        for (let i = 0; i < this.populationSize; i++) {
            for (let j = 0; j < this.chromosomes; j++) {
                this.genes[j] = (Math.random() * this.geneInitValue);
            }
            this.population[i] = JSON.parse(JSON.stringify(this.genes));
        }
    }

    getFittest() {
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
        this.fittest[this.fitness] = maxM;
        this.scores[index] = -1;
        this.moves[index] = -1;
    }

    fillBreeder() {
        if (this.breederSize < 1) {
            this.breederSize = 1;
        }
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
                this.genes[i] = genes[i] + (Math.random() * this.mutationValue) - (this.mutationValue / 2);
            }
        }
    }

    populate() {
        this.fillBreeder();
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

        return mHeight * gene[2];
    }

    calcClearLines(linesCleared, gene) {
        return linesCleared * gene[3];
    }

    calcHoles(holes, gene) {
        return holes * gene[4];

    }

    calcBlockades(blockades, gene) {
        return blockades * gene[5];
    }

    calcBumpiness(height, gene) {
        let bumpiness = 0;
        for (let i = 0; i < (height.length - 1); i++) {
            bumpiness += Math.abs((height[i] - height[i + 1]));
        }

        return bumpiness * gene[6];
    }

    calcRating(height, linesCleared, holes, blockades, gene) {
        return this.calcClearLines(linesCleared, gene) +
            this.calcAggregateHeight(height, gene) +
            this.calcRelativeHeight(height, gene) +
            this.calcMaxHeight(height, gene) +
            this.calcHoles(holes, gene) +
            this.calcBlockades(blockades, gene) +
            this.calcBumpiness(height, gene);
    }

}
