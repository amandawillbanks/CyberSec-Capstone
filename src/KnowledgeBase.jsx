// src/KnowledgeBase.jsx
import { useState } from "react";
import { VULNS } from "./CapstoneData.js";

// ── Domain tags ──────────────────────────────────────────────────────────────
const DOMAIN_MAP = {
  phishing_malware:     { label: "Endpoint",          color: "#e07b54" },
  exposed_rdp:          { label: "Endpoint",          color: "#e07b54" },
  ransomware:           { label: "Endpoint / Impact", color: "#e05454" },
  credential_dumping:   { label: "Identity",          color: "#c37fd4" },
  lateral_movement_smb: { label: "Network",           color: "#4ab8e8" },
  supply_chain:         { label: "Multi-host",        color: "#e8a84a" },
  web_app_rce:          { label: "Server",            color: "#4ae89a" },
  cloud_misconfig:      { label: "Cloud",             color: "#4a9eda" },
  insider_threat:       { label: "Identity",          color: "#c37fd4" },
  ddos:                 { label: "Infrastructure",    color: "#ff6b6b" },
};

// ── Deep educational content per attack ─────────────────────────────────────
// Explains the "what" and "why" without giving away game answers.
const ATTACK_EDUCATION = {
  phishing_malware: {
    overview:
      "Phishing is the #1 initial access vector in real-world breaches. Attackers craft convincing emails — impersonating IT, HR, or executives — to trick users into opening malicious attachments or clicking links that silently execute code.",
    howItWorks:
      "Once a user opens the malicious file, malware installs itself and connects back to an attacker-controlled server called a C2 (Command & Control). From there, the attacker issues commands remotely — the infected machine becomes a puppet. The longer it runs undetected, the deeper the attacker embeds themselves.",
    defenderMindset:
      "The key question at every stage: can the attacker still communicate outward and reach other systems? Cutting that communication channel is often more important than cleaning the malware immediately.",
    stageContext: {
      0: "The attacker has a foothold but is still quiet — just checking in with their C2 and deciding what to do next. This is the best time to act. The infection hasn't spread and persistence hasn't been established.",
      1: "The attacker is digging in. They've created mechanisms to survive reboots and may be harvesting credentials from memory. Cleaning this thoroughly requires more than just deleting the malware file — the attacker has left multiple backdoors.",
      2: "The attacker is actively using this machine to reach other systems on the network. Every moment of delay means more machines are potentially at risk. Containment of this host is urgent to stop the spread.",
      3: "Files are being encrypted. This is the impact phase — the attacker's goal is now data destruction or extortion. The primary focus shifts from stopping the attacker to recovering the data.",
    },
  },

  exposed_rdp: {
    overview:
      "Remote Desktop Protocol (RDP) is a legitimate Windows feature for remote administration — but when exposed to the internet, it's one of the most actively exploited attack surfaces in existence. Automated scanners probe every IP on the internet for open port 3389.",
    howItWorks:
      "Once attackers find an open RDP service, they attempt brute force (trying thousands of username/password combinations) or use credentials stolen from other breaches (credential stuffing). A successful login gives them full graphical access — as if they were physically sitting at the machine.",
    defenderMindset:
      "Ask: does RDP need to be accessible from the internet at all? Most of the time, the answer is no. The attack surface here is the exposure itself — reducing or gating that access eliminates the risk without touching the system itself.",
    stageContext: {
      0: "The attacker has discovered the exposed service and is gathering intelligence — learning the OS version, checking whether accounts exist, and planning their brute force strategy. The window to close this door is still open.",
      1: "Active password guessing is underway. Without account lockouts or rate limiting, attackers can try millions of combinations. Even complex passwords become vulnerable over time. The question is whether you detect and block the attempt before they succeed.",
      2: "The attacker is now logged in with valid credentials. They have the same access as the account they compromised. They're working quickly to escalate privileges and persist before being noticed — their activity blends in with legitimate use.",
      3: "The attacker has gained elevated, persistent access. They may now have administrator-level control and are likely staging to access other systems or exfiltrate data.",
    },
  },

  ransomware: {
    overview:
      "Ransomware encrypts a victim's files and demands payment for the decryption key. It's one of the most financially devastating attack types — ransom demands regularly reach millions of dollars, and even paying offers no guarantee of recovery.",
    howItWorks:
      "Ransomware uses strong cryptography (typically AES-256 combined with RSA) to lock files. Without the attacker's private key, decryption is mathematically impossible. Modern ransomware operators also steal data before encrypting — giving them a second extortion lever: pay or we publish your data.",
    defenderMindset:
      "Time is the enemy here. Every second the ransomware runs, more files are lost. Isolation stops the encryption from continuing and prevents it from reaching network shares. But the real defense is what existed before the attack — do you have clean, tested, offline backups?",
    stageContext: {
      0: "Encryption has started. The ransomware is scanning directories and encrypting files sequentially. Stopping it now limits how many files are lost — speed of response directly determines the scale of damage.",
      1: "The attacker is destroying your recovery options. Volume Shadow Copies are Windows' built-in local backup mechanism. Once deleted, restoring individual files from the local system becomes impossible. The attacker knows this and targets it deliberately.",
      2: "The attack is complete from the attacker's perspective. The ransom note has been dropped and they're waiting. The defender now faces an operational decision: is recovery from backup possible, or must you negotiate? Paying ransoms is never guaranteed to work and funds criminal activity.",
    },
  },

  credential_dumping: {
    overview:
      "Credential dumping extracts usernames and password hashes (or plaintext passwords) from a compromised system's memory or registry. These credentials are then used to impersonate legitimate users and move laterally across the network undetected.",
    howItWorks:
      "Windows stores credentials in a process called LSASS (Local Security Authority Subsystem Service) to enable seamless single sign-on. Attackers use tools like Mimikatz to read this memory and extract password hashes, which can be used directly in 'Pass-the-Hash' attacks without even needing to crack them. Because attackers are using legitimate OS features, this technique is called 'living off the land.'",
    defenderMindset:
      "Once credentials are extracted, you can no longer trust them. Every account on the compromised machine should be treated as potentially known to the attacker. The goal becomes invalidating those credentials faster than the attacker can use them.",
    stageContext: {
      0: "The attacker is targeting LSASS — a high-privilege process that security tools monitor closely. If EDR or endpoint security alerts on this activity, acting immediately can prevent extraction. The credentials are still safe at this point.",
      1: "Credentials have been extracted. The attacker now has account material — hashes or plaintext passwords — for accounts that were logged into this machine. These credentials work everywhere those accounts are valid across your network.",
      2: "The attacker is using stolen credentials to log in as legitimate users. Their traffic looks identical to normal employee activity, making detection extremely difficult without behavioral analytics. Every account that may have been cached on this machine should be considered compromised.",
    },
  },

  lateral_movement_smb: {
    overview:
      "Lateral movement is how attackers spread from their initial foothold toward their true targets — domain controllers, databases, financial systems. SMB (Server Message Block) is a network file-sharing protocol that, when combined with stolen credentials, enables attackers to move freely across internal networks.",
    howItWorks:
      "Using compromised credentials and tools like PsExec or native Windows commands, attackers connect to the 'ADMIN$' share (a hidden share that maps to the Windows directory) on remote machines, copy payloads, and execute them. This is why network segmentation and limiting who can reach what internally is so important — an attacker with one foothold shouldn't be able to reach everything.",
    defenderMindset:
      "The principle of least privilege and network segmentation are your primary defenses here. Ask: should this workstation be able to reach that server over SMB? In most environments, the answer is no — and restricting that communication kills this attack vector.",
    stageContext: {
      0: "The attacker is performing internal reconnaissance — scanning for other reachable machines and file shares. Unusual internal port scanning (especially on port 445) is a key indicator. Isolating the source host at this stage stops the spread before it begins.",
      1: "The attacker is actively copying malware to other systems using network shares. Blocking internal SMB traffic or isolating the compromised host prevents the payload from executing on new targets.",
      2: "A new foothold exists on a different machine. The attacker now has multiple positions in your network. Incident response must identify and contain all compromised machines, not just the original source.",
    },
  },

  supply_chain: {
    overview:
      "Supply chain attacks compromise the software, libraries, or vendors that organizations trust — rather than targeting the organization directly. By poisoning a trusted component, attackers can affect thousands of victims simultaneously. The 2020 SolarWinds attack used this technique to compromise hundreds of major corporations and US government agencies.",
    howItWorks:
      "Attackers infiltrate a software vendor, contribute malicious code to an open-source package, or compromise a build system. Their code gets signed and distributed as part of a legitimate update. Victims install the update trusting the source, not knowing it contains a backdoor. Detection is extremely difficult because the software is genuinely signed and comes from a trusted source.",
    defenderMindset:
      "Trust nothing blindly — even signed software from known vendors. The question to ask: what did this dependency/update actually need access to, and what is it now doing that it shouldn't be? Isolation limits blast radius when a trusted component turns out to be compromised.",
    stageContext: {
      0: "A malicious package or dependency has been identified running in your environment. The code is active but may not yet have established full attacker control. Time is critical — isolation limits what data or systems it can access.",
      1: "The attacker has reached build or CI/CD infrastructure. This is a catastrophic escalation — anything built or deployed from this point forward could carry the backdoor. Clean rebuilds from verified source and infrastructure replacement are essential.",
      2: "Compromised artifacts have reached production. Every system that received a recent deployment or update from this pipeline should be treated as potentially compromised and must be investigated.",
    },
  },

  web_app_rce: {
    overview:
      "Remote Code Execution (RCE) via web application vulnerabilities allows an attacker to run arbitrary operating system commands on a web server. It's one of the highest-severity vulnerability classes because it gives an attacker direct server access through what looks like normal web traffic.",
    howItWorks:
      "Attackers probe web applications for input fields and parameters that aren't properly validated — testing for SQL injection, command injection, XML External Entity (XXE), or server-side template injection. A successful exploit lets them issue OS commands that run as the web server process. They then upload a 'web shell' — a small script that gives persistent, browser-accessible command execution.",
    defenderMindset:
      "The web application is the attack surface. Defense in depth applies here: a Web Application Firewall can block known attack patterns before they reach the app; patching closes the vulnerability itself; network segmentation limits what the compromised server can reach even if exploitation succeeds.",
    stageContext: {
      0: "The attacker is testing — probing input fields with malicious payloads to find something that works. A WAF or anomaly detection can catch these patterns before a successful exploit. No code has been executed yet.",
      1: "Exploitation was successful — the attacker has a shell on your server. They're working fast to escalate privileges and upload a persistent backdoor before the connection is detected or dropped.",
      2: "A web shell is installed. The attacker now has an always-available backdoor that blends in with normal web traffic. Without file integrity monitoring, it's very hard to find. The server's code and file system must be treated as untrusted.",
    },
  },

  cloud_misconfig: {
    overview:
      "Cloud misconfiguration is the leading cause of cloud data breaches. Cloud platforms give developers enormous power, but a single wrong permission setting can expose sensitive data to anyone on the internet — and unlike on-premises systems, misconfigured cloud resources are globally accessible the moment they're created.",
    howItWorks:
      "Attackers run automated tools that continuously scan for public S3 buckets, Azure Blobs, or Google Cloud Storage. They also look for exposed API keys in public code repositories, enumerate IAM roles, and probe for over-permissive policies. A single set of leaked cloud credentials can give access to an entire organization's infrastructure.",
    defenderMindset:
      "In the cloud, identity IS the perimeter. The principle of least privilege is critical — every service, user, and role should have only the minimum permissions needed. Treat leaked cloud credentials like a lost master key: rotate them immediately, then investigate what was accessed.",
    stageContext: {
      0: "A cloud resource is publicly accessible. Attackers are downloading everything they can find — configuration files, credentials, database backups, customer records. Correcting the permissions immediately limits further access, but anything already downloaded must be treated as compromised.",
      1: "Data is being exfiltrated. If any credentials, API keys, or access tokens were in the exposed storage — even briefly — they must be considered known to the attacker and rotated immediately.",
      2: "The attacker may now have cloud administrator access. From this position they can create new accounts, access all services, delete resources, exfiltrate more data, or pivot to on-premises systems through cloud-connected services.",
    },
  },

  insider_threat: {
    overview:
      "Insider threats originate from people who already have legitimate access — employees, contractors, or partners. They're the hardest threat to detect because the attacker's traffic looks like normal user activity. Insider threats can be malicious (intentional sabotage or theft) or negligent (an employee whose credentials were stolen).",
    howItWorks:
      "A malicious insider uses their existing credentials and access rights to reach data or systems beyond their job function — no exploitation required. Detection relies on behavioral analytics: establishing a baseline of what's normal for this person, then flagging deviations. The challenge is that behavioral anomalies can have innocent explanations, requiring careful investigation.",
    defenderMindset:
      "The principle of least privilege is your primary defense — users should only have access to what they genuinely need for their role. When suspicious activity is detected, the investigation question is: does this person have a legitimate reason for this behavior? Evidence preservation is critical if the answer is no.",
    stageContext: {
      0: "Unusual access patterns have been flagged. The user is accessing data, systems, or times outside their normal behavior. This could be innocent — a project change, overtime work — or the beginning of an exfiltration. Investigation must happen before assuming intent.",
      1: "Large volumes of data are being moved or downloaded. This is a high-confidence signal of exfiltration intent. The priority is stopping the transfer before data leaves the organization, while preserving forensic evidence.",
      2: "Data is being sent outside the organization. At this stage, preserving evidence for legal or HR action is critical — chain of custody matters. Access must be revoked to stop further damage, and the full scope of what was accessed must be determined.",
    },
  },

  ddos: {
    overview:
      "Distributed Denial of Service (DDoS) attacks flood a target's infrastructure with traffic to make services unavailable to legitimate users. Attackers use botnets — networks of thousands of compromised computers — to generate traffic from many sources at once, making simple IP blocking ineffective.",
    howItWorks:
      "DDoS attacks come in two main forms: volumetric attacks flood bandwidth with UDP/ICMP packets; application-layer attacks (Layer 7) send legitimate-looking HTTP requests faster than the server can process them. Amplification attacks abuse protocols like DNS or NTP — a small spoofed request generates a much larger response directed at the target, multiplying the traffic volume 10-100x.",
    defenderMindset:
      "You can't stop the traffic at your own network edge once a full DDoS is underway — by then it's already consuming your bandwidth. Effective defense happens upstream: CDN and DDoS mitigation services absorb traffic before it reaches your infrastructure. Rate limiting can blunt smaller attacks or application-layer floods.",
    stageContext: {
      0: "A traffic spike is detected. It's important to distinguish between a DDoS and a legitimate traffic surge (e.g., a viral event). Upstream mitigation and rate limiting can absorb or redirect attack traffic before it degrades service.",
      1: "Services are degrading. The attack is consuming bandwidth, connection table capacity, or server CPU. Each new connection — even from legitimate users — is costing your servers resources they can't afford to spend.",
      2: "Services are offline. The response now focuses on recovery: routing traffic through scrubbing centers, failing over to secondary infrastructure, engaging your ISP for upstream BGP-level filtering, and communicating status to users.",
    },
  },
};

