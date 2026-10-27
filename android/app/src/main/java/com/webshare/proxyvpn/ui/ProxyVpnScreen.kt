package com.webshare.proxyvpn.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PowerSettingsNew
import androidx.compose.material.icons.filled.Router
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.VpnKey
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.webshare.proxyvpn.data.ProxyProtocol
import com.webshare.proxyvpn.data.VpnConnectionStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProxyVpnScreen(
    viewModel: ProxyVpnViewModel,
    onStartClick: () -> Unit,
    onDisconnectClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val state by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current
    var protocolDropdownExpanded by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Security,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Webshare Proxy VPN",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        modifier = modifier
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp, vertical = 12.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {

            // Status Card
            StatusCard(status = state.connectionStatus)

            // Configuration Form Card
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text(
                        text = "Proxy Server Settings",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.primary
                    )

                    // Domain Name TextField
                    OutlinedTextField(
                        value = state.domain,
                        onValueChange = viewModel::onDomainChanged,
                        label = { Text("Domain Name") },
                        placeholder = { Text("p.webshare.io or proxy IP") },
                        leadingIcon = {
                            Icon(Icons.Default.Dns, contentDescription = "Domain")
                        },
                        isError = state.domainError != null,
                        supportingText = state.domainError?.let { { Text(it) } },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Uri,
                            imeAction = ImeAction.Next
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Proxy Port TextField
                    OutlinedTextField(
                        value = state.port,
                        onValueChange = viewModel::onPortChanged,
                        label = { Text("Proxy Port") },
                        placeholder = { Text("1080 (SOCKS5) or 8080 (HTTP)") },
                        leadingIcon = {
                            Icon(Icons.Default.Router, contentDescription = "Port")
                        },
                        isError = state.portError != null,
                        supportingText = state.portError?.let { { Text(it) } },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Number,
                            imeAction = ImeAction.Next
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Proxy Username TextField
                    OutlinedTextField(
                        value = state.username,
                        onValueChange = viewModel::onUsernameChanged,
                        label = { Text("Proxy Username") },
                        placeholder = { Text("Enter Webshare username") },
                        leadingIcon = {
                            Icon(Icons.Default.Person, contentDescription = "Username")
                        },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Text,
                            imeAction = ImeAction.Next
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Proxy Password TextField (Masked with toggle)
                    OutlinedTextField(
                        value = state.password,
                        onValueChange = viewModel::onPasswordChanged,
                        label = { Text("Proxy Password") },
                        placeholder = { Text("Enter Webshare password") },
                        leadingIcon = {
                            Icon(Icons.Default.Lock, contentDescription = "Password")
                        },
                        trailingIcon = {
                            IconButton(onClick = viewModel::togglePasswordVisibility) {
                                Icon(
                                    imageVector = if (state.isPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = if (state.isPasswordVisible) "Hide password" else "Show password"
                                )
                            }
                        },
                        visualTransformation = if (state.isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(
                            onDone = {
                                focusManager.clearFocus()
                                onStartClick()
                            }
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Protocol Selection: SOCKS5 (default) / HTTP
                    Text(
                        text = "Protocol",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Medium
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Radio SOCKS5
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            RadioButton(
                                selected = state.protocol == ProxyProtocol.SOCKS5,
                                onClick = { viewModel.onProtocolSelected(ProxyProtocol.SOCKS5) }
                            )
                            Text(
                                text = "SOCKS5 (Default)",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }

                        // Radio HTTP
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            RadioButton(
                                selected = state.protocol == ProxyProtocol.HTTP,
                                onClick = { viewModel.onProtocolSelected(ProxyProtocol.HTTP) }
                            )
                            Text(
                                text = "HTTP (CONNECT)",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }

                    // Optional Dropdown Selector for Protocol
                    ExposedDropdownMenuBox(
                        expanded = protocolDropdownExpanded,
                        onExpandedChange = { protocolDropdownExpanded = !protocolDropdownExpanded }
                    ) {
                        OutlinedTextField(
                            value = if (state.protocol == ProxyProtocol.SOCKS5) "SOCKS5 Tunnel (TCP/UDP)" else "HTTP CONNECT Tunnel (Basic Auth)",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Active Protocol Engine") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = protocolDropdownExpanded) },
                            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                            modifier = Modifier
                                .menuAnchor()
                                .fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = protocolDropdownExpanded,
                            onDismissRequest = { protocolDropdownExpanded = false }
                        ) {
                            DropdownMenuItem(
                                text = { Text("SOCKS5 (default - Full TCP & UDP via hev-socks5-tunnel)") },
                                onClick = {
                                    viewModel.onProtocolSelected(ProxyProtocol.SOCKS5)
                                    protocolDropdownExpanded = false
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("HTTP (HTTP CONNECT with Proxy-Authorization header)") },
                                onClick = {
                                    viewModel.onProtocolSelected(ProxyProtocol.HTTP)
                                    protocolDropdownExpanded = false
                                }
                            )
                        }
                    }
                }
            }

            // Error summary banner if validation failed
            AnimatedVisibility(visible = state.validationErrorMessage != null) {
                state.validationErrorMessage?.let { msg ->
                    Surface(
                        color = MaterialTheme.colorScheme.errorContainer,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = msg,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                }
            }

            // Action Buttons: OK (Start VPN) & Disconnect
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Button "OK"
                Button(
                    onClick = {
                        focusManager.clearFocus()
                        onStartClick()
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    ),
                    modifier = Modifier
                        .weight(1f)
                        .height(52.dp)
                ) {
                    Icon(Icons.Default.PowerSettingsNew, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "OK",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }

                // Button "Disconnect"
                OutlinedButton(
                    onClick = {
                        focusManager.clearFocus()
                        onDisconnectClick()
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .weight(1f)
                        .height(52.dp)
                ) {
                    Text(
                        text = "Disconnect",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 15.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
        }
    }
}

@Composable
fun StatusCard(
    status: VpnConnectionStatus,
    modifier: Modifier = Modifier
) {
    val (bgColor, textColor, iconColor, statusLabel) = when (status) {
        is VpnConnectionStatus.Disconnected -> Quad(
            Color(0xFF262A30),
            Color(0xFFB0B7C3),
            Color(0xFF8A94A6),
            "Disconnected"
        )
        is VpnConnectionStatus.Connecting -> Quad(
            Color(0xFF332915),
            Color(0xFFFFD54F),
            Color(0xFFFFB300),
            "Connecting..."
        )
        is VpnConnectionStatus.Connected -> Quad(
            Color(0xFF132F20),
            Color(0xFF81C784),
            Color(0xFF4CAF50),
            "Connected via ${status.host}:${status.port}"
        )
        is VpnConnectionStatus.Error -> Quad(
            Color(0xFF3B1B1B),
            Color(0xFFE57373),
            Color(0xFFF44336),
            "Error: ${status.message}"
        )
    }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor),
        modifier = modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(iconColor.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                if (status is VpnConnectionStatus.Connecting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = iconColor,
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(
                        imageVector = if (status is VpnConnectionStatus.Connected) Icons.Default.VpnKey else Icons.Default.PowerSettingsNew,
                        contentDescription = null,
                        tint = iconColor,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "VPN Status",
                    style = MaterialTheme.typography.labelSmall,
                    color = textColor.copy(alpha = 0.7f)
                )
                Text(
                    text = statusLabel,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = textColor,
                    fontFamily = if (status is VpnConnectionStatus.Connected) FontFamily.Monospace else FontFamily.Default
                )
            }
        }
    }
}

private data class Quad<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
