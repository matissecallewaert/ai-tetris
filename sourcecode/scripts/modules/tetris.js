export default class Tetris {
    constructor() {
        this.grid = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];
        this.shapes = {
            "L": [
                [0, 0, 1],
                [1, 1, 1]
            ],
            "J": [
                [2, 0, 0],
                [2, 2, 2]
            ],
            "I": [
                [3, 3, 3, 3]
            ],
            "O": [
                [4, 4],
                [4, 4]
            ],
            "S": [
                [0, 5, 5],
                [5, 5, 0]
            ],
            "T": [
                [0, 6, 0],
                [6, 6, 6]
            ],
            "Z": [
                [7, 7, 0],
                [0, 7, 7]
            ]
        }
        this.teller = 0;
        this.colors = ["#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFA500", "#FFFF00", "#FF007F", "#6A0DAD"];
        this.bag = [];
        this.GenerateBag();
        this.score = 0;
        this.currentShape = {
            x: 3,
            y: 0,
            shape: this.bag[0],
            linesCleared: 0,
            lost: false
        };
        this.upcomingShape = {
            x: 3,
            y: 0,
            shape: this.bag[1],
            linesCleared: 0,
            lost: false
        };
        this.oldShape = {
            x: 3,
            y: 0,
            shape: this.bag[0],
            linesCleared: 0,
            lost: false
        };
        this.ai_activated = false;
        this.bagindex = 2;
        this.movesTaken = 0;
        this.data = {
            height: [],
            holes: [],
            linesCleared: 0,
            movesIndex:0
        };
        this.fakeShape = null;
        this.ground = false;

        // Hold Shape begin
        this.holdShape = undefined;
        this.ai = false;
        this.bagindex = 1;
        this.movesTaken = 0;
        this.holding = false;
        this.speed = 10;
        this.died = false;
        this.fakeDied = false;
    }
    HoldShape(){
        this.RemoveShape();
        this.holdShape = this.currentShape;
        this.holdShape.x = 3;
        this.holdShape.y = 0;
        this.NextShape();
        this.holding = true;
    }
    UseHoldShape(){
        this.RemoveShape();
        let hulp = this.holdShape;
        this.holdShape = this.currentShape;
        this.currentShape = hulp;
        this.holding = true;
        this.holdShape.x = 3;
        this.holdShape.y = 0;
        this.ApplyShape();
    }
    //genereren van de set van shapes die gebruikt worden, aangezien er maar 500 moves mogen worden gemaakt loopt de forlus tot 500.
    GenerateBag() {
        let random;
        let y = 0;
        for (let i = 0; i < 500; i++) {
            random = Math.floor(Math.random() * 7);
            y = 0;
            for (const [key, value] of Object.entries(this.shapes)) {
                if (y === random) {
                    this.bag.push({
                        [key]: value
                    });
                }
                y++;
            }
        }
    }

    fakeGenerateBag() {
        let copy = {...this.currentShape.shape};
        this.fakeShape = copy;
    }


    //het veranderen van de currentshape en upcomingshape.
    NextShape() {
        if (this.bagindex <= 499) {
            this.currentShape = {
                x: 3,
                y: 0,
                shape: this.bag[this.bagindex],
                linesCleared: 0
            };
            this.upcomingShape = {
                x: 3,
                y: 0,
                shape: this.bag[this.bagindex + 1],
                linesCleared: 0
            };
            this.bagindex++;
            this.movesTaken++;
            if (this.Collides(this.currentShape)) {
                this.died = true;
            }
            else{
                this.ApplyShape();
            }
        } else {
            this.died = true;
        }
        this.holding = false;
    }

    fakeNextShape() {
        if (this.bagindex <= 499) {
            this.currentShape = {
                x: 3,
                y: 0,
                shape: this.fakeShape,
                linesCleared: 0
            };
            if (this.Collides(this.currentShape)) {
                this.fakeDied = true;
            }
            this.ApplyShape();
        } else {
            console.error("out of index in bag!");
        }
    }

    ApplyShape() { //de shape in het grid steken op de juiste plaats.
        for (let y = this.currentShape.y; y < this.currentShape.y + Object.values(this.currentShape.shape)[0].length; y++) {
            for (let x = this.currentShape.x; x < this.currentShape.x + Object.values(this.currentShape.shape)[0][0].length; x++) {
                if (Object.values(this.currentShape.shape)[0][y - this.currentShape.y][x - this.currentShape.x] !== 0) {
                    this.grid[y][x] = Object.values(this.currentShape.shape)[0][y - this.currentShape.y][x - this.currentShape.x];
                }
            }
        }
    }

    MoveDown() {
        this.ground = false;
        this.RemoveShape();
        this.currentShape.y++;
        if (!this.Collides(this.currentShape)) {
            this.ApplyShape();
        } else {
            this.ground = true;
            this.currentShape.y--;
            this.ApplyShape();
            this.UpdateScore();
            this.NextShape();
        }
    }

    fakeMoveDown1(){
        this.ground = false;
        this.RemoveShape();
        this.currentShape.y++;
        if (!this.Collides(this.currentShape)) {
            this.ApplyShape();
        } else {
            this.ground = true;
            this.currentShape.y--;
            this.ApplyShape();
        }
    }

    fakeMoveDown2(){
        this.UpdateScore();
        this.NextShape();
    }

    MoveLeft() {
        this.RemoveShape();
        this.currentShape.x--;
        if (!this.Collides(this.currentShape)) {
            this.ApplyShape();
        } else {
            this.currentShape.x++;
            this.ApplyShape();
        }
    }

    MoveRight() {
        this.RemoveShape();
        this.currentShape.x++;
        if (!this.Collides(this.currentShape)) {
            this.ApplyShape();
        } else {
            this.currentShape.x--;
            this.ApplyShape();
        }
    }

    Drop() {
        this.RemoveShape();
        while (!this.Collides(this.currentShape)) {
            this.currentShape.y++;
        }
        this.currentShape.y--;
        this.ApplyShape();
        this.UpdateScore();
        this.NextShape();

    }

    fakeDrop1() {
        this.RemoveShape();
        while (!this.Collides(this.currentShape)) {
            this.currentShape.y++;
        }
        this.currentShape.y--;
        this.ApplyShape();
    }

    fakeDrop2(){
        this.oldShape = JSON.parse(JSON.stringify(this.currentShape));
        this.fakeNextShape();
    }

    Rotate() {
        this.RemoveShape();
        this.Transpose();
        for (let y = 0; y < Object.values(this.currentShape.shape)[0].length; y++) {
            this.currentShape.shape[Object.keys(this.currentShape.shape)[0]][y].reverse();
        }
        if (this.Collides(this.currentShape) && !this.TouchesRightWall()){
            for(let i = 0; i<3;i++){
                this.Transpose();
                for (let y = 0; y < Object.values(this.currentShape.shape)[0].length; y++) {
                    this.currentShape.shape[Object.keys(this.currentShape.shape)[0]][y].reverse();
                }
            }
        }
        if(this.TouchesRightWall()){
            while (this.TouchesRightWall()) {
                this.currentShape.x--;
            }
        }
        this.ApplyShape();
    }
    TouchesRightWall(){
        return this.currentShape.x + Object.values(this.currentShape.shape)[0][0].length > this.grid[0].length;
    }

    RemoveRow(y) {
        this.grid[y] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let it = y;
        it--;
        while (this.grid[it] !== null && this.grid[it] !== undefined && this.grid[it] !== [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) {
            for (let x = 0; x < 10; x++) {
                this.grid[it + 1][x] = this.grid[it][x];
                this.grid[it][x] = 0;
            }
            it--;
        }
    }

    Collides(shape) {
        let overlap = false;
        for (let y = 0; y < Object.values(shape.shape)[0].length; y++) {
            for (let x = 0; x < Object.values(shape.shape)[0][0].length; x++) {
                if (shape.x < 0 || shape.x + Object.values(shape.shape)[0][0].length > 10 || shape.y + Object.values(shape.shape)[0].length > 20) {
                    overlap = true;
                    break;
                }
                if (this.grid[y + shape.y][x + shape.x] !== 0 && Object.values(shape.shape)[0][y][x] !== 0) {
                    overlap = true;
                    break;
                }
            }
            if (overlap) {
                break;
            }
        }
        return overlap;
    }

    fakeCollides() {
        let overlap = false;
        for (let y = 0; y < Object.values(this.currentShape.shape)[0].length; y++) {
            for (let x = 0; x < Object.values(this.currentShape.shape)[0][0].length; x++) {
                if (this.grid[y + this.currentShape.y][x + this.currentShape.x] !== 0 && Object.values(this.currentShape.shape)[0][y][x] !== 0) {
                    overlap = true;
                    break;
                }
            }
            if (overlap) {
                break;
            }
        }
        return overlap;
    }

    UpdateScore() {
        let aantal = 0;
        let y;
        let scoreDict = { 0: 0, 1: 0, 2: 100, 3: 600, 4: 3100 };
        for (y = 0; y < 20; y++) {
            if (this.grid[y].every(item => item !== 0)) {
                aantal++;
                this.RemoveRow(y);
                this.currentShape.linesCleared++;
                this.score += 100;
            }
        }
        this.score += scoreDict[aantal];
    }

    fakeUpdateScore(){
        let y;
        for (y = 0; y < 20; y++) {
            if (this.grid[y].every(item => item !== 0)) {
                this.currentShape.linesCleared++;
            }
        }
    }

    RemoveShape() {
        for (let y = this.currentShape.y; y < this.currentShape.y + Object.values(this.currentShape.shape)[0].length; y++) {
            for (let x = this.currentShape.x; x < this.currentShape.x + Object.values(this.currentShape.shape)[0][0].length; x++) {
                if (Object.values(this.currentShape.shape)[0][y - this.currentShape.y][x - this.currentShape.x] !== 0) {
                    this.grid[y][x] = 0;
                }
            }
        }
    }

    fakeRemoveShape() {
        for (let y = this.oldShape.y; y < this.oldShape.y + Object.values(this.oldShape.shape)[0].length; y++) {
            for (let x = this.oldShape.x; x < this.oldShape.x + Object.values(this.oldShape.shape)[0][0].length; x++) {
                if (Object.values(this.oldShape.shape)[0][y - this.oldShape.y][x - this.oldShape.x] !== 0) {
                    this.grid[y][x] = 0;
                }
            }
        }
    }

    Transpose() {
        let nieuw = [];
        for (let i = 0; i < Object.values(this.currentShape.shape)[0][0].length; i++) {
            nieuw.push([])
            for (let j = 0; j < Object.values(this.currentShape.shape)[0].length; j++) {
                nieuw[i].push(Object.values(this.currentShape.shape)[0][j][i]);
            }
        }
        this.currentShape.shape[Object.keys(this.currentShape.shape)[0]] = nieuw;
    }

    EndUp(){
        this.RemoveShape();
        let enupshape = {
            x : this.currentShape.x,
            y : this.currentShape.y,
            shape : this.currentShape.shape
        }
        while(!this.Collides(enupshape)){
            enupshape.y++;
        }
        this.ApplyShape();
        return enupshape;
    }

    Height() {
        let height = [0,0,0,0,0,0,0,0,0,0];
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y <= 19; y++) {
                if (this.grid[y][x] !== 0) {
                    height[x] = 20-y;
                    break;
                }
            }
        }
        this.data.height = height;
    }

    Holes() {
        let holes=0;
        for (let x = 0; x < 10; x++) {
            for (let y = (20-this.data.height[x]); y <20 ; y++) {
                if (this.grid[y][x] === 0) {
                    holes++;
                }
            }
        }
        this.data.holes = holes;
    }

    getLinesCleared() {
        this.data.linesCleared = this.currentShape.linesCleared;
    }

    getMovesIndex(){
        this.data.movesIndex = this.movesTaken;
    }

    getData() {
        this.Height();
        this.Holes();
        this.getLinesCleared();
        this.getMovesIndex();
    }

    Reset() {
        this.grid = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];
        this.bag = [];
        this.GenerateBag();
        this.score = 0;
        this.currentShape = {
            x: 3,
            y: 0,
            shape: this.bag[0]
        };
        this.upcomingShape = {
            x: 3,
            y: 0,
            shape: this.bag[1]
        };
        this.holdShape = undefined;
        this.ApplyShape();
        this.bagindex = 1;
        this.movesTaken = 0;
        this.speed = 10;
        this.died = false;
        this.holding = false;
        this.ground = false;
    }

}
