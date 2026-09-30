package com.mateterminal.box.core.storage

import java.util.UUID

enum class AuthType {
    PASSWORD,
    PRIVATE_KEY,
    LOCAL_PTY
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
