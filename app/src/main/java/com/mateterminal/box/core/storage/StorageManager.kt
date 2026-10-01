package com.mateterminal.box.core.storage

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object StorageManager {
    private const val PREFS_NAME = "mateterminal_vault"
    private const val KEY_HOSTS = "saved_hosts"
    private const val KEY_WINDOWS = "saved_windows"
    private const val KEY_SNIPPETS = "saved_snippets"
    private const val KEY_SETTINGS = "app_settings"
    private const val KEY_LOGS_PREFIX = "logs_date_"

    private lateinit var prefs: SharedPreferences
    private val gson = Gson()
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        seedDefaultsIfEmpty()
    }

    fun getTodayDate(): String {
        return dateFormat.format(Date())
    }

    private fun seedDefaultsIfEmpty() {
        if (getHosts().isEmpty()) {
            val defaultHosts = listOf(
                HostModel(
                    id = "demo_vps",
                    name = "Production VPS (Singapore)",
                    hostname = "103.145.22.45",
                    port = 22,
                    username = "ubuntu",
                    authType = AuthType.PASSWORD,
                    colorAccent = "#2091f6",
                    category = "Cloud"
                ),
                HostModel(
                    id = "staging_cluster",
                    name = "Staging Cluster Node",
                    hostname = "192.168.1.120",
                    port = 22,
                    username = "root",
                    authType = AuthType.PASSWORD,
                    colorAccent = "#50fa7b",
                    category = "Staging"
                ),
                HostModel(
                    id = "homelab_pi",
                    name = "HomeLab Raspberry Pi 5",
                    hostname = "192.168.1.150",
                    port = 22,
                    username = "pi",
                    authType = AuthType.PASSWORD,
                    colorAccent = "#f1fa8c",
                    category = "HomeLab"
                )
            )
            saveHosts(defaultHosts)
        }

        if (getSnippets().isEmpty()) {
            val defaultSnippets = listOf(
                SnippetModel(title = "Docker Status", command = "docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'", category = "Docker"),
                SnippetModel(title = "Live Resource Top", command = "htop", category = "Monitoring"),
                SnippetModel(title = "Disk Usage Summary", command = "df -h -x tmpfs -x devtmpfs", category = "System"),
                SnippetModel(title = "Network Open Ports", command = "ss -tulpn | grep LISTEN", category = "Network"),
                SnippetModel(title = "System Info", command = "uname -a && uptime && free -h", category = "System")
            )
            saveSnippets(defaultSnippets)
        }

        // Record initial system boot log
        if (getDailyLogs(getTodayDate()).isEmpty()) {
            logActivity(
                hostId = "system_boot",
                hostName = "Hosts Vault",
                eventType = LogEventType.SESSION_START,
                message = "Termius Hosts Vault initialized on Huawei MatePad 12X"
            )
        }
    }

    // --- HOST MANAGEMENT ---
    fun getHosts(): List<HostModel> {
        val json = prefs.getString(KEY_HOSTS, null) ?: return emptyList()
        val type = object : TypeToken<List<HostModel>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    fun saveHosts(hosts: List<HostModel>) {
        prefs.edit().putString(KEY_HOSTS, gson.toJson(hosts)).apply()
    }

    fun addHost(host: HostModel) {
        val list = getHosts().toMutableList()
        list.removeAll { it.id == host.id }
        list.add(0, host)
        saveHosts(list)
    }

    fun deleteHost(hostId: String) {
        val list = getHosts().filterNot { it.id == hostId }
        saveHosts(list)
    }

    // --- WINDOW & TAB MANAGEMENT ---
    fun getWindows(): List<SessionWindowModel> {
        val json = prefs.getString(KEY_WINDOWS, null) ?: return emptyList()
        val type = object : TypeToken<List<SessionWindowModel>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    fun saveWindows(windows: List<SessionWindowModel>) {
        prefs.edit().putString(KEY_WINDOWS, gson.toJson(windows)).apply()
    }

    fun addWindow(window: SessionWindowModel) {
        val list = getWindows().toMutableList()
        list.removeAll { it.id == window.id }
        list.add(0, window)
        saveWindows(list)
    }

    // --- SNIPPETS ---
    fun getSnippets(): List<SnippetModel> {
        val json = prefs.getString(KEY_SNIPPETS, null) ?: return emptyList()
        val type = object : TypeToken<List<SnippetModel>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    fun saveSnippets(snippets: List<SnippetModel>) {
        prefs.edit().putString(KEY_SNIPPETS, gson.toJson(snippets)).apply()
    }

    fun addSnippet(snippet: SnippetModel) {
        val list = getSnippets().toMutableList()
        list.removeAll { it.id == snippet.id }
        list.add(0, snippet)
        saveSnippets(list)
    }

    // --- SETTINGS ---
    fun getSettings(): AppSettingsModel {
        val json = prefs.getString(KEY_SETTINGS, null) ?: return AppSettingsModel()
        return gson.fromJson(json, AppSettingsModel::class.java) ?: AppSettingsModel()
    }

    fun saveSettings(settings: AppSettingsModel) {
        prefs.edit().putString(KEY_SETTINGS, gson.toJson(settings)).apply()
    }

    // --- LOGGING ---
    fun getDailyLogs(date: String = getTodayDate()): List<ActivityLogEntry> {
        val json = prefs.getString("$KEY_LOGS_PREFIX$date", null) ?: return emptyList()
        val type = object : TypeToken<List<ActivityLogEntry>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    fun logActivity(
        hostId: String,
        hostName: String,
        eventType: LogEventType,
        message: String,
        durationMs: Long = 0
    ) {
        val today = getTodayDate()
        val currentLogs = getDailyLogs(today).toMutableList()
        val newEntry = ActivityLogEntry(
            logDate = today,
            hostId = hostId,
            hostName = hostName,
            eventType = eventType,
            message = message,
            executionDurationMs = durationMs
        )
        currentLogs.add(0, newEntry)
        prefs.edit().putString("$KEY_LOGS_PREFIX$today", gson.toJson(currentLogs)).apply()
    }

    fun markLogsSynced(syncedLogs: List<ActivityLogEntry>) {
        val today = getTodayDate()
        val currentLogs = getDailyLogs(today).toMutableList()
        val syncedIds = syncedLogs.map { it.id }.toSet()

        val updated = currentLogs.map { entry ->
            if (syncedIds.contains(entry.id)) {
                entry.copy(syncStatus = SyncStatus.SYNCED, syncedAt = System.currentTimeMillis())
            } else {
                entry
            }
        }
        prefs.edit().putString("$KEY_LOGS_PREFIX$today", gson.toJson(updated)).apply()
    }
}
