export default class Tetris {
  constructor() {
    this.grid = Array.from({ length: 20 }, () => Array(10).fill(0));

    this.shapes = {
      L: [
        [0, 0, 1],
        [1, 1, 1],
      ],
      J: [
        [2, 0, 0],
        [2, 2, 2],
      ],
      I: [[3, 3, 3, 3]],
      O: [
        [4, 4],
        [4, 4],
      ],
      S: [
        [0, 5, 5],
        [5, 5, 0],
      ],
      T: [
        [0, 6, 0],
        [6, 6, 6],
      ],
      Z: [
        [7, 7, 0],
        [0, 7, 7],
      ],
    };

    this.colors = [
      "#FFFFFF",
      "#FF0000",
      "#00FF00",
      "#0000FF",
      "#FFA500",
      "#FFE600",
      "#FF007F",
      "#6A0DAD",
    ];
    this.bag = [];
    this.generateBag();
    this.score = 0;

    this.currentShape = {
      x: 3,
      y: 0,
      shape: this.bag[0],
      linesCleared: 0,
      lost: false,
    };

    this.upcomingShape = {
      x: 3,
      y: 0,
      shape: this.bag[1],
      linesCleared: 0,
      lost: false,
    };

    this.oldShape = {
      x: 3,
      y: 0,
      shape: this.bag[0],
      linesCleared: 0,
      lost: false,
    };

    this.aiActivated = false;
    this.movesTaken = 0;

    this.data = {
      height: [],
      holes: 0,
      blockades: 0,
      linesCleared: 0,
      movesIndex: 0,
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

    this.currentShape.x = Math.max(
      0,
      Math.min(
        this.currentShape.x,
        10 - Object.values(this.currentShape.shape)[0][0].length
      )
    );
    this.currentShape.y = Math.max(
      0,
      Math.min(
        this.currentShape.y,
        20 - Object.values(this.currentShape.shape)[0].length
      )
    );

    Tetris.applyShape(this.grid, this.currentShape);
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
            [key]: value,
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
        linesCleared: 0,
      };

      this.upcomingShape = {
        x: 3,
        y: 0,
        shape: this.bag[this.bagindex + 1],
        linesCleared: 0,
      };

      this.bagindex++;
      this.movesTaken++;

      if (Tetris.collides(this.grid, this.currentShape)) {
        this.died = true;
      } else {
        Tetris.applyShape(this.grid, this.currentShape);
      }
    } else {
      this.generateBag();
      this.bagindex = 0;
      this.nextShape();
    }

