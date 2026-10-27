package com.webshare.proxyvpn

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.core.app.NotificationCompat
import com.webshare.proxyvpn.data.ProxyProtocol
import com.webshare.proxyvpn.data.VpnConnectionStatus
import com.webshare.proxyvpn.ui.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ProxyVpnService : VpnService() {

    companion object {
        private const val TAG = "ProxyVpnService"
        const val ACTION_START = "com.webshare.proxyvpn.ACTION_START"
        const val ACTION_DISCONNECT = "com.webshare.proxyvpn.ACTION_DISCONNECT"
        const val EXTRA_HOST = "extra_host"
        const val EXTRA_PORT = "extra_port"
        const val EXTRA_USERNAME = "extra_username"
        const val EXTRA_PASSWORD = "extra_password"
        const val EXTRA_PROTOCOL = "extra_protocol"

        private const val NOTIFICATION_CHANNEL_ID = "proxy_vpn_service_channel"
        private const val NOTIFICATION_ID = 1001

        private val _vpnStatus = MutableStateFlow<VpnConnectionStatus>(VpnConnectionStatus.Disconnected)
        val vpnStatus = _vpnStatus.asStateFlow()

        fun start(
            context: Context,
            host: String,
            port: Int,
            username: String,
            password: String,
            protocol: ProxyProtocol
        ) {
            val intent = Intent(context, ProxyVpnService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_HOST, host)
                putExtra(EXTRA_PORT, port)
                putExtra(EXTRA_USERNAME, username)
                putExtra(EXTRA_PASSWORD, password)
                putExtra(EXTRA_PROTOCOL, protocol.name)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, ProxyVpnService::class.java).apply {
                action = ACTION_DISCONNECT
            }
            context.startService(intent)
        }
    }

    private var vpnInterface: ParcelFileDescriptor? = null
    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
    private var isTunnelRunning = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_DISCONNECT -> {
                Log.i(TAG, "Received disconnect intent")
                disconnect()
                return START_NOT_STICKY
            }
            ACTION_START -> {
                val host = intent.getStringExtra(EXTRA_HOST) ?: ""
                val port = intent.getIntExtra(EXTRA_PORT, 1080)
                val username = intent.getStringExtra(EXTRA_USERNAME) ?: ""
                val password = intent.getStringExtra(EXTRA_PASSWORD) ?: ""
                val protocolStr = intent.getStringExtra(EXTRA_PROTOCOL) ?: ProxyProtocol.SOCKS5.name
                val protocol = ProxyProtocol.fromString(protocolStr)

                _vpnStatus.value = VpnConnectionStatus.Connecting
                startForeground(NOTIFICATION_ID, buildNotification(host, port))

                serviceScope.launch {
                    try {
                        startVpnTunnel(host, port, username, password, protocol)
                    } catch (e: Exception) {
                        Log.e(TAG, "Error starting VPN tunnel", e)
                        _vpnStatus.value = VpnConnectionStatus.Error(e.message ?: "Failed to start tunnel")
                        stopSelf()
                    }
                }
                return START_STICKY
            }
            else -> {
                return START_NOT_STICKY
            }
        }
    }

    private fun startVpnTunnel(
        host: String,
        port: Int,
        username: String,
        password: String,
        protocol: ProxyProtocol
    ) {
        if (vpnInterface != null) {
            Log.w(TAG, "VPN interface already established, releasing existing")
            disconnect()
        }

        Log.i(TAG, "Building TUN interface...")
        val builder = Builder()
            // 1. Add internal address and route
            .addAddress("10.0.0.2", 32)
            .addRoute("0.0.0.0", 0)
            // 2. Add DNS server; DNS queries will be routed through the tunnel to avoid leaks
            .addDnsServer("1.1.1.1")
            // 3. Set Session & MTU
            .setSession("ProxyVPN")
            .setMtu(1500)

        // 4. Disallow self so the app's outbound proxy TCP connection does not loop back into the VPN
        try {
            builder.addDisallowedApplication(packageName)
            Log.i(TAG, "Disallowed self ($packageName) to prevent loopback")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to disallow application from VPN", e)
        }

        val pfd = builder.establish()
        if (pfd == null) {
            Log.e(TAG, "VpnService.Builder().establish() returned null")
            _vpnStatus.value = VpnConnectionStatus.Error("Failed to establish TUN interface")
            stopSelf()
            return
        }

        vpnInterface = pfd
        isTunnelRunning = true

        val tunFd = pfd.fd
        val isHttp = (protocol == ProxyProtocol.HTTP)

        Log.i(TAG, "TUN created with fd=$tunFd. Launching native tunnel relay for $host:$port (isHttp=$isHttp)")

        val ret = TunnelJni.startTunnel(
            tunFd = tunFd,
            host = host,
            port = port,
            username = username,
            password = password,
            isHttp = isHttp,
            dnsServer = "1.1.1.1"
        )

        if (ret == 0) {
            _vpnStatus.value = VpnConnectionStatus.Connected(host, port)
            Log.i(TAG, "Proxy VPN successfully connected via $host:$port")
        } else {
            Log.e(TAG, "Native tunnel returned error code: $ret")
            _vpnStatus.value = VpnConnectionStatus.Error("Native tunnel failed to start (code $ret)")
            disconnect()
        }
    }

    private fun disconnect() {
        Log.i(TAG, "Stopping proxy tunnel and tearing down TUN interface")
        isTunnelRunning = false

        try {
            TunnelJni.stopTunnel()
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping native tunnel", e)
        }

        try {
            vpnInterface?.close()
        } catch (e: Exception) {
            Log.e(TAG, "Error closing TUN ParcelFileDescriptor", e)
        }
        vpnInterface = null

        _vpnStatus.value = VpnConnectionStatus.Disconnected
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        super.onDestroy()
        disconnect()
    }

    override fun onRevoke() {
        super.onRevoke()
        Log.w(TAG, "VPN permission revoked by system")
        disconnect()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.notification_channel_desc)
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(host: String, port: Int): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val openAppPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val disconnectIntent = Intent(this, ProxyVpnService::class.java).apply {
            action = ACTION_DISCONNECT
        }
        val disconnectPendingIntent = PendingIntent.getService(
            this,
            1,
            disconnectIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val statusSummary = if (host.isNotEmpty()) "Routing all traffic via $host:$port" else "Tunnel active"

        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentTitle(getString(R.string.notification_title))
            .setContentText(statusSummary)
            .setOngoing(true)
            .setContentIntent(openAppPendingIntent)
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                getString(R.string.action_disconnect),
                disconnectPendingIntent
            )
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }
}
