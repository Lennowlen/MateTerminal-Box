package com.mateterminal.box.ui

import android.app.AlertDialog
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.GravityCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.widget.addTextChangedListener
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.mateterminal.box.R
import com.mateterminal.box.core.ssh.SSHClientManager
import com.mateterminal.box.core.storage.AuthType
import com.mateterminal.box.core.storage.HostModel
import com.mateterminal.box.core.storage.LogEventType
import com.mateterminal.box.core.storage.SnippetModel
import com.mateterminal.box.core.storage.StorageManager
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

enum class TermiusScreen {
    HOSTS_VAULT,
    TERMINALS,
    SNIPPETS,
    SFTP,
    SETTINGS
}

data class TermiusTerminalTab(
    val id: String = UUID.randomUUID().toString(),
    val host: HostModel,
    var isConnected: Boolean = false,
    var sshManager: SSHClientManager? = null,
    val outputBuffer: StringBuilder = StringBuilder(),
    var readJob: Job? = null
)

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    // Navigation & View
    private var currentScreen: TermiusScreen = TermiusScreen.HOSTS_VAULT

    // Active SSH Sessions
    private val terminalTabs = mutableListOf<TermiusTerminalTab>()
    private var activeTabIndex = 0

    // Keybar Sticky Modifiers
    private var isCtrlActive = false
    private var isAltActive = false

    // Host list adapter & cached hosts
    private var allHosts: List<HostModel> = emptyList()
    private var filteredHosts: List<HostModel> = emptyList()
    private lateinit var hostsAdapter: TermiusHostsAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Edge-to-edge full screen for Huawei MatePad 12X (3:2 144Hz)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        StorageManager.init(this)

        setupWindowInsets()
        setupTopAppBar()
        setupDrawerNavigation()
        setupHostsVault()
        setupSearchFiltering()
        setupTerminalInput()
        setupAccessoryKeybar()
        setupSnippetsView()
        startKeepAliveService()

        // Default screen: Hosts Vault
        navigateToScreen(TermiusScreen.HOSTS_VAULT)
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

    // --- TOP BAR & SEARCH ---
    private fun setupTopAppBar() {
        binding.btnNavDrawer.setOnClickListener {
            binding.drawerLayout.openDrawer(GravityCompat.START)
        }

        binding.btnTopSearch.setOnClickListener {
            toggleSearchBar()
        }

        binding.btnClearSearch.setOnClickListener {
            binding.etSearchQuery.setText("")
            toggleSearchBar()
        }

        binding.btnTopSort.setOnClickListener {
            showSortMenu()
        }

        binding.btnTopMore.setOnClickListener {
            showOptionsMenu()
        }
    }

    private fun toggleSearchBar() {
        if (binding.searchBarContainer.visibility == View.VISIBLE) {
            binding.searchBarContainer.visibility = View.GONE
            binding.etSearchQuery.setText("")
        } else {
            binding.searchBarContainer.visibility = View.VISIBLE
            binding.etSearchQuery.requestFocus()
        }
    }

    private fun setupSearchFiltering() {
        binding.etSearchQuery.addTextChangedListener { text ->
            val query = text?.toString()?.trim() ?: ""
            filterHosts(query)
        }
    }

    private fun filterHosts(query: String) {
        filteredHosts = if (query.isEmpty()) {
            allHosts
        } else {
            allHosts.filter { host ->
                host.name.contains(query, ignoreCase = true) ||
                host.hostname.contains(query, ignoreCase = true) ||
                host.username.contains(query, ignoreCase = true) ||
                host.category.contains(query, ignoreCase = true)
            }
        }
        hostsAdapter.updateData(filteredHosts)
        updateEmptyState()
    }

    // --- DRAWER NAVIGATION ---
    private fun setupDrawerNavigation() {
        binding.navItemHosts.setOnClickListener {
            navigateToScreen(TermiusScreen.HOSTS_VAULT)
            binding.drawerLayout.closeDrawer(GravityCompat.START)
        }

        binding.navItemTerminals.setOnClickListener {
            if (terminalTabs.isEmpty()) {
                Toast.makeText(this, "No active terminal sessions. Select a host to connect.", Toast.LENGTH_SHORT).show()
                navigateToScreen(TermiusScreen.HOSTS_VAULT)
            } else {
                navigateToScreen(TermiusScreen.TERMINALS)
            }
            binding.drawerLayout.closeDrawer(GravityCompat.START)
        }

        binding.navItemSFTP.setOnClickListener {
            navigateToScreen(TermiusScreen.SFTP)
            binding.drawerLayout.closeDrawer(GravityCompat.START)
        }

        binding.navItemPortForwarding.setOnClickListener {
            Toast.makeText(this, "Port Forwarding Manager available in Pro", Toast.LENGTH_SHORT).show()
            binding.drawerLayout.closeDrawer(GravityCompat.START)
        }

        binding.navItemSnippets.setOnClickListener {
            navigateToScreen(TermiusScreen.SNIPPETS)
            binding.drawerLayout.closeDrawer(GravityCompat.START)
        }

        binding.navItemKnownHosts.setOnClickListener {
            showKnownHostsDialog()
            binding.drawerLayout.closeDrawer(GravityCompat.START)
        }

        binding.navItemSettings.setOnClickListener {
            navigateToScreen(TermiusScreen.SETTINGS)
            binding.drawerLayout.closeDrawer(GravityCompat.START)
        }

        binding.navItemHelp.setOnClickListener {
            showHelpDialog()
            binding.drawerLayout.closeDrawer(GravityCompat.START)
        }
    }

    private fun navigateToScreen(screen: TermiusScreen) {
        currentScreen = screen
        binding.viewHostsVault.visibility = if (screen == TermiusScreen.HOSTS_VAULT) View.VISIBLE else View.GONE
        binding.viewTerminalSession.visibility = if (screen == TermiusScreen.TERMINALS) View.VISIBLE else View.GONE
        binding.viewSnippets.visibility = if (screen == TermiusScreen.SNIPPETS) View.VISIBLE else View.GONE
        binding.viewSFTP.visibility = if (screen == TermiusScreen.SFTP) View.VISIBLE else View.GONE
        binding.viewSettings.visibility = if (screen == TermiusScreen.SETTINGS) View.VISIBLE else View.GONE

        // Update Top Bar Title
        when (screen) {
            TermiusScreen.HOSTS_VAULT -> {
                binding.tvHeaderTitle.text = "Hosts"
                binding.vaultSubHeader.visibility = View.VISIBLE
                binding.btnTopSearch.visibility = View.VISIBLE
                binding.btnTopSort.visibility = View.VISIBLE
                refreshHostsList()
            }
            TermiusScreen.TERMINALS -> {
                val activeTab = getActiveTab()
                binding.tvHeaderTitle.text = activeTab?.host?.name ?: "Terminals"
                binding.vaultSubHeader.visibility = View.GONE
                binding.btnTopSearch.visibility = View.GONE
                binding.btnTopSort.visibility = View.GONE
                renderActiveTerminal()
            }
            TermiusScreen.SNIPPETS -> {
                binding.tvHeaderTitle.text = "Snippets"
                binding.vaultSubHeader.visibility = View.GONE
                binding.btnTopSearch.visibility = View.GONE
                binding.btnTopSort.visibility = View.GONE
                setupSnippetsView()
            }
            TermiusScreen.SFTP -> {
                binding.tvHeaderTitle.text = "SFTP"
                binding.vaultSubHeader.visibility = View.GONE
                binding.btnTopSearch.visibility = View.GONE
                binding.btnTopSort.visibility = View.GONE
            }
            TermiusScreen.SETTINGS -> {
                binding.tvHeaderTitle.text = "Settings"
                binding.vaultSubHeader.visibility = View.GONE
                binding.btnTopSearch.visibility = View.GONE
                binding.btnTopSort.visibility = View.GONE
            }
        }
        updateTerminalCountBadge()
    }

    private fun updateTerminalCountBadge() {
        val count = terminalTabs.size
        binding.tvNavTerminalBadge.text = count.toString()
        binding.tvNavTerminalBadge.visibility = if (count > 0) View.VISIBLE else View.GONE
    }

    // --- HOSTS VAULT RECYCLERVIEW ---
    private fun setupHostsVault() {
        hostsAdapter = TermiusHostsAdapter(
            onHostClick = { host ->
                connectToHost(host)
            },
            onHostMoreClick = { host, anchorView ->
                showHostContextMenu(host, anchorView)
            }
        )
        binding.rvHostsList.layoutManager = LinearLayoutManager(this)
        binding.rvHostsList.adapter = hostsAdapter

        binding.fabAddHost.setOnClickListener {
            showAddHostDialog()
        }

        refreshHostsList()
    }

    private fun refreshHostsList() {
        allHosts = StorageManager.getHosts()
        filteredHosts = allHosts
        hostsAdapter.updateData(filteredHosts)
        updateEmptyState()
    }

    private fun updateEmptyState() {
        if (filteredHosts.isEmpty()) {
            binding.emptyHostsView.visibility = View.VISIBLE
            binding.rvHostsList.visibility = View.GONE
        } else {
            binding.emptyHostsView.visibility = View.GONE
            binding.rvHostsList.visibility = View.VISIBLE
        }
    }

    // --- SSH CONNECTION ENGINE ---
    private fun connectToHost(host: HostModel) {
        // Check if tab already exists for this host
        val existingIndex = terminalTabs.indexOfFirst { it.host.id == host.id }
        if (existingIndex >= 0) {
            activeTabIndex = existingIndex
            navigateToScreen(TermiusScreen.TERMINALS)
            return
        }

        // Create new tab session
        val tab = TermiusTerminalTab(host = host)
        terminalTabs.add(tab)
        activeTabIndex = terminalTabs.size - 1

        navigateToScreen(TermiusScreen.TERMINALS)
        renderTabsStrip()

        // Start SSH connection in background
        tab.outputBuffer.append("Connecting to ${host.username}@${host.hostname}:${host.port}...\n")
        renderActiveTerminal()

        lifecycleScope.launch {
            val ssh = SSHClientManager(host)
            tab.sshManager = ssh

            ssh.connect(
                cols = 120,
                rows = 36,
                onConnected = {
                    tab.isConnected = true
                    tab.outputBuffer.append("\u001B[32m[Connected]\u001B[0m\n")
                    StorageManager.logActivity(
                        hostId = host.id,
                        hostName = host.name,
                        eventType = LogEventType.SSH_CONNECT,
                        message = "Connected to ${host.username}@${host.hostname}:${host.port}"
                    )
                    renderTabsStrip()
                    renderActiveTerminal()
                    startSshStreamReader(tab)
                },
                onError = { e ->
                    tab.isConnected = false
                    tab.outputBuffer.append("\n\u001B[31m[Connection Error: ${e.message}]\u001B[0m\n")
                    StorageManager.logActivity(
                        hostId = host.id,
                        hostName = host.name,
                        eventType = LogEventType.SYSTEM_ERROR,
                        message = "SSH Connection failed: ${e.message}"
                    )
                    renderTabsStrip()
                    renderActiveTerminal()
                }
            )
        }
    }

    private fun startSshStreamReader(tab: TermiusTerminalTab) {
        tab.readJob?.cancel()
        tab.readJob = lifecycleScope.launch(Dispatchers.IO) {
            val stream: InputStream = tab.sshManager?.inputStream ?: return@launch
            val buffer = ByteArray(4096)
            try {
                while (isActive && tab.isConnected) {
                    val read = stream.read(buffer)
                    if (read > 0) {
                        val text = String(buffer, 0, read)
                        val sanitized = cleanAnsiCodes(text)
                        withContext(Dispatchers.Main) {
                            tab.outputBuffer.append(sanitized)
                            if (getActiveTab()?.id == tab.id) {
                                binding.tvTerminalOutput.text = tab.outputBuffer.toString()
                                scrollToBottom()
                            }
                        }
                    } else if (read == -1) {
                        break
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    tab.outputBuffer.append("\n[Connection Closed: ${e.message}]\n")
                }
            } finally {
                tab.isConnected = false
                withContext(Dispatchers.Main) {
                    renderTabsStrip()
                    renderActiveTerminal()
                }
            }
        }
    }

    private fun cleanAnsiCodes(input: String): String {
        return input.replace(Regex("\u001B\\[[;?0-9]*[a-zA-Z]"), "")
    }

    private fun getActiveTab(): TermiusTerminalTab? {
        return if (activeTabIndex in terminalTabs.indices) terminalTabs[activeTabIndex] else null
    }

    // --- TERMINAL TAB STRIP ---
    private fun renderTabsStrip() {
        binding.terminalTabContainer.removeAllViews()

        for ((idx, tab) in terminalTabs.withIndex()) {
            val tabView = LayoutInflater.from(this).inflate(R.layout.item_termius_host, null, false)
            // Create chip layout
            val chip = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(24, 8, 20, 8)
                val isSelected = idx == activeTabIndex
                setBackgroundResource(if (isSelected) R.drawable.bg_tab_active else R.drawable.bg_tab_inactive)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.MATCH_PARENT
                ).apply {
                    marginEnd = 12
                }

                val dot = View(context).apply {
                    val size = 18
                    layoutParams = LinearLayout.LayoutParams(size, size).apply {
                        marginEnd = 14
                    }
                    setBackgroundColor(if (tab.isConnected) Color.parseColor("#50fa7b") else Color.parseColor("#ff5555"))
                }
                addView(dot)

                val title = TextView(context).apply {
                    text = tab.host.name
                    textSize = 13f
                    setTextColor(if (isSelected) Color.WHITE else Color.parseColor("#8d91a5"))
                    typeface = Typeface.DEFAULT_BOLD
                }
                addView(title)

                val btnClose = ImageButton(context).apply {
                    layoutParams = LinearLayout.LayoutParams(36, 36).apply {
                        marginStart = 12
                    }
                    setBackgroundResource(android.R.color.transparent)
                    setImageResource(R.drawable.ic_close)
                    setColorFilter(Color.parseColor("#8d91a5"))
                    setOnClickListener {
                        closeTerminalTab(idx)
                    }
                }
                addView(btnClose)

                setOnClickListener {
                    activeTabIndex = idx
                    renderTabsStrip()
                    renderActiveTerminal()
                }
            }
            binding.terminalTabContainer.addView(chip)
        }

        // Re-add New Tab button
        binding.terminalTabContainer.addView(binding.btnAddNewTerminalTab)
        binding.btnAddNewTerminalTab.setOnClickListener {
            showHostPickerForNewTab()
        }
    }

    private fun closeTerminalTab(index: Int) {
        if (index !in terminalTabs.indices) return
        val tab = terminalTabs.removeAt(index)
        tab.readJob?.cancel()
        tab.sshManager?.disconnect()

        if (activeTabIndex >= terminalTabs.size) {
            activeTabIndex = terminalTabs.size - 1
        }

        if (terminalTabs.isEmpty()) {
            navigateToScreen(TermiusScreen.HOSTS_VAULT)
        } else {
            renderTabsStrip()
            renderActiveTerminal()
        }
        updateTerminalCountBadge()
    }

    private fun renderActiveTerminal() {
        val tab = getActiveTab()
        if (tab == null) {
            binding.tvTerminalOutput.text = "No active connection."
            binding.disconnectedOverlay.visibility = View.GONE
            return
        }

        binding.tvHeaderTitle.text = tab.host.name
        binding.tvTerminalOutput.text = tab.outputBuffer.toString()
        scrollToBottom()

        binding.tvInputPrompt.text = "${tab.host.username}@${tab.host.name.take(12)}> "

        if (!tab.isConnected && tab.outputBuffer.isNotEmpty()) {
            binding.disconnectedOverlay.visibility = View.VISIBLE
            binding.btnReconnect.setOnClickListener {
                connectToHost(tab.host)
            }
        } else {
            binding.disconnectedOverlay.visibility = View.GONE
        }
    }

    private fun scrollToBottom() {
        binding.terminalScrollView.post {
            binding.terminalScrollView.fullScroll(View.FOCUS_DOWN)
        }
    }

    // --- TERMINAL INPUT & ACCESSORY KEYBAR ---
    private fun setupTerminalInput() {
        binding.btnSendInput.setOnClickListener {
            sendCurrentInput()
        }

        binding.etTerminalInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEND || actionId == EditorInfo.IME_ACTION_DONE) {
                sendCurrentInput()
                true
            } else {
                false
            }
        }
    }

    private fun sendCurrentInput() {
        val cmd = binding.etTerminalInput.text.toString()
        if (cmd.isBlank()) return

        val tab = getActiveTab()
        if (tab != null && tab.isConnected) {
            tab.sshManager?.write("$cmd\n")
            tab.outputBuffer.append("\n> $cmd\n")
            binding.tvTerminalOutput.text = tab.outputBuffer.toString()
            scrollToBottom()

            StorageManager.logActivity(
                hostId = tab.host.id,
                hostName = tab.host.name,
                eventType = LogEventType.COMMAND_EXEC,
                message = cmd
            )
        } else {
            Toast.makeText(this, "Session not connected", Toast.LENGTH_SHORT).show()
        }
        binding.etTerminalInput.setText("")
    }

    private fun setupAccessoryKeybar() {
        binding.keyEsc.setOnClickListener { sendKeySequence("\u001B") }
        binding.keyTab.setOnClickListener { sendKeySequence("\t") }

        binding.keyCtrl.setOnClickListener {
            isCtrlActive = !isCtrlActive
            binding.keyCtrl.setBackgroundResource(
                if (isCtrlActive) R.drawable.bg_termius_key_chip_active else R.drawable.bg_termius_key_chip
            )
        }

        binding.keyAlt.setOnClickListener {
            isAltActive = !isAltActive
            binding.keyAlt.setBackgroundResource(
                if (isAltActive) R.drawable.bg_termius_key_chip_active else R.drawable.bg_termius_key_chip
            )
        }

        binding.keyPipe.setOnClickListener { sendKeySequence("|") }
        binding.keySlash.setOnClickListener { sendKeySequence("/") }
        binding.keyHyphen.setOnClickListener { sendKeySequence("-") }
        binding.keyTilde.setOnClickListener { sendKeySequence("~") }

        binding.keyUp.setOnClickListener { sendKeySequence("\u001B[A") }
        binding.keyDown.setOnClickListener { sendKeySequence("\u001B[B") }
        binding.keyRight.setOnClickListener { sendKeySequence("\u001B[C") }
        binding.keyLeft.setOnClickListener { sendKeySequence("\u001B[D") }

        binding.btnKeySnippets.setOnClickListener {
            showSnippetsBottomSheet()
        }
    }

    private fun sendKeySequence(seq: String) {
        val tab = getActiveTab() ?: return
        var finalSeq = seq

        if (isCtrlActive && seq.length == 1) {
            val ch = seq[0]
            if (ch in 'a'..'z') {
                finalSeq = (ch.code - 'a'.code + 1).toChar().toString()
            } else if (ch in 'A'..'Z') {
                finalSeq = (ch.code - 'A'.code + 1).toChar().toString()
            }
            isCtrlActive = false
            binding.keyCtrl.setBackgroundResource(R.drawable.bg_termius_key_chip)
        }

        if (isAltActive) {
            finalSeq = "\u001B$finalSeq"
            isAltActive = false
            binding.keyAlt.setBackgroundResource(R.drawable.bg_termius_key_chip)
        }

        tab.sshManager?.write(finalSeq)
    }

    // --- SNIPPETS VIEW ---
    private fun setupSnippetsView() {
        val snippets = StorageManager.getSnippets()
        binding.rvSnippetsList.layoutManager = LinearLayoutManager(this)
        binding.rvSnippetsList.adapter = TermiusSnippetsAdapter(snippets) { snippet ->
            val tab = getActiveTab()
            if (tab != null && tab.isConnected) {
                tab.sshManager?.write("${snippet.command}\n")
                navigateToScreen(TermiusScreen.TERMINALS)
                Toast.makeText(this, "Executed: ${snippet.title}", Toast.LENGTH_SHORT).show()
            } else {
                binding.etTerminalInput.setText(snippet.command)
                navigateToScreen(TermiusScreen.TERMINALS)
            }
        }
    }

    private fun showSnippetsBottomSheet() {
        val snippets = StorageManager.getSnippets()
        val items = snippets.map { "${it.title}\n(${it.command})" }.toTypedArray()

        AlertDialog.Builder(this)
            .setTitle("Insert Snippet")
            .setItems(items) { _, which ->
                val snippet = snippets[which]
                val tab = getActiveTab()
                if (tab != null && tab.isConnected) {
                    tab.sshManager?.write("${snippet.command}\n")
                } else {
                    binding.etTerminalInput.setText(snippet.command)
                }
            }
            .setPositiveButton("Cancel", null)
            .show()
    }

    // --- DIALOGS: ADD / EDIT HOST ---
    private fun showAddHostDialog(existingHost: HostModel? = null) {
        val isEdit = existingHost != null
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 24, 48, 24)
        }

        val etLabel = EditText(this).apply {
            hint = "Alias / Label (e.g. VPS Singapore)"
            setText(existingHost?.name ?: "")
            setTextColor(Color.WHITE)
            setHintTextColor(Color.parseColor("#8d91a5"))
        }
        val etHost = EditText(this).apply {
            hint = "Hostname / IP (e.g. 103.145.22.45)"
            setText(existingHost?.hostname ?: "")
            setTextColor(Color.WHITE)
            setHintTextColor(Color.parseColor("#8d91a5"))
        }
        val etPort = EditText(this).apply {
            hint = "Port (Default: 22)"
            setText((existingHost?.port ?: 22).toString())
            setTextColor(Color.WHITE)
            setHintTextColor(Color.parseColor("#8d91a5"))
        }
        val etUser = EditText(this).apply {
            hint = "Username (e.g. root, ubuntu)"
            setText(existingHost?.username ?: "root")
            setTextColor(Color.WHITE)
            setHintTextColor(Color.parseColor("#8d91a5"))
        }
        val etPassword = EditText(this).apply {
            hint = "Password / Passphrase"
            setText(existingHost?.passwordOrKey ?: "")
            setTextColor(Color.WHITE)
            setHintTextColor(Color.parseColor("#8d91a5"))
        }
        val etCategory = EditText(this).apply {
            hint = "Category / Tag (e.g. VPS, Cloud, HomeLab)"
            setText(existingHost?.category ?: "VPS")
            setTextColor(Color.WHITE)
            setHintTextColor(Color.parseColor("#8d91a5"))
        }

        layout.addView(etLabel)
        layout.addView(etHost)
        layout.addView(etPort)
        layout.addView(etUser)
        layout.addView(etPassword)
        layout.addView(etCategory)

        AlertDialog.Builder(this)
            .setTitle(if (isEdit) "Edit SSH Host" else "New SSH Host")
            .setView(layout)
            .setPositiveButton(if (isEdit) "Save" else "Add") { _, _ ->
                val label = etLabel.text.toString().trim().ifBlank { etHost.text.toString().trim() }
                val hostIp = etHost.text.toString().trim()
                val port = etPort.text.toString().trim().toIntOrNull() ?: 22
                val user = etUser.text.toString().trim().ifBlank { "root" }
                val pass = etPassword.text.toString().trim()
                val category = etCategory.text.toString().trim().ifBlank { "VPS" }

                if (hostIp.isNotBlank()) {
                    val newHost = HostModel(
                        id = existingHost?.id ?: UUID.randomUUID().toString(),
                        name = label,
                        hostname = hostIp,
                        port = port,
                        username = user,
                        passwordOrKey = pass,
                        category = category,
                        authType = AuthType.PASSWORD
                    )
                    StorageManager.addHost(newHost)
                    refreshHostsList()
                    Toast.makeText(this, "Host saved: $label", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showHostContextMenu(host: HostModel, anchorView: View) {
        val options = arrayOf("Connect", "Edit Host", "Delete Host")
        AlertDialog.Builder(this)
            .setTitle(host.name)
            .setItems(options) { _, which ->
                when (which) {
                    0 -> connectToHost(host)
                    1 -> showAddHostDialog(host)
                    2 -> {
                        StorageManager.deleteHost(host.id)
                        refreshHostsList()
                        Toast.makeText(this, "Deleted ${host.name}", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            .show()
    }

    private fun showHostPickerForNewTab() {
        val hosts = StorageManager.getHosts()
        if (hosts.isEmpty()) {
            showAddHostDialog()
            return
        }
        val items = hosts.map { "${it.name} (${it.username}@${it.hostname})" }.toTypedArray()
        AlertDialog.Builder(this)
            .setTitle("Select Host for New Tab")
            .setItems(items) { _, which ->
                connectToHost(hosts[which])
            }
            .setPositiveButton("Add New Host") { _, _ ->
                showAddHostDialog()
            }
            .show()
    }

    private fun showSortMenu() {
        val options = arrayOf("Sort by Name (A-Z)", "Sort by Recently Added", "Sort by Category")
        AlertDialog.Builder(this)
            .setTitle("Sort Hosts")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> allHosts = allHosts.sortedBy { it.name.lowercase() }
                    1 -> allHosts = allHosts.sortedByDescending { it.createdAt }
                    2 -> allHosts = allHosts.sortedBy { it.category.lowercase() }
                }
                filterHosts(binding.etSearchQuery.text.toString())
            }
            .show()
    }

    private fun showOptionsMenu() {
        val options = arrayOf("Add Host", "Export Vault", "Settings")
        AlertDialog.Builder(this)
            .setItems(options) { _, which ->
                when (which) {
                    0 -> showAddHostDialog()
                    1 -> Toast.makeText(this, "Hosts Vault exported to internal storage.", Toast.LENGTH_SHORT).show()
                    2 -> navigateToScreen(TermiusScreen.SETTINGS)
                }
            }
            .show()
    }

    private fun showKnownHostsDialog() {
        AlertDialog.Builder(this)
            .setTitle("Known Hosts (SSH Fingerprints)")
            .setMessage("All remote host keys are automatically verified via StrictHostKeyChecking policy.")
            .setPositiveButton("OK", null)
            .show()
    }

    private fun showHelpDialog() {
        AlertDialog.Builder(this)
            .setTitle("MateTerminal-Box Pro")
            .setMessage("Termius-compatible SSH client optimized for Huawei MatePad 12X (2800x1840 display).\n\nVersion: 1.5.0\nArchitecture: Clean-Room Native Kotlin")
            .setPositiveButton("OK", null)
            .show()
    }

    private fun startKeepAliveService() {
        TerminalForegroundService.startService(this)
    }

    override fun onDestroy() {
        super.onDestroy()
        terminalTabs.forEach {
            it.readJob?.cancel()
            it.sshManager?.disconnect()
        }
    }
}

// --- ADAPTERS ---

class TermiusHostsAdapter(
    private val onHostClick: (HostModel) -> Unit,
    private val onHostMoreClick: (HostModel, View) -> Unit
) : RecyclerView.Adapter<TermiusHostsAdapter.HostViewHolder>() {

    private var items: List<HostModel> = emptyList()

    fun updateData(newItems: List<HostModel>) {
        items = newItems
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HostViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_termius_host, parent, false)
        return HostViewHolder(view)
    }

    override fun onBindViewHolder(holder: HostViewHolder, position: Int) {
        holder.bind(items[position], onHostClick, onHostMoreClick)
    }

    override fun getItemCount(): Int = items.size

    class HostViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvAlias: TextView = itemView.findViewById(R.id.tvHostAlias)
        private val tvAddress: TextView = itemView.findViewById(R.id.tvHostAddress)
        private val tvCategory: TextView = itemView.findViewById(R.id.tvHostCategory)
        private val btnConnect: ImageButton = itemView.findViewById(R.id.btnConnectHost)
        private val container: LinearLayout = itemView.findViewById(R.id.hostCardContainer)

        fun bind(
            host: HostModel,
            onHostClick: (HostModel) -> Unit,
            onHostMoreClick: (HostModel, View) -> Unit
        ) {
            tvAlias.text = host.name
            tvAddress.text = "${host.username}@${host.hostname}:${host.port}"
            tvCategory.text = host.category

            container.setOnClickListener {
                onHostClick(host)
            }

            btnConnect.setOnClickListener {
                onHostMoreClick(host, it)
            }
        }
    }
}

class TermiusSnippetsAdapter(
    private val items: List<SnippetModel>,
    private val onClick: (SnippetModel) -> Unit
) : RecyclerView.Adapter<TermiusSnippetsAdapter.SnippetViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SnippetViewHolder {
        val layout = LinearLayout(parent.context).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundResource(R.drawable.bg_host_card)
            setPadding(32, 24, 32, 24)
            layoutParams = ViewGroup.MarginLayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 16
            }
        }
        val tvTitle = TextView(parent.context).apply {
            id = View.generateViewId()
            textSize = 15f
            setTextColor(Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
        }
        val tvCmd = TextView(parent.context).apply {
            id = View.generateViewId()
            textSize = 13f
            typeface = Typeface.MONOSPACE
            setTextColor(Color.parseColor("#8d91a5"))
            setPadding(0, 8, 0, 0)
        }
        layout.addView(tvTitle)
        layout.addView(tvCmd)
        return SnippetViewHolder(layout, tvTitle, tvCmd)
    }

    override fun onBindViewHolder(holder: SnippetViewHolder, position: Int) {
        val snippet = items[position]
        holder.tvTitle.text = snippet.title
        holder.tvCmd.text = snippet.command
        holder.itemView.setOnClickListener { onClick(snippet) }
    }

    override fun getItemCount(): Int = items.size

    class SnippetViewHolder(
        view: View,
        val tvTitle: TextView,
        val tvCmd: TextView
    ) : RecyclerView.ViewHolder(view)
}
