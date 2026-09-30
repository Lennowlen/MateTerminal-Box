package com.mateterminal.box.core.monitor

import com.jcraft.jsch.ChannelExec
import com.jcraft.jsch.JSch
import com.jcraft.jsch.Session
import com.mateterminal.box.core.storage.AuthType
import com.mateterminal.box.core.storage.HostModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.Properties

class ServerBoxTelemetryCollector(private val host: HostModel) {

    private var prevTotalCpu = 0L
    private var prevIdleCpu = 0L
    private var prevRxBytes = 0L
    private var prevTxBytes = 0L
    private var prevTimeMs = 0L

    suspend fun collectTelemetry(): ServerTelemetry = withContext(Dispatchers.IO) {
        if (host.authType == AuthType.LOCAL_PTY) {
            return@withContext collectLocalTelemetry()
        }

        try {
            val jsch = JSch()
            if (host.passwordOrKey.isNotBlank() && host.passwordOrKey.contains("BEGIN PRIVATE KEY")) {
                jsch.addIdentity("key", host.passwordOrKey.toByteArray(), null, null)
            }

            val session: Session = jsch.getSession(host.username, host.hostname, host.port).apply {
                if (host.passwordOrKey.isNotBlank() && !host.passwordOrKey.contains("BEGIN PRIVATE KEY")) {
                    setPassword(host.passwordOrKey)
                }
                val config = Properties().apply {
                    put("StrictHostKeyChecking", "no")
                }
                setConfig(config)
                timeout = 4000
                connect()
            }

            // High efficiency batch payload
            val script = """
                cat /proc/stat | grep '^cpu'
                echo '===MEM==='
                cat /proc/meminfo | head -15
                echo '===NET==='
                cat /proc/net/dev
                echo '===DF==='
                df -k -x tmpfs -x devtmpfs -x overlay 2>/dev/null | tail -n +2
                echo '===UPTIME==='
                uptime
                echo '===DOCKER==='
                docker ps --format '{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}' 2>/dev/null || echo ''
            """.trimIndent()

            val channel = session.openChannel("exec") as ChannelExec
            channel.setCommand(script)
            val reader = BufferedReader(InputStreamReader(channel.inputStream))
            channel.connect(4000)

            val rawOutput = reader.readText()
            channel.disconnect()
            session.disconnect()

            parseTelemetryPayload(rawOutput)
        } catch (e: Exception) {
            ServerTelemetry(
                hostId = host.id,
                hostName = host.name,
                isOnline = false,
                osInfo = "Connection Error: ${e.localizedMessage ?: "Timeout"}"
            )
        }
    }

    private fun collectLocalTelemetry(): ServerTelemetry {
        // Collect Android device procfs
        try {
            val statFile = java.io.File("/proc/stat")
            val memFile = java.io.File("/proc/meminfo")
            val cpuUsage = parseLocalCpu(statFile)
            val mem = parseLocalMem(memFile)

            return ServerTelemetry(
                hostId = host.id,
                hostName = host.name,
                isOnline = true,
                cpuTotalPercent = cpuUsage,
                memTotalMb = mem.first,
                memUsedMb = mem.second,
                memFreeMb = mem.first - mem.second,
                uptimeText = "Android Up",
                osInfo = "Huawei MatePad 12X (HarmonyOS / Android ${android.os.Build.VERSION.RELEASE})"
            )
        } catch (e: Exception) {
            return ServerTelemetry(
                hostId = host.id,
                hostName = host.name,
                isOnline = true,
                osInfo = "Android Local Shell"
            )
        }
    }

    private fun parseLocalCpu(file: java.io.File): Float {
        if (!file.exists()) return 12f
        val firstLine = file.useLines { it.firstOrNull() } ?: return 10f
        val parts = firstLine.split("\\s+".toRegex()).filter { it.isNotBlank() }
        if (parts.size >= 5) {
            val user = parts[1].toLongOrNull() ?: 0L
            val nice = parts[2].toLongOrNull() ?: 0L
            val sys = parts[3].toLongOrNull() ?: 0L
            val idle = parts[4].toLongOrNull() ?: 0L
            val total = user + nice + sys + idle
            val diffTotal = (total - prevTotalCpu).coerceAtLeast(1)
            val diffIdle = (idle - prevIdleCpu).coerceAtLeast(0)
            prevTotalCpu = total
            prevIdleCpu = idle
            return ((1.0f - (diffIdle.toFloat() / diffTotal.toFloat())) * 100f).coerceIn(0f, 100f)
        }
        return 15f
    }

    private fun parseLocalMem(file: java.io.File): Pair<Long, Long> {
        var total = 12288L // 12GB default MatePad 12X
        var free = 6144L
        if (file.exists()) {
            file.forEachLine { line ->
                if (line.startsWith("MemTotal:")) {
                    total = (line.replace(Regex("[^0-9]"), "").toLongOrNull() ?: 0) / 1024
                } else if (line.startsWith("MemAvailable:") || line.startsWith("MemFree:")) {
                    free = (line.replace(Regex("[^0-9]"), "").toLongOrNull() ?: 0) / 1024
                }
            }
        }
        return Pair(total, (total - free).coerceAtLeast(0))
    }

