let data  = {
    heightPerColumn : [3,5,5,5,6,6,5,4,4,5],
    linesClear : 2,
    holesPerColumn : [0,0,0,2,0,0,0,0,0,0]
};

let populationNumber = 1;
let populationSize = 5;
let genes = []
let population = []
let fittest = null;
let secondFittest = null;
let scores = [100,200,300,400,500];
let crossoverRate = 0.3;
let mutationRate = 0.1;




function firstPopulation(){
    for (let i=0;i<populationSize;i++){
        for(let j=0;j<4;j++){
            genes[j]=Math.random();
        }
        population[i] = genes;
    }
}

function getfittest(){
    let max = scores.reduce(function (a,b){
        return Math.max(a,b);
    })
    let index=scores.indexOf(max);
    fittest=population[index];
}

function getsecondfittest(){
    let bufferscores = scores;
    bufferscores.sort((a,b) => a-b);
    let index = scores.indexOf(bufferscores[3]);
    secondFittest = population[index];
}

function crossover(){
    if(Math.random()>crossoverRate){
        genes[0] = Math.min(fittest[0],secondFittest[0]);
    }
    else{
        genes[0] = Math.max(fittest[0],secondFittest[0]);
    }
    if(Math.random()>crossoverRate){
        genes[1] = Math.min(fittest[1],secondFittest[1]);
    }
    else{
        genes[1] = Math.max(fittest[1],secondFittest[1]);
    }
    if(Math.random()>crossoverRate){
        genes[2] = Math.min(fittest[2],secondFittest[2]);
    }
    else{
        genes[2] = Math.max(fittest[2],secondFittest[2]);
    }
    if(Math.random()>crossoverRate){
        genes[3] = Math.min(fittest[3],secondFittest[3]);
    }
    else{
        genes[3] = Math.max(fittest[3],secondFittest[3]);
    }
}

function mutation(){
    if(mutationRate>Math.random()){
        genes[0] = genes[0] + (Math.random()*0.4)-0.2;
    }
    if(mutationRate>Math.random()){
        genes[1] = genes[1] (Math.random()*0.4)-0.2;
    }
    if(mutationRate>Math.random()){
        genes[2] = genes[2] (Math.random()*0.4)-0.2;
    }
    if(mutationRate>Math.random()){
        genes[3] = genes[3] (Math.random()*0.4)-0.2;
    }
}

function population(){
    populationNumber++;
    for (let i=0;i<populationSize-2;i++){
            population[i] = genes;
        }
    population[3]=fittest;
    population[4]=secondFittest;
}


function calcAggregateHeight(){
    let aHeight=0;
    for(let column of data["heightPerColumn"]){
        aHeight+=column;
    }
    return aHeight*"placeholder";
}

function calcClearlines(){
    return data["linesClear"]*"placeholder";
}

function calcHoles(){
    let holes=0;
    for(let column of data["heightPerColumn"]){
        holes+=column;
    }
    return holes*"placeholder";
}

function calcBumpiness(){
    let bumpiness=0;
    for(let i;i<data["heightPerColumn"].length-1;i++){
        bumpiness+=Math.abs(data["heightPerColumn"][i]-data["heightPerColumn"][i-1]);
    }
    return bumpiness*"placeholder";
}