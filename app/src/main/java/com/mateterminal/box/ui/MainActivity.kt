package com.mateterminal.box.ui

import android.app.AlertDialog
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.mateterminal.box.R
import com.mateterminal.box.core.monitor.ServerBoxTelemetryCollector
import com.mateterminal.box.core.pty.LocalPTYManager
import com.mateterminal.box.core.ssh.SSHClientManager
import com.mateterminal.box.core.storage.AuthType
import com.mateterminal.box.core.storage.HostModel
import com.mateterminal.box.core.storage.SessionWindowModel
import com.mateterminal.box.core.storage.SnippetModel
import com.mateterminal.box.core.storage.StorageManager
import com.mateterminal.box.core.theme.OhMyZshTheme
import com.mateterminal.box.databinding.ActivityMainBinding
import com.mateterminal.box.service.TerminalForegroundService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.util.UUID

enum class WindowSplitMode {
    SINGLE,   // 1x1
    DUAL_H,   // 1x2 Left/Right
    DUAL_V,   // 2x1 Top/Bottom
    QUAD,     // 2x2 Matrix
    PIP       // Floating Overlay
}

enum class ActiveViewportView {
    TERMINAL_MATRIX,
    HOSTS_VAULT,
    SESSION_WINDOWS,
    SERVERBOX_HUD
}

data class TabSession(
    val id: String = UUID.randomUUID().toString(),
    val host: HostModel,
    var isConnected: Boolean = false,
    var sshManager: SSHClientManager? = null,
    var ptyManager: LocalPTYManager? = null,
    val outputBuffer: StringBuilder = StringBuilder()
)

