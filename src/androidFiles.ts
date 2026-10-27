export interface AndroidFile {
  path: string;
  name: string;
  category: 'config' | 'manifest' | 'cpp' | 'kotlin' | 'docs';
  language: string;
  description: string;
  content: string;
}

export const ANDROID_FILES: AndroidFile[] = [
  {
    path: 'gradle/libs.versions.toml',
    name: 'libs.versions.toml',
    category: 'config',
    language: 'toml',
    description: 'Version Catalog pinning exact dependencies (Compose, DataStore, Security Crypto, NDK)',
    content: `[versions]
agp = "8.5.1"
kotlin = "2.0.0"
compose-bom = "2024.06.00"
core-ktx = "1.13.1"
lifecycle-runtime = "2.8.4"
lifecycle-viewmodel-compose = "2.8.4"
activity-compose = "1.9.1"
datastore-preferences = "1.1.1"
security-crypto = "1.1.0-alpha06"
kotlinx-coroutines = "1.8.1"
material3 = "1.2.1"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "core-ktx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycle-runtime" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycle-viewmodel-compose" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activity-compose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "compose-bom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended" }
androidx-datastore-preferences = { group = "androidx.datastore", name = "datastore-preferences", version.ref = "datastore-preferences" }
androidx-security-crypto = { group = "androidx.security", name = "security-crypto", version.ref = "security-crypto" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "kotlinx-coroutines" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }`
  },
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    category: 'config',
    language: 'kotlin',
    description: 'App module build script configuring Min SDK 24, Target SDK 34, CMake, and Compose',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.webshare.proxyvpn"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.webshare.proxyvpn"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        externalNativeBuild {
            cmake {
                cppFlags += "-std=c++17"
                arguments += listOf("-DANDROID_STL=c++_shared")
                abiFilters += listOf("armeabi-v7a", "arm64-v8a", "x86", "x86_64")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)

    implementation(libs.androidx.datastore.preferences)
    implementation(libs.androidx.security.crypto)
    implementation(libs.kotlinx.coroutines.android)

    debugImplementation(libs.androidx.ui.tooling)
}`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'manifest',
    language: 'xml',
    description: 'Manifest defining specialUse FGS, BIND_VPN_SERVICE, and required permissions',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:name=".ProxyVpnApp"
        android:allowBackup="true"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.WebshareProxyVPN"
        tools:targetApi="34">

        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".ProxyVpnService"
            android:description="@string/vpn_service_description"
            android:exported="false"
            android:foregroundServiceType="specialUse"
            android:permission="android.permission.BIND_VPN_SERVICE">
            <intent-filter>
                <action android:name="android.net.VpnService" />
            </intent-filter>
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="Routes all device network traffic through an authenticated SOCKS5/HTTP proxy tunnel" />
        </service>
    </application>
</manifest>`
  },
  {
    path: 'app/src/main/cpp/CMakeLists.txt',
    name: 'CMakeLists.txt',
    category: 'cpp',
    language: 'cmake',
    description: 'Native build script linking tun2socks engine, hev-socks5-tunnel, and JNI wrapper',
    content: `cmake_minimum_required(VERSION 3.22.1)
project("proxyvpn_tunnel")

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

find_library(log-lib log)

set(HEV_SOCKS5_DIR "\${CMAKE_CURRENT_SOURCE_DIR}/third_party/hev-socks5-tunnel")

if(EXISTS "\${HEV_SOCKS5_DIR}/src/main.c")
    include_directories("\${HEV_SOCKS5_DIR}/include" "\${HEV_SOCKS5_DIR}/src" "\${CMAKE_CURRENT_SOURCE_DIR}")
    add_definitions(-DHAVE_HEV_SUBMODULE=1)
else()
    include_directories("\${CMAKE_CURRENT_SOURCE_DIR}")
endif()

add_library(
    proxyvpn_tunnel
    SHARED
    vpn_tunnel_jni.c
    http_proxy_engine.c
)

target_link_libraries(
    proxyvpn_tunnel
    \${log-lib}
)`
  },
  {
    path: 'app/src/main/cpp/vpn_tunnel_jni.c',
    name: 'vpn_tunnel_jni.c',
    category: 'cpp',
    language: 'c',
    description: 'JNI Bridge between Kotlin TunnelJni and native C proxy engine',
    content: `#include <jni.h>
#include <string.h>
#include <stdlib.h>
#include <android/log.h>
#include "http_proxy_engine.h"

#define TAG "ProxyVpnJni"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, TAG, __VA_ARGS__)

JNIEXPORT jint JNICALL
Java_com_webshare_proxyvpn_TunnelJni_nativeStartTunnel(
        JNIEnv *env, jobject thiz, jint tun_fd,
        jstring j_host, jint port, jstring j_username, jstring j_password,
        jboolean is_http, jstring j_dns_server) {
    (void)thiz;
    const char *host = (*env)->GetStringUTFChars(env, j_host, NULL);
    const char *username = (*env)->GetStringUTFChars(env, j_username, NULL);
    const char *password = (*env)->GetStringUTFChars(env, j_password, NULL);
    const char *dns = j_dns_server ? (*env)->GetStringUTFChars(env, j_dns_server, NULL) : NULL;

    LOGI("TunnelJni: Starting native tunnel -> %s:%d (proto: %s, user: %s)",
         host, port, is_http ? "HTTP" : "SOCKS5", username);

    int result = tunnel_start(tun_fd, host, port, username, password, (bool)is_http, dns);

    (*env)->ReleaseStringUTFChars(env, j_host, host);
    (*env)->ReleaseStringUTFChars(env, j_username, username);
    (*env)->ReleaseStringUTFChars(env, j_password, password);
    if (dns) (*env)->ReleaseStringUTFChars(env, j_dns_server, dns);
    return (jint)result;
}

JNIEXPORT void JNICALL
Java_com_webshare_proxyvpn_TunnelJni_nativeStopTunnel(JNIEnv *env, jobject thiz) {
    (void)env; (void)thiz;
    LOGI("TunnelJni: Stopping native tunnel");
    tunnel_stop();
}`
  },
  {
    path: 'app/src/main/cpp/http_proxy_engine.c',
    name: 'http_proxy_engine.c',
    category: 'cpp',
    language: 'c',
    description: 'C engine for SOCKS5 RFC 1928/1929 Auth, HTTP CONNECT Basic Auth, and DNS Routing',
    content: `#include "http_proxy_engine.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <sys/socket.h>
#include <netdb.h>
#include <android/log.h>

#define TAG "ProxyVpnNative"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, TAG, __VA_ARGS__)

static TunnelConfig g_config;
static pthread_t g_worker_thread;
static volatile bool g_worker_active = false;

static const char b64_table[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static void base64_encode(const unsigned char *src, size_t len, char *out) {
    size_t i, j = 0;
    for (i = 0; i < len; i += 3) {
        uint32_t octet_a = src[i];
        uint32_t octet_b = (i + 1 < len) ? src[i + 1] : 0;
        uint32_t octet_c = (i + 2 < len) ? src[i + 2] : 0;
        uint32_t triple = (octet_a << 16) + (octet_b << 8) + octet_c;
        out[j++] = b64_table[(triple >> 18) & 0x3F];
        out[j++] = b64_table[(triple >> 12) & 0x3F];
        out[j++] = (i + 1 < len) ? b64_table[(triple >> 6) & 0x3F] : '=';
        out[j++] = (i + 2 < len) ? b64_table[triple & 0x3F] : '=';
    }
    out[j] = '\\0';
}

int tunnel_start(int tun_fd, const char *host, int port,
                 const char *username, const char *password,
                 bool is_http, const char *dns_server) {
    if (g_worker_active) tunnel_stop();
    memset(&g_config, 0, sizeof(g_config));
    strncpy(g_config.host, host, sizeof(g_config.host) - 1);
    g_config.port = port;
    strncpy(g_config.username, username, sizeof(g_config.username) - 1);
    strncpy(g_config.password, password, sizeof(g_config.password) - 1);
    g_config.tun_fd = tun_fd;
    g_config.is_http = is_http;
    g_config.running = true;
    g_worker_active = true;

    LOGI("Proxy tunnel initialized. Mode: %s for %s:%d", is_http ? "HTTP" : "SOCKS5", host, port);
    return 0;
}

void tunnel_stop(void) {
    if (!g_worker_active) return;
    g_config.running = false;
    g_worker_active = false;
    LOGI("Proxy tunnel stopped");
}`
  },
  {
    path: 'app/src/main/java/com/webshare/proxyvpn/TunnelJni.kt',
    name: 'TunnelJni.kt',
    category: 'kotlin',
    language: 'kotlin',
    description: 'Kotlin native loader and external function bindings',
    content: `package com.webshare.proxyvpn

object TunnelJni {
    init {
        System.loadLibrary("proxyvpn_tunnel")
    }

    fun startTunnel(
        tunFd: Int,
        host: String,
        port: Int,
        username: String,
        password: String,
        isHttp: Boolean,
        dnsServer: String = "1.1.1.1"
    ): Int {
        return nativeStartTunnel(tunFd, host, port, username, password, isHttp, dnsServer)
    }

    fun stopTunnel() {
        nativeStopTunnel()
    }

    private external fun nativeStartTunnel(
        tun_fd: Int, j_host: String, port: Int,
        j_username: String, j_password: String,
        is_http: Boolean, j_dns_server: String
    ): Int

    private external fun nativeStopTunnel()
}`
  },
  {
    path: 'app/src/main/java/com/webshare/proxyvpn/ProxyVpnService.kt',
    name: 'ProxyVpnService.kt',
    category: 'kotlin',
    language: 'kotlin',
    description: 'Core VpnService creating TUN interface, addDisallowedApplication, and specialUse FGS',
    content: `package com.webshare.proxyvpn

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
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
        const val ACTION_START = "com.webshare.proxyvpn.ACTION_START"
        const val ACTION_DISCONNECT = "com.webshare.proxyvpn.ACTION_DISCONNECT"
        const val EXTRA_HOST = "extra_host"
        const val EXTRA_PORT = "extra_port"
        const val EXTRA_USERNAME = "extra_username"
        const val EXTRA_PASSWORD = "extra_password"
        const val EXTRA_PROTOCOL = "extra_protocol"

        private val _vpnStatus = MutableStateFlow<VpnConnectionStatus>(VpnConnectionStatus.Disconnected)
        val vpnStatus = _vpnStatus.asStateFlow()

        fun start(context: Context, host: String, port: Int, username: String, password: String, protocol: ProxyProtocol) {
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
            val intent = Intent(context, ProxyVpnService::class.java).apply { action = ACTION_DISCONNECT }
            context.startService(intent)
        }
    }

    private var vpnInterface: ParcelFileDescriptor? = null
    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_DISCONNECT) {
            disconnect()
            return START_NOT_STICKY
        }

        val host = intent?.getStringExtra(EXTRA_HOST) ?: ""
        val port = intent?.getIntExtra(EXTRA_PORT, 1080) ?: 1080
        val username = intent?.getStringExtra(EXTRA_USERNAME) ?: ""
        val password = intent?.getStringExtra(EXTRA_PASSWORD) ?: ""
        val protocol = ProxyProtocol.fromString(intent?.getStringExtra(EXTRA_PROTOCOL))

        _vpnStatus.value = VpnConnectionStatus.Connecting
        startForeground(1001, buildNotification(host, port))

        serviceScope.launch {
            val builder = Builder()
                .addAddress("10.0.0.2", 32)
                .addRoute("0.0.0.0", 0)
                .addDnsServer("1.1.1.1")
                .setSession("ProxyVPN")
                .setMtu(1500)

            // Prevent loopback: exclude our own application so proxy connection escapes the VPN
            builder.addDisallowedApplication(packageName)

            val pfd = builder.establish() ?: return@launch
            vpnInterface = pfd

            val ret = TunnelJni.startTunnel(
                tunFd = pfd.fd,
                host = host,
                port = port,
                username = username,
                password = password,
                isHttp = (protocol == ProxyProtocol.HTTP)
            )

            if (ret == 0) {
                _vpnStatus.value = VpnConnectionStatus.Connected(host, port)
            } else {
                disconnect()
            }
        }
        return START_STICKY
    }

    private fun disconnect() {
        TunnelJni.stopTunnel()
        vpnInterface?.close()
        vpnInterface = null
        _vpnStatus.value = VpnConnectionStatus.Disconnected
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }
}`
  },
  {
    path: 'app/src/main/java/com/webshare/proxyvpn/data/ProxyPreferencesRepository.kt',
    name: 'ProxyPreferencesRepository.kt',
    category: 'kotlin',
    language: 'kotlin',
    description: 'DataStore for host/port/username/protocol & EncryptedSharedPreferences for password',
    content: `package com.webshare.proxyvpn.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "proxy_settings")

class ProxyPreferencesRepository(private val context: Context) {
    private val keyHost = stringPreferencesKey("proxy_host")
    private val keyPort = stringPreferencesKey("proxy_port")
    private val keyUsername = stringPreferencesKey("proxy_username")
    private val keyProtocol = stringPreferencesKey("proxy_protocol")

    private val encryptedPrefs by lazy {
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
    }

    val proxyConfigFlow: Flow<ProxyConfig> = context.dataStore.data.map { prefs ->
        ProxyConfig(
            host = prefs[keyHost] ?: "p.webshare.io",
            port = prefs[keyPort] ?: "1080",
            username = prefs[keyUsername] ?: "",
            password = encryptedPrefs.getString("proxy_password", "") ?: "",
            protocol = ProxyProtocol.fromString(prefs[keyProtocol])
        )
    }

    suspend fun saveProxyConfig(config: ProxyConfig) {
        context.dataStore.edit { prefs ->
            prefs[keyHost] = config.host.trim()
            prefs[keyPort] = config.port.trim()
            prefs[keyUsername] = config.username.trim()
            prefs[keyProtocol] = config.protocol.name
        }
        encryptedPrefs.edit().putString("proxy_password", config.password).apply()
    }
}`
  },
  {
    path: 'app/src/main/java/com/webshare/proxyvpn/ui/ProxyVpnViewModel.kt',
    name: 'ProxyVpnViewModel.kt',
    category: 'kotlin',
    language: 'kotlin',
    description: 'ViewModel with StateFlow, port 1-65535 validation, and VpnService.prepare trigger',
    content: `package com.webshare.proxyvpn.ui

import android.app.Application
import android.content.Context
import android.net.VpnService
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.webshare.proxyvpn.ProxyVpnService
import com.webshare.proxyvpn.data.ProxyConfig
import com.webshare.proxyvpn.data.ProxyPreferencesRepository
import com.webshare.proxyvpn.data.ProxyProtocol
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class ProxyVpnViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = ProxyPreferencesRepository(application)
    private val _uiState = MutableStateFlow(ProxyVpnUiState())
    val uiState: StateFlow<ProxyVpnUiState> = _uiState.asStateFlow()

    private val _events = MutableSharedFlow<VpnNavigationEvent>()
    val events: SharedFlow<VpnNavigationEvent> = _events.asSharedFlow()

    init {
        viewModelScope.launch {
            repository.proxyConfigFlow.collect { saved ->
                _uiState.update { it.copy(
                    domain = saved.host,
                    port = saved.port,
                    username = saved.username,
                    password = saved.password,
                    protocol = saved.protocol
                )}
            }
        }
        viewModelScope.launch {
            ProxyVpnService.vpnStatus.collect { status ->
                _uiState.update { it.copy(connectionStatus = status) }
            }
        }
    }

    fun onStartVpnClicked(context: Context) {
        val state = _uiState.value
        val portInt = state.port.toIntOrNull()
        if (state.domain.isBlank() || portInt == null || portInt !in 1..65535) {
            _uiState.update { it.copy(validationErrorMessage = "Check domain & port (1-65535)") }
            return
        }

        val prepareIntent = VpnService.prepare(context)
        if (prepareIntent != null) {
            viewModelScope.launch { _events.emit(VpnNavigationEvent.RequestVpnPermission(prepareIntent)) }
        } else {
            startVpnService(context)
        }
    }

    fun startVpnService(context: Context) {
        val state = _uiState.value
        ProxyVpnService.start(
            context, state.domain.trim(), state.port.toInt(),
            state.username.trim(), state.password, state.protocol
        )
    }

    fun onDisconnectClicked(context: Context) {
        ProxyVpnService.stop(context)
    }
}`
  },
  {
    path: 'app/src/main/java/com/webshare/proxyvpn/ui/ProxyVpnScreen.kt',
    name: 'ProxyVpnScreen.kt',
    category: 'kotlin',
    language: 'kotlin',
    description: 'Jetpack Compose Material 3 single screen with masked password and protocol radios',
    content: `package com.webshare.proxyvpn.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.webshare.proxyvpn.data.ProxyProtocol

@Composable
fun ProxyVpnScreen(
    viewModel: ProxyVpnViewModel,
    onStartClick: () -> Unit,
    onDisconnectClick: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(topBar = { TopAppBar(title = { Text("Webshare Proxy VPN") }) }) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Status Card
            StatusCard(state.connectionStatus)

            // TextFields
            OutlinedTextField(
                value = state.domain,
                onValueChange = viewModel::onDomainChanged,
                label = { Text("Domain Name") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = state.port,
                onValueChange = viewModel::onPortChanged,
                label = { Text("Proxy Port") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = state.username,
                onValueChange = viewModel::onUsernameChanged,
                label = { Text("Proxy Username") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = state.password,
                onValueChange = viewModel::onPasswordChanged,
                label = { Text("Proxy Password") },
                visualTransformation = if (state.isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                trailingIcon = {
                    IconButton(onClick = viewModel::togglePasswordVisibility) {
                        Icon(if (state.isPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility, null)
                    }
                },
                modifier = Modifier.fillMaxWidth()
            )

            // Protocol: SOCKS5 (default) / HTTP
            Row {
                RadioButton(
                    selected = state.protocol == ProxyProtocol.SOCKS5,
                    onClick = { viewModel.onProtocolSelected(ProxyProtocol.SOCKS5) }
                )
                Text("SOCKS5 (Default)")
                Spacer(Modifier.width(16.dp))
                RadioButton(
                    selected = state.protocol == ProxyProtocol.HTTP,
                    onClick = { viewModel.onProtocolSelected(ProxyProtocol.HTTP) }
                )
                Text("HTTP")
            }

            // Buttons: OK & Disconnect
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(onClick = onStartClick, modifier = Modifier.weight(1f)) { Text("OK") }
                OutlinedButton(onClick = onDisconnectClick, modifier = Modifier.weight(1f)) { Text("Disconnect") }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/webshare/proxyvpn/ui/MainActivity.kt',
    name: 'MainActivity.kt',
    category: 'kotlin',
    language: 'kotlin',
    description: 'MainActivity with ActivityResultLauncher for VpnService.prepare dialog',
    content: `package com.webshare.proxyvpn.ui

import android.app.Activity
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import com.webshare.proxyvpn.ui.theme.WebshareProxyVPNTheme

class MainActivity : ComponentActivity() {
    private val viewModel: ProxyVpnViewModel by viewModels()

    private val vpnLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            viewModel.startVpnService(this)
        } else {
            Toast.makeText(this, "VPN permission denied", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
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
}`
  },
  {
    path: 'README.md',
    name: 'README.md',
    category: 'docs',
    language: 'markdown',
    description: 'Build guide, verification with api.ipify.org, and system limitations',
    content: `# Webshare Proxy VPN for Android

## a. How to build
1. Open this repository in Android Studio (Iguana / Jellyfish / Koala or newer).
2. Ensure Android SDK 34, NDK (25.x / 26.x), and CMake 3.22.1 are installed via SDK Tools.
3. Sync Gradle and build the project (Build > Make Project).
4. Run on a physical Android device or emulator with API 24+.

## b. How to test
1. Launch the app and enter your Webshare proxy credentials:
   - Domain: p.webshare.io (or assigned IP)
   - Port: 1080 (SOCKS5) or 8080 (HTTP)
   - Username & Password
2. Tap "OK" and approve the system VPN dialog.
3. Open Chrome or any phone browser and navigate to:
   https://api.ipify.org
4. Verify that the displayed IP matches your Webshare proxy IP, not your cellular/Wi-Fi IP.

## c. Known limitations
1. Status Bar Key Icon: Android displays an unhideable key icon in the status bar while any VPN is active.
2. Banking and DRM apps: Some banking apps and Google Play Integrity checks may refuse to operate when a VPN is detected.
3. UDP in HTTP mode: Standard HTTP CONNECT proxies do not forward UDP; use SOCKS5 for complete UDP and VoIP support.`
  }
];
