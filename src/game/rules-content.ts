export const RULES: [string, string][] = [
  ["Throw the shells", "Four cowrie shells are thrown. Your roll is how many land mouth-up (1–4). None up scores 8."],
  ["Get out of home", "A 4 or an 8 brings a pawn out of your home bay onto your start square. A 4 or 8 also gives you another throw."],
  ["Race around", "Pawns travel anticlockwise around the 16 outer squares, then through the 8 inner squares to the centre."],
  ["Capture", "Land on an opponent on a plain square to send them home — and throw again. Squares marked X are safe."],
  ["Unlock the inner ring", "You must capture at least once before any of your pawns can enter the inner ring."],
  ["Finish exactly", "You need the exact number to reach the centre. If you can't move, your turn passes."],
  ["Win", "The first player to bring all four pawns to the centre wins."],
];

export const CONTROLS: [string, string][] = [
  ["Roll", "Tap “Roll shells” (or press Space) when it's your turn."],
  ["Move", "Pawns that can use your roll glow. Tap one and it walks there square by square."],
  ["One choice?", "If only one pawn can move, it moves by itself. You can switch this off in Settings."],
  ["Pause", "The pause button stops the clock and the game. Your progress is saved on this device."],
];
