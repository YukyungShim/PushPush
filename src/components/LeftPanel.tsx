'use client';

import React, { useState } from 'react';
import { StageData, StageRecord, PhaseType } from '../types/game';
import { Layers, Sparkles, Trophy } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface LeftPanelProps {
  stages: StageData[];
  currentStage: StageData;
  onSelectStage: (id: number) => void;
  stageRecords: Record<number, StageRecord>;
  soundEnabled: boolean;
  totalGoals: number;
  completedGoals: number;
}

const PHASES: { label: string; key: PhaseType | 'ALL' }[] = [
  { label: 'ALL', key: 'ALL' },
  { label: 'TUTORIAL', key: 'Tutorial' },
  { label: 'STAGE 6-15', key: 'Beginner' },
  { label: 'ADVANCED', key: 'Advanced' },
  { label: 'CLASSIC', key: 'Classic' },
];

export const LeftPanel: React.FC<LeftPanelProps> = ({
  stages,
  currentStage,
  onSelectStage,
  stageRecords,
  soundEnabled,
  totalGoals,
  completedGoals,
}) => {
  const [activeTab, setActiveTab] = useState<PhaseType | 'ALL'>('ALL');

  const filteredStages = stages.filter((st) => {
    if (activeTab === 'ALL') return true;
    return st.phaseCategory === activeTab;
  });

  const currentRecord = stageRecords[currentStage.id];

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* 1. TARGET OBJECTS / STAGE STATUS (Matching tetris.png HOLD / NEXT box) */}
      <div className="tetris-panel p-3.5 flex flex-col gap-2">
        <div className="text-[11px] font-mono font-bold text-cyan-400 tracking-wider flex items-center justify-between">
          <span>STAGE INFO [TARGETS]</span>
          <span className="text-[10px] text-gray-500 font-normal">#{currentStage.id}</span>
        </div>

        <div className="tetris-panel-inner p-3 flex flex-col gap-2">
          <div className="text-xs font-bold text-white font-mono truncate">
            {currentStage.name}
          </div>

          <div className="flex items-center justify-around pt-1 border-t border-cyan-500/20">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-gray-400">TARGETS</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-base">🏠</span>
                <span className="text-sm font-bold font-mono text-yellow-300">
                  {completedGoals} / {totalGoals}
                </span>
              </div>
            </div>

            <div className="w-[1px] h-8 bg-gray-800" />

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-gray-400">PAR MOVES</span>
              <span className="text-sm font-bold font-mono text-cyan-300 mt-1">
                {currentStage.parMoves}
              </span>
            </div>
          </div>

          {currentRecord && currentRecord.cleared && (
            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 pt-1 border-t border-gray-800">
              <span className="flex items-center gap-1 text-gray-400">
                <Trophy size={11} className="text-yellow-400" /> BEST:
              </span>
              <span className="font-bold">
                {currentRecord.bestMoves} MOVES (
                {'★'.repeat(currentRecord.stars)}
                {'☆'.repeat(3 - currentRecord.stars)})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. STAGE SELECTOR (Matching NEXT PIECE Box style in tetris.png) */}
      <div className="tetris-panel p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-cyan-400 tracking-wider">
          <span>STAGE SELECTOR</span>
          <span className="text-[10px] text-gray-400">
            {Object.values(stageRecords).filter((r) => r.cleared).length}/{stages.length}
          </span>
        </div>

        {/* Phase Filter tabs */}
        <div className="flex flex-wrap gap-1">
          {PHASES.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                if (soundEnabled) soundManager.playClick();
                setActiveTab(p.key);
              }}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                activeTab === p.key
                  ? 'bg-cyan-500 text-black font-bold shadow-[0_0_8px_rgba(0,255,255,0.6)]'
                  : 'bg-[#080d1a] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 5-Column Grid */}
        <div className="grid grid-cols-5 gap-1 max-h-40 overflow-y-auto pr-1">
          {filteredStages.map((st) => {
            const isSelected = st.id === currentStage.id;
            const rec = stageRecords[st.id];
            const isCleared = rec?.cleared;

            return (
              <button
                key={st.id}
                onClick={() => {
                  if (soundEnabled) soundManager.playClick();
                  onSelectStage(st.id);
                }}
                className={`flex flex-col items-center justify-center p-1.5 rounded border font-mono text-[11px] transition ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_8px_rgba(0,255,255,0.4)] ring-1 ring-cyan-400'
                    : isCleared
                    ? 'bg-[#0a1824] border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
                    : 'bg-[#080e1c] border-gray-800/80 text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
              >
                <span>{st.id === 0 ? '★' : st.id}</span>
                <span className="text-[8px] text-yellow-400 leading-none mt-0.5">
                  {isCleared ? '★'.repeat(rec.stars || 1) : '·'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CONTROLS SECTION (Matching tetris.png exact CONTROLS table) */}
      <div className="tetris-panel p-3.5 flex flex-col gap-2">
        <div className="text-[12px] font-mono font-bold text-cyan-400 tracking-wider">
          CONTROLS
        </div>

        <div className="flex flex-col gap-1.5 text-[11px] font-mono text-gray-300 pt-1">
          <div className="flex items-center justify-between border-b border-gray-800/60 pb-1">
            <span className="text-gray-400">이동</span>
            <div className="flex items-center gap-1">
              <span className="key-badge">← → / A D</span>
              <span className="key-badge">↑ ↓ / W S</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-gray-800/60 pb-1">
            <span className="text-gray-400">되돌리기</span>
            <span className="key-badge">Z / U</span>
          </div>

          <div className="flex items-center justify-between border-b border-gray-800/60 pb-1">
            <span className="text-gray-400">재시작</span>
            <span className="key-badge">R</span>
          </div>

          <div className="flex items-center justify-between border-b border-gray-800/60 pb-1">
            <span className="text-gray-400">AI 힌트</span>
            <span className="key-badge">H</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">일시정지</span>
            <span className="key-badge">P / ESC</span>
          </div>
        </div>
      </div>
    </div>
  );
};
