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

        this.colors = ["#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFA500", "#FFE600", "#FF007F", "#6A0DAD"];
        this.bag = [];
        this.generateBag();
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

        this.aiActivated = false;
        this.movesTaken = 0;

        this.data = {
            height: [],
            holes: 0,
            blockades: 0,
            linesCleared: 0,
            movesIndex: 0
        };

        this.ground = false;

        // Hold Shape begin
        this.holdShape = undefined;
        this.bagindex = 1;
        this.holding = false;
        this.speed = 700;
        this.died = false;
        this.tetrisReset = false;
    }

    setHoldShape() {
        this.removeShape(this.currentShape);

        this.holdShape = this.currentShape;
        this.holdShape.x = 3;
        this.holdShape.y = 0;

        this.nextShape();
        this.holding = true;
    }

    useHoldShape() {
        this.removeShape(this.currentShape);

        let hulp = this.holdShape;
        this.holdShape = this.currentShape;
        this.currentShape = hulp;
        this.holding = true;
        this.currentShape.x = this.holdShape.x;
        this.currentShape.y = this.holdShape.y;

        this.applyShape();
    }

    //generates a set of shapes with a maximum of 500 shapes
    generateBag() {
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

    // updating currentshape and nextshape
    nextShape() {
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

            if (this.collides(this.currentShape)) {
                this.died = true;
            } else {
                this.applyShape();
            }
        } else {
            this.generateBag();
        }

        this.holding = false;
    }

    applyShape() { // place the shape at the correct place in the grid
        for (let y = this.currentShape.y; y < this.currentShape.y + Object.values(this.currentShape.shape)[0].length; y++) {
            for (let x = this.currentShape.x; x < this.currentShape.x + Object.values(this.currentShape.shape)[0][0].length; x++) {
                if (Object.values(this.currentShape.shape)[0][y - this.currentShape.y][x - this.currentShape.x] !== 0) {
                    this.grid[y][x] = Object.values(this.currentShape.shape)[0][y - this.currentShape.y][x - this.currentShape.x];
                }
            }
        }
    }

    moveDown() {
        this.ground = false;
        this.removeShape(this.currentShape);
        this.currentShape.y++;

        if (!this.collides(this.currentShape)) {
            this.applyShape();
        } else {
            this.ground = true;
            this.currentShape.y--;

            this.applyShape();

            this.updateScore();
            this.nextShape();
        }
    }

    moveLeft() {
        this.removeShape(this.currentShape);
        this.currentShape.x--;

        if (!this.collides(this.currentShape)) {
            this.applyShape();
        } else {
            this.currentShape.x++;

            this.applyShape();
        }
    }

    moveRight() {
        this.removeShape(this.currentShape);
        this.currentShape.x++;

        if (!this.collides(this.currentShape)) {
            this.applyShape();
        } else {
            this.currentShape.x--;

            this.applyShape();
        }
    }

    drop() {
        this.removeShape(this.currentShape);

        this.score += (20 - this.currentShape.y) * 2;

        while (!this.collides(this.currentShape)) {
            this.currentShape.y++;
        }
        this.currentShape.y--;

        this.applyShape();

        this.updateScore();
        this.nextShape();
    }

    rotate() {
        this.removeShape(this.currentShape);
        this.transpose();

        for (let y = 0; y < Object.values(this.currentShape.shape)[0].length; y++) {
            this.currentShape.shape[Object.keys(this.currentShape.shape)[0]][y].reverse();
        }

        if (this.collides(this.currentShape) && !this.touchesRightWall()) {
            for (let i = 0; i < 3; i++) {
                this.transpose();
                for (let y = 0; y < Object.values(this.currentShape.shape)[0].length; y++) {
                    this.currentShape.shape[Object.keys(this.currentShape.shape)[0]][y].reverse();
                }
            }
        }

        if (this.touchesRightWall()) {
            while (this.touchesRightWall()) {
                this.currentShape.x--;
            }
        }

        this.applyShape();
    }

    touchesRightWall() {
        return this.currentShape.x + Object.values(this.currentShape.shape)[0][0].length > this.grid[0].length;
    }

    removeRow(y) {
        this.grid[y] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        let it = y;
        it--;
        while (this.grid[it] !== null && this.grid[it] !== undefined && JSON.stringify(this.grid[it]) !== JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])) {
            for (let x = 0; x < 10; x++) {
                this.grid[it + 1][x] = this.grid[it][x];
                this.grid[it][x] = 0;
            }
            it--;
        }
    }

    collides(shape) {
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

    updateScore() {
        let aantal = 0;
        let y;
        let scoreDict = { 0: 0, 1: 0, 2: 100, 3: 600, 4: 3100 };

        for (y = 0; y < 20; y++) {
            if (this.grid[y].every(item => item !== 0)) {

                aantal++;

                this.removeRow(y);
                this.currentShape.linesCleared++;

                this.score += 100;
            }
        }

        this.score += scoreDict[aantal];
    }

    removeShape(shape) {
        for (let y = shape.y; y < shape.y + Object.values(shape.shape)[0].length; y++) {
            for (let x = shape.x; x < shape.x + Object.values(shape.shape)[0][0].length; x++) {
                if (Object.values(shape.shape)[0][y - shape.y][x - shape.x] !== 0) {
                    this.grid[y][x] = 0;
                }
            }
        }
    }

    transpose() {
        let nieuw = [];

        for (let i = 0; i < Object.values(this.currentShape.shape)[0][0].length; i++) {
            nieuw.push([])

            for (let j = 0; j < Object.values(this.currentShape.shape)[0].length; j++) {
                nieuw[i].push(Object.values(this.currentShape.shape)[0][j][i]);
            }
        }

        this.currentShape.shape[Object.keys(this.currentShape.shape)[0]] = nieuw;
    }

    endUp() {
        this.removeShape(this.currentShape);

        let enupshape = {
            x: this.currentShape.x,
            y: this.currentShape.y,
            shape: this.currentShape.shape
        }

        while (!this.collides(enupshape)) {
            enupshape.y++;
        }

        this.applyShape();
        return enupshape;
    }

    reset() {
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
        this.generateBag();
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
        this.applyShape();
        this.bagindex = 1;
        this.movesTaken = 0;
        this.speed = 700;
        this.died = false;
        this.holding = false;
        this.ground = false;
        this.tetrisReset = true;
    }
}
