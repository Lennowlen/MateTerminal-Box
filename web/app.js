/**
 * MateTerminal-Box Web Simulator & Pro Session Studio
 * Huawei MatePad 12X Pro Edition (12.0" 2800x1840 3:2 Display)
 * Strict Standard: Zero emojis anywhere in code, prompts, UI, or logs.
 */

// Storage Keys
const STORAGE_KEYS = {
    HOSTS: 'mate_hosts',
    SETTINGS: 'mate_settings',
    ACTIVITY_LOGS: 'mate_activity_logs',
    TUNNELS: 'mate_tunnels',
    KEYS: 'mate_keys',
    SNIPPETS: 'mate_snippets',
    SESSION_WINDOWS: 'mate_session_windows'
};

// Default Settings
const TERMIUS_SCHEMES = {
    "Termius Dark": { bg: "#141729", fg: "#21b568", cursor: "#21b568", ui: "#8d91a5", header: "#292a3d", card: "#25263a", sidebar: "#151629", accent: "#7952ff" },
    "Pro": { bg: "#000000", fg: "#f2f2f2", cursor: "#4d4d4d", ui: "#9d9d9d", header: "#1f1f1f", card: "#181818", sidebar: "#121212", accent: "#7952ff" },
    "Dracula": { bg: "#282a36", fg: "#f8f8f2", cursor: "#bbbbbb", ui: "#7d8197", header: "#343746", card: "#2e3140", sidebar: "#21222c", accent: "#bd93f9" },
    "Nord Dark": { bg: "#2e3440", fg: "#d8dee9", cursor: "#eceff4", ui: "#808a9e", header: "#3b4252", card: "#353c4a", sidebar: "#242933", accent: "#88c0d0" },
    "Ayu Dark": { bg: "#0f1419", fg: "#e6e1cf", cursor: "#f29718", ui: "#5c6773", header: "#1c2128", card: "#151a21", sidebar: "#0b0f14", accent: "#e6b450" },
    "Catppuccin Mocha": { bg: "#1e1e2e", fg: "#cdd6f4", cursor: "#f5e0dc", ui: "#9399b2", header: "#313244", card: "#272839", sidebar: "#181825", accent: "#cba6f7" },
    "Cyberpunk": { bg: "#332a57", fg: "#e5e5e5", cursor: "#21f6bc", ui: "#8070a0", header: "#3f346d", card: "#382e61", sidebar: "#251e40", accent: "#ff0055" },
    "Monokai": { bg: "#272822", fg: "#f8f8f2", cursor: "#f8f8f0", ui: "#75715e", header: "#35362e", card: "#30312b", sidebar: "#1e1f1c", accent: "#a6e22e" },
    "Solarized Dark": { bg: "#002b36", fg: "#839496", cursor: "#93a1a1", ui: "#586e75", header: "#073642", card: "#05303c", sidebar: "#00212b", accent: "#268bd2" },
    "Tokyo Night": { bg: "#1a1b26", fg: "#c0caf5", cursor: "#c0caf5", ui: "#565f89", header: "#24283b", card: "#1f2335", sidebar: "#16161e", accent: "#7aa2f7" },
    "Gruvbox Dark": { bg: "#282828", fg: "#ebdbb2", cursor: "#ebdbb2", ui: "#928374", header: "#3c3836", card: "#32302f", sidebar: "#1d2021", accent: "#fabd2f" },
    "Kanagawa Wave": { bg: "#1f1f28", fg: "#dcd7ba", cursor: "#c8c093", ui: "#727169", header: "#2a2a37", card: "#252532", sidebar: "#16161d", accent: "#7e9cd8" },
    "Material Dark": { bg: "#263238", fg: "#eeffff", cursor: "#ffcc00", ui: "#546e7a", header: "#37474f", card: "#2e3c43", sidebar: "#1e272c", accent: "#80cbc4" },
    "Everforest Dark": { bg: "#282e32", fg: "#d3c6aa", cursor: "#d3c6aa", ui: "#7a8478", header: "#343c41", card: "#2f363b", sidebar: "#202528", accent: "#a7c080" },
    "Night Owl": { bg: "#011627", fg: "#d6deeb", cursor: "#7e57c2", ui: "#5f7e97", header: "#0b253a", card: "#061d31", sidebar: "#00101d", accent: "#c792ea" },
    "Rose Pine": { bg: "#191724", fg: "#e0def4", cursor: "#56526e", ui: "#6e6a86", header: "#26233a", card: "#211f33", sidebar: "#13121d", accent: "#ebbcba" }
};

const DEFAULT_SETTINGS = {
    sidebarMode: 'COLLAPSIBLE', // 'COLLAPSIBLE' | 'FIXED' | 'AUTO_HIDE'
    enableHud: true,
    theme: 'Termius Dark',
    fontFamily: "'Termius JetBrains Mono NF', monospace",
    cursorStyle: 'BLOCK_BLINK',
    fontSize: 14,
    showAccessoryBar: true,
    rannlabsEndpoint: 'https://api.rann-labs.com/v1/logs/sync',
    rannlabsApiKey: '',
    autoSync: true,
    logRetentionDays: 30,
    keepalive: true
};

// Initial Seed Data for Hosts
const DEFAULT_HOSTS = [
    {
        id: "local_device",
        name: "Huawei MatePad 12X (Local)",
        hostname: "localhost",
        port: 0,
        username: "u0_a210",
        authType: "LOCAL_PTY",
        category: "Local",
        colorAccent: "#10b981",
        telemetry: {
            os: "HarmonyOS 4.2 / Android 12 Linux 5.10.160-aarch64",
            specs: "12GB LPDDR5 | 2800x1840 144Hz | Wi-Fi 6+",
            cores: 8,
            diskLabel: "/data (Internal UFS 3.1)",
            diskUsed: 42,
            diskTotal: 256,
            dockerEnabled: false
        }
    },
    {
        id: "demo_vps",
        name: "Production VPS (Singapore)",
        hostname: "103.145.22.45",
        port: 22,
        username: "ubuntu",
        authType: "PASSWORD",
        category: "Cloud",
        colorAccent: "#38bdf8",
        telemetry: {
            os: "Ubuntu 24.04 LTS (Linux 6.8.0-31-generic)",
            specs: "AMD EPYC 7763 (4 vCPU) | 8GB RAM | 1Gbps Uplink",
            cores: 4,
            diskLabel: "/dev/nvme0n1p1 (Root)",
            diskUsed: 38,
            diskTotal: 100,
            dockerEnabled: true
        }
    },
    {
        id: "homelab_pi",
        name: "HomeLab Raspberry Pi 5",
        hostname: "192.168.1.150",
        port: 22,
        username: "pi",
        authType: "PASSWORD",
        category: "HomeLab",
        colorAccent: "#f59e0b",
        telemetry: {
            os: "Debian GNU/Linux 12 (bookworm) 6.6.20+rpt-rpi-2712",
            specs: "Broadcom BCM2712 Quad Cortex-A76 | 8GB LPDDR4X",
            cores: 4,
            diskLabel: "/dev/sda1 (NVMe SSD)",
            diskUsed: 78,
            diskTotal: 500,
            dockerEnabled: true
        }
    }
];

// Initial Seed Data for Snippets
const DEFAULT_SNIPPETS = [
    { id: "snip_1", title: "Docker Container List", command: "docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" },
    { id: "snip_2", title: "System Resources (htop)", command: "htop" },
    { id: "snip_3", title: "Disk Storage Utilization", command: "df -h -x tmpfs -x devtmpfs" },
    { id: "snip_4", title: "Listening Network Ports", command: "ss -tulpn | grep LISTEN" },
    { id: "snip_5", title: "System Info & Uptime", command: "uname -a && uptime" },
    { id: "snip_6", title: "Rann-Labs Health Check", command: "curl -sI https://api.rann-labs.com/v1/health" }
];

// Initial Seed Data for Port Forwarding Tunnels
const DEFAULT_TUNNELS = [
    {
        id: "tun_1",
        label: "Production Web Port",
        localPort: 8080,
        remoteHost: "localhost",
        remotePort: 80,
        targetHostId: "demo_vps",
        active: true
    },
    {
        id: "tun_2",
        label: "PostgreSQL Remote DB",
        localPort: 5432,
        remoteHost: "127.0.0.1",
        remotePort: 5432,
        targetHostId: "demo_vps",
        active: false
    },
    {
        id: "tun_3",
        label: "HomeLab Grafana Dashboard",
        localPort: 3000,
        remoteHost: "localhost",
        remotePort: 3000,
        targetHostId: "homelab_pi",
        active: true
    }
];

// Initial Seed Data for SSH Keys
const DEFAULT_KEYS = [
    {
        id: "key_1",
        name: "matepad12x_hardware_ed25519",
        algo: "ED25519",
        fingerprint: "SHA256:4vXn2J9hL8eK+1pQrS0tUvWxYzAbCdEfGhIjKlMnOpQ",
        created: "2026-03-15"
    },
    {
        id: "key_2",
        name: "rannlabs_deploy_rsa4096",
        algo: "RSA 4096",
        fingerprint: "SHA256:9qRtYuIoPaSdFgHjKlZxCvBnMqWeRtYuIoPaSdFgHjK",
        created: "2026-02-10"
    },
    {
        id: "key_3",
        name: "homelab_cluster_root",
        algo: "ED25519",
        fingerprint: "SHA256:1aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789aBcDeF",
        created: "2026-01-20"
    }
];