    this.holding = false;
  }

  static applyShape(grid, shape) {
    // place the shape at the correct place in the grid
    for (
      let y = shape.y;
      y < shape.y + Object.values(shape.shape)[0].length;
      y++
    ) {
      for (
        let x = shape.x;
        x < shape.x + Object.values(shape.shape)[0][0].length;
        x++
      ) {
        if (Object.values(shape.shape)[0][y - shape.y][x - shape.x] !== 0) {
          grid[y][x] = Object.values(shape.shape)[0][y - shape.y][x - shape.x];
        }
      }
    }
  }

  moveDown() {
    this.ground = false;
    this.removeShape(this.currentShape);
    this.currentShape.y++;

    if (!Tetris.collides(this.grid, this.currentShape)) {
      Tetris.applyShape(this.grid, this.currentShape);
    } else {
      this.ground = true;
      this.currentShape.y--;

      Tetris.applyShape(this.grid, this.currentShape);

      this.updateScore();
      this.nextShape();
    }
  }

  moveLeft() {
    this.removeShape(this.currentShape);
    this.currentShape.x--;

    if (!Tetris.collides(this.grid, this.currentShape)) {
      Tetris.applyShape(this.grid, this.currentShape);
    } else {
      this.currentShape.x++;

      Tetris.applyShape(this.grid, this.currentShape);
    }
  }

  moveRight() {
    this.removeShape(this.currentShape);
    this.currentShape.x++;

    if (!Tetris.collides(this.grid, this.currentShape)) {
      Tetris.applyShape(this.grid, this.currentShape);
    } else {
      this.currentShape.x--;

      Tetris.applyShape(this.grid, this.currentShape);
    }
  }

  drop() {
    this.removeShape(this.currentShape);

    this.score += (20 - this.currentShape.y) * 2;

    while (!Tetris.collides(this.grid, this.currentShape)) {
      this.currentShape.y++;
    }
    this.currentShape.y--;

    Tetris.applyShape(this.grid, this.currentShape);

    this.updateScore();
    this.nextShape();
  }

  static rotate(grid, currentShape) {
    Tetris.transpose(currentShape);

    for (let y = 0; y < Object.values(currentShape.shape)[0].length; y++) {
      currentShape.shape[Object.keys(currentShape.shape)[0]][
        y
      ].reverse();
    }

    if (Tetris.collides(grid, currentShape) && !Tetris.touchesRightWall(grid, currentShape)) {
      for (let i = 0; i < 3; i++) {
        this.transpose();
        for (
          let y = 0;
          y < Object.values(currentShape.shape)[0].length;
          y++
        ) {
          currentShape.shape[Object.keys(currentShape.shape)[0]][
            y
          ].reverse();
        }
      }
    }

    while (Tetris.touchesRightWall(grid, currentShape)) {
      currentShape.x--;
    }
  }

  static touchesRightWall(grid, currentShape) {
    return (
      currentShape.x +
        Object.values(currentShape.shape)[0][0].length >
      grid[0].length
    );
  }

  static removeRow(grid, y) {
    grid[y] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    let it = y;
    it--;
    while (
      grid[it] !== null &&
      grid[it] !== undefined &&
      JSON.stringify(grid[it]) !==
        JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    ) {
      for (let x = 0; x < 10; x++) {
        grid[it + 1][x] = grid[it][x];
        grid[it][x] = 0;
      }
      it--;
    }
  }

  static collides(grid, shape) {
    let overlap = false;

    for (let y = 0; y < Object.values(shape.shape)[0].length; y++) {
      for (let x = 0; x < Object.values(shape.shape)[0][0].length; x++) {
        if (
          shape.x < 0 ||
          shape.x + Object.values(shape.shape)[0][0].length > 10 ||
          shape.y + Object.values(shape.shape)[0].length > 20
        ) {
          overlap = true;
          break;
        }

        if (
          grid[y + shape.y][x + shape.x] !== 0 &&
          Object.values(shape.shape)[0][y][x] !== 0
        ) {
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
      if (this.grid[y].every((item) => item !== 0)) {
        aantal++;

        Tetris.removeRow(this.grid, y);
        this.currentShape.linesCleared++;

        this.score += 100;
      }
    }

    this.score += scoreDict[aantal];
  }

  removeShape(shape) {
    for (
      let y = shape.y;
      y < shape.y + Object.values(shape.shape)[0].length;
      y++
    ) {
      for (
        let x = shape.x;
        x < shape.x + Object.values(shape.shape)[0][0].length;
        x++
      ) {
        if (Object.values(shape.shape)[0][y - shape.y][x - shape.x] !== 0) {
          this.grid[y][x] = 0;
        }
      }
    }
  }

  static transpose(currentShape) {
    let nieuw = [];

    for (
      let i = 0;
      i < Object.values(currentShape.shape)[0][0].length;
      i++
    ) {
      nieuw.push([]);

      for (
        let j = 0;
        j < Object.values(currentShape.shape)[0].length;
        j++
      ) {
        nieuw[i].push(Object.values(currentShape.shape)[0][j][i]);
      }
    }

    currentShape.shape[Object.keys(currentShape.shape)[0]] = nieuw;
  }

  endUp() {
    this.removeShape(this.currentShape);

    let enupshape = {
      x: this.currentShape.x,
      y: this.currentShape.y,
      shape: this.currentShape.shape,
    };

    while (!Tetris.collides(this.grid, enupshape)) {
      enupshape.y++;
    }

    Tetris.applyShape(this.grid, this.currentShape);
    return enupshape;
  }

  reset() {
    this.grid = Array.from({ length: 20 }, () => Array(10).fill(0));

    this.bag = [];
    this.generateBag();
    this.score = 0;

    this.currentShape = {
      x: 3,
      y: 0,
      shape: this.bag[0],
    };

    this.upcomingShape = {
      x: 3,
      y: 0,
      shape: this.bag[1],
    };

    this.holdShape = undefined;
    Tetris.applyShape(this.grid, this.currentShape);
    this.bagindex = 1;
    this.movesTaken = 0;
    this.speed = 700;
    this.died = false;
    this.holding = false;
    this.ground = false;
    this.tetrisReset = true;
  }
}