// ── Conceptual explanations for mitigations ──────────────────────────────────
// These explain WHY a mitigation works — the security principle behind it.
// Deliberately avoids naming which stage or attack it "solves."
const MITIGATION_CONCEPTS = {
  quarantine: {
    concept: "Network Isolation",
    why: "Attackers rely on network connectivity for everything — receiving commands from their C2 server, exfiltrating data, and spreading to other systems. Cutting off a host's network access removes all of these capabilities simultaneously. Even if malware is still running on the machine, it becomes blind and deaf to the attacker.",
  },
  isolate_vlan: {
    concept: "Network Segmentation",
    why: "The principle of least privilege applied to networks. If hosts are segmented into VLANs, a compromise in one segment can't automatically reach another. The attacker's ability to move laterally depends on what the compromised host can 'see' on the network — shrinking that view shrinks the blast radius.",
  },
  block_lateral: {
    concept: "Internal Firewall Rules",
    why: "Most workstations don't need to communicate with each other over administrative protocols like SMB or RDP — only servers do. Blocking these protocols between endpoint segments stops an attacker from using a compromised workstation as a launch point to infect servers or other workstations.",
  },
  rotate_creds: {
    concept: "Credential Invalidation",
    why: "Stolen credentials are only useful as long as they're valid. Forcing a password change and invalidating all active sessions means the attacker's stolen credentials immediately stop working. This is the digital equivalent of changing your locks after someone steals a key copy.",
  },
  run_edr: {
    concept: "Endpoint Detection & Response",
    why: "EDR tools continuously monitor process behavior, memory access, and network connections for malicious patterns. Running a scan surfaces what the attacker is doing — what processes they're running, what files they've touched, what connections they've made. Understanding the scope of compromise is essential to effective response.",
  },
  reimage: {
    concept: "Clean Slate Recovery",
    why: "When you can't be certain you've found every backdoor, persistence mechanism, or implant an attacker has installed, wiping the system and rebuilding from a known-good image is the only guaranteed way to evict them. It's drastic, but certainty has value in incident response.",
  },
  restore_backup: {
    concept: "Data Recovery",
    why: "Backups are the ultimate safety net against data destruction or ransomware. Their value depends on three factors: how recent they are (recovery point), how quickly they can be restored (recovery time), and whether they're isolated from the attacked environment (an attacker-accessible backup can be encrypted too).",
  },
  notify_soc: {
    concept: "Incident Response Escalation",
    why: "A Security Operations Center brings dedicated analysts, threat intelligence, forensic tools, and incident response playbooks. Escalating ensures the incident is handled with the right expertise and resources — and creates the formal documentation trail needed for legal, regulatory, and insurance purposes.",
  },
  disable_rdp: {
    concept: "Attack Surface Reduction",
    why: "You can't be attacked through a service that isn't running. If RDP isn't needed for a machine's function, disabling it removes the attack vector entirely. Every unnecessary service running on a machine is a potential entry point — minimizing the attack surface is a foundational security principle.",
  },
  vpn_only: {
    concept: "Access Control via Authentication Gateway",
    why: "A VPN requires authentication before granting access to internal resources. Requiring VPN for RDP means an attacker must first compromise a valid VPN account before they can even attempt to reach the RDP service — adding a layer of authentication and removing the service from public internet exposure.",
  },
  mfa: {
    concept: "Multi-Factor Authentication",
    why: "Passwords alone can be stolen, guessed, or phished. A second factor (an authenticator app, hardware token, or SMS code) means stolen passwords are not enough to log in. Even if the attacker has the correct username and password, they can't complete authentication without something they physically possess.",
  },
  block_ip: {
    concept: "Perimeter Blocking",
    why: "Blocking known attacker IP addresses at the firewall stops traffic from those sources before it reaches any internal systems. This is a short-term tactical control — sophisticated attackers rotate IPs — but it immediately interrupts an ongoing attack and buys time for more durable defenses.",
  },
  revoke_access: {
    concept: "Access Termination",
    why: "For threats involving legitimate user accounts — whether a compromised employee account or a malicious insider — the most direct containment is removing the account's access entirely. This ends all active sessions and prevents new ones, stopping any ongoing data transfer or system access immediately.",
  },
  patch_app: {
    concept: "Vulnerability Remediation",
    why: "A patch closes the specific security flaw being exploited. Without the underlying vulnerability, the attack vector ceases to exist. Patching is the durable fix — other controls like WAFs treat symptoms, but patching addresses the root cause.",
  },
  fix_acl: {
    concept: "Access Control Correction",
    why: "Cloud storage permissions (Access Control Lists) define who can read or write data. Setting a resource to private means only explicitly authorized identities can access it — the public internet cannot. Correcting this immediately stops ongoing unauthorized access, though data already accessed cannot be recalled.",
  },
  waf_block: {
    concept: "Application-Layer Filtering",
    why: "A Web Application Firewall sits in front of your application and inspects HTTP traffic for known malicious patterns — SQL injection syntax, command injection attempts, path traversal strings. It acts as a filter that blocks attacks before they reach vulnerable code, buying time to patch the underlying vulnerability.",
  },
  rate_limit: {
    concept: "Traffic Throttling",
    why: "Rate limiting caps how many requests a single source can make per second. This is effective against both brute force attacks (limiting how fast passwords can be guessed) and application-layer DDoS (limiting how fast any IP can generate load). It reduces the attacker's throughput without completely blocking legitimate traffic.",
  },
  cdn_mitigation: {
    concept: "Upstream Traffic Scrubbing",
    why: "CDN DDoS mitigation services have global infrastructure that can absorb massive traffic volumes — far more than your own servers could handle. Traffic is routed through scrubbing centers that distinguish attack traffic from legitimate requests, forwarding only clean traffic to your origin. This defense happens upstream, before the traffic reaches your infrastructure.",
  },
};