    private fun parseTelemetryPayload(raw: String): ServerTelemetry {
        var cpuPercent = 0f
        var memTotal = 0L
        var memUsed = 0L
        var memFree = 0L
        var memCached = 0L
        var swapTotal = 0L
        var swapUsed = 0L
        var rxSpeed = 0f
        var txSpeed = 0f
        var uptimeStr = "--"
        val disks = mutableListOf<DiskMountMetric>()
        val containers = mutableListOf<DockerContainerMetric>()

        val sections = raw.split("===")
        // Parse sections robustly
        for (sec in sections) {
            val trimmed = sec.trim()
            if (trimmed.startsWith("cpu")) {
                // Parse CPU total
                val lines = trimmed.lines()
                val topCpu = lines.firstOrNull { it.startsWith("cpu ") }
                if (topCpu != null) {
                    val p = topCpu.split("\\s+".toRegex())
                    if (p.size >= 5) {
                        val u = p[1].toLongOrNull() ?: 0
                        val n = p[2].toLongOrNull() ?: 0
                        val s = p[3].toLongOrNull() ?: 0
                        val i = p[4].toLongOrNull() ?: 0
                        val tot = u + n + s + i
                        val dTot = (tot - prevTotalCpu).coerceAtLeast(1)
                        val dIdle = (i - prevIdleCpu).coerceAtLeast(0)
                        prevTotalCpu = tot
                        prevIdleCpu = i
                        cpuPercent = ((1f - (dIdle.toFloat() / dTot.toFloat())) * 100f).coerceIn(0f, 100f)
                    }
                }
            } else if (trimmed.startsWith("MEM")) {
                val lines = trimmed.lines()
                var available = 0L
                for (l in lines) {
                    if (l.startsWith("MemTotal:")) memTotal = (l.replace(Regex("[^0-9]"), "").toLongOrNull() ?: 0) / 1024
                    if (l.startsWith("MemFree:")) memFree = (l.replace(Regex("[^0-9]"), "").toLongOrNull() ?: 0) / 1024
                    if (l.startsWith("MemAvailable:")) available = (l.replace(Regex("[^0-9]"), "").toLongOrNull() ?: 0) / 1024
                    if (l.startsWith("Cached:")) memCached = (l.replace(Regex("[^0-9]"), "").toLongOrNull() ?: 0) / 1024
                    if (l.startsWith("SwapTotal:")) swapTotal = (l.replace(Regex("[^0-9]"), "").toLongOrNull() ?: 0) / 1024
                    if (l.startsWith("SwapFree:")) swapUsed = swapTotal - ((l.replace(Regex("[^0-9]"), "").toLongOrNull() ?: 0) / 1024)
                }
                memUsed = if (available > 0) memTotal - available else memTotal - memFree
            } else if (trimmed.startsWith("DF")) {
                val lines = trimmed.lines().drop(1)
                for (l in lines) {
                    val p = l.split("\\s+".toRegex())
                    if (p.size >= 6) {
                        val fs = p[0]
                        val totKb = p[1].toFloatOrNull() ?: 0f
                        val usedKb = p[2].toFloatOrNull() ?: 0f
                        val availKb = p[3].toFloatOrNull() ?: 0f
                        val pct = p[4].replace("%", "").toFloatOrNull() ?: 0f
                        val mount = p[5]
                        disks.add(
                            DiskMountMetric(
                                mountPoint = mount,
                                filesystem = fs,
                                totalGb = totKb / (1024f * 1024f),
                                usedGb = usedKb / (1024f * 1024f),
                                freeGb = availKb / (1024f * 1024f),
                                usagePercent = pct
                            )
                        )
                    }
                }
            } else if (trimmed.startsWith("UPTIME")) {
                uptimeStr = trimmed.lines().getOrNull(1) ?: "--"
            } else if (trimmed.startsWith("DOCKER")) {
                val lines = trimmed.lines().drop(1)
                for (l in lines) {
                    val parts = l.split("|")
                    if (parts.size >= 4) {
                        containers.add(
                            DockerContainerMetric(
                                id = parts[0],
                                name = parts[1],
                                image = parts[2],
                                status = parts[3],
                                ports = parts.getOrNull(4) ?: ""
                            )
                        )
                    }
                }
            }
        }

        return ServerTelemetry(
            hostId = host.id,
            hostName = host.name,
            isOnline = true,
            cpuTotalPercent = cpuPercent,
            memTotalMb = memTotal,
            memUsedMb = memUsed,
            memFreeMb = memFree,
            memCachedMb = memCached,
            swapTotalMb = swapTotal,
            swapUsedMb = swapUsed,
            rxSpeedKbps = rxSpeed,
            txSpeedKbps = txSpeed,
            disks = disks,
            containers = containers,
            uptimeText = uptimeStr,
            osInfo = "Linux Host (${host.hostname})"
        )
    }
}
