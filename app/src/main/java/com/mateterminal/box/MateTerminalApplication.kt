package com.mateterminal.box

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.mateterminal.box.core.storage.StorageManager

class MateTerminalApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        instance = this
        StorageManager.init(this)
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID_KEEPALIVE,
                "MateTerminal Background Session",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps active SSH & local shell sessions alive in the background."
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    companion object {
        const val CHANNEL_ID_KEEPALIVE = "mateterminal_keepalive_channel"
        lateinit var instance: MateTerminalApplication
            private set
    }
}