// Initial Seed Data for Termius Pro Session Windows Presets
const DEFAULT_SESSION_WINDOWS = [
    {
        id: "sw_1",
        name: "Quad Cloud Matrix (2x2)",
        layout: "QUAD",
        hostIds: ["local_device", "demo_vps", "homelab_pi", "local_device"],
        activePane: 1,
        createdAt: "2026-03-20"
    },
    {
        id: "sw_2",
        name: "Production Dual Ops (1x2)",
        layout: "DUAL_H",
        hostIds: ["demo_vps", "homelab_pi"],
        activePane: 1,
        createdAt: "2026-03-20"
    },
    {
        id: "sw_3",
        name: "PiP Telemetry Node",
        layout: "PIP",
        hostIds: ["local_device", "demo_vps"],
        activePane: 1,
        createdAt: "2026-03-21"
    },
    {
        id: "sw_4",
        name: "Single Local Shell (1x1)",
        layout: "SINGLE",
        hostIds: ["local_device"],
        activePane: 1,
        createdAt: "2026-03-21"
    }
];

// App State
let settings = loadSettings();
let hosts = loadHosts();
let snippets = loadSnippets();
let tunnels = loadTunnels();
let keys = loadKeys();
let sessionWindows = loadSessionWindows();
let activityLogs = loadActivityLogs();

let currentNavMode = 'hosts'; // 'hosts' | 'session_windows' | 'serverbox' | 'port_forwarding' | 'snippets' | 'keys' | 'logs'
let activeTabIndex = 0;
let currentSplitMode = 'SINGLE'; // 'SINGLE' | 'DUAL_H' | 'DUAL_V' | 'QUAD' | 'PIP'
let activeFocusedPane = 1; // 1..4
let isSidebarCollapsed = false;
let activeLogFilterDate = getTodayDateString();
let activeHudHostId = 'local_device';
let searchQuery = '';

// Multi-Tab Session State
let tabs = [
    {
        id: "tab_1",
        host: hosts[0],
        history: [
            "<span class='ansi-cyan ansi-bold'>MateTerminal-Box [Huawei MatePad 12X Local PTY Subshell]</span>",
            "<span class='ansi-green'>Display: 12.0\" 2800x1840 | 144Hz Refresh | HarmonyOS Subsystem</span>",
            "<span class='ansi-purple'>Powerline Agonster Prompt Active | Zero Emojis Standard</span>",
            "<span class='ansi-blue'>Type 'help', 'status', 'htop', 'uname -a', 'docker ps', 'sync', or 'clear'</span><br>"
        ]
    }
];

// DOM Elements
const sidebarEl = document.getElementById('sidebar');
const hostListEl = document.getElementById('host-list');
const sidebarTitleEl = document.getElementById('sidebar-title');
const sidebarCounterEl = document.getElementById('sidebar-counter');
const sidebarSearchInput = document.getElementById('sidebar-search-input');
const tabsContainerEl = document.getElementById('tabs-container');
const btnTabScrollLeft = document.getElementById('btn-tab-scroll-left');
const btnTabScrollRight = document.getElementById('btn-tab-scroll-right');
const btnTabDropdownToggle = document.getElementById('btn-tab-dropdown-toggle');
const tabDropdownMenu = document.getElementById('tab-dropdown-menu');

const terminalWrapper = document.getElementById('terminal-wrapper');
const accessoryBar = document.getElementById('accessory-bar');
const btnToggleAccessoryBar = document.getElementById('btn-toggle-accessory-bar');
const fabAddHost = document.getElementById('fab-add-host');

const serverboxHud = document.getElementById('serverbox-hud');
const hudTargetSelector = document.getElementById('hud-target-selector');
const activityLogsView = document.getElementById('activity-logs-view');
const sessionWindowsView = document.getElementById('session-windows-view');
const sessionWindowsGrid = document.getElementById('session-windows-grid');
const clockEl = document.getElementById('clock');

const btnSidebarCollapse = document.getElementById('btn-sidebar-collapse');
const btnSidebarExpand = document.getElementById('btn-sidebar-expand');
const btnToggleHudMode = document.getElementById('btn-toggle-hud-mode');
const hudToggleText = document.getElementById('hud-toggle-text');
const btnCloseHud = document.getElementById('btn-close-hud');
const globalSyncBadge = document.getElementById('global-sync-badge');
const toastEl = document.getElementById('toast-notify');
const toastMessageEl = document.getElementById('toast-message');

// Split Mode Selector Elements
const splitModeSelector = document.getElementById('split-mode-selector');
const splitButtons = {
    SINGLE: document.getElementById('btn-mode-single'),
    DUAL_H: document.getElementById('btn-mode-dual-h'),
    DUAL_V: document.getElementById('btn-mode-dual-v'),
    QUAD: document.getElementById('btn-mode-quad'),
    PIP: document.getElementById('btn-mode-pip')
};

// Activity Log Elements
const logDatePicker = document.getElementById('log-date-picker');
const logSearchInput = document.getElementById('log-search-input');
const logsTableBody = document.getElementById('logs-table-body');
const logCountTotal = document.getElementById('log-count-total');
const logCountSynced = document.getElementById('log-count-synced');
const logCountPending = document.getElementById('log-count-pending');
const btnSyncRannLabs = document.getElementById('btn-sync-rannlabs');
const btnSyncRannLabsSidebar = document.getElementById('btn-sync-rannlabs-sidebar');
const btnExportLogs = document.getElementById('btn-export-logs');

// Settings Modal Elements
const modalSettings = document.getElementById('modal-settings');
const btnOpenSettings = document.getElementById('btn-open-settings');
const btnWorkspaceSettings = document.getElementById('btn-workspace-settings');
const modalSettingsClose = document.getElementById('modal-settings-close');
const modalSettingsCancel = document.getElementById('modal-settings-cancel');
const modalSettingsSave = document.getElementById('modal-settings-save');

const settingSidebarMode = document.getElementById('setting-sidebar-mode');
const settingEnableHud = document.getElementById('setting-enable-hud');
const settingTheme = document.getElementById('setting-theme');
const settingFontFamily = document.getElementById('setting-font-family');
const settingCursorStyle = document.getElementById('setting-cursor-style');
const settingFontSize = document.getElementById('setting-font-size');
const settingShowAccessoryBar = document.getElementById('setting-show-accessory-bar');
const settingRannlabsEndpoint = document.getElementById('setting-rannlabs-endpoint');
const settingRannlabsKey = document.getElementById('setting-rannlabs-key');
const settingAutoSync = document.getElementById('setting-auto-sync');
const settingLogRetention = document.getElementById('setting-log-retention');
const settingKeepalive = document.getElementById('setting-keepalive');

// Resource Modals
const modalAddHost = document.getElementById('modal-add-host');
const modalAddForward = document.getElementById('modal-add-forward');
const modalAddSnippet = document.getElementById('modal-add-snippet');
const modalAddKey = document.getElementById('modal-add-key');
const modalAddSessionWindow = document.getElementById('modal-add-session-window');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    applySettingsToUI();
    initActivityLogsDate();
    initHudTargetSelector();
    updateForwardHostDropdown();
    renderSidebarList();
    renderTabs();
    applySplitLayout(currentSplitMode, false);
    renderAllPanes();
    setupEventListeners();
    setupAccessoryKeys();
    setupTabNavigation();
    setupPaneInteractions();
    startTelemetryEngine();

    // Initial launch activity log
    recordActivityLog('SESSION_OPEN', 'MatePad-12X', 'Session started on local PTY shell (3:2 2800x1840 display)', 0);
});

// Helper: Date string YYYY-MM-DD
function getTodayDateString(dateObj) {
    const d = dateObj || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTimeString(isoString) {
    const d = new Date(isoString);
    return d.toTimeString().split(' ')[0];
}

// Clock updater
function initClock() {
    function update() {
        const d = new Date();
        if (clockEl) clockEl.textContent = d.toTimeString().split(' ')[0];
    }
    setInterval(update, 1000);
    update();
}

// Settings Management
function loadSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return saved ? Object.assign({}, DEFAULT_SETTINGS, JSON.parse(saved)) : Object.assign({}, DEFAULT_SETTINGS);
    } catch (e) {
        return Object.assign({}, DEFAULT_SETTINGS);
    }
}

