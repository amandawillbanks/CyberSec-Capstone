// src/CapstoneMVP.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import GlobeMap from "./GlobeMap.jsx";
import KnowledgeBase from "./KnowledgeBase.jsx";
import { INITIAL_HOSTS, VULNS } from "./CapstoneData.js";
import {
  makeInitialHosts,
  applyMitigationPure,
  clearPenaltyMessagePure,
  stepSimulationPure,
  MITIGATION_APPLY_TIMES,
} from "./sim/gameEngine.js";

export default function CapstoneMVP() {
  const [hosts, setHosts] = useState(makeInitialHosts);
  const [selectedHostId, setSelectedHostId] = useState(INITIAL_HOSTS[0].id);

  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const [gameState, setGameState] = useState("ready"); // ready | running | won | lost
  const [showKB, setShowKB] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [lostHosts, setLostHosts] = useState([]);
  const [showDebrief, setShowDebrief] = useState(false);

  const tickRef = useRef(null);
  const kbRef = useRef(null);

  function openAndScrollToKB() {
    setShowDebrief(false);
    setShowKB(true);
    setTimeout(() => {
      kbRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

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
      setShowDebrief(true);
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
    setShowDebrief(false);
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

  function dismissPenalty(hostId) {
    setHosts((prev) => clearPenaltyMessagePure(prev, hostId));
  }

  const statusColor = (status) => {
    if (status === "safe") return "#1fda75";
    if (status === "warning") return "#ffcc00";
    if (status === "compromised") return "#ff4d4d";
    if (status === "quarantined") return "#66b3ff";
    return "#ffffff";
  };

  return (
    <div style={styles.page}>
      {/* Blink keyframe for intro/alert cursors */}
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={styles.header}>
        <div>
          <div style={styles.title}>CyberSec Ops Center</div>
          <div style={styles.subTitle}>Global Threat Response Platform</div>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.badge}>Score: {score}</span>
          <span style={{
            ...styles.badge,
            color: gameState === "running" ? C.green : gameState === "lost" ? C.red : gameState === "won" ? C.cyan : "rgba(0,255,247,0.4)",
          }}>
            {gameState === "ready" ? "STANDBY" : gameState === "running" ? "ACTIVE" : gameState === "won" ? "MISSION SUCCESS" : "MISSION FAILED"}
          </span>
          <div style={styles.buttonRow}>
            <button style={styles.btn} onClick={start}>▶ START</button>
            <button style={styles.btn} onClick={() => setRunning((r) => !r)} disabled={gameState !== "running"}>
              {running ? "⏸ PAUSE" : "▶ RESUME"}
            </button>
            <button style={styles.btn} onClick={stop}>↺ RESET</button>
            <button style={styles.kbBtn} onClick={openAndScrollToKB}>📖 KNOWLEDGE BASE</button>
          </div>
        </div>
      </header>

      {/* KB rendered inline below the grid — see bottom of return */}

      {/* ── 3-col grid ─────────────────────────────────────────── */}
      <div style={styles.grid}>

        {/* Left: Attacker Intel */}
        <div style={styles.panel}>
          <div style={styles.panelTitle}>▌ Attacker Intel</div>

          {!selectedHost || !selectedVuln ? (
            <div style={styles.muted}>Select a host on the globe.</div>
          ) : (
            <>
              <div style={styles.kv}><span style={styles.k}>HOST</span><span style={styles.v}>{selectedHost.name}</span></div>
              <div style={styles.kv}><span style={styles.k}>REGION</span><span style={styles.v}>{selectedHost.region}</span></div>
              <div style={styles.kv}><span style={styles.k}>ATTACK</span><span style={styles.v}>{selectedVuln.name}</span></div>
              <div style={styles.kv}>
                <span style={styles.k}>STAGE</span>
                <span style={styles.v}>{currentStage?.label ?? "—"} #{selectedHost.stageIndex}</span>
              </div>
              <div style={styles.kv}>
                <span style={styles.k}>ESCALATES IN</span>
                <span style={{
                  ...styles.v,
                  color: selectedHost.stageTimeLeft <= 15 ? C.red : selectedHost.stageTimeLeft <= 30 ? C.yellow : C.green,
                }}>
                  {selectedHost.status === "safe" || selectedHost.status === "quarantined"
                    ? "CONTAINED"
                    : `${selectedHost.stageTimeLeft}s`}
                </span>
              </div>

              <div style={styles.section}>
                <div style={styles.sectionTitle}>Possible Attacker Actions</div>
                <ul style={styles.list}>
                  {(currentStage?.attackerActions ?? []).map((a) => (
                    <li key={a.label} style={styles.listItem}>
                      <span style={styles.mitreBadge}>{a.mitreId}</span>
                      {a.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={styles.section}>
                <div style={styles.sectionTitle}>Last Event</div>
                <div style={styles.eventBox}>{selectedHost.lastEvent || "Monitoring…"}</div>
              </div>
            </>
          )}
        </div>

        {/* Center: Globe */}
        <main style={styles.mapWrap}>
          <div style={styles.mapTitleRow}>
            <div style={styles.mapTitle}>Global Threat Map</div>
          </div>

          <div style={styles.globeFrame}>
            <GlobeMap
              hosts={hosts.filter((h) => h.spawned)}
              selectedHostId={selectedHostId}
              onSelectHost={setSelectedHostId}
              statusColor={statusColor}
              autoRotate={true}
              running={running && gameState === "running"}
            />
          </div>

          {hosts.some((h) => !h.spawned) && (
            <div style={styles.pendingRow}>
              <span style={styles.pendingLabel}>INCOMING</span>
              {hosts.filter((h) => !h.spawned).map((h) => (
                <span key={h.id} style={styles.pendingChip}>{h.region} {h.spawnCountdown}s</span>
              ))}
            </div>
          )}

          <div style={styles.mapLegend}>
            {[
              { label: "SAFE", color: C.green },
              { label: "WARNING", color: C.yellow },
              { label: "COMPROMISED", color: C.red },
              { label: "QUARANTINED", color: "#66b3ff" },
            ].map(({ label, color }) => (
              <span key={label} style={styles.legendItem}>
                <span style={{ ...styles.legendSwatch, background: color, color }} />
                {label}
              </span>
            ))}
          </div>
        </main>

        {/* Right: Defense Actions */}
        <div style={styles.panel}>
          <div style={styles.panelTitle}>▌ Defense Actions</div>

          {!selectedHost || !selectedVuln ? (
            <div style={styles.muted}>Select a host on the globe.</div>
          ) : (
            <>
              <div style={styles.mutedSmall}>{selectedVuln.description}</div>

              {selectedHost.penaltyMessage && (
                <div style={styles.penaltyBanner}>
                  <div style={styles.penaltyBannerHeader}>
                    <span style={styles.penaltyBannerTitle}>⚠ WRONG TOOL — WHY?</span>
                    <button
                      style={styles.penaltyDismiss}
                      onClick={() => dismissPenalty(selectedHost.id)}
                    >✕</button>
                  </div>
                  <div style={styles.penaltyBannerBody}>{selectedHost.penaltyMessage}</div>
                </div>
              )}

              <div style={styles.section}>
                <div style={styles.sectionTitle}>Available Mitigations</div>
                <div style={styles.buttonGrid}>
                  {selectedVuln.mitigations.map((m) => {
                    const already = selectedHost.appliedMitigations.includes(m.id);
                    const pending = selectedHost.pendingMitigations?.find((p) => p.id === m.id);
                    const isPending = !!pending;
                    const stage = VULNS[selectedHost.vulnId]?.stages[selectedHost.stageIndex];
                    const isPenalty = stage?.penaltyMitigations?.includes(m.id);
                    const isHovered = hoveredBtn === m.id;
                    const isContained = selectedHost.status === "safe" || selectedHost.status === "quarantined";
                    const disabled = already || isPending || isContained;
                    return (
                      <button
                        key={m.id}
                        disabled={disabled}
                        onClick={() => applyMitigation(selectedHost.id, m.id)}
                        onMouseEnter={() => !disabled && setHoveredBtn(m.id)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        style={{
                          ...styles.actionBtn,
                          opacity: disabled ? 0.5 : 1,
                          cursor: disabled ? "not-allowed" : "pointer",
                          borderLeftColor: already
                            ? "rgba(0,255,247,0.15)"
                            : isPending
                            ? C.yellow
                            : isPenalty && isHovered
                            ? C.red
                            : "rgba(0,255,247,0.5)",
                          background: isPenalty && isHovered && !already && !isPending
                            ? "rgba(255,0,60,0.08)"
                            : "rgba(0,255,247,0.04)",
                        }}
                      >
                        <div style={styles.actionLabel}>
                          {isPending ? `⏳ ${pending.timeLeft}s…` : m.label}
                        </div>
                        {!already && !isPending && (
                          <div style={styles.actionMeta}>+{m.points} pts · {MITIGATION_APPLY_TIMES[m.id] ?? 4}s</div>
                        )}
                        {isPending && (
                          <div style={{ ...styles.actionMeta, color: C.yellow }}>applying…</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={styles.section}>
                <div style={styles.sectionTitle}>Applied</div>
                {selectedHost.appliedMitigations.length === 0 ? (
                  <div style={styles.muted}>None yet.</div>
                ) : (
                  <ul style={styles.list}>
                    {selectedHost.appliedMitigations.map((x) => (
                      <li key={x} style={{ ...styles.listItem, color: C.green }}>• {x}</li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Inline Knowledge Base (below grid) ─────────────────── */}
      <div ref={kbRef}>
        {showKB && <KnowledgeBase onClose={() => setShowKB(false)} inline />}
      </div>

      {/* ── Intro modal ─────────────────────────────────────────── */}
      {showIntro && (
        <div style={styles.introOverlay}>
          <div style={{ ...styles.introBox, width: "min(700px, 95vw)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={styles.introHeader}>
              <span style={styles.introBlink}>▌</span>
              <span style={styles.introHeaderText}>SYSTEM ALERT — INCOMING THREAT DETECTION</span>
              <span style={styles.introBlink}>▌</span>
            </div>
            <div style={styles.introBody}>

              {/* Role briefing */}
              <div style={styles.introWarning}>
                ⚠ CRITICAL: Intrusion activity has been detected on 2 of 10 global infrastructure nodes. 
                Additional systems are at risk of compromise. As the on-call SOC analyst, 
                contain the active threats and secure all 10 systems before adversaries establish persistence..
              </div>

              {/* Interface overview */}
              <div>
                <div style={styles.sectionTitle}>Interface Overview</div>
                <div style={styles.introPanelGrid}>
                  {[
                    { title: "◀ Attacker Intel", desc: "Active stage, attacker techniques, escalation timer, and last event for the selected host." },
                    { title: "● Globe", desc: "10 global hosts spawn in waves over ~6 min. Click a marker to select it. Colors show status." },
                    { title: "Defense Actions ▶", desc: "Available mitigations for the selected host. Apply the right one to stabilize the threat." },
                  ].map(({ title, desc }) => (
                    <div key={title} style={styles.introPanelCard}>
                      <div style={styles.introPanelTitle}>{title}</div>
                      <div style={styles.introPanelDesc}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status legend */}
              <div>
                <div style={styles.sectionTitle}>Host Status Colors</div>
                <div style={styles.introStatusRow}>
                  {[
                    { label: "WARNING", color: C.yellow, desc: "Active threat — timer running" },
                    { label: "SAFE", color: C.green, desc: "Correctly contained" },
                    { label: "QUARANTINED", color: "#66b3ff", desc: "Isolated, no longer escalating" },
                    { label: "COMPROMISED", color: C.red, desc: "Attack succeeded — mission at risk" },
                  ].map(({ label, color, desc }) => (
                    <div key={label} style={styles.introStatusChip}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, display: "inline-block", background: color, boxShadow: `0 0 5px ${color}`, flexShrink: 0 }} />
                        <span style={{ color, fontWeight: 700, fontSize: 10, letterSpacing: "0.1em" }}>{label}</span>
                      </div>
                      <span style={{ fontSize: 10, color: "rgba(154,180,192,0.65)", marginTop: 2 }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div style={styles.introSteps}>
                {[
                  ["-", "PRESS START TO BEGIN", "Click ▶ START in the top header to launch the mission. Two hosts become active immediately — check the bar below the globe to see when additional hosts will spawn."],
                  ["-", "WATCH THE TIMERS", "Every active host has a live countdown. If the timer hits zero before you apply the right mitigation, the attack escalates to a worse stage. The left panel shows the stage, attacker actions, and seconds remaining."],
                  ["-", "APPLY THE RIGHT DEFENSE", "Click a mitigation in the right panel. The correct choice for the current stage stabilizes the host and adds bonus time. Choosing the wrong one subtracts 20 seconds from the countdown — making things worse."],
                  ["-", "USE THE KNOWLEDGE BASE", "Open it anytime from the header. It explains every attack type, every attacker technique, and why each defense works — but won't tell you exactly which button to press."],
                ].map(([num, title, text]) => (
                  <div key={num} style={styles.introStep}>
                    <span style={styles.introStepNum}>{num}</span>
                    <span>
                      <span style={{ fontWeight: 700, color: C.cyan, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 11 }}>{title} — </span>
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Win/Lose conditions */}
              <div style={styles.introConditions}>
                <div style={styles.introConditionWin}>
                  <span style={{ color: C.green, fontWeight: 700, fontSize: 10, letterSpacing: "0.12em", flexShrink: 0 }}>WIN</span>
                  <span style={{ fontSize: 11, color: "rgba(150,220,180,0.85)" }}>All 10 hosts contained — status safe or quarantined</span>
                </div>
                <div style={styles.introConditionLose}>
                  <span style={{ color: C.red, fontWeight: 700, fontSize: 10, letterSpacing: "0.12em", flexShrink: 0 }}>LOSE</span>
                  <span style={{ fontSize: 11, color: "rgba(220,150,150,0.85)" }}>2 or more hosts simultaneously compromised</span>
                </div>
              </div>

              <div style={styles.introFooter}>
                <button style={styles.introBtn} onClick={() => setShowIntro(false)}>
                  ▶ ACKNOWLEDGE &amp; ENTER OPERATIONS CENTER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Loss debrief modal ──────────────────────────────────── */}
      {gameState === "lost" && showDebrief && lostHosts.length > 0 && (
        <div style={styles.introOverlay}>
          <div style={{ ...styles.introBox, borderTopColor: C.red, width: "min(700px, 94vw)" }}>
            <div style={{ ...styles.introHeader, borderBottomColor: "rgba(255,0,60,0.25)" }}>
              <span style={{ ...styles.introBlink, color: C.red }}>▌</span>
              <span style={{ ...styles.introHeaderText, color: C.red }}>MISSION FAILED — NETWORK BREACHED</span>
              <span style={{ ...styles.introBlink, color: C.red }}>▌</span>
            </div>
            <div style={styles.introBody}>
              <div style={{ ...styles.introWarning, borderLeftColor: C.red }}>
                ⛔ {lostHosts.length} host{lostHosts.length > 1 ? "s were" : " was"} fully compromised
                before containment. Threat actors have achieved persistent access.
              </div>
              <div style={styles.lostHostList}>
                {lostHosts.map((h) => {
                  const vuln = VULNS[h.vulnId];
                  const failedStage = vuln.stages[h.stageIndex];
                  const missing = failedStage.requiredMitigationsAnyOf.filter(
                    (m) => !h.appliedMitigations.includes(m)
                  );
                  const applied = h.appliedMitigations;
                  return (
                    <div key={h.id} style={styles.lostHostCard}>
                      <div style={styles.lostHostHeader}>
                        <span style={styles.lostHostName}>{h.name}</span>
                        <span style={styles.lostHostRegion}>{h.region}</span>
                        <span style={styles.lostHostAttack}>{vuln.name}</span>
                      </div>
                      <div style={styles.lostDetail}>
                        <span style={styles.lostDetailLabel}>FAILED AT</span>
                        <span style={styles.lostDetailVal}>{failedStage.label} (Stage {h.stageIndex})</span>
                      </div>
                      {applied.length > 0 && (
                        <div style={styles.lostDetail}>
                          <span style={styles.lostDetailLabel}>APPLIED</span>
                          <span style={{ ...styles.lostDetailVal, color: C.green }}>{applied.join(", ")}</span>
                        </div>
                      )}
                      {missing.length > 0 && (
                        <div style={styles.lostDetail}>
                          <span style={styles.lostDetailLabel}>WOULD HELP</span>
                          <span style={{ ...styles.lostDetailVal, color: C.yellow }}>{missing.join(" or ")}</span>
                        </div>
                      )}
                      <div style={styles.lostTip}>
                        <span style={styles.lostTipIcon}>💡</span>
                        <span>
                          {applied.length === 0
                            ? `No mitigations were applied to ${h.name}. Always respond to every spawned host — even a single wrong action is better than none.`
                            : missing.length > 0
                            ? `The mitigations applied didn't satisfy the requirement for this stage. Check the Knowledge Base to learn which defenses stop "${failedStage.label}".`
                            : `Mitigations were applied but escalation wasn't stopped in time. Act faster on Stage ${h.stageIndex} threats — the timer is unforgiving.`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ ...styles.introFooter, gap: 12 }}>
                <button style={styles.introBtn} onClick={start}>↺ RETRY MISSION</button>
                <button
                  style={{ ...styles.introBtn, borderColor: C.purple, color: C.purple, textShadow: "none" }}
                  onClick={openAndScrollToKB}
                >▶ OPEN KNOWLEDGE BASE</button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  listItem: { fontSize: 11, color: "rgba(200,220,232,0.85)", marginBottom: 5, display: "flex", alignItems: "baseline", gap: 6 },
  mitreBadge: {
    flexShrink: 0,
    fontSize: 9,
    fontWeight: 700,
    color: C.cyan,
    border: `1px solid rgba(0,255,247,0.4)`,
    background: "rgba(0,255,247,0.07)",
    padding: "1px 5px",
    letterSpacing: "0.05em",
    textShadow: `0 0 6px rgba(0,255,247,0.5)`,
  },
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
    width: "min(100%, 570px)",
    aspectRatio: "1 / 1",
    margin: "0 auto",
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

  // ── Intro modal extras ─────────────────────────────────────────────────────
  introPanelGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
  },
  introPanelCard: {
    padding: "10px 12px",
    border: "1px solid rgba(0,255,247,0.15)",
    borderTop: `2px solid rgba(0,255,247,0.4)`,
    background: "rgba(0,255,247,0.025)",
  },
  introPanelTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: C.cyan,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: 6,
    textShadow: "0 0 8px rgba(0,255,247,0.4)",
  },
  introPanelDesc: {
    fontSize: 11,
    color: "rgba(154,180,192,0.75)",
    lineHeight: 1.55,
  },
  introStatusRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  introStatusChip: {
    display: "flex",
    flexDirection: "column",
    padding: "7px 10px",
    border: "1px solid rgba(154,180,192,0.1)",
    background: "rgba(0,0,0,0.2)",
  },
  introConditions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  introConditionWin: {
    flex: 1,
    minWidth: 200,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    border: "1px solid rgba(0,255,136,0.2)",
    borderLeft: "3px solid rgba(0,255,136,0.6)",
    background: "rgba(0,255,136,0.04)",
  },
  introConditionLose: {
    flex: 1,
    minWidth: 200,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    border: "1px solid rgba(255,0,60,0.2)",
    borderLeft: "3px solid rgba(255,0,60,0.6)",
    background: "rgba(255,0,60,0.04)",
  },

  // ── Penalty banner ─────────────────────────────────────────────────────────
  penaltyBanner: {
    margin: "10px 0 4px",
    border: `1px solid rgba(255,0,60,0.4)`,
    borderLeft: `3px solid ${C.red}`,
    background: "rgba(255,0,60,0.07)",
    padding: "9px 10px",
  },
  penaltyBannerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  penaltyBannerTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: C.red,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    textShadow: `0 0 8px rgba(255,0,60,0.5)`,
  },
  penaltyDismiss: {
    background: "none",
    border: "none",
    color: "rgba(255,100,100,0.6)",
    fontSize: 12,
    cursor: "pointer",
    padding: "0 2px",
    lineHeight: 1,
  },
  penaltyBannerBody: {
    fontSize: 11,
    color: "#ffbbbb",
    lineHeight: 1.6,
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
