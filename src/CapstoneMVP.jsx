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
