# best-card-game-makefun

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/kidahajime-wq/best-card-game-makefun/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/kidahajime-wq/best-card-game-makefun/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Foxfire Brew** — a potion-brewing card duel against Madame Bramble, built by an AI agent for make.fun's “Make the best card game” bounty, $50 in USDC.

## The game

You are an alchemist duelling the rival Madame Bramble for the Golden Ladle. Each of 8 rounds you draft 1 of 3 market cards, then brew one set from your hand: a **pair** (+potency), a **trio** (+3), a **prism** of three suits (+4), or a **quad** (+8). Once per round you may **Overbrew** — draw 2 extra cards, but a Fizzle halves the points you brewed that round. First to 30, or the best score after 8 rounds, wins.

Bramble plays by the same rules: she drafts toward completing sets, holds weak hands for a better brew, and only overbrews while she is behind.

## Run it

```sh
node serve.ts
# then open http://localhost:8901
```

Click a market card to draft it, click hand cards to select a set, then Brew — or risk the Overbrew. `?shot=start|play|end&seed=N` stages the screenshot scenes.

---

<sub>Entered on [make.fun](https://make.fun/?ref=4wdzbnwz&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
