// src/sim/gameEngine.js
import { INITIAL_HOSTS, VULNS } from "../CapstoneData.js";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * Build the initial hosts array (same logic you had in makeInitialState()).
 */
export function makeInitialHosts() {
  return INITIAL_HOSTS.map((h) => ({
    ...h,
    spawned: h.spawnDelaySec === 0,
    spawnCountdown: h.spawnDelaySec,
    status: h.spawnDelaySec === 0 ? "warning" : "pending",
    stageIndex: 0,
    stageTimeLeft: VULNS[h.vulnId].stages[0].timeLimitSec,
    appliedMitigations: [],
    lastEvent: h.spawnDelaySec === 0 ? "Alert created" : `Threat incoming in ${h.spawnDelaySec}s`,
  }));
}

/**
 * Apply one mitigation to one host.
 * Returns { hosts: nextHosts, pointsAwarded }
 *
 * IMPORTANT: points are awarded based on the target host's vuln (not selectedHost).
 */
export function applyMitigationPure(hosts, hostId, mitigationId) {
  let pointsAwarded = 0;

  const nextHosts = hosts.map((h) => {
    if (h.id !== hostId) return h;
    if (h.appliedMitigations.includes(mitigationId)) return h;

    const vuln = VULNS[h.vulnId];
    const stage = vuln.stages[h.stageIndex];

    // Award points based on this host's vuln mitigation list
    const m = vuln.mitigations?.find((x) => x.id === mitigationId);
    if (m) pointsAwarded += m.points;

    const updated = {
      ...h,
      appliedMitigations: [...h.appliedMitigations, mitigationId],
      lastEvent: `Mitigation applied: ${mitigationId}`,
    };

    // Containment rules (same as your current component)
    if (mitigationId === "quarantine") updated.status = "quarantined";
    if (mitigationId === "disable_rdp") updated.status = "safe";
    if (mitigationId === "revoke_access") updated.status = "quarantined"; // insider threat
    if (mitigationId === "patch_app") updated.status = "safe"; // web app rce
    if (mitigationId === "fix_acl") updated.status = "safe"; // cloud misconfig
    if (mitigationId === "cdn_mitigation") updated.status = "safe"; // ddos

    // If required mitigation met for THIS stage, stabilize
    const satisfied = stage?.requiredMitigationsAnyOf?.includes(mitigationId) ?? false;
    if (satisfied) {
      updated.stageTimeLeft = clamp(updated.stageTimeLeft + 20, 0, 120);
      if (updated.status === "warning") updated.status = "safe";
    }

    return updated;
  });

  return { hosts: nextHosts, pointsAwarded };
}

/**
 * One simulation tick.
 * IMPORTANT: pass gameState in, so this can run headless later.
 */
export function stepSimulationPure(prevHosts, gameState) {
  if (gameState !== "running") return prevHosts;

  // ── Spawn countdown: flip pending hosts to active when timer hits 0 ──
  let next = prevHosts.map((h) => {
    if (h.spawned) return h;
    const newCountdown = h.spawnCountdown - 1;
    if (newCountdown <= 0) {
      return {
        ...h,
        spawned: true,
        spawnCountdown: 0,
        status: "warning",
        lastEvent: "⚠️ New threat detected!",
      };
    }
    return { ...h, spawnCountdown: newCountdown };
  });

  // ── Tick down timers and escalate if needed (spawned hosts only) ──
  next = next.map((h) => {
    if (!h.spawned) return h;
    if (h.status === "safe" || h.status === "quarantined") return h;

    const vuln = VULNS[h.vulnId];
    const stage = vuln.stages[h.stageIndex];
    const newTime = h.stageTimeLeft - 1;

    if (newTime > 0) return { ...h, stageTimeLeft: newTime };

    // timer ran out: did we satisfy any requirement for this stage?
    const satisfied = stage.requiredMitigationsAnyOf.some((req) =>
      h.appliedMitigations.includes(req)
    );

    if (satisfied) {
      return {
        ...h,
        status: h.status === "warning" ? "safe" : h.status,
        stageTimeLeft: vuln.stages[h.stageIndex].timeLimitSec,
        lastEvent: `Stage stabilized: ${stage.label}`,
      };
    }

    // escalate stage
    const nextStageIndex = Math.min(h.stageIndex + 1, vuln.stages.length - 1);
    const escalatedStage = vuln.stages[nextStageIndex];
    const newStatus = nextStageIndex >= 2 ? "compromised" : "warning";

    return {
      ...h,
      stageIndex: nextStageIndex,
      status: newStatus,
      stageTimeLeft: escalatedStage.timeLimitSec,
      lastEvent: `Escalated to: ${escalatedStage.label}`,
    };
  });

  // ── Simple spread mechanic ──
  const compromisedSpreaders = next.filter((h) => {
    const vuln = VULNS[h.vulnId];
    const stage = vuln.stages[h.stageIndex];
    return h.status === "compromised" && stage?.maySpread;
  });

  if (compromisedSpreaders.length > 0) {
    const safeTargets = next.filter((h) => h.spawned && h.status === "safe");
    if (safeTargets.length > 0) {
      const target = safeTargets[0];
      next = next.map((h) =>
        h.id === target.id
          ? {
              ...h,
              status: "warning",
              stageIndex: 0,
              stageTimeLeft: VULNS[h.vulnId].stages[0].timeLimitSec,
              lastEvent: "Infection spread: new alert created",
            }
          : h
      );
    }
  }

  return next;
}
