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
        attackerActions: [
          { label: "Beacon to C2",           mitreId: "T1071.001" },
          { label: "Drop loader",            mitreId: "T1059"     },
          { label: "Harvest browser tokens", mitreId: "T1539"     },
        ],
        requiredMitigationsAnyOf: ["quarantine"],
      },
      {
        stage: 1,
        label: "Persistence Established",
        timeLimitSec: 45,
        attackerActions: [
          { label: "Scheduled task",    mitreId: "T1053.005" },
          { label: "Credential dumping", mitreId: "T1003.001" },
          { label: "Disable AV",         mitreId: "T1562.001" },
        ],
        requiredMitigationsAnyOf: ["quarantine", "isolate_vlan"],
      },
      {
        stage: 2,
        label: "Lateral Movement",
        timeLimitSec: 55,
        attackerActions: [
          { label: "SMB spread attempt",  mitreId: "T1021.002" },
          { label: "RDP pivot",           mitreId: "T1021.001" },
          { label: "Token impersonation", mitreId: "T1134"     },
        ],
        requiredMitigationsAnyOf: ["quarantine", "block_lateral", "reimage"],
        maySpread: true,
      },
      {
        stage: 3,
        label: "Ransomware Trigger",
        timeLimitSec: 40,
        attackerActions: [
          { label: "Encrypt files",        mitreId: "T1486" },
          { label: "Delete shadow copies", mitreId: "T1490" },
          { label: "Extort",               mitreId: "T1491" },
        ],
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
        attackerActions: [
          { label: "Scan port 3389",       mitreId: "T1595.001" },
          { label: "Fingerprint host",     mitreId: "T1592"     },
          { label: "Enumerate usernames",  mitreId: "T1589.003" },
        ],
        requiredMitigationsAnyOf: ["disable_rdp", "vpn_only"],
      },
      {
        stage: 1,
        label: "Brute Force Underway",
        timeLimitSec: 50,
        attackerActions: [
          { label: "Password spraying",    mitreId: "T1110.003" },
          { label: "Credential stuffing",  mitreId: "T1110.004" },
        ],
        requiredMitigationsAnyOf: ["disable_rdp", "mfa", "block_ip"],
      },
      {
        stage: 2,
        label: "Remote Access Gained",
        timeLimitSec: 55,
        attackerActions: [
          { label: "Drop RAT",             mitreId: "T1219"     },
          { label: "Create admin user",    mitreId: "T1136.001" },
          { label: "Run PowerShell",       mitreId: "T1059.001" },
        ],
        requiredMitigationsAnyOf: ["isolate_vlan", "reimage"],
        maySpread: true,
      },
      {
        stage: 3,
        label: "Privilege Escalation",
        timeLimitSec: 45,
        attackerActions: [
          { label: "Dump LSASS",          mitreId: "T1003.001" },
          { label: "Steal tokens",        mitreId: "T1134"     },
          { label: "Pivot to file shares",mitreId: "T1039"     },
        ],
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
        attackerActions: [
          { label: "Scanning file shares",        mitreId: "T1083" },
          { label: "Dropping encryptor binary",   mitreId: "T1059" },
          { label: "Killing backup services",     mitreId: "T1562" },
        ],
        requiredMitigationsAnyOf: ["isolate_vlan", "quarantine"],
      },
      {
        stage: 1,
        label: "Shadow Copies Deleted",
        timeLimitSec: 45,
        attackerActions: [
          { label: "vssadmin delete shadows",  mitreId: "T1490" },
          { label: "Disable Windows Backup",   mitreId: "T1490" },
          { label: "Encrypt network drives",   mitreId: "T1486" },
        ],
        requiredMitigationsAnyOf: ["restore_backup", "reimage"],
      },
      {
        stage: 2,
        label: "Ransom Note Deployed",
        timeLimitSec: 40,
        attackerActions: [
          { label: "Drop ransom note",                   mitreId: "T1491" },
          { label: "Threaten data leak",                 mitreId: "T1486" },
          { label: "Demand cryptocurrency payment",      mitreId: "T1486" },
        ],
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
        attackerActions: [
          { label: "Open LSASS handle",         mitreId: "T1003.001" },
          { label: "Inject into process",       mitreId: "T1055"     },
          { label: "Memory dump in progress",   mitreId: "T1003.001" },
        ],
        requiredMitigationsAnyOf: ["run_edr", "mfa"],
      },
      {
        stage: 1,
        label: "Credentials Harvested",
        timeLimitSec: 50,
        attackerActions: [
          { label: "Extract NTLM hashes",    mitreId: "T1003.001" },
          { label: "Pass-the-Hash attack",   mitreId: "T1550.002" },
          { label: "Kerberoasting tickets",  mitreId: "T1558.003" },
        ],
        requiredMitigationsAnyOf: ["rotate_creds", "block_lateral"],
      },
      {
        stage: 2,
        label: "Account Takeover",
        timeLimitSec: 45,
        attackerActions: [
          { label: "Login with stolen credentials",    mitreId: "T1078"  },
          { label: "Create backdoor admin account",    mitreId: "T1136"  },
          { label: "Access sensitive data stores",     mitreId: "T1213"  },
        ],
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
        attackerActions: [
          { label: "Port 445 sweep",            mitreId: "T1046"  },
          { label: "Enumerate network shares",  mitreId: "T1135"  },
          { label: "Check ADMIN$ access",       mitreId: "T1021.002" },
        ],
        requiredMitigationsAnyOf: ["block_lateral", "isolate_vlan"],
      },
      {
        stage: 1,
        label: "Share Traversal Active",
        timeLimitSec: 50,
        attackerActions: [
          { label: "Access ADMIN$ share",    mitreId: "T1021.002" },
          { label: "Copy malware payload",   mitreId: "T1570"     },
          { label: "Execute via PsExec",     mitreId: "T1569.002" },
        ],
        requiredMitigationsAnyOf: ["block_lateral", "quarantine"],
      },
      {
        stage: 2,
        label: "Pivot Established",
        timeLimitSec: 45,
        attackerActions: [
          { label: "New foothold installed",              mitreId: "T1105"     },
          { label: "Beacon from pivot host",              mitreId: "T1071"     },
          { label: "Expanding access to more systems",    mitreId: "T1021.002" },
        ],
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
        attackerActions: [
          { label: "Backdoored dependency loaded",  mitreId: "T1195.001" },
          { label: "Obfuscated code executing",     mitreId: "T1027"     },
          { label: "Beacon to attacker C2",         mitreId: "T1071"     },
        ],
        requiredMitigationsAnyOf: ["quarantine", "notify_soc"],
      },
      {
        stage: 1,
        label: "Build System Compromised",
        timeLimitSec: 50,
        attackerActions: [
          { label: "Inject into CI/CD pipeline",  mitreId: "T1195.002" },
          { label: "Poison build artifacts",       mitreId: "T1554"     },
          { label: "Steal code signing keys",      mitreId: "T1552"     },
        ],
        requiredMitigationsAnyOf: ["reimage", "rotate_creds"],
      },
      {
        stage: 2,
        label: "Production Deployment",
        timeLimitSec: 40,
        attackerActions: [
          { label: "Backdoor in production",            mitreId: "T1554" },
          { label: "Silent data exfiltration",          mitreId: "T1020" },
          { label: "Persist across software updates",   mitreId: "T1554" },
        ],
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
        attackerActions: [
          { label: "SQL injection probing",    mitreId: "T1190" },
          { label: "XXE injection attempt",   mitreId: "T1190" },
          { label: "SSTI fuzzing",            mitreId: "T1190" },
          { label: "Directory traversal",     mitreId: "T1190" },
        ],
        requiredMitigationsAnyOf: ["waf_block", "patch_app"],
      },
      {
        stage: 1,
        label: "Remote Code Execution",
        timeLimitSec: 50,
        attackerActions: [
          { label: "Reverse shell spawned",          mitreId: "T1059"     },
          { label: "OS command injection successful",mitreId: "T1059"     },
          { label: "Malicious file upload",          mitreId: "T1505.003" },
        ],
        requiredMitigationsAnyOf: ["isolate_vlan", "patch_app"],
      },
      {
        stage: 2,
        label: "Web Shell Installed",
        timeLimitSec: 45,
        attackerActions: [
          { label: "Persistent web shell active",        mitreId: "T1505.003" },
          { label: "Upload additional attack tools",     mitreId: "T1105"     },
          { label: "Pivot to internal network",          mitreId: "T1021"     },
        ],
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
        attackerActions: [
          { label: "Enumerate public S3/Blob",    mitreId: "T1619"     },
          { label: "Download sensitive files",    mitreId: "T1530"     },
          { label: "Map IAM role policies",       mitreId: "T1526"     },
        ],
        requiredMitigationsAnyOf: ["fix_acl", "notify_soc"],
      },
      {
        stage: 1,
        label: "Data Exfiltration",
        timeLimitSec: 55,
        attackerActions: [
          { label: "Bulk data download",         mitreId: "T1537"     },
          { label: "Credential files stolen",    mitreId: "T1552.001" },
          { label: "API key material exposed",   mitreId: "T1552.007" },
        ],
        requiredMitigationsAnyOf: ["fix_acl", "rotate_creds"],
      },
      {
        stage: 2,
        label: "IAM Privilege Escalation",
        timeLimitSec: 45,
        attackerActions: [
          { label: "Create rogue admin IAM user",    mitreId: "T1098.001" },
          { label: "Attach administrator policy",    mitreId: "T1098"     },
          { label: "Launch rogue cloud instances",   mitreId: "T1578.002" },
        ],
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
        attackerActions: [
          { label: "Access outside normal hours",   mitreId: "T1078" },
          { label: "Unusual query volume",          mitreId: "T1213" },
          { label: "Accessing restricted data",     mitreId: "T1213" },
        ],
        requiredMitigationsAnyOf: ["run_edr", "notify_soc"],
      },
      {
        stage: 1,
        label: "Bulk Data Download",
        timeLimitSec: 55,
        attackerActions: [
          { label: "Mass file download detected",    mitreId: "T1213"     },
          { label: "Email forwarding rules created", mitreId: "T1114.003" },
          { label: "USB data transfer",              mitreId: "T1052.001" },
        ],
        requiredMitigationsAnyOf: ["revoke_access", "rotate_creds"],
      },
      {
        stage: 2,
        label: "Active Data Exfiltration",
        timeLimitSec: 45,
        attackerActions: [
          { label: "Upload to external cloud storage", mitreId: "T1567"  },
          { label: "Send to personal email",           mitreId: "T1048"  },
          { label: "Data sold to competitor",          mitreId: "T1567"  },
        ],
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
        attackerActions: [
          { label: "UDP flood initiated",         mitreId: "T1498.001" },
          { label: "SYN flood packets",           mitreId: "T1498.001" },
          { label: "DNS/NTP amplification attack",mitreId: "T1498.002" },
        ],
        requiredMitigationsAnyOf: ["rate_limit", "cdn_mitigation"],
      },
      {
        stage: 1,
        label: "Service Degraded",
        timeLimitSec: 45,
        attackerActions: [
          { label: "Exhaust connection table",    mitreId: "T1499.001" },
          { label: "Load balancer CPU 100%",      mitreId: "T1499.002" },
          { label: "HTTP flood (Layer 7)",        mitreId: "T1499.003" },
        ],
        requiredMitigationsAnyOf: ["cdn_mitigation", "block_ip"],
      },
      {
        stage: 2,
        label: "Service Down",
        timeLimitSec: 40,
        attackerActions: [
          { label: "Complete service outage",   mitreId: "T1499.002" },
          { label: "Failover overwhelmed",      mitreId: "T1498.001" },
          { label: "SLA breach imminent",       mitreId: "T1499.003" },
        ],
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
