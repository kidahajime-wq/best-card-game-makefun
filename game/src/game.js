// FOXFIRE BREW — the rules. A duel of 8 rounds against Madame Bramble.
// Each round: draft 1 of 3 market cards, then brew sets from your hand for
// points. Once per round you may Overbrew: draw 2, but a Fizzle halves the
// points you brewed this round. First to 30, or the higher score after
// round 8, takes the Golden Ladle.
import { buildDeck, evaluateSet, findBrews, mulberry32, shuffle, HAND_LIMIT } from './deck.js';
import { bestBrew, pickFromMarket, wantsOverbrew } from './ai.js';

export const TOTAL_ROUNDS = 8;
export const TARGET_SCORE = 30;

export function newGame(seed = 20261123) {
  const rng = mulberry32(seed);
  const deck = buildDeck(rng);
  const state = {
    seed,
    round: 1,
    phase: 'draft', // draft | brew | over | done
    deck,
    market: [],
    you: { hand: [], shelf: [], score: 0, roundPoints: 0, overbrewed: false },
    foe: { hand: [], shelf: [], score: 0, roundPoints: 0, overbrewed: false },
    log: [],
    banner: null,
    winner: null,
    selected: [],
    brewedThisRound: false,
  };
  for (let i = 0; i < 5; i += 1) {
    state.you.hand.push(deck.pop());
    state.foe.hand.push(deck.pop());
  }
  dealMarket(state);
  log(state, 'The duel begins. First to ' + TARGET_SCORE + ' — or the best of ' + TOTAL_ROUNDS + ' rounds.');
  return state;
}

export function log(state, text) {
  state.log.unshift(text);
  if (state.log.length > 14) state.log.length = 14;
}

function dealMarket(state) {
  while (state.market.length < 3 && state.deck.length) state.market.push(state.deck.pop());
}

export function draftCard(state, cardId) {
  if (state.phase !== 'draft') return false;
  const card = state.market.find((c) => c.id === cardId);
  if (!card) return false;
  state.market = state.market.filter((c) => c.id !== cardId);
  state.you.hand.push(card);
  log(state, 'You draft ' + describe(card) + '.');
  // Bramble drafts from what is left.
  const foePick = pickFromMarket(state.market, state.foe.hand);
  state.market = state.market.filter((c) => c.id !== foePick.id);
  state.foe.hand.push(foePick);
  log(state, 'Bramble drafts ' + describe(foePick) + '.');
  state.market = state.market.filter((c) => !c.fizzle);
  if (state.market.length) log(state, 'The last market card is discarded.');
  state.phase = 'brew';
  return true;
}

export function describe(card) {
  if (card.fizzle) return 'a FIZZLE';
  const names = { ember: 'Ember', frost: 'Frost', bloom: 'Bloom', spark: 'Spark' };
  return names[card.suit] + ' ' + card.potency;
}

export function toggleSelect(state, cardId) {
  const at = state.selected.indexOf(cardId);
  if (at >= 0) state.selected.splice(at, 1);
  else if (state.selected.length < 4) state.selected.push(cardId);
}

export function selectedBrew(state) {
  const cards = state.selected.map((id) => state.you.hand.find((c) => c.id === id)).filter(Boolean);
  return evaluateSet(cards);
}

export function brewSelected(state) {
  if (state.phase !== 'brew' && state.phase !== 'over') return false;
  if (state.brewedThisRound) return false;
  const result = selectedBrew(state);
  if (!result) return false;
  const cards = state.selected.map((id) => state.you.hand.find((c) => c.id === id)).filter(Boolean);
  state.brewedThisRound = true;
  return applyBrew(state, state.you, cards, result, 'You brew');
}

function applyBrew(state, player, cards, result, who) {
  const used = new Set(cards.map((c) => c.id));
  player.hand = player.hand.filter((c) => !used.has(c.id));
  player.shelf.push({ cards, name: result.name, points: result.points });
  player.score += result.points;
  player.roundPoints += result.points;
  state.banner = { text: result.name + ' +' + result.points, kind: result.kind };
  log(state, who + ' ' + result.name + ' for +' + result.points + '!');
  state.selected = [];
  return true;
}

