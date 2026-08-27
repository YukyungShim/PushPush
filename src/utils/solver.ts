import { Direction, Position, SolverResult } from '../types/game';

export function parseGridToState(grid: string[]): {
  player: Position | null;
  balls: Position[];
  targets: Position[];
  walls: boolean[][];
  width: number;
  height: number;
} {
  const height = grid.length;
  const width = Math.max(...grid.map((r) => r.length));
  const walls: boolean[][] = Array.from({ length: height }, () =>
    Array(width).fill(false)
  );
  let player: Position | null = null;
  const balls: Position[] = [];
  const targets: Position[] = [];

  for (let y = 0; y < height; y++) {
    const row = grid[y];
    for (let x = 0; x < width; x++) {
      const char = x < row.length ? row[x] : '#';
      if (char === '#') {
        walls[y][x] = true;
      } else if (char === '@') {
        player = { x, y };
      } else if (char === 'O') {
        balls.push({ x, y });
      } else if (char === 'X') {
        targets.push({ x, y });
      } else if (char === '*') {
        balls.push({ x, y });
        targets.push({ x, y });
      } else if (char === '+') {
        player = { x, y };
        targets.push({ x, y });
      }
    }
  }

  return { player, balls, targets, walls, width, height };
}

// Classic Push: Ball moves exactly 1 step (1 tile)
export function calculateClassicBallPush(
  ballX: number,
  ballY: number,
  dx: number,
  dy: number,
  walls: boolean[][],
  otherBalls: Position[]
): Position | null {
  const targetX = ballX + dx;
  const targetY = ballY + dy;

  const height = walls.length;
  const width = walls[0].length;

  if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) {
    return null;
  }
  if (walls[targetY][targetX]) {
    return null;
  }
  const hitOther = otherBalls.some((b) => b.x === targetX && b.y === targetY);
  if (hitOther) {
    return null;
  }

  return { x: targetX, y: targetY };
}

// Flood-fill helper to get all cells reachable by player
function getReachableCells(
  start: Position,
  walls: boolean[][],
  balls: Position[],
  width: number,
  height: number
): boolean[][] {
  const reachable = Array.from({ length: height }, () => Array(width).fill(false));
  const queue = [start];
  reachable[start.y][start.x] = true;

  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const { dx, dy } of dirs) {
      const nx = curr.x + dx;
      const ny = curr.y + dy;

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (walls[ny][nx]) continue;
      if (balls.some((b) => b.x === nx && b.y === ny)) continue;

      if (!reachable[ny][nx]) {
        reachable[ny][nx] = true;
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return reachable;
}

// Path finding for player steps between two reachable cells
function findWalkPath(
  start: Position,
  goal: Position,
  walls: boolean[][],
  balls: Position[],
  width: number,
  height: number
): Direction[] | null {
  if (start.x === goal.x && start.y === goal.y) return [];
  const queue: { x: number; y: number; path: Direction[] }[] = [
    { x: start.x, y: start.y, path: [] },
  ];
  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  visited[start.y][start.x] = true;

  const dirs: { dir: Direction; dx: number; dy: number }[] = [
    { dir: 'UP', dx: 0, dy: -1 },
    { dir: 'DOWN', dx: 0, dy: 1 },
    { dir: 'LEFT', dx: -1, dy: 0 },
    { dir: 'RIGHT', dx: 1, dy: 0 },
  ];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr.x === goal.x && curr.y === goal.y) {
      return curr.path;
    }

    for (const { dir, dx, dy } of dirs) {
      const nx = curr.x + dx;
      const ny = curr.y + dy;

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (walls[ny][nx]) continue;
      if (balls.some((b) => b.x === nx && b.y === ny)) continue;

      if (!visited[ny][nx]) {
        visited[ny][nx] = true;
        queue.push({ x: nx, y: ny, path: [...curr.path, dir] });
      }
    }
  }

  return null;
}

