'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { StageData, LeaderboardEntry, SolverResult, Direction } from '../types/game';
import { fetchStageLeaderboard, isSupabaseConfigured } from '../lib/supabase';
import { solveStage } from '../utils/solver';
import { soundManager } from '../utils/sound';
import {
  Trophy,
  Bot,
  Sparkles,
  Play,
  Clock,
  Footprints,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface RightPanelProps {
  currentStage: StageData;
  onStepMove: (dir: Direction) => void;
  soundEnabled: boolean;
  scoreSubmitTrigger?: number;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  currentStage,
  onStepMove,
  soundEnabled,
  scoreSubmitTrigger,
}) => {
  const [activeTab, setActiveTab] = useState<'LEADERBOARD' | 'SOLVER'>('LEADERBOARD');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);

  // Solver State
  const [solverResult, setSolverResult] = useState<SolverResult | null>(null);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  // Load Leaderboard
  const loadLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    const data = await fetchStageLeaderboard(currentStage.id);
    setLeaderboard(data);
    setLoadingLeaderboard(false);
  }, [currentStage.id]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard, scoreSubmitTrigger]);

  // Run Solver
  const handleSolve = () => {
    setIsSolving(true);
    if (soundEnabled) soundManager.playClick();
    setTimeout(() => {
      const res = solveStage(currentStage.grid);
      setSolverResult(res);
      setCurrentStepIdx(0);
      setIsSolving(false);
    }, 50);
  };

  useEffect(() => {
    setSolverResult(null);
    setCurrentStepIdx(0);
    setIsAutoPlaying(false);
  }, [currentStage.id]);

  const handleTakeStep = () => {
    if (!solverResult?.solution || currentStepIdx >= solverResult.solution.length) return;
    const nextDir = solverResult.solution[currentStepIdx];
    onStepMove(nextDir);
    setCurrentStepIdx((idx) => idx + 1);
  };

  const handleAutoPlay = () => {
    if (!solverResult?.solution || isAutoPlaying) return;
    setIsAutoPlaying(true);

    let idx = currentStepIdx;
    const interval = setInterval(() => {
      if (!solverResult.solution || idx >= solverResult.solution.length) {
        clearInterval(interval);
        setIsAutoPlaying(false);
        return;
      }
      const dir = solverResult.solution[idx];
      onStepMove(dir);
      idx++;
      setCurrentStepIdx(idx);
    }, 450);
  };

  const formatMs = (ms: number) => {
    if (ms === undefined || ms === null) return '0.0s';
    const totalSecs = ms / 1000;
    if (totalSecs < 60) {
      return `${totalSecs.toFixed(1)}s`;
    }
    const mins = Math.floor(totalSecs / 60);
    const secs = (totalSecs % 60).toFixed(1);
    return `${mins}m ${secs}s`;
  };

  const getDirIcon = (dir: Direction) => {
    switch (dir) {
      case 'UP':
        return '⬆️ UP';
      case 'DOWN':
        return '⬇️ DOWN';
      case 'LEFT':
        return '⬅️ LEFT';
      case 'RIGHT':
        return '➡️ RIGHT';
    }
  };

  return (
    <div className="tetris-panel p-4 flex flex-col gap-3.5 w-full min-h-[460px]">
      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-[#070b16] p-1 rounded-lg border border-cyan-500/20 text-xs font-mono">
        <button
          onClick={() => {
            if (soundEnabled) soundManager.playClick();
            setActiveTab('LEADERBOARD');
          }}
          className={`flex-1 py-1.5 rounded font-bold transition flex items-center justify-center gap-1 ${
            activeTab === 'LEADERBOARD'
              ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(0,255,255,0.5)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Trophy size={13} />
          <span>RANKING</span>
        </button>

        <button
          onClick={() => {
            if (soundEnabled) soundManager.playClick();
            setActiveTab('SOLVER');
          }}
          className={`flex-1 py-1.5 rounded font-bold transition flex items-center justify-center gap-1 ${
            activeTab === 'SOLVER'
              ? 'bg-pink-500 text-white shadow-[0_0_8px_rgba(255,0,127,0.5)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Bot size={13} />
          <span>AI SOLVER</span>
        </button>
      </div>

      {/* TAB 1: RANKING (Matching tetris.png Right Column) */}
      {activeTab === 'LEADERBOARD' && (
        <div className="flex flex-col justify-between flex-1 gap-3">
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-mono text-cyan-400 tracking-wider">
              GLOBAL HIGH SCORES
            </div>
            <h2 className="text-lg md:text-xl font-black font-arcade neon-text-yellow tracking-wider">
              RANKING
            </h2>
          </div>

          {/* Ranking list or empty state matching tetris.png */}
          <div className="flex-1 flex flex-col justify-center">
            {loadingLeaderboard ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500 font-mono text-xs gap-2">
                <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>기록 확인 중...</span>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-mono text-xs leading-relaxed">
                아직 등록된 점수가 없습니다.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                {leaderboard.map((entry, idx) => {
                  const isTop1 = idx === 0;
                  const isTop2 = idx === 1;
                  const isTop3 = idx === 2;

                  return (
                    <div
                      key={entry.id || idx}
                      className={`flex items-center justify-between p-2 rounded-lg border font-mono text-xs ${
                        isTop1
                          ? 'bg-[#181a10] border-yellow-500/50 text-yellow-300'
                          : isTop2
                          ? 'bg-[#121624] border-slate-400/40 text-slate-200'
                          : isTop3
                          ? 'bg-[#181210] border-amber-600/40 text-amber-300'
                          : 'bg-[#080d1a] border-gray-800 text-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 text-center font-bold">
                          {isTop1 ? '1' : isTop2 ? '2' : isTop3 ? '3' : `${idx + 1}`}
                        </span>
                        <span className="font-bold text-white tracking-wider">
                          {entry.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1 text-cyan-300">
                          <Footprints size={11} />
                          <span>{entry.moves}</span>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Clock size={11} />
                          <span>{formatMs(entry.clear_time_ms)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom status text with lightning bolt matching tetris.png ⚡ */}
          <div className="pt-2 border-t border-gray-800/80 flex items-center gap-1.5 text-[11px] font-mono text-cyan-400">
            <Zap size={13} className="text-yellow-400 fill-yellow-400" />
            <span>
              {isSupabaseConfigured
                ? '글로벌 리더보드 연동 완료'
                : '로컬 스토리지 모드 실행 중'}
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: AI SOLVER */}
      {activeTab === 'SOLVER' && (
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-mono text-pink-400 tracking-wider">
              0-GRAVITY BFS ENGINE
            </div>
            <h2 className="text-base font-black font-mono text-pink-400 tracking-wider">
              AI PUZZLE SOLVER
            </h2>
          </div>

          {!solverResult ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-6">
              <p className="text-xs text-gray-400 font-mono">
                무중력 관성 경로를 계산하여 최단 클리어 해법을 찾습니다.
              </p>
              <button
                onClick={handleSolve}
                disabled={isSolving}
                className="btn-outline-pink px-4 py-2 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5"
              >
                {isSolving ? (
                  <span>연산 중...</span>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>최적 경로 탐색</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="tetris-panel-inner p-2.5 font-mono text-xs flex flex-col gap-1">
                <div className="flex items-center justify-between text-gray-300">
                  <span>상태:</span>
                  <span className={solverResult.solvable ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {solverResult.solvable ? 'SOLVABLE' : 'UNSOLVABLE'}
                  </span>
                </div>
                {solverResult.solvable && (
                  <div className="flex items-center justify-between text-gray-300">
                    <span>최소 이동:</span>
                    <span className="text-pink-400 font-bold">
                      {solverResult.minMoves} MOVES
                    </span>
                  </div>
                )}
              </div>

              {solverResult.solvable && solverResult.solution && (
                <>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleTakeStep}
                      disabled={currentStepIdx >= solverResult.solution.length || isAutoPlaying}
                      className="flex-1 py-1.5 px-2 btn-outline-cyan rounded text-[11px] font-mono font-bold flex items-center justify-center gap-1"
                    >
                      <ChevronRight size={13} />
                      <span>힌트 ({currentStepIdx}/{solverResult.solution.length})</span>
                    </button>

                    <button
                      onClick={handleAutoPlay}
                      disabled={isAutoPlaying || currentStepIdx >= solverResult.solution.length}
                      className="py-1.5 px-3 btn-outline-pink rounded text-[11px] font-mono font-bold flex items-center gap-1"
                    >
                      <Play size={12} />
                      <span>{isAutoPlaying ? '재생중' : '자동재생'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1.5 bg-[#070b16] rounded border border-gray-800 font-mono text-[10px]">
                    {solverResult.solution.map((stepDir, idx) => {
                      const isExecuted = idx < currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <span
                          key={idx}
                          className={`px-1 py-0.5 rounded border ${
                            isCurrent
                              ? 'bg-pink-500 text-white font-bold border-pink-300 shadow-[0_0_6px_rgba(255,0,127,0.8)]'
                              : isExecuted
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800 line-through opacity-70'
                              : 'bg-[#0a0f1d] text-gray-300 border-gray-800'
                          }`}
                        >
                          {idx + 1}. {getDirIcon(stepDir)}
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
