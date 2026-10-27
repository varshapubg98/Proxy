package com.webshare.proxyvpn.data

enum class ProxyProtocol {
    SOCKS5,
    HTTP;

    companion object {
        fun fromString(value: String?): ProxyProtocol {
            return when (value?.uppercase()) {
                "HTTP" -> HTTP
                else -> SOCKS5
            }
        }
    }
}

data class ProxyConfig(
    val host: String = "",
    val port: String = "1080",
    val username: String = "",
    val password: String = "",
    val protocol: ProxyProtocol = ProxyProtocol.SOCKS5
)

sealed class VpnConnectionStatus {
    object Disconnected : VpnConnectionStatus()
    object Connecting : VpnConnectionStatus()
    data class Connected(val host: String, val port: Int) : VpnConnectionStatus()
    data class Error(val message: String) : VpnConnectionStatus()

    fun displayMessage(): String = when (this) {
        is Disconnected -> "Disconnected"
        is Connecting -> "Connecting..."
        is Connected -> "Connected via $host:$port"
        is Error -> "Error: $message"
    }
}
