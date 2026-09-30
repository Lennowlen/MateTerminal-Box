package com.mateterminal.box.core.pty

import android.os.ParcelFileDescriptor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.InputStream
import java.io.OutputStream

class LocalPTYManager {

    companion object {
        init {
            try {
                System.loadLibrary("ptybridge")
            } catch (e: UnsatisfiedLinkError) {
                // Fallback to java process builder if native lib is unavailable
            }
        }
    }

    private var masterFd: Int = -1
    private var childPid: Int = -1
    private var process: Process? = null

    var inputStream: InputStream? = null
        private set
    var outputStream: OutputStream? = null
        private set

    val isRunning: Boolean
        get() = masterFd >= 0 || process?.isAlive == true

    suspend fun start(
        cols: Int = 120,
        rows: Int = 36,
        workingDir: String? = null,
        shellCmd: String = "/system/bin/sh"
    ) = withContext(Dispatchers.IO) {
        try {
            val pidArr = IntArray(1)
            masterFd = createPtyNative(shellCmd, workingDir, null, pidArr, cols, rows)
            if (masterFd >= 0) {
                childPid = pidArr[0]
                val pfd = ParcelFileDescriptor.adoptFd(masterFd)
                inputStream = FileInputStream(pfd.fileDescriptor)
                outputStream = FileOutputStream(pfd.fileDescriptor)
            } else {
                // Fallback: Java process builder
                val pb = ProcessBuilder(shellCmd, "-i")
                if (workingDir != null && File(workingDir).exists()) {
                    pb.directory(File(workingDir))
                }
                pb.environment()["TERM"] = "xterm-256color"
                pb.environment()["COLORTERM"] = "truecolor"
                process = pb.start()
                inputStream = process?.inputStream
                outputStream = process?.outputStream
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun resize(cols: Int, rows: Int) {
        if (masterFd >= 0) {
            setPtyWindowSizeNative(masterFd, cols, rows)
        }
    }

    fun write(command: String) {
        try {
            outputStream?.write(command.toByteArray())
            outputStream?.flush()
        } catch (_: Exception) {}
    }

    fun stop() {
        if (masterFd >= 0) {
            closePtyNative(masterFd, childPid)
            masterFd = -1
            childPid = -1
        }
        process?.destroy()
        process = null
        inputStream = null
        outputStream = null
    }

    // Native JNI functions
    private external fun createPtyNative(
        cmd: String,
        cwd: String?,
        envp: Array<String>?,
        processIdArray: IntArray,
        cols: Int,
        rows: Int
    ): Int

    private external fun setPtyWindowSizeNative(fd: Int, cols: Int, rows: Int)
    private external fun closePtyNative(fd: Int, pid: Int)
}
