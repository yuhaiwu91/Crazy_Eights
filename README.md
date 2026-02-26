# Bela'Crazy Eights 🃏

A browser-based card game built with React + TypeScript + Tailwind CSS, deployed on Vercel.

## Live Demo

> Deploy via Vercel and paste your URL here.

## Gameplay

Crazy Eights is a shedding-type card game. Be the first to play all your cards to win.

**Rules:**
- Each player starts with 8 cards
- On your turn, play a card that matches the **suit** or **value** of the top discard
- **8s are wild** — play any 8 to change the current suit
- If you can't play, draw from the deck
- First to empty their hand wins

## Tech Stack

| | |
|---|---|
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS (CDN) |
| Icons | lucide-react |
| Build | Create React App |
| Deploy | Vercel |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Production build
npm run build
```

## Project Structure

```
src/
└── App.tsx       # All game logic and UI
public/
└── index.html    # HTML entry point
```

## License

MIT
