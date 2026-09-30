/**
 * MateTerminal-Box Web Simulator
 * Huawei MatePad 12X Pro Edition
 * Strict Rule: Zero emojis anywhere in code, prompts, UI, or logs.
 */

// Storage Keys
const STORAGE_KEYS = {
    HOSTS: 'mate_hosts',
    SETTINGS: 'mate_settings',
    ACTIVITY_LOGS: 'mate_activity_logs'
};

// Default Settings
const DEFAULT_SETTINGS = {
    sidebarMode: 'COLLAPSIBLE', // 'COLLAPSIBLE' | 'FIXED' | 'AUTO_HIDE'
    enableHud: true,
    theme: 'TOKYO_NIGHT', // 'TOKYO_NIGHT' | 'MONOKAI_PRO' | 'CYBER_SLATE' | 'SOLARIZED_DARK'
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
    { title: "Docker Status", command: "docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" },
    { title: "System Resources", command: "htop" },
    { title: "Disk Storage Free", command: "df -h -x tmpfs -x devtmpfs" },
    { title: "Listening Ports", command: "ss -tulpn | grep LISTEN" },
    { title: "System Info", command: "uname -a && uptime" },
    { title: "Rann-Labs Sync Check", command: "curl -sI https://api.rann-labs.com/v1/health" }
];

// App State
let settings = loadSettings();
let hosts = loadHosts();
let snippets = DEFAULT_SNIPPETS;
let activityLogs = loadActivityLogs();
let currentNavMode = 'hosts';
let activeTabIndex = 0;
let isSplit1x2 = false;
let isSidebarCollapsed = false;
let activeLogFilterDate = getTodayDateString();
let activeHudHostId = 'local_device';

// Tabs & Session State
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
const tabsContainerEl = document.getElementById('tabs-container');
const btnTabScrollLeft = document.getElementById('btn-tab-scroll-left');
const btnTabScrollRight = document.getElementById('btn-tab-scroll-right');
const btnTabDropdownToggle = document.getElementById('btn-tab-dropdown-toggle');
const tabDropdownMenu = document.getElementById('tab-dropdown-menu');

const termScreen1 = document.getElementById('term-screen-1');
const termScreen2 = document.getElementById('term-screen-2');
const termHistory1 = document.getElementById('term-history-1');
const termHistory2 = document.getElementById('term-history-2');
const termInput1 = document.getElementById('term-input-1');
const termInput2 = document.getElementById('term-input-2');
const terminalWrapper = document.getElementById('terminal-wrapper');
const accessoryBar = document.getElementById('accessory-bar');
const btnToggleAccessoryBar = document.getElementById('btn-toggle-accessory-bar');

