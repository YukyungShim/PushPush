-- =========================================================
-- Anti-Gravity PushPush (무중력 푸시푸시) Supabase Schema
-- (SQL구문.txt 기반 완전 동기화)
-- =========================================================

-- 1. 푸시푸시 랭킹 테이블 생성
CREATE TABLE IF NOT EXISTS public.pushpush_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- 아케이드 감성에 맞춰 닉네임 길이 제한 유지 (최대 12자)
    name VARCHAR(12) NOT NULL, 
    -- 스테이지 구분 (1 이상)
    stage_level INTEGER NOT NULL CHECK (stage_level > 0),
    -- 최소 이동 횟수 (0 미만 입력 방어)
    moves INTEGER NOT NULL CHECK (moves >= 0),
    -- 클리어 시간 (밀리초 단위, 0 미만 입력 방어)
    clear_time_ms BIGINT NOT NULL CHECK (clear_time_ms >= 0),
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 한 명의 유저가 각 스테이지마다 단 하나의 '최고 기록'만 유지하도록 복합 고유키 설정
    UNIQUE (name, stage_level)
);

-- 2. 랭킹 조회를 위한 정렬 인덱스 생성
-- 스테이지별로 이동 횟수(오름차순) -> 시간(오름차순) -> 달성일(오름차순) 순 정렬
CREATE INDEX IF NOT EXISTS idx_pushpush_score_asc 
ON public.pushpush_leaderboard (stage_level, moves ASC, clear_time_ms ASC, played_at ASC);

-- 3. Row Level Security (RLS) 활성화
ALTER TABLE public.pushpush_leaderboard ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책: 누구나 랭킹 조회(SELECT) 가능
CREATE POLICY "Public Read pushpush_leaderboard"
ON public.pushpush_leaderboard
FOR SELECT
TO public
USING (true);

-- 5. RLS 정책: 누구나 점수 등록(INSERT) 및 최고기록 갱신(UPDATE) 가능
CREATE POLICY "Public Insert pushpush_leaderboard"
ON public.pushpush_leaderboard
FOR INSERT
TO public
WITH CHECK (
    length(name) > 0 AND length(name) <= 12 AND
    stage_level > 0 AND
    moves >= 0 AND
    clear_time_ms >= 0
);

CREATE POLICY "Public Update pushpush_leaderboard"
ON public.pushpush_leaderboard
FOR UPDATE
TO public
USING (true)
WITH CHECK (
    length(name) > 0 AND length(name) <= 12 AND
    stage_level > 0 AND
    moves >= 0 AND
    clear_time_ms >= 0
);
