// src/CapstoneMVP.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import GlobeMap from "./GlobeMap.jsx";
import KnowledgeBase from "./KnowledgeBase.jsx";
import { INITIAL_HOSTS, VULNS } from "./CapstoneData.js";
import {
  makeInitialHosts,
  applyMitigationPure,
  stepSimulationPure,
} from "./sim/gameEngine.js";

export default function CapstoneMVP() {
  const [hosts, setHosts] = useState(makeInitialHosts);
  const [selectedHostId, setSelectedHostId] = useState(INITIAL_HOSTS[0].id);

  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);

  const [gameState, setGameState] = useState("ready"); // ready | running | won | lost
  const [showKB, setShowKB] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [lostHosts, setLostHosts] = useState([]);

  const tickRef = useRef(null);

  const selectedHost = useMemo(() => {
    return hosts.find((h) => h.id === selectedHostId) ?? hosts[0];
  }, [hosts, selectedHostId]);

  const selectedVuln = useMemo(() => {
    return selectedHost ? VULNS[selectedHost.vulnId] : null;
  }, [selectedHost]);

  const currentStage = useMemo(() => {
    if (!selectedHost || !selectedVuln) return null;
    return selectedVuln.stages[selectedHost.stageIndex];
  }, [selectedHost, selectedVuln]);

  const anyCompromised = useMemo(() => {
    return hosts.filter((h) => h.spawned && h.status === "compromised").length;
  }, [hosts]);

  // Lose condition: 2+ compromised hosts
  useEffect(() => {
    if (gameState === "running" && anyCompromised >= 2) {
      setLostHosts(hosts.filter((h) => h.spawned && h.status === "compromised"));
      setGameState("lost");
      setRunning(false);
    }
  }, [anyCompromised, gameState, hosts]);

  // Win condition: all spawned hosts contained, and all 10 hosts have spawned
  useEffect(() => {
    if (gameState !== "running") return;
    const allSpawned = hosts.every((h) => h.spawned);
    const allContained = hosts.every(
      (h) => !h.spawned || h.status === "safe" || h.status === "quarantined"
    );
    const noneCompromised = hosts.every((h) => !h.spawned || h.status !== "compromised");

    if (allSpawned && allContained && noneCompromised) {
      setGameState("won");
      setRunning(false);
    }
  }, [hosts, gameState]);

  // Tick loop
  useEffect(() => {
    if (!running) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }

    tickRef.current = setInterval(() => {
      setHosts((prev) => stepSimulationPure(prev, gameState));
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [running, gameState]);

  function start() {
    setHosts(makeInitialHosts());
    setScore(0);
    setGameState("running");
    setRunning(true);
    setSelectedHostId(INITIAL_HOSTS[0].id);
  }

  function stop() {
    setRunning(false);
    setGameState("ready");
  }

  function applyMitigation(hostId, mitigationId) {
    setHosts((prev) => {
      const { hosts: nextHosts, pointsAwarded } = applyMitigationPure(prev, hostId, mitigationId);
      if (pointsAwarded) setScore((s) => s + pointsAwarded);
      return nextHosts;
    });
  }

  const statusColor = (status) => {
    if (status === "safe") return "#1fda75";
    if (status === "warning") return "#ffcc00";
    if (status === "compromised") return "#ff4d4d";
    if (status === "quarantined") return "#66b3ff";
    return "#ffffff";
  };

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <h1 style={{ margin: 0 }}>CyberSecurity Lab</h1>
      <div style={{ opacity: 0.8, marginBottom: 12 }}>
        Globe + Hosts + Attacker Escalation + Mitigations
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div><b>Score:</b> {score}</div>
        <div>
          <b>State:</b>{" "}
          {gameState === "ready"
            ? "Ready"
            : gameState === "running"
            ? "Running"
            : gameState === "won"
            ? "Won ✅"
            : "Lost ❌"}
        </div>

        <button onClick={start}>Start</button>
        <button onClick={() => setRunning((r) => !r)} disabled={gameState !== "running"}>
          {running ? "Pause" : "Resume"}
        </button>
        <button onClick={stop}>Reset</button>
        <button onClick={() => setShowKB(true)}>Knowledge Base</button>
      </div>

      {showKB && <KnowledgeBase onClose={() => setShowKB(false)} />}

      {gameState === "lost" && lostHosts.length > 0 && (
        <div style={{ border: "1px solid #ff4d4d", padding: 12, marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>▌ MISSION FAILED — NETWORK BREACHED ▌</h3>
          <div style={{ marginBottom: 8 }}>
            ⛔ {lostHosts.length} host{lostHosts.length > 1 ? "s were" : " was"} fully compromised
            before containment. Threat actors have achieved persistent access.
          </div>

          {lostHosts.map((h) => {
            const vuln = VULNS[h.vulnId];
            const failedStage = vuln.stages[h.stageIndex];
            const missing = failedStage.requiredMitigationsAnyOf.filter(
              (m) => !h.appliedMitigations.includes(m)
            );
            const applied = h.appliedMitigations;

            return (
              <div key={h.id} style={{ padding: 10, borderTop: "1px solid rgba(255,77,77,0.35)" }}>
                <b>{h.name}</b> • {h.region} • <b>{vuln.name}</b>
                <div>Failed at stage: {failedStage.label} (Stage {h.stageIndex})</div>

                {applied.length > 0 && <div>Mitigations applied: {applied.join(", ")}</div>}
                {missing.length > 0 && <div>Would have helped: {missing.join(" or ")}</div>}

                <div style={{ marginTop: 6, opacity: 0.9 }}>
                  {applied.length === 0
                    ? `No mitigations were applied to ${h.name}. Always respond to every spawned host — even a single wrong action is better than none.`
                    : missing.length > 0
                    ? `The mitigations applied didn't satisfy the requirement for this stage. Check the Knowledge Base to learn which defenses stop "${failedStage.label}".`
                    : `Mitigations were applied but escalation wasn't stopped in time. Act faster on Stage ${h.stageIndex} threats — the timer is unforgiving.`}
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
            <button onClick={start}>↺ RETRY MISSION</button>
            <button onClick={() => setShowKB(true)}>▶ OPEN KNOWLEDGE BASE</button>
          </div>
        </div>
      )}

      {showIntro && (
        <div style={{ border: "1px solid rgba(255,255,255,0.2)", padding: 12, marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>▌ SYSTEM ALERT — INCOMING THREAT DETECTION ▌</h3>
          <div style={{ marginBottom: 8 }}>
            ⚠ CRITICAL: Your network is reporting active host compromise events. Multiple endpoints are
            exhibiting indicators of attack across global infrastructure nodes. Threat actors are escalating — time is limited.
          </div>
          <ol style={{ marginTop: 0 }}>
            <li>Review incoming alerts on the Global Threat Globe — hosts will spawn as threats are detected.</li>
            <li>Select a host to view attacker activity and available mitigations in the right panel.</li>
            <li>Consult the Knowledge Base to understand attack techniques and why defenses work — don't just guess.</li>
            <li>Contain all hosts before 2 become compromised or the mission fails.</li>
          </ol>
          <button onClick={() => setShowIntro(false)}>▶ ACKNOWLEDGE & ENTER OPERATIONS CENTER</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: 12 }}>
        {/* Left: Attacker */}
        <div style={{ border: "1px solid rgba(255,255,255,0.15)", padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Attacker</h3>

          {!selectedHost || !selectedVuln ? (
            <div>Select a host.</div>
          ) : (
            <>
              <div><b>Host:</b> {selectedHost.name}</div>
              <div><b>Vulnerability:</b> {selectedVuln.name}</div>
              <div>
                <b>Stage:</b> {currentStage?.label ?? "—"} (#{selectedHost.stageIndex})
              </div>
              <div>
                <b>Escalates In:</b>{" "}
                {selectedHost.status === "safe" || selectedHost.status === "quarantined"
                  ? "Contained"
                  : `${selectedHost.stageTimeLeft}s`}
              </div>

              <div style={{ marginTop: 10 }}>
                <b>Possible Attacks</b>
                <ul>
                  {(currentStage?.attackerActions ?? []).map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: 10 }}>
                <b>Last Event</b>
                <div style={{ opacity: 0.9 }}>{selectedHost.lastEvent}</div>
              </div>
            </>
          )}
        </div>

        {/* Center: Globe */}
        <div style={{ border: "1px solid rgba(255,255,255,0.15)", padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Global Threat Globe</h3>
          <div style={{ opacity: 0.85, marginBottom: 8 }}>
            Click a host marker • Rotate buttons below • Auto-rotate while running
          </div>

          <GlobeMap
            hosts={hosts.filter((h) => h.spawned)}
            selectedHostId={selectedHostId}
            onSelectHost={setSelectedHostId}
            statusColor={statusColor}
            autoRotate={true}
            running={running && gameState === "running"}
          />

          {hosts.some((h) => !h.spawned) && (
            <div style={{ marginTop: 10 }}>
              <b>Incoming:</b>{" "}
              {hosts
                .filter((h) => !h.spawned)
                .map((h) => (
                  <span key={h.id} style={{ marginRight: 10 }}>
                    {h.region} — {h.spawnCountdown}s
                  </span>
                ))}
            </div>
          )}

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span>🟩 Safe</span>
            <span>🟨 Warning</span>
            <span>🟥 Compromised</span>
            <span>🟦 Quarantined</span>
          </div>
        </div>

        {/* Right: Mitigations */}
        <div style={{ border: "1px solid rgba(255,255,255,0.15)", padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Mitigations</h3>

          {!selectedHost || !selectedVuln ? (
            <div>Select a host.</div>
          ) : (
            <>
              <div style={{ marginBottom: 10 }}>
                <b>Recommended Actions</b>
                <div style={{ opacity: 0.9 }}>{selectedVuln.description}</div>
              </div>

              {selectedVuln.mitigations.map((m) => {
                const already = selectedHost.appliedMitigations.includes(m.id);
                return (
                  <button
                    key={m.id}
                    disabled={already}
                    onClick={() => applyMitigation(selectedHost.id, m.id)}
                    style={{ display: "block", width: "100%", marginBottom: 8 }}
                  >
                    {m.label} {!already && <span style={{ opacity: 0.8 }}> (+{m.points} pts)</span>}
                  </button>
                );
              })}

              <div style={{ marginTop: 12 }}>
                <b>Applied</b>
                {selectedHost.appliedMitigations.length === 0 ? (
                  <div style={{ opacity: 0.8 }}>None yet.</div>
                ) : (
                  <ul>
                    {selectedHost.appliedMitigations.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const C = {
  cyan:    "#00fff7",
  red:     "#ff003c",
  yellow:  "#ffcc00",
  green:   "#00ff88",
  purple:  "#8855ff",
  bg:      "#060a0f",
  surface: "#0a1018",
  border:  "rgba(0,255,247,0.18)",
  dim:     "rgba(0,255,247,0.06)",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: C.bg,
    backgroundImage: [
      "linear-gradient(rgba(0,255,247,0.035) 1px, transparent 1px)",
      "linear-gradient(90deg, rgba(0,255,247,0.035) 1px, transparent 1px)",
    ].join(", "),
    backgroundSize: "44px 44px",
    color: "#9ab4c0",
    fontFamily: "'Courier New', Consolas, monospace",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    padding: "10px 20px",
    borderBottom: `1px solid ${C.cyan}`,
    boxShadow: `0 0 24px rgba(0,255,247,0.12)`,
    background: "rgba(6,10,15,0.92)",
    backdropFilter: "blur(8px)",
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    color: C.cyan,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    textShadow: `0 0 18px rgba(0,255,247,0.55)`,
  },
  subTitle: {
    fontSize: 10,
    color: "rgba(0,255,247,0.4)",
    marginTop: 3,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  headerRight: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  badge: {
    padding: "4px 10px",
    border: `1px solid rgba(0,255,247,0.3)`,
    background: "rgba(0,255,247,0.06)",
    color: C.cyan,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  buttonRow: { display: "flex", gap: 6 },
  btn: {
    padding: "7px 12px",
    border: `1px solid rgba(0,255,247,0.3)`,
    background: "rgba(0,255,247,0.05)",
    color: "rgba(0,255,247,0.8)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: 11,
    fontWeight: 700,
  },
  kbBtn: {
    padding: "7px 14px",
    border: `1px solid rgba(136,85,255,0.55)`,
    background: "rgba(136,85,255,0.12)",
    color: "#bb99ff",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: 11,
    fontWeight: 700,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "300px 1fr 300px",
    gap: 10,
    padding: 10,
  },
  panel: {
    border: `1px solid ${C.border}`,
    borderLeft: `3px solid ${C.cyan}`,
    background: `linear-gradient(135deg, rgba(0,255,247,0.04) 0%, rgba(6,10,15,0.95) 100%)`,
    boxShadow: `0 0 20px rgba(0,255,247,0.06), inset 0 0 30px rgba(0,0,0,0.4)`,
    padding: "10px 12px",
    minHeight: 560,
  },
  panelTitle: {
    fontWeight: 700,
    fontSize: 11,
    color: C.cyan,
    textTransform: "uppercase",
    letterSpacing: "0.2em",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: `1px solid rgba(0,255,247,0.2)`,
    textShadow: `0 0 10px rgba(0,255,247,0.4)`,
  },
  section: {
    borderTop: "1px solid rgba(0,255,247,0.1)",
    paddingTop: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "rgba(0,255,247,0.5)",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    marginBottom: 8,
  },
  kv: { display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 },
  k: { fontSize: 11, color: "rgba(154,180,192,0.6)" },
  v: { fontSize: 11, fontWeight: 700, color: "#c8dde8" },
  muted: { color: "rgba(154,180,192,0.5)", fontSize: 12 },
  mutedSmall: { color: "rgba(154,180,192,0.5)", fontSize: 11, lineHeight: 1.5 },
  list: { margin: 0, paddingLeft: 16 },
  listItem: { fontSize: 11, color: "rgba(200,220,232,0.85)", marginBottom: 5 },
  eventBox: {
    padding: "8px 10px",
    border: "1px solid rgba(0,255,247,0.15)",
    borderLeft: `2px solid ${C.cyan}`,
    background: "rgba(0,0,0,0.45)",
    fontSize: 11,
    lineHeight: 1.5,
    color: C.cyan,
    fontStyle: "italic",
  },

  mapWrap: {
    alignSelf: "start",
    border: `1px solid ${C.border}`,
    borderTop: `3px solid ${C.cyan}`,
    background: `linear-gradient(180deg, rgba(0,255,247,0.03) 0%, rgba(6,10,15,0.98) 100%)`,
    boxShadow: `0 0 30px rgba(0,255,247,0.07), inset 0 0 40px rgba(0,0,0,0.5)`,
    padding: 12,
    display: "flex",
    flexDirection: "column",
  },
  mapTitleRow: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: `1px solid rgba(0,255,247,0.15)`,
  },
  mapTitle: {
    fontWeight: 700,
    fontSize: 11,
    color: C.cyan,
    textTransform: "uppercase",
    letterSpacing: "0.22em",
    textShadow: `0 0 12px rgba(0,255,247,0.5)`,
  },
  globeFrame: {
    flex: 1,
    minHeight: 400,
    maxHeight: 560,
    border: `1px solid rgba(0,255,247,0.2)`,
    boxShadow: `0 0 40px rgba(0,255,247,0.08), inset 0 0 60px rgba(0,10,20,0.8)`,
    background: [
      "radial-gradient(ellipse at 30% 30%, rgba(0,255,247,0.06), transparent 55%)",
      "radial-gradient(ellipse at 70% 70%, rgba(0,100,200,0.07), transparent 55%)",
      "#030810",
    ].join(", "),
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  mapLegend: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginTop: 10,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "rgba(154,180,192,0.7)",
  },
  pendingRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 8,
    fontSize: 10,
    padding: "5px 8px",
    border: "1px solid rgba(255,204,0,0.2)",
    borderLeft: `2px solid ${C.yellow}`,
    background: "rgba(255,204,0,0.04)",
  },
  pendingLabel: {
    fontWeight: 700,
    color: C.yellow,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    textShadow: `0 0 8px rgba(255,204,0,0.5)`,
  },
  pendingChip: {
    padding: "2px 7px",
    border: "1px solid rgba(255,204,0,0.3)",
    background: "rgba(255,204,0,0.07)",
    color: "#ffdd66",
    letterSpacing: "0.06em",
  },
  legendItem: { display: "inline-flex", alignItems: "center", gap: 5 },
  legendSwatch: {
    width: 8,
    height: 8,
    display: "inline-block",
    boxShadow: "0 0 4px currentColor",
  },

  buttonGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 6 },
  actionBtn: {
    textAlign: "left",
    padding: "9px 12px",
    border: `1px solid rgba(0,255,247,0.18)`,
    borderLeft: `2px solid rgba(0,255,247,0.5)`,
    background: "rgba(0,255,247,0.04)",
    color: "#c8dde8",
    transition: "border-color 0.15s, background 0.15s",
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#d0eaf4",
  },
  actionMeta: {
    fontSize: 10,
    color: C.cyan,
    marginTop: 3,
    letterSpacing: "0.06em",
    textShadow: `0 0 6px rgba(0,255,247,0.4)`,
  },

  // ── Intro modal ────────────────────────────────────────────────────────────
  introOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.82)",
    backdropFilter: "blur(6px)",
  },
  introBox: {
    width: "min(620px, 92vw)",
    border: `1px solid rgba(0,255,247,0.35)`,
    borderTop: `3px solid ${C.cyan}`,
    background: `linear-gradient(160deg, rgba(0,255,247,0.06) 0%, rgba(6,10,15,0.98) 60%)`,
    boxShadow: `0 0 60px rgba(0,255,247,0.18), 0 0 120px rgba(0,255,247,0.06)`,
    overflow: "hidden",
  },
  introHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 18px",
    borderBottom: `1px solid rgba(0,255,247,0.2)`,
    background: "rgba(0,255,247,0.05)",
  },
  introHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: 700,
    color: C.cyan,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    textShadow: `0 0 14px rgba(0,255,247,0.6)`,
  },
  introBlink: {
    color: C.cyan,
    fontSize: 14,
    animation: "blink 1s step-end infinite",
    textShadow: `0 0 10px rgba(0,255,247,0.8)`,
  },
  introBody: {
    padding: "20px 22px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  introWarning: {
    padding: "12px 14px",
    border: "1px solid rgba(255,0,60,0.3)",
    borderLeft: `3px solid ${C.red}`,
    background: "rgba(255,0,60,0.06)",
    color: "#ffaaaa",
    fontSize: 12,
    lineHeight: 1.65,
    textShadow: "0 0 8px rgba(255,0,60,0.3)",
  },
  introSteps: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  introStep: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    fontSize: 12,
    color: "rgba(200,220,232,0.85)",
    lineHeight: 1.6,
  },
  introStepNum: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: 700,
    color: C.cyan,
    border: `1px solid rgba(0,255,247,0.4)`,
    padding: "1px 6px",
    letterSpacing: "0.08em",
    textShadow: `0 0 8px rgba(0,255,247,0.5)`,
    marginTop: 2,
  },
  introFooter: {
    display: "flex",
    justifyContent: "center",
    paddingTop: 4,
  },
  introBtn: {
    padding: "11px 28px",
    border: `1px solid ${C.cyan}`,
    background: "rgba(0,255,247,0.1)",
    color: C.cyan,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    textShadow: `0 0 12px rgba(0,255,247,0.6)`,
    boxShadow: `0 0 20px rgba(0,255,247,0.12)`,
    cursor: "pointer",
  },

  // ── Lost debrief ───────────────────────────────────────────────────────────
  lostHostList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  lostHostCard: {
    padding: "12px 14px",
    border: "1px solid rgba(255,0,60,0.2)",
    borderLeft: `3px solid ${C.red}`,
    background: "rgba(255,0,60,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  lostHostHeader: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  lostHostName: {
    fontWeight: 700,
    fontSize: 13,
    color: "#ffdddd",
    letterSpacing: "0.06em",
  },
  lostHostRegion: {
    fontSize: 10,
    color: "rgba(200,180,180,0.6)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  lostHostAttack: {
    marginLeft: "auto",
    fontSize: 10,
    fontWeight: 700,
    color: C.red,
    border: "1px solid rgba(255,0,60,0.35)",
    padding: "1px 7px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  lostDetail: {
    display: "flex",
    gap: 8,
    fontSize: 11,
    lineHeight: 1.4,
    flexWrap: "wrap",
  },
  lostDetailLabel: {
    color: "rgba(200,180,180,0.55)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    fontSize: 10,
    flexShrink: 0,
    paddingTop: 1,
  },
  lostDetailVal: {
    color: "#e0c8c8",
    fontWeight: 700,
    fontSize: 11,
  },
  lostTip: {
    marginTop: 2,
    padding: "7px 10px",
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,204,0,0.15)",
    borderLeft: `2px solid ${C.yellow}`,
    color: "rgba(220,210,180,0.85)",
    fontSize: 11,
    lineHeight: 1.6,
    display: "flex",
    gap: 8,
  },
  lostTipIcon: {
    flexShrink: 0,
    fontSize: 13,
  },
};
