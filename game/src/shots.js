// FOXFIRE BREW — screenshot scenes. Each one plays the real rules forward
// from a fresh seeded game with a simple autopilot, so every frame is what a
// real game looks like and the same seed always gives the same frame.
//   ?shot=start — the title table, fresh duel, market dealt.
//   ?shot=play  — mid-duel: both sides have brewed, hands are full, a combo
//                 banner is up and the log tells the story.
//   ?shot=end   — the duel is over and the Golden Ladle is decided.
import { draftCard, endRound, overbrew, brewSelected, toggleSelect } from './game.js';
import { findBrews as deckFindBrews } from './deck.js';
import { pickFromMarket } from './ai.js';

/** Autopilot: draft the best-value market card, brew only a strong set
 *  (holding weak pairs for a better brew later), overbrew when behind. */
function playRound(state) {
  const pick = pickFromMarket(state.market, state.you.hand);
  draftCard(state, pick.id);
  const brews = deckFindBrews(state.you.hand);
  if (brews.length && brews[0].eval.points >= 8) {
    for (const card of brews[0].cards) toggleSelect(state, card.id);
    brewSelected(state);
  }
  if (state.you.score < state.foe.score) overbrew(state);
  endRound(state);
}

export function stageShot(state, shot) {
  if (shot === 'start') return; // fresh table, market dealt
  if (shot === 'play') {
    for (let i = 0; i < 3; i += 1) playRound(state);
    // Leave a fresh draft on the table with a tempting market.
    return;
  }
  if (shot === 'end') {
    for (let i = 0; i < 8 && state.phase !== 'done'; i += 1) playRound(state);
    return;
  }
}