const serverboxHud = document.getElementById('serverbox-hud');
const hudTargetSelector = document.getElementById('hud-target-selector');
const activityLogsView = document.getElementById('activity-logs-view');
const clockEl = document.getElementById('clock');
const btnSplitToggle = document.getElementById('btn-split-toggle');
const splitBtnText = document.getElementById('split-btn-text');
const pane2 = document.getElementById('pane-2');
const btnSidebarCollapse = document.getElementById('btn-sidebar-collapse');
const btnSidebarExpand = document.getElementById('btn-sidebar-expand');
const btnToggleHudMode = document.getElementById('btn-toggle-hud-mode');
const hudToggleText = document.getElementById('hud-toggle-text');
const btnCloseHud = document.getElementById('btn-close-hud');
const globalSyncBadge = document.getElementById('global-sync-badge');
const toastEl = document.getElementById('toast-notify');
const toastMessageEl = document.getElementById('toast-message');

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
const settingFontSize = document.getElementById('setting-font-size');
const settingShowAccessoryBar = document.getElementById('setting-show-accessory-bar');
const settingRannlabsEndpoint = document.getElementById('setting-rannlabs-endpoint');
const settingRannlabsKey = document.getElementById('setting-rannlabs-key');
const settingAutoSync = document.getElementById('setting-auto-sync');
const settingLogRetention = document.getElementById('setting-log-retention');
const settingKeepalive = document.getElementById('setting-keepalive');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    applySettingsToUI();
    initActivityLogsDate();
    initHudTargetSelector();
    renderSidebarList();
    renderTabs();
    renderActiveTerminal();
    setupEventListeners();
    setupAccessoryKeys();
    setupTabNavigation();
    setupInlineTextareas();
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
        clockEl.textContent = d.toTimeString().split(' ')[0];
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
    // 1. Theme
    document.body.classList.remove('theme-monokai', 'theme-cyber-slate', 'theme-solarized');
    if (settings.theme === 'MONOKAI_PRO') {
        document.body.classList.add('theme-monokai');
    } else if (settings.theme === 'CYBER_SLATE') {
        document.body.classList.add('theme-cyber-slate');
    } else if (settings.theme === 'SOLARIZED_DARK') {
        document.body.classList.add('theme-solarized');
    }

    // 2. Font Size
    document.documentElement.style.setProperty('--term-font-size', `${settings.fontSize}px`);

    // 3. Sidebar Mode
    if (settings.sidebarMode === 'FIXED') {
        sidebarEl.classList.remove('collapsed');
        btnSidebarCollapse.style.display = 'none';
        btnSidebarExpand.style.display = 'none';
        isSidebarCollapsed = false;
    } else {
        btnSidebarCollapse.style.display = 'flex';
        btnSidebarExpand.style.display = isSidebarCollapsed ? 'flex' : 'none';
    }

    // 4. ServerBox HUD Button Visibility
    if (settings.enableHud) {
        btnToggleHudMode.style.display = 'flex';
        const navHud = document.getElementById('nav-serverbox');
        if (navHud) navHud.style.display = 'block';
    } else {
        btnToggleHudMode.style.display = 'none';
        const navHud = document.getElementById('nav-serverbox');
        if (navHud) navHud.style.display = 'none';
        if (currentNavMode === 'serverbox') {
            switchNavMode('hosts', document.getElementById('nav-hosts'));
        }
    }

    // 5. Virtual Accessory Key Bar Visibility
    if (accessoryBar) {
        if (settings.showAccessoryBar) {
            accessoryBar.classList.remove('hidden');
            btnToggleAccessoryBar.classList.add('active');
        } else {
            accessoryBar.classList.add('hidden');
            btnToggleAccessoryBar.classList.remove('active');
        }
    }

    // 6. Keepalive status
    const keepaliveLabel = document.getElementById('keepalive-label');
    const liveIndicator = document.getElementById('live-indicator');
    if (settings.keepalive) {
        keepaliveLabel.textContent = 'KEEPALIVE ACTIVE';
        liveIndicator.style.backgroundColor = 'var(--accent-emerald)';
    } else {
        keepaliveLabel.textContent = 'KEEPALIVE OFF';
        liveIndicator.style.backgroundColor = 'var(--accent-amber)';
    }

    // Populate Settings Modal Inputs
    settingSidebarMode.value = settings.sidebarMode;
    settingEnableHud.checked = settings.enableHud;
    settingTheme.value = settings.theme;
    settingFontSize.value = String(settings.fontSize);
    if (settingShowAccessoryBar) settingShowAccessoryBar.checked = settings.showAccessoryBar;
    settingRannlabsEndpoint.value = settings.rannlabsEndpoint;
    settingRannlabsKey.value = settings.rannlabsApiKey;
    settingAutoSync.checked = settings.autoSync;
    settingLogRetention.value = String(settings.logRetentionDays);
    settingKeepalive.checked = settings.keepalive;
}

// Host Management
function loadHosts() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.HOSTS);
        return saved ? JSON.parse(saved) : DEFAULT_HOSTS;
    } catch (e) {
        return DEFAULT_HOSTS;
    }
}

