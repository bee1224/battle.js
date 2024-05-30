document.addEventListener('DOMContentLoaded', () => {
  const rows = 20;
  const cols = 10;
  const board = Array.from({ length: rows }, () => Array(cols).fill(0));

  const pieces = [
    { shape: [[1, 1, 1, 1]], className: 'I' },
    { shape: [[1, 1], [1, 1]], className: 'O' },
    { shape: [[0, 1, 0], [1, 1, 1]], className: 'T' },
    { shape: [[1, 0, 0], [1, 1, 1]], className: 'L' },
    { shape: [[0, 0, 1], [1, 1, 1]], className: 'J' },
    { shape: [[0, 1, 1], [1, 1, 0]], className: 'S' },
    { shape: [[1, 1, 0], [0, 1, 1]], className: 'Z' }
  ];

  let currentPiece = {
    ...pieces[Math.floor(Math.random() * pieces.length)],
    row: 0,
    col: Math.floor(cols / 2) - 1
  };

  let nextPiece = {
    ...pieces[Math.floor(Math.random() * pieces.length)],
    row: 0,
    col: 0
  };

  let score = 0;

  const boardElement = document.getElementById('board');
  const scoreBox = document.getElementById('score-box');
  const nextPieceBox = document.getElementById('next-piece-box');

  const opponentBoardElement = document.getElementById('opponent-board');
  const opponentScoreBox = document.getElementById('opponent-score');
  const opponentNextPieceBox = document.getElementById('opponent-next-piece-box');

  // WebSocket 客户端代码
  const socket = new WebSocket('ws://localhost:8080');

  socket.addEventListener('open', () => {
    console.log('Connected to WebSocket server');
  });

  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    const { id, data } = message;

    if (data.type === 'updateBoard') {
      updateOpponentBoard(data.board, data.score, data.nextPiece);
    }
  });

  function sendGameState() {
    const gameState = {
      type: 'updateBoard',
      board: board,
      score: score,
      nextPiece: nextPiece
    };
    socket.send(JSON.stringify(gameState));
  }

  function drawBoard() {
    boardElement.innerHTML = '';
    const tempBoard = board.map(row => row.slice());

    currentPiece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          tempBoard[currentPiece.row + r][currentPiece.col + c] = cell;
        }
      });
    });

    tempBoard.forEach(row => {
      row.forEach(cell => {
        const cellElement = document.createElement('div');
        cellElement.className = 'cell';
        if (cell) {
          cellElement.classList.add('active', currentPiece.className);
        }
        boardElement.appendChild(cellElement);
      });
    });

    sendGameState();
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

      score += linesCleared * 100;
      scoreBox.textContent = `Score: ${score}`;

      currentPiece = nextPiece;
      nextPiece = {
        ...pieces[Math.floor(Math.random() * pieces.length)],
        row: 0,
        col: Math.floor(cols / 2) - 1
      };

      if (!canPlacePiece(currentPiece)) {
        alert(`Game Over!\nScore: ${score}`);
        clearInterval(gameInterval);
        return;
      }
    }

    drawBoard();
    drawNextPiece();
  }

  function drawNextPiece() {
    nextPieceBox.innerHTML = '';
    const nextPieceGrid = Array.from({ length: 4 }, () => Array(4).fill(0));
    nextPiece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          nextPieceGrid[r][c] = cell;
        }
      });
    });

    nextPieceGrid.forEach(row => {
      row.forEach(cell => {
        const cellElement = document.createElement('div');
        cellElement.className = 'cell';
        if (cell) {
          cellElement.classList.add('active', nextPiece.className);
        }
        nextPieceBox.appendChild(cellElement);
      });
    });
  }

  function updateBoard(newBoard) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        board[r][c] = newBoard[r][c];
      }
    }
    drawBoard();
  }

  function updateScore(newScore) {
    score = newScore;
    scoreBox.textContent = `Score: ${score}`;
  }

  function updateNextPiece(newNextPiece) {
    nextPiece = newNextPiece;
    drawNextPiece();
  }

  function updateOpponentBoard(newBoard, newScore, newNextPiece) {
    opponentBoardElement.innerHTML = '';
    newBoard.forEach(row => {
      row.forEach(cell => {
        const cellElement = document.createElement('div');
        cellElement.className = 'cell';
        if (cell) {
          cellElement.classList.add('active');
        }
        opponentBoardElement.appendChild(cellElement);
      });
    });

    opponentScoreBox.textContent = `Opponent Score: ${newScore}`;
    updateOpponentNextPiece(newNextPiece);
  }

  function updateOpponentNextPiece(newNextPiece) {
    opponentNextPieceBox.innerHTML = '';
    const nextPieceGrid = Array.from({ length: 4 }, () => Array(4).fill(0));
    newNextPiece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          nextPieceGrid[r][c] = cell;
        }
      });
    });

    nextPieceGrid.forEach(row => {
      row.forEach(cell => {
        const cellElement = document.createElement('div');
        cellElement.className = 'cell';
        if (cell) {
          cellElement.classList.add('active', newNextPiece.className);
        }
        opponentNextPieceBox.appendChild(cellElement);
      });
    });
  }

  const gameInterval = setInterval(dropPiece, 1000);

  document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      const canMoveLeft = currentPiece.shape.every((row, r) => {
        return row.every((cell, c) => {
          if (!cell) return true;
          const newCol = currentPiece.col + c - 1;
          return newCol >= 0 && board[currentPiece.row + r][newCol] === 0;
        });
      });

      if (canMoveLeft) {
        currentPiece.col--;
        drawBoard();
      }
    } else if (event.key === 'ArrowRight') {
      const canMoveRight = currentPiece.shape.every((row, r) => {
        return row.every((cell, c) => {
          if (!cell) return true;
          const newCol = currentPiece.col + c + 1;
          return newCol < cols && board[currentPiece.row + r][newCol] === 0;
        });
      });

      if (canMoveRight) {
        currentPiece.col++;
        drawBoard();
      }
    } else if (event.key === 'ArrowUp') {
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
        drawBoard();
      }
    } else if (event.key === ' ') {
      hardDropPiece();
    } else if (event.key === 'ArrowDown') {
      movePieceDown();
    }

    drawBoard();
  });

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

  drawBoard();
  drawNextPiece();
});
