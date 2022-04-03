class Tetris{
    constructor() {
        this.grid = [[0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0]]
        this.shapes = {
            "L":[[0,0,1,0],
                [1,1,1,0]],
            "J":[[2,0,0,0],
                [2,2,2,0]],
            "I":[[3,3,3,3],
                [0,0,0,0]],
            "O":[[0,4,4,0],
                [0,4,4,0]],
            "S":[[0,5,5,0],
                [5,5,0,0]],
            "T":[[0,6,0,0],
                [6,6,6,0]],
            "Z":[[7,7,0,0],
                [0,7,7,0]]
        }
        this.bag = [];
        this.GenerateBag();
        this.score = 0;
        this.currentShape = {x: 0, y: 0, shape: this.bag[0]};
        this.upcommingShape = {x: 0, y: 0, shape: this.bag[1]};
        this.ai = false;
        this.bagindex = 2;
        this.movesTaken = 0;
    }
    //genereren van de set van shapes die gebruikt worden, aangezien er maar 500 moves mogen worden gemaakt loopt de forlus tot 500.
    GenerateBag(){//werkt volledig
        let random;
        let y = 0;
        for(let i = 0;i<500;i++){
            random = Math.floor(Math.random()*7);
            y = 0;
            for(const [key, value] of Object.entries(this.shapes)){
                if(y === random){
                    this.bag.push({[key]: value});
                }
                y++;
            }
        }
    }
    //het veranderen van de currentshape en upcomingshape.
    NextShape(){
        if(this.bagindex<=499){
            this.currentShape = {x: 0, y: 0, shape: this.bag[this.bagindex]};
            this.upcommingShape = {x: 0,y: 0, shape: this.bag[this.bagindex+1]};
            this.bagindex++;
            this.ApplyShape();
        }else{
            console.error("out of index in bag!");
        }
    }
    ApplyShape(){//de shape in het grid steken op de juiste plaats.
        for(let y= this.currentShape.y; y<this.currentShape.y + Object.values(this.currentShape.shape)[0].length;y++){
            for(let x = this.currentShape.x; x<this.currentShape.x+Object.values(this.currentShape.shape)[0][0].length ;x++){
                if(Object.values(this.currentShape.shape)[0][y-this.currentShape.y][x-this.currentShape.x] !==0){
                    this.grid[y][x] = Object.values(this.currentShape.shape)[0][y-this.currentShape.y][x-this.currentShape.x];
                }
            }
        }
    }
    MoveDown(){
        this.RemoveShape();
        this.currentShape.y++;
        if(!this.Collides()){
            this.ApplyShape();
        }else{
            this.currentShape.y--;
            this.NextShape();
            this.UpdateScore();
        }

    }
    MoveLeft(){
        this.RemoveShape();
        this.currentShape.x--;
        if (this.currentShape.x>=0){
            this.ApplyShape();
        }else{
            this.currentShape.x++;
        }
    }
    MoveRight(){
        this.RemoveShape();
        this.currentShape.x++;
        if (this.currentShape.x<=9){
            this.ApplyShape();
        }else{
            this.currentShape.x--;
        }
    }

    Collides() {
        return false;
    }

    UpdateScore() {

    }
    RemoveShape(){
        for(let y= this.currentShape.y; y<this.currentShape.y + Object.values(this.currentShape.shape)[0].length;y++){
            for(let x = this.currentShape.x; x<this.currentShape.x+Object.values(this.currentShape.shape)[0][0].length ;x++){
                if(Object.values(this.currentShape.shape)[0][y-this.currentShape.y][x-this.currentShape.x] !== 0){
                    this.grid[y][x] = 0;
                }
            }
        }
    }

}
let tetris = new Tetris();
let keyHandler = (e) =>{
    if(e.key === "s"){
        tetris.MoveDown();
    }else if(e.key === "q"){
        tetris.MoveLeft();
    }else if(e.key === "d"){
        tetris.MoveRight();
    }else if(e.key === " "){
        tetris.NextShape();
    }
}
document.addEventListener("keydown", keyHandler);
let id = setInterval(print, 1000, tetris);
function print(tetris){
    let grid = document.getElementById("tetris");
    grid.textContent = "";
    for(let y = 0;y<20; y++){
        let tekst = tetris.grid[y] +"\n";
        grid.textContent += tekst;
    }

}