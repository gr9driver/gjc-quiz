import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://etucqhbcxnsnylyuhged.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZMv1RFjG2qPu97YxCzVcxA_2Kg_PBN2';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface LeaderboardEntry {
  id?: string;
  name: string;
  score: number;
  total?: number;
  percentage?: number;
  streak?: number;
  weighted_score?: number;
  mode: 'classic' | 'endless';
  difficulty: string;
  game: string;
  created_at?: string;
}

const DIFFICULTY_WEIGHTS: Record<string, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  god: 4,
};

export function calcWeightedScore(score: number, difficulty: string): number {
  return score * (DIFFICULTY_WEIGHTS[difficulty] ?? 1);
}

export async function submitScore(entry: LeaderboardEntry): Promise<boolean> {
  const { error } = await supabase.from('leaderboard').insert([entry]);
  if (error) console.error('Supabase insert error:', error);
  return !error;
}

export async function fetchLeaderboard(game: string, mode: 'classic' | 'endless', limit = 10): Promise<LeaderboardEntry[]> {
  const secondaryCol = mode === 'classic' ? 'percentage' : 'streak';
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('game', game)
    .eq('mode', mode)
    .order('weighted_score', { ascending: false, nullsFirst: false })
    .order(secondaryCol, { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) { console.error('Supabase fetch error:', error); return []; }
  return data ?? [];
}
