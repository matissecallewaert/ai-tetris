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

        this.colors = ["#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFA500", "#FFFF00", "#FF007F", "#6A0DAD"];
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
        this.ai = false;
        this.bagindex = 1;
        this.movesTaken = 0;
        this.holding = false;
        this.speed = 700;
        this.died = false;
    }
    HoldShape() {
        this.RemoveShape();
        this.holdShape = this.currentShape;
        this.holdShape.x = 3;
        this.holdShape.y = 0;
        this.NextShape();
        this.holding = true;
    }
    UseHoldShape() {
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
    //het veranderen van de currentshape en upcomingshape.
    NextShape() {
        if (this.bagindex <= 499) {
            this.currentShape = {
                x: 3,
                y: 0,
                shape: this.bag[this.bagindex]
            };
            this.upcomingShape = {
                x: 3,
                y: 0,
                shape: this.bag[this.bagindex + 1]
            };
            this.bagindex++;
            this.movesTaken++;
            if (this.Collides(this.currentShape)) {
                this.died = true;
            }
            else {
                this.ApplyShape();
            }
        } else {
            this.died = true;
        }
        this.holding = false;
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
        this.RemoveShape();
        this.currentShape.y++;
        if (!this.Collides(this.currentShape)) {
            this.ApplyShape();
        } else {
            this.currentShape.y--;
            this.ApplyShape();
            this.UpdateScore();
            this.NextShape();
        }
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
        this.score += (20 - this.currentShape.y) * 2;
        while (!this.Collides(this.currentShape)) {
            this.currentShape.y++;
        }
        this.currentShape.y--;
        this.ApplyShape();
        this.UpdateScore();
        this.NextShape();
    }
    Rotate() {
        this.RemoveShape();
        this.Transpose();
        for (let y = 0; y < Object.values(this.currentShape.shape)[0].length; y++) {
            this.currentShape.shape[Object.keys(this.currentShape.shape)[0]][y].reverse();
        }
        if (this.Collides(this.currentShape) && !this.TouchesRightWall()) {
            for (let i = 0; i < 3; i++) {
                this.Transpose();
                for (let y = 0; y < Object.values(this.currentShape.shape)[0].length; y++) {
                    this.currentShape.shape[Object.keys(this.currentShape.shape)[0]][y].reverse();
                }
            }
        }
        if (this.TouchesRightWall()) {
            while (this.TouchesRightWall()) {
                this.currentShape.x--;
            }
        }
        this.ApplyShape();
    }
    TouchesRightWall() {
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

    UpdateScore() {
        let aantal = 0;
        let y;
        let scoreDict = { 0: 0, 1: 0, 2: 100, 3: 600, 4: 3100 };
        for (y = 0; y < 20; y++) {
            if (this.grid[y].every(item => item !== 0)) {
                aantal++;
                this.RemoveRow(y);
                this.score += 100; //* (20 - y);
            }
        }
        //this.score += (aantal - 1) * 100 * (20 - y);
        this.score += scoreDict[aantal];
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
    EndUp() {
        this.RemoveShape();
        let enupshape = {
            x: this.currentShape.x,
            y: this.currentShape.y,
            shape: this.currentShape.shape
        }
        while (!this.Collides(enupshape)) {
            enupshape.y++;
        }
        this.ApplyShape();
        return enupshape;
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
        this.speed = 700;
        this.died = false;
        this.holding = false;
    }
}