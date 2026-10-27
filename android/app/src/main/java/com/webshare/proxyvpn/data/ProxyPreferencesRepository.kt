package com.webshare.proxyvpn.data

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.webshare.proxyvpn.data.ProxyProtocol
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "proxy_settings")

class ProxyPreferencesRepository(private val context: Context) {

    private val keyHost = stringPreferencesKey("proxy_host")
    private val keyPort = stringPreferencesKey("proxy_port")
    private val keyUsername = stringPreferencesKey("proxy_username")
    private val keyProtocol = stringPreferencesKey("proxy_protocol")

    private val encryptedPrefs: SharedPreferences? by lazy {
        try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                "secure_proxy_prefs",
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            Log.e("ProxyPrefsRepo", "Failed to initialize EncryptedSharedPreferences", e)
            null
        }
    }

    /**
     * Read host, port, username, protocol from Jetpack DataStore Preferences
     */
    val proxyConfigFlow: Flow<ProxyConfig> = context.dataStore.data.map { prefs ->
        val host = prefs[keyHost] ?: "p.webshare.io"
        val port = prefs[keyPort] ?: "1080"
        val username = prefs[keyUsername] ?: ""
        val protocolStr = prefs[keyProtocol] ?: ProxyProtocol.SOCKS5.name
        val protocol = ProxyProtocol.fromString(protocolStr)
        val password = getSecurePassword()

        ProxyConfig(
            host = host,
            port = port,
            username = username,
            password = password,
            protocol = protocol
        )
    }

    suspend fun saveProxyConfig(config: ProxyConfig) {
        context.dataStore.edit { prefs ->
            prefs[keyHost] = config.host.trim()
            prefs[keyPort] = config.port.trim()
            prefs[keyUsername] = config.username.trim()
            prefs[keyProtocol] = config.protocol.name
        }
        saveSecurePassword(config.password)
    }

    fun getSecurePassword(): String {
        return try {
            encryptedPrefs?.getString("proxy_password", "") ?: ""
        } catch (e: Exception) {
            Log.e("ProxyPrefsRepo", "Error reading encrypted password", e)
            ""
        }
    }

    fun saveSecurePassword(password: String) {
        try {
            encryptedPrefs?.edit()?.putString("proxy_password", password)?.apply()
        } catch (e: Exception) {
            Log.e("ProxyPrefsRepo", "Error saving encrypted password", e)
        }
    }

    fun clearSecurePassword() {
        try {
            encryptedPrefs?.edit()?.remove("proxy_password")?.apply()
        } catch (e: Exception) {
            Log.e("ProxyPrefsRepo", "Error clearing encrypted password", e)
        }
    }
}
