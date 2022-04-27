import Tetris from "./tetris.js";

export default class AI {

    constructor() {
        this.populationNumber = 1;
        this.populationSize = 5;
        this.genes = []
        this.population = []
        this.fittest = null;
        this.secondFittest = null;
        this.scores = [100,200,300,400,500];
        this.crossoverRate = 0.3;
        this.mutationRate = 0.1;
    }

    firstPopulation(){
        for (let i=0; i < this.populationSize; i++){
            for(let j=0;j<4;j++){
                this.genes[j]=Math.random();
            }
            this.population[i] = this.genes;
        }
    }

    getfittest(){
        let max = this.scores.reduce(function (a,b){
            return Math.max(a,b);
        })
        let index=this.scores.indexOf(max);
        this.fittest = this.population[index];
    }

    getsecondfittest(){
        let bufferscores = this.scores;
        bufferscores.sort((a,b) => a-b);
        let index = this.scores.indexOf(bufferscores[3]);
        this.secondFittest = this.population[index];
    }

    crossover(){
        if(Math.random() > this.crossoverRate){
            this.genes[0] = Math.min(this.fittest[0], this.secondFittest[0]);
        }
        else{
            this.genes[0] = Math.max(this.fittest[0], this.secondFittest[0]);
        }
        if(Math.random()> this.crossoverRate){
            this.genes[1] = Math.min(this.fittest[1], this.secondFittest[1]);
        }
        else{
            this.genes[1] = Math.max(this.fittest[1], this.secondFittest[1]);
        }
        if(Math.random()> this.crossoverRate){
            this.genes[2] = Math.min(this.fittest[2], this.secondFittest[2]);
        }
        else{
            this.genes[2] = Math.max(this.fittest[2], this.secondFittest[2]);
        }
        if(Math.random()> this.crossoverRate){
            this.genes[3] = Math.min(this.fittest[3], this.secondFittest[3]);
        }
        else{
            this.genes[3] = Math.max(this.fittest[3], this.secondFittest[3]);
        }
    }

    mutation(){
        if(this.mutationRate>Math.random()){
            this.genes[0] = this.genes[0] + (Math.random()*0.4)-0.2;
        }
        if(this.mutationRate>Math.random()){
            this.genes[1] = this.genes[1] (Math.random()*0.4)-0.2;
        }
        if(this.mutationRate>Math.random()){
            this.genes[2] = this.genes[2] (Math.random()*0.4)-0.2;
        }
        if(this.mutationRate>Math.random()){
            this.genes[3] = this.genes[3] (Math.random()*0.4)-0.2;
        }
    }

    populate(){
        this.populationNumber++;
        for (let i=0;i< this.populationSize-2;i++){
            this.population[i] = this.genes;
        }
        this.population[3] = this.fittest;
        this.population[4] = this.secondFittest;
    }

    calcAggregateHeight(height){
        let aHeight=0;
        for(let column of height){
            aHeight+=column;
        }
        return aHeight*"placeholder";
    }

    calcClearlines(linesCleared){
        return linesCleared*"placeholder";
    }

    calcHoles(holes){
        return holes*"placeholder";
    }

    calcBumpiness(height){
        let bumpiness=0;
        for(let i; i < height.length-1;i++){
            bumpiness+=Math.abs(height[i]-height[i+1]);
        }
        return bumpiness*"placeholder";
    }

}