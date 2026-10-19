#!/usr/bin/env python3.14
"""Cross-platform process inspection helpers for Python 3.14."""

import os


def pid_is_running(pid: int) -> bool:
    """Return whether a process is running without sending it a signal."""
    if os.name == "nt":
        import ctypes
        from ctypes import wintypes

        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        kernel32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
        kernel32.OpenProcess.restype = wintypes.HANDLE
        kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
        kernel32.CloseHandle.restype = wintypes.BOOL
        kernel32.WaitForSingleObject.argtypes = [wintypes.HANDLE, wintypes.DWORD]
        kernel32.WaitForSingleObject.restype = wintypes.DWORD

        process_query_limited_information = 0x1000
        synchronize = 0x00100000
        wait_object_0 = 0x00000000
        handle = kernel32.OpenProcess(process_query_limited_information | synchronize, False, pid)
        if handle:
            try:
                wait_result = kernel32.WaitForSingleObject(handle, 0)
                # WAIT_TIMEOUT means running; preserve a conservative result for other failures.
                return wait_result != wait_object_0
            finally:
                kernel32.CloseHandle(handle)
        return ctypes.get_last_error() == 5  # Access denied means it exists.

    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
