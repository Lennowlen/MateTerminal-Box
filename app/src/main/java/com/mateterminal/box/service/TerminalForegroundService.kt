package com.mateterminal.box.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import com.mateterminal.box.MateTerminalApplication
import com.mateterminal.box.R
import com.mateterminal.box.ui.MainActivity

class TerminalForegroundService : Service() {

    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        acquireWakeLock()
        startForeground(NOTIFICATION_ID, buildNotification("MateTerminal Active", "Sessions running in background"))
    }

    private fun acquireWakeLock() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MateTerminal::KeepAliveLock").apply {
            setReferenceCounted(false)
            acquire(24 * 60 * 60 * 1000L) // 24 hours
        }
    }

    private fun buildNotification(title: String, content: String): Notification {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, MateTerminalApplication.CHANNEL_ID_KEEPALIVE)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_app_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val customTitle = intent?.getStringExtra(EXTRA_TITLE) ?: "MateTerminal Active"
        val customText = intent?.getStringExtra(EXTRA_TEXT) ?: "Sessions running in background"
        val notification = buildNotification(customTitle, customText)
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        manager.notify(NOTIFICATION_ID, notification)
        return START_STICKY
    }

    override fun onDestroy() {
        wakeLock?.let {
            if (it.isHeld) it.release()
        }
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val NOTIFICATION_ID = 1001
        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_TEXT = "extra_text"

        fun startService(context: Context, title: String? = null, text: String? = null) {
            val intent = Intent(context, TerminalForegroundService::class.java).apply {
                title?.let { putExtra(EXTRA_TITLE, it) }
                text?.let { putExtra(EXTRA_TEXT, it) }
            }
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, TerminalForegroundService::class.java)
            context.stopService(intent)
        }
    }
}
