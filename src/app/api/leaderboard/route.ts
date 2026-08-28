import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

// GET: Fetch Stage Leaderboard
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stageLevelStr = searchParams.get('stage_level');
  const stageLevel = stageLevelStr ? parseInt(stageLevelStr, 10) : 1;

  if (isNaN(stageLevel) || stageLevel <= 0) {
    return NextResponse.json(
      { success: false, error: 'Invalid stage_level parameter' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  if (!supabase || !isServerSupabaseConfigured) {
    return NextResponse.json({
      success: true,
      data: [],
      isConfigured: false,
      message: 'Supabase is not configured on the server.',
    });
  }

  try {
    const { data, error } = await supabase
      .from('pushpush_leaderboard')
      .select('*')
      .eq('stage_level', stageLevel)
      .order('moves', { ascending: true })
      .order('clear_time_ms', { ascending: true })
      .order('played_at', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Supabase query error:', error.message);
      return NextResponse.json(
        { success: false, error: error.message, isConfigured: true },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      isConfigured: true,
    });
  } catch (err: unknown) {
    console.error('Supabase server error:', err);
    return NextResponse.json(
      { success: false, error: String(err), isConfigured: true },
      { status: 500 }
    );
  }
}

// POST: Submit or Update Stage Score
export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();

  if (!supabase || !isServerSupabaseConfigured) {
    return NextResponse.json({
      success: false,
      error: 'Supabase is not configured on the server.',
      isConfigured: false,
    });
  }

  try {
    const body = await request.json();
    const { name, stage_level, moves, clear_time_ms } = body;

    const cleanName = (typeof name === 'string' ? name.trim().toUpperCase().slice(0, 12) : '') || 'ANONYMOUS';
    const stageLevelNum = parseInt(stage_level, 10);
    const movesNum = parseInt(moves, 10);
    const clearTimeMsNum = parseInt(clear_time_ms, 10);

    // Validation matching DB CHECK constraints
    if (isNaN(stageLevelNum) || stageLevelNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'stage_level must be greater than 0' },
        { status: 400 }
      );
    }
    if (isNaN(movesNum) || movesNum < 0) {
      return NextResponse.json(
        { success: false, error: 'moves must be 0 or greater' },
        { status: 400 }
      );
    }
    if (isNaN(clearTimeMsNum) || clearTimeMsNum < 0) {
      return NextResponse.json(
        { success: false, error: 'clear_time_ms must be 0 or greater' },
        { status: 400 }
      );
    }

    // 1. Check existing record for UNIQUE (name, stage_level)
    const { data: existing, error: selectError } = await supabase
      .from('pushpush_leaderboard')
      .select('id, moves, clear_time_ms')
      .eq('name', cleanName)
      .eq('stage_level', stageLevelNum)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Supabase select error:', selectError.message);
      return NextResponse.json({ success: false, error: selectError.message }, { status: 500 });
    }

    if (existing) {
      // Check if new score is strictly better (fewer moves OR same moves with faster time)
      const isBetter =
        movesNum < existing.moves ||
        (movesNum === existing.moves && clearTimeMsNum < existing.clear_time_ms);

      if (isBetter) {
        const { error: updateError } = await supabase
          .from('pushpush_leaderboard')
          .update({
            moves: movesNum,
            clear_time_ms: clearTimeMsNum,
            played_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Supabase update error:', updateError.message);
          return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          isBestRecord: true,
          action: 'updated',
          message: '새로운 최고 기록으로 갱신되었습니다!',
        });
      } else {
        return NextResponse.json({
          success: true,
          isBestRecord: false,
          action: 'kept_existing',
          message: '기존 최고 기록이 유지되었습니다.',
        });
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('pushpush_leaderboard')
        .insert([
          {
            name: cleanName,
            stage_level: stageLevelNum,
            moves: movesNum,
            clear_time_ms: clearTimeMsNum,
            played_at: new Date().toISOString(),
          },
        ]);

      if (insertError) {
        console.error('Supabase insert error:', insertError.message);
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        isBestRecord: true,
        action: 'inserted',
        message: '랭킹에 성공적으로 등록되었습니다!',
      });
    }
  } catch (err: unknown) {
    console.error('API Handler error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
