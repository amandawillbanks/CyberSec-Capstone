// src/sim/aiAgent.js
// Tabular Q-learning agent for CyberSec Ops Center.
// No React dependencies — pure JS class.

const ALPHA         = 0.4;   // learning rate
const GAMMA         = 0.85;  // discount factor
const EPSILON_START = 0.9;   // initial exploration rate
const EPSILON_MIN   = 0.05;  // floor
const EPSILON_DECAY = 0.97;  // per-episode multiplier

const STORAGE_KEY = "cyberCapstoneAI";

/**
 * Encode a host's situation into a discrete state string.
 * State = vulnId : stageIndex : urgency : appliedCount
 *   urgency     — "hi" (≤20s), "med" (21–40s), "lo" (>40s)
 *   appliedCount — capped at 2 to keep the space manageable
 */
function encodeState(host) {
  const urgency =
    host.stageTimeLeft <= 20 ? "hi" :
    host.stageTimeLeft <= 40 ? "med" : "lo";
  const applied = Math.min(host.appliedMitigations.length, 2);
  return `${host.vulnId}:${host.stageIndex}:${urgency}:${applied}`;
}

export class QAgent {
  constructor() {
    this.qtable       = {};
    this.episodes     = 0;
    this.wins         = 0;
    this.scoreHistory = [];   // last 50 episode scores
    this.episodeLog   = [];   // last 50 full records { ep, won, score, durationSec }
    this.epsilon      = EPSILON_START;
    this.load();
  }

  // ── State encoding ──────────────────────────────────────────────────────────
  encodeState(host) { return encodeState(host); }

  // ── Q-table access ──────────────────────────────────────────────────────────
  getQ(stateKey, action) {
    return this.qtable[`${stateKey}|${action}`] ?? 0;
  }

  setQ(stateKey, action, value) {
    this.qtable[`${stateKey}|${action}`] = value;
  }

  // ── Epsilon-greedy action selection ─────────────────────────────────────────
  chooseAction(host, availableActions) {
    if (!availableActions || availableActions.length === 0) return null;

    if (Math.random() < this.epsilon) {
      // Explore: random action
      return availableActions[Math.floor(Math.random() * availableActions.length)];
    }

    // Exploit: pick highest Q-value action
    const stateKey = encodeState(host);
    let bestAction = availableActions[0];
    let bestQ      = this.getQ(stateKey, bestAction);
    for (const action of availableActions) {
      const q = this.getQ(stateKey, action);
      if (q > bestQ) { bestQ = q; bestAction = action; }
    }
    return bestAction;
  }

  // ── Bellman Q-update ─────────────────────────────────────────────────────────
  // Q(s,a) ← Q(s,a) + α × [ r + γ × maxQ(s',a') − Q(s,a) ]
  updateQ(stateKey, action, reward, nextStateKey, nextActions) {
    const current = this.getQ(stateKey, action);
    const maxNext =
      nextActions && nextActions.length > 0
        ? Math.max(...nextActions.map(a => this.getQ(nextStateKey, a)))
        : 0;
    const updated = current + ALPHA * (reward + GAMMA * maxNext - current);
    this.setQ(stateKey, action, updated);
  }

  // ── Episode bookkeeping ──────────────────────────────────────────────────────
  onEpisodeEnd(won, score, durationSec) {
    this.episodes++;
    if (won) this.wins++;
    this.scoreHistory.push(score);
    if (this.scoreHistory.length > 50) this.scoreHistory.shift();
    this.episodeLog.push({ ep: this.episodes, won, score, durationSec: durationSec ?? 0 });
    if (this.episodeLog.length > 50) this.episodeLog.shift();
    // Decay exploration rate
    this.epsilon = Math.max(
      EPSILON_MIN,
      EPSILON_START * Math.pow(EPSILON_DECAY, this.episodes)
    );
    this.save();
  }

  get winRate() {
    return this.episodes > 0 ? this.wins / this.episodes : 0;
  }

  // ── Persistence ──────────────────────────────────────────────────────────────
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        qtable:       this.qtable,
        episodes:     this.episodes,
        wins:         this.wins,
        scoreHistory: this.scoreHistory,
        episodeLog:   this.episodeLog,
        version:      2,
      }));
    } catch (_) { /* storage quota or unavailable */ }
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data?.version >= 1) {
        this.qtable       = data.qtable       ?? {};
        this.episodes     = data.episodes     ?? 0;
        this.wins         = data.wins         ?? 0;
        this.scoreHistory = data.scoreHistory ?? [];
        this.episodeLog   = data.episodeLog   ?? [];
        // Restore epsilon to where it would be after this many episodes
        this.epsilon = Math.max(
          EPSILON_MIN,
          EPSILON_START * Math.pow(EPSILON_DECAY, this.episodes)
        );
      }
    } catch (_) { /* corrupt storage */ }
  }

  reset() {
    this.qtable       = {};
    this.episodes     = 0;
    this.wins         = 0;
    this.scoreHistory = [];
    this.episodeLog   = [];
    this.epsilon      = EPSILON_START;
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }
}
