'use client';

import React, { useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { X, Database, Check, Copy, ExternalLink, Key, ShieldCheck } from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const SQL_SCHEMA = `-- 1. 푸시푸시 랭킹 테이블 생성 (SQL구문.txt)
CREATE TABLE IF NOT EXISTS public.pushpush_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(12) NOT NULL, 
    stage_level INTEGER NOT NULL CHECK (stage_level > 0),
    moves INTEGER NOT NULL CHECK (moves >= 0),
    clear_time_ms BIGINT NOT NULL CHECK (clear_time_ms >= 0),
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (name, stage_level)
);

-- 2. 랭킹 정렬 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_pushpush_score_asc 
ON public.pushpush_leaderboard (stage_level, moves ASC, clear_time_ms ASC, played_at ASC);

-- 3. RLS 활성화 및 권한 설정
ALTER TABLE public.pushpush_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read pushpush_leaderboard"
ON public.pushpush_leaderboard FOR SELECT TO public USING (true);

CREATE POLICY "Public Insert pushpush_leaderboard"
ON public.pushpush_leaderboard FOR INSERT TO public
WITH CHECK (length(name) > 0 AND length(name) <= 12 AND stage_level > 0 AND moves >= 0 AND clear_time_ms >= 0);

CREATE POLICY "Public Update pushpush_leaderboard"
ON public.pushpush_leaderboard FOR UPDATE TO public USING (true)
WITH CHECK (length(name) > 0 AND length(name) <= 12 AND stage_level > 0 AND moves >= 0 AND clear_time_ms >= 0);`;

  const copySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="arcade-panel neon-box-cyan w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col p-5 gap-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-emerald-400" />
            <h2 className="text-lg font-black font-mono text-cyan-300 tracking-wider">
              SUPABASE CLOUD DATABASE 연동
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Connection Status */}
        <div
          className={`p-3.5 rounded-xl border font-mono text-xs flex items-center justify-between ${
            isSupabaseConfigured
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/50 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSupabaseConfigured ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span className="font-bold">
              연동 상태:{' '}
              {isSupabaseConfigured
                ? 'Supabase 실시간 클라우드 DB 연결됨 (pushpush_leaderboard)'
                : '로컬 브라우저 스토리지 모드 작동 중'}
            </span>
          </div>
          <span className="text-[11px] opacity-80">
            {isSupabaseConfigured ? '온라인 전역 랭킹 공유 가능' : '오프라인 단독 저장'}
          </span>
        </div>

        {/* Step Guide */}
        <div className="flex flex-col gap-3 font-mono text-xs text-gray-300">
          <h3 className="font-bold text-white flex items-center gap-1.5">
            <Key size={14} className="text-cyan-400" />
            <span>Supabase 3분 연동 가이드 (SQL구문.txt 적용)</span>
          </h3>

          <ol className="list-decimal list-inside space-y-2 text-gray-400 pl-1 leading-relaxed">
            <li>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                Supabase 대시보드 <ExternalLink size={11} />
              </a>
              에서 프로젝트를 생성합니다.
            </li>
            <li>
              좌측 <b>SQL Editor</b> 메뉴로 이동하여 아래 SQL을 붙여넣고 <b>RUN</b>을 클릭합니다:
            </li>
          </ol>

          {/* SQL Code Block */}
          <div className="relative">
            <pre className="p-3 bg-black/70 border border-gray-800 rounded-lg text-gray-300 text-[11px] overflow-x-auto max-h-48">
              {SQL_SCHEMA}
            </pre>
            <button
              onClick={copySql}
              className="absolute top-2 right-2 px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-[10px] font-bold hover:bg-cyan-900 flex items-center gap-1"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? '복사됨!' : 'SQL 복사'}</span>
            </button>
          </div>

          <p className="text-gray-400">
            3. 프로젝트 루트의 <code className="text-cyan-300 bg-black/60 px-1 py-0.5 rounded">.env.local</code> 파일에 Supabase 프로젝트 접속 정보를 입력합니다:
          </p>

          <pre className="p-2.5 bg-black/60 border border-gray-800 rounded-lg text-cyan-300 text-[11px]">
            NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co{'\n'}
            NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
          </pre>
        </div>

        {/* Footer Close */}
        <div className="flex justify-end pt-2 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs font-bold rounded-lg"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
