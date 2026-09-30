#include <jni.h>
#include <pty.h>
#include <unistd.h>
#include <termios.h>
#include <sys/ioctl.h>
#include <sys/wait.h>
#include <fcntl.h>
#include <stdlib.h>
#include <android/log.h>

#define LOG_TAG "PTYBridge"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

extern "C" {

JNIEXPORT jint JNICALL
Java_com_mateterminal_box_core_pty_LocalPTYManager_createPtyNative(
    JNIEnv *env,
    jobject /* thiz */,
    jstring cmd,
    jstring cwd,
    jobjectArray envp,
    jintArray processIdArray,
    jint cols,
    jint rows) {

    const char *cmd_str = env->GetStringUTFChars(cmd, NULL);
    const char *cwd_str = cwd ? env->GetStringUTFChars(cwd, NULL) : NULL;

    struct winsize ws;
    ws.ws_col = (unsigned short)cols;
    ws.ws_row = (unsigned short)rows;
    ws.ws_xpixel = 0;
    ws.ws_ypixel = 0;

    int ptm = -1;
    pid_t pid = forkpty(&ptm, NULL, NULL, &ws);

    if (pid < 0) {
        LOGE("forkpty failed");
        if (cmd_str) env->ReleaseStringUTFChars(cmd, cmd_str);
        if (cwd_str) env->ReleaseStringUTFChars(cwd, cwd_str);
        return -1;
    }

    if (pid == 0) {
        // Child process
        if (cwd_str && chdir(cwd_str) != 0) {
            chdir("/data/data/com.mateterminal.box/files");
        }

        setenv("TERM", "xterm-256color", 1);
        setenv("COLORTERM", "truecolor", 1);
        setenv("HOME", "/data/data/com.mateterminal.box/files", 0);

        char *const argv[] = {(char *)cmd_str, "-l", NULL};
        execvp(cmd_str, argv);

        // Fallback to /system/bin/sh if cmd_str failed
        char *const fallback_argv[] = {(char *)"/system/bin/sh", "-i", NULL};
        execv("/system/bin/sh", fallback_argv);
        _exit(127);
    }

    // Parent process
    if (processIdArray != NULL) {
        jint pids[1] = { pid };
        env->SetIntArrayRegion(processIdArray, 0, 1, pids);
    }

    // Set non-blocking on master fd
    int flags = fcntl(ptm, F_GETFL, 0);
    if (flags != -1) {
        fcntl(ptm, F_SETFL, flags | O_NONBLOCK);
    }

    if (cmd_str) env->ReleaseStringUTFChars(cmd, cmd_str);
    if (cwd_str) env->ReleaseStringUTFChars(cwd, cwd_str);

    return ptm;
}

JNIEXPORT void JNICALL
Java_com_mateterminal_box_core_pty_LocalPTYManager_setPtyWindowSizeNative(
    JNIEnv *env,
    jobject /* thiz */,
    jint fd,
    jint cols,
    jint rows) {

    struct winsize ws;
    ws.ws_col = (unsigned short)cols;
    ws.ws_row = (unsigned short)rows;
    ws.ws_xpixel = 0;
    ws.ws_ypixel = 0;
    ioctl(fd, TIOCSWINSZ, &ws);
}

JNIEXPORT void JNICALL
Java_com_mateterminal_box_core_pty_LocalPTYManager_closePtyNative(
    JNIEnv *env,
    jobject /* thiz */,
    jint fd,
    jint pid) {

    if (fd >= 0) {
        close(fd);
    }
    if (pid > 0) {
        kill(pid, SIGTERM);
        int status;
        waitpid(pid, &status, WNOHANG);
    }
}

} // extern "C"
