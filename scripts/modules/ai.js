import Tetris from "./tetris.js";

class AI {
  static AGENTS_PER_ITERATION = 50;
  static NUMBER_OF_GENES = 7;

  constructor() {
    this.agents = this.generateAgents();
    this.scores = Array.from({ length: AI.AGENTS_PER_ITERATION }, () => 0);
    this.currentAgent = 0;
    this.level = 1;
  }

  generateAgents(parents = null) {
    let agents = [];
    if (!parents) {
      for (let i = 0; i < AI.AGENTS_PER_ITERATION; i++) {
        agents.push(
          Array.from({ length: AI.NUMBER_OF_GENES }, () => Math.random())
        );
      }
    } else {
      for (let i = 0; i < AI.AGENTS_PER_ITERATION; i++) {
        let parent1 = Math.floor(Math.random() * parents.length);
        let parent2 = Math.floor(Math.random() * parents.length);
        while (parent1 === parent2) {
          parent2 = Math.floor(Math.random() * parents.length);
        }

        let child = [];
        for (let k = 0; k < AI.NUMBER_OF_GENES; k++) {
          if (Math.random() < 0.5) {
            child.push(parents[parent1][k]);
          } else {
            child.push(parents[parent2][k]);
          }
        }
        this.mutate(child);
        agents.push(child);
      }
    }
    return agents;
  }

  newGen() {
    let bestAgents = this.selectBestAgents(this.scores, this.agents);
    this.agents = this.generateAgents(bestAgents);
    this.scores = Array.from({ length: AI.AGENTS_PER_ITERATION }, () => 0);
    this.level++;
  }

  nextAgent() {
    if (this.currentAgent === AI.AGENTS_PER_ITERATION - 1) {
      this.newGen();
      this.currentAgent = -1;
      console.log("Level: ", this.level);
    }
    this.currentAgent++;
    return this.agents[this.currentAgent];
  }

  mutate(agent) {
    let mutationRate = 0.1;
    for (let i = 0; i < agent.length; i++) {
      if (Math.random() < mutationRate) {
        agent[i] = Math.min(1, Math.max(0, agent[i] + (Math.random() * 0.2 - 0.1)));
      }
    }
  }

  selectBestAgents(scores, agents) {
    let indexedScores = scores.map((score, index) => ({ index, score }));
    indexedScores.sort((a, b) => b.score - a.score);
    let bestAgents = indexedScores
      .slice(0, AI.AGENTS_PER_ITERATION / 2)
      .map((item) => agents[item.index]);
    return bestAgents;
  }

  calculateScore(agent, boardData) {
    return (
      agent[0] * boardData[0] +
      agent[1] * boardData[1] +
      agent[2] * boardData[2] +
      agent[3] * boardData[3] +
      agent[4] * boardData[4] +
      agent[5] * boardData[5] +
      agent[6] * boardData[6]
    );
  }

  getBoardData(grid) {
    let bumpiness = 0;
    let totalHeight = 0;
    let maxHeight = grid.length - grid.findIndex(row => row.some(cell => cell !== 0));
    let minHeight = 0;
    let holes = 0;
    let blockades = 0;

    for (let i = grid.length-1; i >= grid.length - maxHeight; i--) {
      let row = grid[i];
      for (let j = 0; j < row.length; j++) {
        if (row[j] === 0 && i !== 0 && grid[i-1][j] !== 0) {
          holes++;
        }
        if (row[j] !== 0 && i !== grid.length - 1 && grid[i+1][j] === 0) {
          blockades++;
        }
      }
    }

    let columnHeights = [];
      for (let j = 0; j < grid[0].length; j++) {
        for (let i = 0; i < grid.length; i++) {
          if (grid[i][j] !== 0) {
            columnHeights.push(i);
            break;
          }
        }
      }
      minHeight = grid.length - Math.max(minHeight, ...columnHeights);
      totalHeight = columnHeights.reduce((sum, height) => sum + (grid.length - height), 0);

    for (let j = 0; j < columnHeights.length - 2; j++) {
      bumpiness += Math.abs(columnHeights[j] - columnHeights[j + 1]);
    }

    return [
      bumpiness,
      totalHeight,
      maxHeight,
      maxHeight - minHeight,
      holes,
      blockades,
    ];
  }

  getBestMove(agent, grid, currentPiece, rotations) {
    let moves = [];
    let gridCopy = grid.map(row => [...row]); //deep copy
    let currentPieceCopy = JSON.parse(JSON.stringify(currentPiece)); //deep copy

    for(let r = 0; r < rotations; r++) {
      for(let x= 0; x < gridCopy[0].length - Object.values(currentPiece.shape)[0][0].length + 1; x++) {
        currentPiece.x = x;
        currentPiece.y = 0;
        while(!Tetris.collides(gridCopy, currentPiece) && currentPiece.y < gridCopy.length - Object.values(currentPiece.shape)[0].length + 1) {
          currentPiece.y++;
        }
        if (currentPiece.y !== 0)
          currentPiece.y--;

        //apply the shape in the grid
        Tetris.applyShape(gridCopy, currentPiece);

        //check for full rows and remove them
        for (let i = 0; i < gridCopy.length; i++) {
          if (gridCopy[i].every(cell => cell !== 0)) {
            Tetris.removeRow(gridCopy, i);
            currentPiece.linesCleared++;
          }
        }

        //calculate board data
        let boardData = this.getBoardData(gridCopy);
        let data = [currentPiece.linesCleared, ...boardData];

        //calculate score
          let score = this.calculateScore(agent, data);

        //save move [x, r, score]
        moves.push([x, r, score]);

        //reset the grid
        gridCopy = grid.map(row => [...row]);
      }

      Tetris.transpose(currentPiece);
    }
    //reset current piece
    currentPiece = JSON.parse(JSON.stringify(currentPieceCopy));
    //return the move with the highest score [x, r]
    let bestMove = moves.reduce((best, move) => (move[2] > best[2] ? move : best), moves[0]);
    return [bestMove[0], bestMove[1]];
  }

  //0: rows cleared
  //1: bumpiness
  //2: total height
  //3: max hight
  //4: relative height (max-min)
  //5: holes
  //6: blockades
}

export default AI;
