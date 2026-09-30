package com.mateterminal.box.core.theme

enum class TerminalTheme(
    val id: String,
    val displayName: String,
    val background: String,
    val foreground: String,
    val cursor: String,
    val black: String,
    val red: String,
    val green: String,
    val yellow: String,
    val blue: String,
    val magenta: String,
    val cyan: String,
    val white: String
) {
    TERMIUS_DARK(
        "termius_dark", "Termius Dark (Default)",
        "#090b10", "#f0f6fc", "#7952ff",
        "#141720", "#ff5252", "#00e676", "#ffb142", "#38bdf8", "#7952ff", "#00d8d6", "#ffffff"
    ),
    TOKYO_NIGHT(
        "tokyo_night", "Tokyo Night",
        "#1a1b26", "#c0caf5", "#7aa2f7",
        "#15161e", "#f7768e", "#9ece6a", "#e0af68", "#7aa2f7", "#bb9af7", "#7dcfff", "#a9b1d6"
    ),
    MONOKAI_PRO(
        "monokai_pro", "Monokai Pro",
        "#2d2a2e", "#fcfcfa", "#ffd866",
        "#403e41", "#ff6188", "#a9dc76", "#ffd866", "#78dce8", "#ab9df2", "#78dce8", "#fcfcfa"
    ),
    CATPPUCCIN_MOCHA(
        "catppuccin", "Catppuccin Mocha",
        "#1e1e2e", "#cdd6f4", "#f5e0dc",
        "#45475a", "#f38ba8", "#a6e3a1", "#f9e2af", "#89b4fa", "#cba6f7", "#94e2d5", "#bac2de"
    )
}

object OhMyZshTheme {
    /**
     * Generates a rich Oh-My-Zsh Powerline styled prompt.
     * Guaranteed 100% zero emoji (uses pure Powerline ASCII / Unicode geometric glyphs).
     */
    fun buildAgnosterPrompt(
        user: String,
        hostname: String,
        currentDir: String,
        gitBranch: String? = null,
        exitCode: Int = 0
    ): String {
        val userSegment = "\u001b[44m\u001b[37m $user@$hostname \u001b[0m"
        val pathSegment = "\u001b[46m\u001b[30m \ue0a0 $currentDir \u001b[0m"
        val gitSegment = if (gitBranch != null) {
            "\u001b[42m\u001b[30m \ue0a0 $gitBranch \u001b[0m"
        } else ""
        val statusSegment = if (exitCode != 0) {
            "\u001b[41m\u001b[37m ERR:$exitCode \u001b[0m"
        } else {
            "\u001b[32m\u276f\u001b[0m"
        }

        return "$userSegment$pathSegment$gitSegment $statusSegment "
    }

    fun buildRobbyRussellPrompt(
        currentDir: String,
        gitBranch: String? = null,
        isSuccess: Boolean = true
    ): String {
        val arrow = if (isSuccess) "\u001b[32m\u279c\u001b[0m" else "\u001b[31m\u279c\u001b[0m"
        val dir = "\u001b[36m$currentDir\u001b[0m"
        val git = if (gitBranch != null) " \u001b[34mgit:(\u001b[31m$gitBranch\u001b[34m)\u001b[0m" else ""
        return "$arrow  $dir$git \u001b[32m\u276f\u001b[0m "
    }
}