function saveSettings(newSettings) {
    settings = Object.assign({}, settings, newSettings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    applySettingsToUI();
    recordActivityLog('SETTINGS_CHANGE', 'System', 'Preferences updated and saved', 0);
    showToast('Settings saved successfully.');
}

function applySettingsToUI() {
    // 1. Official Termius Color Scheme Application
    const scheme = TERMIUS_SCHEMES[settings.theme] || TERMIUS_SCHEMES["Termius Dark"];
    if (scheme) {
        document.documentElement.style.setProperty('--termius-terminal-bg', scheme.bg);
        document.documentElement.style.setProperty('--termius-sidebar-bg', scheme.sidebar);
        document.documentElement.style.setProperty('--termius-main-bg', scheme.bg === '#000000' ? '#0a0a0a' : '#1b1c2e');
        document.documentElement.style.setProperty('--termius-header-bg', scheme.header);
        document.documentElement.style.setProperty('--termius-card-bg', scheme.card);
        document.documentElement.style.setProperty('--accent-purple', scheme.accent);
    }

    // 2. Nerd Font Family & Font Size
    const chosenFont = settings.fontFamily || "'Termius JetBrains Mono NF', monospace";
    document.documentElement.style.setProperty('--font-mono', chosenFont);
    document.documentElement.style.setProperty('--term-font-size', `${settings.fontSize}px`);

    // 3. Cursor Style & Blink
    const cursorEls = document.querySelectorAll('.term-cursor');
    cursorEls.forEach(cursorEl => {
        cursorEl.className = 'term-cursor';
        if (settings.cursorStyle === 'BAR_BLINK') {
            cursorEl.classList.add('cursor-bar');
        } else if (settings.cursorStyle === 'UNDERLINE_BLINK') {
            cursorEl.classList.add('cursor-underline');
        } else if (settings.cursorStyle === 'BLOCK_STEADY') {
            cursorEl.classList.add('cursor-steady');
        }
    });

    // 4. Sidebar Mode
    if (sidebarEl && btnSidebarCollapse && btnSidebarExpand) {
        if (settings.sidebarMode === 'FIXED') {
            sidebarEl.classList.remove('collapsed');
            btnSidebarCollapse.style.display = 'none';
            btnSidebarExpand.style.display = 'none';
            isSidebarCollapsed = false;
        } else {
            btnSidebarCollapse.style.display = 'flex';
            btnSidebarExpand.style.display = isSidebarCollapsed ? 'flex' : 'none';
        }
    }

    // 5. ServerBox HUD Button Visibility
    if (btnToggleHudMode) {
        if (settings.enableHud) {
            btnToggleHudMode.style.display = 'flex';
            const navHud = document.getElementById('nav-serverbox');
            if (navHud) navHud.style.display = 'flex';
        } else {
            btnToggleHudMode.style.display = 'none';
            const navHud = document.getElementById('nav-serverbox');
            if (navHud) navHud.style.display = 'none';
            if (currentNavMode === 'serverbox') {
                switchNavMode('hosts', document.getElementById('nav-hosts'));
            }
        }
    }

    // 6. Virtual Accessory Key Bar Visibility
    if (accessoryBar) {
        if (settings.showAccessoryBar) {
            accessoryBar.classList.remove('hidden');
            if (btnToggleAccessoryBar) btnToggleAccessoryBar.classList.add('active');
        } else {
            accessoryBar.classList.add('hidden');
            if (btnToggleAccessoryBar) btnToggleAccessoryBar.classList.remove('active');
        }
    }

    // 7. Keepalive status
    const keepaliveLabel = document.getElementById('keepalive-label');
    const liveIndicator = document.getElementById('live-indicator');
    if (keepaliveLabel && liveIndicator) {
        if (settings.keepalive) {
            keepaliveLabel.textContent = 'KEEPALIVE ACTIVE';
            liveIndicator.style.backgroundColor = 'var(--accent-emerald)';
        } else {
            keepaliveLabel.textContent = 'KEEPALIVE OFF';
            liveIndicator.style.backgroundColor = 'var(--accent-amber)';
        }
    }

    // Populate Settings Modal Inputs
    if (settingSidebarMode) settingSidebarMode.value = settings.sidebarMode;
    if (settingEnableHud) settingEnableHud.checked = settings.enableHud;
    if (settingTheme) settingTheme.value = settings.theme || "Termius Dark";
    if (settingFontFamily) settingFontFamily.value = settings.fontFamily || "'Termius JetBrains Mono NF', monospace";
    if (settingCursorStyle) settingCursorStyle.value = settings.cursorStyle || "BLOCK_BLINK";
    if (settingFontSize) settingFontSize.value = String(settings.fontSize);
    if (settingShowAccessoryBar) settingShowAccessoryBar.checked = settings.showAccessoryBar;
    if (settingRannlabsEndpoint) settingRannlabsEndpoint.value = settings.rannlabsEndpoint;
    if (settingRannlabsKey) settingRannlabsKey.value = settings.rannlabsApiKey;
    if (settingAutoSync) settingAutoSync.checked = settings.autoSync;
    if (settingLogRetention) settingLogRetention.value = String(settings.logRetentionDays);
    if (settingKeepalive) settingKeepalive.checked = settings.keepalive;
}

// Storage Loaders
function loadHosts() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.HOSTS);
        return saved ? JSON.parse(saved) : DEFAULT_HOSTS;
    } catch (e) {
        return DEFAULT_HOSTS;
    }
}

function loadSnippets() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.SNIPPETS);
        return saved ? JSON.parse(saved) : DEFAULT_SNIPPETS;
    } catch (e) {
        return DEFAULT_SNIPPETS;
    }
}

function loadTunnels() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.TUNNELS);
        return saved ? JSON.parse(saved) : DEFAULT_TUNNELS;
    } catch (e) {
        return DEFAULT_TUNNELS;
    }
}

function loadKeys() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.KEYS);
        return saved ? JSON.parse(saved) : DEFAULT_KEYS;
    } catch (e) {
        return DEFAULT_KEYS;
    }
}

function loadSessionWindows() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.SESSION_WINDOWS);
        return saved ? JSON.parse(saved) : DEFAULT_SESSION_WINDOWS;
    } catch (e) {
        return DEFAULT_SESSION_WINDOWS;
    }
}

// Activity Logging Management
function loadActivityLogs() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
        if (saved) return JSON.parse(saved);
    } catch (e) {}

    const today = getTodayDateString();
    const yesterday = getTodayDateString(new Date(Date.now() - 86400000));

    const seedLogs = [
        {
            id: "log_init_1",
            logDate: today,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            eventType: "SESSION_OPEN",
            hostTarget: "Huawei MatePad 12X (Local)",
            commandText: "Launched local PTY shell subsystem (HarmonyOS 4.2 / Linux 5.10.160)",
            durationMs: 0,
            syncStatus: "SYNCED"
        },
        {
            id: "log_init_2",
            logDate: today,
            timestamp: new Date(Date.now() - 1200000).toISOString(),
            eventType: "COMMAND_EXEC",
            hostTarget: "Production VPS",
            commandText: "docker ps -a --format 'table {{.Names}}\t{{.Status}}'",
            durationMs: 142,
            syncStatus: "SYNCED"
        },
        {
            id: "log_init_3",
            logDate: today,
            timestamp: new Date(Date.now() - 600000).toISOString(),
            eventType: "HUD_INSPECT",
            hostTarget: "MatePad-12X (Local)",
            commandText: "Polled 8 CPU cores & 12GB LPDDR5 RAM telemetry",
            durationMs: 0,
            syncStatus: "PENDING"
        },
        {
            id: "log_init_4",
            logDate: yesterday,
            timestamp: new Date(Date.now() - 95000000).toISOString(),
            eventType: "SSH_CONNECT",
            hostTarget: "HomeLab Raspberry Pi 5",
            commandText: "SSH key authentication handshake successful",
            durationMs: 88,
            syncStatus: "SYNCED"
        }
    ];

    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(seedLogs));
    return seedLogs;
}

function recordActivityLog(eventType, hostTarget, commandText, durationMs = 0) {
    const today = getTodayDateString();
    const newEntry = {
        id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        logDate: today,
        timestamp: new Date().toISOString(),
        eventType: eventType,
        hostTarget: hostTarget,
        commandText: commandText,
        durationMs: durationMs,
        syncStatus: "PENDING"
    };

    activityLogs.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));

    if (currentNavMode === 'logs') {
        renderActivityLogsTable();
    }
    updateLogsCountBadges();
}

function initActivityLogsDate() {
    if (!logDatePicker) return;
    logDatePicker.value = activeLogFilterDate;
    logDatePicker.addEventListener('change', (e) => {
        activeLogFilterDate = e.target.value;
        renderActivityLogsTable();
        renderSidebarList();
    });
}

function updateLogsCountBadges() {
    const pendingCount = activityLogs.filter(l => l.syncStatus === 'PENDING').length;
    const badgeLogsSync = document.getElementById('badge-logs-sync');
    if (badgeLogsSync) {
        badgeLogsSync.textContent = pendingCount > 0 ? `${pendingCount} NEW` : 'SYNC';
        badgeLogsSync.className = pendingCount > 0 ? 'drawer-badge badge-hud' : 'drawer-badge badge-sync';
    }
}