// Activity Logging Management
function loadActivityLogs() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load activity logs', e);
    }

    const today = getTodayDateString();
    const yesterday = getTodayDateString(new Date(Date.now() - 86400000));

    const seedLogs = [
        {
            id: "log_seed_1",
            logDate: yesterday,
            timestamp: new Date(Date.now() - 86400000 - 3600000).toISOString(),
            eventType: "SESSION_OPEN",
            hostTarget: "Production VPS (Singapore)",
            commandText: "SSH Connection Established (Key Auth)",
            durationMs: 450,
            syncStatus: "SYNCED",
            remoteSyncTimestamp: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: "log_seed_2",
            logDate: yesterday,
            timestamp: new Date(Date.now() - 86400000 - 3000000).toISOString(),
            eventType: "COMMAND_EXEC",
            hostTarget: "103.145.22.45",
            commandText: "docker ps -a",
            durationMs: 120,
            syncStatus: "SYNCED",
            remoteSyncTimestamp: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: "log_seed_3",
            logDate: today,
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            eventType: "SESSION_OPEN",
            hostTarget: "MatePad-12X (Local)",
            commandText: "PTY Subshell Spawned (UID 10210)",
            durationMs: 15,
            syncStatus: "PENDING",
            remoteSyncTimestamp: null
        },
        {
            id: "log_seed_4",
            logDate: today,
            timestamp: new Date(Date.now() - 1200000).toISOString(),
            eventType: "COMMAND_EXEC",
            hostTarget: "localhost",
            commandText: "uname -a",
            durationMs: 8,
            syncStatus: "PENDING",
            remoteSyncTimestamp: null
        },
        {
            id: "log_seed_5",
            logDate: today,
            timestamp: new Date(Date.now() - 600000).toISOString(),
            eventType: "TELEMETRY_ALERT",
            hostTarget: "Production VPS (Singapore)",
            commandText: "CPU load spike: 82% over 60s window",
            durationMs: 0,
            syncStatus: "PENDING",
            remoteSyncTimestamp: null
        }
    ];

    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(seedLogs));
    return seedLogs;
}

function recordActivityLog(eventType, hostTarget, commandText, durationMs = 0) {
    const today = getTodayDateString();
    const newEntry = {
        id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        logDate: today,
        timestamp: new Date().toISOString(),
        eventType: eventType,
        hostTarget: hostTarget,
        commandText: commandText,
        durationMs: durationMs,
        syncStatus: "PENDING",
        remoteSyncTimestamp: null
    };

    activityLogs.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));

    if (currentNavMode === 'logs') {
        renderActivityLogsTable();
    }
}

function initActivityLogsDate() {
    logDatePicker.value = activeLogFilterDate;
    logDatePicker.addEventListener('change', (e) => {
        activeLogFilterDate = e.target.value;
        renderActivityLogsTable();
    });
}

