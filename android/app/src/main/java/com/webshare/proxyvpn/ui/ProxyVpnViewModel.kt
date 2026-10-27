package com.webshare.proxyvpn.ui

import android.app.Application
import android.content.Context
import android.content.Intent
import android.net.VpnService
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.webshare.proxyvpn.ProxyVpnService
import com.webshare.proxyvpn.data.ProxyConfig
import com.webshare.proxyvpn.data.ProxyPreferencesRepository
import com.webshare.proxyvpn.data.ProxyProtocol
import com.webshare.proxyvpn.data.VpnConnectionStatus
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProxyVpnUiState(
    val domain: String = "p.webshare.io",
    val port: String = "1080",
    val username: String = "",
    val password: String = "",
    val isPasswordVisible: Boolean = false,
    val protocol: ProxyProtocol = ProxyProtocol.SOCKS5,
    val domainError: String? = null,
    val portError: String? = null,
    val connectionStatus: VpnConnectionStatus = VpnConnectionStatus.Disconnected,
    val validationErrorMessage: String? = null
)

sealed interface VpnNavigationEvent {
    data class RequestVpnPermission(val prepareIntent: Intent) : VpnNavigationEvent
    object StartVpnDirectly : VpnNavigationEvent
}

class ProxyVpnViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = ProxyPreferencesRepository(application.applicationContext)

    private val _uiState = MutableStateFlow(ProxyVpnUiState())
    val uiState: StateFlow<ProxyVpnUiState> = _uiState.asStateFlow()

    private val _events = MutableSharedFlow<VpnNavigationEvent>()
    val events: SharedFlow<VpnNavigationEvent> = _events.asSharedFlow()

    init {
        // Load persisted settings from DataStore & EncryptedSharedPreferences
        viewModelScope.launch {
            repository.proxyConfigFlow.collect { savedConfig ->
                _uiState.update { current ->
                    current.copy(
                        domain = savedConfig.host.ifEmpty { "p.webshare.io" },
                        port = savedConfig.port.ifEmpty { "1080" },
                        username = savedConfig.username,
                        password = savedConfig.password,
                        protocol = savedConfig.protocol
                    )
                }
            }
        }

        // Collect active VPN status from ProxyVpnService
        viewModelScope.launch {
            ProxyVpnService.vpnStatus.collect { status ->
                _uiState.update { it.copy(connectionStatus = status) }
            }
        }
    }

    fun onDomainChanged(newDomain: String) {
        _uiState.update {
            it.copy(
                domain = newDomain,
                domainError = if (newDomain.isBlank()) "Domain cannot be empty" else null,
                validationErrorMessage = null
            )
        }
    }

    fun onPortChanged(newPort: String) {
        val filtered = newPort.filter { it.isDigit() }
        val portInt = filtered.toIntOrNull()
        val error = when {
            filtered.isBlank() -> "Port is required"
            portInt == null || portInt !in 1..65535 -> "Port must be 1 - 65535"
            else -> null
        }
        _uiState.update {
            it.copy(
                port = filtered,
                portError = error,
                validationErrorMessage = null
            )
        }
    }

    fun onUsernameChanged(newUsername: String) {
        _uiState.update { it.copy(username = newUsername, validationErrorMessage = null) }
    }

    fun onPasswordChanged(newPassword: String) {
        _uiState.update { it.copy(password = newPassword, validationErrorMessage = null) }
    }

    fun togglePasswordVisibility() {
        _uiState.update { it.copy(isPasswordVisible = !it.isPasswordVisible) }
    }

    fun onProtocolSelected(newProtocol: ProxyProtocol) {
        _uiState.update { it.copy(protocol = newProtocol) }
    }

    /**
     * Triggered when the user taps "OK" (Start VPN)
     */
    fun onStartVpnClicked(context: Context) {
        val state = _uiState.value

        // 1. Validate fields
        val domain = state.domain.trim()
        val portInt = state.port.trim().toIntOrNull()

        if (domain.isEmpty()) {
            _uiState.update {
                it.copy(
                    domainError = "Domain name is required",
                    validationErrorMessage = "Please provide a valid domain name or proxy IP"
                )
            }
            return
        }

        if (portInt == null || portInt !in 1..65535) {
            _uiState.update {
                it.copy(
                    portError = "Valid port (1-65535) is required",
                    validationErrorMessage = "Invalid port: must be between 1 and 65535"
                )
            }
            return
        }

        // 2. Persist configurations safely (DataStore + EncryptedSharedPreferences)
        viewModelScope.launch {
            repository.saveProxyConfig(
                ProxyConfig(
                    host = domain,
                    port = state.port.trim(),
                    username = state.username.trim(),
                    password = state.password,
                    protocol = state.protocol
                )
            )
        }

        // 3. Prepare VpnService: if system VPN permission is required, emit event to launch intent
        val prepareIntent = VpnService.prepare(context)
        if (prepareIntent != null) {
            viewModelScope.launch {
                _events.emit(VpnNavigationEvent.RequestVpnPermission(prepareIntent))
            }
        } else {
            // Permission already granted, start VPN directly
            startVpnService(context)
        }
    }

    /**
     * Starts the actual foreground ProxyVpnService
     */
    fun startVpnService(context: Context) {
        val state = _uiState.value
        val portInt = state.port.trim().toIntOrNull() ?: 1080
        ProxyVpnService.start(
            context = context,
            host = state.domain.trim(),
            port = portInt,
            username = state.username.trim(),
            password = state.password,
            protocol = state.protocol
        )
    }

    /**
     * Triggered when the user taps "Disconnect"
     */
    fun onDisconnectClicked(context: Context) {
        ProxyVpnService.stop(context)
    }
}
