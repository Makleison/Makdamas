const board = document.getElementById("board");
const levelSelect = document.getElementById("levelSelect");
let selectedPiece = null;
let turn = "black";
let level = "easy";
let boardState = [];
const SIZE = 8;

levelSelect.addEventListener("change", () => {
  level = levelSelect.value;
});

function createBoard() {
  board.innerHTML = "";
  boardState = [];

  for (let y = 0; y < SIZE; y++) {
    const row = [];
    for (let x = 0; x < SIZE; x++) {
      const cell = document.createElement("div");
      cell.className = "cell " + ((x + y) % 2 === 0 ? "white" : "black");
      cell.dataset.x = x;
      cell.dataset.y = y;
      if ((x + y) % 2 !== 0) {
        cell.addEventListener("click", () => onCellClick(x, y));
      }
      board.appendChild(cell);
      row.push(null);
    }
    boardState.push(row);
  }

  // Adiciona peças
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < SIZE; x++) {
      if ((x + y) % 2 !== 0) addPiece(x, y, "white");
    }
  }
  for (let y = 5; y < 8; y++) {
    for (let x = 0; x < SIZE; x++) {
      if ((x + y) % 2 !== 0) addPiece(x, y, "black");
    }
  }
}

function addPiece(x, y, color) {
  const piece = document.createElement("div");
  piece.className = "piece " + color;
  piece.dataset.color = color;
  piece.dataset.x = x;
  piece.dataset.y = y;
  piece.dataset.dama = "false";
  piece.addEventListener("click", (e) => onPieceClick(e, x, y, color));
  getCell(x, y).appendChild(piece);
  boardState[y][x] = { color, dama: false };
}

function getCell(x, y) {
  return board.querySelector(`.cell[data-x='${x}'][data-y='${y}']`);
}

function clearHighlights() {
  document.querySelectorAll(".selected, .valid").forEach(el => {
    el.classList.remove("selected", "valid");
  });
}

function onPieceClick(e, x, y, color) {
  e.stopPropagation();
  if (turn !== color) return;

  const captures = getAllCaptures(turn);
  const thisCaptures = getCaptures(x, y, color);

  if (captures.length > 0 && thisCaptures.length === 0) return;

  clearHighlights();
  selectedPiece = { x, y, color };
  getCell(x, y).firstChild.classList.add("selected");

  const moves = captures.length > 0 ? thisCaptures : getMoves(x, y, color);
  moves.forEach(m => getCell(m.x, m.y).classList.add("valid"));
}

function onCellClick(x, y) {
  if (!selectedPiece) return;

  const sx = selectedPiece.x;
  const sy = selectedPiece.y;
  const color = selectedPiece.color;

  const possibleMoves = getAllCaptures(turn).length > 0 ? getCaptures(sx, sy, color) : getMoves(sx, sy, color);
  if (!possibleMoves.some(m => m.x === x && m.y === y)) return;

  movePiece(sx, sy, x, y);

  const jumped = Math.abs(x - sx) === 2;
  if (jumped) {
    const mx = (x + sx) / 2;
    const my = (y + sy) / 2;
    removePiece(mx, my);
    const nextCaptures = getCaptures(x, y, color);
    if (nextCaptures.length > 0) {
      clearHighlights();
      selectedPiece = { x, y, color };
      getCell(x, y).firstChild.classList.add("selected");
      nextCaptures.forEach(m => getCell(m.x, m.y).classList.add("valid"));
      return;
    }
  }

  clearHighlights();
  selectedPiece = null;
  turn = turn === "black" ? "white" : "black";
  if (turn === "white") setTimeout(botMove, 500);
}

function movePiece(sx, sy, dx, dy) {
  const piece = getCell(sx, sy).firstChild;
  boardState[dy][dx] = boardState[sy][sx];
  boardState[sy][sx] = null;
  getCell(sx, sy).removeChild(piece);
  getCell(dx, dy).appendChild(piece);
  piece.dataset.x = dx;
  piece.dataset.y = dy;

  // Promoção para dama:
  if (!boardState[dy][dx].dama) {
    if ((boardState[dy][dx].color === "black" && dy === 0) ||
        (boardState[dy][dx].color === "white" && dy === 7)) {
      boardState[dy][dx].dama = true;
      piece.dataset.dama = "true";
      piece.classList.add("dama");
    }
  }
}

function removePiece(x, y) {
  const cell = getCell(x, y);
  if (cell.firstChild) cell.removeChild(cell.firstChild);
  boardState[y][x] = null;
}

function getMoves(x, y, color) {
  const moves = [];
  const isDama = boardState[y][x]?.dama === true;
  const directions = isDama
    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    : (color === "black" ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);
  for (const [dy, dx] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    if (inBounds(nx, ny) && !boardState[ny][nx]) {
      moves.push({ x: nx, y: ny });
    }
  }
  return moves;
}

function getCaptures(x, y, color) {
  const captures = [];
  const isDama = boardState[y][x]?.dama === true;
  const directions = isDama
    ? [[-2, -2], [-2, 2], [2, -2], [2, 2]]
    : (color === "black" ? [[-2, -2], [-2, 2]] : [[2, -2], [2, 2]]);
  for (const [dy, dx] of directions) {
    const mx = x + dx / 2;
    const my = y + dy / 2;
    const nx = x + dx;
    const ny = y + dy;
    if (
      inBounds(nx, ny) &&
      !boardState[ny][nx] &&
      boardState[my][mx] &&
      boardState[my][mx].color !== color
    ) {
      captures.push({ x: nx, y: ny });
    }
  }
  return captures;
}

function getAllCaptures(color) {
  const all = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const p = boardState[y][x];
      if (p && p.color === color) {
        all.push(...getCaptures(x, y, color));
      }
    }
  }
  return all;
}

function inBounds(x, y) {
  return x >= 0 && x < SIZE && y >= 0 && y < SIZE;
}

function botMove() {
  const pieces = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (boardState[y][x]?.color === "white") pieces.push({ x, y });
    }
  }

  let allMoves = [];
  const forceCaptures = getAllCaptures("white").length > 0;

  pieces.forEach(p => {
    const moves = forceCaptures ? getCaptures(p.x, p.y, "white") : getMoves(p.x, p.y, "white");
    if (moves.length > 0) {
      allMoves.push({ from: p, to: moves });
    }
  });

  if (allMoves.length === 0) return; // game over

  const choice = allMoves[Math.floor(Math.random() * allMoves.length)];
  const target = choice.to[Math.floor(Math.random() * choice.to.length)];
  movePiece(choice.from.x, choice.from.y, target.x, target.y);

  if (Math.abs(choice.from.x - target.x) === 2) {
    const mx = (choice.from.x + target.x) / 2;
    const my = (choice.from.y + target.y) / 2;
    removePiece(mx, my);

    // Verifica captura múltipla
    let nx = target.x, ny = target.y;
    while (true) {
      const more = getCaptures(nx, ny, "white");
      if (more.length === 0) break;
      const next = more[Math.floor(Math.random() * more.length)];
      movePiece(nx, ny, next.x, next.y);
      removePiece((nx + next.x) / 2, (ny + next.y) / 2);
      nx = next.x;
      ny = next.y;
    }
  }

  turn = "black";
}

createBoard();
