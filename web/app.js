/**
 * MateTerminal-Box Web Simulator
 * Huawei MatePad 12X Pro Edition
 * Strict Rule: No emojis anywhere in code, prompts, UI, or logs.
 */

// Initial Seed Data
const DEFAULT_HOSTS = [
    {
        id: "local_device",
        name: "Huawei MatePad 12X (Local)",
        hostname: "localhost",
        port: 0,
        username: "u0_a210",
        authType: "LOCAL_PTY",
        category: "Local",
        colorAccent: "#10b981"
    },
    {
        id: "demo_vps",
        name: "Production VPS (Singapore)",
        hostname: "103.145.22.45",
        port: 22,
        username: "ubuntu",
        authType: "PASSWORD",
        category: "Cloud",
        colorAccent: "#38bdf8"
    },
    {
        id: "homelab_pi",
        name: "HomeLab Raspberry Pi 5",
        hostname: "192.168.1.150",
        port: 22,
        username: "pi",
        authType: "PASSWORD",
        category: "HomeLab",
        colorAccent: "#f59e0b"
    }
];

const DEFAULT_SNIPPETS = [
    { title: "Docker Status", command: "docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" },
    { title: "System Resources", command: "htop" },
    { title: "Disk Storage Free", command: "df -h -x tmpfs -x devtmpfs" },
    { title: "Listening Ports", command: "ss -tulpn | grep LISTEN" },
    { title: "System Info", command: "uname -a && uptime" }
];

// App State
let hosts = JSON.parse(localStorage.getItem('mate_hosts')) || DEFAULT_HOSTS;
let snippets = DEFAULT_SNIPPETS;
let currentNavMode = 'hosts';
let activeTabIndex = 0;
let isSplit1x2 = false;

// Tabs & Session State
let tabs = [
    {
        id: "tab_1",
        host: hosts[0],
        history: [
            "<span class='ansi-cyan ansi-bold'>MateTerminal-Box [Huawei MatePad 12X Local PTY Subshell]</span>",
            "<span class='ansi-green'>Device: 12.0\" 2800x1840 | 144Hz Refresh | HarmonyOS Subsystem</span>",
            "<span class='ansi-purple'>Type 'help', 'status', 'htop', 'uname -a', 'docker ps', or 'clear'</span><br>"
        ]
    }
];

// DOM Elements
const hostListEl = document.getElementById('host-list');
const sidebarTitleEl = document.getElementById('sidebar-title');
const sidebarCounterEl = document.getElementById('sidebar-counter');
const tabsContainerEl = document.getElementById('tabs-container');
const termScreen1 = document.getElementById('term-screen-1');
const termScreen2 = document.getElementById('term-screen-2');
const termInput1 = document.getElementById('term-input-1');
const termInput2 = document.getElementById('term-input-2');
const terminalWrapper = document.getElementById('terminal-wrapper');
const serverboxHud = document.getElementById('serverbox-hud');
const clockEl = document.getElementById('clock');
const btnSplitToggle = document.getElementById('btn-split-toggle');
const splitBtnText = document.getElementById('split-btn-text');
const pane2 = document.getElementById('pane-2');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    renderSidebarList();
    renderTabs();
    renderActiveTerminal();
    setupEventListeners();
    setupAccessoryKeys();
    startTelemetryEngine();
});

// Clock updater
function initClock() {
    function update() {
        const d = new Date();
        clockEl.textContent = d.toTimeString().split(' ')[0];
    }
    setInterval(update, 1000);
    update();
}

// Navigation switcher
function setupEventListeners() {
    document.getElementById('nav-hosts').addEventListener('click', (e) => switchNavMode('hosts', e.target));
    document.getElementById('nav-serverbox').addEventListener('click', (e) => switchNavMode('serverbox', e.target));
    document.getElementById('nav-snippets').addEventListener('click', (e) => switchNavMode('snippets', e.target));

    document.getElementById('btn-new-tab').addEventListener('click', () => {
        openNewTab(hosts[0]);
    });

    btnSplitToggle.addEventListener('click', () => {
        isSplit1x2 = !isSplit1x2;
        if (isSplit1x2) {
            pane2.classList.remove('hidden');
            splitBtnText.textContent = "Split 1x1";
            if (tabs.length === 1 && hosts.length > 1) {
                openNewTab(hosts[1]);
            }
            renderSplitPane2();
        } else {
            pane2.classList.add('hidden');
            splitBtnText.textContent = "Split 1x2";
        }
    });

    // Terminal 1 Input
    termInput1.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = termInput1.value.trim();
            executeTerminalCommand(0, cmd);
            termInput1.value = '';
        }
    });

    // Terminal 2 Input
    termInput2.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = termInput2.value.trim();
            const secondIndex = (activeTabIndex + 1) % tabs.length;
            executeTerminalCommand(secondIndex, cmd);
            termInput2.value = '';
        }
    });

    // Modal Add Host
    const modal = document.getElementById('modal-add-host');
    document.getElementById('btn-add-host').addEventListener('click', () => modal.classList.remove('hidden'));
    document.getElementById('modal-close').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('modal-btn-cancel').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('modal-btn-save').addEventListener('click', saveNewHost);
}

