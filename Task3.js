const crypto = require("crypto");
const readline = require("readline");
const AsciiTable = require("ascii-table");

class Validator {
  static validateMoves(moves) {
    const uniqueVal = new Set(moves);
    const example = " Example: node game.js rock paper scissors";
    if (moves.length === 0) {
      console.log("There are no moves.", example);
      return false;
    } else if (uniqueVal.size !== moves.length) {
      console.log("Moves must be unique.", example);
      return false;
    } else if (moves.length < 3) {
      console.log("Invalid number of moves. Must be number >= 3.", example);
      return false;
    } else if (moves.length % 2 === 0) {
      console.log("Invalid number of moves. Must be an odd number.", example);
      return false;
    }
    return true;
  }
}

class Menu {
  static display(moves) {
    moves.forEach((move, index) => {
      console.log(`${index + 1} - ${move}`);
    });
    console.log(`0 - Exit`);
    console.log(`? - Help`);
  }
}

class MoveGenerator {
  static randomMove(moves) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  static generateKey() {
    return crypto.randomBytes(32).toString("hex");
  }

  static generateHMAC(key, move) {
    return crypto.createHmac("sha3-256", key).update(move).digest("hex");
  }
}

class ResultsMatrix {
  constructor(moves) {
    this.moves = moves;
    this.matrix = this.generateMatrix();
  }

  generateMatrix() {
    const n = this.moves.length;
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));
    const p = Math.floor(n / 2);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const result = ((j - i + p + n) % n) - p;
        matrix[i][j] = result > 0 ? 1 : result < 0 ? -1 : 0;
      }
    }
    return matrix;
  }

  printResults(userMove, computerMove) {
    const userIdx = this.moves.indexOf(userMove);
    const computerIdx = this.moves.indexOf(computerMove);
    const result = this.matrix[userIdx][computerIdx];
    console.log(
      result === 0 ? "Game Draw" : result > 0 ? "You win!" : "Computer win!"
    );
  }
}

class HelpTable {
  static display(moves, matrix) {
    console.log("IMPORTANT NOTE=> Row: Computer movers & Column: User moves");
    const table = new AsciiTable("Help Table.");
    table.setHeading("PC/User", ...moves);

    moves.forEach((move, i) => {
      const row = [
        move,
        ...matrix[i].map((result) =>
          result === 0 ? "Draw" : result > 0 ? "Win" : "Lose"
        ),
      ];
      table.addRow(...row);
    });

    console.log(table.toString());
  }
}

class Game {
  constructor(moves) {
    this.moves = moves;
    this.matrix = new ResultsMatrix(moves);
    this.randomKey = MoveGenerator.generateKey();
    this.computerMove = MoveGenerator.randomMove(this.moves);
    this.hmac = MoveGenerator.generateHMAC(this.randomKey, this.computerMove);
  }

  start() {
    console.log("HMAC:", this.hmac);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const handleUserInput = (input) => {
      const trimmedInput = input.trim();
      const userIndex = parseInt(trimmedInput, 10) - 1;

      if (trimmedInput === "0") {
        console.log("Exiting the game.");
        rl.close();
      } else if (trimmedInput === "?") {
        HelpTable.display(this.moves, this.matrix.matrix);
        rl.question("Your choice: ", handleUserInput);
      } else if (userIndex >= 0 && userIndex < this.moves.length) {
        console.log("User move:", this.moves[userIndex]);
        console.log("Computer move:", this.computerMove);
        this.matrix.printResults(this.moves[userIndex], this.computerMove);
        console.log("HMAC Key:", this.randomKey);
        rl.close();
      } else {
        console.log("Invalid choice. Please try again.");
        Menu.display(this.moves);
        rl.question("Your choice: ", handleUserInput);
      }
    };

    Menu.display(this.moves);
    rl.question("Your choice: ", handleUserInput);
  }
}

const moves = process.argv.slice(2);
if (Validator.validateMoves(moves)) {
  const game = new Game(moves);
  game.start();
}