function renderActivityLogsTable() {
    const searchTerm = (logSearchInput.value || '').toLowerCase().trim();
    const filtered = activityLogs.filter(log => {
        const matchesDate = !activeLogFilterDate || log.logDate === activeLogFilterDate;
        const matchesSearch = !searchTerm ||
            log.hostTarget.toLowerCase().includes(searchTerm) ||
            log.commandText.toLowerCase().includes(searchTerm) ||
            log.eventType.toLowerCase().includes(searchTerm);
        return matchesDate && matchesSearch;
    });

    const totalCount = filtered.length;
    const syncedCount = filtered.filter(l => l.syncStatus === 'SYNCED').length;
    const pendingCount = totalCount - syncedCount;

    logCountTotal.textContent = `Total: ${totalCount} entries`;
    logCountSynced.textContent = `Synced: ${syncedCount}`;
    logCountPending.textContent = `Pending: ${pendingCount}`;

    logsTableBody.innerHTML = '';

    if (filtered.length === 0) {
        logsTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
                    No activity logs recorded for ${escapeHtml(activeLogFilterDate)}.
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(log => {
        const tr = document.createElement('tr');
        
        let eventBadgeClass = 'event-session';
        if (log.eventType === 'COMMAND_EXEC') eventBadgeClass = 'event-command';
        else if (log.eventType === 'SSH_CONNECT') eventBadgeClass = 'event-ssh';
        else if (log.eventType === 'TELEMETRY_ALERT') eventBadgeClass = 'event-alert';
        else if (log.eventType === 'SETTINGS_CHANGE') eventBadgeClass = 'event-session';
        else if (log.eventType === 'ERROR') eventBadgeClass = 'event-error';

        const syncBadgeClass = log.syncStatus === 'SYNCED' ? 'sync-status-synced' : 'sync-status-pending';

        tr.innerHTML = `
            <td style="font-family: var(--font-mono); color: var(--text-secondary);">${formatTimeString(log.timestamp)}</td>
            <td><span class="log-badge-event ${eventBadgeClass}">${escapeHtml(log.eventType)}</span></td>
            <td style="font-weight: 500;">${escapeHtml(log.hostTarget)}</td>
            <td style="font-family: var(--font-mono); color: var(--accent-cyan);">${escapeHtml(log.commandText)}</td>
            <td style="font-family: var(--font-mono); color: var(--text-muted);">${log.durationMs}ms</td>
            <td><span class="sync-status-badge ${syncBadgeClass}">${log.syncStatus === 'SYNCED' ? 'Synced (Rann-Labs)' : 'Pending Sync'}</span></td>
        `;
        logsTableBody.appendChild(tr);
    });
}

// Rann-Labs Server Synchronization
function syncLogsToRannLabs() {
    const pendingLogs = activityLogs.filter(l => l.syncStatus === 'PENDING');
    
    globalSyncBadge.textContent = "Rann-Labs: Syncing...";
    globalSyncBadge.style.color = "var(--accent-amber)";
    showToast(`Uploading ${pendingLogs.length} activity log entries to Rann-Labs server...`);

    setTimeout(() => {
        const syncTimestamp = new Date().toISOString();
        activityLogs.forEach(log => {
            if (log.syncStatus === 'PENDING') {
                log.syncStatus = 'SYNCED';
                log.remoteSyncTimestamp = syncTimestamp;
            }
        });

        localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));
        globalSyncBadge.textContent = "Rann-Labs: Synced";
        globalSyncBadge.style.color = "var(--accent-emerald)";

        if (currentNavMode === 'logs') {
            renderActivityLogsTable();
        }

        showToast(`Sync complete: ${pendingLogs.length} entries successfully committed to ${settings.rannlabsEndpoint}`);
        recordActivityLog('RANN_LABS_SYNC', 'rann-labs.com', `Batch sync succeeded (${pendingLogs.length} logs sent)`, 210);
    }, 1200);
}

// Export Activity Logs
function exportLogsToJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activityLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mateterminal_logs_${getTodayDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Activity logs exported to JSON.');
}

// Toast notification
function showToast(message) {
    toastMessageEl.textContent = message;
    toastEl.classList.remove('hidden');
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
        toastEl.classList.add('hidden');
    }, 3500);
}

