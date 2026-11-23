// FOXFIRE BREW — the table. Renders the whole duel into the DOM: the
// rival's row, the market, your shelf of brewed potions, your hand, the
// scoreboard, the log and the combo banner. Cards are plain DOM, no images.
import { SUITS } from './deck.js';
import { TOTAL_ROUNDS, TARGET_SCORE, describe } from './game.js';

const $ = (id) => document.getElementById(id);

export function cardEl(card, opts = {}) {
  const el = document.createElement('div');
  el.className = 'card' + (card.fizzle ? ' fizzle' : ' suit-' + card.suit)
    + (opts.selected ? ' selected' : '') + (opts.back ? ' back' : '') + (opts.small ? ' small' : '');
  if (opts.back) {
    el.innerHTML = '<div class="card-back-glyph">✦</div><div class="card-back-word">FOXFIRE</div>';
    return el;
  }
  if (card.fizzle) {
    el.innerHTML = '<div class="card-glyph">☠</div><div class="card-name">FIZZLE</div>'
      + '<div class="card-blurb">spoils an overbrew</div>';
  } else {
    const suit = SUITS[card.suit];
    el.innerHTML = '<div class="card-glyph">' + suit.glyph + '</div>'
      + '<div class="card-name">' + suit.name + '</div>'
      + '<div class="card-potency">' + '●'.repeat(card.potency) + '○'.repeat(3 - card.potency) + '</div>'
      + '<div class="card-blurb">' + suit.blurb + '</div>';
  }
  if (opts.onClick) el.addEventListener('click', () => opts.onClick(card));
  return el;
}

function shelfEl(shelf) {
  const wrap = document.createElement('div');
  wrap.className = 'shelf';
  if (!shelf.length) {
    wrap.innerHTML = '<div class="shelf-empty">No potions brewed yet — sets of 2, 3 or 4 score.</div>';
    return wrap;
  }
  for (const potion of shelf) {
    const flask = document.createElement('div');
    flask.className = 'flask';
    flask.title = potion.name;
    const dots = potion.cards.map((c) => '<span class="dot suit-' + (c.fizzle ? 'fizzle' : c.suit) + '"></span>').join('');
    flask.innerHTML = '<div class="flask-dots">' + dots + '</div>'
      + '<div class="flask-name">' + potion.name + '</div>'
      + '<div class="flask-points">+' + potion.points + '</div>';
    wrap.appendChild(flask);
  }
  return wrap;
}

export function render(state, handlers) {
  $('round-label').textContent = 'Round ' + Math.min(state.round, TOTAL_ROUNDS) + ' / ' + TOTAL_ROUNDS;
  $('target-label').textContent = 'First to ' + TARGET_SCORE;
  $('you-score').textContent = state.you.score;
  $('foe-score').textContent = state.foe.score;
  $('deck-count').textContent = state.deck.length + ' left in the deck';

  const foeHand = $('foe-hand');
  foeHand.replaceChildren();
  for (let i = 0; i < state.foe.hand.length; i += 1) foeHand.appendChild(cardEl({}, { back: true, small: true }));

  $('foe-shelf').replaceChildren(shelfEl(state.foe.shelf));
  $('you-shelf').replaceChildren(shelfEl(state.you.shelf));

  const market = $('market');
  market.replaceChildren();
  for (const card of state.market) {
    const wrap = cardEl(card, {
      onClick: state.phase === 'draft' ? () => handlers.onDraft(card.id) : null,
    });
    if (state.phase === 'draft') wrap.classList.add('pickable');
    market.appendChild(wrap);
  }
  if (!state.market.length && state.phase === 'draft') {
    market.innerHTML = '<div class="shelf-empty">The market is empty.</div>';
  }

  const hand = $('you-hand');
  hand.replaceChildren();
  for (const card of state.you.hand) {
    hand.appendChild(cardEl(card, {
      selected: state.selected.includes(card.id),
      onClick: state.phase === 'brew' || state.phase === 'over' ? () => handlers.onSelect(card.id) : null,
    }));
  }

  $('phase-label').textContent =
    state.phase === 'draft' ? 'DRAFT — pick a card from the market'
    : state.phase === 'brew' ? 'BREW — select a set, then brew it (or overbrew!)'
    : state.phase === 'over' ? 'BREW — overbrew spent; brew what you can, then end the round'
    : state.winner === 'you' ? 'YOU WIN — the Golden Ladle is yours!'
    : state.winner === 'foe' ? 'BRAMBLE WINS — demand a rematch!'
    : 'A DEAD HEAT';

  const brewBtn = $('brew-btn');
  const brew = state.selected.length >= 2 ? handlers.previewBrew() : null;
  brewBtn.disabled = !brew || state.brewedThisRound;
  brewBtn.textContent = brew ? 'Brew ' + brew.name + ' (+' + brew.points + ')' : 'Brew selected set';
  $('overbrew-btn').disabled = state.phase !== 'brew' || state.you.overbrewed;
  $('end-btn').disabled = state.phase === 'draft' || state.phase === 'done';
  $('end-btn').textContent = state.phase === 'done' ? 'Play again' : 'End round';
  $('hint').textContent = state.phase === 'done' ? '' : handlers.hint();

  const logEl = $('log');
  logEl.replaceChildren();
  for (const line of state.log) {
    const li = document.createElement('li');
    li.textContent = line;
    logEl.appendChild(li);
  }

  const banner = $('banner');
  if (state.banner) {
    banner.textContent = state.banner.text;
    banner.className = 'banner show ' + state.banner.kind;
  } else {
    banner.className = 'banner';
  }
  document.body.classList.toggle('game-over', state.phase === 'done');
}