/** Push your luck: draw 2; a Fizzle halves this round's brewed points. */
export function overbrew(state) {
  if (state.phase !== 'brew' || state.you.overbrewed) return false;
  state.you.overbrewed = true;
  state.phase = 'over';
  const drawn = [];
  for (let i = 0; i < 2 && state.deck.length; i += 1) drawn.push(state.deck.pop());
  const fizzle = drawn.find((c) => c.fizzle);
  const kept = drawn.filter((c) => !c.fizzle);
  state.you.hand.push(...kept);
  if (state.you.hand.length > HAND_LIMIT) {
    state.you.hand = state.you.hand.slice(0, HAND_LIMIT);
    log(state, 'Hand limit — the extra spills over the table.');
  }
  if (fizzle) {
    const lost = Math.floor(state.you.roundPoints / 2);
    state.you.score -= lost;
    state.you.roundPoints -= lost;
    state.banner = { text: 'FIZZLE! −' + lost, kind: 'fizzle' };
    log(state, 'POP! A Fizzle card — your round brews are halved (−' + lost + ').');
  } else {
    log(state, 'Overbrew! You draw ' + drawn.map(describe).join(' and ') + ' — no Fizzle.');
  }
  return true;
}

/** Bramble plays her whole turn: one brew, maybe an overbrew, then the round ends. */
export function foeTurn(state) {
  const brew = bestBrew(state.foe.hand);
  if (brew && brew.eval.points >= 6) applyBrew(state, state.foe, brew.cards, brew.eval, 'Bramble brews');
  else log(state, 'Bramble holds her cards — nothing strong enough to brew.');
  if (wantsOverbrew(state.foe.score, state.you.score, state.foe.hand) && state.deck.length >= 2) {
    state.foe.overbrewed = true;
    const drawn = [state.deck.pop(), state.deck.pop()];
    const fizzle = drawn.find((c) => c.fizzle);
    state.foe.hand.push(...drawn.filter((c) => !c.fizzle));
    if (fizzle) {
      const lost = Math.floor(state.foe.roundPoints / 2);
      state.foe.score -= lost;
      state.foe.roundPoints -= lost;
      log(state, 'POP! Bramble overbrews into a Fizzle — her round brews halve (−' + lost + ').');
    } else {
      log(state, 'Bramble overbrews and draws ' + drawn.map(describe).join(' and ') + '.');
    }
  }
}

export function endRound(state) {
  if (state.phase === 'done') return;
  foeTurn(state);
  state.you.roundPoints = 0;
  state.foe.roundPoints = 0;
  state.you.overbrewed = false;
  state.foe.overbrewed = false;
  state.brewedThisRound = false;
  state.selected = [];
  if (state.you.score >= TARGET_SCORE || state.foe.score >= TARGET_SCORE || state.round >= TOTAL_ROUNDS) {
    state.phase = 'done';
    state.winner = state.you.score === state.foe.score ? 'draw'
      : state.you.score > state.foe.score ? 'you' : 'foe';
    state.banner = state.winner === 'you'
      ? { text: 'YOU TAKE THE GOLDEN LADLE!', kind: 'win' }
      : state.winner === 'foe'
        ? { text: 'BRAMBLE TAKES THE LADLE…', kind: 'lose' }
        : { text: 'A DEAD HEAT!', kind: 'win' };
    log(state, state.winner === 'you' ? 'Victory! The Golden Ladle is yours.'
      : state.winner === 'foe' ? 'Bramble wins the duel.' : 'A draw — the ladle is shared.');
    return;
  }
  state.round += 1;
  state.phase = 'draft';
  dealMarket(state);
  if (!state.market.length) {
    // Deck exhausted: no draft this round, brew with what you have.
    state.phase = 'brew';
    log(state, 'The deck is spent — no market this round. Brew with your hand.');
  }
  log(state, '— Round ' + state.round + ' —');
}

export function aiHint(state) {
  const brews = findBrews(state.you.hand);
  if (!brews.length) return 'No brew yet — draft toward a pair, a trio, or a prism.';
  const top = brews[0];
  return 'Best brew: ' + top.eval.name + ' (+' + top.eval.points + ') — select those cards.';
}
