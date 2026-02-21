// src/AIPanel.jsx
// Dashboard shown below the header when AI Mode is active.
// Displays episode stats, win rate, exploration rate, score sparkline,
// last decision, and speed controls.

const C = {
  cyan:   "#00fff7",
  green:  "#00ff88",
  yellow: "#ffcc00",
  red:    "#ff003c",
  purple: "#8855ff",
};

const SPARK_W = 220;
const SPARK_H = 36;

export default function AIPanel({ stats, aiSpeed, onSpeedChange, onReset, lastDecision }) {
  const { episodes, wins, scoreHistory, epsilon } = stats;

  const winRate       = episodes > 0 ? wins / episodes : 0;
  const winPct        = Math.round(winRate * 100);
  const explorationPct = Math.round(epsilon * 100);

  // Build SVG sparkline from last 30 scores
  const spark = scoreHistory.slice(-30);
  const maxS  = Math.max(...spark, 1);
  const minS  = Math.min(...spark, 0);
  const range = maxS - minS || 1;

  const sparkPoints = spark.length >= 2
    ? spark.map((s, i) => {
        const x = (i / (spark.length - 1)) * SPARK_W;
        const y = SPARK_H - ((s - minS) / range) * SPARK_H;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ")
    : null;

  const lastDotX = SPARK_W;
  const lastDotY = spark.length >= 1
    ? SPARK_H - ((spark[spark.length - 1] - minS) / range) * SPARK_H
    : SPARK_H / 2;

  return (
    <div style={styles.panel}>
      {/* ── Header row ──────────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <img src="/CyberSec-Capstone/SentinelCerberus.png" alt="" style={{ height: 28, width: 28, objectFit: "contain", marginRight: 8, verticalAlign: "middle" }} />
          <span style={styles.title}>SENTINEL CERBERUS — AI MODE</span>
          <span style={styles.epLabel}>Episode <span style={styles.epNum}>{episodes}</span></span>
          <span style={{ ...styles.epLabel, color: C.green }}>Wins <span style={{ fontWeight: 700 }}>{wins}</span></span>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.speedRow}>
            <span style={styles.speedLabel}>SPEED</span>
            {[1, 2, 5].map(s => (
              <button
                key={s}
                style={{ ...styles.speedBtn, ...(aiSpeed === s ? styles.speedBtnActive : {}) }}
                onClick={() => onSpeedChange(s)}
              >{s}×</button>
            ))}
          </div>
          <button style={styles.resetBtn} onClick={onReset}>↺ RESET LEARNING</button>
        </div>
      </div>

      {/* ── Metrics row ──────────────────────────────────────────── */}
      <div style={styles.body}>
        {/* Win rate */}
        <div style={styles.metric}>
          <span style={styles.metricLabel}>WIN RATE</span>
          <div style={styles.barRow}>
            <div style={styles.barTrack}>
              <div style={{ ...styles.barFill, width: `${winPct}%`, background: C.green }} />
            </div>
            <span style={{ ...styles.metricVal, color: C.green }}>{winPct}%</span>
          </div>
        </div>

        {/* Exploration */}
        <div style={styles.metric}>
          <span style={styles.metricLabel}>EXPLORING ε</span>
          <div style={styles.barRow}>
            <div style={styles.barTrack}>
              <div style={{ ...styles.barFill, width: `${explorationPct}%`, background: C.yellow }} />
            </div>
            <span style={{ ...styles.metricVal, color: C.yellow }}>{explorationPct}%</span>
          </div>
          <span style={styles.metricHint}>
            {epsilon > 0.6 ? "random" : epsilon > 0.25 ? "learning" : "smart"}
          </span>
        </div>

        {/* Score sparkline */}
        <div style={styles.metric}>
          <span style={styles.metricLabel}>SCORE TREND</span>
          <div style={styles.sparkBox}>
            {spark.length < 2 ? (
              <span style={styles.sparkEmpty}>play more episodes…</span>
            ) : (
              <svg width={SPARK_W} height={SPARK_H} style={{ overflow: "visible", display: "block" }}>
                {/* Baseline */}
                <line x1="0" y1={SPARK_H} x2={SPARK_W} y2={SPARK_H}
                  stroke="rgba(0,255,247,0.1)" strokeWidth="1" />
                <polyline
                  points={sparkPoints}
                  fill="none"
                  stroke={C.cyan}
                  strokeWidth="1.5"
                  opacity="0.8"
                />
                <circle cx={lastDotX} cy={lastDotY} r="3" fill={C.cyan} opacity="0.9" />
              </svg>
            )}
          </div>
        </div>

        {/* Last decision */}
        <div style={styles.decisionBox}>
          <span style={styles.metricLabel}>LAST ACTION</span>
          {lastDecision ? (
            <div style={styles.decisionContent}>
              <span style={{ color: C.cyan, fontWeight: 700 }}>{lastDecision.mitigationId}</span>
              <span style={styles.decisionArrow}>→</span>
              <span style={{ color: "#c8dde8" }}>{lastDecision.hostName}</span>
              <span style={{
                ...styles.decisionReward,
                color: lastDecision.reward >= 0 ? C.green : C.red,
              }}>
                {lastDecision.reward >= 0 ? "+" : ""}{lastDecision.reward}
              </span>
            </div>
          ) : (
            <span style={styles.sparkEmpty}>waiting for first action…</span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  panel: {
    margin: "0 10px 4px",
    border: "1px solid rgba(136,85,255,0.3)",
    borderTop: "3px solid #8855ff",
    background: "rgba(136,85,255,0.04)",
    boxShadow: "0 0 24px rgba(136,85,255,0.08)",
    fontFamily: "'Courier New', Consolas, monospace",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "7px 14px",
    borderBottom: "1px solid rgba(136,85,255,0.18)",
    background: "rgba(136,85,255,0.05)",
    flexWrap: "wrap",
    gap: 10,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 11,
    fontWeight: 700,
    color: "#bb99ff",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    textShadow: "0 0 12px rgba(136,85,255,0.55)",
  },
  epLabel: {
    fontSize: 11,
    color: "rgba(187,153,255,0.65)",
    letterSpacing: "0.06em",
  },
  epNum: {
    fontWeight: 700,
    color: "#bb99ff",
  },
  speedRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  speedLabel: {
    fontSize: 9,
    color: "rgba(187,153,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginRight: 2,
  },
  speedBtn: {
    padding: "3px 8px",
    fontSize: 10,
    fontWeight: 700,
    border: "1px solid rgba(136,85,255,0.25)",
    background: "rgba(136,85,255,0.06)",
    color: "rgba(187,153,255,0.5)",
    letterSpacing: "0.06em",
    cursor: "pointer",
    fontFamily: "'Courier New', Consolas, monospace",
  },
  speedBtnActive: {
    background: "rgba(136,85,255,0.25)",
    color: "#cc88ff",
    borderColor: "rgba(136,85,255,0.65)",
    boxShadow: "0 0 8px rgba(136,85,255,0.3)",
  },
  resetBtn: {
    padding: "3px 10px",
    fontSize: 10,
    fontWeight: 700,
    border: "1px solid rgba(255,0,60,0.3)",
    background: "rgba(255,0,60,0.05)",
    color: "rgba(255,120,120,0.7)",
    letterSpacing: "0.06em",
    cursor: "pointer",
    fontFamily: "'Courier New', Consolas, monospace",
  },
  body: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    padding: "8px 16px",
    flexWrap: "wrap",
  },
  metric: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flexShrink: 0,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "rgba(187,153,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  barRow: {
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  barTrack: {
    width: 90,
    height: 6,
    background: "rgba(136,85,255,0.1)",
    border: "1px solid rgba(136,85,255,0.18)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    transition: "width 0.5s ease",
  },
  metricVal: {
    fontSize: 10,
    fontWeight: 700,
    width: 30,
    textAlign: "right",
    letterSpacing: "0.04em",
  },
  metricHint: {
    fontSize: 9,
    color: "rgba(187,153,255,0.35)",
    fontStyle: "italic",
    letterSpacing: "0.06em",
  },
  sparkBox: {
    height: SPARK_H,
    display: "flex",
    alignItems: "center",
  },
  sparkEmpty: {
    fontSize: 10,
    color: "rgba(187,153,255,0.3)",
    fontStyle: "italic",
  },
  decisionBox: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginLeft: "auto",
    padding: "6px 12px",
    border: "1px solid rgba(0,255,247,0.1)",
    background: "rgba(0,0,0,0.25)",
    minWidth: 260,
  },
  decisionContent: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 11,
  },
  decisionArrow: {
    color: "rgba(154,180,192,0.4)",
    fontSize: 10,
  },
  decisionReward: {
    marginLeft: "auto",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
  },
};
