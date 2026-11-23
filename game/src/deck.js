// FOXFIRE BREW — the deck. Four alchemical suits, each with its own
// colour, glyph and flavour. A card is { id, suit, potency, fizzle }.
// Potency 1-3 feeds brew scores; Fizzle cards are the push-your-luck risk.
export const SUITS = {
  ember: { name: 'Ember', glyph: '▲', color: '#ff6b4a', dark: '#7a2413', blurb: 'dragon-pepper heat' },
  frost: { name: 'Frost', glyph: '❄', color: '#5fd4e6', dark: '#0f4a56', blurb: 'glacier-mint chill' },
  bloom: { name: 'Bloom', glyph: '✿', color: '#7ed957', dark: '#1e4d12', blurb: 'moonpetal sap' },
  spark: { name: 'Spark', glyph: '✦', color: '#c78bff', dark: '#3d1a66', blurb: 'storm-glass static' },
};

export const SUIT_KEYS = Object.keys(SUITS);
export const FIZZLE_COUNT = 4;
export const HAND_LIMIT = 9;

/** Deterministic RNG (mulberry32) so screenshots and tests replay exactly. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(deck, rng) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

let nextId = 1;

/** Build a fresh 52-card deck: 4 suits x potency 1..3 (4 copies each) + 4 Fizzles. */
export function buildDeck(rng) {
  const deck = [];
  for (const suit of SUIT_KEYS) {
    for (let potency = 1; potency <= 3; potency += 1) {
      for (let copy = 0; copy < 4; copy += 1) {
        deck.push({ id: nextId, suit, potency, fizzle: false });
        nextId += 1;
      }
    }
  }
  for (let i = 0; i < FIZZLE_COUNT; i += 1) {
    deck.push({ id: nextId, suit: 'fizzle', potency: 0, fizzle: true });
    nextId += 1;
  }
  return shuffle(deck, rng);
}

/** Brew scoring: what a set of cards is worth, and what it is called. */
export function evaluateSet(cards) {
  if (!cards || cards.length < 2) return null;
  if (cards.some((c) => c.fizzle)) return null;
  const suits = new Set(cards.map((c) => c.suit));
  const potency = cards.reduce((s, c) => s + c.potency, 0);
  if (cards.length === 2 && suits.size === 1) {
    return { kind: 'pair', name: 'Minor Potion', points: potency, bonus: 0 };
  }
  if (cards.length === 3 && suits.size === 1) {
    return { kind: 'trio', name: 'TRIPLE ' + SUITS[cards[0].suit].name.toUpperCase() + '!', points: potency + 3, bonus: 3 };
  }
  if (cards.length === 3 && suits.size === 3) {
    return { kind: 'prism', name: 'PRISM BREW!', points: potency + 4, bonus: 4 };
  }
  if (cards.length === 4 && suits.size === 1) {
    return { kind: 'quad', name: 'FOXFIRE ELIXIR!', points: potency + 8, bonus: 8 };
  }
  return null;
}

/** All brewable sets in a hand, best first. */
export function findBrews(hand) {
  const found = [];
  const bySuit = {};
  for (const card of hand) {
    if (card.fizzle) continue;
    (bySuit[card.suit] ??= []).push(card);
  }
  for (const suit of SUIT_KEYS) {
    const cards = [...(bySuit[suit] ?? [])].sort((a, b) => b.potency - a.potency);
    if (cards.length >= 4) found.push({ cards: cards.slice(0, 4), eval: evaluateSet(cards.slice(0, 4)) });
    if (cards.length >= 3) found.push({ cards: cards.slice(0, 3), eval: evaluateSet(cards.slice(0, 3)) });
    if (cards.length >= 2) found.push({ cards: cards.slice(0, 2), eval: evaluateSet(cards.slice(0, 2)) });
  }
  // Prisms: one card of each of three different suits, strongest potencies.
  const best = SUIT_KEYS.map((s) => (bySuit[s] ?? []).slice().sort((a, b) => b.potency - a.potency)[0]).filter(Boolean);
  if (best.length >= 3) {
    const trio = [...best].sort((a, b) => b.potency - a.potency).slice(0, 3);
    found.push({ cards: trio, eval: evaluateSet(trio) });
  }
  return found.sort((a, b) => b.eval.points - a.eval.points);
}
