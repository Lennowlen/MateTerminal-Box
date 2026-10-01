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

### [v1.5.0] - Authentic Termius Pro Clone & Multi-Pane Session Matrix Engine
*Release Date: Current Production*

#### Highlights & Improvements
- **Authentic Termius APK Asset Extraction**: Extracted official vector path geometries, scale factors (`0.58`), translations (`22.5`), and two-layer linear gradients (`#FF1C265B` -> `#FF060816`) from `Termius - v7.4.2.apk` using `aapt2`. Rebuilt launcher icons (`ic_app_launcher.xml`, `ic_launcher_background.xml`, `ic_launcher_foreground.xml`) with zero badge distortions or crude text overlays.
- **Official Termius Navigation Hierarchy**: Generated authentic vector drawables for drawer navigation (`ic_nav_drawer_host.xml`, `ic_nav_drawer_terminals.xml`, `ic_nav_drawer_sftp.xml`, `ic_nav_drawer_pf.xml`, `ic_nav_drawer_snippets.xml`, `ic_nav_drawer_known_hosts.xml`, `ic_nav_drawer_identity.xml`, `ic_nav_drawer_themes.xml`, `ic_nav_drawer_history.xml`, `ic_nav_drawer_settings.xml`, `ic_nav_drawer_help.xml`, `ic_nav_connections.xml`).
- **Termius Pro Multi-Pane Session Matrix**: Implemented multi-window split pane manager supporting `1x1` (Single Fullscreen), `1x2` (Dual Horizontal), `2x1` (Dual Vertical), `2x2` (Quad Matrix), and `PiP` (Floating Overlay Window) across Android native views and Web simulator.
- **Interactive Pane Focus & Keybar Routing**: Dynamic active pane border focus glow (`active-focused-pane` / `bg_window_active`), routing virtual touch keybars (`CTRL`, `ALT`, `ESC`, `TAB`, arrows) and input streams directly to the selected active pane.
- **Termius Pro Session Windows Preset Manager**: Dedicated workspace manager allowing users to save, organize, and launch synchronized multi-host matrix layouts with a single tap.
- **Zero Emojis Standard**: Complete compliance across all UI screens, logs, prompts, modals, and drawables.

#### Download Artifacts
- **Universal Android APK**: `release-artifacts/MateTerminal-Box-v1.5.0-debug.apk`
- **APK SHA-256 Checksum**: `5A5EACCCF4140A360F188D4C53D6A7F6D3F6650BC45400EB7435839B15F2568B`
- **Git Commit Tag**: `v1.5.0`

---

### [v1.4.0] - Authentic Termius Midnight Pro Theme & Direct Android Drawer Alignment
*Release Date: Current Production*

#### Highlights & Improvements
- **Authentic Termius Color System Extraction**: Sampled exact RGB/HEX tokens from the official Termius Android application (`com.server.auditor.ssh.client`): Midnight Navy drawer (`#151629`), Content canvas (`#1b1c2e`), Terminal viewport (`#141524`), Header bar (`#292a3d`), Card surface (`#25263a`), Brand violet (`#7952ff`), Keybar surface (`#151627`), and Key tactile chips (`#27283c`).
- **Termius Navigation Drawer Architecture**: Implemented full Termius left-hand navigation structure featuring Hosts, ServerBox HUD, Port Forwarding (SSH Tunnels), Snippets, Keys & Identities, and Activity Logs, with live drawer search and pinned bottom Settings.
- **Context-Aware Floating Action Button (FAB)**: Dynamic Termius violet floating plus button that automatically adapts to the active drawer context (New Host, New Port Forward, New Snippet, New SSH Key).
- **Dedicated Management Views & Modals**: Implemented complete Termius-style list cards and creation modals for SSH Port Forwarding tunnels (Local/Remote/Dynamic SOCKS5), Snippets with bash tags, and SSH Key Pair generation/import (RSA/Ed25519).
- **Expanded Touch Accessory Keybar**: Enhanced Termius-style keybar with tactile dark chips, sticky modifiers (`CTRL`, `ALT`), symbol insertion (`|`, `~`, `/`, `-`, `_`, `$`), arrow clusters (`UP`, `DN`, `LT`, `RT`), and utility shortcuts (`PASTE`, `CLEAR`, `ESC`, `TAB`).

#### Download Artifacts
- **Universal Android APK**: `mate-terminal-box-v1.4.0-universal.apk`
- **Offline Web Simulator**: `mate-terminal-box-v1.4.0-web-simulator.zip`
- **Git Commit Tag**: `v1.4.0` (`5f78d17`)

---

### [v1.3.0] - Termius Dark UI/UX, VT100 Matrix Streaming & Sticky Keys
*Release Date: Previous Update*

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
