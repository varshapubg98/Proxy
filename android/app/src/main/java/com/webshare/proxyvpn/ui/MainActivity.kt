package com.webshare.proxyvpn.ui

import android.app.Activity
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.webshare.proxyvpn.ui.theme.WebshareProxyVPNTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private val viewModel: ProxyVpnViewModel by viewModels()

    // ActivityResultLauncher for the system VPN permission dialog
    private val vpnPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            // Permission granted by user, start VPN
            viewModel.startVpnService(this)
        } else {
            Toast.makeText(this, "VPN permission denied by user", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Listen for navigation / VPN preparation events from ViewModel
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.events.collect { event ->
                    when (event) {
                        is VpnNavigationEvent.RequestVpnPermission -> {
                            vpnPermissionLauncher.launch(event.prepareIntent)
                        }
                        VpnNavigationEvent.StartVpnDirectly -> {
                            viewModel.startVpnService(this@MainActivity)
                        }
                    }
                }
            }
        }

        setContent {
            WebshareProxyVPNTheme {
                ProxyVpnScreen(
                    viewModel = viewModel,
                    onStartClick = { viewModel.onStartVpnClicked(this) },
                    onDisconnectClick = { viewModel.onDisconnectClicked(this) }
                )
            }
        }
    }
}