function renderActivityLogsTable() {
    if (!logsTableBody) return;
    logsTableBody.innerHTML = '';

    const filterText = (logSearchInput ? logSearchInput.value : '').toLowerCase().trim();

    const filtered = activityLogs.filter(log => {
        const matchesDate = !activeLogFilterDate || log.logDate === activeLogFilterDate;
        const matchesText = !filterText || 
            log.hostTarget.toLowerCase().includes(filterText) ||
            log.commandText.toLowerCase().includes(filterText) ||
            log.eventType.toLowerCase().includes(filterText);
        return matchesDate && matchesText;
    });

    const totalInDate = activityLogs.filter(l => !activeLogFilterDate || l.logDate === activeLogFilterDate).length;
    const syncedInDate = activityLogs.filter(l => (!activeLogFilterDate || l.logDate === activeLogFilterDate) && l.syncStatus === 'SYNCED').length;
    const pendingInDate = activityLogs.filter(l => (!activeLogFilterDate || l.logDate === activeLogFilterDate) && l.syncStatus === 'PENDING').length;

    if (logCountTotal) logCountTotal.textContent = `Total: ${totalInDate} entries`;
    if (logCountSynced) logCountSynced.textContent = `Synced: ${syncedInDate}`;
    if (logCountPending) logCountPending.textContent = `Pending: ${pendingInDate}`;

    if (filtered.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No activity logs found for ${activeLogFilterDate || 'selected criteria'}.</td>`;
        logsTableBody.appendChild(tr);
        return;
    }

    filtered.forEach(log => {
        const tr = document.createElement('tr');
        const typeClass = log.eventType === 'COMMAND_EXEC' ? 'type-cmd' : (log.eventType === 'SESSION_OPEN' || log.eventType === 'SSH_CONNECT' ? 'type-ssh' : 'type-sys');
        const syncClass = log.syncStatus === 'SYNCED' ? 'log-status-synced' : 'log-status-pending';

        tr.innerHTML = `
            <td><span class="log-time">${formatTimeString(log.timestamp)}</span></td>
            <td><span class="log-type-badge ${typeClass}">${log.eventType}</span></td>
            <td><span class="log-target">${escapeHtml(log.hostTarget)}</span></td>
            <td><span class="log-cmd">${escapeHtml(log.commandText)}</span></td>
            <td><span class="log-latency">${log.durationMs > 0 ? log.durationMs + 'ms' : '-'}</span></td>
            <td><span class="log-status-badge ${syncClass}">${log.syncStatus}</span></td>
        `;
        logsTableBody.appendChild(tr);
    });
}

function syncLogsToRannLabs() {
    const pendingLogs = activityLogs.filter(l => l.syncStatus === 'PENDING');
    if (pendingLogs.length === 0) {
        showToast('All activity logs are already synchronized to Rann-Labs.');
        return;
    }

    if (globalSyncBadge) {
        globalSyncBadge.textContent = "Rann-Labs: Syncing...";
        globalSyncBadge.style.color = "var(--accent-amber)";
    }

    showToast(`Syncing ${pendingLogs.length} activity entries to ${settings.rannlabsEndpoint}...`);

    setTimeout(() => {
        activityLogs.forEach(log => {
            if (log.syncStatus === 'PENDING') {
                log.syncStatus = 'SYNCED';
            }
        });
        localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));

        if (globalSyncBadge) {
            globalSyncBadge.textContent = "Rann-Labs: Synced";
            globalSyncBadge.style.color = "var(--accent-emerald)";
        }

        renderActivityLogsTable();
        renderSidebarList();
        updateLogsCountBadges();
        showToast(`Successfully synchronized ${pendingLogs.length} audit logs to Rann-Labs server.`);
    }, 900);
}

function exportLogsToJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activityLogs, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `mateterminal_activity_logs_${getTodayDateString()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('Activity logs exported as JSON file.');
}

// Event Listeners Setup
function setupEventListeners() {
    // Drawer Nav Items
    document.querySelectorAll('.drawer-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const mode = item.dataset.mode;
            switchNavMode(mode, item);
        });
    });

    // Sidebar Search Filter Input
    if (sidebarSearchInput) {
        sidebarSearchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderSidebarList();
        });
    }

    // Sidebar Collapse / Expand
    if (btnSidebarCollapse) {
        btnSidebarCollapse.addEventListener('click', () => {
            sidebarEl.classList.add('collapsed');
            if (btnSidebarExpand) btnSidebarExpand.style.display = 'flex';
            isSidebarCollapsed = true;
        });
    }

    if (btnSidebarExpand) {
        btnSidebarExpand.addEventListener('click', () => {
            sidebarEl.classList.remove('collapsed');
            btnSidebarExpand.style.display = 'none';
            isSidebarCollapsed = false;
        });
    }

    // Top HUD toggle button
    if (btnToggleHudMode) {
        btnToggleHudMode.addEventListener('click', () => {
            if (currentNavMode === 'serverbox') {
                switchNavMode('hosts', document.getElementById('nav-hosts'));
            } else {
                switchNavMode('serverbox', document.getElementById('nav-serverbox'));
            }
        });
    }

    if (btnCloseHud) {
        btnCloseHud.addEventListener('click', () => {
            switchNavMode('hosts', document.getElementById('nav-hosts'));
        });
    }

    // Accessory Bar Toggle Button
    if (btnToggleAccessoryBar) {
        btnToggleAccessoryBar.addEventListener('click', () => {
            const nextState = accessoryBar.classList.contains('hidden');
            if (nextState) {
                accessoryBar.classList.remove('hidden');
                btnToggleAccessoryBar.classList.add('active');
            } else {
                accessoryBar.classList.add('hidden');
                btnToggleAccessoryBar.classList.remove('active');
            }
            settings.showAccessoryBar = nextState;
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        });
    }

    // New Tab Button
    const btnNewTab = document.getElementById('btn-new-tab');
    if (btnNewTab) {
        btnNewTab.addEventListener('click', () => {
            openNewTab(hosts[0]);
        });
    }

    // Split Mode Selector Buttons (1x1, 1x2, 2x1, 2x2, PiP)
    Object.keys(splitButtons).forEach(mode => {
        const btn = splitButtons[mode];
        if (btn) {
            btn.addEventListener('click', () => {
                applySplitLayout(mode, true);
            });
        }
    });

    // Session Windows Manager Button
    const btnCreateSessionWindow = document.getElementById('btn-create-session-window');
    if (btnCreateSessionWindow) {
        btnCreateSessionWindow.addEventListener('click', () => {
            openCreateSessionWindowModal();
        });
    }

    // Floating Action Button (FAB) -> Contextual Action
    if (fabAddHost) {
        fabAddHost.addEventListener('click', () => {
            handleFabClick();
        });
    }

    const btnAddHostQuick = document.getElementById('btn-add-host-quick');
    if (btnAddHostQuick) {
        btnAddHostQuick.addEventListener('click', () => {
            handleFabClick();
        });
    }

    // Activity Log Listeners
    if (logSearchInput) logSearchInput.addEventListener('input', () => renderActivityLogsTable());
    if (btnSyncRannLabs) btnSyncRannLabs.addEventListener('click', syncLogsToRannLabs);
    if (btnSyncRannLabsSidebar) btnSyncRannLabsSidebar.addEventListener('click', syncLogsToRannLabs);
    if (btnExportLogs) btnExportLogs.addEventListener('click', exportLogsToJson);

    // Host Modal
    setupModal('modal-add-host', 'modal-close', 'modal-btn-cancel', 'modal-btn-save', saveNewHost);
    
    // Port Forward Modal
    setupModal('modal-add-forward', 'modal-forward-close', 'modal-forward-cancel', 'modal-forward-save', saveNewTunnel);
    
    // Snippet Modal
    setupModal('modal-add-snippet', 'modal-snippet-close', 'modal-snippet-cancel', 'modal-snippet-save', saveNewSnippet);
    
    // Key Modal
    setupModal('modal-add-key', 'modal-key-close', 'modal-key-cancel', 'modal-key-save', saveNewKey);

    // Session Window Preset Modal
    setupModal('modal-add-session-window', 'modal-session-window-close', 'modal-session-window-cancel', 'modal-session-window-save', saveNewSessionWindow);

    // Settings Modal
    if (btnOpenSettings) btnOpenSettings.addEventListener('click', () => modalSettings.classList.remove('hidden'));
    if (btnWorkspaceSettings) btnWorkspaceSettings.addEventListener('click', () => modalSettings.classList.remove('hidden'));
    if (modalSettingsClose) modalSettingsClose.addEventListener('click', () => modalSettings.classList.add('hidden'));
    if (modalSettingsCancel) modalSettingsCancel.addEventListener('click', () => modalSettings.classList.add('hidden'));
    if (modalSettingsSave) {
        modalSettingsSave.addEventListener('click', () => {
            const updated = {
                sidebarMode: settingSidebarMode.value,
                enableHud: settingEnableHud.checked,
                theme: settingTheme.value,
                fontFamily: settingFontFamily ? settingFontFamily.value : "'Termius JetBrains Mono NF', monospace",
                cursorStyle: settingCursorStyle ? settingCursorStyle.value : "BLOCK_BLINK",
                fontSize: parseInt(settingFontSize.value, 10) || 14,
                showAccessoryBar: settingShowAccessoryBar ? settingShowAccessoryBar.checked : true,
                rannlabsEndpoint: settingRannlabsEndpoint.value.trim() || DEFAULT_SETTINGS.rannlabsEndpoint,
                rannlabsApiKey: settingRannlabsKey.value.trim(),
                autoSync: settingAutoSync.checked,
                logRetentionDays: parseInt(settingLogRetention.value, 10) || 30,
                keepalive: settingKeepalive.checked
            };
            saveSettings(updated);
            modalSettings.classList.add('hidden');
        });
    }

    // Close tab dropdown if clicked outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.tab-dropdown-wrap')) {
            if (tabDropdownMenu) tabDropdownMenu.classList.add('hidden');
        }
    });
}

function setupModal(modalId, closeBtnId, cancelBtnId, saveBtnId, saveCallback) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const closeBtn = document.getElementById(closeBtnId);
    const cancelBtn = document.getElementById(cancelBtnId);
    const saveBtn = document.getElementById(saveBtnId);

    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
    if (saveBtn) saveBtn.addEventListener('click', () => {
        saveCallback();
        modal.classList.add('hidden');
    });
}

function handleFabClick() {
    if (currentNavMode === 'port_forwarding') {
        updateForwardHostDropdown();
        if (modalAddForward) modalAddForward.classList.remove('hidden');
    } else if (currentNavMode === 'snippets') {
        if (modalAddSnippet) modalAddSnippet.classList.remove('hidden');
    } else if (currentNavMode === 'keys') {
        if (modalAddKey) modalAddKey.classList.remove('hidden');
    } else if (currentNavMode === 'session_windows') {
        openCreateSessionWindowModal();
    } else {
        if (modalAddHost) modalAddHost.classList.remove('hidden');
    }
}

function updateForwardHostDropdown() {
    const sel = document.getElementById('forward-ssh-target');
    if (!sel) return;
    sel.innerHTML = '';
    hosts.filter(h => h.authType !== 'LOCAL_PTY').forEach(h => {
        const opt = document.createElement('option');
        opt.value = h.id;
        opt.textContent = `${h.name} (${h.hostname})`;
        sel.appendChild(opt);
    });
}

