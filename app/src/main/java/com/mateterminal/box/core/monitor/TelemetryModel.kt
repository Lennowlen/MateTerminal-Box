package com.mateterminal.box.core.monitor

data class CpuCoreMetric(
    val coreIndex: Int,
    val usagePercent: Float
)

data class DiskMountMetric(
    val mountPoint: String,
    val filesystem: String,
    val totalGb: Float,
    val usedGb: Float,
    val freeGb: Float,
    val usagePercent: Float
)

data class DockerContainerMetric(
    val id: String,
    val name: String,
    val image: String,
    val status: String,
    val ports: String
)

data class ProcessMetric(
    val pid: Int,
    val user: String,
    val cpuPercent: Float,
    val memPercent: Float,
    val command: String
)

data class ServerTelemetry(
    val hostId: String,
    val hostName: String,
    val isOnline: Boolean = false,
    val cpuTotalPercent: Float = 0f,
    val cpuCores: List<CpuCoreMetric> = emptyList(),
    val loadAvg1m: Float = 0f,
    val loadAvg5m: Float = 0f,
    val loadAvg15m: Float = 0f,
    val memTotalMb: Long = 0L,
    val memUsedMb: Long = 0L,
    val memFreeMb: Long = 0L,
    val memCachedMb: Long = 0L,
    val swapTotalMb: Long = 0L,
    val swapUsedMb: Long = 0L,
    val rxSpeedKbps: Float = 0f,
    val txSpeedKbps: Float = 0f,
    val disks: List<DiskMountMetric> = emptyList(),
    val containers: List<DockerContainerMetric> = emptyList(),
    val topProcesses: List<ProcessMetric> = emptyList(),
    val uptimeText: String = "--",
    val osInfo: String = "Linux",
    val timestamp: Long = System.currentTimeMillis()
)
