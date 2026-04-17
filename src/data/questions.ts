import { Question, Difficulty } from '../types';
import { easyQuestions } from './questions-easy';
import { mediumQuestions } from './questions-medium';
import { hardQuestions } from './questions-hard';
import { godQuestions } from './questions-god';

export const allQuestions: Question[] = [
  ...easyQuestions,
  ...mediumQuestions,
  ...hardQuestions,
  ...godQuestions,
];

export const questions = allQuestions;

export function getQuestionsByDifficulty(difficulty: Difficulty): Question[] {
  return allQuestions.filter(q => q.difficulty === difficulty);
}

export function shuffleQuestions(count: number = 10, difficulty?: Difficulty): Question[] {
  const pool = difficulty ? getQuestionsByDifficulty(difficulty) : allQuestions;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

export function getRandomQuestion(exclude?: number, difficulty?: Difficulty): Question {
  const pool = difficulty ? getQuestionsByDifficulty(difficulty) : allQuestions;
  const filtered = exclude !== undefined ? pool.filter(q => q.id !== exclude) : pool;
  return filtered[Math.floor(Math.random() * filtered.length)];
}