// ── Plain-language explanations for every attacker action in the game ────────
const ACTION_GLOSSARY = {
  // Phishing / general malware
  "Beacon to C2":              "The malware quietly 'checks in' with the attacker's Command & Control server over the internet — like a soldier radioing base. It receives instructions and confirms the attacker still has access.",
  "Drop loader":               "A small piece of code (the 'loader') is installed whose only job is to download and launch the real malware. This two-step approach helps avoid antivirus detection.",
  "Harvest browser tokens":    "Browsers store login session cookies so you don't have to re-enter passwords. The attacker steals these tokens to log into sites (email, banking, cloud apps) as you — no password needed.",
  "Scheduled task":            "Creates a Windows Scheduled Task that re-launches the malware every time the machine reboots. Deleting the malware file won't fix it — the task brings it back.",
  "Credential dumping":        "Extracts usernames and password hashes from Windows memory (LSASS process). These hashes can be cracked offline or used directly to authenticate on other machines.",
  "Disable AV":                "Attempts to turn off, bypass, or blind the antivirus software so it won't detect or block further attack activity.",
  "SMB spread attempt":        "Tries to copy the malware to other machines on the local network using Windows file-sharing (SMB, port 445) — like a worm spreading from machine to machine.",
  "RDP pivot":                 "Uses Remote Desktop Protocol to log into another internal machine using stolen credentials, effectively teleporting the attack to a new system.",
  "Token impersonation":       "Steals a logged-in user's Windows authentication token (an in-memory key proving who you are) and uses it to impersonate that user without needing their password.",
  "Encrypt files":             "The ransomware begins locking files using strong encryption. Without the attacker's decryption key, the files become permanently inaccessible.",
  "Delete shadow copies":      "Destroys Windows' built-in backup snapshots (Volume Shadow Copies) using 'vssadmin delete shadows'. This eliminates the easiest recovery path.",
  "Extort":                    "The attacker delivers ransom demands — usually via a text file dropped on the desktop — threatening to keep files locked or publicly leak data unless cryptocurrency is paid.",

  // RDP
  "Scan port 3389":            "Automated scanners probe every internet IP address looking for machines with RDP's default port (3389) open — like checking every door in a city to see which ones are unlocked.",
  "Fingerprint host":          "Identifies the OS version, patch level, and configuration of the target machine to plan the most effective attack approach.",
  "Enumerate usernames":       "Discovers valid account names on the machine — this narrows guessing from any possible username down to only ones that exist, making brute force much faster.",
  "Password spraying":         "Tries one or two common passwords (like 'Password1') against many accounts rather than many passwords against one account — this avoids triggering account lockout policies.",
  "Credential stuffing":       "Uses username/password combinations stolen from previous data breaches (e.g. leaked databases). Many people reuse passwords, so breach credentials often work elsewhere.",
  "Drop RAT":                  "Installs a Remote Access Trojan — malware that gives persistent backdoor access. Even if RDP is later closed, the attacker can still get back in through the RAT.",
  "Create admin user":         "Creates a hidden administrator account (often named to look normal) that the attacker controls — a backup door they can use even if the compromised account is disabled.",
  "Run PowerShell":            "Uses Windows' built-in PowerShell scripting engine to download and execute further attack tools directly from the internet, often without writing files to disk.",
  "Dump LSASS":                "Reads the memory of the Windows process that stores credentials (LSASS — Local Security Authority Subsystem Service) to extract password hashes and Kerberos tickets.",
  "Steal tokens":              "Captures authentication tokens from active sessions — these act like a temporary pass that proves identity without a password, and can be used on other systems.",
  "Pivot to file shares":      "Moves to shared network drives (like department file servers) to access sensitive documents, configuration files, or data belonging to other users.",

  // Ransomware
  "Scanning file shares":      "Maps out all reachable shared drives and folders on the network to maximize what gets encrypted — targeting the most valuable or widely used data first.",
  "Dropping encryptor binary": "Deploys the actual ransomware program to the target system. This is the weapon itself — everything before was preparation.",
  "Killing backup services":   "Stops backup software (Windows Backup, Veeam, etc.) from running so new recovery points cannot be created during the attack.",
  "vssadmin delete shadows":   "Runs this built-in Windows command to permanently destroy all Volume Shadow Copy backups — the quickest way to eliminate local recovery options.",
  "Disable Windows Backup":    "Turns off Windows' native backup service, preventing automatic recovery points from being created.",
  "Encrypt network drives":    "Extends encryption from the infected machine to mounted network drives — affecting files belonging to many users across the organization at once.",
  "Drop ransom note":          "Places a text or HTML file (often named 'HOW_TO_DECRYPT.txt') in every encrypted folder explaining how to pay the ransom to receive the decryption key.",
  "Threaten data leak":        "Pressures the victim by claiming sensitive data was copied before encryption (double extortion). Even if backups are available, the threat of public data exposure adds pressure to pay.",
  "Demand cryptocurrency payment": "Requests payment in untraceable cryptocurrency (Bitcoin, Monero) in exchange for the decryption key. Cryptocurrency is used because transfers are irreversible and hard to trace.",

  // Credential dumping
  "Open LSASS handle":         "Directly opens a handle to the LSASS process — the Windows component responsible for storing credentials in memory. This is the first step to reading credential data.",
  "Inject into process":       "Embeds malicious code into a trusted running process (like explorer.exe or svchost.exe) to hide activity from security tools that monitor process behavior.",
  "Memory dump in progress":   "Copies the full contents of LSASS memory to a file for offline analysis — extracting all cached credentials, hashes, and tickets stored there.",
  "Extract NTLM hashes":       "Pulls the cryptographic NTLM representation of passwords from memory. These hashes can be cracked offline using powerful hardware, or used directly in Pass-the-Hash attacks.",
  "Pass-the-Hash attack":      "Uses a password hash directly to authenticate on other systems without cracking it first. Windows NTLM authentication accepts the hash itself as proof of identity.",
  "Kerberoasting tickets":     "Requests Kerberos service tickets from Active Directory for service accounts — these encrypted tickets can be taken offline and cracked to reveal service account passwords.",
  "Login with stolen credentials": "Uses harvested usernames and passwords (or hashes) to authenticate on systems as a legitimate user — making the attacker's activity look indistinguishable from normal use.",
  "Create backdoor admin account": "Registers a new hidden administrator account under attacker control — ensuring continued access even if the original compromised account is detected and disabled.",
  "Access sensitive data stores": "Uses the compromised account's permissions to read databases, secret management systems, file repositories, or cloud vaults that the stolen identity has access to.",

  // Lateral movement (SMB)
  "Port 445 sweep":            "Scans every machine on the internal network for open port 445 (Windows SMB) — identifying which systems could potentially be accessed using the attacker's stolen credentials.",
  "Enumerate network shares":  "Lists available shared folders and drives on each discovered machine — identifying which ones contain valuable data or can be used to spread further.",
  "Check ADMIN$ access":       "Tests whether the attacker's credentials grant access to the hidden administrative share (ADMIN$) — which exists on every Windows machine and provides full system access.",
  "Access ADMIN$ share":       "Connects to the hidden ADMIN$ share using admin credentials, giving file system access equivalent to being an administrator on that machine.",
  "Copy malware payload":      "Places a copy of the attack tool or malware onto the newly accessed machine via the file share, staging it for execution.",
  "Execute via PsExec":        "Uses Microsoft's PsExec utility (or an equivalent) to remotely execute the copied payload on the target machine — achieving code execution without physically touching the system.",
  "New foothold installed":    "Confirms the attack is now running on an additional machine — the attacker has a second active position in the network.",
  "Beacon from pivot host":    "The newly compromised machine establishes its own C2 connection, making the attacker's access independent — even if the original machine is cleaned.",
  "Expanding access to more systems": "Uses the second compromised machine to repeat the scanning and spread process, moving further into the network from a new vantage point.",

  // Supply chain
  "Backdoored dependency loaded": "A software library (npm package, Python module, etc.) used by the application has been secretly modified to include malicious code — it runs every time the app starts.",
  "Obfuscated code executing": "The malicious code within the compromised package runs but is intentionally written to look like normal program behavior, making it very hard to detect through code review.",
  "Beacon to attacker C2":     "The application itself begins communicating with the attacker's server — because the malicious code runs in the context of a trusted application, firewalls may not block it.",
  "Inject into CI/CD pipeline": "The attacker gains write access to the continuous integration/deployment system — meaning they can modify what code gets built and deployed across the entire organization.",
  "Poison build artifacts":    "New software builds now contain attacker code baked in. Every machine that installs the update becomes infected without any user action.",
  "Steal code signing keys":   "Takes the private cryptographic keys used to digitally sign software releases — allowing the attacker to release malicious software that appears officially signed and trusted.",
  "Backdoor in production":    "Every production system running the affected software now executes attacker-controlled code on startup — the compromise is now organization-wide.",
  "Silent data exfiltration":  "Customer records, source code, API keys, and secrets are quietly sent to the attacker's infrastructure — occurring alongside normal application traffic and hard to detect.",
  "Persist across software updates": "Because the poisoned code is in the source or build pipeline, each new software update re-introduces the malicious code — persistence survives patches and reinstalls.",

  // Web app RCE
  "SQL injection probing":     "Sends malformed database query syntax (like ' OR 1=1 --) in form fields or URLs to test whether user input is inserted directly into database queries without sanitization.",
  "XXE injection attempt":     "Submits specially crafted XML that instructs the server's XML parser to read local files (like /etc/passwd) or make HTTP requests to internal services.",
  "SSTI fuzzing":              "Injects template engine expressions (like {{7*7}}) into input fields to test whether the server evaluates them — if it does, arbitrary code execution may be possible.",
  "Directory traversal":       "Uses ../ sequences in file path parameters to attempt to access files outside the intended web directory — like reading server configuration or credentials files.",
  "Reverse shell spawned":     "The compromised server initiates an outbound connection to the attacker's machine, opening an interactive command shell. Outbound connections are less likely to be blocked by firewalls.",
  "OS command injection successful": "Injected commands are being executed by the server's operating system — the attacker can now run any system command with the web server's privileges.",
  "Malicious file upload":     "A file (disguised as an image or document) containing server-side code (a web shell) has been uploaded and can now be accessed via a URL to execute commands.",
  "Persistent web shell active": "A backdoor script is accessible at a normal-looking URL — the attacker can send commands to it from any browser, making it a persistent remote access point.",
  "Upload additional attack tools": "Uses the web shell to place additional hacking utilities (credential dumpers, scanners, lateral movement tools) on the compromised server for further attack stages.",
  "Pivot to internal network": "Uses the web server — which sits at the boundary between the internet and internal network — as a jumping-off point to attack internal systems that aren't directly internet-exposed.",

  // Cloud misconfig
  "Enumerate public S3/Blob":  "Uses cloud provider APIs or tools to list the contents of storage buckets that are incorrectly configured as publicly accessible — no credentials required.",
  "Download sensitive files":  "Retrieves files from the exposed storage — potentially including database backups, configuration files with credentials, customer data, or source code.",
  "Map IAM role policies":     "Reads cloud Identity & Access Management configurations to understand which identities have which permissions — building a map for privilege escalation.",
  "Bulk data download":        "Systematically downloads large volumes of data, usually scripted to grab everything available before security teams notice and close the exposure.",
  "Credential files stolen":   "Retrieves files that contain credentials — .env files, aws_credentials, private keys, or connection strings — enabling access to additional systems and services.",
  "API key material exposed":  "Finds hardcoded cloud API keys in source files or configuration — these keys provide programmatic access to cloud services with whatever permissions the key holder has.",
  "Create rogue admin IAM user": "Creates a new cloud user with administrator privileges under attacker control — establishing persistent cloud access that survives password resets on legitimate accounts.",
  "Attach administrator policy": "Grants the rogue account a policy with full ('AdministratorAccess') permissions — enabling complete control of all cloud resources, data, and configurations.",
  "Launch rogue cloud instances": "Spins up virtual machines at the victim's expense — commonly used for cryptocurrency mining or as infrastructure for further attacks.",

  // Insider threat
  "Access outside normal hours":    "The account is active at unusual times (e.g. 2 AM) when the legitimate user shouldn't be working — a behavioral indicator flagged by User and Entity Behavior Analytics (UEBA).",
  "Unusual query volume":           "Running far more database queries than the user's job function would require — a sign of bulk data access or reconnaissance, detectable through query logging.",
  "Accessing restricted data":      "Reading files, records, or systems that the user has no legitimate business reason to access — detectable through data access logging and DLP systems.",
  "Mass file download detected":    "Bulk downloading of files to a local machine or external storage device — flagged by Data Loss Prevention (DLP) tools monitoring file movement.",
  "Email forwarding rules created": "Auto-forward rules are set up to copy all incoming or outgoing email to an external personal account — a classic data exfiltration technique.",
  "USB data transfer":              "Files are being copied to a USB drive or other removable storage — detectable by endpoint agents and DLP tools monitoring device activity.",
  "Upload to external cloud storage": "Corporate data is being sent to personal cloud storage (Dropbox, Google Drive) — typically flagged by web proxies or DLP solutions monitoring outbound traffic.",
  "Send to personal email":         "Sensitive documents are being forwarded to a personal email address — detectable through email DLP and outbound email scanning.",
  "Data sold to competitor":        "The ultimate impact — data has left the organization and been transferred to a third party. At this stage the breach is complete and legal/regulatory consequences begin.",

  // DDoS
  "UDP flood initiated":            "Massive volumes of UDP packets are sent to exhaust available bandwidth. Because UDP is connectionless, the server must process every packet individually before discarding it.",
  "SYN flood packets":              "Exploits the TCP three-way handshake by sending thousands of SYN requests per second without completing connections — filling the server's connection table with half-open connections.",
  "DNS/NTP amplification attack":   "Sends small requests to misconfigured public DNS or NTP servers with the victim's IP as the 'return address' — the servers send large responses to the victim, amplifying attack traffic 50-100x.",
  "Exhaust connection table":       "Fills the server's finite connection tracking table so new legitimate connections are dropped — the server isn't down but can't accept new visitors.",
  "Load balancer CPU 100%":         "Overwhelms the load balancer's processing capacity. Even if individual backend servers could handle the load, traffic can't reach them.",
  "HTTP flood (Layer 7)":           "Sends valid-looking HTTP requests at massive volume — harder to block than network-layer floods because the traffic looks legitimate and requires the server to process each request.",
  "Complete service outage":        "The target system is fully unreachable — 100% of connection attempts fail. Users receive timeouts or connection refused errors.",
  "Failover overwhelmed":           "Backup or redundant systems (DR sites, secondary load balancers) become overwhelmed as well — the attack volume exceeds the total capacity of all fallback infrastructure.",
  "SLA breach imminent":            "The service's uptime agreement with customers is about to be violated, triggering financial penalties, legal consequences, and reputational damage.",
};

