@echo off
"C:\\Users\\ThinkPad\\AppData\\Local\\Android\\Sdk\\cmake\\3.22.1\\bin\\cmake.exe" ^
  "-HD:\\rann\\Documents\\Labs\\mate-terminal-box\\app\\src\\main\\cpp" ^
  "-DCMAKE_SYSTEM_NAME=Android" ^
  "-DCMAKE_EXPORT_COMPILE_COMMANDS=ON" ^
  "-DCMAKE_SYSTEM_VERSION=24" ^
  "-DANDROID_PLATFORM=android-24" ^
  "-DANDROID_ABI=armeabi-v7a" ^
  "-DCMAKE_ANDROID_ARCH_ABI=armeabi-v7a" ^
  "-DANDROID_NDK=C:\\Users\\ThinkPad\\AppData\\Local\\Android\\Sdk\\ndk\\27.1.12297006" ^
  "-DCMAKE_ANDROID_NDK=C:\\Users\\ThinkPad\\AppData\\Local\\Android\\Sdk\\ndk\\27.1.12297006" ^
  "-DCMAKE_TOOLCHAIN_FILE=C:\\Users\\ThinkPad\\AppData\\Local\\Android\\Sdk\\ndk\\27.1.12297006\\build\\cmake\\android.toolchain.cmake" ^
  "-DCMAKE_MAKE_PROGRAM=C:\\Users\\ThinkPad\\AppData\\Local\\Android\\Sdk\\cmake\\3.22.1\\bin\\ninja.exe" ^
  "-DCMAKE_CXX_FLAGS=-std=c++17 -O3 -fPIC -Wall" ^
  "-DCMAKE_LIBRARY_OUTPUT_DIRECTORY=D:\\rann\\Documents\\Labs\\mate-terminal-box\\app\\build\\intermediates\\cxx\\Debug\\1p6g5s4q\\obj\\armeabi-v7a" ^
  "-DCMAKE_RUNTIME_OUTPUT_DIRECTORY=D:\\rann\\Documents\\Labs\\mate-terminal-box\\app\\build\\intermediates\\cxx\\Debug\\1p6g5s4q\\obj\\armeabi-v7a" ^
  "-DCMAKE_BUILD_TYPE=Debug" ^
  "-BD:\\rann\\Documents\\Labs\\mate-terminal-box\\app\\.cxx\\Debug\\1p6g5s4q\\armeabi-v7a" ^
  -GNinja ^
  "-DANDROID_STL=c++_shared"
