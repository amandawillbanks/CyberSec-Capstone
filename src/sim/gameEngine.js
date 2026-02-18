// src/sim/gameEngine.js
import { INITIAL_HOSTS, VULNS } from "../CapstoneData.js";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// ── How many seconds each mitigation takes to apply ───────────────────────────
export const MITIGATION_APPLY_TIMES = {
  notify_soc:     2,
  block_ip:       3,
  disable_rdp:    3,
  rate_limit:     3,
  block_lateral:  4,
  vpn_only:       4,
  revoke_access:  4,
  fix_acl:        4,
  waf_block:      4,
  mfa:            5,
  quarantine:     5,
  cdn_mitigation: 5,
  isolate_vlan:   6,
  rotate_creds:   7,
  run_edr:        9,
  patch_app:      10,
  restore_backup: 12,
  reimage:        15,
};

const PENALTY_SEC = 20; // seconds stripped from timer on wrong action

/**
 * Apply the EFFECT of a completed mitigation (called when pending timer hits 0).
 * Handles status changes and stage-time bonuses.
 */
function completeMitigation(h, mitigationId) {
  const vuln = VULNS[h.vulnId];
  const stage = vuln.stages[h.stageIndex];

  let updated = {
    ...h,
    appliedMitigations: [...h.appliedMitigations, mitigationId],
    lastEvent: `✓ ${mitigationId} applied`,
  };

  // Containment status rules
  if (mitigationId === "quarantine")    updated.status = "quarantined";
  if (mitigationId === "disable_rdp")   updated.status = "safe";
  if (mitigationId === "revoke_access") updated.status = "quarantined";
  if (mitigationId === "patch_app")     updated.status = "safe";
  if (mitigationId === "fix_acl")       updated.status = "safe";
  if (mitigationId === "cdn_mitigation") updated.status = "safe";

  // Stage-requirement bonus
  const satisfied = stage?.requiredMitigationsAnyOf?.includes(mitigationId) ?? false;
  if (satisfied) {
    updated.stageTimeLeft = clamp(updated.stageTimeLeft + 20, 0, 120);
    if (updated.status === "warning") updated.status = "safe";
  }

  return updated;
}

/**
 * Build the initial hosts array.
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
    pendingMitigations: [],          // { id, timeLeft } — queued but not yet applied
    penaltyMessage: null,            // contextual explanation when wrong tool is used
    lastEvent: h.spawnDelaySec === 0 ? "Alert created" : `Threat incoming in ${h.spawnDelaySec}s`,
  }));
}

/**
 * Queue one mitigation on one host.
 * - Penalty mitigations: apply instantly but strip PENALTY_SEC from the timer.
 * - Normal mitigations: queue with an apply-time delay; award points immediately.
 * Returns { hosts: nextHosts, pointsAwarded }
 */
export function applyMitigationPure(hosts, hostId, mitigationId) {
  let pointsAwarded = 0;

  const nextHosts = hosts.map((h) => {
    if (h.id !== hostId) return h;
    // Skip if already applied or already in-flight
    if (h.appliedMitigations.includes(mitigationId)) return h;
    if (h.pendingMitigations.some((p) => p.id === mitigationId)) return h;

    const vuln = VULNS[h.vulnId];
    const stage = vuln.stages[h.stageIndex];

    // ── Penalty: wrong / overkill action ──────────────────────────────────
    if (stage.penaltyMitigations?.includes(mitigationId)) {
      const reason = stage.penaltyReasons?.[mitigationId]
        ?? `${mitigationId} is not effective at this stage.`;
      return {
        ...h,
        stageTimeLeft: Math.max(1, h.stageTimeLeft - PENALTY_SEC),
        lastEvent: `⚠ Wrong tool — escalation sped up by ${PENALTY_SEC}s!`,
        penaltyMessage: reason,
      };
    }

    // ── Normal: queue the mitigation ──────────────────────────────────────
    const m = vuln.mitigations?.find((x) => x.id === mitigationId);
    if (m) pointsAwarded += m.points;

    const applyTime = MITIGATION_APPLY_TIMES[mitigationId] ?? 4;

    return {
      ...h,
      pendingMitigations: [...h.pendingMitigations, { id: mitigationId, timeLeft: applyTime }],
      lastEvent: `⏳ ${mitigationId} in progress… (${applyTime}s)`,
    };
  });

  return { hosts: nextHosts, pointsAwarded };
}

/**
 * Clear the penalty message on one host (called when player dismisses the banner).
 */
export function clearPenaltyMessagePure(hosts, hostId) {
  return hosts.map((h) =>
    h.id === hostId ? { ...h, penaltyMessage: null } : h
  );
}

/**
 * One simulation tick.
 */
export function stepSimulationPure(prevHosts, gameState) {
  if (gameState !== "running") return prevHosts;

  // ── Phase 1: Spawn countdown ──────────────────────────────────────────────
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

  // ── Phase 2: Tick pending mitigations → apply completed ones ─────────────
  next = next.map((h) => {
    if (!h.pendingMitigations || h.pendingMitigations.length === 0) return h;

    const stillPending = [];
    const completed = [];

    for (const p of h.pendingMitigations) {
      const newTime = p.timeLeft - 1;
      if (newTime <= 0) completed.push(p.id);
      else stillPending.push({ ...p, timeLeft: newTime });
    }

    let updated = { ...h, pendingMitigations: stillPending };
    for (const mitigationId of completed) {
      updated = completeMitigation(updated, mitigationId);
    }
    return updated;
  });

  // ── Phase 3: Tick stage timers (uses updated appliedMitigations) ──────────
  next = next.map((h) => {
    if (!h.spawned) return h;
    if (h.status === "safe" || h.status === "quarantined") return h;

    const vuln = VULNS[h.vulnId];
    const stage = vuln.stages[h.stageIndex];
    const newTime = h.stageTimeLeft - 1;

    if (newTime > 0) return { ...h, stageTimeLeft: newTime };

    // Timer hit 0 — check satisfaction
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

    // Escalate
    const nextStageIndex = Math.min(h.stageIndex + 1, vuln.stages.length - 1);
    const escalatedStage = vuln.stages[nextStageIndex];
    const newStatus = nextStageIndex >= 2 ? "compromised" : "warning";

    return {
      ...h,
      stageIndex: nextStageIndex,
      status: newStatus,
      stageTimeLeft: escalatedStage.timeLimitSec,
      pendingMitigations: [],        // clear pending — new stage, new actions needed
      penaltyMessage: null,          // clear penalty message on escalation
      lastEvent: `Escalated to: ${escalatedStage.label}`,
    };
  });

  // ── Phase 4: Spread mechanic ──────────────────────────────────────────────
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
              pendingMitigations: [],
              lastEvent: "Infection spread: new alert created",
            }
          : h
      );
    }
  }

  return next;
}
