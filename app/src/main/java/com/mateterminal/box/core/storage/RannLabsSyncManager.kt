package com.mateterminal.box.core.storage

import android.os.Build
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

object RannLabsSyncManager {
    private const val TAG = "RannLabsSync"

    suspend fun syncDailyLogs(dateStr: String): Result<Int> = withContext(Dispatchers.IO) {
        try {
            val settings = StorageManager.getSettings()
            if (!settings.autoSyncLogsToServer || settings.rannLabsServerEndpoint.isBlank()) {
                return@withContext Result.failure(Exception("Sync is disabled or endpoint is empty"))
            }

            val pendingLogs = StorageManager.getDailyLogs(dateStr).filter { it.syncStatus != SyncStatus.SYNCED }
            if (pendingLogs.isEmpty()) {
                return@withContext Result.success(0)
            }

            val payload = JSONObject().apply {
                put("device_model", "Huawei MatePad 12X (LRT-W09)")
                put("display_spec", "2800x1840@144Hz 3:2")
                put("harmony_os_version", Build.DISPLAY)
                put("log_date", dateStr)
                put("client_version", "1.5.0-termius")
                
                val logsArray = JSONArray()
                for (item in pendingLogs) {
                    val logJson = JSONObject().apply {
                        put("id", item.id)
                        put("timestamp", item.timestamp)
                        put("host_id", item.hostId)
                        put("host_name", item.hostName)
                        put("event_type", item.eventType.name)
                        put("message", item.message)
                        put("duration_ms", item.executionDurationMs)
                    }
                    logsArray.put(logJson)
                }
                put("entries", logsArray)
            }

            val url = URL(settings.rannLabsServerEndpoint)
            val connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 10000
                readTimeout = 10000
                doOutput = true
                setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                setRequestProperty("Accept", "application/json")
                if (settings.rannLabsApiKey.isNotBlank()) {
                    setRequestProperty("Authorization", "Bearer ${settings.rannLabsApiKey}")
                }
            }

            connection.outputStream.use { os ->
                OutputStreamWriter(os, "UTF-8").use { writer ->
                    writer.write(payload.toString())
                    writer.flush()
                }
            }

            val responseCode = connection.responseCode
            if (responseCode in 200..299) {
                StorageManager.markLogsSynced(pendingLogs)
                Log.i(TAG, "Successfully synced ${pendingLogs.size} logs to Rann-Labs server for $dateStr")
                Result.success(pendingLogs.size)
            } else {
                val errMsg = "HTTP error $responseCode from ${settings.rannLabsServerEndpoint}"
                Log.e(TAG, errMsg)
                Result.failure(Exception(errMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to sync logs to Rann-Labs server: ${e.message}", e)
            Result.failure(e)
        }
    }
}