function switchNavMode(mode, targetBtn) {
    currentNavMode = mode;
    document.querySelectorAll('.drawer-nav-item').forEach(btn => btn.classList.remove('active'));
    if (targetBtn) targetBtn.classList.add('active');

    // Update Section Title & View Visibilities
    if (mode === 'serverbox') {
        sidebarTitleEl.textContent = "MONITOR TARGETS";
        terminalWrapper.classList.add('hidden');
        activityLogsView.classList.add('hidden');
        sessionWindowsView.classList.add('hidden');
        serverboxHud.classList.remove('hidden');
        hudToggleText.textContent = "Terminal";
        updateHudView();
    } else if (mode === 'logs') {
        sidebarTitleEl.textContent = "DAILY AUDIT ARCHIVE";
        terminalWrapper.classList.add('hidden');
        serverboxHud.classList.add('hidden');
        sessionWindowsView.classList.add('hidden');
        activityLogsView.classList.remove('hidden');
        hudToggleText.textContent = "HUD";
        renderActivityLogsTable();
    } else if (mode === 'session_windows') {
        sidebarTitleEl.textContent = "WORKSPACE PRESETS";
        terminalWrapper.classList.add('hidden');
        serverboxHud.classList.add('hidden');
        activityLogsView.classList.add('hidden');
        sessionWindowsView.classList.remove('hidden');
        hudToggleText.textContent = "HUD";
        renderSessionWindowsGrid();
    } else if (mode === 'port_forwarding') {
        sidebarTitleEl.textContent = "PORT FORWARDING";
        terminalWrapper.classList.remove('hidden');
        serverboxHud.classList.add('hidden');
        activityLogsView.classList.add('hidden');
        sessionWindowsView.classList.add('hidden');
        hudToggleText.textContent = "HUD";
    } else if (mode === 'keys') {
        sidebarTitleEl.textContent = "KEYS & IDENTITIES";
        terminalWrapper.classList.remove('hidden');
        serverboxHud.classList.add('hidden');
        activityLogsView.classList.add('hidden');
        sessionWindowsView.classList.add('hidden');
        hudToggleText.textContent = "HUD";
    } else if (mode === 'snippets') {
        sidebarTitleEl.textContent = "SNIPPET SCRIPTS";
        terminalWrapper.classList.remove('hidden');
        serverboxHud.classList.add('hidden');
        activityLogsView.classList.add('hidden');
        sessionWindowsView.classList.add('hidden');
        hudToggleText.textContent = "HUD";
    } else {
        sidebarTitleEl.textContent = "SAVED HOSTS";
        terminalWrapper.classList.remove('hidden');
        serverboxHud.classList.add('hidden');
        activityLogsView.classList.add('hidden');
        sessionWindowsView.classList.add('hidden');
        hudToggleText.textContent = "HUD";
    }

    renderSidebarList();
}

function renderSidebarList() {
    hostListEl.innerHTML = '';
    const q = searchQuery;

    if (currentNavMode === 'hosts' || currentNavMode === 'serverbox') {
        const filtered = hosts.filter(h => !q || h.name.toLowerCase().includes(q) || h.hostname.toLowerCase().includes(q) || h.category.toLowerCase().includes(q));
        sidebarCounterEl.textContent = filtered.length;
        
        filtered.forEach(host => {
            const item = document.createElement('div');
            item.className = 'host-item';
            
            const tagClass = host.category === 'Cloud' ? 'tag-cloud' : (host.category === 'Local' ? 'tag-local' : 'tag-homelab');

            item.innerHTML = `
                <div class="host-item-header">
                    <span class="host-name">${escapeHtml(host.name)}</span>
                    <span class="host-tag ${tagClass}">${host.category}</span>
                </div>
                <div class="host-item-meta">${host.username}@${host.hostname}:${host.port || 'PTY'}</div>
            `;

            item.addEventListener('click', () => {
                if (currentNavMode === 'serverbox') {
                    activeHudHostId = host.id;
                    if (hudTargetSelector) hudTargetSelector.value = host.id;
                    updateHudView();
                    recordActivityLog('HUD_INSPECT', host.name, `Inspected live telemetry dashboard for ${host.hostname}`, 0);
                } else {
                    openNewTab(host);
                }
            });

            hostListEl.appendChild(item);
        });
    } else if (currentNavMode === 'session_windows') {
        const filtered = sessionWindows.filter(sw => !q || sw.name.toLowerCase().includes(q) || sw.layout.toLowerCase().includes(q));
        sidebarCounterEl.textContent = filtered.length;

        filtered.forEach(sw => {
            const item = document.createElement('div');
            item.className = 'host-item';
            
            item.innerHTML = `
                <div class="host-item-header">
                    <span class="host-name">${escapeHtml(sw.name)}</span>
                    <span class="host-tag tag-cloud">${sw.layout}</span>
                </div>
                <div class="host-item-meta">${sw.hostIds.length} Hosts Bound | Created ${sw.createdAt}</div>
            `;

            item.addEventListener('click', () => {
                launchSessionWindow(sw);
            });

            hostListEl.appendChild(item);
        });
    } else if (currentNavMode === 'port_forwarding') {
        const filtered = tunnels.filter(t => !q || t.label.toLowerCase().includes(q) || String(t.localPort).includes(q) || String(t.remotePort).includes(q));
        sidebarCounterEl.textContent = filtered.length;

        filtered.forEach(tunnel => {
            const targetHost = hosts.find(h => h.id === tunnel.targetHostId) || hosts[1];
            const item = document.createElement('div');
            item.className = `tunnel-item ${tunnel.active ? 'active-tunnel' : ''}`;
            
            item.innerHTML = `
                <div class="tunnel-header">
                    <span class="tunnel-title">${escapeHtml(tunnel.label)}</span>
                    <span class="host-tag ${tunnel.active ? 'tag-local' : 'tag-homelab'}">${tunnel.active ? 'ACTIVE' : 'OFF'}</span>
                </div>
                <div class="tunnel-route">${tunnel.localPort} &rarr; ${tunnel.remoteHost}:${tunnel.remotePort}</div>
                <div class="tunnel-meta">Via ${escapeHtml(targetHost.name)}</div>
            `;

            item.addEventListener('click', () => {
                tunnel.active = !tunnel.active;
                localStorage.setItem(STORAGE_KEYS.TUNNELS, JSON.stringify(tunnels));
                renderSidebarList();
                recordActivityLog('TUNNEL_TOGGLE', tunnel.label, `Port forward tunnel ${tunnel.localPort}->${tunnel.remotePort} set to ${tunnel.active ? 'ACTIVE' : 'OFF'}`, 0);
                showToast(`Tunnel "${tunnel.label}" is now ${tunnel.active ? 'active' : 'stopped'}.`);
            });

            hostListEl.appendChild(item);
        });
    } else if (currentNavMode === 'snippets') {
        const filtered = snippets.filter(s => !q || s.title.toLowerCase().includes(q) || s.command.toLowerCase().includes(q));
        sidebarCounterEl.textContent = filtered.length;
        
        filtered.forEach(snippet => {
            const item = document.createElement('div');
            item.className = 'snippet-item';
            item.innerHTML = `
                <div class="host-item-header">
                    <span class="host-name" style="color: var(--accent-cyan)">${escapeHtml(snippet.title)}</span>
                </div>
                <div class="host-item-meta">${escapeHtml(snippet.command)}</div>
            `;

            item.addEventListener('click', () => {
                const targetTabIdx = getTabIdxForPane(activeFocusedPane);
                executeTerminalCommand(targetTabIdx, snippet.command);
                showToast(`Executed snippet: ${snippet.title} on Pane ${activeFocusedPane}`);
            });

            hostListEl.appendChild(item);
        });
    } else if (currentNavMode === 'keys') {
        const filtered = keys.filter(k => !q || k.name.toLowerCase().includes(q) || k.algo.toLowerCase().includes(q) || k.fingerprint.toLowerCase().includes(q));
        sidebarCounterEl.textContent = filtered.length;

        filtered.forEach(k => {
            const item = document.createElement('div');
            item.className = 'key-item';
            item.innerHTML = `
                <div class="key-header">
                    <span class="key-name-text">${escapeHtml(k.name)}</span>
                    <span class="key-badge-algo">${k.algo}</span>
                </div>
                <div class="key-fingerprint">${escapeHtml(k.fingerprint)}</div>
            `;

            item.addEventListener('click', () => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(`ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... ${k.name}@matepad12x`);
                }
                showToast(`Copied public key "${k.name}" to clipboard.`);
                recordActivityLog('KEY_COPY', k.name, `Copied public key fingerprint ${k.fingerprint}`, 0);
            });

            hostListEl.appendChild(item);
        });
    } else if (currentNavMode === 'logs') {
        const uniqueDates = Array.from(new Set(activityLogs.map(l => l.logDate))).sort().reverse();
        sidebarCounterEl.textContent = uniqueDates.length;

        uniqueDates.forEach(dateStr => {
            const dateLogs = activityLogs.filter(l => l.logDate === dateStr);
            const pendingInDate = dateLogs.filter(l => l.syncStatus === 'PENDING').length;
            const item = document.createElement('div');
            item.className = `log-date-item ${dateStr === activeLogFilterDate ? 'active' : ''}`;
            
            item.innerHTML = `
                <div class="host-item-header">
                    <span class="host-name">${escapeHtml(dateStr)}</span>
                    <span class="host-tag ${pendingInDate > 0 ? 'tag-homelab' : 'tag-local'}">${pendingInDate > 0 ? pendingInDate + ' Pending' : 'Synced'}</span>
                </div>
                <div class="host-item-meta">${dateLogs.length} activity events recorded</div>
            `;

            item.addEventListener('click', () => {
                activeLogFilterDate = dateStr;
                if (logDatePicker) logDatePicker.value = dateStr;
                renderSidebarList();
                renderActivityLogsTable();
            });

            hostListEl.appendChild(item);
        });
    }
}

