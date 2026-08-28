'use client';

import React from 'react';
import { Music, Volume2, VolumeX, Edit3, Database, Tv } from 'lucide-react';
import { soundManager } from '../utils/sound';
import { getIsSupabaseConnected } from '../lib/supabase';

interface HeaderProps {
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  bgmEnabled: boolean;
  setBgmEnabled: (val: boolean) => void;
  crtEnabled: boolean;
  setCrtEnabled: (val: boolean) => void;
  onOpenEditor: () => void;
  onOpenSupabaseModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  soundEnabled,
  setSoundEnabled,
  bgmEnabled,
  setBgmEnabled,
  crtEnabled,
  setCrtEnabled,
  onOpenEditor,
  onOpenSupabaseModal,
}) => {
  const handleToggleBgm = () => {
    const next = !bgmEnabled;
    setBgmEnabled(next);
    soundManager.setBgmEnabled(next);
    if (soundEnabled) soundManager.playClick();
  };

  const handleToggleSfx = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setSoundEnabled(next);
    if (next) soundManager.playClick();
  };

  const handleMuteAll = () => {
    const next = !(!soundEnabled && !bgmEnabled);
    if (next) {
      // Mute everything
      setSoundEnabled(false);
      setBgmEnabled(false);
      soundManager.setSoundEnabled(false);
      soundManager.setBgmEnabled(false);
    } else {
      // Unmute sound
      setSoundEnabled(true);
      soundManager.setSoundEnabled(true);
      soundManager.playClick();
    }
  };

  const isMutedAll = !soundEnabled && !bgmEnabled;

  return (
    <header className="w-full max-w-7xl mx-auto px-4 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3 z-30">
      {/* Left Quick Navigation / Tools */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (soundEnabled) soundManager.playClick();
            onOpenEditor();
          }}
          className="audio-pill hover:scale-105"
          title="맵 에디터 & AI 생성기"
        >
          <Edit3 size={13} className="text-pink-400" />
          <span className="text-[11px] text-pink-300 font-mono font-bold">STAGE EDITOR</span>
        </button>

        <button
          onClick={() => {
            if (soundEnabled) soundManager.playClick();
            onOpenSupabaseModal();
          }}
          className="audio-pill hover:scale-105"
          title="Supabase 데이터베이스 연동"
        >
          <Database
            size={13}
            className={getIsSupabaseConnected() ? 'text-emerald-400' : 'text-amber-400'}
          />
          <span
            className={`text-[11px] font-mono font-bold ${
              getIsSupabaseConnected() ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            {getIsSupabaseConnected() ? 'DB CONNECTED' : 'LOCAL DB'}
          </span>
        </button>

        <button
          onClick={() => {
            if (soundEnabled) soundManager.playClick();
            setCrtEnabled(!crtEnabled);
          }}
          className={`audio-pill ${crtEnabled ? 'active' : ''}`}
          title="CRT 모니터 스캔라인 필터"
        >
          <Tv size={13} />
          <span className="text-[11px]">CRT {crtEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Right Top Audio Pill Controls matching tetris.png */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleBgm}
          className={`audio-pill ${bgmEnabled ? 'active' : ''}`}
        >
          <Music size={12} />
          <span>BGM {bgmEnabled ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={handleToggleSfx}
          className={`audio-pill ${soundEnabled ? 'active' : ''}`}
        >
          <Volume2 size={12} />
          <span>SFX {soundEnabled ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={handleMuteAll}
          className={`audio-pill ${isMutedAll ? 'active !border-red-500/60 !text-red-400' : ''}`}
        >
          <VolumeX size={12} />
          <span>MUTE ALL</span>
        </button>
      </div>
    </header>
  );
};
