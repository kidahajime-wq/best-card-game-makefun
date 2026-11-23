// FOXFIRE BREW — entry point. Wires the buttons to the rules and re-renders
// after every move. `?shot=start|play|end` renders a fixed seeded scene for
// screenshots; `?seed=N` picks the deck.
import { newGame, draftCard, toggleSelect, selectedBrew, brewSelected, overbrew, endRound, aiHint } from './game.js';
import { render } from './render.js';
import { stageShot } from './shots.js';

let state = newGame(seedFromUrl());

function seedFromUrl() {
  const seed = Number(new URLSearchParams(location.search).get('seed'));
  return Number.isInteger(seed) && seed > 0 ? seed : 20261123;
}

function draw() {
  render(state, {
    onDraft: (id) => { if (draftCard(state, id)) draw(); },
    onSelect: (id) => { toggleSelect(state, id); draw(); },
    previewBrew: () => selectedBrew(state),
    hint: () => aiHint(state),
  });
}

document.getElementById('brew-btn').addEventListener('click', () => { if (brewSelected(state)) draw(); });
document.getElementById('overbrew-btn').addEventListener('click', () => { if (overbrew(state)) draw(); });
document.getElementById('end-btn').addEventListener('click', () => {
  if (state.phase === 'done') { state = newGame(seedFromUrl()); draw(); return; }
  endRound(state); draw();
});

const shot = new URLSearchParams(location.search).get('shot');
if (shot) stageShot(state, shot);
draw();
