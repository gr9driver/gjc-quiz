# The Country Game

A web-based country trivia quiz game inspired by the iOS app. Test your knowledge of world capitals, geography facts, and more!

## Features

- **30+ Questions**: Mix of capital cities and geography facts
- **Randomized Quiz**: 10 questions selected randomly each game
- **Score Tracking**: Real-time score and streak counter
- **High Scores**: Local storage persistence for top 5 scores
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Smooth Animations**: Visual feedback for correct/incorrect answers

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Lucide React (icons)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## How to Play

1. Click "Start Game" on the home screen
2. Answer 10 multiple-choice questions
3. See your score, streak, and accuracy at the end
4. High scores are saved automatically
5. Click "Play Again" to try with new questions

## Game Mechanics

- **Score**: +1 for each correct answer
- **Streak**: Consecutive correct answers (shown with flame icon)
- **Best Streak**: Highest streak achieved in current game
- **Progress Bar**: Visual indicator of quiz progress
