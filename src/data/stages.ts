import { StageData } from '../types/game';

export const STAGES: StageData[] = [
  // ==========================================
  // STAGE 01: THE ICONIC CROSS (From push.png / image.png)
  // ==========================================
  {
    id: 1,
    name: '01. The Classic Cross (오리지널 십자)',
    phase: 'Anycall Classic',
    phaseCategory: 'Tutorial',
    width: 9,
    height: 9,
    parMoves: 11,
    description: '추억의 오리지널 십자 맵! 4개의 공을 각 방향의 집으로 1칸씩 밀어 넣으세요.',
    hint: '상하좌우 순서대로 공을 각 방의 집으로 한 칸씩 밀어 넣으세요.',
    grid: [
      '..#####..',
      '..#...#..',
      '###.X.###',
      '#...O...#',
      '#X.O@O.X#',
      '#...O...#',
      '###.X.###',
      '..#...#..',
      '..#####..',
    ],
  },

  // ==========================================
  // STAGE 02: PUSH PUSH 2 (From pushpush.png Stage 02)
  // ==========================================
  {
    id: 2,
    name: '02. Anycall PushPush II (애니콜 스테이지 2)',
    phase: 'Anycall Classic',
    phaseCategory: 'Tutorial',
    width: 11,
    height: 9,
    parMoves: 43,
    description: '애니콜 푸시푸시 2 스테이지 2! 3개의 공을 우측 3채의 집에 차례대로 정리하세요.',
    hint: '가장 위쪽 집부터 먼저 채워 넣어야 나머지 공들을 차례대로 넣을 수 있습니다.',
    grid: [
      '..######...',
      '..#....#...',
      '..#.O..###.',
      '..#.O....X#',
      '###......X#',
      '#..@.....X#',
      '#.O..#####.',
      '#....#.....',
      '######.....',
    ],
  },

  // ==========================================
  // STAGE 03: FIRST PUSH (첫 걸음)
  // ==========================================
  {
    id: 3,
    name: '03. First Push (첫 걸음)',
    phase: 'Anycall Classic',
    phaseCategory: 'Tutorial',
    width: 6,
    height: 6,
    parMoves: 3,
    description: '공을 목적지 집 방향으로 조심스럽게 밀어 넣으세요.',
    hint: '공의 뒤편으로 돌아가서 집 방향으로 밀어보세요.',
    grid: [
      '######',
      '#@...#',
      '#..O.#',
      '#..X.#',
      '#....#',
      '######',
    ],
  },

  // ==========================================
  // STAGE 04: L-CORRIDOR (기역자 통로)
  // ==========================================
  {
    id: 4,
    name: '04. L-Corridor (기역자 통로)',
    phase: 'Anycall Classic',
    phaseCategory: 'Tutorial',
    width: 6,
    height: 6,
    parMoves: 16,
    description: '모퉁이에서 벽에 끼이지 않도록 공간을 활용하세요.',
    hint: '아래쪽 집에 들어갈 공을 먼저 통로 입구로 유도하세요.',
    grid: [
      '######',
      '#@...#',
      '#.O..#',
      '#.##.#',
      '#X.O.#',
      '#X...#',
      '######',
    ],
  },

  // ==========================================
  // STAGE 05: POCKET TWO (포켓 투)
  // ==========================================
  {
    id: 5,
    name: '05. Pocket Two (포켓 투)',
    phase: 'Anycall Classic',
    phaseCategory: 'Tutorial',
    width: 6,
    height: 6,
    parMoves: 16,
    description: '2개의 공을 2개의 포켓에 정확히 배치하세요.',
    hint: '안쪽 구석에 들어갈 공을 먼저 차분하게 이동시키세요.',
    grid: [
      '######',
      '#@...#',
      '#.O..#',
      '#.O..#',
      '#..XX#',
      '######',
    ],
  },

  // ==========================================
  // STAGE 06: TRIPLE GOAL (삼각 배치)
  // ==========================================
  {
    id: 6,
    name: '06. Triple Goal (삼각 배치)',
    phase: 'Phase 2: Beginner',
    phaseCategory: 'Beginner',
    width: 8,
    height: 7,
    parMoves: 19,
    description: '3개의 공이 가로로 늘어선 3칸의 집에 들어갑니다.',
    hint: '가장 안쪽 집부터 차례로 채워야 통로가 막히지 않습니다.',
    grid: [
      '########',
      '#@.....#',
      '#.O.O..#',
      '#...O..#',
      '#.XXX..#',
      '#......#',
      '########',
    ],
  },

  // ==========================================
  // STAGE 07: CORNER POCKET (코너 포켓)
  // ==========================================
  {
    id: 7,
    name: '07. Corner Pocket (코너 포켓)',
    phase: 'Phase 2: Beginner',
    phaseCategory: 'Beginner',
    width: 8,
    height: 6,
    parMoves: 56,
    description: '좁은 코너 포켓 사이를 통과하여 목적지에 닿아야 합니다.',
    hint: '공 2개의 위치를 교차할 여유 공간을 찾으세요.',
    grid: [
      '########',
      '#@.....#',
      '#.O..O.#',
      '#.##.##.',
      '#..X.X.#',
      '#......#',
      '########',
    ],
  },

  // ==========================================
  // STAGE 08: TWIN VAULTS (쌍둥이 금고)
  // ==========================================
  {
    id: 8,
    name: '08. Twin Vaults (쌍둥이 금고)',
    phase: 'Phase 2: Beginner',
    phaseCategory: 'Beginner',
    width: 9,
    height: 7,
    parMoves: 57,
    description: '좌우로 분리된 두 금고실 안으로 공을 배달하세요.',
    hint: '한쪽 금고를 먼저 해결한 후 반대편으로 넘어가세요.',
    grid: [
      '#########',
      '#@......#',
      '#.O...O.#',
      '#.##.##.#',
      '#.X...X.#',
      '#.......#',
      '#########',
    ],
  },

  // ==========================================
  // STAGE 09: CENTRAL PLAZA (중앙 광장)
  // ==========================================
  {
    id: 9,
    name: '09. Central Plaza (중앙 광장)',
    phase: 'Phase 2: Beginner',
    phaseCategory: 'Beginner',
    width: 7,
    height: 7,
    parMoves: 16,
    description: '중앙에 십자 형태로 배치된 집으로 공을 유도하세요.',
    hint: '외곽 복도를 이용해 캐릭터가 뒤로 돌아가서 밀어 넣으세요.',
    grid: [
      '#######',
      '#@....#',
      '#..O..#',
      '#.X.X.#',
      '#..O..#',
      '#.....#',
      '#######',
    ],
  },

  // ==========================================
  // STAGE 10: THE SWITCHBACK (지그재그)
  // ==========================================
  {
    id: 10,
    name: '10. The Switchback (지그재그)',
    phase: 'Phase 2: Beginner',
    phaseCategory: 'Beginner',
    width: 8,
    height: 7,
    parMoves: 52,
    description: '지그재그 장애물을 우회하며 공을 운반하세요.',
    hint: '장애물 꺾임 지점에서 공의 방향을 정밀하게 바꾸세요.',
    grid: [
      '########',
      '#@.....#',
      '#.###O.#',
      '#...#..#',
      '#.O.#..#',
      '#..XX..#',
      '########',
    ],
  },

  // ==========================================
  // STAGE 11: THREE IN A ROW (삼총사)
  // ==========================================
  {
    id: 11,
    name: '11. Three in a Row (삼총사)',
    phase: 'Phase 2: Beginner',
    phaseCategory: 'Beginner',
    width: 7,
    height: 7,
    parMoves: 15,
    description: '3개의 공을 가로 라인에 맞추어 넣는 퍼즐입니다.',
    hint: '양 끝의 집부터 먼저 채우는 것이 유리합니다.',
    grid: [
      '#######',
      '#@....#',
      '#.O.O.#',
      '#..O..#',
      '#.XXX.#',
      '#.....#',
      '#######',
    ],
  },

  // ==========================================
  // STAGE 12: CROSS ALLEY (골목 교차로)
  // ==========================================
  {
    id: 12,
    name: '12. Cross Alley (골목 교차로)',
    phase: 'Phase 2: Beginner',
    phaseCategory: 'Beginner',
    width: 8,
    height: 7,
    parMoves: 12,
    description: '교차로에 위치한 2개의 집으로 공을 운반하세요.',
    hint: '동서 통로를 먼저 열고 남북 통로를 통과시키세요.',
    grid: [
      '########',
      '#@.....#',
      '#..O...#',
      '#.##X#.#',
      '#..X.O.#',
      '#......#',
      '########',
    ],
  },

  // ==========================================
  // STAGE 13: DUAL CHAMBERS (두 개의 방)
  // ==========================================
  {
    id: 13,
    name: '13. Dual Chambers (두 개의 방)',
    phase: 'Phase 2: Beginner',
    phaseCategory: 'Beginner',
    width: 9,
    height: 7,
    parMoves: 41,
    description: '벽으로 분리된 2개의 독립된 방에 공을 각각 하나씩 넣으세요.',
    hint: '방 입구를 막지 않도록 조심하세요.',
    grid: [
      '#########',
      '#@..#...#',
      '#.O.#.O.#',
      '#...#...#',
      '#.X.#.X.#',
      '#...#...#',
      '#.......#',
      '#########',
    ],
  },

  // ==========================================
  // STAGE 14: DIAMOND RING (다이아몬드)
  // ==========================================
  {
    id: 14,
    name: '14. Diamond Ring (다이아몬드)',
    phase: 'Phase 2: Beginner',
    phaseCategory: 'Beginner',
    width: 7,
    height: 7,
    parMoves: 21,
    description: '다이아몬드 형태로 얽혀있는 공과 집을 순서대로 해결하세요.',
    hint: '위쪽 공을 먼저 목적지로 밀어 경로를 확보하세요.',
    grid: [
      '#######',
      '#@....#',
      '#..O..#',
      '#.OXO.#',
      '#..X..#',
      '#..X..#',
      '#######',
    ],
  },

  // ==========================================
  // STAGE 15: THE COURTYARD (중정 창고)
  // ==========================================
  {
    id: 15,
    name: '15. The Courtyard (중정 창고)',
    phase: 'Phase 2: Beginner',
    phaseCategory: 'Beginner',
    width: 8,
    height: 7,
    parMoves: 11,
    description: '중앙 기둥을 돌며 2개의 공을 차분하게 집어넣으세요.',
    hint: '벽 모서리에 공이 붙지 않도록 돌아가며 밀어주세요.',
    grid: [
      '########',
      '#@.....#',
      '#.O.#..#',
      '#...#.O#',
      '#.X.#.X#',
      '#......#',
      '########',
    ],
  },

  // ==========================================
  // STAGE 16: THE ANCHOR (닻 모양 창고)
  // ==========================================
  {
    id: 16,
    name: '16. The Anchor (닻 모양 창고)',
    phase: 'Phase 3: Advanced',
    phaseCategory: 'Advanced',
    width: 8,
    height: 6,
    parMoves: 56,
    description: '닻 모양으로 꺾인 좁은 통로를 통과하는 고급 퍼즐입니다.',
    hint: '공들의 순서를 바꾸어 원하는 구역으로 배달하세요.',
    grid: [
      '########',
      '#@.....#',
      '#..O.O.#',
      '#.##.##.',
      '#..X.X.#',
      '#......#',
      '########',
    ],
  },

  // ==========================================
  // STAGE 17: THE FORK (삼지창 창고)
  // ==========================================
  {
    id: 17,
    name: '17. The Fork (삼지창 창고)',
    phase: 'Phase 3: Advanced',
    phaseCategory: 'Advanced',
    width: 8,
    height: 7,
    parMoves: 20,
    description: '3개의 분기점 갈림길에서 순서를 철저히 계산하세요.',
    hint: '안쪽 집부터 먼저 채워 넣어야 합니다.',
    grid: [
      '########',
      '#@.....#',
      '#.O.O..#',
      '#..#...#',
      '#.XX.O.#',
      '#...X..#',
      '#......#',
      '########',
    ],
  },

  // ==========================================
  // STAGE 18: SYMMETRY TWO (대칭 퍼즐)
  // ==========================================
  {
    id: 18,
    name: '18. Symmetry Two (대칭 퍼즐)',
    phase: 'Phase 3: Advanced',
    phaseCategory: 'Advanced',
    width: 8,
    height: 6,
    parMoves: 13,
    description: '대칭 배치된 2개의 공을 2개의 목적지로 안전하게 유도하세요.',
    hint: '상단 공을 먼저 아래로 유도하세요.',
    grid: [
      '########',
      '#@.....#',
      '#..O...#',
      '#.XX.O.#',
      '#......#',
      '########',
    ],
  },

  // ==========================================
  // STAGE 19: THE QUADRANT (4분면)
  // ==========================================
  {
    id: 19,
    name: '19. The Quadrant (4분면)',
    phase: 'Phase 3: Advanced',
    phaseCategory: 'Advanced',
    width: 9,
    height: 8,
    parMoves: 53,
    description: '4개의 구역으로 나뉜 복합 챔버 퍼즐입니다.',
    hint: '중앙 통로를 회전축 삼아 공을 회전시키세요.',
    grid: [
      '#########',
      '#@......#',
      '#.O.#.O.#',
      '#...#...#',
      '##.###.##',
      '#X..#..X#',
      '#...#...#',
      '#.......#',
      '#########',
    ],
  },

  // ==========================================
  // STAGE 20: PUSHPUSH GRANDMASTER (푸시푸시 마스터)
  // ==========================================
  {
    id: 20,
    name: '20. PushPush Grandmaster (푸시푸시 마스터)',
    phase: 'Phase 3: Advanced',
    phaseCategory: 'Advanced',
    width: 8,
    height: 7,
    parMoves: 20,
    description: '푸시푸시 마스터 챌린지! 3개의 공을 완벽한 전략으로 모두 집어넣으세요.',
    hint: '모든 이동을 정밀하게 계획하고 단 한 번의 실수도 없어야 합니다.',
    grid: [
      '########',
      '#@.....#',
      '#.O.O..#',
      '#..X.X.#',
      '#.O..X.#',
      '#......#',
      '########',
    ],
  },
];
