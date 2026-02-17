// src/capstoneData.js

export const VULNS = {
  // ── 1. Phishing Malware ──────────────────────────────────────────────────
  phishing_malware: {
    id: "phishing_malware",
    name: "Phishing Malware",
    description:
      "User executed a malicious attachment. Risk of persistence + lateral movement.",
    stages: [
      {
        stage: 0,
        label: "Initial Compromise",
        timeLimitSec: 50,
        attackerActions: ["Beacon to C2", "Drop loader", "Harvest browser tokens"],
        requiredMitigationsAnyOf: ["quarantine"],
      },
      {
        stage: 1,
        label: "Persistence Established",
        timeLimitSec: 45,
        attackerActions: ["Scheduled task", "Credential dumping", "Disable AV"],
        requiredMitigationsAnyOf: ["quarantine", "isolate_vlan"],
      },
      {
        stage: 2,
        label: "Lateral Movement",
        timeLimitSec: 55,
        attackerActions: ["SMB spread attempt", "RDP pivot", "Token impersonation"],
        requiredMitigationsAnyOf: ["quarantine", "block_lateral", "reimage"],
        maySpread: true,
      },
      {
        stage: 3,
        label: "Ransomware Trigger",
        timeLimitSec: 40,
        attackerActions: ["Encrypt files", "Delete shadow copies", "Extort"],
        requiredMitigationsAnyOf: ["reimage", "restore_backup"],
      },
    ],
    mitigations: [
      { id: "quarantine",    label: "Quarantine Endpoint",          points: 50 },
      { id: "isolate_vlan",  label: "Isolate VLAN/Subnet",          points: 35 },
      { id: "block_lateral", label: "Block Lateral Movement",        points: 30 },
      { id: "rotate_creds",  label: "Rotate Credentials",           points: 20 },
      { id: "run_edr",       label: "Run EDR Scan",                  points: 15 },
      { id: "reimage",       label: "Reimage Device",               points: 40 },
      { id: "restore_backup",label: "Restore From Backup",          points: 25 },
      { id: "notify_soc",    label: "Notify SOC / Open Incident",   points: 10 },
    ],
  },

  // ── 2. Exposed RDP ───────────────────────────────────────────────────────
  exposed_rdp: {
    id: "exposed_rdp",
    name: "Exposed RDP",
    description:
      "RDP is reachable from the internet. High risk of brute force + takeover.",
    stages: [
      {
        stage: 0,
        label: "Exposure Detected",
        timeLimitSec: 55,
        attackerActions: ["Scan port 3389", "Fingerprint host", "Enumerate usernames"],
        requiredMitigationsAnyOf: ["disable_rdp", "vpn_only"],
      },
      {
        stage: 1,
        label: "Brute Force Underway",
        timeLimitSec: 50,
        attackerActions: ["Password spraying", "Credential stuffing"],
        requiredMitigationsAnyOf: ["disable_rdp", "mfa", "block_ip"],
      },
      {
        stage: 2,
        label: "Remote Access Gained",
        timeLimitSec: 55,
        attackerActions: ["Drop RAT", "Create admin user", "Run PowerShell"],
        requiredMitigationsAnyOf: ["isolate_vlan", "reimage"],
        maySpread: true,
      },
      {
        stage: 3,
        label: "Privilege Escalation",
        timeLimitSec: 45,
        attackerActions: ["Dump LSASS", "Steal tokens", "Pivot to file shares"],
        requiredMitigationsAnyOf: ["reimage"],
      },
    ],
    mitigations: [
      { id: "disable_rdp",  label: "Disable RDP",                  points: 45 },
      { id: "vpn_only",     label: "VPN-Only Access",              points: 35 },
      { id: "mfa",          label: "Enforce MFA",                  points: 30 },
      { id: "block_ip",     label: "Block Attacker IP",            points: 20 },
      { id: "isolate_vlan", label: "Isolate VLAN/Subnet",          points: 35 },
      { id: "reimage",      label: "Reimage Device",               points: 40 },
      { id: "notify_soc",   label: "Notify SOC / Open Incident",   points: 10 },
    ],
  },

  // ── 3. Ransomware ────────────────────────────────────────────────────────
  ransomware: {
    id: "ransomware",
    name: "Ransomware",
    description:
      "Active encryption detected on endpoint. Immediate containment critical to prevent data loss.",
    stages: [
      {
        stage: 0,
        label: "Encryption Initiated",
        timeLimitSec: 50,
        attackerActions: ["Scanning file shares", "Dropping encryptor binary", "Killing backup services"],
        requiredMitigationsAnyOf: ["isolate_vlan", "quarantine"],
      },
      {
        stage: 1,
        label: "Shadow Copies Deleted",
        timeLimitSec: 45,
        attackerActions: ["vssadmin delete shadows", "Disable Windows Backup", "Encrypt network drives"],
        requiredMitigationsAnyOf: ["restore_backup", "reimage"],
      },
      {
        stage: 2,
        label: "Ransom Note Deployed",
        timeLimitSec: 40,
        attackerActions: ["Drop ransom note", "Threaten data leak", "Demand cryptocurrency payment"],
        requiredMitigationsAnyOf: ["restore_backup", "reimage"],
        maySpread: true,
      },
    ],
    mitigations: [
      { id: "isolate_vlan",   label: "Isolate VLAN/Subnet",        points: 40 },
      { id: "quarantine",     label: "Quarantine Endpoint",        points: 50 },
      { id: "restore_backup", label: "Restore From Backup",        points: 45 },
      { id: "reimage",        label: "Reimage Device",             points: 35 },
      { id: "notify_soc",     label: "Notify SOC / Open Incident", points: 10 },
      { id: "run_edr",        label: "Run EDR Scan",               points: 15 },
    ],
  },

  // ── 4. Credential Dumping ────────────────────────────────────────────────
  credential_dumping: {
    id: "credential_dumping",
    name: "Credential Dumping",
    description:
      "Attacker harvesting credentials from memory. Identity compromise imminent.",
    stages: [
      {
        stage: 0,
        label: "LSASS Access Detected",
        timeLimitSec: 55,
        attackerActions: ["Open LSASS handle", "Inject into process", "Memory dump in progress"],
        requiredMitigationsAnyOf: ["run_edr", "mfa"],
      },
      {
        stage: 1,
        label: "Credentials Harvested",
        timeLimitSec: 50,
        attackerActions: ["Extract NTLM hashes", "Pass-the-Hash attack", "Kerberoasting tickets"],
        requiredMitigationsAnyOf: ["rotate_creds", "block_lateral"],
      },
      {
        stage: 2,
        label: "Account Takeover",
        timeLimitSec: 45,
        attackerActions: ["Login with stolen credentials", "Create backdoor admin account", "Access sensitive data stores"],
        requiredMitigationsAnyOf: ["rotate_creds", "reimage"],
        maySpread: true,
      },
    ],
    mitigations: [
      { id: "run_edr",       label: "Run EDR Scan",                points: 20 },
      { id: "mfa",           label: "Enforce MFA",                 points: 30 },
      { id: "rotate_creds",  label: "Rotate All Credentials",      points: 50 },
      { id: "block_lateral", label: "Block Lateral Movement",      points: 35 },
      { id: "reimage",       label: "Reimage Device",              points: 40 },
      { id: "notify_soc",    label: "Notify SOC / Open Incident",  points: 10 },
    ],
  },

  // ── 5. Lateral Movement (SMB) ────────────────────────────────────────────
  lateral_movement_smb: {
    id: "lateral_movement_smb",
    name: "Lateral Movement (SMB)",
    description:
      "Attacker pivoting through the network via SMB shares and admin credentials.",
    stages: [
      {
        stage: 0,
        label: "SMB Scan Detected",
        timeLimitSec: 55,
        attackerActions: ["Port 445 sweep", "Enumerate network shares", "Check ADMIN$ access"],
        requiredMitigationsAnyOf: ["block_lateral", "isolate_vlan"],
      },
      {
        stage: 1,
        label: "Share Traversal Active",
        timeLimitSec: 50,
        attackerActions: ["Access ADMIN$ share", "Copy malware payload", "Execute via PsExec"],
        requiredMitigationsAnyOf: ["block_lateral", "quarantine"],
      },
      {
        stage: 2,
        label: "Pivot Established",
        timeLimitSec: 45,
        attackerActions: ["New foothold installed", "Beacon from pivot host", "Expanding access to more systems"],
        requiredMitigationsAnyOf: ["isolate_vlan", "reimage"],
        maySpread: true,
      },
    ],
    mitigations: [
      { id: "block_lateral", label: "Block Lateral Movement",      points: 45 },
      { id: "isolate_vlan",  label: "Isolate VLAN/Subnet",         points: 35 },
      { id: "quarantine",    label: "Quarantine Endpoint",         points: 50 },
      { id: "run_edr",       label: "Run EDR Scan",                points: 15 },
      { id: "reimage",       label: "Reimage Device",              points: 40 },
      { id: "notify_soc",    label: "Notify SOC / Open Incident",  points: 10 },
    ],
  },

  // ── 6. Supply Chain ──────────────────────────────────────────────────────
  supply_chain: {
    id: "supply_chain",
    name: "Supply Chain Attack",
    description:
      "Compromised third-party package detected in build pipeline. Multi-host risk.",
    stages: [
      {
        stage: 0,
        label: "Malicious Package Detected",
        timeLimitSec: 60,
        attackerActions: ["Backdoored dependency loaded", "Obfuscated code executing", "Beacon to attacker C2"],
        requiredMitigationsAnyOf: ["quarantine", "notify_soc"],
      },
      {
        stage: 1,
        label: "Build System Compromised",
        timeLimitSec: 50,
        attackerActions: ["Inject into CI/CD pipeline", "Poison build artifacts", "Steal code signing keys"],
        requiredMitigationsAnyOf: ["reimage", "rotate_creds"],
      },
      {
        stage: 2,
        label: "Production Deployment",
        timeLimitSec: 40,
        attackerActions: ["Backdoor in production", "Silent data exfiltration", "Persist across software updates"],
        requiredMitigationsAnyOf: ["reimage", "restore_backup"],
        maySpread: true,
      },
    ],
    mitigations: [
      { id: "quarantine",     label: "Quarantine Affected Systems",      points: 45 },
      { id: "notify_soc",     label: "Notify SOC / Open Incident",       points: 10 },
      { id: "reimage",        label: "Reimage & Rebuild Clean",          points: 50 },
      { id: "rotate_creds",   label: "Rotate Signing Keys & Creds",      points: 35 },
      { id: "restore_backup", label: "Restore Clean Build Artifact",     points: 30 },
      { id: "run_edr",        label: "Run EDR Scan",                     points: 15 },
    ],
  },

  // ── 7. Web App RCE ───────────────────────────────────────────────────────
  web_app_rce: {
    id: "web_app_rce",
    name: "Web App RCE",
    description:
      "Remote code execution via web application vulnerability. Server actively compromised.",
    stages: [
      {
        stage: 0,
        label: "Injection Attempt Detected",
        timeLimitSec: 55,
        attackerActions: ["SQL injection probing", "XXE injection attempt", "SSTI fuzzing", "Directory traversal"],
        requiredMitigationsAnyOf: ["waf_block", "patch_app"],
      },
      {
        stage: 1,
        label: "Remote Code Execution",
        timeLimitSec: 50,
        attackerActions: ["Reverse shell spawned", "OS command injection successful", "Malicious file upload"],
        requiredMitigationsAnyOf: ["isolate_vlan", "patch_app"],
      },
      {
        stage: 2,
        label: "Web Shell Installed",
        timeLimitSec: 45,
        attackerActions: ["Persistent web shell active", "Upload additional attack tools", "Pivot to internal network"],
        requiredMitigationsAnyOf: ["reimage", "isolate_vlan"],
        maySpread: true,
      },
    ],
    mitigations: [
      { id: "waf_block",    label: "Enable WAF / Block Rules",     points: 35 },
      { id: "patch_app",    label: "Patch Application",            points: 45 },
      { id: "isolate_vlan", label: "Isolate Server VLAN",          points: 35 },
      { id: "reimage",      label: "Reimage Server",               points: 50 },
      { id: "notify_soc",   label: "Notify SOC / Open Incident",   points: 10 },
      { id: "run_edr",      label: "Run EDR Scan",                 points: 15 },
    ],
  },

  // ── 8. Cloud Misconfiguration ────────────────────────────────────────────
  cloud_misconfig: {
    id: "cloud_misconfig",
    name: "Cloud Misconfiguration",
    description:
      "Publicly exposed cloud storage and weak IAM policies detected. Data exfiltration underway.",
    stages: [
      {
        stage: 0,
        label: "Public Bucket Exposed",
        timeLimitSec: 65,
        attackerActions: ["Enumerate public S3/Blob", "Download sensitive files", "Map IAM role policies"],
        requiredMitigationsAnyOf: ["fix_acl", "notify_soc"],
      },
      {
        stage: 1,
        label: "Data Exfiltration",
        timeLimitSec: 55,
        attackerActions: ["Bulk data download", "Credential files stolen", "API key material exposed"],
        requiredMitigationsAnyOf: ["fix_acl", "rotate_creds"],
      },
      {
        stage: 2,
        label: "IAM Privilege Escalation",
        timeLimitSec: 45,
        attackerActions: ["Create rogue admin IAM user", "Attach administrator policy", "Launch rogue cloud instances"],
        requiredMitigationsAnyOf: ["rotate_creds", "mfa"],
        maySpread: true,
      },
    ],
    mitigations: [
      { id: "fix_acl",      label: "Fix Bucket ACL / Permissions",    points: 45 },
      { id: "notify_soc",   label: "Notify SOC / Open Incident",      points: 10 },
      { id: "rotate_creds", label: "Rotate Cloud Credentials",        points: 50 },
      { id: "mfa",          label: "Enforce MFA on Cloud IAM",        points: 30 },
      { id: "run_edr",      label: "Run Cloud Security Scan",         points: 20 },
      { id: "quarantine",   label: "Quarantine Affected Resources",   points: 35 },
    ],
  },

  // ── 9. Insider Threat ────────────────────────────────────────────────────
  insider_threat: {
    id: "insider_threat",
    name: "Insider Threat",
    description:
      "Anomalous user behavior detected — potential malicious insider or compromised account.",
    stages: [
      {
        stage: 0,
        label: "Anomalous Access Pattern",
        timeLimitSec: 65,
        attackerActions: ["Access outside normal hours", "Unusual query volume", "Accessing restricted data"],
        requiredMitigationsAnyOf: ["run_edr", "notify_soc"],
      },
      {
        stage: 1,
        label: "Bulk Data Download",
        timeLimitSec: 55,
        attackerActions: ["Mass file download detected", "Email forwarding rules created", "USB data transfer"],
        requiredMitigationsAnyOf: ["revoke_access", "rotate_creds"],
      },
      {
        stage: 2,
        label: "Active Data Exfiltration",
        timeLimitSec: 45,
        attackerActions: ["Upload to external cloud storage", "Send to personal email", "Data sold to competitor"],
        requiredMitigationsAnyOf: ["revoke_access", "quarantine"],
      },
    ],
    mitigations: [
      { id: "run_edr",       label: "Run UEBA / EDR Analysis",     points: 20 },
      { id: "notify_soc",    label: "Notify SOC / Open Incident",  points: 10 },
      { id: "revoke_access", label: "Revoke User Access",          points: 55 },
      { id: "rotate_creds",  label: "Rotate Credentials",          points: 35 },
      { id: "quarantine",    label: "Quarantine Endpoint",         points: 45 },
      { id: "isolate_vlan",  label: "Isolate VLAN/Subnet",         points: 30 },
    ],
  },

  // ── 10. DDoS ─────────────────────────────────────────────────────────────
  ddos: {
    id: "ddos",
    name: "DDoS Attack",
    description:
      "Distributed denial of service attack targeting infrastructure. Service availability critical.",
    stages: [
      {
        stage: 0,
        label: "Traffic Spike Detected",
        timeLimitSec: 50,
        attackerActions: ["UDP flood initiated", "SYN flood packets", "DNS/NTP amplification attack"],
        requiredMitigationsAnyOf: ["rate_limit", "cdn_mitigation"],
      },
      {
        stage: 1,
        label: "Service Degraded",
        timeLimitSec: 45,
        attackerActions: ["Exhaust connection table", "Load balancer CPU 100%", "HTTP flood (Layer 7)"],
        requiredMitigationsAnyOf: ["cdn_mitigation", "block_ip"],
      },
      {
        stage: 2,
        label: "Service Down",
        timeLimitSec: 40,
        attackerActions: ["Complete service outage", "Failover overwhelmed", "SLA breach imminent"],
        requiredMitigationsAnyOf: ["cdn_mitigation", "rate_limit"],
      },
    ],
    mitigations: [
      { id: "rate_limit",     label: "Enable Rate Limiting",           points: 35 },
      { id: "cdn_mitigation", label: "Activate CDN DDoS Mitigation",   points: 55 },
      { id: "block_ip",       label: "Block Attacker IP Ranges",       points: 25 },
      { id: "notify_soc",     label: "Notify SOC / Open Incident",     points: 10 },
      { id: "isolate_vlan",   label: "Isolate Affected Subnet",        points: 30 },
      { id: "run_edr",        label: "Run Traffic Analysis",           points: 15 },
    ],
  },
};