// Session Windows Presets Management & Grid Rendering
function renderSessionWindowsGrid() {
    if (!sessionWindowsGrid) return;
    sessionWindowsGrid.innerHTML = '';

    sessionWindows.forEach(sw => {
        const card = document.createElement('div');
        card.className = 'session-window-card';

        const boundHosts = sw.hostIds.map(hId => hosts.find(h => h.id === hId) || hosts[0]);
        const boundBadges = boundHosts.map(h => `<span class="preset-chip ${h.category === 'Cloud' ? 'tag-cloud' : (h.category === 'Local' ? 'tag-local' : 'tag-homelab')}">${escapeHtml(h.name)}</span>`).join('');

        let matrixPreviewClass = 'preview-single';
        if (sw.layout === 'DUAL_H') matrixPreviewClass = 'preview-dual-h';
        else if (sw.layout === 'DUAL_V') matrixPreviewClass = 'preview-dual-v';
        else if (sw.layout === 'QUAD') matrixPreviewClass = 'preview-quad';
        else if (sw.layout === 'PIP') matrixPreviewClass = 'preview-pip';

        card.innerHTML = `
            <div class="session-card-header">
                <div class="session-card-title-group">
                    <div class="mini-matrix-badge ${matrixPreviewClass}">
                        <span></span><span></span><span></span><span></span>
                    </div>
                    <div>
                        <div class="session-card-name">${escapeHtml(sw.name)}</div>
                        <div class="session-card-layout">${sw.layout} Workspace Matrix</div>
                    </div>
                </div>
                <button class="icon-btn-tiny btn-del-preset" data-id="${sw.id}" title="Delete Preset">&times;</button>
            </div>
            <div class="session-card-chips">
                ${boundBadges}
            </div>
            <div class="session-card-footer">
                <span class="session-card-date">Created ${sw.createdAt}</span>
                <button class="btn-primary-sm btn-launch-preset" data-id="${sw.id}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <span>Launch Matrix</span>
                </button>
            </div>
        `;

        card.querySelector('.btn-launch-preset').addEventListener('click', () => {
            launchSessionWindow(sw);
        });

        card.querySelector('.btn-del-preset').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSessionWindow(sw.id);
        });

        sessionWindowsGrid.appendChild(card);
    });
}

function launchSessionWindow(sw) {
    // Switch view to terminal workspace
    switchNavMode('hosts', document.getElementById('nav-hosts'));
    
    // Ensure sufficient tabs exist for each bound host
    sw.hostIds.forEach((hId, idx) => {
        const host = hosts.find(h => h.id === hId) || hosts[0];
        if (idx < tabs.length) {
            tabs[idx].host = host;
        } else {
            tabs.push({
                id: "tab_" + (tabs.length + 1),
                host: host,
                history: [
                    `<span class='ansi-cyan'>[Session Matrix Connected: ${host.username}@${host.hostname}]</span>`,
                    `<span class='ansi-green'>Powerline Agonster Theme Engaged (Zero Emojis Standard)</span><br>`
                ]
            });
        }
    });

    activeTabIndex = 0;
    activeFocusedPane = sw.activePane || 1;
    applySplitLayout(sw.layout, true);
    renderTabs();
    renderAllPanes();
    showToast(`Launched Session Window Preset: "${sw.name}"`);
    recordActivityLog('SESSION_WINDOW_LAUNCH', sw.name, `Orchestrated ${sw.layout} matrix workspace across ${sw.hostIds.length} bound hosts`, 0);
}

function openCreateSessionWindowModal() {
    if (!modalAddSessionWindow) return;
    const chkContainer = document.getElementById('sw-hosts-checkboxes');
    if (chkContainer) {
        chkContainer.innerHTML = '';
        hosts.forEach(host => {
            const lbl = document.createElement('label');
            lbl.className = 'sw-checkbox-label';
            lbl.innerHTML = `
                <input type="checkbox" value="${host.id}" ${host.id === 'local_device' || host.id === 'demo_vps' ? 'checked' : ''}>
                <span>${escapeHtml(host.name)} (${host.username}@${host.hostname})</span>
            `;
            chkContainer.appendChild(lbl);
        });
    }
    modalAddSessionWindow.classList.remove('hidden');
}

function saveNewSessionWindow() {
    const nameInput = document.getElementById('sw-workspace-name');
    const layoutSelect = document.getElementById('sw-split-layout');
    const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "Custom Matrix Preset";
    const layout = layoutSelect ? layoutSelect.value : "DUAL_H";

    const chkContainer = document.getElementById('sw-hosts-checkboxes');
    const selectedHostIds = [];
    if (chkContainer) {
        chkContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(chk => {
            selectedHostIds.push(chk.value);
        });
    }

    if (selectedHostIds.length === 0) {
        selectedHostIds.push('local_device');
    }

    const newPreset = {
        id: "sw_" + Date.now(),
        name: name,
        layout: layout,
        hostIds: selectedHostIds,
        activePane: 1,
        createdAt: getTodayDateString()
    };

    sessionWindows.push(newPreset);
    localStorage.setItem(STORAGE_KEYS.SESSION_WINDOWS, JSON.stringify(sessionWindows));
    renderSessionWindowsGrid();
    renderSidebarList();
    recordActivityLog('SESSION_WINDOW_CREATE', name, `Created ${layout} workspace preset with ${selectedHostIds.length} bound hosts`, 0);
    showToast(`Saved Session Window Preset "${name}".`);
}

function deleteSessionWindow(presetId) {
    sessionWindows = sessionWindows.filter(sw => sw.id !== presetId);
    localStorage.setItem(STORAGE_KEYS.SESSION_WINDOWS, JSON.stringify(sessionWindows));
    renderSessionWindowsGrid();
    renderSidebarList();
    showToast('Session window preset deleted.');
}

// HUD Target Management
function initHudTargetSelector() {
    if (!hudTargetSelector) return;
    hudTargetSelector.innerHTML = '';
    hosts.forEach(host => {
        const opt = document.createElement('option');
        opt.value = host.id;
        opt.textContent = host.authType === 'LOCAL_PTY' 
            ? `Local Device: ${host.name}` 
            : `Remote Server: ${host.name} (${host.hostname})`;
        hudTargetSelector.appendChild(opt);
    });

    hudTargetSelector.addEventListener('change', (e) => {
        activeHudHostId = e.target.value;
        updateHudView();
    });
}

function updateHudView() {
    const host = hosts.find(h => h.id === activeHudHostId) || hosts[0];
    const hudHostName = document.getElementById('hud-host-name');
    const hudHostMeta = document.getElementById('hud-host-meta');
    const hudStatusBadge = document.getElementById('hud-status-badge');

    if (hudHostName) hudHostName.textContent = host.name;
    if (hudHostMeta) {
        hudHostMeta.textContent = `${host.telemetry ? host.telemetry.os : 'Linux Kernel'} | ${host.telemetry ? host.telemetry.specs : host.hostname} | Uptime: 14d 8h`;
    }

    if (hudStatusBadge) {
        hudStatusBadge.textContent = host.authType === 'LOCAL_PTY' ? 'LOCAL SHELL' : 'SSH CONNECTED';
    }

    // Toggle docker table visibility based on host
    const dockerSection = document.querySelector('.hud-sub-section');
    if (dockerSection) {
        if (host.telemetry && host.telemetry.dockerEnabled) {
            dockerSection.style.display = 'block';
        } else {
            dockerSection.style.display = 'none';
        }
    }
}

// Tab Navigation & Overflow Management
function setupTabNavigation() {
    if (btnTabScrollLeft) {
        btnTabScrollLeft.addEventListener('click', () => {
            tabsContainerEl.scrollBy({ left: -160, behavior: 'smooth' });
        });
    }

    if (btnTabScrollRight) {
        btnTabScrollRight.addEventListener('click', () => {
            tabsContainerEl.scrollBy({ left: 160, behavior: 'smooth' });
        });
    }

    // Support mouse horizontal wheel scrolling on tabs bar
    if (tabsContainerEl) {
        tabsContainerEl.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                tabsContainerEl.scrollLeft += e.deltaY;
            }
        }, { passive: false });
    }

    // Tab Dropdown Overview
    if (btnTabDropdownToggle) {
        btnTabDropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            renderTabDropdownMenu();
            tabDropdownMenu.classList.toggle('hidden');
        });
    }
}

function renderTabDropdownMenu() {
    if (!tabDropdownMenu) return;
    tabDropdownMenu.innerHTML = '';
    
    tabs.forEach((tab, index) => {
        const item = document.createElement('button');
        item.className = `tab-dropdown-item ${index === activeTabIndex ? 'active' : ''}`;
        item.innerHTML = `
            <span class="tab-dropdown-title">${index + 1}. ${escapeHtml(tab.host.name)}</span>
            <span class="tab-dropdown-badge">${tab.host.authType}</span>
        `;

        item.addEventListener('click', () => {
            activeTabIndex = index;
            renderTabs();
            renderAllPanes();
            tabDropdownMenu.classList.add('hidden');
            scrollToActiveTab();
        });

        tabDropdownMenu.appendChild(item);
    });
}

function scrollToActiveTab() {
    if (!tabsContainerEl) return;
    const activeTabEl = tabsContainerEl.children[activeTabIndex];
    if (activeTabEl) {
        activeTabEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
}

function openNewTab(host) {
    const newTab = {
        id: "tab_" + (tabs.length + 1),
        host: host,
        history: [
            `<span class='ansi-cyan'>[Session Connected: ${host.username}@${host.hostname}]</span>`,
            `<span class='ansi-green'>Powerline Theme Engaged (Zero Emojis Standard)</span><br>`
        ]
    };
    tabs.push(newTab);
    activeTabIndex = tabs.length - 1;
    renderTabs();
    renderAllPanes();
    scrollToActiveTab();

    recordActivityLog('SSH_CONNECT', host.name, `Connected to ${host.username}@${host.hostname}:${host.port || 22}`, 140);
}

function renderTabs() {
    if (!tabsContainerEl) return;
    tabsContainerEl.innerHTML = '';
    tabs.forEach((tab, index) => {
        const tabEl = document.createElement('div');
        tabEl.className = `term-tab ${index === activeTabIndex ? 'active' : ''}`;
        
        tabEl.innerHTML = `
            <span>${escapeHtml(tab.host.name)}</span>
            ${tabs.length > 1 ? `<button class="tab-close" data-index="${index}">&times;</button>` : ''}
        `;

        tabEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-close')) {
                e.stopPropagation();
                closeTab(parseInt(e.target.dataset.index, 10));
            } else {
                activeTabIndex = index;
                renderTabs();
                renderAllPanes();
                scrollToActiveTab();
            }
        });

        tabsContainerEl.appendChild(tabEl);
    });
}

