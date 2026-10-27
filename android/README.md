# Webshare Proxy VPN for Android (Kotlin + Jetpack Compose)

A production-grade Android application built with **Kotlin**, **Jetpack Compose (Material 3)**, and an **NDK/CMake native tun2socks engine** that routes **all device network traffic** through an authenticated **SOCKS5** (default) or **HTTP CONNECT** proxy (such as Webshare.io).

---

## Architecture Overview

```text
       ┌────────────────────────────────────────────────────────┐
       │                   Android Device Apps                  │
       │     (Chrome, YouTube, Social Media, Background Apps)   │
       └───────────────────────────┬────────────────────────────┘
                                   │ Raw IP Packets (0.0.0.0/0)
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │             Linux Kernel TUN Virtual Device            │
       │    VpnService.Builder: 10.0.0.2/32, MTU 1500, DNS 1.1.1.1│
       └───────────────────────────┬────────────────────────────┘
                                   │ ParcelFileDescriptor (FD)
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │               Native C/C++ Engine (JNI)                │
       │      • SOCKS5 Mode: RFC 1928 + RFC 1929 Auth           │
       │      • HTTP Mode: HTTP CONNECT + Basic Auth Header     │
       │      • DNS Leak Protection: UDP 53 routed via tunnel   │
       └───────────────────────────┬────────────────────────────┘
                                   │ Outbound Proxy Socket
                                   │ (addDisallowedApplication prevents loopback)
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │       Webshare.io Proxy Server (p.webshare.io)         │
       │        SOCKS5 Port 1080  |  HTTP Port 8080/9999        │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
                            Target Websites
```

### Key Technical Details
1. **Loopback Prevention**: `VpnService.Builder().addDisallowedApplication(packageName)` ensures the app's own TCP connection to the Webshare proxy server bypasses the VPN routing table.
2. **Foreground Service Special Use**: Conforms to Android 14+ (Target SDK 34) requirements with `foregroundServiceType="specialUse"` and the required `PROPERTY_SPECIAL_USE_FGS_SUBTYPE` in `AndroidManifest.xml`.
3. **Security & Credentials**:
   - Host, port, username, and protocol are persisted using **Jetpack DataStore Preferences**.
   - Passwords are encrypted using **AndroidX EncryptedSharedPreferences** (`MasterKey` with AES-256 GCM).
4. **DNS Leak Prevention**: The TUN interface declares `addDnsServer("1.1.1.1")`, and UDP port 53 packets are intercepted and routed through the proxy tunnel.

---

## a. How to Build

### Prerequisites
1. **Android Studio Iguana | Jellyfish | Koala** (or newer).
2. **Android SDK 34** installed (Tools > SDK Manager).
3. **NDK (Side by side)** version `25.2.9519653` or `26.x` and **CMake** `3.22.1` installed via:
   - Android Studio > Settings / Preferences > Appearance & Behavior > System Settings > Android SDK > **SDK Tools** tab
   - Check **NDK (Side by side)** and **CMake**
   - Click **Apply**
4. (Optional) If you want to use the upstream `hev-socks5-tunnel` git submodule:
   ```bash
   git submodule add https://github.com/heiher/hev-socks5-tunnel app/src/main/cpp/third_party/hev-socks5-tunnel
   git submodule update --init --recursive
   ```
   *Note: The project includes a self-contained, native C engine in `app/src/main/cpp/` that compiles and runs immediately out of the box without external submodules.*

### Build Steps
1. **Open Project**: Launch Android Studio and choose **Open**, then select the project root folder.
2. **Gradle Sync**: Android Studio will automatically invoke Gradle Sync. Ensure all dependencies from `gradle/libs.versions.toml` resolve successfully.
3. **Select Build Variant**: Choose `debug` or `release` from the Build Variants tab.
4. **Build APK**:
   - Menu: `Build` > `Make Project` (Ctrl+F9 / Cmd+F9)
   - Or to assemble APK: `Build` > `Build App Bundle(s) / APK(s)` > `Build APK(s)`.
5. **Run on Device / Emulator**:
   - Connect an Android device (API 24 to API 34) with USB Debugging enabled (or start an Android Emulator with Google Play Services).
   - Click the green **Run 'app'** button (Shift+F10 / Control+R).

---

## b. How to Test

1. **Launch App**: Open **Webshare Proxy VPN** on your device.
2. **Fill in Webshare Proxy Details**:
   - **Domain Name**: Enter `p.webshare.io` (or your assigned Webshare proxy IP, e.g. `45.xxx.xxx.xxx`).
   - **Proxy Port**: Enter `1080` (for SOCKS5) or `8080` (for HTTP).
   - **Proxy Username**: Your Webshare username (or sub-user token).
   - **Proxy Password**: Your Webshare proxy password (use the eye icon to verify).
   - **Protocol**: Select `SOCKS5` (default) or `HTTP`.
3. **Start VPN**:
   - Tap the **OK** button.
   - On the first run, Android presents the standard system dialog:
     > *"Webshare Proxy VPN wants to set up a VPN connection that allows it to monitor network traffic. Only accept if you trust the source."*
   - Tap **OK / Accept**.
4. **Verify Status**:
   - The status changes to **Connecting...** and then **Connected via p.webshare.io:1080**.
   - A persistent system notification titled **"Proxy VPN active"** appears in the notification drawer with a **"Disconnect"** action button.
   - A key icon appears in the Android status bar.
5. **Verify IP Routing**:
   - Open Chrome, Firefox, or any phone browser.
   - Navigate to **[https://api.ipify.org](https://api.ipify.org)** or **[https://ipv4.icanhazip.com](https://ipv4.icanhazip.com)**.
   - **Expected Result**: The IP address displayed in the browser **MUST match your Webshare proxy IP**, NOT your cellular or Wi-Fi provider's real IP!
6. **Verify DNS Leak Protection**:
   - Visit **[https://ipleak.net](https://ipleak.net)**.
   - Verify that your DNS requests resolve through Cloudflare / proxy DNS rather than your local ISP.
7. **Disconnect**:
   - Tap **"Disconnect"** either inside the app UI or directly from the persistent notification.
   - Verify that your original IP address is restored.

---

## c. Known Limitations & Android System Behaviors

1. **Status Bar Key Icon**:
   - Android enforces a prominent **Key icon** in the status bar whenever any `VpnService` is active. This is an intentional Android OS security design to alert the user that network traffic is routed through a virtual interface; third-party apps cannot hide or remove this icon.
2. **Banking, Financial & DRM Apps**:
   - Certain banking apps, payment gateways, and streaming services (e.g., Netflix, banking portals) employ anti-fraud or VPN detection (checking `NetworkCapabilities.NET_CAPABILITY_NOT_VPN` or SafetyNet / Play Integrity). These apps may display warnings or refuse to operate while a VPN is connected.
3. **Google Services & Captchas**:
   - Datacenter proxy IPs (like standard Webshare shared pools) may trigger Google reCAPTCHA challenges in Google Search or Play Store until residential or clean rotating proxy IPs are used.
4. **IPv6 Traffic**:
   - The TUN interface routes `0.0.0.0/0` (IPv4). If your mobile carrier strictly uses IPv6-only (without NAT64/DNS64), configure IPv6 routing or disable IPv6 in your mobile APN if necessary.
5. **UDP Traffic in HTTP Mode**:
   - Standard HTTP CONNECT proxies do not natively support UDP forwarding. In HTTP mode, TCP traffic and DNS queries are proxied. For full UDP game and VoIP forwarding, use the default **SOCKS5** protocol.
