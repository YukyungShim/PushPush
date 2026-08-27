'use client';

import React, { useState } from 'react';
import { StageData, TileChar } from '../types/game';
import { solveStage } from '../utils/solver';
import { soundManager } from '../utils/sound';
import {
  X,
  Play,
  Sparkles,
  Copy,
  Check,
  Download,
  Upload,
  Eraser,
  Bot,
  Layers,
  Wand2,
} from 'lucide-react';

interface LevelEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayCustomStage: (stage: StageData) => void;
  soundEnabled: boolean;
}

const BRUSHES: { char: TileChar; label: string; icon: string; color: string }[] = [
  { char: '#', label: '벽 (Wall)', icon: '🧱', color: 'bg-red-950/60 border-red-500/50 text-red-300' },
  { char: 'O', label: '공 (Ball)', icon: '🔵', color: 'bg-blue-950/60 border-blue-500/50 text-cyan-300' },
  { char: 'X', label: '목적지 (Target)', icon: '🏠', color: 'bg-yellow-950/60 border-yellow-500/50 text-yellow-300' },
  { char: '@', label: '플레이어 (Player)', icon: '🤖', color: 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' },
  { char: '*', label: '목적지 위 공', icon: '✨', color: 'bg-fuchsia-950/60 border-fuchsia-500/50 text-fuchsia-300' },
  { char: '.', label: '빈 바닥 (Floor)', icon: '⬛', color: 'bg-gray-900 border-gray-700 text-gray-300' },
];

export const LevelEditorModal: React.FC<LevelEditorModalProps> = ({
  isOpen,
  onClose,
  onPlayCustomStage,
  soundEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<'EDITOR' | 'AI_PROMPT'>('EDITOR');
  const [gridSize, setGridSize] = useState<{ width: number; height: number }>({
    width: 7,
    height: 7,
  });

  // Editor grid initialization
  const [grid, setGrid] = useState<string[]>(() => [
    '#######',
    '#@.O..#',
    '#.....#',
    '#..X..#',
    '#.....#',
    '#...O.#',
    '#######',
  ]);

  const [activeBrush, setActiveBrush] = useState<TileChar>('#');
  const [stageName, setStageName] = useState<string>('Custom Challenge');
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');

  if (!isOpen) return null;

  const handleResize = (w: number, h: number) => {
    const newGrid: string[] = [];
    for (let r = 0; r < h; r++) {
      let row = '';
      for (let c = 0; c < w; c++) {
        if (r === 0 || r === h - 1 || c === 0 || c === w - 1) {
          row += '#';
        } else if (r < grid.length && c < grid[r].length) {
          row += grid[r][c];
        } else {
          row += '.';
        }
      }
      newGrid.push(row);
    }
    setGridSize({ width: w, height: h });
    setGrid(newGrid);
    setValidationResult(null);
  };

  const handleCellClick = (r: number, c: number) => {
    if (soundEnabled) soundManager.playClick();

    // If placing player, remove existing player
    let newGrid = [...grid];
    if (activeBrush === '@') {
      newGrid = newGrid.map((row) => row.replace(/@/g, '.').replace(/\+/g, 'X'));
    }

    const rowChars = newGrid[r].split('');
    rowChars[c] = activeBrush;
    newGrid[r] = rowChars.join('');
    setGrid(newGrid);
    setValidationResult(null);
  };

  const handleClear = () => {
    const newGrid: string[] = [];
    for (let r = 0; r < gridSize.height; r++) {
      let row = '';
      for (let c = 0; c < gridSize.width; c++) {
        if (r === 0 || r === gridSize.height - 1 || c === 0 || c === gridSize.width - 1) {
          row += '#';
        } else {
          row += '.';
        }
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setValidationResult(null);
  };

  const handleValidateAndSolve = () => {
    if (soundEnabled) soundManager.playClick();
    const result = solveStage(grid);
    if (result.solvable) {
      setValidationResult(
        `✅ 유효한 맵입니다! 최단 클리어 이동 횟수: ${result.minMoves}회 (탐색 상태 수: ${result.exploredStates})`
      );
    } else {
      setValidationResult(`❌ 검증 실패: ${result.message || '해결 불가능한 맵입니다.'}`);
    }
  };

  const handlePlay = () => {
    const result = solveStage(grid);
    if (!result.solvable) {
      setValidationResult(`❌ 검증 실패: ${result.message || '해결 불가능한 맵입니다.'}`);
      return;
    }

    const customStage: StageData = {
      id: 999,
      name: stageName || 'Custom Stage',
      phase: 'Custom Stage',
      phaseCategory: 'Custom',
      width: gridSize.width,
      height: gridSize.height,
      grid: grid,
      parMoves: result.minMoves || 10,
      description: '플레이어가 직접 디자인하거나 AI로 생성한 커스텀 스테이지입니다.',
    };

    onPlayCustomStage(customStage);
    onClose();
  };

  const handleImport = () => {
    const lines = importText
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;
    const height = lines.length;
    const width = Math.max(...lines.map((l) => l.length));

    const normalized = lines.map((l) => l.padEnd(width, '#'));
    setGridSize({ width, height });
    setGrid(normalized);
    setValidationResult(null);
    setImportText('');
  };

  const handleCopyStageCode = () => {
    const stageCode = grid.join('\n');
    navigator.clipboard.writeText(stageCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const AI_SYSTEM_PROMPT = `당신은 전문 퍼즐 게임 레벨 디자이너입니다. '무중력 관성 이동(밀면 벽에 닿을 때까지 미끄러짐)' 규칙이 적용된 2D 그리드 기반의 소코반 맵을 생성해야 합니다.
맵의 기호:
- '.' : 빈 공간
- '#' : 벽
- 'O' : 공
- 'X' : 목적지
- '@' : 플레이어
- '*' : 목적지 위의 공

[제약 조건]
1. 맵은 반드시 테두리가 벽('#')으로 닫혀 있어야 합니다.
2. 공의 개수와 목적지의 개수는 반드시 같아야 합니다.
3. 100% 클리어 가능해야 하며 최단 이동 횟수를 명시하세요.`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="arcade-panel neon-box-cyan w-full max-w-3xl max-h-[92vh] overflow-y-auto flex flex-col p-5 gap-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
          <div className="flex items-center gap-2">
            <Wand2 size={20} className="text-cyan-400" />
            <h2 className="text-lg font-black font-mono text-cyan-300 tracking-wider">
              STAGE EDITOR &amp; AI GENERATOR
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 bg-[#0a0d18] p-1 rounded-lg border border-cyan-500/20 font-mono text-xs">
          <button
            onClick={() => setActiveTab('EDITOR')}
            className={`flex-1 py-1.5 rounded font-bold transition ${
              activeTab === 'EDITOR'
                ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(0,255,255,0.6)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🕹️ 맵 디자인 에디터
          </button>
          <button
            onClick={() => setActiveTab('AI_PROMPT')}
            className={`flex-1 py-1.5 rounded font-bold transition ${
              activeTab === 'AI_PROMPT'
                ? 'bg-fuchsia-500 text-white shadow-[0_0_8px_rgba(255,0,255,0.6)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🤖 AI 프롬프트 생성기 (prompt.txt 기반)
          </button>
        </div>

        {/* TAB 1: VISUAL MAP EDITOR */}
        {activeTab === 'EDITOR' && (
          <div className="flex flex-col gap-4">
            {/* Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-black/40 p-3 rounded-xl border border-gray-800">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-gray-400">맵 크기:</span>
                {[5, 7, 9, 11].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleResize(size, size)}
                    className={`px-2 py-1 rounded border ${
                      gridSize.width === size
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                        : 'bg-black/50 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  onClick={handleClear}
                  className="px-2.5 py-1 rounded bg-red-950/40 border border-red-500/40 text-red-300 hover:bg-red-900/60 flex items-center gap-1"
                >
                  <Eraser size={12} />
                  <span>초기화</span>
                </button>
              </div>
            </div>

            {/* Tile Brush Palette */}
            <div className="flex flex-wrap gap-2">
              {BRUSHES.map((b) => (
                <button
                  key={b.char}
                  onClick={() => {
                    if (soundEnabled) soundManager.playClick();
                    setActiveBrush(b.char);
                  }}
                  className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-1.5 transition ${
                    activeBrush === b.char
                      ? 'ring-2 ring-cyan-400 scale-105 font-bold shadow-[0_0_10px_rgba(0,255,255,0.4)]'
                      : 'opacity-70 hover:opacity-100'
                  } ${b.color}`}
                >
                  <span>{b.icon}</span>
                  <span>{b.label}</span>
                </button>
              ))}
            </div>

            {/* Interactive Grid Canvas */}
            <div className="flex justify-center bg-[#070911] p-4 rounded-xl border border-cyan-500/30 overflow-x-auto">
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${gridSize.width}, minmax(0, 1fr))`,
                }}
              >
                {grid.map((rowStr, r) =>
                  rowStr.split('').map((cellChar, c) => (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      className={`w-9 h-9 md:w-11 md:h-11 rounded flex items-center justify-center font-mono font-bold text-sm border transition hover:scale-105 ${
                        cellChar === '#'
                          ? 'bg-[#802211] border-[#551100] text-transparent'
                          : cellChar === 'O'
                          ? 'bg-blue-600 border-cyan-400 text-white shadow-[0_0_8px_rgba(0,255,255,0.6)]'
                          : cellChar === 'X'
                          ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300'
                          : cellChar === '@'
                          ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                          : cellChar === '*'
                          ? 'bg-fuchsia-500/40 border-fuchsia-400 text-fuchsia-300'
                          : 'bg-[#101524] border-gray-800 text-transparent hover:border-cyan-500/40'
                      }`}
                    >
                      {cellChar === 'O'
                        ? '🔵'
                        : cellChar === 'X'
                        ? '🏠'
                        : cellChar === '@'
                        ? '🤖'
                        : cellChar === '*'
                        ? '✨'
                        : ''}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Validation Message */}
            {validationResult && (
              <div
                className={`p-3 rounded-lg font-mono text-xs border ${
                  validationResult.startsWith('✅')
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-950/60 border-red-500/50 text-red-300'
                }`}
              >
                {validationResult}
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleValidateAndSolve}
                  className="px-3 py-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5"
                >
                  <Bot size={14} />
                  <span>BFS 유효성 검증</span>
                </button>

                <button
                  onClick={handleCopyStageCode}
                  className="px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 font-mono text-xs flex items-center gap-1.5"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? '복사됨!' : '맵 코드 복사'}</span>
                </button>
              </div>

              <button
                onClick={handlePlay}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono text-xs font-black shadow-[0_0_15px_rgba(0,255,255,0.6)] flex items-center gap-2"
              >
                <Play size={16} fill="black" />
                <span>커스텀 맵 즉시 플레이</span>
              </button>
            </div>

            {/* Import Stage Box */}
            <div className="mt-2 bg-black/40 p-3 rounded-xl border border-gray-800 flex flex-col gap-2">
              <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                <Upload size={13} />
                <span>텍스트 맵 코드 불러오기 (Import Grid)</span>
              </span>
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="예: #####\n#@O.#\n#.X.#\n#####"
                  className="flex-1 bg-black/80 border border-gray-700 rounded-lg p-2 font-mono text-xs text-white outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="px-3 py-1 bg-cyan-900/60 hover:bg-cyan-800 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold rounded-lg disabled:opacity-40"
                >
                  불러오기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI PROMPT TEMPLATES (From prompt.txt) */}
        {activeTab === 'AI_PROMPT' && (
          <div className="flex flex-col gap-4 text-xs font-mono">
            <div className="bg-fuchsia-950/30 border border-fuchsia-500/30 p-3.5 rounded-xl text-fuchsia-200 leading-relaxed">
              <p className="font-bold mb-1">💡 프롬프트 지침 (prompt.txt 기반)</p>
              아래 지시문을 복사하여 LLM(ChatGPT, Gemini 등)에게 전달하면 무중력 관성 규칙에 맞춘 새로운 스테이지를 생성할 수 있습니다. 생성된 텍스트 맵을 상단 '불러오기'에 붙여넣어 바로 플레이해보세요!
            </div>

            {/* System Prompt Box */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-gray-400">
                <span className="font-bold text-cyan-300">1. 기본 시스템 지시문 (System Prompt)</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(AI_SYSTEM_PROMPT);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Copy size={11} />
                  <span>복사</span>
                </button>
              </div>
              <pre className="p-3 bg-black/60 border border-gray-800 rounded-lg text-gray-300 whitespace-pre-wrap">
                {AI_SYSTEM_PROMPT}
              </pre>
            </div>

            {/* Phase Specific Prompts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-black/40 border border-cyan-500/30 rounded-xl flex flex-col gap-1.5">
                <span className="text-cyan-300 font-bold">Phase 1: 튜토리얼</span>
                <p className="text-gray-400 text-[11px]">
                  "공 1개, 맵 5x5 이하. 공이 1번 벽에 튕긴 후 목적지에 도달하는 1쿠션 구조로 설계하십시오."
                </p>
              </div>

              <div className="p-3 bg-black/40 border border-yellow-500/30 rounded-xl flex flex-col gap-1.5">
                <span className="text-yellow-300 font-bold">Phase 2: 초/중급</span>
                <p className="text-gray-400 text-[11px]">
                  "공 2~3개, 맵 7x7. 목적지는 중앙 빈 공간이며, 다른 공을 먼저 특정 위치에 배치해 '임시 벽'으로 활용하는 로직을 포함하세요."
                </p>
              </div>

              <div className="p-3 bg-black/40 border border-fuchsia-500/30 rounded-xl flex flex-col gap-1.5">
                <span className="text-fuchsia-300 font-bold">Phase 3: 고급</span>
                <p className="text-gray-400 text-[11px]">
                  "맵 10x10, 최소 15수 이상. 1칸 통로와 함정 구역을 포함하여 순서가 틀리면 데드록이 발생하는 구조로 설계하세요."
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
