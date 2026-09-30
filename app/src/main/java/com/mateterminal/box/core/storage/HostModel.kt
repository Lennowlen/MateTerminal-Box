package com.mateterminal.box.core.storage

import java.util.UUID

enum class AuthType {
    PASSWORD,
    PRIVATE_KEY,
    LOCAL_PTY
}

enum class LogEventType {
    SESSION_START,
    SESSION_END,
    COMMAND_EXEC,
    SSH_CONNECT,
    SSH_DISCONNECT,
    TELEMETRY_ALERT,
    SYSTEM_ERROR
}

enum class SyncStatus {
    PENDING,
    SYNCED,
    FAILED
}

data class HostModel(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val hostname: String,
    val port: Int = 22,
    val username: String = "root",
    val authType: AuthType = AuthType.PASSWORD,
    val passwordOrKey: String = "",
    val workingDirectory: String = "~",
    val colorAccent: String = "#38bdf8",
    val category: String = "VPS",
    val startupScript: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

data class SessionWindowModel(
    val id: String = UUID.randomUUID().toString(),
    val workspaceName: String = "Default Workspace",
    val splitLayoutType: String = "SINGLE", // SINGLE, DUAL_H, DUAL_V, QUAD
    val activeTabIndex: Int = 0,
    val hostIds: List<String> = emptyList(),
    val createdAt: Long = System.currentTimeMillis()
)

data class SnippetModel(
    val id: String = UUID.randomUUID().toString(),
    val title: String,
    val command: String,
    val category: String = "DevOps"
)

data class ActivityLogEntry(
    val id: String = UUID.randomUUID().toString(),
    val timestamp: Long = System.currentTimeMillis(),
    val logDate: String, // Format: YYYY-MM-DD
    val hostId: String,
    val hostName: String,
    val eventType: LogEventType,
    val message: String,
    val executionDurationMs: Long = 0,
    var syncStatus: SyncStatus = SyncStatus.PENDING,
    var syncedAt: Long? = null
)

data class AppSettingsModel(
    val enableServerBoxHUD: Boolean = true,
    val sidebarMode: String = "COLLAPSIBLE", // FIXED, COLLAPSIBLE, AUTO_HIDE
    val activeTheme: String = "TOKYO_NIGHT",
    val terminalFontSize: Int = 14,
    val keepaliveForegroundService: Boolean = true,
    val rannLabsServerEndpoint: String = "https://api.rann-labs.com/v1/logs/sync",
    val rannLabsApiKey: String = "",
    val autoSyncLogsToServer: Boolean = true,
    val logRetentionDays: Int = 30
)