function switchNavMode(mode, targetBtn) {
    currentNavMode = mode;
    document.querySelectorAll('.nav-segment-btn').forEach(btn => btn.classList.remove('active'));
    targetBtn.classList.add('active');

    if (mode === 'serverbox') {
        sidebarTitleEl.textContent = "MONITOR HOSTS";
        terminalWrapper.classList.add('hidden');
        serverboxHud.classList.remove('hidden');
    } else {
        terminalWrapper.classList.remove('hidden');
        serverboxHud.classList.add('hidden');
        sidebarTitleEl.textContent = mode === 'hosts' ? "SAVED SESSIONS" : "SNIPPET LIBRARY";
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
                <div class="host-item-top">
                    <span class="host-item-title">${escapeHtml(host.name)}</span>
                    <span class="host-item-tag ${tagClass}">${host.category}</span>
                </div>
                <div class="host-item-sub">${host.username}@${host.hostname}:${host.port || 'PTY'}</div>
            `;

            item.addEventListener('click', () => {
                if (currentNavMode === 'serverbox') {
                    selectHostForMonitoring(host);
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
            item.className = 'host-item';
            item.innerHTML = `
                <div class="host-item-top">
                    <span class="host-item-title" style="color: var(--accent-cyan)">${escapeHtml(snippet.title)}</span>
                </div>
                <div class="host-item-sub">${escapeHtml(snippet.command)}</div>
            `;

            item.addEventListener('click', () => {
                executeTerminalCommand(activeTabIndex, snippet.command);
            });

            hostListEl.appendChild(item);
        });
    }
}

function selectHostForMonitoring(host) {
    document.getElementById('hud-host-name').textContent = host.name;
    document.getElementById('hud-host-meta').textContent = `Linux 6.5.0-generic | ${host.hostname}:${host.port || 22} | Uptime: 48d 14h`;
}

function openNewTab(host) {
    const newTab = {
        id: "tab_" + (tabs.length + 1),
        host: host,
        history: [
            `<span class='ansi-cyan'>[Session Connected: ${host.username}@${host.hostname}]</span>`,
            `<span class='ansi-green'>Agnoster Powerline Theme Engaged (Zero Emojis)</span><br>`
        ]
    };
    tabs.push(newTab);
    activeTabIndex = tabs.length - 1;
    renderTabs();
    renderActiveTerminal();
    if (isSplit1x2) renderSplitPane2();
}

function renderTabs() {
    tabsContainerEl.innerHTML = '';
    tabs.forEach((tab, index) => {
        const tabEl = document.createElement('div');
        tabEl.className = `terminal-tab ${index === activeTabIndex ? 'active' : ''}`;
        
        tabEl.innerHTML = `
            <span>${escapeHtml(tab.host.name)}</span>
            ${tabs.length > 1 ? `<span class="tab-close" data-index="${index}">&times;</span>` : ''}
        `;

        tabEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-close')) {
                closeTab(parseInt(e.target.dataset.index, 10));
            } else {
                activeTabIndex = index;
                renderTabs();
                renderActiveTerminal();
                if (isSplit1x2) renderSplitPane2();
            }
        });

        tabsContainerEl.appendChild(tabEl);
    });
}

function closeTab(index) {
    if (tabs.length <= 1) return;
    tabs.splice(index, 1);
    if (activeTabIndex >= tabs.length) {
        activeTabIndex = tabs.length - 1;
    }
    renderTabs();
    renderActiveTerminal();
    if (isSplit1x2) renderSplitPane2();
}

function renderActiveTerminal() {
    const currentTab = tabs[activeTabIndex];
    if (!currentTab) return;

    document.getElementById('pane-1-title').textContent = `${currentTab.host.name} [${currentTab.host.authType}]`;
    document.getElementById('prompt-1').innerHTML = currentTab.host.authType === 'LOCAL_PTY'
        ? "<span class='ansi-green'>&#x279c;</span> <span class='ansi-cyan'>~</span> <span class='ansi-green'>&#x276f;</span>"
        : `<span class='ansi-cyan'>${currentTab.host.username}@${currentTab.host.hostname}</span> <span class='ansi-green'>&#x276f;</span>`;

    termScreen1.innerHTML = currentTab.history.map(line => `<div class="term-line">${line}</div>`).join('');
    termScreen1.scrollTop = termScreen1.scrollHeight;
}

function renderSplitPane2() {
    if (tabs.length <= 1) return;
    const secondIndex = (activeTabIndex + 1) % tabs.length;
    const secondTab = tabs[secondIndex];

    document.getElementById('pane-2-title').textContent = `${secondTab.host.name} [${secondTab.host.authType}]`;
    document.getElementById('prompt-2').innerHTML = `<span class='ansi-cyan'>${secondTab.host.username}@${secondTab.host.hostname}</span> <span class='ansi-green'>&#x276f;</span>`;

    termScreen2.innerHTML = secondTab.history.map(line => `<div class="term-line">${line}</div>`).join('');
    termScreen2.scrollTop = termScreen2.scrollHeight;
}

function executeTerminalCommand(tabIdx, cmd) {
    const targetTab = tabs[tabIdx];
    if (!targetTab) return;

    const promptText = targetTab.host.authType === 'LOCAL_PTY'
        ? `&#x279c; ~ &#x276f; ${escapeHtml(cmd)}`
        : `${targetTab.host.username}@${targetTab.host.hostname} ~ &#x276f; ${escapeHtml(cmd)}`;

    targetTab.history.push(`<span class="ansi-bold">${promptText}</span>`);

    // Simulated responses
    const lower = cmd.toLowerCase().trim();
    if (lower === 'help') {
        targetTab.history.push("<span class='ansi-cyan'>MateTerminal-Box Built-in Commands:</span>");
        targetTab.history.push("  htop        - View simulated CPU/Memory monitor");
        targetTab.history.push("  uname -a    - Show Linux kernel and MatePad 12X system details");
        targetTab.history.push("  docker ps   - List active container services");
        targetTab.history.push("  df -h       - Display filesystem disk allocations");
        targetTab.history.push("  clear       - Wipe the active screen output buffer");
    } else if (lower === 'clear') {
        targetTab.history = [];
    } else if (lower === 'uname -a') {
        targetTab.history.push("Linux MatePad-12X 6.5.0-35-generic #36-Ubuntu SMP PREEMPT_DYNAMIC aarch64 GNU/Linux");
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
    } else if (lower.length > 0) {
        targetTab.history.push(`Executed: ${escapeHtml(cmd)} (exit code: 0)`);
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
            } else if (key === 'TAB') {
                input.value += '    ';
            } else if (key === 'CTRL') {
                executeTerminalCommand(activeTabIndex, '^C');
            } else if (key === 'UP') {
                input.value = 'htop';
            } else if (key === 'DOWN') {
                input.value = 'docker ps';
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
        // Random slight variance for live HUD
        const cpu = (20 + Math.random() * 15).toFixed(1);
        const mem = (3.6 + Math.random() * 0.4).toFixed(1);
        const rx = (1.2 + Math.random() * 0.8).toFixed(1);
        const tx = Math.floor(200 + Math.random() * 250);

        const cpuValEl = document.getElementById('hud-cpu-val');
        const cpuBarEl = document.getElementById('hud-cpu-bar');
        const memValEl = document.getElementById('hud-mem-val');
        const memBarEl = document.getElementById('hud-mem-bar');
        const netValEl = document.getElementById('hud-net-val');

        if (cpuValEl) cpuValEl.textContent = `${cpu}%`;
        if (cpuBarEl) cpuBarEl.style.width = `${cpu}%`;
        if (memValEl) memValEl.textContent = `${mem} GB / 8.0 GB (${Math.round((mem/8.0)*100)}%)`;
        if (memBarEl) memBarEl.style.width = `${Math.round((mem/8.0)*100)}%`;
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
        colorAccent: "#38bdf8"
    };

    hosts.push(newHost);
    localStorage.setItem('mate_hosts', JSON.stringify(hosts));
    document.getElementById('modal-add-host').classList.add('hidden');
    renderSidebarList();
}

function escapeHtml(text) {
    return (text || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