// Navigation switcher & Event Listeners
function setupEventListeners() {
    // Nav segments
    document.getElementById('nav-hosts').addEventListener('click', (e) => switchNavMode('hosts', e.currentTarget));
    const navHud = document.getElementById('nav-serverbox');
    if (navHud) navHud.addEventListener('click', (e) => switchNavMode('serverbox', e.currentTarget));
    document.getElementById('nav-snippets').addEventListener('click', (e) => switchNavMode('snippets', e.currentTarget));
    document.getElementById('nav-logs').addEventListener('click', (e) => switchNavMode('logs', e.currentTarget));

    // Sidebar Collapse / Expand
    btnSidebarCollapse.addEventListener('click', () => {
        sidebarEl.classList.add('collapsed');
        btnSidebarExpand.style.display = 'flex';
        isSidebarCollapsed = true;
    });

    btnSidebarExpand.addEventListener('click', () => {
        sidebarEl.classList.remove('collapsed');
        btnSidebarExpand.style.display = 'none';
        isSidebarCollapsed = false;
    });

    // Top HUD toggle button
    btnToggleHudMode.addEventListener('click', () => {
        if (currentNavMode === 'serverbox') {
            switchNavMode('hosts', document.getElementById('nav-hosts'));
        } else {
            switchNavMode('serverbox', document.getElementById('nav-serverbox'));
        }
    });

    btnCloseHud.addEventListener('click', () => {
        switchNavMode('hosts', document.getElementById('nav-hosts'));
    });

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
    document.getElementById('btn-new-tab').addEventListener('click', () => {
        openNewTab(hosts[0]);
    });

    // Split View Toggle
    btnSplitToggle.addEventListener('click', () => {
        isSplit1x2 = !isSplit1x2;
        if (isSplit1x2) {
            pane2.classList.remove('hidden');
            splitBtnText.textContent = "Split 1x1";
            if (tabs.length === 1 && hosts.length > 1) {
                openNewTab(hosts[1]);
            }
            renderSplitPane2();
            recordActivityLog('WINDOW_SPLIT', 'Workspace', 'Enabled 1x2 dual-pane split view', 0);
        } else {
            pane2.classList.add('hidden');
            splitBtnText.textContent = "Split 1x2";
            recordActivityLog('WINDOW_SPLIT', 'Workspace', 'Switched back to 1x1 single pane view', 0);
        }
    });

    // Activity Log Listeners
    logSearchInput.addEventListener('input', () => renderActivityLogsTable());
    btnSyncRannLabs.addEventListener('click', syncLogsToRannLabs);
    btnSyncRannLabsSidebar.addEventListener('click', syncLogsToRannLabs);
    btnExportLogs.addEventListener('click', exportLogsToJson);

    // Modal Add Host
    const modalHost = document.getElementById('modal-add-host');
    const btnAddHostQuick = document.getElementById('btn-add-host-quick');
    if (btnAddHostQuick) {
        btnAddHostQuick.addEventListener('click', () => modalHost.classList.remove('hidden'));
    }
    document.getElementById('modal-close').addEventListener('click', () => modalHost.classList.add('hidden'));
    document.getElementById('modal-btn-cancel').addEventListener('click', () => modalHost.classList.add('hidden'));
    document.getElementById('modal-btn-save').addEventListener('click', saveNewHost);

    // Modal Settings
    btnOpenSettings.addEventListener('click', () => modalSettings.classList.remove('hidden'));
    btnWorkspaceSettings.addEventListener('click', () => modalSettings.classList.remove('hidden'));
    modalSettingsClose.addEventListener('click', () => modalSettings.classList.add('hidden'));
    modalSettingsCancel.addEventListener('click', () => modalSettings.classList.add('hidden'));
    modalSettingsSave.addEventListener('click', () => {
        const updated = {
            sidebarMode: settingSidebarMode.value,
            enableHud: settingEnableHud.checked,
            theme: settingTheme.value,
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

    // Close tab dropdown if clicked outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.tab-dropdown-wrap')) {
            if (tabDropdownMenu) tabDropdownMenu.classList.add('hidden');
        }
    });
}

function switchNavMode(mode, targetBtn) {
    currentNavMode = mode;
    document.querySelectorAll('.nav-segment-btn').forEach(btn => btn.classList.remove('active'));
    if (targetBtn) targetBtn.classList.add('active');

    if (mode === 'serverbox') {
        sidebarTitleEl.textContent = "MONITOR HOSTS";
        terminalWrapper.classList.add('hidden');
        activityLogsView.classList.add('hidden');
        serverboxHud.classList.remove('hidden');
        hudToggleText.textContent = "Terminal";
        updateHudView();
    } else if (mode === 'logs') {
        sidebarTitleEl.textContent = "DAILY LOG ARCHIVE";
        terminalWrapper.classList.add('hidden');
        serverboxHud.classList.add('hidden');
        activityLogsView.classList.remove('hidden');
        hudToggleText.textContent = "HUD";
        renderActivityLogsTable();
    } else {
        terminalWrapper.classList.remove('hidden');
        serverboxHud.classList.add('hidden');
        activityLogsView.classList.add('hidden');
        sidebarTitleEl.textContent = mode === 'hosts' ? "SAVED SESSIONS" : "SNIPPET LIBRARY";
        hudToggleText.textContent = "HUD";
    }

    renderSidebarList();
}

