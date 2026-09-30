# MateTerminal-Box Releases & Version History

Dedicated Terminal Emulator, SSH Manager & ServerBox Telemetry Hub for **Huawei MatePad 12X** (3:2 Aspect Ratio, 2800x1840, 144Hz).

---

## Release Gallery

| Termius Dark Main Terminal (v1.3.0) | Split 1x2 + ServerBox Telemetry HUD (v1.2.0) |
| :---: | :---: |
| ![Termius Dark Main Terminal](docs/screenshots/01-termius-dark-main-terminal.jpg) | ![Split Screen & ServerBox HUD](docs/screenshots/02-split-screen-serverbox-hud.jpg) |

| Daily Activity Logs & Rann-Labs Sync (v1.1.0) | Full Settings & Workstation Configuration (v1.1.0) |
| :---: | :---: |
| ![Activity Logs & Sync](docs/screenshots/03-activity-logs-sync.jpg) | ![Settings Modal](docs/screenshots/04-settings-configuration-modal.jpg) |

---

## Version Changelog & Release Artifacts

### [v1.3.0] - Termius Dark UI/UX, VT100 Matrix Streaming & Sticky Keys
*Release Date: Current Production*

#### Highlights & Improvements
- **Termius Dark Signature Palette**: Applied official Termius Dark background (`#0e111a`), deep terminal black canvas (`#090b10`), Termius Violet brand accent (`#7952ff`), and high-contrast JetBrains Mono typography.
- **Direct Stream Matrix Terminal Buffer**: Eliminated artificial web form placeholder boxes and heavy borders. The terminal buffer flows directly into character matrix cells with a blinking block cursor.
- **Sticky Modifier Keys**: Virtual accessory keys (`CTRL` and `ALT`) now support toggle sticky states (glowing violet when active) enabling mobile touch combinations such as `CTRL + C` (SIGINT) and `CTRL + L` (Clear Screen).
- **Zero-Emoji Compliance**: Verified 100% elimination of emojis across terminal prompts, status headers, telemetry cards, and logs; replaced exclusively with SVG vectors and Powerline unicode geometric glyphs.

#### Download Artifacts
- **Universal Android APK**: `mate-terminal-box-v1.3.0-universal.apk`
- **Offline Web Simulator**: `mate-terminal-box-v1.3.0-web-simulator.zip`
- **Git Commit Tag**: `v1.3.0` (`de1f082`)

---

### [v1.2.0] - Inline Multiline Terminal Input, Tab Overflow & Dual HUD Target Switcher
*Release Date: Previous Update*

#### Highlights & Improvements
- **Inline Multiline Terminal Handling**: Added auto-expanding terminal prompt supporting `Shift + Enter` multiline drafting and backslash `\` shell line continuation without premature execution.
- **Tab Bar Overflow Scrolling**: Implemented smooth horizontal mouse wheel scrolling, `<` and `>` quick navigation buttons, and a dropdown tab switcher menu for handling dozens of concurrent sessions on the MatePad 12X.
- **Dual HUD Scope Selector**: ServerBox telemetry dashboard can now switch between **Local MatePad 12X** (internal CPU, RAM, UFS 3.1 storage, battery, Wi-Fi 6+) and **Remote Linux SSH Servers** (vCPU cores, NVMe storage, network traffic, Docker container services).

#### Download Artifacts
- **Universal Android APK**: `mate-terminal-box-v1.2.0-universal.apk`
- **Offline Web Simulator**: `mate-terminal-box-v1.2.0-web-simulator.zip`
- **Git Commit Tag**: `v1.2.0` (`7e4d99e`)

---

### [v1.1.0] - App Settings Persistence, Collapsible Sidebar & Rann-Labs Log Sync
*Release Date: Previous Update*

#### Highlights & Improvements
- **Settings Modal & SharedPreferences**: Added full workstation settings modal for adjusting themes, terminal font sizes (12px, 14px, 16px), sidebar modes, and keepalive background service.
- **Collapsible vs Fixed Sidebar**: Configurable sidebar behavior supporting full collapse with floating expand trigger or permanent pinned workstation layout.
- **Daily Activity SQLite Logs**: Structured activity logging partitioned by date (`logDate` `YYYY-MM-DD`) tracking sessions, command executions, durations, and sync state.
- **Rann-Labs Server Synchronization**: Automatic and manual background sync client targeting `https://api.rann-labs.com/v1/logs/sync` with JSON payload batching.

#### Download Artifacts
- **Universal Android APK**: `mate-terminal-box-v1.1.0-universal.apk`
- **Offline Web Simulator**: `mate-terminal-box-v1.1.0-web-simulator.zip`
- **Git Commit Tag**: `v1.1.0` (`1d70b7d`)

---

### [v1.0.0] - Initial Architecture & MatePad 12X 3:2 Landscape Display Engine
*Release Date: Initial Base Release*

#### Highlights & Improvements
- **Huawei MatePad 12X Native 3:2 Display Engine**: Overcame Termux phone-scaling and Huawei App Multiplier pillarboxing via `android.max_aspect="3.0"`, `EasyGoClient="true"`, and edge-to-edge window insets rendering full 2800x1840 resolution.
- **C++ Native PTY Subshell Bridge**: Direct POSIX pseudo-terminal interface (`forkpty`, `termios`, `winsize`) running ARM64 local shell natively on Android 12 / HarmonyOS 4.2.
- **JSch SSH Client Core**: Full SSH2 protocol client with password and RSA/Ed25519 private key authentication.
- **ServerBox Metrics Collector Engine**: Background telemetry daemon parsing `/proc/stat`, `/proc/meminfo`, `/proc/net/dev`, and remote sysfs nodes.
- **Oh-My-Zsh Powerline Engine**: Built-in Agnoster and Robby Russell powerline prompt rendering.

#### Download Artifacts
- **Universal Android APK**: `mate-terminal-box-v1.0.0-universal.apk`
- **Offline Web Simulator**: `mate-terminal-box-v1.0.0-web-simulator.zip`
- **Git Commit Tag**: `v1.0.0` (`a0419c8`)