data class PaneTerminalState(
    val paneIndex: Int,
    var session: TabSession? = null,
    val outputBuffer: StringBuilder = StringBuilder()
)

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    
    // Multi-tab sessions
    private val tabSessions = mutableListOf<TabSession>()
    private var activeTabSessionIndex = 0
    
    // Session Window Split state
    private var currentSplitMode = WindowSplitMode.SINGLE
    private var activeFocusedPane = 1 // 1..4
    private val paneStates = Array(4) { idx -> PaneTerminalState(idx + 1) }

    // Navigation & Monitoring
    private var activeView = ActiveViewportView.TERMINAL_MATRIX
    private var telemetryJob: Job? = null
    private var telemetryCollector: ServerBoxTelemetryCollector? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Edge-to-edge full screen for Huawei MatePad 12X (3:2 144Hz)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupWindowInsets()
        setupDrawerNavigation()
        setupTopAppBarControls()
        setupSessionWindowSplitModes()
        setupAccessoryKeybar()
        setupPaneFocusListeners()
        setupPaneCloseButtons()
        startKeepAliveService()

        // Initialize default local shell session tab
        val hosts = StorageManager.getHosts()
        val defaultHost = hosts.firstOrNull() ?: HostModel(
            name = "Huawei MatePad 12X (Local)",
            hostname = "localhost",
            authType = AuthType.LOCAL_PTY,
            category = "Local"
        )
        openSessionTab(defaultHost)
    }

    private fun setupWindowInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { _, insets ->
            val sysBars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            binding.root.setPadding(sysBars.left, sysBars.top, sysBars.right, sysBars.bottom)
            WindowInsetsCompat.CONSUMED
        }
    }

    private fun setupDrawerNavigation() {
        binding.btnOpenDrawer.setOnClickListener {
            binding.drawerLayout.openDrawer(GravityCompat.START)
        }

        binding.drawerItemTerminal.setOnClickListener {
            switchViewport(ActiveViewportView.TERMINAL_MATRIX)
            binding.drawerLayout.closeDrawer(GravityCompat.START)
        }

        binding.drawerItemSessionWindows.setOnClickListener {
            switchViewport(ActiveViewportView.SESSION_WINDOWS)
            binding.drawerLayout.closeDrawer(GravityCompat.START)
        }

        binding.drawerItemHosts.setOnClickListener {
            switchViewport(ActiveViewportView.HOSTS_VAULT)
            binding.drawerLayout.closeDrawer(GravityCompat.START)
        }

        binding.drawerItemMonitor.setOnClickListener {
            switchViewport(ActiveViewportView.SERVERBOX_HUD)
            binding.drawerLayout.closeDrawer(GravityCompat.START)
        }

        binding.drawerItemSnippets.setOnClickListener {
            binding.drawerLayout.closeDrawer(GravityCompat.START)
            showSnippetsModal()
        }

        binding.drawerItemSettings.setOnClickListener {
            binding.drawerLayout.closeDrawer(GravityCompat.START)
            showSettingsModal()
        }
    }

    private fun setupTopAppBarControls() {
        binding.btnTopAdd.setOnClickListener {
            showNewSessionOrHostPicker()
        }

        binding.btnStripNewTab.setOnClickListener {
            showNewSessionPicker()
        }

        binding.btnVaultNewHost.setOnClickListener {
            showAddHostDialog()
        }

        binding.btnNewSessionWindow.setOnClickListener {
            showCreateSessionWindowDialog()
        }
    }

    private fun switchViewport(view: ActiveViewportView) {
        activeView = view
        binding.paneContainerGrid.visibility = if (view == ActiveViewportView.TERMINAL_MATRIX) View.VISIBLE else View.GONE
        binding.viewHostsVault.visibility = if (view == ActiveViewportView.HOSTS_VAULT) View.VISIBLE else View.GONE
        binding.viewSessionWindowManager.visibility = if (view == ActiveViewportView.SESSION_WINDOWS) View.VISIBLE else View.GONE
        binding.viewServerBoxHud.visibility = if (view == ActiveViewportView.SERVERBOX_HUD) View.VISIBLE else View.GONE

        // Strip visibility: only shown in Terminal Matrix mode
        binding.sessionTabsStrip.visibility = if (view == ActiveViewportView.TERMINAL_MATRIX) View.VISIBLE else View.GONE
        binding.sessionWindowSelectors.visibility = if (view == ActiveViewportView.TERMINAL_MATRIX) View.VISIBLE else View.GONE

        when (view) {
            ActiveViewportView.TERMINAL_MATRIX -> {
                binding.tvAppTitle.text = "Termius Pro"
                renderActivePanes()
            }
            ActiveViewportView.HOSTS_VAULT -> {
                binding.tvAppTitle.text = "Hosts Vault"
                setupHostsVaultList()
            }
            ActiveViewportView.SESSION_WINDOWS -> {
                binding.tvAppTitle.text = "Session Windows"
                setupSessionWindowsList()
            }
            ActiveViewportView.SERVERBOX_HUD -> {
                binding.tvAppTitle.text = "ServerBox Telemetry"
                startServerBoxMonitoring()
            }
        }
    }

    private fun setupSessionWindowSplitModes() {
        val defaultBtnBg = Color.TRANSPARENT
        val activeBtnBg = getColor(R.color.bg_card_active)
        val tintActive = getColor(R.color.accent_termius)
        val tintInactive = getColor(R.color.text_secondary)

        fun resetSelectorButtons() {
            binding.btnModeSingle.setBackgroundColor(defaultBtnBg)
            binding.btnModeDualH.setBackgroundColor(defaultBtnBg)
            binding.btnModeDualV.setBackgroundColor(defaultBtnBg)
            binding.btnModeQuad.setBackgroundColor(defaultBtnBg)
            binding.btnModePip.setBackgroundColor(defaultBtnBg)

            binding.btnModeSingle.setColorFilter(tintInactive)
            binding.btnModeDualH.setColorFilter(tintInactive)
            binding.btnModeDualV.setColorFilter(tintInactive)
            binding.btnModeQuad.setColorFilter(tintInactive)
            binding.btnModePip.setColorFilter(tintInactive)
        }

        binding.btnModeSingle.setOnClickListener {
            resetSelectorButtons()
            binding.btnModeSingle.setBackgroundColor(activeBtnBg)
            binding.btnModeSingle.setColorFilter(tintActive)
            setSplitMode(WindowSplitMode.SINGLE)
        }

        binding.btnModeDualH.setOnClickListener {
            resetSelectorButtons()
            binding.btnModeDualH.setBackgroundColor(activeBtnBg)
            binding.btnModeDualH.setColorFilter(tintActive)
            setSplitMode(WindowSplitMode.DUAL_H)
        }

        binding.btnModeDualV.setOnClickListener {
            resetSelectorButtons()
            binding.btnModeDualV.setBackgroundColor(activeBtnBg)
            binding.btnModeDualV.setColorFilter(tintActive)
            setSplitMode(WindowSplitMode.DUAL_V)
        }

        binding.btnModeQuad.setOnClickListener {
            resetSelectorButtons()
            binding.btnModeQuad.setBackgroundColor(activeBtnBg)
            binding.btnModeQuad.setColorFilter(tintActive)
            setSplitMode(WindowSplitMode.QUAD)
        }

        binding.btnModePip.setOnClickListener {
            resetSelectorButtons()
            binding.btnModePip.setBackgroundColor(activeBtnBg)
            binding.btnModePip.setColorFilter(tintActive)
            setSplitMode(WindowSplitMode.PIP)
        }
    }

    private fun setSplitMode(mode: WindowSplitMode) {
        currentSplitMode = mode
        when (mode) {
            WindowSplitMode.SINGLE -> {
                binding.rowTopPanes.visibility = View.VISIBLE
                binding.cardPane1.visibility = View.VISIBLE
                binding.cardPane2.visibility = View.GONE
                binding.rowBottomPanes.visibility = View.GONE
                binding.cardPane3.visibility = View.GONE
                binding.cardPane4.visibility = View.GONE
            }
            WindowSplitMode.DUAL_H -> {
                binding.rowTopPanes.visibility = View.VISIBLE
                binding.cardPane1.visibility = View.VISIBLE
                binding.cardPane2.visibility = View.VISIBLE
                binding.rowBottomPanes.visibility = View.GONE
                binding.cardPane3.visibility = View.GONE
                binding.cardPane4.visibility = View.GONE
                ensurePaneAssigned(2)
            }
            WindowSplitMode.DUAL_V -> {
                binding.rowTopPanes.visibility = View.VISIBLE
                binding.cardPane1.visibility = View.VISIBLE
                binding.cardPane2.visibility = View.GONE
                binding.rowBottomPanes.visibility = View.VISIBLE
                binding.cardPane3.visibility = View.VISIBLE
                binding.cardPane4.visibility = View.GONE
                ensurePaneAssigned(3)
            }
            WindowSplitMode.QUAD -> {
                binding.rowTopPanes.visibility = View.VISIBLE
                binding.cardPane1.visibility = View.VISIBLE
                binding.cardPane2.visibility = View.VISIBLE
                binding.rowBottomPanes.visibility = View.VISIBLE
                binding.cardPane3.visibility = View.VISIBLE
                binding.cardPane4.visibility = View.VISIBLE
                ensurePaneAssigned(2)
                ensurePaneAssigned(3)
                ensurePaneAssigned(4)
            }
            WindowSplitMode.PIP -> {
                binding.rowTopPanes.visibility = View.VISIBLE
                binding.cardPane1.visibility = View.VISIBLE
                binding.cardPane2.visibility = View.VISIBLE
                binding.rowBottomPanes.visibility = View.GONE
                binding.cardPane3.visibility = View.GONE
                binding.cardPane4.visibility = View.GONE
                ensurePaneAssigned(2)
                Toast.makeText(this, "Termius Pro: Floating Overlay Pane Activated", Toast.LENGTH_SHORT).show()
            }
        }
        updatePaneFocusVisuals()
        renderActivePanes()
    }

    private fun ensurePaneAssigned(paneIndex: Int) {
        val state = paneStates[paneIndex - 1]
        if (state.session == null) {
            // Pick or create a session for this pane
            val hosts = StorageManager.getHosts()
            val hostToUse = hosts.getOrNull((paneIndex - 1) % hosts.size) ?: hosts.first()
            val newSession = TabSession(host = hostToUse)
            tabSessions.add(newSession)
            state.session = newSession
            connectSession(newSession)
            renderTabs()
        }
    }

    private fun setupPaneFocusListeners() {
        binding.cardPane1.setOnClickListener { setFocusedPane(1) }
        binding.cardPane2.setOnClickListener { setFocusedPane(2) }
        binding.cardPane3.setOnClickListener { setFocusedPane(3) }
        binding.cardPane4.setOnClickListener { setFocusedPane(4) }
    }

    private fun setFocusedPane(paneIndex: Int) {
        activeFocusedPane = paneIndex
        updatePaneFocusVisuals()
    }

    private fun updatePaneFocusVisuals() {
        binding.cardPane1.setBackgroundResource(if (activeFocusedPane == 1) R.drawable.bg_window_active else R.drawable.bg_window_inactive)
        binding.cardPane2.setBackgroundResource(if (activeFocusedPane == 2) R.drawable.bg_window_active else R.drawable.bg_window_inactive)
        binding.cardPane3.setBackgroundResource(if (activeFocusedPane == 3) R.drawable.bg_window_active else R.drawable.bg_window_inactive)
        binding.cardPane4.setBackgroundResource(if (activeFocusedPane == 4) R.drawable.bg_window_active else R.drawable.bg_window_inactive)
    }

    private fun setupPaneCloseButtons() {
        binding.btnClosePane1.setOnClickListener { closePane(1) }
        binding.btnClosePane2.setOnClickListener { closePane(2) }
        binding.btnClosePane3.setOnClickListener { closePane(3) }
        binding.btnClosePane4.setOnClickListener { closePane(4) }
    }

    private fun closePane(paneIndex: Int) {
        val state = paneStates[paneIndex - 1]
        state.session?.let { s ->
            s.sshManager?.disconnect()
            s.ptyManager?.stop()
            tabSessions.remove(s)
            state.session = null
        }
        if (paneIndex == 1) {
            // Always keep at least 1 pane active
            if (tabSessions.isEmpty()) {
                val defaultHost = StorageManager.getHosts().first()
                openSessionTab(defaultHost)
            } else {
                paneStates[0].session = tabSessions.first()
            }
        } else {
            // Auto downgrade split mode if closing multi panes
            if (currentSplitMode == WindowSplitMode.QUAD && paneIndex in 3..4) {
                setSplitMode(WindowSplitMode.DUAL_H)
            } else if (paneIndex == 2) {
                setSplitMode(WindowSplitMode.SINGLE)
            }
        }
        renderTabs()
        renderActivePanes()
    }

    private fun openSessionTab(host: HostModel) {
        val session = TabSession(host = host)
        tabSessions.add(session)
        activeTabSessionIndex = tabSessions.size - 1
        paneStates[0].session = session
        
        renderTabs()
        connectSession(session)
        renderActivePanes()
    }

    private fun renderTabs() {
        binding.tabLayoutContainer.removeAllViews()
        for (i in tabSessions.indices) {
            val session = tabSessions[i]
            val isActiveTab = (i == activeTabSessionIndex)
            
            val tabView = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(28, 10, 24, 10)
                setBackgroundColor(
                    if (isActiveTab) getColor(R.color.bg_primary) else getColor(R.color.bg_secondary)
                )
                
                val title = TextView(this@MainActivity).apply {
                    text = "${session.host.name} "
                    textSize = 12f
                    typeface = Typeface.MONOSPACE
                    setTextColor(
                        if (isActiveTab) getColor(R.color.accent_cyan) else getColor(R.color.text_secondary)
                    )
                }
                addView(title)

                if (tabSessions.size > 1) {
                    val closeBtn = TextView(this@MainActivity).apply {
                        text = " ×"
                        textSize = 14f
                        setTextColor(getColor(R.color.text_muted))
                        setOnClickListener { closeTab(i) }
                    }
                    addView(closeBtn)
                }

                setOnClickListener {
                    activeTabSessionIndex = i
                    paneStates[activeFocusedPane - 1].session = session
                    renderTabs()
                    renderActivePanes()
                }
            }
            binding.tabLayoutContainer.addView(tabView)
        }
    }

    private fun closeTab(index: Int) {
        if (index in tabSessions.indices) {
            val session = tabSessions.removeAt(index)
            session.sshManager?.disconnect()
            session.ptyManager?.stop()
            if (activeTabSessionIndex >= tabSessions.size) {
                activeTabSessionIndex = (tabSessions.size - 1).coerceAtLeast(0)
            }
            paneStates[0].session = tabSessions.getOrNull(activeTabSessionIndex)
            renderTabs()
            renderActivePanes()
        }
    }

    private fun connectSession(session: TabSession) {
        lifecycleScope.launch {
            if (session.host.authType == AuthType.LOCAL_PTY) {
                val welcome = OhMyZshTheme.buildRobbyRussellPrompt("~", "main", true)
                session.outputBuffer.append("Termius Pro [Huawei MatePad 12X Engine]\n")
                session.outputBuffer.append("Resolution: 2800x1840 (3:2) | 144Hz Refresh\n\n")
                session.outputBuffer.append(welcome)

                val pty = LocalPTYManager()
                session.ptyManager = pty
                pty.start(cols = 140, rows = 40)
                session.isConnected = true
                listenStream(session, pty.inputStream)
            } else {
                session.outputBuffer.append("Connecting to ${session.host.username}@${session.host.hostname}:${session.host.port}...\n")
                val ssh = SSHClientManager(session.host)
                session.sshManager = ssh

                ssh.connect(
                    cols = 140,
                    rows = 40,
                    onConnected = {
                        session.isConnected = true
                        session.outputBuffer.append("Connected.\n")
                        val prompt = OhMyZshTheme.buildAgnosterPrompt(session.host.username, session.host.hostname, "~", "master")
                        session.outputBuffer.append(prompt)
                        renderActivePanes()
                        listenStream(session, ssh.inputStream)
                    },
                    onError = { err ->
                        session.outputBuffer.append("\nConnection Failed: ${err.message}\n")
                        renderActivePanes()
                    }
                )
            }
            renderActivePanes()
        }
    }

    private fun listenStream(session: TabSession, inputStream: InputStream?) {
        if (inputStream == null) return
        lifecycleScope.launch(Dispatchers.IO) {
            val buffer = ByteArray(4096)
            try {
                while (isActive) {
                    val count = inputStream.read(buffer)
                    if (count <= 0) break
                    val text = String(buffer, 0, count)
                    withContext(Dispatchers.Main) {
                        session.outputBuffer.append(text)
                        renderActivePanes()
                    }
                }
            } catch (_: Exception) {}
        }
    }

    private fun renderActivePanes() {
        val cleanRegex = Regex("\u001b\\[[0-9;]*[a-zA-Z]")

        // Pane 1
        val s1 = paneStates[0].session ?: tabSessions.getOrNull(0)
        s1?.let {
            binding.tvPane1Title.text = "Pane 1: ${it.host.name}"
            binding.tvTerminalOutput1.text = it.outputBuffer.toString().replace(cleanRegex, "")
        }

        // Pane 2
        if (binding.cardPane2.visibility == View.VISIBLE) {
            val s2 = paneStates[1].session ?: tabSessions.getOrNull(1) ?: s1
            s2?.let {
                binding.tvPane2Title.text = "Pane 2: ${it.host.name}"
                binding.tvTerminalOutput2.text = it.outputBuffer.toString().replace(cleanRegex, "")
            }
        }

        // Pane 3
        if (binding.cardPane3.visibility == View.VISIBLE) {
            val s3 = paneStates[2].session ?: tabSessions.getOrNull(2) ?: s1
            s3?.let {
                binding.tvPane3Title.text = "Pane 3: ${it.host.name}"
                binding.tvTerminalOutput3.text = it.outputBuffer.toString().replace(cleanRegex, "")
            }
        }

        // Pane 4
        if (binding.cardPane4.visibility == View.VISIBLE) {
            val s4 = paneStates[3].session ?: tabSessions.getOrNull(3) ?: s1
            s4?.let {
                binding.tvPane4Title.text = "Pane 4: ${it.host.name}"
                binding.tvTerminalOutput4.text = it.outputBuffer.toString().replace(cleanRegex, "")
            }
        }
    }

    private fun getActiveFocusedSession(): TabSession? {
        return paneStates[activeFocusedPane - 1].session ?: tabSessions.getOrNull(activeTabSessionIndex)
    }

    private fun sendToActiveSession(input: String) {
        val session = getActiveFocusedSession() ?: return
        if (session.host.authType == AuthType.LOCAL_PTY) {
            session.ptyManager?.write(input)
        } else {
            session.sshManager?.write(input)
        }
    }

    private fun setupAccessoryKeybar() {
        binding.keyEsc.setOnClickListener { sendToActiveSession("\u001b") }
        binding.keyTab.setOnClickListener { sendToActiveSession("\t") }
        binding.keyCtrl.setOnClickListener { sendToActiveSession("\u0003") } // Ctrl+C interrupt
        binding.keyAlt.setOnClickListener { sendToActiveSession("\u001b") }
        binding.keyPipe.setOnClickListener { sendToActiveSession("|") }
        binding.keyTilde.setOnClickListener { sendToActiveSession("~") }
        binding.keySlash.setOnClickListener { sendToActiveSession("/") }
        binding.keyHyphen.setOnClickListener { sendToActiveSession("-") }
        binding.keyUp.setOnClickListener { sendToActiveSession("\u001b[A") }
        binding.keyDown.setOnClickListener { sendToActiveSession("\u001b[B") }
        binding.keyLeft.setOnClickListener { sendToActiveSession("\u001b[D") }
        binding.keyRight.setOnClickListener { sendToActiveSession("\u001b[C") }
    }

    // --- HOSTS VAULT RECYCLER ---
    private fun setupHostsVaultList() {
        binding.rvVaultHosts.layoutManager = LinearLayoutManager(this)
        val hosts = StorageManager.getHosts()
        binding.rvVaultHosts.adapter = HostAdapter(hosts) { host ->
            openSessionTab(host)
            switchViewport(ActiveViewportView.TERMINAL_MATRIX)
        }
    }

    // --- SESSION WINDOWS RECYCLER ---
    private fun setupSessionWindowsList() {
        binding.rvSessionWindows.layoutManager = LinearLayoutManager(this)
        var windows = StorageManager.getWindows()
        if (windows.isEmpty()) {
            val defaultWindows = listOf(
                SessionWindowModel(
                    workspaceName = "Production & Monitoring Matrix (2x2 Quad)",
                    splitLayoutType = "QUAD",
                    hostIds = StorageManager.getHosts().map { it.id }
                ),
                SessionWindowModel(
                    workspaceName = "DevOps Dual Stream (1x2 Split H)",
                    splitLayoutType = "DUAL_H",
                    hostIds = StorageManager.getHosts().take(2).map { it.id }
                ),
                SessionWindowModel(
                    workspaceName = "Local Shell Focus (1x1 Single)",
                    splitLayoutType = "SINGLE",
                    hostIds = listOf("local_device")
                )
            )
            StorageManager.saveWindows(defaultWindows)
            windows = defaultWindows
        }

        binding.rvSessionWindows.adapter = SessionWindowAdapter(windows) { win ->
            applySessionWindowPreset(win)
            switchViewport(ActiveViewportView.TERMINAL_MATRIX)
        }
    }

    private fun applySessionWindowPreset(win: SessionWindowModel) {
        when (win.splitLayoutType) {
            "SINGLE" -> binding.btnModeSingle.performClick()
            "DUAL_H" -> binding.btnModeDualH.performClick()
            "DUAL_V" -> binding.btnModeDualV.performClick()
            "QUAD" -> binding.btnModeQuad.performClick()
            else -> binding.btnModeSingle.performClick()
        }
        Toast.makeText(this, "Loaded Session Window: ${win.workspaceName}", Toast.LENGTH_SHORT).show()
    }

    private fun showCreateSessionWindowDialog() {
        val etName = EditText(this).apply { hint = "Session Window Name (e.g. Quad Kubernetes)" }
        AlertDialog.Builder(this)
            .setTitle("Create Session Window Preset")
            .setView(etName)
            .setPositiveButton("Save Preset") { _, _ ->
                val name = etName.text.toString().ifBlank { "New Session Window" }
                val newWin = SessionWindowModel(
                    workspaceName = name,
                    splitLayoutType = currentSplitMode.name,
                    hostIds = tabSessions.map { it.host.id }
                )
                val current = StorageManager.getWindows().toMutableList()
                current.add(0, newWin)
                StorageManager.saveWindows(current)
                setupSessionWindowsList()
                Toast.makeText(this, "Saved Session Window: $name", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    // --- SERVERBOX TELEMETRY ---
    private fun startServerBoxMonitoring() {
        telemetryJob?.cancel()
        if (telemetryCollector == null) {
            val firstHost = StorageManager.getHosts().firstOrNull() ?: return
            telemetryCollector = ServerBoxTelemetryCollector(firstHost)
            binding.tvServerBoxTarget.text = "Selected Host: ${firstHost.name} (${firstHost.hostname})"
        }

        telemetryJob = lifecycleScope.launch {
            while (isActive) {
                val metric = telemetryCollector?.collectTelemetry()
                if (metric != null && activeView == ActiveViewportView.SERVERBOX_HUD) {
                    updateTelemetryUI(metric)
                }
                delay(3000)
            }
        }
    }

    private fun updateTelemetryUI(metric: com.mateterminal.box.core.monitor.ServerTelemetry) {
        binding.tvCpuPercent.text = String.format("%.1f%%", metric.cpuTotalPercent)
        binding.pbCpu.progress = metric.cpuTotalPercent.toInt().coerceIn(0, 100)

        val usedGb = metric.memUsedMb / 1024f
        val totalGb = (metric.memTotalMb / 1024f).coerceAtLeast(1f)
        val memPct = ((usedGb / totalGb) * 100f).toInt().coerceIn(0, 100)
        binding.tvMemPercent.text = String.format("%.1f GB / %.1f GB (%d%%)", usedGb, totalGb, memPct)
        binding.pbMem.progress = memPct

        binding.tvNetSpeed.text = String.format("RX: %.1f KB/s | TX: %.1f KB/s", metric.rxSpeedKbps, metric.txSpeedKbps)
        binding.tvUptime.text = "Uptime: ${metric.uptimeText} | ${metric.osInfo}"
    }

    private fun showSnippetsModal() {
        val snippets = StorageManager.getSnippets()
        val titles = snippets.map { "${it.title} -> ${it.command}" }.toTypedArray()
        AlertDialog.Builder(this)
            .setTitle("Snippets Library")
            .setItems(titles) { _, which ->
                val snip = snippets[which]
                sendToActiveSession(snip.command + "\n")
                Toast.makeText(this, "Executed: ${snip.title}", Toast.LENGTH_SHORT).show()
                switchViewport(ActiveViewportView.TERMINAL_MATRIX)
            }
            .setPositiveButton("Close", null)
            .show()
    }

    private fun showSettingsModal() {
        val themes = arrayOf("Tokyo Night", "Solarized Dark", "Dracula Pro", "Nord Aurora", "One Dark Pro")
        AlertDialog.Builder(this)
            .setTitle("Settings & Themes (Termius Pro 64 Schemes)")
            .setItems(themes) { _, which ->
                Toast.makeText(this, "Applied Scheme: ${themes[which]}", Toast.LENGTH_SHORT).show()
            }
            .setPositiveButton("Close", null)
            .show()
    }

    private fun showNewSessionOrHostPicker() {
        val options = arrayOf("New Local Terminal Tab", "New SSH Tab from Vault", "Create New Host", "New Session Window")
        AlertDialog.Builder(this)
            .setTitle("Quick Action")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> openSessionTab(StorageManager.getHosts().first())
                    1 -> showNewSessionPicker()
                    2 -> showAddHostDialog()
                    3 -> showCreateSessionWindowDialog()
                }
            }
            .show()
    }

    private fun showAddHostDialog() {
        val editContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 20, 40, 20)
        }

        val etLabel = EditText(this).apply { hint = "Label Name (e.g. Production VPS)" }
        val etHost = EditText(this).apply { hint = "Hostname / IP (e.g. 103.145.22.45)" }
        val etPort = EditText(this).apply { hint = "Port (default 22)"; setText("22") }
        val etUser = EditText(this).apply { hint = "Username (e.g. ubuntu)"; setText("ubuntu") }
        val etPass = EditText(this).apply { hint = "Password or Private Key" }

        editContainer.addView(etLabel)
        editContainer.addView(etHost)
        editContainer.addView(etPort)
        editContainer.addView(etUser)
        editContainer.addView(etPass)

        AlertDialog.Builder(this)
            .setTitle("Add SSH Host to Vault")
            .setView(editContainer)
            .setPositiveButton("Save") { _, _ ->
                val newHost = HostModel(
                    name = etLabel.text.toString().ifBlank { "Remote Host" },
                    hostname = etHost.text.toString().ifBlank { "localhost" },
                    port = etPort.text.toString().toIntOrNull() ?: 22,
                    username = etUser.text.toString().ifBlank { "root" },
                    passwordOrKey = etPass.text.toString(),
                    authType = AuthType.PASSWORD,
                    category = "Cloud"
                )
                StorageManager.addHost(newHost)
                setupHostsVaultList()
                Toast.makeText(this, "Host Added: ${newHost.name}", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showNewSessionPicker() {
        val hosts = StorageManager.getHosts()
        val hostNames = hosts.map { "${it.name} (${it.username}@${it.hostname})" }.toTypedArray()

        AlertDialog.Builder(this)
            .setTitle("Open Terminal Tab")
            .setItems(hostNames) { _, which ->
                openSessionTab(hosts[which])
            }
            .show()
    }

    private fun startKeepAliveService() {
        TerminalForegroundService.startService(this, "Termius Pro KeepAlive Active", "Multi-Pane Session persistence (3:2 144Hz)")
    }

    override fun onDestroy() {
        super.onDestroy()
        telemetryJob?.cancel()
        for (s in tabSessions) {
            s.sshManager?.disconnect()
            s.ptyManager?.stop()
        }
    }
}

// Adapters
class HostAdapter(
    private val hosts: List<HostModel>,
    private val onSelect: (HostModel) -> Unit
) : RecyclerView.Adapter<HostAdapter.ViewHolder>() {

    class ViewHolder(val view: View) : RecyclerView.ViewHolder(view) {
        val tvName: TextView = view.findViewById(android.R.id.text1)
        val tvSub: TextView = view.findViewById(android.R.id.text2)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val v = LayoutInflater.from(parent.context).inflate(android.R.layout.simple_list_item_2, parent, false)
        return ViewHolder(v)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = hosts[position]
        holder.tvName.text = item.name
        holder.tvName.setTextColor(Color.parseColor("#ffffff"))
        holder.tvName.textSize = 14f
        holder.tvName.typeface = Typeface.DEFAULT_BOLD

        holder.tvSub.text = "${item.username}@${item.hostname}:${item.port}  [${item.category}]"
        holder.tvSub.setTextColor(Color.parseColor("#a5a7c2"))
        holder.tvSub.textSize = 12f

        holder.itemView.setOnClickListener { onSelect(item) }
    }

    override fun getItemCount(): Int = hosts.size
}

class SessionWindowAdapter(
    private val windows: List<SessionWindowModel>,
    private val onSelect: (SessionWindowModel) -> Unit
) : RecyclerView.Adapter<SessionWindowAdapter.ViewHolder>() {

    class ViewHolder(val view: View) : RecyclerView.ViewHolder(view) {
        val tvName: TextView = view.findViewById(android.R.id.text1)
        val tvSub: TextView = view.findViewById(android.R.id.text2)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val v = LayoutInflater.from(parent.context).inflate(android.R.layout.simple_list_item_2, parent, false)
        return ViewHolder(v)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = windows[position]
        holder.tvName.text = item.workspaceName
        holder.tvName.setTextColor(Color.parseColor("#00d8d6"))
        holder.tvName.textSize = 14f
        holder.tvName.typeface = Typeface.DEFAULT_BOLD

        holder.tvSub.text = "Matrix Layout: ${item.splitLayoutType} | Sessions: ${item.hostIds.size}"
        holder.tvSub.setTextColor(Color.parseColor("#a5a7c2"))
        holder.tvSub.textSize = 12f

        holder.itemView.setOnClickListener { onSelect(item) }
    }

    override fun getItemCount(): Int = windows.size
}
