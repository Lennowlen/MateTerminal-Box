package com.mateterminal.box.ui

import android.app.AlertDialog
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.text.SpannableStringBuilder
import android.text.style.ForegroundColorSpan
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.RadioGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
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

data class TabSession(
    val id: String = UUID.randomUUID().toString(),
    val host: HostModel,
    var sshManager: SSHClientManager? = null,
    var ptyManager: LocalPTYManager? = null,
    val outputBuffer: StringBuilder = StringBuilder(),
    var isConnected: Boolean = false
)

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val tabSessions = mutableListOf<TabSession>()
    private var activeTabSessionIndex = 0
    private var isSplitMode1x2 = false
    private var currentNavMode = NavMode.HOSTS

    private var telemetryJob: Job? = null
    private var telemetryCollector: ServerBoxTelemetryCollector? = null

    private enum class NavMode {
        HOSTS, SERVERBOX, SNIPPETS
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Edge-to-edge full screen for MatePad 12X 3:2 display (Prevents pillarboxing)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupWindowInsets()
        setupNavigation()
        setupHostList()
        setupAccessoryKeybar()
        setupSplitControl()
        startKeepAliveService()

        // Launch initial local PTY session
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
            // Stretch edge-to-edge with system bar padding
            binding.root.setPadding(sysBars.left, sysBars.top, sysBars.right, sysBars.bottom)
            WindowInsetsCompat.CONSUMED
        }
    }

    private fun setupNavigation() {
        binding.btnNavHosts.setOnClickListener { switchNavMode(NavMode.HOSTS) }
        binding.btnNavMonitor.setOnClickListener { switchNavMode(NavMode.SERVERBOX) }
        binding.btnNavSnippets.setOnClickListener { switchNavMode(NavMode.SNIPPETS) }
        binding.btnAddHost.setOnClickListener { showAddHostDialog() }
        binding.btnNewTab.setOnClickListener { showNewSessionPicker() }
    }

    private fun switchNavMode(mode: NavMode) {
        currentNavMode = mode
        val activeBg = getColor(R.color.bg_card)
        val inactiveBg = Color.TRANSPARENT

        binding.btnNavHosts.setBackgroundColor(if (mode == NavMode.HOSTS) activeBg else inactiveBg)
        binding.btnNavMonitor.setBackgroundColor(if (mode == NavMode.SERVERBOX) activeBg else inactiveBg)
        binding.btnNavSnippets.setBackgroundColor(if (mode == NavMode.SNIPPETS) activeBg else inactiveBg)

        when (mode) {
            NavMode.HOSTS -> {
                binding.tvListHeader.text = "SAVED SESSIONS"
                binding.serverBoxHudView.visibility = View.GONE
                binding.terminalSplitLayout.visibility = View.VISIBLE
                setupHostList()
            }
            NavMode.SERVERBOX -> {
                binding.tvListHeader.text = "SELECT SERVER"
                binding.terminalSplitLayout.visibility = View.GONE
                binding.serverBoxHudView.visibility = View.VISIBLE
                setupHostListForMonitoring()
                startServerBoxMonitoring()
            }
            NavMode.SNIPPETS -> {
                binding.tvListHeader.text = "SNIPPET LIBRARY"
                binding.serverBoxHudView.visibility = View.GONE
                binding.terminalSplitLayout.visibility = View.VISIBLE
                setupSnippetList()
            }
        }
    }

    private fun setupHostList() {
        binding.rvHosts.layoutManager = LinearLayoutManager(this)
        val hosts = StorageManager.getHosts()
        binding.rvHosts.adapter = HostAdapter(hosts) { host ->
            openSessionTab(host)
        }
    }

    private fun setupHostListForMonitoring() {
        binding.rvHosts.layoutManager = LinearLayoutManager(this)
        val hosts = StorageManager.getHosts()
        binding.rvHosts.adapter = HostAdapter(hosts) { host ->
            telemetryCollector = ServerBoxTelemetryCollector(host)
            binding.tvServerBoxHostName.text = "Selected Host: ${host.name} (${host.hostname})"
            startServerBoxMonitoring()
        }
    }

    private fun setupSnippetList() {
        binding.rvHosts.layoutManager = LinearLayoutManager(this)
        val snippets = StorageManager.getSnippets()
        binding.rvHosts.adapter = SnippetAdapter(snippets) { snippet ->
            getActiveSession()?.let { session ->
                sendToSession(session, snippet.command + "\n")
                Toast.makeText(this, "Executed: ${snippet.title}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun openSessionTab(host: HostModel) {
        val session = TabSession(host = host)
        tabSessions.add(session)
        activeTabSessionIndex = tabSessions.size - 1
        
        renderTabs()
        connectSession(session)
        renderActiveOutput()
    }

    private fun renderTabs() {
        binding.tabsContainer.removeAllViews()
        for (i in tabSessions.indices) {
            val session = tabSessions[i]
            val tabView = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(24, 8, 24, 8)
                setBackgroundColor(
                    if (i == activeTabSessionIndex) getColor(R.color.bg_primary) else getColor(R.color.bg_secondary)
                )
                
                val title = TextView(this@MainActivity).apply {
                    text = "${session.host.name} "
                    textSize = 12f
                    typeface = Typeface.MONOSPACE
                    setTextColor(
                        if (i == activeTabSessionIndex) getColor(R.color.accent_cyan) else getColor(R.color.text_secondary)
                    )
                }
                addView(title)

                if (tabSessions.size > 1) {
                    val closeBtn = TextView(this@MainActivity).apply {
                        text = " [x]"
                        textSize = 11f
                        setTextColor(getColor(R.color.text_muted))
                        setOnClickListener { closeTab(i) }
                    }
                    addView(closeBtn)
                }

                setOnClickListener {
                    activeTabSessionIndex = i
                    renderTabs()
                    renderActiveOutput()
                }
            }
            binding.tabsContainer.addView(tabView)
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
            renderTabs()
            renderActiveOutput()
        }
    }

    private fun connectSession(session: TabSession) {
        lifecycleScope.launch {
            if (session.host.authType == AuthType.LOCAL_PTY) {
                val welcome = OhMyZshTheme.buildRobbyRussellPrompt("~", "main", true)
                session.outputBuffer.append("MateTerminal-Box [Huawei MatePad 12X Local PTY Engine]\n")
                session.outputBuffer.append("Device: 12.0\" 2800x1840 | 144Hz | HarmonyOS Subshell\n\n")
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
                        renderActiveOutput()
                        listenStream(session, ssh.inputStream)
                    },
                    onError = { err ->
                        session.outputBuffer.append("\nConnection Failed: ${err.message}\n")
                        renderActiveOutput()
                    }
                )
            }
            renderActiveOutput()
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
                        if (tabSessions.indexOf(session) == activeTabSessionIndex) {
                            renderActiveOutput()
                        }
                    }
                }
            } catch (_: Exception) {}
        }
    }

    private fun renderActiveOutput() {
        val session = getActiveSession() ?: return
        val cleanText = session.outputBuffer.toString().replace(Regex("\u001b\\[[0-9;]*[a-zA-Z]"), "")
        binding.tvTerminalOutput1.text = cleanText

        if (isSplitMode1x2 && tabSessions.size > 1) {
            val secondIndex = (activeTabSessionIndex + 1) % tabSessions.size
            val secondSession = tabSessions[secondIndex]
            val secondText = secondSession.outputBuffer.toString().replace(Regex("\u001b\\[[0-9;]*[a-zA-Z]"), "")
            binding.tvTerminalOutput2.text = secondText
        }
    }

    private fun getActiveSession(): TabSession? {
        return tabSessions.getOrNull(activeTabSessionIndex)
    }

    private fun sendToSession(session: TabSession, input: String) {
        if (session.host.authType == AuthType.LOCAL_PTY) {
            session.ptyManager?.write(input)
        } else {
            session.sshManager?.write(input)
        }
    }

    private fun setupAccessoryKeybar() {
        fun sendKey(keyStr: String) {
            getActiveSession()?.let { session ->
                sendToSession(session, keyStr)
            }
        }

        binding.keyEsc.setOnClickListener { sendKey("\u001b") }
        binding.keyTab.setOnClickListener { sendKey("\t") }
        binding.keyCtrl.setOnClickListener { sendKey("\u0003") } // Ctrl+C interrupt
        binding.keyAlt.setOnClickListener { sendKey("\u001b") }
        binding.keyPipe.setOnClickListener { sendKey("|") }
        binding.keyTilde.setOnClickListener { sendKey("~") }
        binding.keySlash.setOnClickListener { sendKey("/") }
        binding.keyHyphen.setOnClickListener { sendKey("-") }
        binding.keyUp.setOnClickListener { sendKey("\u001b[A") }
        binding.keyDown.setOnClickListener { sendKey("\u001b[B") }
        binding.keyLeft.setOnClickListener { sendKey("\u001b[D") }
        binding.keyRight.setOnClickListener { sendKey("\u001b[C") }
    }

    private fun setupSplitControl() {
        binding.btnSplitMode.setOnClickListener {
            isSplitMode1x2 = !isSplitMode1x2
            if (isSplitMode1x2) {
                binding.btnSplitMode.text = "Split 1x1 (Single)"
                binding.paneRight.visibility = View.VISIBLE
                if (tabSessions.size == 1) {
                    // Automatically spawn a secondary local PTY pane if only one exists
                    openSessionTab(StorageManager.getHosts().first())
                }
            } else {
                binding.btnSplitMode.text = "Split 1x2 (Dual)"
                binding.paneRight.visibility = View.GONE
            }
            renderActiveOutput()
        }
    }

    private fun startServerBoxMonitoring() {
        telemetryJob?.cancel()
        if (telemetryCollector == null) {
            val firstHost = StorageManager.getHosts().firstOrNull() ?: return
            telemetryCollector = ServerBoxTelemetryCollector(firstHost)
            binding.tvServerBoxHostName.text = "Selected Host: ${firstHost.name} (${firstHost.hostname})"
        }

        telemetryJob = lifecycleScope.launch {
            while (isActive) {
                val metric = telemetryCollector?.collectTelemetry()
                if (metric != null && currentNavMode == NavMode.SERVERBOX) {
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

    private fun startKeepAliveService() {
        TerminalForegroundService.startService(this, "MateTerminal-Box Active", "Session persistence engaged (3:2 144Hz)")
    }

    private fun showAddHostDialog() {
        val builder = AlertDialog.Builder(this)
        val view = LayoutInflater.from(this).inflate(android.R.layout.simple_list_item_2, null)
        val editContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 20, 40, 20)
        }

        val etLabel = EditText(this).apply { hint = "Label Name (e.g. Production VPS)" }
        val etHost = EditText(this).apply { hint = "Hostname / IP (e.g. 192.168.1.100)" }
        val etPort = EditText(this).apply { hint = "Port (default 22)"; setText("22") }
        val etUser = EditText(this).apply { hint = "Username (e.g. root)"; setText("root") }
        val etPass = EditText(this).apply { hint = "Password or Private Key" }

        editContainer.addView(etLabel)
        editContainer.addView(etHost)
        editContainer.addView(etPort)
        editContainer.addView(etUser)
        editContainer.addView(etPass)

        builder.setTitle("Add SSH Host")
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
                setupHostList()
                Toast.makeText(this, "Host Added: ${newHost.name}", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showNewSessionPicker() {
        val hosts = StorageManager.getHosts()
        val hostNames = hosts.map { "${it.name} [${it.category}]" }.toTypedArray()

        AlertDialog.Builder(this)
            .setTitle("Open New Terminal Tab")
            .setItems(hostNames) { _, which ->
                openSessionTab(hosts[which])
            }
            .show()
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
        holder.tvName.setTextColor(Color.parseColor("#f8fafc"))
        holder.tvName.textSize = 13f

        holder.tvSub.text = "${item.username}@${item.hostname}:${item.port}  [${item.category}]"
        holder.tvSub.setTextColor(Color.parseColor("#94a3b8"))
        holder.tvSub.textSize = 11f

        holder.itemView.setOnClickListener { onSelect(item) }
    }

    override fun getItemCount(): Int = hosts.size
}

class SnippetAdapter(
    private val snippets: List<SnippetModel>,
    private val onSelect: (SnippetModel) -> Unit
) : RecyclerView.Adapter<SnippetAdapter.ViewHolder>() {

    class ViewHolder(val view: View) : RecyclerView.ViewHolder(view) {
        val tvName: TextView = view.findViewById(android.R.id.text1)
        val tvSub: TextView = view.findViewById(android.R.id.text2)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val v = LayoutInflater.from(parent.context).inflate(android.R.layout.simple_list_item_2, parent, false)
        return ViewHolder(v)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = snippets[position]
        holder.tvName.text = item.title
        holder.tvName.setTextColor(Color.parseColor("#38bdf8"))
        holder.tvName.textSize = 13f

        holder.tvSub.text = item.command
        holder.tvSub.setTextColor(Color.parseColor("#94a3b8"))
        holder.tvSub.textSize = 11f
        holder.tvSub.typeface = Typeface.MONOSPACE

        holder.itemView.setOnClickListener { onSelect(item) }
    }

    override fun getItemCount(): Int = snippets.size
}
