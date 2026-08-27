# 🕹️ Anycall PushPush II (추억의 애니콜 1999 푸시푸시)

> **80~90년대 레트로 아케이드 네온 감성**과 **정통 애니콜 푸시푸시(소코반) 1칸 이동 룰**이 결합된 웹 기반 퍼즐 게임입니다.  
> 원작 푸시푸시의 클래식 맵(`push.png`, `pushpush.png`)과 `tetris.png`의 네온 아케이드 UI를 기반으로 제작되었습니다.

---

## 🎮 주요 기능 및 구현 특징

### 1. 정통 푸시푸시 1칸 이동 코어 메커니즘
- 공을 밀면 **정확히 1칸씩 전진**하며, 공 뒤에 벽(`#`)이나 다른 공(`O`)이 있을 경우 막힙니다.
- 60 FPS HTML5 Canvas 기반의 부드러운 이동 애니메이션과 3D 구체/벽돌 렌더링.
- 원작 애니콜 푸시푸시 특유의 익살스러운 캐릭터 표정과 노란색 집(목적지) 비주얼 구현.

### 2. 100% 클리어 검증된 20개 클래식 스테이지
- **Stage 01:** `push.png`의 오리지널 십자형 맵 (4방향 집과 4개의 공)
- **Stage 02:** `pushpush.png` 애니콜 푸시푸시 2의 스테이지 2 (우측 3층 집 배치)
- **Stage 03 ~ 20:** 초급부터 상급 마스터까지 BFS 솔버로 100% 클리어 검증 완료된 정통 소코반 퍼즐.

### 3. 레트로 네온 아케이드 3단 패널 UI (`tetris.png` 스타일)
- **좌측 패널:** 스테이지 정보(남은 목적지, Par 이동수), 5열 컴팩트 스테이지 셀렉터, 키 조작 안내 뱃지.
- **중앙 패널:** `NEON PUSHPUSH` 핑크 네온 타이틀, 골드 디지털 스코어 HUD, 듀얼 STAGE/MOVES 박스, PAUSED 오버레이, 하단 `[UNDO] [PAUSE] [RESTART]` 컨트롤 바.
- **우측 패널:** 글로벌/스테이지 리더보드 (1~3위 메달 & 닉네임 기록), **초고속 플러드필 BFS 기반 AI 자동 솔버 & 1단계 힌트 실행기**.

### 4. 무손실 사운드 신디사이저 (Web Audio API)
- 외부 오디오 파일 다운로드 없이 브라우저 내장 Web Audio API로 100% 실시간 합성되는 레트로 효과음 (발걸음, 푸시, 골인, 승리 팡파레, 레트로 아케이드 BGM).
- 상단 우측 `[BGM ON/OFF]`, `[SFX ON/OFF]`, `[MUTE ALL]` 원클릭 토글 지원.

### 5. 커스텀 맵 에디터 & AI 프롬프트 생성기
- 5x5 ~ 11x11 크기의 맵을 브러시로 직접 그리고 BFS 솔버로 즉시 유효성을 검증 및 플레이.

### 6. Supabase 클라우드 DB & 로컬 스토리지 하이브리드 연동
- Supabase 환경 변수 미설정 시에도 브라우저 LocalStorage를 통해 최고 기록 및 랭킹이 즉시 작동.
- `supabase_schema.sql`을 통한 원클릭 클라우드 리더보드 DB 연동 지원.

---

## 🕹️ 조작법 (Controls)

| 키보드 키 | 동작 |
|---|---|
| `↑` `↓` `←` `→` / `W` `A` `S` `D` | 캐릭터 이동 및 공 1칸 밀기 |
| `Z` / `U` | 이전 이동 취소 (Undo) |
| `R` | 스테이지 처음부터 다시 시작 (Restart) |
| `H` | AI 최단 경로 힌트 / 솔버 |
| `P` / `ESC` | 게임 일시정지 / 계속하기 (Pause / Resume) |
| 상단 CRT 버튼 | 레트로 모니터 주사선(Scanline) 필터 토글 |
| 상단 오디오 버튼 | BGM / SFX / 전체 음소거 토글 |

---

## 🛠️ 실행 방법

```bash
# 의존성 패키지 설치
npm install

# 개발 서버 실행 (포트 3000)
npm run dev

# 프로덕션 빌드 및 실행
npm run build
npm start
```
브라우저에서 `http://localhost:3000`에 접속하여 플레이할 수 있습니다.

---

## 📂 프로젝트 코드 구조

```
pushpush/
├── .env.example            # Supabase 환경 변수 예시 (선택 사항)
├── .gitignore              # Git 무시 파일 목록
├── package.json            # 프로젝트 의존성 및 스크립트
├── supabase_schema.sql     # Supabase 리더보드 테이블 및 RLS 쿼리
├── tailwind.config.js      # Tailwind CSS 테마 및 네온 색상 설정
├── tsconfig.json           # TypeScript 설정
└── src/
    ├── app/
    │   ├── globals.css     # 80s 아케이드 네온 스타일 및 스캔라인 효과
    │   ├── layout.tsx      # 루트 레이아웃
    │   └── page.tsx        # 메인 3단 패널 통합 페이지
    ├── components/
    │   ├── Header.tsx       # 상단 바 (오디오 Pill 버튼, CRT 토글, 에디터)
    │   ├── LeftPanel.tsx    # 좌측 패널 (스테이지 정보, 셀렉터, 조작키)
    │   ├── GameBoard.tsx    # 중앙 아케이드 패널 (Canvas 렌더러, 1칸 이동 로직)
    │   ├── RightPanel.tsx   # 우측 패널 (리더보드 랭킹 & AI 솔버)
    │   ├── MapEditorModal.tsx # 커스텀 맵 제작 에디터 모달
    │   └── SupabaseModal.tsx  # Supabase 설정 안내 모달
    ├── data/
    │   └── stages.ts        # 100% 클리어 검증된 20개 클래식 스테이지 데이터
    ├── lib/
    │   └── supabase.ts      # Supabase 클라이언트 및 LocalStorage 랭킹 연동
    ├── types/
    │   └── game.ts          # 게임 엔티티, 스테이지, 리더보드 타입 정의
    └── utils/
        ├── solver.ts        # 플러드필 기반 초고속 Sokoban BFS 솔버 & 힌트
        └── sound.ts         # Web Audio API 8-bit 사운드 신디사이저
```
