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
            linesCleared: 0
        };
        this.upcomingShape = {
            x: 3,
            y: 0,
            shape: this.bag[1],
            linesCleared: 0
        };
        this.oldShape = {
            x: 3,
            y: 0,
            shape: this.bag[0],
            linesCleared: 0
        };
        this.ai_activated = false;
        this.bagindex = 2;
        this.movesTaken = 0;
        this.data = {
            Height: [],
            Holes: [],
            linesCleared: 0
        };
        this.fakeShape = null;
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

    fakGenerateBag() {
        let copy = {...this.currentShape.shape}
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
            if (this.Collides()) {
                this.Reset();
            }
            this.ApplyShape();
        } else {
            console.error("out of index in bag!");
        }
    }

    fakeNextShape() {
        if (this.bagindex <= 499) {
            this.currentShape = {
                x: 3,
                y: 0,
                shape: this.fakeShape,
                linesCleared: 0
            };
            this.movesTaken++;
            if (this.Collides()) {
                this.Reset();
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
        this.RemoveShape();
        this.currentShape.y++;
        if (!this.Collides()) {
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
        if (!this.Collides()) {
            this.ApplyShape();
        } else {
            this.currentShape.x++;
            this.ApplyShape();
        }
    }

    MoveRight() {
        this.RemoveShape();
        this.currentShape.x++;
        if (!this.Collides()) {
            this.ApplyShape();
        } else {
            this.currentShape.x--;
            this.ApplyShape();
        }
    }

    Drop(shape) {
        this.RemoveShape();
        while (!this.Collides()) {
            this.currentShape.y++;
        }
        this.currentShape.y--;
        this.ApplyShape();
        this.UpdateScore();
        this.NextShape();

    }

    fakeDrop() {
        this.RemoveShape();
        while (!this.Collides()) {
            this.currentShape.y++;
        }
        this.currentShape.y--;
        this.ApplyShape();
        this.oldShape = JSON.parse(JSON.stringify(this.currentShape));
        this.fakeNextShape();

    }

    Rotate() {
        this.RemoveShape();
        this.Transpose();
        for (let y = 0; y < Object.values(this.currentShape.shape)[0].length; y++) {
            this.currentShape.shape[Object.keys(this.currentShape.shape)[0]][y].reverse();
        }
        if (!this.Collides()) {
            this.ApplyShape();
        } else {
            while (this.Collides()) {
                this.currentShape.x--;
            }
            this.ApplyShape();
        }
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

    Collides() {
        let overlap = false;
        for (let y = 0; y < Object.values(this.currentShape.shape)[0].length; y++) {
            for (let x = 0; x < Object.values(this.currentShape.shape)[0][0].length; x++) {
                if (this.currentShape.x < 0 || this.currentShape.x + Object.values(this.currentShape.shape)[0][0].length > 10 || this.currentShape.y + Object.values(this.currentShape.shape)[0].length > 20) {
                    overlap = true;
                    break;
                }
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

    fakeCollides(){
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
        for (let y = 0; y < 20; y++) {
            if (this.grid[y].every(item => item !== 0)) {
                this.RemoveRow(y);
                this.currentShape.linesCleared++;
                this.score += 100 * (20 - y);
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

    Height() {
        for (let x = 0; x < 10; x++) {
            for (let y = 19; y <= 0; y++) {
                if (this.grid[y][x] !== 0) {
                    Object.values(this.data.Height)[x] = y;
                }
            }
        }
    }

    Holes() {
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < Object.values(this.data.Height)[x]; y++) {
                if (this.grid[y][x] === 0) {
                    this.data.Holes++;
                }
            }
        }
    }

    getLinesCleared() {
        this.data.linesCleared = this.currentShape.linesCleared;
    }

    getData() {
        this.Height();
        this.Holes();
        this.getLinesCleared();
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
        this.ApplyShape();
        this.bagindex = 2;
        this.movesTaken = 0;
    }

}