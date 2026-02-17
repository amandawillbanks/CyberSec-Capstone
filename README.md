# CyberSecurity Capstone — Interactive Incident Response Simulator

A browser-based cybersecurity training game built with React and Vite. Players act as a SOC analyst defending a global network of hosts against 10 real-world attack types. The game escalates in real time, rewards correct mitigation decisions, and teaches security concepts through an integrated Knowledge Base — without giving away the answers.

---

## Table of Contents

1. [Project Purpose](#project-purpose)
2. [Live Features](#live-features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [How to Play](#how-to-play)
7. [Game Mechanics](#game-mechanics)
   - [Host Spawn Waves](#host-spawn-waves)
   - [Attack Escalation](#attack-escalation)
   - [Mitigations](#mitigations)
   - [Win & Lose Conditions](#win--lose-conditions)
   - [Spread Mechanic](#spread-mechanic)
8. [Attack Types Reference](#attack-types-reference)
9. [Knowledge Base](#knowledge-base)
10. [File Reference](#file-reference)
11. [Data Architecture](#data-architecture)
12. [Extending the Game](#extending-the-game)
13. [Dependencies](#dependencies)

---

## Project Purpose

This simulator was built as a **capstone project** for a cybersecurity course. It teaches incident response concepts by putting the player in a realistic SOC (Security Operations Center) scenario:

- Hosts worldwide appear on a rotating 3D globe as threats are detected
- Each host is under a different attack type with multiple escalating stages
- Players must identify the correct mitigation actions before the attack progresses
- A built-in **Knowledge Base** explains every attack technique and attacker action in plain language — the goal is to *teach*, not just test

The game is designed for **beginner to intermediate** cybersecurity students who may have theoretical knowledge but limited hands-on experience with incident response decision-making.

---

## Live Features

| Feature | Description |
|---|---|
| **Rotating 3D Globe** | Interactive orthographic globe with real-world host markers and status colors |
| **10 Attack Types** | Phishing, RDP, Ransomware, Credential Dumping, Lateral Movement, Supply Chain, Web App RCE, Cloud Misconfig, Insider Threat, DDoS |
| **Real-Time Escalation** | Each host ticks through attack stages with countdown timers — act fast or the attack worsens |
| **Spawn Waves** | Hosts appear over time (every ~45 seconds) so the player isn't overwhelmed immediately |
| **Knowledge Base** | Full educational modal explaining all 10 attacks, every stage, every attacker action, and every mitigation concept |
| **Attacker Action Glossary** | Every attacker action (e.g. "Beacon to C2", "Kerberoasting tickets") has a plain-language explanation |
| **Intro Briefing** | A cyberpunk-style welcome modal walks new players through the game on first load |
| **Loss Debrief** | When the game ends in failure, a per-host breakdown shows what failed, what was applied, and what would have helped |
| **Scoring** | Points are awarded for applying mitigations — more effective mitigations earn higher scores |
| **Cyberpunk UI** | Full dark terminal aesthetic with neon cyan/magenta accents, grid backgrounds, and glow effects |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 18](https://react.dev/) |
| Build Tool | [Vite 7](https://vitejs.dev/) |
| Globe / Map | [react-simple-maps 3](https://www.react-simple-maps.io/) |
| Geography Data | [world-atlas 2](https://github.com/topojson/world-atlas) + [topojson-client 3](https://github.com/topojson/topojson-client) |
| Styling | Inline React styles + global CSS animations (`index.css`) |
| Language | JavaScript (ESM) — no TypeScript |
| Linting | ESLint 9 with react-hooks and react-refresh plugins |

---

## Project Structure

```
CyberCapstone/
├── public/
│   └── vite.svg                  # Vite favicon (unused in-game)
│
├── src/
│   ├── main.jsx                  # React entry point — mounts <App /> into #root
│   ├── App.jsx                   # Root component — renders <CapstoneMVP />
│   ├── App.css                   # Minimal root styles (#root sizing only)
│   ├── index.css                 # Global cyberpunk base: reset, fonts, scrollbars,
│   │                             #   CSS variables, and @keyframes animations
│   │
│   ├── CapstoneMVP.jsx           # MAIN GAME COMPONENT
│   │                             #   - All game state (hosts, score, gameState)
│   │                             #   - Simulation loop (setInterval tick)
│   │                             #   - Spawn countdown, escalation, spread logic
│   │                             #   - Mitigation application
│   │                             #   - Win/lose detection
│   │                             #   - All inline styles (styles object)
│   │                             #   - Renders: header, globe, attacker panel,
│   │                             #     mitigations panel, intro modal, loss debrief
│   │
│   ├── GlobeMap.jsx              # 3D GLOBE COMPONENT
│   │                             #   - react-simple-maps ComposableMap
│   │                             #   - geoOrthographic projection (3D globe look)
│   │                             #   - World countries from world-atlas TopoJSON
│   │                             #   - Rotating animation via useEffect + setInterval
│   │                             #   - Markers for each spawned host (colored by status)
│   │                             #   - Converts xPct/yPct -> longitude/latitude
│   │
│   ├── KnowledgeBase.jsx         # KNOWLEDGE BASE MODAL
│   │                             #   - Left sidebar: 10 attack types with domain tags
│   │                             #   - Right pane: overview, how it works, defender
│   │                             #     mindset, stage breakdown, defensive options
│   │                             #   - ACTION_GLOSSARY: plain-language definitions
│   │                             #     for every attacker action in the game
│   │                             #   - MITIGATION_CONCEPTS: security principle + why
│   │                             #     it works for every mitigation
│   │                             #   - Does NOT reveal which mitigation solves which
│   │                             #     stage — educational, not a walkthrough
│   │
│   └── CapstoneData.js           # ALL GAME DATA
│                                 #   - VULNS: 10 attack type definitions, each with:
│                                 #     stages, timeLimitSec, attackerActions,
│                                 #     requiredMitigationsAnyOf, maySpread
│                                 #   - INITIAL_HOSTS: 10 global hosts with real
│                                 #     geographic coordinates and spawn delays
│
├── index.html                    # HTML shell — single <div id="root">
├── vite.config.js                # Vite config — React plugin only
├── eslint.config.js              # ESLint 9 flat config
├── package.json                  # Dependencies and npm scripts
└── .gitignore                    # Excludes node_modules, dist, logs
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (included with Node.js)

### Install & Run

```bash
# Navigate into the project directory
cd CyberCapstone

# Install all dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port if 5173 is in use).

### Build for Production

```bash
npm run build      # Compiles and bundles to /dist
npm run preview    # Serve the production build locally to verify
```

### Lint

```bash
npm run lint
```

---

## How to Play

1. **Read the briefing** — An intro modal appears on load. Read the mission overview and instructions, then click **ACKNOWLEDGE & ENTER OPERATIONS CENTER**.

2. **Wait for hosts to appear** — Two hosts spawn immediately (Atlanta, London). More appear every ~45 seconds. A yellow bar below the globe shows pending threats and their countdowns.

3. **Select a host** — Click a marker on the globe. The left panel shows the **Attacker** view (current stage, time remaining, attacker actions). The right panel shows available **Mitigations**.

4. **Consult the Knowledge Base** — Click **Knowledge Base** in the header to read about the attack type on the selected host. Learn what the attacker is doing at each stage and why certain defenses work. Don't guess blindly.

5. **Apply mitigations** — In the right panel, click mitigation buttons. Applying the correct mitigation for the current stage **stabilizes the host** and adds bonus time. All mitigations add points.

6. **Contain all 10 hosts** — Win by getting every host to **Safe** or **Quarantined** status after all 10 have spawned.

7. **Don't let 2 hosts get compromised** — If the timer runs out twice without the correct mitigation, it's game over. The **loss debrief** explains exactly what went wrong on each compromised host.

---

## Game Mechanics

### Host Spawn Waves

Hosts appear on a staggered schedule to prevent player overload. All timings are in seconds after pressing **Start**:

| Host | Location | Spawn Delay | Attack Type |
|---|---|---|---|
| ATL-WKS-014 | Atlanta, USA | 0s (immediate) | Phishing Malware |
| LON-SRV-221 | London, UK | 0s (immediate) | Exposed RDP |
| TYO-DB-090 | Tokyo, Japan | 45s | Ransomware |
| FRA-APP-301 | Frankfurt, Germany | 90s | Credential Dumping |
| NYC-WEB-445 | New York, USA | 135s | Web App RCE |
| SIN-CLO-012 | Singapore | 180s | Cloud Misconfiguration |
| SYD-NET-887 | Sydney, Australia | 225s | Lateral Movement (SMB) |
| SAO-INS-334 | São Paulo, Brazil | 270s | Insider Threat |
| MUM-SUP-091 | Mumbai, India | 315s | Supply Chain Attack |
| CHI-DDS-201 | Chicago, USA | 360s | DDoS Attack |

### Attack Escalation

Every second the game runs, the simulation ticks. For each active host:

1. `stageTimeLeft` decrements by 1 second
2. If it reaches 0 and the **required mitigation** has NOT been applied, the host moves to the next stage
3. When a host reaches **stageIndex >= 2** via escalation (without mitigation), its status becomes **Compromised**
4. If the correct mitigation IS applied, the host becomes **Safe** and receives a +20 second timer bonus

Stage timers range from **40 to 65 seconds** per stage, giving players meaningful but limited time to respond.

**Host Status Values:**

| Status | Color | Meaning |
|---|---|---|
| `warning` | Yellow (pulsing) | Active threat — timer running |
| `safe` | Green | Correctly contained |
| `quarantined` | Blue | Isolated, no longer escalating |
| `compromised` | Red (pulsing) | Critical — attack succeeded at this stage |
| `pending` | — | Not yet spawned |

### Mitigations

Mitigations are displayed in the right panel for the selected host's attack type. Rules:

- Each mitigation can only be applied **once per host** (button dims after use)
- Any mitigation applied **awards its point value** to the score
- If the applied mitigation matches a `requiredMitigationsAnyOf` entry for the current stage, the host is **stabilized** (status → Safe, timer +20s)
- Certain mitigation IDs have hard-coded status effects regardless of stage:

| Mitigation ID | Status Effect |
|---|---|
| `quarantine` | → Quarantined |
| `disable_rdp` | → Safe |
| `revoke_access` | → Quarantined |
| `patch_app` | → Safe |
| `fix_acl` | → Safe |
| `cdn_mitigation` | → Safe |

### Win & Lose Conditions

**Win condition:** All 10 hosts have spawned AND every spawned host has `status === "safe"` or `status === "quarantined"` with none `"compromised"`.

**Lose condition:** 2 or more hosts simultaneously have `status === "compromised"`. The game stops, `lostHosts` state is captured, and the **loss debrief modal** appears.

### Spread Mechanic

Attack stages marked with `maySpread: true` have an active spread behavior. Each simulation tick, if a **Compromised** host is at a spreading stage, it will find the first **Safe** host and reset it to Stage 0 with a fresh timer — simulating malware or ransomware propagating laterally across the network. This raises urgency and rewards prioritization of high-spread threats.

---

## Attack Types Reference

| # | Attack | Domain | Stage Count | Spread Risk |
|---|---|---|---|---|
| 1 | **Phishing Malware** | Endpoint | 4 | Yes (Stage 2) |
| 2 | **Exposed RDP** | Endpoint | 4 | Yes (Stage 2) |
| 3 | **Ransomware** | Endpoint / Impact | 3 | Yes (Stage 2) |
| 4 | **Credential Dumping** | Identity | 3 | Yes (Stage 2) |
| 5 | **Lateral Movement (SMB)** | Network | 3 | Yes (Stage 2) |
| 6 | **Supply Chain Attack** | Multi-host | 3 | Yes (Stage 2) |
| 7 | **Web App RCE** | Server | 3 | Yes (Stage 2) |
| 8 | **Cloud Misconfiguration** | Cloud | 3 | Yes (Stage 2) |
| 9 | **Insider Threat** | Identity | 3 | No |
| 10 | **DDoS Attack** | Infrastructure | 3 | No |

Full stage details, timers, and mitigation lists for every attack are in `src/CapstoneData.js`.

---

## Knowledge Base

The Knowledge Base (`src/KnowledgeBase.jsx`) is an in-game educational reference accessible at any time. It is intentionally designed to **teach** rather than give direct answers to the current game state.

### Structure

For each of the 10 attacks, the Knowledge Base provides:

**What Is This Attack?**
Real-world context explaining what the attack is, why it's common, and what attacker goal it serves.

**How Attackers Execute It**
Step-by-step methodology describing the attack lifecycle from the attacker's perspective.

**Defender Mindset**
A coaching callout box that frames the right security question to ask at each stage — helping players build intuition rather than memorizing answers.

**Attack Progression**
Per-stage breakdown showing:
- Stage label and timer
- Every attacker action with its plain-language glossary definition
- Stage context explaining what is happening and why it matters at this point in the attack

**Defensive Options**
Every available mitigation for the attack, showing:
- The security *concept* it represents (e.g. "Network Isolation", "Multi-Factor Authentication")
- *Why* it works — the underlying security principle explained

### What the Knowledge Base Does NOT Show

- Which specific mitigation solves which stage (intentionally omitted)
- Point values
- "Press this button" hints

### Attacker Action Glossary

The `ACTION_GLOSSARY` constant in `KnowledgeBase.jsx` contains plain-language definitions for every attacker action string used in the game. Examples:

| Action | Definition |
|---|---|
| `Beacon to C2` | The malware quietly checks in with the attacker's Command & Control server — like a soldier radioing base. It receives instructions and confirms the attacker still has access. |
| `Kerberoasting tickets` | Requests Kerberos service tickets from Active Directory that can be taken offline and cracked to reveal service account passwords. |
| `vssadmin delete shadows` | Runs this built-in Windows command to permanently destroy Volume Shadow Copy backups — eliminating the easiest local recovery path. |
| `DNS/NTP amplification attack` | Sends small requests to misconfigured public servers with the victim's IP as the return address — the servers send large responses to the victim, amplifying traffic 50-100x. |

---

## File Reference

### `src/CapstoneData.js`

Single source of truth for all game content. Exports two constants:

**`VULNS`** — Object keyed by `vulnId`:
```js
{
  phishing_malware: {
    id: "phishing_malware",
    name: "Phishing Malware",
    description: "...",
    stages: [
      {
        stage: 0,                              // Zero-indexed stage number
        label: "Initial Compromise",           // Display name
        timeLimitSec: 50,                      // Seconds before auto-escalation
        attackerActions: ["Beacon to C2"],     // Displayed in left attacker panel
        requiredMitigationsAnyOf: ["quarantine"],  // Any of these stabilizes the host
        maySpread: true,                       // Optional — activates spread mechanic
      }
    ],
    mitigations: [
      { id: "quarantine", label: "Quarantine Endpoint", points: 50 }
    ]
  }
}
```

**`INITIAL_HOSTS`** — Array of host objects:
```js
{
  id: "host-atl",
  name: "ATL-WKS-014",        // Hostname shown in UI
  region: "Atlanta",           // Region label for pending/debrief display
  xPct: 26.6,                  // Horizontal % position (0-100) on globe
  yPct: 31.3,                  // Vertical % position (0-100) on globe
  vulnId: "phishing_malware",  // Key into VULNS object
  spawnDelaySec: 0,            // Seconds after game start before host becomes active
}
```

**Coordinate conversion** (longitude/latitude from xPct/yPct):
```
longitude = (xPct / 100) * 360 - 180
latitude  = 90 - (yPct / 100) * 180
```

### `src/CapstoneMVP.jsx`

Main game component (~900 lines). Key sections:

| Function / Section | Purpose |
|---|---|
| `makeInitialState()` | Builds runtime host state from `INITIAL_HOSTS` — adds `spawned`, `spawnCountdown`, `status`, `stageIndex`, `stageTimeLeft`, `appliedMitigations`, `lastEvent` |
| `stepSimulation(prevHosts)` | Called every 1 second via `setInterval` — first pass: spawn countdown; second pass: stage timer + escalation; third pass: spread check |
| `applyMitigation(hostId, mitigationId)` | Updates host state with the applied mitigation, resolves status changes, and awards score |
| `start()` | Resets all state and begins game loop |
| `stop()` | Stops game loop and resets to ready state |
| Lose `useEffect` | Watches `anyCompromised` — triggers when >= 2; captures snapshot of compromised hosts into `lostHosts`, sets `gameState = "lost"` |
| Win `useEffect` | Watches `hosts` — triggers when all spawned and none compromised |
| `styles` object | All component inline styles (~300 lines) — organized by section (page, header, panels, globe, modals) |

### `src/GlobeMap.jsx`

Interactive 3D globe component. Key behaviors:

- `geoOrthographic` projection with configurable rotation state `[rotX, -20]`
- Auto-rotation: increments `rotX` by 0.3° per tick via `setInterval` when `running && autoRotate`
- Countries: fill `#1e3a5f`, stroke `#4a9eda`
- Ocean (sphere): fill `#0a1628`, stroke `#4a9eda`
- Graticule: latitude/longitude grid at 30° intervals
- Host markers: circles colored by `statusColor(host.status)`, radius 5px, selected host radius 7px with white stroke
- Clicking a marker fires `onSelectHost(host.id)`

### `src/KnowledgeBase.jsx`

Self-contained educational modal (~700 lines). Key data constants:

| Constant | Type | Purpose |
|---|---|---|
| `DOMAIN_MAP` | Object | Maps vulnId → `{ label, color }` for domain category badge |
| `ATTACK_EDUCATION` | Object | Per-attack: `overview`, `howItWorks`, `defenderMindset`, `stageContext[n]` |
| `MITIGATION_CONCEPTS` | Object | Per-mitigation ID: `concept` name + `why` explanation |
| `ACTION_GLOSSARY` | Object | Per-attacker-action string: plain-language definition (70+ entries) |

### `src/index.css`

Global base styles applied to all elements:
- CSS custom properties: `--cyan`, `--magenta`, `--yellow`, `--green`, `--purple`, `--bg`
- Box-sizing reset, monospace font stack, dark color scheme
- Custom scrollbar styling
- Button element reset
- `@keyframes pulse-red` — applied via `.status-compromised` class for red glow pulsing
- `@keyframes pulse-yellow` — applied via `.status-warning` class for yellow glow pulsing
- `@keyframes blink` — applied via `.blink` class for terminal cursor effect

---

## Data Architecture

```
CapstoneData.js
  VULNS[vulnId]
    stages[n].requiredMitigationsAnyOf  ──► checked in applyMitigation() and stepSimulation()
    stages[n].timeLimitSec               ──► countdown source in stepSimulation()
    stages[n].maySpread                  ──► enables spread check in stepSimulation()
    mitigations[n].id + points          ──► key for button render + score calculation

Runtime Host State (useState in CapstoneMVP):
  {
    // From INITIAL_HOSTS:
    id, name, region, xPct, yPct, vulnId, spawnDelaySec,

    // Added by makeInitialState():
    spawned: boolean,           // false until spawnCountdown reaches 0
    spawnCountdown: number,     // ticks down from spawnDelaySec each second
    status: string,             // "pending" | "warning" | "safe" | "quarantined" | "compromised"
    stageIndex: number,         // current index into VULNS[vulnId].stages[]
    stageTimeLeft: number,      // seconds before auto-escalation at current stage
    appliedMitigations: [],     // array of mitigation IDs already used on this host
    lastEvent: string,          // last notable event string for the left panel display
  }

Simulation tick order (stepSimulation):
  1. Spawn pass   — decrement spawnCountdown; flip spawned=true when it reaches 0
  2. Timer pass   — decrement stageTimeLeft; escalate or stabilize when it hits 0
  3. Spread pass  — if compromised+maySpread, infect first safe host
```

---

## Extending the Game

### Adding a New Attack Type

1. **Add to `VULNS`** in `src/CapstoneData.js` — follow the existing schema with `id`, `name`, `description`, `stages[]`, and `mitigations[]`
2. **Add educational content** to `ATTACK_EDUCATION` in `src/KnowledgeBase.jsx` — `overview`, `howItWorks`, `defenderMindset`, and `stageContext` per stage number
3. **Add domain tag** to `DOMAIN_MAP` in `KnowledgeBase.jsx`
4. **Add mitigation concepts** for any new mitigation IDs to `MITIGATION_CONCEPTS` in `KnowledgeBase.jsx`
5. **Add attacker action definitions** for any new action strings to `ACTION_GLOSSARY` in `KnowledgeBase.jsx`
6. **Add status rules** for any new mitigation IDs that need direct status changes in the `applyMitigation()` function in `CapstoneMVP.jsx`
7. **Add a host** to `INITIAL_HOSTS` in `CapstoneData.js` referencing the new `vulnId`

### Adding a New Host Location

Convert real geographic coordinates to game percentages:
```
xPct = (longitude + 180) / 360 * 100
yPct = (90 - latitude) / 180 * 100
```

Example: Singapore (lon: 103.8, lat: 1.3)
```
xPct = (103.8 + 180) / 360 * 100 = 78.8
yPct = (90 - 1.3) / 180 * 100   = 49.3
```

### Adjusting Difficulty

All timing is controlled in `src/CapstoneData.js`:
- **Easier:** increase `timeLimitSec` values in each stage
- **Harder:** decrease `timeLimitSec`, decrease `spawnDelaySec` (hosts arrive closer together), or increase the spread frequency
- **Lose threshold:** change `anyCompromised >= 2` in `CapstoneMVP.jsx` to `>= 1` (harder) or `>= 3` (easier)
- **Mitigation time bonus:** change `clamp(updated.stageTimeLeft + 20, 0, 120)` in `applyMitigation()` to give more or less time relief per correct action

---

## Dependencies

### Runtime

| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.3.1 | UI component framework |
| `react-dom` | ^18.3.1 | DOM rendering for React |
| `react-simple-maps` | ^3.0.0 | SVG-based map and globe components (`ComposableMap`, `Geography`, `Marker`, etc.) |
| `topojson-client` | ^3.1.0 | Decodes TopoJSON format into GeoJSON geometry |
| `world-atlas` | ^2.0.2 | Pre-built TopoJSON files for world country boundaries |

### Dev / Build

| Package | Version | Purpose |
|---|---|---|
| `vite` | ^7.3.1 | Development server and production bundler |
| `@vitejs/plugin-react` | ^5.1.1 | React fast-refresh and JSX transform for Vite |
| `eslint` | ^9.39.1 | JavaScript linting |
| `eslint-plugin-react-hooks` | ^7.0.1 | Enforces React Rules of Hooks |
| `eslint-plugin-react-refresh` | ^0.4.24 | Ensures components are compatible with fast-refresh |
| `@types/react` | ^19.2.7 | TypeScript type definitions for React (used by IDE tooling) |
| `@types/react-dom` | ^19.2.3 | TypeScript type definitions for React DOM (used by IDE tooling) |

---

## License

This project was created as an academic capstone for a cybersecurity course. All attack and mitigation content is educational and based on publicly documented security frameworks including MITRE ATT&CK, OWASP Top 10, and NIST Cybersecurity Framework. No actual exploit code is included or implied.