function renderSidebarList() {
    hostListEl.innerHTML = '';

    if (currentNavMode === 'hosts' || currentNavMode === 'serverbox') {
        sidebarCounterEl.textContent = hosts.length;
        hosts.forEach(host => {
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
    } else if (currentNavMode === 'snippets') {
        sidebarCounterEl.textContent = snippets.length;
        snippets.forEach(snippet => {
            const item = document.createElement('div');
            item.className = 'snippet-item';
            item.innerHTML = `
                <div class="host-item-header">
                    <span class="host-name" style="color: var(--accent-cyan)">${escapeHtml(snippet.title)}</span>
                </div>
                <div class="host-item-meta">${escapeHtml(snippet.command)}</div>
            `;

            item.addEventListener('click', () => {
                executeTerminalCommand(activeTabIndex, snippet.command);
                if (currentNavMode !== 'hosts') {
                    switchNavMode('hosts', document.getElementById('nav-hosts'));
                }
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
                logDatePicker.value = dateStr;
                renderSidebarList();
                renderActivityLogsTable();
            });

            hostListEl.appendChild(item);
        });
    }
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
            renderActiveTerminal();
            if (isSplit1x2) renderSplitPane2();
            tabDropdownMenu.classList.add('hidden');
            scrollToActiveTab();
        });

        tabDropdownMenu.appendChild(item);
    });
}

function scrollToActiveTab() {
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
    renderActiveTerminal();
    if (isSplit1x2) renderSplitPane2();
    scrollToActiveTab();

    recordActivityLog('SSH_CONNECT', host.name, `Connected to ${host.username}@${host.hostname}:${host.port || 22}`, 140);
}

function renderTabs() {
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
                renderActiveTerminal();
                if (isSplit1x2) renderSplitPane2();
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
    renderActiveTerminal();
    if (isSplit1x2) renderSplitPane2();
    scrollToActiveTab();

    recordActivityLog('SESSION_CLOSE', closedTab.host.name, `Closed terminal session tab ${closedTab.id}`, 0);
}

// Inline Terminal Buffer & Multiline Handling
function setupInlineTextareas() {
    function autoExpand(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 240) + 'px';
    }

    function handleKeydown(e, textarea, tabIdx) {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Multiline continuation with Shift+Enter
                return;
            }
            
            const rawVal = textarea.value;
            const trimmed = rawVal.trim();

            // Support line continuation if command ends with '\'
            if (rawVal.endsWith('\\\n') || rawVal.endsWith('\\')) {
                return;
            }

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

    if (termInput1) {
        termInput1.addEventListener('input', () => autoExpand(termInput1));
        termInput1.addEventListener('keydown', (e) => handleKeydown(e, termInput1, activeTabIndex));
        // Clicking anywhere in terminal screen focuses input
        if (termScreen1) {
            termScreen1.addEventListener('click', () => termInput1.focus());
        }
    }

    if (termInput2) {
        termInput2.addEventListener('input', () => autoExpand(termInput2));
        termInput2.addEventListener('keydown', (e) => {
            const secondIndex = (activeTabIndex + 1) % tabs.length;
            handleKeydown(e, termInput2, secondIndex);
        });
        if (termScreen2) {
            termScreen2.addEventListener('click', () => termInput2.focus());
        }
    }
}

function renderActiveTerminal() {
    const currentTab = tabs[activeTabIndex];
    if (!currentTab) return;

    document.getElementById('pane-1-title').textContent = `${currentTab.host.name} [${currentTab.host.authType}]`;
    document.getElementById('prompt-1').innerHTML = currentTab.host.authType === 'LOCAL_PTY'
        ? "<span class='ansi-green'>&#x279c;</span> <span class='ansi-cyan'>~</span> <span class='ansi-green'>&#x276f;</span>"
        : `<span class='ansi-cyan'>${currentTab.host.username}@${currentTab.host.hostname}</span> <span class='ansi-green'>&#x276f;</span>`;

    if (termHistory1) {
        termHistory1.innerHTML = currentTab.history.map(line => `<div class="term-line">${line}</div>`).join('');
    }
    if (termScreen1) {
        termScreen1.scrollTop = termScreen1.scrollHeight;
    }
    if (termInput1) {
        termInput1.focus();
    }
}