function closeTab(index) {
    if (tabs.length <= 1) return;
    const closedTab = tabs[index];
    tabs.splice(index, 1);
    if (activeTabIndex >= tabs.length) {
        activeTabIndex = tabs.length - 1;
    }
    renderTabs();
    renderAllPanes();
    recordActivityLog('SESSION_CLOSE', closedTab.host.name, `Closed session tab for ${closedTab.host.hostname}`, 0);
    showToast(`Closed tab "${closedTab.host.name}".`);
}

// Termius Pro Session Window Multi-Pane Matrix Manager
function applySplitLayout(mode, shouldRecordLog = false) {
    currentSplitMode = mode;
    
    // Update Split Mode Selector Buttons UI
    Object.keys(splitButtons).forEach(m => {
        const btn = splitButtons[m];
        if (btn) {
            btn.classList.toggle('active', m === mode);
        }
    });

    // Update terminal container class
    if (terminalWrapper) {
        terminalWrapper.className = `terminal-panes-wrapper split-${mode.toLowerCase().replace('_', '-')}`;
    }

    // Automatically ensure we have enough tabs spawned for the layout
    const requiredTabs = mode === 'QUAD' ? 4 : (mode === 'DUAL_H' || mode === 'DUAL_V' || mode === 'PIP' ? 2 : 1);
    while (tabs.length < requiredTabs) {
        const nextHost = hosts[tabs.length % hosts.length] || hosts[0];
        tabs.push({
            id: "tab_" + (tabs.length + 1),
            host: nextHost,
            history: [
                `<span class='ansi-cyan'>[Matrix Auto-Pane Connected: ${nextHost.username}@${nextHost.hostname}]</span>`,
                `<span class='ansi-green'>Subshell Initialized</span><br>`
            ]
        });
    }

    renderTabs();
    renderAllPanes();
    setFocusedPane(activeFocusedPane);

    if (shouldRecordLog) {
        recordActivityLog('WINDOW_SPLIT', 'Workspace', `Switched layout matrix to ${mode}`, 0);
    }
}

function getTabIdxForPane(paneNumber) {
    if (paneNumber === 1) return activeTabIndex;
    return (activeTabIndex + (paneNumber - 1)) % tabs.length;
}

function setFocusedPane(paneNumber) {
    activeFocusedPane = paneNumber;
    for (let i = 1; i <= 4; i++) {
        const paneEl = document.getElementById(`pane-${i}`);
        if (paneEl) {
            paneEl.classList.toggle('active-focused-pane', i === paneNumber);
        }
    }
    const activeInput = document.getElementById(`term-input-${paneNumber}`);
    if (activeInput) {
        activeInput.focus();
    }
}

function setupPaneInteractions() {
    for (let i = 1; i <= 4; i++) {
        const paneEl = document.getElementById(`pane-${i}`);
        const screenEl = document.getElementById(`term-screen-${i}`);
        const inputEl = document.getElementById(`term-input-${i}`);
        const paneNum = i;

        if (paneEl) {
            paneEl.addEventListener('click', (e) => {
                if (e.target.closest('.pane-tool-btn')) return;
                setFocusedPane(paneNum);
            });
        }

        if (screenEl && inputEl) {
            screenEl.addEventListener('click', () => {
                setFocusedPane(paneNum);
                inputEl.focus();
            });

            inputEl.addEventListener('input', () => autoExpand(inputEl));
            inputEl.addEventListener('keydown', (e) => {
                const targetTabIdx = getTabIdxForPane(paneNum);
                handleKeydown(e, inputEl, targetTabIdx);
            });
        }

        // Pane Tool Buttons (Clear & Close)
        const clearBtn = paneEl ? paneEl.querySelector('.pane-tool-btn[data-action="clear"]') : null;
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetTabIdx = getTabIdxForPane(paneNum);
                if (tabs[targetTabIdx]) {
                    tabs[targetTabIdx].history = [];
                    renderPane(paneNum);
                    showToast(`Cleared buffer on Pane ${paneNum}.`);
                }
            });
        }

        const closeBtn = paneEl ? paneEl.querySelector('.pane-close-btn') : null;
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentSplitMode !== 'SINGLE') {
                    applySplitLayout('SINGLE', true);
                    showToast(`Collapsed Pane ${paneNum} to 1x1 Single View.`);
                }
            });
        }
    }
}

function autoExpand(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 180) + 'px';
}

function handleKeydown(e, textarea, tabIdx) {
    if (e.key === 'Enter') {
        if (e.shiftKey) {
            return; // Allow multiline
        }

        const text = textarea.value;
        const trimmed = text.trim();

        if (trimmed.length > 0) {
            e.preventDefault();
            executeTerminalCommand(tabIdx, trimmed);
            textarea.value = '';
            textarea.style.height = 'auto';
        } else {
            e.preventDefault();
            executeTerminalCommand(tabIdx, '');
            textarea.value = '';
            textarea.style.height = 'auto';
        }
    }
}

function renderAllPanes() {
    for (let i = 1; i <= 4; i++) {
        renderPane(i);
    }
}

function renderPane(paneNumber) {
    const tabIdx = getTabIdxForPane(paneNumber);
    const targetTab = tabs[tabIdx];
    if (!targetTab) return;

    const titleEl = document.getElementById(`pane-${paneNumber}-title`);
    const promptEl = document.getElementById(`prompt-${paneNumber}`);
    const historyEl = document.getElementById(`term-history-${paneNumber}`);
    const screenEl = document.getElementById(`term-screen-${paneNumber}`);

    if (titleEl) {
        titleEl.textContent = `${targetTab.host.name} [${targetTab.host.authType}]`;
    }

    if (promptEl) {
        promptEl.innerHTML = targetTab.host.authType === 'LOCAL_PTY'
            ? "<span class='ansi-green'>&#x279c;</span> <span class='ansi-cyan'>~</span> <span class='ansi-green'>&#x276f;</span>"
            : `<span class='ansi-cyan'>${targetTab.host.username}@${targetTab.host.hostname}</span> <span class='ansi-green'>&#x276f;</span>`;
    }

    if (historyEl) {
        historyEl.innerHTML = targetTab.history.map(line => `<div class="term-line">${line}</div>`).join('');
    }

    if (screenEl) {
        screenEl.scrollTop = screenEl.scrollHeight;
    }
}

function executeTerminalCommand(tabIdx, cmd) {
    const targetTab = tabs[tabIdx];
    if (!targetTab) return;

    const startTime = performance.now();
    const promptLeader = targetTab.host.authType === 'LOCAL_PTY'
        ? `<span class='ansi-green'>&#x279c;</span> <span class='ansi-cyan'>~</span> <span class='ansi-green'>&#x276f;</span>`
        : `<span class='ansi-cyan'>${targetTab.host.username}@${targetTab.host.hostname}</span> <span class='ansi-green'>&#x276f;</span>`;

    if (cmd.includes('\n')) {
        const lines = cmd.split('\n');
        lines.forEach((l, idx) => {
            if (idx === 0) {
                targetTab.history.push(`${promptLeader} <span class="ansi-bold">${escapeHtml(l)}</span>`);
            } else {
                targetTab.history.push(`<span class='ansi-purple'>&gt;</span> <span class="ansi-bold">${escapeHtml(l)}</span>`);
            }
        });
    } else {
        targetTab.history.push(`${promptLeader} <span class="ansi-bold">${escapeHtml(cmd)}</span>`);
    }

    const lower = cmd.toLowerCase().trim();
    if (lower === 'help') {
        targetTab.history.push("<span class='ansi-cyan'>MateTerminal-Box Built-in Commands:</span>");
        targetTab.history.push("  htop        - View simulated CPU/Memory monitor");
        targetTab.history.push("  uname -a    - Show Linux kernel and MatePad 12X system details");
        targetTab.history.push("  docker ps   - List active container services");
        targetTab.history.push("  df -h       - Display filesystem disk allocations");
        targetTab.history.push("  sync        - Manually trigger Rann-Labs server log synchronization");
        targetTab.history.push("  clear       - Wipe the active screen output buffer");
    } else if (lower === 'clear') {
        targetTab.history = [];
    } else if (lower === 'sync') {
        syncLogsToRannLabs();
        targetTab.history.push("<span class='ansi-green'>Triggered synchronization to Rann-Labs API endpoint.</span>");
    } else if (lower === 'uname -a') {
        if (targetTab.host.authType === 'LOCAL_PTY') {
            targetTab.history.push("Linux MatePad-12X 5.10.160-android12-9-g89ef2 #1 SMP PREEMPT aarch64 GNU/Linux (HarmonyOS)");
        } else {
            targetTab.history.push("Linux ubuntu-singapore-node 6.8.0-31-generic #31-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux");
        }
    } else if (lower === 'htop') {
        targetTab.history.push("<span class='ansi-green'>[||||||||||||||||||||                  24.5%]</span> Tasks: 142, 4 running");
        targetTab.history.push("<span class='ansi-cyan'>Mem[|||||||||||||||||||         3.8G/8.0G]</span> Swp[||| 120M/4.0G]");
    } else if (lower.startsWith('docker ps')) {
        targetTab.history.push("CONTAINER ID   IMAGE             COMMAND                  STATUS         PORTS");
        targetTab.history.push("9b1e2a09f87c   caddy:2.7-alpine  \"caddy run --config…\"   Up 14 days     0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp");
        targetTab.history.push("7c3f8190d21a   postgres:16-alp   \"docker-entrypoint.s…\"  Up 14 days     0.0.0.0:5432->5432/tcp");
    } else if (lower.startsWith('df -h')) {
        targetTab.history.push("Filesystem      Size  Used Avail Use% Mounted on");
        targetTab.history.push("/dev/nvme0n1p1  100G   38G   62G  38% /");
        targetTab.history.push("/dev/nvme0n1p2  450G  180G  270G  40% /data");
    } else if (cmd.length > 0) {
        targetTab.history.push(`Executed: ${escapeHtml(cmd)} (exit code: 0)`);
    }

    const duration = Math.round(performance.now() - startTime);
    if (cmd.length > 0 && lower !== 'clear') {
        recordActivityLog('COMMAND_EXEC', targetTab.host.name, cmd, duration);
    }

    renderAllPanes();
}

