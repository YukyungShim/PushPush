'use client';

import React, { useState, useEffect, useRef } from 'react';
import { STAGES } from '../data/stages';
import { StageData, StageRecord, Direction } from '../types/game';
import { Header } from '../components/Header';
import { LeftPanel } from '../components/LeftPanel';
import { GameBoard } from '../components/GameBoard';
import { RightPanel } from '../components/RightPanel';
import { LevelEditorModal } from '../components/LevelEditorModal';
import { SupabaseModal } from '../components/SupabaseModal';
import { soundManager } from '../utils/sound';

const LOCAL_STORAGE_RECORDS_KEY = 'pushpush_stage_records_v1';

export default function Home() {
  const [stages, setStages] = useState<StageData[]>(STAGES);
  const [currentStageId, setCurrentStageId] = useState<number>(1); // Start with Stage 1 (push.png Classic)
  const [stageRecords, setStageRecords] = useState<Record<number, StageRecord>>({});

  // Audio and Display Preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(false);
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);

  // HUD & Game Controls State
  const [moves, setMoves] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [goalStatus, setGoalStatus] = useState<{ total: number; completed: number }>({
    total: 0,
    completed: 0,
  });

  // Modal Dialogs
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [scoreSubmitTrigger, setScoreSubmitTrigger] = useState<number>(0);

  // Registered Game Actions
  const undoFnRef = useRef<() => void>(() => {});
  const resetFnRef = useRef<() => void>(() => {});
  const stepFnRef = useRef<(dir: Direction) => void>(() => {});

  // Load saved records from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_RECORDS_KEY);
      if (saved) {
        setStageRecords(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleRecordUpdate = (record: StageRecord) => {
    setStageRecords((prev) => {
      const existing = prev[record.stageId];
      // Keep better record
      const bestMoves = existing
        ? Math.min(existing.bestMoves, record.bestMoves)
        : record.bestMoves;
      const bestTimeMs = existing
        ? Math.min(existing.bestTimeMs, record.bestTimeMs)
        : record.bestTimeMs;
      const stars = existing ? Math.max(existing.stars, record.stars) : record.stars;

      const updated: Record<number, StageRecord> = {
        ...prev,
        [record.stageId]: {
          stageId: record.stageId,
          cleared: true,
          bestMoves,
          bestTimeMs,
          stars,
          lastPlayed: new Date().toISOString(),
        },
      };

      try {
        localStorage.setItem(LOCAL_STORAGE_RECORDS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }

      return updated;
    });
  };

  const currentStage =
    stages.find((st) => st.id === currentStageId) || stages[0];

  const handleNextStage = () => {
    const currentIndex = stages.findIndex((st) => st.id === currentStageId);
    if (currentIndex >= 0 && currentIndex < stages.length - 1) {
      setCurrentStageId(stages[currentIndex + 1].id);
    } else {
      setCurrentStageId(stages[0].id);
    }
  };

  const handlePlayCustomStage = (customStage: StageData) => {
    // Check if custom stage exists in list
    const existingIdx = stages.findIndex((st) => st.id === customStage.id);
    if (existingIdx !== -1) {
      const updated = [...stages];
      updated[existingIdx] = customStage;
      setStages(updated);
    } else {
      setStages((prev) => [...prev, customStage]);
    }
    setCurrentStageId(customStage.id);
  };

  return (
    <div className={`min-h-screen bg-[#0a0b10] flex flex-col ${crtEnabled ? 'crt-overlay' : ''}`}>
      {/* 1. TOP HEADER */}
      <Header
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        bgmEnabled={bgmEnabled}
        setBgmEnabled={setBgmEnabled}
        crtEnabled={crtEnabled}
        setCrtEnabled={setCrtEnabled}
        onOpenEditor={() => setIsEditorOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* 2. MAIN 3-PANEL LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANEL */}
        <aside className="lg:col-span-3 w-full order-2 lg:order-1">
          <LeftPanel
            stages={stages}
            currentStage={currentStage}
            onSelectStage={(id) => setCurrentStageId(id)}
            stageRecords={stageRecords}
            soundEnabled={soundEnabled}
            totalGoals={goalStatus.total}
            completedGoals={goalStatus.completed}
          />
        </aside>

        {/* CENTER PANEL: 5.5 Columns on Desktop (Main Game Board Canvas) */}
        <section className="lg:col-span-6 w-full flex flex-col items-center justify-center order-1 lg:order-2">
          <GameBoard
            stage={currentStage}
            onNextStage={handleNextStage}
            onRecordUpdate={handleRecordUpdate}
            moves={moves}
            setMoves={setMoves}
            timerSeconds={timerSeconds}
            setTimerSeconds={setTimerSeconds}
            canUndo={canUndo}
            setCanUndo={setCanUndo}
            soundEnabled={soundEnabled}
            onRegisterUndo={(fn) => {
              undoFnRef.current = fn;
            }}
            onRegisterReset={(fn) => {
              resetFnRef.current = fn;
            }}
            onRegisterStep={(fn) => {
              stepFnRef.current = fn;
            }}
            setGoalStatus={setGoalStatus}
            onScoreSubmitted={() => setScoreSubmitTrigger((t) => t + 1)}
          />
        </section>

        {/* RIGHT PANEL: 3.0 Columns on Desktop (Leaderboard & AI Solver) */}
        <aside className="lg:col-span-3 w-full order-3">
          <RightPanel
            currentStage={currentStage}
            onStepMove={(dir) => stepFnRef.current(dir)}
            soundEnabled={soundEnabled}
            scoreSubmitTrigger={scoreSubmitTrigger}
          />
        </aside>
      </main>

      {/* 3. MODALS */}
      <LevelEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onPlayCustomStage={handlePlayCustomStage}
        soundEnabled={soundEnabled}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
}
