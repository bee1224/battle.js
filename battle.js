const blessed = require('blessed');
const screen = blessed.screen({
  smartCSR: true
});

const box = blessed.box({
  top: 'center',
  left: 'center',
  width: '50%',
  height: '50%',
  content: '',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: '#f0f0f0'
    },
  }
});

screen.append(box);

const scoreBox = blessed.box({
  top: 0,
  right: 0,
  width: '25%',
  height: '10%',
  content: `Score: 0`,
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: '#f0f0f0'
    },
  }
});

screen.append(scoreBox);

const nextPieceBox = blessed.box({
  top: '10%',
  right: 0,
  width: '25%',
  height: '20%',
  content: '',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: '#f0f0f0'
    },
  }
});

screen.append(nextPieceBox);

const rows = 20;
const cols = 10;
const board = Array.from({ length: rows }, () => Array(cols).fill(0));

const pieces = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[1, 0, 0], [1, 1, 1]], // L
  [[0, 0, 1], [1, 1, 1]], // J
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]]  // Z
];

let currentPiece = {
  shape: pieces[Math.floor(Math.random() * pieces.length)],
  row: 0,
  col: Math.floor(cols / 2) - 1
};

let nextPiece = {
  shape: pieces[Math.floor(Math.random() * pieces.length)],
  row: 0,
  col: 0
};

let score = 0;

function drawBoard() {
  let content = '';
  const tempBoard = board.map(row => row.slice());

  currentPiece.shape.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) {
        tempBoard[currentPiece.row + r][currentPiece.col + c] = cell;
      }
    });
  });

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      content += tempBoard[r][c] === 1 ? 'X' : ' ';
    }
    content += '\n';
  }

  box.setContent(content);
  screen.render();
}

function canPlacePiece(piece) {
  return piece.shape.every((row, r) => {
    return row.every((cell, c) => {
      if (!cell) return true;
      const newRow = piece.row + r;
      const newCol = piece.col + c;
      return newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && board[newRow][newCol] === 0;
    });
  });
}

function dropPiece() {
  const canMoveDown = currentPiece.shape.every((row, r) => {
    return row.every((cell, c) => {
      if (!cell) return true;
      const newRow = currentPiece.row + r + 1;
      const newCol = currentPiece.col + c;
      return newRow < rows && board[newRow][newCol] === 0;
    });
  });

  if (canMoveDown) {
    currentPiece.row++;
  } else {
    currentPiece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          board[currentPiece.row + r][currentPiece.col + c] = cell;
        }
      });
    });

    let linesCleared = 0;
    for (let r = 0; r < rows; r++) {
      if (board[r].every(cell => cell === 1)) {
        board.splice(r, 1);
        board.unshift(Array(cols).fill(0));
        linesCleared++;
      }
    }

    score += linesCleared * 100; // 每条线100分
    screen.render();

    currentPiece = nextPiece;
    nextPiece = {
      shape: pieces[Math.floor(Math.random() * pieces.length)],
      row: 0,
      col: Math.floor(cols / 2) - 1
    };

    if (!canPlacePiece(currentPiece)) {
      box.setContent(`Game Over!\nScore: ${score}`);
      screen.render();
      clearInterval(gameInterval);
      return;
    }
  }

  drawBoard();
  updateScore();
  drawNextPiece();
}

function updateScore() {
  scoreBox.setContent(`Score: ${score}`);
  screen.render();
}

function drawNextPiece() {
  let content = '';
  nextPiece.shape.forEach(row => {
    row.forEach(cell => {
      content += cell ? 'X' : ' ';
    });
    content += '\n';
  });
  nextPieceBox.setContent(content);
  screen.render();
}

function hardDropPiece() {
  while (currentPiece.shape.every((row, r) => {
    return row.every((cell, c) => {
      if (!cell) return true;
      const newRow = currentPiece.row + r + 1;
      const newCol = currentPiece.col + c;
      return newRow < rows && board[newRow][newCol] === 0;
    });
  })) {
    currentPiece.row++;
  }
  dropPiece();
}

function movePieceDown() {
  const canMoveDown = currentPiece.shape.every((row, r) => {
    return row.every((cell, c) => {
      if (!cell) return true;
      const newRow = currentPiece.row + r + 1;
      const newCol = currentPiece.col + c;
      return newRow < rows && board[newRow][newCol] === 0;
    });
  });

  if (canMoveDown) {
    currentPiece.row++;
  } else {
    dropPiece();
  }
  drawBoard();
}

const gameInterval = setInterval(dropPiece, 1000);

screen.key(['left', 'right', 'up', 'space', 'down'], (ch, key) => {
  if (key.name === 'left') {
    const canMoveLeft = currentPiece.shape.every((row, r) => {
      return row.every((cell, c) => {
        if (!cell) return true;
        const newCol = currentPiece.col + c - 1;
        return newCol >= 0 && board[currentPiece.row + r][newCol] === 0;
      });
    });

    if (canMoveLeft) {
      currentPiece.col--;
    }
  } else if (key.name === 'right') {
    const canMoveRight = currentPiece.shape.every((row, r) => {
      return row.every((cell, c) => {
        if (!cell) return true;
        const newCol = currentPiece.col + c + 1;
        return newCol < cols && board[currentPiece.row + r][newCol] === 0;
      });
    });

    if (canMoveRight) {
      currentPiece.col++;
    }
  } else if (key.name === 'up') {
    const newShape = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    );

    const canRotate = newShape.every((row, r) => {
      return row.every((cell, c) => {
        if (!cell) return true;
        const newRow = currentPiece.row + r;
        const newCol = currentPiece.col + c;
        return newRow < rows && newCol >= 0 && newCol < cols && board[newRow][newCol] === 0;
      });
    });

    if (canRotate) {
      currentPiece.shape = newShape;
    }
  } else if (key.name === 'space') {
    hardDropPiece();
  } else if (key.name === 'down') {
    movePieceDown();
  }

  drawBoard();
});

screen.key(['escape', 'q', 'C-c'], (ch, key) => {
  return process.exit(0);
});

screen.render();
