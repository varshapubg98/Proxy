package com.webshare.proxyvpn

import android.util.Log

object TunnelJni {
    private const val TAG = "TunnelJni"

    init {
        try {
            System.loadLibrary("proxyvpn_tunnel")
            Log.i(TAG, "Native proxyvpn_tunnel library loaded successfully")
        } catch (e: UnsatisfiedLinkError) {
            Log.e(TAG, "Failed to load native library proxyvpn_tunnel", e)
        }
    }

    /**
     * Start the native tunnel relaying traffic between the TUN fd and upstream proxy.
     */
    fun startTunnel(
        tunFd: Int,
        host: String,
        port: Int,
        username: String,
        password: String,
        isHttp: Boolean,
        dnsServer: String = "1.1.1.1"
    ): Int {
        return nativeStartTunnel(
            tun_fd = tunFd,
            j_host = host,
            port = port,
            j_username = username,
            j_password = password,
            is_http = isHttp,
            j_dns_server = dnsServer
        )
    }

    /**
     * Terminate the tunnel worker and free resources.
     */
    fun stopTunnel() {
        nativeStopTunnel()
    }

    /**
     * Returns an array: [txBytes, rxBytes, activeConnections]
     */
    fun getStats(): LongArray {
        return nativeGetStats() ?: LongArray(3)
    }

    private external fun nativeStartTunnel(
        tun_fd: Int,
        j_host: String,
        port: Int,
        j_username: String,
        j_password: String,
        is_http: Boolean,
        j_dns_server: String
    ): Int

    private external fun nativeStopTunnel()

    private external fun nativeGetStats(): LongArray?
}
