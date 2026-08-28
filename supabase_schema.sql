-- =========================================================
-- Anti-Gravity PushPush (무중력 푸시푸시) Supabase Schema
-- =========================================================

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