const VULN_LIST = Object.values(VULNS);

export default function KnowledgeBase({ onClose, inline = false }) {
  const [selectedId, setSelectedId] = useState(VULN_LIST[0].id);
  const selected = VULNS[selectedId];
  const domain = DOMAIN_MAP[selectedId];
  const edu = ATTACK_EDUCATION[selectedId];

  const modalStyle = inline
    ? { ...styles.modal, width: "100%", height: "auto", maxHeight: "60vh", borderRadius: 8 }
    : styles.modal;

  const modalContent = (
    <div style={modalStyle} onClick={inline ? undefined : (e) => e.stopPropagation()}>

      {/* ── Header ── */}
      <div style={styles.modalHeader}>
        <div>
          <div style={styles.modalTitle}>Knowledge Base</div>
          <div style={styles.modalSubtitle}>
            Learn how each attack works and why defenses matter — figure out the right response yourself.
          </div>
        </div>
        <button style={styles.closeBtn} onClick={onClose}>✕ Close</button>
      </div>

      <div style={styles.body}>

        {/* ── Left sidebar ── */}
        <nav style={styles.sidebar}>
          {VULN_LIST.map((v, i) => {
            const dom = DOMAIN_MAP[v.id];
            const isActive = v.id === selectedId;
            return (
              <button
                key={v.id}
                style={{ ...styles.sideItem, ...(isActive ? styles.sideItemActive : {}) }}
                onClick={() => setSelectedId(v.id)}
              >
                <span style={styles.sideNum}>{i + 1}</span>
                <span style={styles.sideText}>
                  <span style={styles.sideName}>{v.name}</span>
                  <span style={{ ...styles.sideDomain, color: dom.color }}>{dom.label}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* ── Right content pane ── */}
        <div style={styles.content}>

          {/* Title + domain */}
          <div style={styles.contentHeader}>
            <div style={styles.contentTitle}>{selected.name}</div>
            <span style={{ ...styles.domainBadge, borderColor: domain.color, color: domain.color }}>
              {domain.label}
            </span>
          </div>

          {/* Overview */}
          <div style={styles.sectionTitle}>What Is This Attack?</div>
          <p style={styles.bodyText}>{edu?.overview}</p>

          {/* How it works */}
          <div style={styles.sectionTitle}>How Attackers Execute It</div>
          <p style={styles.bodyText}>{edu?.howItWorks}</p>

          {/* Defender mindset */}
          <div style={styles.infoBox}>
            <div style={styles.infoBoxLabel}>Defender Mindset</div>
            <p style={styles.infoBoxText}>{edu?.defenderMindset}</p>
          </div>

          {/* ── Attack Progression ── */}
          <div style={styles.sectionTitle}>Attack Progression</div>
          <div style={styles.stagesGrid}>
            {selected.stages.map((s) => (
              <div key={s.stage} style={styles.stageCard}>
                <div style={styles.stageHeader}>
                  <span style={styles.stageLabel}>Stage {s.stage}: {s.label}</span>
                  <span style={styles.stageTimer}>⏱ {s.timeLimitSec}s</span>
                </div>

                <div style={styles.stageSubtitle}>What the attacker is doing:</div>
                <ul style={styles.list}>
                  {s.attackerActions.map((a) => (
                    <li key={a} style={styles.attackItem}>
                      <span style={styles.dot}>●</span>
                      <span>
                        <span style={styles.actionName}>{a}</span>
                        {ACTION_GLOSSARY[a] && (
                          <span style={styles.actionDesc}>{ACTION_GLOSSARY[a]}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {edu?.stageContext?.[s.stage] && (
                  <div style={styles.stageContext}>
                    {edu.stageContext[s.stage]}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Defensive Options ── */}
          <div style={styles.sectionTitle}>Defensive Options</div>
          <p style={styles.bodyTextSmall}>
            The following actions are available for this attack type. Consider the security
            concept behind each one and decide which applies to what the attacker is currently doing.
          </p>
          <div style={styles.mitGrid}>
            {selected.mitigations.map((m) => {
              const concept = MITIGATION_CONCEPTS[m.id];
              return (
                <div key={m.id} style={styles.mitCard}>
                  <div style={styles.mitLabel}>{m.label}</div>
                  {concept && (
                    <>
                      <div style={styles.mitConcept}>{concept.concept}</div>
                      <div style={styles.mitDesc}>{concept.why}</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );

  if (inline) {
    return <div style={{ margin: "0 10px 10px" }}>{modalContent}</div>;
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      {modalContent}
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.80)",
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    width: "min(1100px, 96vw)",
    height: "min(820px, 92vh)",
    background: "#0d1424",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  // Header
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    flexShrink: 0,
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: "#fff" },
  modalSubtitle: { fontSize: 12, opacity: 0.55, marginTop: 2, maxWidth: 520 },
  closeBtn: {
    padding: "7px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.07)",
    color: "white",
    cursor: "pointer",
    fontSize: 13,
    flexShrink: 0,
  },

  // Body split
  body: { display: "flex", flex: 1, overflow: "hidden" },

  // Sidebar
  sidebar: {
    width: 215,
    flexShrink: 0,
    borderRight: "1px solid rgba(255,255,255,0.08)",
    overflowY: "auto",
    padding: "8px 0",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  sideItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 14px",
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.60)",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
  },
  sideItemActive: {
    background: "rgba(74,158,218,0.12)",
    color: "#fff",
    borderLeft: "3px solid #4a9eda",
    paddingLeft: 11,
  },
  sideNum: { fontSize: 10, fontWeight: 700, opacity: 0.45, minWidth: 16 },
  sideText: { display: "flex", flexDirection: "column", gap: 2 },
  sideName: { fontSize: 12, fontWeight: 600 },
  sideDomain: { fontSize: 10 },

  // Content pane
  content: { flex: 1, overflowY: "auto", padding: "20px 26px", color: "#fff" },
  contentHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
  contentTitle: { fontSize: 22, fontWeight: 700 },
  domainBadge: {
    padding: "3px 10px",
    borderRadius: 999,
    border: "1px solid",
    fontSize: 11,
    fontWeight: 600,
  },

  // Section title
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.09em",
    color: "#4a9eda",
    marginTop: 20,
    marginBottom: 8,
  },

  // Body text
  bodyText: { fontSize: 13, lineHeight: 1.7, opacity: 0.82, margin: "0 0 4px 0" },
  bodyTextSmall: { fontSize: 12, lineHeight: 1.6, opacity: 0.65, margin: "0 0 12px 0" },

  // Defender mindset callout
  infoBox: {
    marginTop: 14,
    marginBottom: 4,
    padding: "12px 16px",
    borderRadius: 12,
    background: "rgba(31,218,117,0.07)",
    border: "1px solid rgba(31,218,117,0.20)",
  },
  infoBoxLabel: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.09em",
    color: "#1fda75",
    marginBottom: 6,
  },
  infoBoxText: { fontSize: 12.5, lineHeight: 1.65, opacity: 0.88, margin: 0 },

  // Stages
  stagesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 10,
    marginBottom: 4,
  },
  stageCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 12,
    padding: "12px 14px",
  },
  stageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  stageLabel: { fontSize: 12, fontWeight: 700 },
  stageTimer: { fontSize: 10, opacity: 0.45, fontVariantNumeric: "tabular-nums" },
  stageSubtitle: { fontSize: 10, opacity: 0.45, marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },
  list: { margin: 0, paddingLeft: 0, listStyle: "none" },
  attackItem: { display: "flex", gap: 6, fontSize: 11, opacity: 0.90, marginBottom: 8, lineHeight: 1.4, alignItems: "flex-start" },
  actionName: { display: "block", fontWeight: 700, color: "#c8dde8", marginBottom: 2 },
  actionDesc: { display: "block", fontSize: 10.5, color: "rgba(154,180,192,0.75)", lineHeight: 1.55, fontStyle: "italic" },
  dot: { color: "#ff5555", flexShrink: 0, marginTop: 1 },
  stageContext: {
    marginTop: 10,
    paddingTop: 9,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    fontSize: 11.5,
    lineHeight: 1.6,
    opacity: 0.72,
    fontStyle: "italic",
  },

  // Mitigations
  mitGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
    gap: 10,
    marginBottom: 16,
  },
  mitCard: {
    background: "rgba(74,158,218,0.05)",
    border: "1px solid rgba(74,158,218,0.14)",
    borderRadius: 12,
    padding: "12px 14px",
  },
  mitLabel: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  mitConcept: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "#4a9eda",
    marginBottom: 6,
  },
  mitDesc: { fontSize: 11.5, opacity: 0.72, lineHeight: 1.55 },
};
