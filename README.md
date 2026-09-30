# MateTerminal-Box [MTB]
**Dedicated High-Performance Terminal Emulator, SSH Manager & ServerBox Telemetry HUD for Huawei MatePad 12X**

---

## Overview

**MateTerminal-Box** is an open-source Android terminal emulator engineered specifically to solve display, scaling, and aspect ratio issues on modern productivity tablets—with specialized first-class optimization for the **Huawei MatePad 12X** (12.0" IPS LCD, 2800x1840 resolution, 3:2 aspect ratio, 144Hz, HarmonyOS / EMUI).

It integrates the best core strengths of three industry-standard tools into a unified workstation:
1. **Termius**: Unlimited host profile management, session persistence, credential/identity storage, and command snippets.
2. **Termux**: High-performance local Android POSIX PTY shell (`/system/bin/sh`) executed through a native C++ JNI bridge (`forkpty` / `openpty`).
3. **ServerBox**: Real-time server telemetry HUD monitoring CPU, RAM, Disk I/O, Network traffic, Docker containers, and top processes.

---

## Key Features

### 1. MatePad 12X Native 3:2 Display Engine
- **Zero Pillarboxing & Cropping**: Eliminates the black borders and side-cropping common with standard smartphone terminal emulators on HarmonyOS tablets.
- **HarmonyOS App Multiplier Bypass**: Configured with explicit `android.max_aspect="3.0"`, `android:resizeableActivity="true"`, and Huawei `EasyGoClient` metadata.
- **Dynamic Window Insets Handling**: Adapts dynamically to system status bars, navigation bars, and multi-window / split-screen floating modes.

### 2. Dual Terminal Execution Core
- **Remote SSH Engine**: Built on non-blocking SSH client architecture supporting RSA/ED25519 keys, password authentication, and custom port forwarding.
- **Local Native PTY Shell**: High-speed pseudo-terminal implementation in C++ (`openpty`, `fork`, `execvp`) with POSIX terminal capabilities.
- **Oh-My-Zsh & Tokyo Night Aesthetics**: Native ANSI 24-bit TrueColor rendering, Powerline/Agnoster prompt styling, and custom developer themes.

### 3. Modular ServerBox Telemetry & System HUD (Optional)
- **Toggleable & Optional**: HUD view can be turned on/off via quick toolbar toggle or through settings to provide a distraction-free terminal workstation.
- Real-time SSH-based polling for host performance metrics:
  - Multi-core CPU load and architecture info.
  - Memory consumption (used, cached, buffers, total).
  - Storage partitions and NVMe/SSD space utilization.
  - Real-time network throughput (Rx / Tx rate tracking).
  - Docker container state breakdown (running, stopped, paused).

### 4. Collapsible & Fixed Sidebar Navigation
- **Collapsible Toggle**: Smooth animated drawer toggle (`[<]` / `[>]`) expanding active workspace from 900px to full 1200px.
- **Pinned / Fixed Mode**: Configurable in Settings to lock the sidebar open for heavy multi-session switching.
- **Fast Segmented Switcher**: Instant switching between Hosts, ServerBox HUD, Snippets, and Daily Logs.

### 5. Daily Activity Logging & Rann-Labs Server Sync
- **Local Offline-First Partitioning**: Chronologically records session lifecycle events, command executions, SSH connections, and alerts partitioned by date (`YYYY-MM-DD`) in local SQLite storage.
- **Rann-Labs Central Synchronization**: REST API batch sync to `https://api.rann-labs.com/v1/logs/sync` with offline idempotency, Bearer authentication, and retry queue.
- **Integrated Audit Viewer**: Built-in date picker, live keyword search, sync status indicators, and one-click JSON export.

### 6. Tablet Multi-Pane & Tab Session Manager
- **Multi-Pane Layouts**: Switch instantly between single pane (1x1) and dual side-by-side terminal panes (1x2) on the 2800x1840 canvas.
- **Comprehensive Settings Dialog**: Real-time configuration of Themes (Tokyo Night, Monokai Pro, Cyber Slate, Solarized Dark), font scaling (12px to 18px), Rann-Labs endpoint, auto-sync triggers, and log retention policies.
- **Hardware & Software Accessory Bar**: Dedicated shortcuts for `ESC`, `TAB`, `CTRL`, `ALT`, `PIPE (|)`, `ARROW KEYS`, and customizable snippets.
- **Foreground Keepalive Service**: Persistent notification service with `WAKE_LOCK` to prevent OS sleep termination during long-running tasks.

---

## Repository Structure

```text
mate-terminal-box/
├── app/
│   ├── build.gradle                       # Android App Build Configuration
│   └── src/main/
│       ├── AndroidManifest.xml            # Fullscreen & Display Scaling Directives
│       ├── cpp/                           # Native C++ Pseudo-Terminal Bridge
│       │   ├── CMakeLists.txt
│       │   └── pty_bridge.cpp             # openpty, forkpty, ioctl JNI routines
│       ├── java/com/mateterminal/box/
│       │   ├── MateTerminalApplication.kt
│       │   ├── core/
│       │   │   ├── monitor/               # ServerBox Telemetry Collectors
│       │   │   ├── pty/                   # Local Native PTY Controller
│       │   │   ├── ssh/                   # SSH Client Manager & Credentials
│       │   │   ├── storage/               # SQLite Host & Session Models
│       │   │   └── theme/                 # Oh-My-Zsh & Tokyo Night Themes
│       │   ├── service/                   # Foreground Keepalive Service
│       │   └── ui/                        # MainActivity & Tablet View Controllers
│       └── res/                           # Tablet Layouts, Vectors & Styles
├── web/                                   # Interactive Tablet Web Simulator
│   ├── index.html                         # MatePad 12X 3:2 Canvas & HUD
│   ├── style.css                          # Tokyo Night Design System
│   └── app.js                             # Virtual Terminal & Metric Poller
├── gradle/                                # Gradle Wrapper
├── build.gradle                           # Top-Level Build Configuration
└── settings.gradle                        # Project Modules
```

---

## Building & Running

### Android Build
```powershell
# In the repository root
./gradlew assembleDebug
```

### Web Simulator Preview
Launch the included standalone MatePad 12X web simulator by opening `web/index.html` in any modern web browser or preview server to experience the 3:2 layout, live telemetry animations, and dual terminal pane workflows.

---

## Design Principles & Standards
- **Zero Emoji Compliance**: Pure vector icons, ASCII/Powerline glyphs, and Material Symbols are used throughout the UI and codebase for professional terminal fidelity.
- **TrueColor Rendering**: Full support for 24-bit RGB ANSI escape sequences.
- **High Refresh Rate**: Fluid 144Hz animations optimized for HarmonyOS / Android 14+.