function renderSplitPane2() {
    if (tabs.length <= 1) return;
    const secondIndex = (activeTabIndex + 1) % tabs.length;
    const secondTab = tabs[secondIndex];

    document.getElementById('pane-2-title').textContent = `${secondTab.host.name} [${secondTab.host.authType}]`;
    document.getElementById('prompt-2').innerHTML = secondTab.host.authType === 'LOCAL_PTY'
        ? "<span class='ansi-green'>&#x279c;</span> <span class='ansi-cyan'>~</span> <span class='ansi-green'>&#x276f;</span>"
        : `<span class='ansi-cyan'>${secondTab.host.username}@${secondTab.host.hostname}</span> <span class='ansi-green'>&#x276f;</span>`;

    if (termHistory2) {
        termHistory2.innerHTML = secondTab.history.map(line => `<div class="term-line">${line}</div>`).join('');
    }
    if (termScreen2) {
        termScreen2.scrollTop = termScreen2.scrollHeight;
    }
}

function executeTerminalCommand(tabIdx, cmd) {
    const targetTab = tabs[tabIdx];
    if (!targetTab) return;

    const startTime = performance.now();
    const promptLeader = targetTab.host.authType === 'LOCAL_PTY'
        ? `<span class='ansi-green'>&#x279c;</span> <span class='ansi-cyan'>~</span> <span class='ansi-green'>&#x276f;</span>`
        : `<span class='ansi-cyan'>${targetTab.host.username}@${targetTab.host.hostname}</span> <span class='ansi-green'>&#x276f;</span>`;

    // Handle multiline formatting if command spans multiple lines
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

    // Simulated responses
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

    renderActiveTerminal();
    if (isSplit1x2) renderSplitPane2();
}

function setupAccessoryKeys() {
    document.querySelectorAll('.key-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.key;
            const input = termInput1;
            if (key === 'ESC') {
                input.value = '';
                input.style.height = 'auto';
            } else if (key === 'TAB') {
                input.value += '    ';
            } else if (key === 'CTRL') {
                executeTerminalCommand(activeTabIndex, '^C');
            } else if (key === 'UP') {
                input.value = 'htop';
            } else if (key === 'DOWN') {
                input.value = 'docker ps';
            } else if (key === 'LEFT' || key === 'RIGHT') {
                // Focus input and move cursor
                input.focus();
            } else {
                input.value += key;
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

        // Update core bars
        const coreBars = document.querySelectorAll('.core-bar div');
        coreBars.forEach(bar => {
            bar.style.width = `${Math.floor(10 + Math.random() * 70)}%`;
        });
    }, 2500);
}

function saveNewHost() {
    const name = document.getElementById('input-host-name').value.trim() || "Remote Server";
    const ip = document.getElementById('input-host-ip').value.trim() || "127.0.0.1";
    const port = parseInt(document.getElementById('input-host-port').value, 10) || 22;
    const user = document.getElementById('input-host-user').value.trim() || "root";
    const category = document.getElementById('input-host-category').value;

    const newHost = {
        id: "host_" + Date.now(),
        name: name,
        hostname: ip,
        port: port,
        username: user,
        authType: "PASSWORD",
        category: category,
        colorAccent: "#38bdf8",
        telemetry: {
            os: "Linux 6.5.0-generic",
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
    document.getElementById('modal-add-host').classList.add('hidden');
    renderSidebarList();
    initHudTargetSelector();
    recordActivityLog('HOST_CREATE', name, `Added host profile ${user}@${ip}:${port}`, 0);
    showToast(`Saved host "${name}".`);
}

function escapeHtml(text) {
    return (text || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
