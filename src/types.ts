export type Difficulty = 'easy' | 'medium' | 'hard' | 'god';

export interface Question {
  id: number;
  type: 'capital' | 'flag' | 'fact';
  question: string;
  options: string[];
  correctAnswer: string;
  country: string;
  difficulty: Difficulty;
}

export interface SportQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: Difficulty;
}

export interface GameStats {
  score: number;
  totalQuestions: number;
  streak: number;
  bestStreak: number;
}

export interface HighScore {
  score: number;
  totalQuestions: number;
  percentage: number;
  date: string;
  difficulty?: Difficulty;
}

export interface EndlessHighScore {
  streak: number;
  date: string;
  difficulty?: Difficulty;
}
