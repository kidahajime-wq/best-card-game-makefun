// FOXFIRE BREW — the rival alchemist. Madame Bramble drafts, brews and
// gambles by the numbers: she values a card by how much it completes a
// set in her hand, brews her best set whenever it beats holding out, and
// only overbrews when she is behind — the same judgement a good player uses.
import { evaluateSet, findBrews, SUIT_KEYS } from './deck.js';

/** How much a market card is worth to a hand: set completion + potency. */
export function cardValue(card, hand) {
  if (card.fizzle) return -6;
  let value = card.potency;
  const sameSuit = hand.filter((c) => !c.fizzle && c.suit === card.suit);
  if (sameSuit.length === 1) value += 3; // completes a pair
  if (sameSuit.length === 2) value += 7; // completes a trio
  if (sameSuit.length >= 3) value += 5; // feeds an elixir
  const suitsHeld = new Set(hand.filter((c) => !c.fizzle).map((c) => c.suit));
  if (!suitsHeld.has(card.suit) && suitsHeld.size >= 2) value += 4; // prism material
  return value;
}

export function pickFromMarket(market, hand) {
  let best = market[0];
  let bestValue = -Infinity;
  for (const card of market) {
    const value = cardValue(card, hand);
    if (value > bestValue) { bestValue = value; best = card; }
  }
  return best;
}

/** The best brew she can make right now, or null. */
export function bestBrew(hand) {
  const brews = findBrews(hand);
  return brews.length ? brews[0] : null;
}

/** Overbrew only when behind: the gamble is worth it while losing. */
export function wantsOverbrew(myScore, rivalScore, hand) {
  return rivalScore - myScore >= 5 && hand.length <= 7;
}

/** A one-line taunt or grudging praise for the log. */
export function brambleQuip(kind) {
  const lines = {
    draft: ['Madame Bramble sniffs the market and takes her pick.', 'Bramble plucks a card with a gloved hand.'],
    brew: ['Bramble stirs her cauldron — a potion blooms.', 'The rival’s flask glows. She has brewed.'],
    overbrew: ['Bramble risks the overbrew…', 'Bramble throws caution into the pot.'],
    fizzle: ['POP! Bramble’s cauldron fizzles — her brew is halved!', 'A Fizzle! Bramble’s round sours.'],
    pass: ['Bramble waves a hand: nothing worth brewing.'],
  };
  const pool = lines[kind] ?? lines.pass;
  return pool[Math.floor(Math.random() * pool.length)];
}
