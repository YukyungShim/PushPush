'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  StageData,
  Position,
  Direction,
  BallState,
  PlayerState,
  MoveStep,
  StageRecord,
} from '../types/game';
import { calculateClassicBallPush, parseGridToState } from '../utils/solver';
import { soundManager } from '../utils/sound';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Undo2,
  Trophy,
  ArrowRightCircle,
  Send,
  Check,
} from 'lucide-react';
import { submitStageScore } from '../lib/supabase';

interface GameBoardProps {
  stage: StageData;
  onNextStage: () => void;
  onRecordUpdate: (record: StageRecord) => void;
  moves: number;
  setMoves: React.Dispatch<React.SetStateAction<number>>;
  timerSeconds: number;
  setTimerSeconds: React.Dispatch<React.SetStateAction<number>>;
  canUndo: boolean;
  setCanUndo: (val: boolean) => void;
  soundEnabled: boolean;
  onRegisterUndo: (undoFn: () => void) => void;
  onRegisterReset: (resetFn: () => void) => void;
  onRegisterStep: (stepFn: (dir: Direction) => void) => void;
  setGoalStatus: (status: { total: number; completed: number }) => void;
  onScoreSubmitted?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  stage,
  onNextStage,
  onRecordUpdate,
  moves,
  setMoves,
  timerSeconds,
  setTimerSeconds,
  canUndo,
  setCanUndo,
  soundEnabled,
  onRegisterUndo,
  onRegisterReset,
  onRegisterStep,
  setGoalStatus,
  onScoreSubmitted,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game Grid and Entities State
  const [gridWalls, setGridWalls] = useState<boolean[][]>([]);
  const [targets, setTargets] = useState<Position[]>([]);
  const [player, setPlayer] = useState<PlayerState>({ x: 0, y: 0, dir: 'DOWN' });
  const [balls, setBalls] = useState<BallState[]>([]);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [undoStack, setUndoStack] = useState<MoveStep[]>([]);
  const [playerName, setPlayerName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [finalClearTimeMs, setFinalClearTimeMs] = useState<number>(0);

  // High precision timer
  const startTimeRef = useRef<number>(performance.now());
  const pausedTimeAccumRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);

  // Animation and Particles
  const particlesRef = useRef<Particle[]>([]);
  const activeAnimationsRef = useRef<{
    ballId: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    startTime: number;
    duration: number;
  } | null>(null);

  // Initialize stage
  const initStage = useCallback(() => {
    const { player: initPlayer, balls: initBalls, targets: initTargets, walls } = parseGridToState(stage.grid);

    setGridWalls(walls);
    setTargets(initTargets);
    setPlayer(
      initPlayer
        ? { x: initPlayer.x, y: initPlayer.y, dir: 'DOWN' }
        : { x: 1, y: 1, dir: 'DOWN' }
    );
    setBalls(
      initBalls.map((b, idx) => ({
        id: idx,
        x: b.x,
        y: b.y,
      }))
    );
    setIsWon(false);
    setIsPaused(false);
    setIsAnimating(false);
    setUndoStack([]);
    setCanUndo(false);
    setMoves(0);
    setTimerSeconds(0);
    setSubmitted(false);
    setFinalClearTimeMs(0);
    startTimeRef.current = performance.now();
    pausedTimeAccumRef.current = 0;
    particlesRef.current = [];
    activeAnimationsRef.current = null;

    setGoalStatus({
      total: initTargets.length,
      completed: 0,
    });
  }, [stage, setMoves, setTimerSeconds, setCanUndo, setGoalStatus]);

  useEffect(() => {
    initStage();
  }, [initStage]);

  // Expose reset to parent
  useEffect(() => {
    onRegisterReset(initStage);
  }, [onRegisterReset, initStage]);