let isCtrlActive = false;
let isAltActive = false;

function setupAccessoryKeys() {
    const btnCtrl = document.querySelector('.key-btn[data-key="CTRL"]');
    const btnAlt = document.querySelector('.key-btn[data-key="ALT"]');

    document.querySelectorAll('.key-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.key;
            const input = document.getElementById(`term-input-${activeFocusedPane}`) || document.getElementById('term-input-1');
            const screen = document.getElementById(`term-screen-${activeFocusedPane}`) || document.getElementById('term-screen-1');
            const targetTabIdx = getTabIdxForPane(activeFocusedPane);
            
            if (key === 'CTRL') {
                isCtrlActive = !isCtrlActive;
                btn.classList.toggle('active', isCtrlActive);
                if (input) input.focus();
                return;
            }
            
            if (key === 'ALT') {
                isAltActive = !isAltActive;
                btn.classList.toggle('active', isAltActive);
                if (input) input.focus();
                return;
            }

            if (!input) return;

            if (key === 'ESC') {
                input.value = '';
                input.style.height = 'auto';
                if (isCtrlActive) {
                    isCtrlActive = false;
                    if (btnCtrl) btnCtrl.classList.remove('active');
                }
                if (isAltActive) {
                    isAltActive = false;
                    if (btnAlt) btnAlt.classList.remove('active');
                }
            } else if (key === 'TAB') {
                input.value += '    ';
            } else if (key === 'UP') {
                input.value = 'htop';
            } else if (key === 'DN') {
                input.value = 'docker ps';
            } else if (key === 'LT' || key === 'RT') {
                input.focus();
            } else if (key === 'PGUP') {
                if (screen) screen.scrollTop -= 200;
            } else if (key === 'PGDN') {
                if (screen) screen.scrollTop += 200;
            } else if (key === 'PASTE') {
                input.value += 'curl -s https://api.rann-labs.com/health';
                showToast('Pasted command buffer.');
            } else if (key === 'CLEAR') {
                const targetTab = tabs[targetTabIdx];
                if (targetTab) targetTab.history = [];
                renderPane(activeFocusedPane);
                showToast(`Cleared buffer on Pane ${activeFocusedPane}.`);
            } else {
                if (isCtrlActive && key.toLowerCase() === 'c') {
                    executeTerminalCommand(targetTabIdx, '^C');
                    isCtrlActive = false;
                    if (btnCtrl) btnCtrl.classList.remove('active');
                } else if (isCtrlActive && key.toLowerCase() === 'l') {
                    const targetTab = tabs[targetTabIdx];
                    if (targetTab) targetTab.history = [];
                    renderPane(activeFocusedPane);
                    isCtrlActive = false;
                    if (btnCtrl) btnCtrl.classList.remove('active');
                } else {
                    input.value += key;
                }
            }
            input.focus();
        });
    });
}

// ServerBox Telemetry Polling Loop Simulation
function startTelemetryEngine() {
    setInterval(() => {
        const host = hosts.find(h => h.id === activeHudHostId) || hosts[0];
        const isLocal = host.authType === 'LOCAL_PTY';

        const cpu = (isLocal ? 14 + Math.random() * 12 : 22 + Math.random() * 25).toFixed(1);
        const mem = (isLocal ? (4.2 + Math.random() * 0.3) : (3.6 + Math.random() * 0.4)).toFixed(1);
        const memTotal = isLocal ? 12.0 : 8.0;
        const rx = (1.2 + Math.random() * 0.8).toFixed(1);
        const tx = Math.floor(200 + Math.random() * 250);

        const cpuValEl = document.getElementById('hud-cpu-val');
        const cpuBarEl = document.getElementById('hud-cpu-bar');
        const memValEl = document.getElementById('hud-mem-val');
        const memBarEl = document.getElementById('hud-mem-bar');
        const netValEl = document.getElementById('hud-net-val');

        if (cpuValEl) cpuValEl.textContent = `${cpu}%`;
        if (cpuBarEl) cpuBarEl.style.width = `${cpu}%`;
        if (memValEl) memValEl.textContent = `${mem} GB / ${memTotal.toFixed(1)} GB (${Math.round((mem/memTotal)*100)}%)`;
        if (memBarEl) memBarEl.style.width = `${Math.round((mem/memTotal)*100)}%`;
        if (netValEl) netValEl.textContent = `RX: ${rx} MB/s | TX: ${tx} KB/s`;

        const coreBars = document.querySelectorAll('.core-bar div');
        coreBars.forEach(bar => {
            bar.style.width = `${Math.floor(10 + Math.random() * 70)}%`;
        });
    }, 2500);
}

// Resource Creators
function saveNewHost() {
    const label = document.getElementById('host-label').value.trim() || "Remote Server";
    const ip = document.getElementById('host-ip').value.trim() || "127.0.0.1";
    const port = parseInt(document.getElementById('host-port').value, 10) || 22;
    const user = document.getElementById('host-user').value.trim() || "ubuntu";
    const category = document.getElementById('host-category').value;

    const newHost = {
        id: "host_" + Date.now(),
        name: label,
        hostname: ip,
        port: port,
        username: user,
        authType: "PASSWORD",
        category: category,
        colorAccent: "#38bdf8",
        telemetry: {
            os: "Linux 6.8.0-generic",
            specs: `${ip}:${port}`,
            cores: 4,
            diskLabel: "/dev/sda1",
            diskUsed: 20,
            diskTotal: 100,
            dockerEnabled: true
        }
    };

    hosts.push(newHost);
    localStorage.setItem(STORAGE_KEYS.HOSTS, JSON.stringify(hosts));
    const countBadge = document.getElementById('badge-hosts-count');
    if (countBadge) countBadge.textContent = hosts.length;
    renderSidebarList();
    initHudTargetSelector();
    updateForwardHostDropdown();
    recordActivityLog('HOST_CREATE', label, `Added host profile ${user}@${ip}:${port}`, 0);
    showToast(`Saved host "${label}".`);
}

function saveNewTunnel() {
    const label = document.getElementById('forward-label').value.trim() || "New Tunnel";
    const localPort = parseInt(document.getElementById('forward-local-port').value, 10) || 8080;
    const remotePort = parseInt(document.getElementById('forward-remote-port').value, 10) || 80;
    const remoteHost = document.getElementById('forward-remote-host').value.trim() || "localhost";
    const targetHostId = document.getElementById('forward-ssh-target').value;

    const newTunnel = {
        id: "tun_" + Date.now(),
        label: label,
        localPort: localPort,
        remoteHost: remoteHost,
        remotePort: remotePort,
        targetHostId: targetHostId,
        active: true
    };

    tunnels.push(newTunnel);
    localStorage.setItem(STORAGE_KEYS.TUNNELS, JSON.stringify(tunnels));
    renderSidebarList();
    recordActivityLog('TUNNEL_CREATE', label, `Created port forwarding rule ${localPort} -> ${remoteHost}:${remotePort}`, 0);
    showToast(`Created port forwarding tunnel "${label}".`);
}

function saveNewSnippet() {
    const title = document.getElementById('snippet-title').value.trim() || "Custom Script";
    const command = document.getElementById('snippet-command').value.trim() || "uptime";

    const newSnippet = {
        id: "snip_" + Date.now(),
        title: title,
        command: command
    };

    snippets.push(newSnippet);
    localStorage.setItem(STORAGE_KEYS.SNIPPETS, JSON.stringify(snippets));
    const snipBadge = document.getElementById('badge-snippets-count');
    if (snipBadge) snipBadge.textContent = snippets.length;
    renderSidebarList();
    recordActivityLog('SNIPPET_CREATE', title, `Added terminal snippet: ${command}`, 0);
    showToast(`Saved snippet "${title}".`);
}

function saveNewKey() {
    const name = document.getElementById('key-name').value.trim() || "id_ed25519_custom";
    const algo = document.getElementById('key-type').value;

    const newKey = {
        id: "key_" + Date.now(),
        name: name,
        algo: algo,
        fingerprint: "SHA256:" + Array.from({length: 43}, () => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random()*62)]).join(''),
        created: getTodayDateString()
    };

    keys.push(newKey);
    localStorage.setItem(STORAGE_KEYS.KEYS, JSON.stringify(keys));
    renderSidebarList();
    recordActivityLog('KEY_GENERATE', name, `Generated ${algo} SSH keypair`, 0);
    showToast(`Generated SSH keypair "${name}".`);
}

function showToast(message) {
    if (!toastEl || !toastMessageEl) return;
    toastMessageEl.textContent = message;
    toastEl.classList.remove('hidden');
    toastEl.classList.add('show');
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    return (text || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
