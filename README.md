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

### 5. Supabase 클라우드 DB & Vercel 배포 완벽 지원
- Supabase의 `pushpush_leaderboard` 테이블 및 RLS 보안 정책 기반 글로벌 랭킹 시스템.
- Next.js API Routes (`/api/leaderboard`)를 통해 Vercel 환경 변수 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 안전 연동.
- 환경 변수 미설정 시에도 브라우저 LocalStorage로 부드럽게 fallback되어 오프라인에서도 작동.

---

## 🚀 Supabase & Vercel 배포 가이드

### 1. Supabase 테이블 생성 (SQL Editor)
Supabase 대시보드의 **SQL Editor**에서 아래 SQL 구문을 실행합니다:

```sql
-- 1. 푸시푸시 랭킹 테이블 생성
CREATE TABLE IF NOT EXISTS public.pushpush_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- 플레이어 닉네임 (12자 제한)
    name VARCHAR(12) NOT NULL,
    -- 스테이지 레벨 (1 이상)
    stage_level INTEGER NOT NULL CHECK (stage_level > 0),
    -- 최소 이동 횟수 (0 이상)
    moves INTEGER NOT NULL CHECK (moves >= 0),
    -- 클리어 시간 (밀리초 단위, 0 이상)
    clear_time_ms BIGINT NOT NULL CHECK (clear_time_ms >= 0),
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 한 명의 유저가 각 스테이지마다 단 하나의 '최고 기록'만 유지하도록 복합 고유키 설정
    UNIQUE (name, stage_level)
);

-- 2. 랭킹 조회를 위한 정렬 인덱스 생성
-- 스테이지별로 이동 횟수(오름차순) -> 시간(오름차순) -> 달성일(오름차순) 순 정렬
CREATE INDEX IF NOT EXISTS idx_pushpush_rank 
ON public.pushpush_leaderboard (stage_level, moves ASC, clear_time_ms ASC, played_at ASC);

-- 3. Row Level Security (RLS) 활성화
ALTER TABLE public.pushpush_leaderboard ENABLE ROW LEVEL SECURITY;

-- 4. 읽기 정책 (누구나 랭킹 조회 가능)
DROP POLICY IF EXISTS "Allow public read access" ON public.pushpush_leaderboard;
CREATE POLICY "Allow public read access" 
ON public.pushpush_leaderboard
FOR SELECT 
USING (true);

-- 5. 쓰기 정책 (신규 등록 및 점수 갱신 허용)
DROP POLICY IF EXISTS "Allow public insert and update" ON public.pushpush_leaderboard;
CREATE POLICY "Allow public insert and update" 
ON public.pushpush_leaderboard
FOR ALL 
USING (true)
WITH CHECK (true);
```

### 2. Vercel 환경 변수 설정
Vercel 프로젝트 대시보드의 **Settings > Environment Variables**에 아래 변수를 등록합니다:

| Key | Value 예시 | 설명 |
|---|---|---|
| `SUPABASE_URL` | `https://xyzcompany.supabase.co` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Supabase Service Role Key (또는 anon key) |

*(로컬 개발 시에는 `.env.local` 파일에 위 변수를 작성하여 사용합니다)*

---

## 🕹️ 조작법 (Controls)

| 키보드 키 | 동작 |
|---|---|
| `↑` `↓` `←` `→` / `W` `A` `S` `D` | 캐릭터 이동 및 공 1칸 밀기 |
| `Z` / `U` | 이전 이동 취소 (Undo) |
| `R` | 스테이지 처음부터 다시 시작 (Restart) |
| `P` / `ESC` | 게임 일시정지 / 계속하기 (Pause / Resume) |
| 상단 CRT 버튼 | 레트로 모니터 주사선(Scanline) 필터 토글 |
| 상단 오디오 버튼 | BGM / SFX / 전체 음소거 토글 |

---

## 🛠️ 로컬 실행 방법

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
