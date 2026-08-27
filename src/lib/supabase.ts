import { createClient } from '@supabase/supabase-js';
import { LeaderboardEntry } from '../types/game';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Map game stage ID to Supabase DB stage_level (must satisfy CHECK stage_level > 0)
export function getDbStageLevel(stageId: number): number {
  if (stageId === 0) return 100; // Classic stage mapped to level 100
  if (stageId <= 0) return 1;
  return stageId;
}

// LocalStorage mock high scores database
const LOCAL_LEADERBOARD_KEY = 'pushpush_leaderboard_v2';

const INITIAL_MOCK_ENTRIES: Record<number, LeaderboardEntry[]> = {
  100: [
    { id: 'm1', name: 'RETRO_KING', stage_level: 100, moves: 8, clear_time_ms: 14200, played_at: '2026-08-20T10:00:00Z' },
    { id: 'm2', name: 'NOKIA_HERO', stage_level: 100, moves: 9, clear_time_ms: 18500, played_at: '2026-08-21T12:00:00Z' },
    { id: 'm3', name: 'CYBER_PUNK', stage_level: 100, moves: 11, clear_time_ms: 25100, played_at: '2026-08-22T14:00:00Z' },
  ],
  1: [
    { id: 'm4', name: 'SPEED_RUN', stage_level: 1, moves: 2, clear_time_ms: 3200, played_at: '2026-08-22T08:00:00Z' },
    { id: 'm5', name: 'NEON_FOX', stage_level: 1, moves: 2, clear_time_ms: 4800, played_at: '2026-08-23T09:30:00Z' },
  ],
  2: [
    { id: 'm6', name: 'GRAVITY_BOY', stage_level: 2, moves: 4, clear_time_ms: 7100, played_at: '2026-08-24T11:00:00Z' },
    { id: 'm7', name: 'ALPHA_BOT', stage_level: 2, moves: 5, clear_time_ms: 9400, played_at: '2026-08-24T15:20:00Z' },
  ],
  6: [
    { id: 'm8', name: 'ICE_SLIDER', stage_level: 6, moves: 8, clear_time_ms: 15300, played_at: '2026-08-25T16:00:00Z' },
    { id: 'm9', name: 'PUZZLE_GOD', stage_level: 6, moves: 9, clear_time_ms: 19800, played_at: '2026-08-25T18:40:00Z' },
  ],
};

function getLocalLeaderboard(): Record<number, LeaderboardEntry[]> {
  if (typeof window === 'undefined') return INITIAL_MOCK_ENTRIES;
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(INITIAL_MOCK_ENTRIES));
      return INITIAL_MOCK_ENTRIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_ENTRIES;
  }
}

function saveLocalLeaderboard(data: Record<number, LeaderboardEntry[]>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(data));
  } catch {
    // Ignore
  }
}

// Fetch Stage Leaderboard from Supabase `public.pushpush_leaderboard`
export async function fetchStageLeaderboard(stageId: number): Promise<LeaderboardEntry[]> {
  const dbStageLevel = getDbStageLevel(stageId);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('pushpush_leaderboard')
        .select('*')
        .eq('stage_level', dbStageLevel)
        .order('moves', { ascending: true })
        .order('clear_time_ms', { ascending: true })
        .order('played_at', { ascending: true })
        .limit(10);

      if (!error && data) {
        return data as LeaderboardEntry[];
      }
      if (error) {
        console.warn('Supabase query error, fallback to local:', error.message);
      }
    } catch (err) {
      console.warn('Supabase network error, fallback to local:', err);
    }
  }

  // Fallback to local storage
  const localData = getLocalLeaderboard();
  const list = localData[dbStageLevel] || [];
  return [...list].sort((a, b) => {
    if (a.moves !== b.moves) return a.moves - b.moves;
    if (a.clear_time_ms !== b.clear_time_ms) return a.clear_time_ms - b.clear_time_ms;
    return new Date(a.played_at).getTime() - new Date(b.played_at).getTime();
  });
}

// Submit Stage Score to Supabase `public.pushpush_leaderboard` with UPSERT support
export async function submitStageScore(
  stageId: number,
  playerName: string,
  moves: number,
  clearTimeMs: number
): Promise<{ success: boolean; error?: string; isBestRecord?: boolean }> {
  const dbStageLevel = getDbStageLevel(stageId);
  // VARCHAR(12) limit as defined in SQL구문.txt
  const cleanName = playerName.trim().toUpperCase().slice(0, 12) || 'ANONYMOUS';

  // 1. Submit to Supabase if available
  if (isSupabaseConfigured && supabase) {
    try {
      // Check existing record for UNIQUE (name, stage_level)
      const { data: existing, error: selectError } = await supabase
        .from('pushpush_leaderboard')
        .select('*')
        .eq('name', cleanName)
        .eq('stage_level', dbStageLevel)
        .maybeSingle();

      if (!selectError && existing) {
        // Only update if new score is better (fewer moves or same moves with faster time)
        const isBetter =
          moves < existing.moves ||
          (moves === existing.moves && clearTimeMs < existing.clear_time_ms);

        if (isBetter) {
          const { error: updateError } = await supabase
            .from('pushpush_leaderboard')
            .update({
              moves,
              clear_time_ms: clearTimeMs,
              played_at: new Date().toISOString(),
            })
            .eq('name', cleanName)
            .eq('stage_level', dbStageLevel);

          if (updateError) {
            console.warn('Supabase update warning:', updateError.message);
          }
        }
      } else {
        // Insert new entry
        const { error: insertError } = await supabase
          .from('pushpush_leaderboard')
          .insert([
            {
              name: cleanName,
              stage_level: dbStageLevel,
              moves,
              clear_time_ms: clearTimeMs,
              played_at: new Date().toISOString(),
            },
          ]);

        if (insertError) {
          console.warn('Supabase insert warning:', insertError.message);
        }
      }
    } catch (err: unknown) {
      console.warn('Supabase request error:', err);
    }
  }

  // 2. Always update local storage for offline instant sync and UNIQUE (name, stage_level) logic
  try {
    const localData = getLocalLeaderboard();
    const currentList = localData[dbStageLevel] || [];

    const existingIdx = currentList.findIndex((item) => item.name === cleanName);

    if (existingIdx !== -1) {
      const existing = currentList[existingIdx];
      const isBetter =
        moves < existing.moves ||
        (moves === existing.moves && clearTimeMs < existing.clear_time_ms);

      if (isBetter) {
        currentList[existingIdx] = {
          ...existing,
          moves,
          clear_time_ms: clearTimeMs,
          played_at: new Date().toISOString(),
        };
      }
    } else {
      const newEntry: LeaderboardEntry = {
        id: 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: cleanName,
        stage_level: dbStageLevel,
        moves,
        clear_time_ms: clearTimeMs,
        played_at: new Date().toISOString(),
      };
      currentList.push(newEntry);
    }

    currentList.sort((a, b) => {
      if (a.moves !== b.moves) return a.moves - b.moves;
      if (a.clear_time_ms !== b.clear_time_ms) return a.clear_time_ms - b.clear_time_ms;
      return new Date(a.played_at).getTime() - new Date(b.played_at).getTime();
    });

    localData[dbStageLevel] = currentList.slice(0, 20);
    saveLocalLeaderboard(localData);

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: String(err) };
  }
}