// xPct/yPct are derived from real geographic coordinates:
//   lon = (xPct/100)*360 - 180  →  xPct = (lon + 180) / 360 * 100
//   lat = 90 - (yPct/100)*180   →  yPct = (90 - lat) / 180 * 100
//
// spawnDelaySec: seconds after game start before this host becomes active.
// Hosts spawn one at a time so the player isn't overwhelmed immediately.
export const INITIAL_HOSTS = [
  // ── Immediate spawns ──
  {
    id: "host-atl",
    name: "ATL-WKS-014",
    region: "Atlanta",
    xPct: 26.6,  // lon ≈ -84.4
    yPct: 31.3,  // lat ≈  33.7
    vulnId: "phishing_malware",
    spawnDelaySec: 0,
  },
  {
    id: "host-lon",
    name: "LON-SRV-221",
    region: "London",
    xPct: 50.0,  // lon ≈  -0.1
    yPct: 21.4,  // lat ≈  51.5
    vulnId: "exposed_rdp",
    spawnDelaySec: 0,
  },

  // ── Wave 2 (45 s) ────
  {
    id: "host-tyo",
    name: "TYO-DB-090",
    region: "Tokyo",
    xPct: 88.8,  // lon ≈ 139.7
    yPct: 30.2,  // lat ≈  35.7
    vulnId: "ransomware",
    spawnDelaySec: 45,
  },

  // ── Wave 3 (90 s) ────
  {
    id: "host-fra",
    name: "FRA-APP-301",
    region: "Frankfurt",
    xPct: 52.4,  // lon ≈   8.7
    yPct: 22.2,  // lat ≈  50.1
    vulnId: "credential_dumping",
    spawnDelaySec: 90,
  },

  // ── Wave 4 (135 s) ───
  {
    id: "host-nyc",
    name: "NYC-WEB-445",
    region: "New York",
    xPct: 29.4,  // lon ≈ -74.0
    yPct: 27.4,  // lat ≈  40.7
    vulnId: "web_app_rce",
    spawnDelaySec: 135,
  },

  // ── Wave 5 (180 s) ───
  {
    id: "host-sin",
    name: "SIN-CLO-012",
    region: "Singapore",
    xPct: 78.8,  // lon ≈ 103.8
    yPct: 49.3,  // lat ≈   1.3
    vulnId: "cloud_misconfig",
    spawnDelaySec: 180,
  },

  // ── Wave 6 (225 s) ───
  {
    id: "host-syd",
    name: "SYD-NET-887",
    region: "Sydney",
    xPct: 92.0,  // lon ≈ 151.2
    yPct: 68.8,  // lat ≈ -33.9
    vulnId: "lateral_movement_smb",
    spawnDelaySec: 225,
  },

  // ── Wave 7 (270 s) ───
  {
    id: "host-sao",
    name: "SAO-INS-334",
    region: "São Paulo",
    xPct: 37.1,  // lon ≈ -46.6
    yPct: 63.1,  // lat ≈ -23.5
    vulnId: "insider_threat",
    spawnDelaySec: 270,
  },

  // ── Wave 8 (315 s) ───
  {
    id: "host-mum",
    name: "MUM-SUP-091",
    region: "Mumbai",
    xPct: 70.2,  // lon ≈  72.8
    yPct: 39.4,  // lat ≈  19.1
    vulnId: "supply_chain",
    spawnDelaySec: 315,
  },

  // ── Wave 9 (360 s) ───
  {
    id: "host-chi",
    name: "CHI-DDS-201",
    region: "Chicago",
    xPct: 25.7,  // lon ≈ -87.6
    yPct: 26.7,  // lat ≈  41.9
    vulnId: "ddos",
    spawnDelaySec: 360,
  },
];
