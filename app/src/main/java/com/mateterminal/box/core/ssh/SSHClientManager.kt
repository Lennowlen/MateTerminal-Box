package com.mateterminal.box.core.ssh

import com.jcraft.jsch.ChannelShell
import com.jcraft.jsch.JSch
import com.jcraft.jsch.Session
import com.mateterminal.box.core.storage.HostModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.io.OutputStream
import java.util.Properties

class SSHClientManager(private val host: HostModel) {

    private var jsch = JSch()
    private var session: Session? = null
    private var channelShell: ChannelShell? = null
    var inputStream: InputStream? = null
        private set
    var outputStream: OutputStream? = null
        private set

    val isConnected: Boolean
        get() = session?.isConnected == true && channelShell?.isConnected == true

    suspend fun connect(
        cols: Int = 120,
        rows: Int = 36,
        onConnected: (() -> Unit)? = null,
        onError: ((Exception) -> Unit)? = null
    ) = withContext(Dispatchers.IO) {
        try {
            val hostSecret = host.passwordOrKey
            if (hostSecret.isNotBlank() && hostSecret.contains("BEGIN PRIVATE KEY")) {
                jsch.addIdentity("custom_key", hostSecret.toByteArray(), null, null)
            }

            session = jsch.getSession(host.username, host.hostname, host.port).apply {
                if (hostSecret.isNotBlank() && !hostSecret.contains("BEGIN PRIVATE KEY")) {
                    setPassword(hostSecret)
                }
                val config = Properties().apply {
                    put("StrictHostKeyChecking", "no")
                    put("PreferredAuthentications", "publickey,keyboard-interactive,password")
                }
                setConfig(config)
                serverAliveInterval = 30000 // 30s Keepalive
                serverAliveCountMax = 5
                timeout = 15000
                connect()
            }

            channelShell = (session?.openChannel("shell") as? ChannelShell)?.apply {
                setPtyType("xterm-256color")
                setPtySize(cols, rows, cols * 8, rows * 16)
                inputStream = this@SSHClientManager.let { this.inputStream }
                outputStream = this@SSHClientManager.let { this.outputStream }
                connect(5000)
            }

            this@SSHClientManager.inputStream = channelShell?.inputStream
            this@SSHClientManager.outputStream = channelShell?.outputStream

            withContext(Dispatchers.Main) {
                onConnected?.invoke()
            }
        } catch (e: Exception) {
            disconnect()
            withContext(Dispatchers.Main) {
                onError?.invoke(e)
            }
        }
    }

    fun resize(cols: Int, rows: Int) {
        try {
            channelShell?.setPtySize(cols, rows, cols * 8, rows * 16)
        } catch (_: Exception) {}
    }

    fun write(command: String) {
        try {
            outputStream?.write(command.toByteArray())
            outputStream?.flush()
        } catch (_: Exception) {}
    }

    fun disconnect() {
        try {
            channelShell?.disconnect()
            session?.disconnect()
        } catch (_: Exception) {}
        channelShell = null
        session = null
        inputStream = null
        outputStream = null
    }
}
