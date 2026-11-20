# Chowkabhara

Build a web game called "Chowka Bhara", a Ludo-style board game for 2 to 4 players on one device (pass and play). Use React, TypeScript and Tailwind. It must work well on mobile.

BOARD

- A 5x5 grid of square cells with a hand-drawn look: thick brown lines on a warm yellow board.

- 5 safe squares marked with a large X: the middle cell of each side (top, bottom, left, right) and the centre cell. Pawns on a safe square can never be captured.

- Each player starts from the middle cell of their own side.

- Path: pawns move anticlockwise around the 16 outer cells, then through the 8 inner-ring cells, and finish in the centre cell.

PLAYERS

- 2 to 4 players, 4 pawns each, in Red, Blue, White and Green.

- Each player has a home tray beside the board that shows their waiting pawns and how many have finished.

DICE

- Four shells are thrown. The roll equals the number of shells landing face up (1 to 4). If none land face up, the roll is 8.

- Show the 4 shells with a short throw animation and a "Roll shells" button.

- A roll of 4 or 8 gives an extra turn and is needed to bring a pawn out of home. [change if different]

RULES

- Tap a highlighted pawn to move it by the rolled number.

- Landing on an opponent's pawn on a non-safe cell sends it back home and gives the capturer an extra turn.

- A player must capture at least once before entering the inner ring. [change if different]

- A pawn needs an exact roll to reach the centre.

- If no move is possible, the turn passes automatically.

- The first player to bring all 4 pawns to the centre wins. Show a winner screen with a "Play again" button.

UI

- Show whose turn it is, the last roll, and a short message line (for example "Red captured a pawn!").

- Only legal pawns are highlighted and tappable. If only one move is possible, make it automatically.

- Add a "New game" setup screen where the player chooses 2, 3 or 4 players.

- Add a "How to play" popup.

- Keep the design clean, colourful and touch-friendly, with sound effects on roll, move and capture, and a mute toggle.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://chowkabhara.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1e46e3fe-6262-5799-be4b-f9df2cf97e49).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