  // Toggle Pause
  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        pauseStartRef.current = performance.now();
      } else {
        pausedTimeAccumRef.current += performance.now() - pauseStartRef.current;
      }
      return next;
    });
  }, []);

  // Check Win Condition
  const checkWin = useCallback(
    (currentBalls: Position[], currentMoves: number) => {
      if (targets.length === 0) return false;
      const completed = targets.filter((t) =>
        currentBalls.some((b) => b.x === t.x && b.y === t.y)
      ).length;

      setGoalStatus({
        total: targets.length,
        completed,
      });

      if (completed === targets.length) {
        const rawElapsed = performance.now() - startTimeRef.current - pausedTimeAccumRef.current;
        const elapsedMs = Math.max(100, Math.round(rawElapsed));
        setFinalClearTimeMs(elapsedMs);
        setIsWon(true);
        if (soundEnabled) soundManager.playWin();

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00ffff', '#ff007f', '#facc15', '#00ff66'],
          });
        } catch {
          // Ignore
        }

        let stars = 1;
        if (currentMoves <= stage.parMoves) {
          stars = 3;
        } else if (currentMoves <= Math.floor(stage.parMoves * 1.5)) {
          stars = 2;
        }

        const record: StageRecord = {
          stageId: stage.id,
          cleared: true,
          bestMoves: currentMoves,
          bestTimeMs: elapsedMs,
          stars,
          lastPlayed: new Date().toISOString(),
        };

        onRecordUpdate(record);
        return true;
      }
      return false;
    },
    [targets, stage, soundEnabled, setGoalStatus, onRecordUpdate]
  );

  // Classic PushPush Move Logic (1 Tile per Push)
  const handleMove = useCallback(
    (dir: Direction) => {
      if (isWon || isPaused || isAnimating || gridWalls.length === 0) return;

      const dirMap: Record<Direction, { dx: number; dy: number }> = {
        UP: { dx: 0, dy: -1 },
        DOWN: { dx: 0, dy: 1 },
        LEFT: { dx: -1, dy: 0 },
        RIGHT: { dx: 1, dy: 0 },
      };

      const { dx, dy } = dirMap[dir];
      const targetPx = player.x + dx;
      const targetPy = player.y + dy;

      const height = gridWalls.length;
      const width = gridWalls[0].length;

      // Check boundary & wall
      if (
        targetPx < 0 ||
        targetPx >= width ||
        targetPy < 0 ||
        targetPy >= height ||
        gridWalls[targetPy][targetPx]
      ) {
        return;
      }

      // Check if target cell has a ball
      const ballIdx = balls.findIndex((b) => b.x === targetPx && b.y === targetPy);

      if (ballIdx !== -1) {
        // Classic Push: Ball moves exactly 1 cell
        const pushedBall = balls[ballIdx];
        const otherBalls = balls.filter((_, idx) => idx !== ballIdx);

        const newBallPos = calculateClassicBallPush(
          pushedBall.x,
          pushedBall.y,
          dx,
          dy,
          gridWalls,
          otherBalls
        );

        if (!newBallPos) {
          return; // Blocked push (wall or another ball behind)
        }

        if (soundEnabled) {
          soundManager.playPush();
        }

        // Save Undo step
        const stepRecord: MoveStep = {
          playerBefore: { x: player.x, y: player.y },
          playerAfter: { x: targetPx, y: targetPy },
          dir,
          pushedBall: {
            ballId: pushedBall.id,
            from: { x: pushedBall.x, y: pushedBall.y },
            to: { x: newBallPos.x, y: newBallPos.y },
          },
        };

        setUndoStack((prev) => [...prev, stepRecord]);
        setCanUndo(true);

        const newMoves = moves + 1;
        setMoves(newMoves);
        setPlayer({ x: targetPx, y: targetPy, dir, isPushing: true });

        // Crisp 1-tile slide animation
        const duration = 100;
        setIsAnimating(true);
        activeAnimationsRef.current = {
          ballId: pushedBall.id,
          startX: pushedBall.x,
          startY: pushedBall.y,
          endX: newBallPos.x,
          endY: newBallPos.y,
          startTime: performance.now(),
          duration,
        };

        setTimeout(() => {
          setBalls((prevBalls) => {
            const updated = prevBalls.map((b) =>
              b.id === pushedBall.id ? { ...b, x: newBallPos.x, y: newBallPos.y } : b
            );
            checkWin(updated, newMoves);
            return updated;
          });

          // Check if ball landed on house target
          const hitTarget = targets.some(
            (t) => t.x === newBallPos.x && t.y === newBallPos.y
          );
          if (hitTarget && soundEnabled) {
            soundManager.playGoal();
          }

          setIsAnimating(false);
          activeAnimationsRef.current = null;
          setPlayer((p) => ({ ...p, isPushing: false }));
        }, duration);
      } else {
        // Normal player step (1 tile)
        if (soundEnabled) soundManager.playStep();

        const stepRecord: MoveStep = {
          playerBefore: { x: player.x, y: player.y },
          playerAfter: { x: targetPx, y: targetPy },
          dir,
        };

        setUndoStack((prev) => [...prev, stepRecord]);
        setCanUndo(true);

        const newMoves = moves + 1;
        setMoves(newMoves);
        setPlayer({ x: targetPx, y: targetPy, dir, isPushing: false });
      }
    },
    [
      isWon,
      isPaused,
      isAnimating,
      gridWalls,
      player,
      balls,
      soundEnabled,
      moves,
      setMoves,
      setCanUndo,
      checkWin,
      targets,
    ]
  );

  // Expose step function
  useEffect(() => {
    onRegisterStep(handleMove);
  }, [onRegisterStep, handleMove]);

  // Undo
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0 || isAnimating || isWon || isPaused) return;

    const lastStep = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setCanUndo(undoStack.length > 1);

    setPlayer({
      x: lastStep.playerBefore.x,
      y: lastStep.playerBefore.y,
      dir: lastStep.dir,
      isPushing: false,
    });

    if (lastStep.pushedBall) {
      const { ballId, from } = lastStep.pushedBall;
      setBalls((prevBalls) =>
        prevBalls.map((b) => (b.id === ballId ? { ...b, x: from.x, y: from.y } : b))
      );
    }

    setMoves((m) => Math.max(0, m - 1));
  }, [undoStack, isAnimating, isWon, isPaused, setCanUndo, setMoves]);

  useEffect(() => {
    onRegisterUndo(handleUndo);
  }, [onRegisterUndo, handleUndo]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleMove('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleMove('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleMove('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleMove('RIGHT');
          break;
        case 'z':
        case 'Z':
        case 'u':
        case 'U':
          e.preventDefault();
          if (canUndo) {
            if (soundEnabled) soundManager.playUndo();
            handleUndo();
          }
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          if (soundEnabled) soundManager.playReset();
          initStage();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          e.preventDefault();
          if (soundEnabled) soundManager.playClick();
          togglePause();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, handleUndo, canUndo, soundEnabled, initStage, togglePause]);

  // Timer Tick
  useEffect(() => {
    if (isWon || isPaused) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isWon, isPaused, setTimerSeconds]);

  // Score submit
  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const msToSubmit = finalClearTimeMs || timerSeconds * 1000;
    const result = await submitStageScore(stage.id, playerName, moves, msToSubmit);
    setIsSubmitting(false);

    if (result.success) {
      setSubmitted(true);
      if (onScoreSubmitted) onScoreSubmitted();
    }
  };

  // Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const render = (time: number) => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, width, height);

      if (gridWalls.length === 0) {
        animFrameId = requestAnimationFrame(render);
        return;
      }

      const gridRows = gridWalls.length;
      const gridCols = gridWalls[0].length;

      const maxTileW = (width - 30) / gridCols;
      const maxTileH = (height - 30) / gridRows;
      const tileSize = Math.min(maxTileW, maxTileH, 54);

      const offsetX = (width - gridCols * tileSize) / 2;
      const offsetY = (height - gridRows * tileSize) / 2;

      // 1. Draw Floor Grid
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const x = offsetX + c * tileSize;
          const y = offsetY + r * tileSize;

          if (!gridWalls[r][c]) {
            ctx.fillStyle = '#0b1122';
            ctx.fillRect(x, y, tileSize, tileSize);

            // Floor border
            ctx.strokeStyle = 'rgba(14, 165, 233, 0.12)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, tileSize - 1, tileSize - 1);
          }
        }
      }

      // 2. Draw Walls (Classic Brick with Rich Colors from push.png & pushpush.png)
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          if (gridWalls[r][c]) {
            const x = offsetX + c * tileSize;
            const y = offsetY + r * tileSize;

            const brickGrad = ctx.createLinearGradient(x, y, x, y + tileSize);
            brickGrad.addColorStop(0, '#99281e');
            brickGrad.addColorStop(0.5, '#781c14');
            brickGrad.addColorStop(1, '#52100a');
            ctx.fillStyle = brickGrad;
            ctx.fillRect(x, y, tileSize, tileSize);

            ctx.strokeStyle = '#1e0504';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

            ctx.beginPath();
            ctx.moveTo(x, y + tileSize / 2);
            ctx.lineTo(x + tileSize, y + tileSize / 2);
            ctx.stroke();

            ctx.beginPath();
            if (r % 2 === 0) {
              ctx.moveTo(x + tileSize / 2, y);
              ctx.lineTo(x + tileSize / 2, y + tileSize / 2);
            } else {
              ctx.moveTo(x + tileSize / 2, y + tileSize / 2);
              ctx.lineTo(x + tileSize / 2, y + tileSize);
            }
            ctx.stroke();

            ctx.strokeStyle = 'rgba(14, 165, 233, 0.35)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, tileSize, tileSize);
          }
        }
      }

      // 3. Draw Targets (Yellow House from push.png & pushpush.png)
      targets.forEach((target) => {
        const x = offsetX + target.x * tileSize;
        const y = offsetY + target.y * tileSize;

        const isFilled = balls.some((b) => b.x === target.x && b.y === target.y);

        const pad = tileSize * 0.15;
        const hW = tileSize - pad * 2;
        const hH = tileSize - pad * 2;
        const roofH = hH * 0.45;

        ctx.save();

        if (isFilled) {
          ctx.shadowColor = '#00ff66';
          ctx.shadowBlur = 12;
          ctx.fillStyle = 'rgba(0, 255, 102, 0.25)';
          ctx.fillRect(x + pad, y + pad + roofH, hW, hH - roofH);
        } else {
          const pulse = Math.sin(time * 0.005) * 4 + 6;
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = pulse;
        }

        // House Body
        ctx.fillStyle = isFilled ? '#00e676' : '#ffd600';
        ctx.fillRect(x + pad + 2, y + pad + roofH, hW - 4, hH - roofH - 2);

        // House Roof
        ctx.fillStyle = isFilled ? '#69f0ae' : '#ff9100';
        ctx.beginPath();
        ctx.moveTo(x + tileSize / 2, y + pad);
        ctx.lineTo(x + tileSize - pad, y + pad + roofH);
        ctx.lineTo(x + pad, y + pad + roofH);
        ctx.closePath();
        ctx.fill();

        // Chimney
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(x + tileSize - pad - 6, y + pad + 2, 4, roofH * 0.6);

        // House Doorway
        ctx.fillStyle = '#111';
        const doorW = hW * 0.35;
        const doorH = (hH - roofH) * 0.65;
        ctx.fillRect(
          x + tileSize / 2 - doorW / 2,
          y + tileSize - pad - doorH - 2,
          doorW,
          doorH
        );

        ctx.restore();
      });

      // 4. Draw Animated / Pushed Balls
      const anim = activeAnimationsRef.current;
      balls.forEach((ball) => {
        let drawX = ball.x;
        let drawY = ball.y;

        if (anim && anim.ballId === ball.id) {
          const elapsed = performance.now() - anim.startTime;
          const progress = Math.min(1, elapsed / anim.duration);
          const easeProgress = 1 - Math.pow(1 - progress, 3);

          drawX = anim.startX + (anim.endX - anim.startX) * easeProgress;
          drawY = anim.startY + (anim.endY - anim.startY) * easeProgress;
        }

        const cx = offsetX + drawX * tileSize + tileSize / 2;
        const cy = offsetY + drawY * tileSize + tileSize / 2;
        const radius = tileSize * 0.36;

        ctx.save();
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 12;

        // 3D Spherical Radial Gradient matching push.png & pushpush.png blue balls
        const ballGrad = ctx.createRadialGradient(
          cx - radius * 0.35,
          cy - radius * 0.35,
          radius * 0.1,
          cx,
          cy,
          radius
        );
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.25, '#40c4ff');
        ballGrad.addColorStop(0.7, '#0066cc');
        ballGrad.addColorStop(1, '#002266');

        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.ellipse(
          cx - radius * 0.35,
          cy - radius * 0.35,
          radius * 0.25,
          radius * 0.15,
          -Math.PI / 4,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
      });

      // 5. Draw Player Character (Iconic PushPush Face character)
      const px = offsetX + player.x * tileSize + tileSize / 2;
      const py = offsetY + player.y * tileSize + tileSize / 2;
      const pRadius = tileSize * 0.38;

      ctx.save();
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 10;

      const playerGrad = ctx.createRadialGradient(
        px - pRadius * 0.3,
        py - pRadius * 0.3,
        pRadius * 0.1,
        px,
        py,
        pRadius
      );
      playerGrad.addColorStop(0, '#80ffea');
      playerGrad.addColorStop(0.6, '#00bfa5');
      playerGrad.addColorStop(1, '#004d40');

      ctx.fillStyle = playerGrad;
      ctx.beginPath();
      ctx.arc(px, py, pRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      let eyeDx = 0;
      let eyeDy = 0;
      if (player.dir === 'UP') eyeDy = -2.5;
      if (player.dir === 'DOWN') eyeDy = 2.5;
      if (player.dir === 'LEFT') eyeDx = -2.5;
      if (player.dir === 'RIGHT') eyeDx = 2.5;

      const eyeRadius = pRadius * 0.32;
      const eyeDist = pRadius * 0.42;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px - eyeDist, py - pRadius * 0.15, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00332c';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px + eyeDist, py - pRadius * 0.15, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0a0b10';
      ctx.beginPath();
      ctx.arc(
        px - eyeDist + eyeDx,
        py - pRadius * 0.15 + eyeDy,
        eyeRadius * 0.55,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.beginPath();
      ctx.arc(
        px + eyeDist + eyeDx,
        py - pRadius * 0.15 + eyeDy,
        eyeRadius * 0.55,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(
        px - eyeDist + eyeDx - 1.5,
        py - pRadius * 0.15 + eyeDy - 1.5,
        eyeRadius * 0.2,
        0,
        Math.PI * 2
      );
      ctx.arc(
        px + eyeDist + eyeDx - 1.5,
        py - pRadius * 0.15 + eyeDy - 1.5,
        eyeRadius * 0.2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.strokeStyle = '#00332c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (player.isPushing) {
        ctx.moveTo(px - pRadius * 0.35, py + pRadius * 0.4);
        ctx.lineTo(px + pRadius * 0.35, py + pRadius * 0.4);
      } else {
        ctx.arc(px, py + pRadius * 0.1, pRadius * 0.45, 0.2 * Math.PI, 0.8 * Math.PI);
      }
      ctx.stroke();

      ctx.restore();

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameId);
  }, [gridWalls, targets, balls, player]);

  // Dynamic canvas sizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        const size = Math.min(rect.width, 540);
        canvas.width = size;
        canvas.height = size;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scoreFormatted = (moves * 100).toString().padStart(8, '0');

  return (
    <div className="tetris-panel p-4 md:p-5 flex flex-col gap-3.5 w-full max-w-[580px]">
      {/* 1. TOP TITLE & HIGH SCORE HEADER (Matching tetris.png) */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] md:text-[11px] font-mono text-cyan-400 tracking-wider">
            ANYCALL LAND // 1999 CLASSIC
          </div>
          <h1 className="text-xl md:text-2xl font-black font-mono neon-title-pink tracking-wider">
            PUSHPUSH II
          </h1>
        </div>

        <div className="flex flex-col items-end">
          <div className="text-[10px] font-mono text-gray-400 tracking-wider">
            HIGH / SCORE
          </div>
          <div className="text-lg md:text-xl font-bold font-mono neon-text-gold tracking-widest">
            {scoreFormatted}
          </div>
        </div>
      </div>

      {/* 2. SUB-HUD DUAL SIDE-BY-SIDE BOXES (Matching tetris.png STAGE/ROUND & LINES LEFT) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="tetris-panel-inner p-2.5 flex flex-col items-center justify-center">
          <span className="text-[10px] font-mono text-cyan-400/80 tracking-wider">
            STAGE / ROUND
          </span>
          <span className="text-xl md:text-2xl font-bold font-mono text-cyan-400 tracking-wider">
            {stage.id.toString().padStart(2, '0')}
          </span>
        </div>

        <div className="tetris-panel-inner p-2.5 flex flex-col items-center justify-center">
          <span className="text-[10px] font-mono text-pink-400/80 tracking-wider">
            MOVES / PAR
          </span>
          <span className="text-xl md:text-2xl font-bold font-mono text-pink-400 tracking-wider">
            {moves.toString().padStart(2, '0')}{' '}
            <span className="text-xs text-gray-500 font-normal">/ {stage.parMoves}</span>
          </span>
        </div>
      </div>

      {/* 3. MAIN GAME BOARD CANVAS FRAME (Matching tetris.png) */}
      <div className="relative w-full aspect-square rounded-xl bg-[#060a14] border border-cyan-500/30 flex items-center justify-center overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="w-full h-full block rounded-lg"
        />

        {/* PAUSE OVERLAY BANNER */}
        {isPaused && !isWon && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
            <h2 className="text-3xl md:text-4xl font-black font-arcade neon-text-yellow tracking-widest animate-pulse">
              PAUSED
            </h2>
            <p className="text-xs text-cyan-300 font-mono mt-3">
              Press [P] or [RESUME] to continue
            </p>
          </div>
        )}

        {/* VICTORY OVERLAY MODAL */}
        {isWon && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md rounded-xl flex flex-col items-center justify-center p-5 z-30 text-center animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-cyan-400 flex items-center justify-center shadow-[0_0_25px_rgba(255,215,0,0.8)] mb-2 animate-bounce">
              <Trophy size={32} className="text-black" />
            </div>

            <h3 className="text-2xl font-black font-mono neon-text-yellow tracking-wider">
              STAGE CLEAR!
            </h3>

            <div className="flex items-center gap-2 my-3">
              {[1, 2, 3].map((starIdx) => {
                const earned =
                  (starIdx === 1 && moves > 0) ||
                  (starIdx === 2 && moves <= Math.floor(stage.parMoves * 1.5)) ||
                  (starIdx === 3 && moves <= stage.parMoves);

                return (
                  <div
                    key={starIdx}
                    className={`text-2xl ${
                      earned ? 'text-yellow-400 filter drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]' : 'text-gray-700'
                    }`}
                  >
                    ★
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 bg-white/5 border border-cyan-500/30 px-5 py-2 rounded-lg font-mono text-xs mb-3">
              <div>
                <div className="text-[10px] text-gray-400">MOVES</div>
                <div className="font-bold text-cyan-300 text-sm">
                  {moves} (Par: {stage.parMoves})
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400">TIME</div>
                <div className="font-bold text-yellow-300 text-sm">
                  {(finalClearTimeMs / 1000).toFixed(2)}s
                </div>
              </div>
            </div>

            {!submitted ? (
              <form onSubmit={handleScoreSubmit} className="flex items-center gap-2 w-full max-w-xs mb-3">
                <input
                  type="text"
                  maxLength={12}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="닉네임 입력 (최대 12자)"
                  className="flex-1 px-3 py-1.5 rounded bg-black/70 border border-pink-500/60 text-white font-mono text-xs outline-none focus:border-pink-400"
                />
                <button
                  type="submit"
                  disabled={!playerName.trim() || isSubmitting}
                  className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-xs font-mono font-bold rounded flex items-center gap-1 shadow-[0_0_10px_rgba(255,0,127,0.5)]"
                >
                  <Send size={12} />
                  <span>등록</span>
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono mb-3 bg-emerald-950/60 px-3 py-1 rounded border border-emerald-500/40">
                <Check size={13} />
                <span>리더보드에 반영되었습니다!</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (soundEnabled) soundManager.playReset();
                  initStage();
                }}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-mono text-xs font-bold rounded-lg border border-gray-600 flex items-center gap-1"
              >
                <RotateCcw size={13} />
                <span>다시 시작</span>
              </button>

              <button
                onClick={() => {
                  if (soundEnabled) soundManager.playClick();
                  onNextStage();
                }}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black rounded-lg shadow-[0_0_12px_rgba(0,255,255,0.6)] flex items-center gap-1"
              >
                <span>다음 스테이지</span>
                <ArrowRightCircle size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. BOTTOM FOOTER BAR (Matching tetris.png [RESUME] [RESTART]) */}
      <div className="flex items-center justify-between pt-1 border-t border-cyan-500/20 font-mono text-xs">
        <div className="text-gray-400 text-[11px]">
          {isPaused ? (
            <span className="text-yellow-400 font-bold">일시정지됨 (PAUSED)</span>
          ) : isWon ? (
            <span className="text-emerald-400 font-bold">STAGE CLEARED!</span>
          ) : (
            <span className="text-cyan-400">PUSHPUSH CLASSIC MODE</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (canUndo && soundEnabled) soundManager.playUndo();
              handleUndo();
            }}
            disabled={!canUndo || isPaused || isWon}
            className={`px-3 py-1 rounded text-xs font-bold font-mono border transition ${
              canUndo && !isPaused && !isWon
                ? 'btn-outline-cyan'
                : 'border-gray-800 text-gray-600 cursor-not-allowed bg-transparent'
            }`}
          >
            UNDO
          </button>

          <button
            onClick={() => {
              if (soundEnabled) soundManager.playClick();
              togglePause();
            }}
            disabled={isWon}
            className="btn-outline-cyan px-3 py-1 rounded text-xs font-bold font-mono"
          >
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>

          <button
            onClick={() => {
              if (soundEnabled) soundManager.playReset();
              initStage();
            }}
            className="btn-outline-pink px-3 py-1 rounded text-xs font-bold font-mono"
          >
            RESTART
          </button>
        </div>
      </div>

      {/* MOBILE TOUCH CONTROLS */}
      <div className="mt-2 flex flex-col items-center gap-2 md:hidden w-full">
        <div className="grid grid-cols-3 gap-2 w-full max-w-[280px]">
          <div />
          <button
            onClick={() => handleMove('UP')}
            className="h-12 bg-[#0c1426] active:bg-cyan-700/60 border border-cyan-500/50 rounded-lg flex items-center justify-center text-cyan-300 active:scale-95"
          >
            <ArrowUp size={20} />
          </button>
          <div />

          <button
            onClick={() => handleMove('LEFT')}
            className="h-12 bg-[#0c1426] active:bg-cyan-700/60 border border-cyan-500/50 rounded-lg flex items-center justify-center text-cyan-300 active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>

          <button
            onClick={() => handleMove('DOWN')}
            className="h-12 bg-[#0c1426] active:bg-cyan-700/60 border border-cyan-500/50 rounded-lg flex items-center justify-center text-cyan-300 active:scale-95"
          >
            <ArrowDown size={20} />
          </button>

          <button
            onClick={() => handleMove('RIGHT')}
            className="h-12 bg-[#0c1426] active:bg-cyan-700/60 border border-cyan-500/50 rounded-lg flex items-center justify-center text-cyan-300 active:scale-95"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