// Ultra-Fast Push-Based Sokoban BFS Solver
export function solveStage(grid: string[], maxExplored = 40000): SolverResult {
  const { player, balls, targets, walls, width, height } = parseGridToState(grid);

  if (!player) return { solvable: false, minMoves: 0, message: '플레이어(@) 위치가 없습니다.' };
  if (balls.length === 0) return { solvable: false, minMoves: 0, message: '공(O)이 없습니다.' };
  if (balls.length !== targets.length) {
    return {
      solvable: false,
      minMoves: 0,
      message: `공의 개수(${balls.length})와 목적지 개수(${targets.length})가 일치하지 않습니다.`,
    };
  }

  const sortBalls = (bList: Position[]) =>
    [...bList].sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));

  const isWin = (bList: Position[]) => {
    return targets.every((t) => bList.some((b) => b.x === t.x && b.y === t.y));
  };

  const initialBalls = sortBalls(balls);
  if (isWin(initialBalls)) {
    return { solvable: true, minMoves: 0, solution: [], exploredStates: 1 };
  }

  const getComponentId = (reachable: boolean[][]) => {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (reachable[y][x]) return `${x},${y}`;
      }
    }
    return '0,0';
  };

  const initialReachable = getReachableCells(player, walls, initialBalls, width, height);
  const initialCompId = getComponentId(initialReachable);

  const stateKey = (compId: string, bList: Position[]) =>
    `${compId}|` + bList.map((b) => `${b.x},${b.y}`).join(';');

  const queue = [
    {
      player,
      balls: initialBalls,
      moves: [] as Direction[],
      reachable: initialReachable,
      compId: initialCompId,
    },
  ];

  const visited = new Set<string>();
  visited.add(stateKey(initialCompId, initialBalls));

  const pushDirs: { dir: Direction; dx: number; dy: number }[] = [
    { dir: 'UP', dx: 0, dy: -1 },
    { dir: 'DOWN', dx: 0, dy: 1 },
    { dir: 'LEFT', dx: -1, dy: 0 },
    { dir: 'RIGHT', dx: 1, dy: 0 },
  ];

  let exploredCount = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    exploredCount++;

    if (exploredCount > maxExplored) {
      return {
        solvable: false,
        minMoves: 0,
        exploredStates: exploredCount,
        message: '탐색 가능한 상태 수 한도 초과',
      };
    }

    for (let bIdx = 0; bIdx < current.balls.length; bIdx++) {
      const ball = current.balls[bIdx];

      for (const { dir, dx, dy } of pushDirs) {
        const playerPushFromX = ball.x - dx;
        const playerPushFromY = ball.y - dy;

        if (
          playerPushFromX < 0 ||
          playerPushFromX >= width ||
          playerPushFromY < 0 ||
          playerPushFromY >= height ||
          !current.reachable[playerPushFromY][playerPushFromX]
        ) {
          continue;
        }

        const nextBallX = ball.x + dx;
        const nextBallY = ball.y + dy;

        if (
          nextBallX < 0 ||
          nextBallX >= width ||
          nextBallY < 0 ||
          nextBallY >= height ||
          walls[nextBallY][nextBallX] ||
          current.balls.some((b, i) => i !== bIdx && b.x === nextBallX && b.y === nextBallY)
        ) {
          continue;
        }

        const walkPath = findWalkPath(
          current.player,
          { x: playerPushFromX, y: playerPushFromY },
          walls,
          current.balls,
          width,
          height
        );

        if (!walkPath) continue;

        const moveSequence = [...current.moves, ...walkPath, dir];
        const otherBalls = current.balls.filter((_, i) => i !== bIdx);
        const newBalls = sortBalls([...otherBalls, { x: nextBallX, y: nextBallY }]);
        const newPlayerPos = { x: ball.x, y: ball.y };

        if (isWin(newBalls)) {
          return {
            solvable: true,
            minMoves: moveSequence.length,
            solution: moveSequence,
            exploredStates: exploredCount,
          };
        }

        const newReachable = getReachableCells(newPlayerPos, walls, newBalls, width, height);
        const newCompId = getComponentId(newReachable);
        const key = stateKey(newCompId, newBalls);

        if (!visited.has(key)) {
          visited.add(key);
          queue.push({
            player: newPlayerPos,
            balls: newBalls,
            moves: moveSequence,
            reachable: newReachable,
            compId: newCompId,
          });
        }
      }
    }
  }

  return {
    solvable: false,
    minMoves: 0,
    exploredStates: exploredCount,
    message: '해결 경로가 존재하지 않습니다.',
  };
}
