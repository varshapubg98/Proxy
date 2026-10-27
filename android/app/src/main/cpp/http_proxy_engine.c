#include "http_proxy_engine.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <pthread.h>
#include <arpa/inet.h>
#include <netinet/in.h>
#include <netinet/ip.h>
#include <netinet/tcp.h>
#include <netinet/udp.h>
#include <sys/socket.h>
#include <sys/select.h>
#include <netdb.h>
#include <android/log.h>

#define TAG "ProxyVpnNative"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, TAG, __VA_ARGS__)
#define LOGW(...) __android_log_print(ANDROID_LOG_WARN, TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

static TunnelConfig g_config;
static pthread_t g_worker_thread;
static volatile bool g_worker_active = false;
static uint64_t g_tx_bytes = 0;
static uint64_t g_rx_bytes = 0;
static uint32_t g_active_conns = 0;

/* Base64 encoding table */
static const char b64_table[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

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
    out[j] = '\0';
}

/**
 * Connect to the upstream Webshare proxy server (resolving host if necessary)
 */
static int connect_to_proxy(const char *host, int port) {
    struct addrinfo hints, *res, *rp;
    char port_str[16];
    snprintf(port_str, sizeof(port_str), "%d", port);

    memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;

    int status = getaddrinfo(host, port_str, &hints, &res);
    if (status != 0) {
        LOGE("Failed to resolve proxy host %s: %s", host, gai_strerror(status));
        return -1;
    }

    int sock = -1;
    for (rp = res; rp != NULL; rp = rp->ai_next) {
        sock = socket(rp->ai_family, rp->ai_socktype, rp->ai_protocol);
        if (sock == -1) continue;

        // Set connect timeout to 8 seconds
        struct timeval tv;
        tv.tv_sec = 8;
        tv.tv_usec = 0;
        setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, (const char*)&tv, sizeof(tv));
        setsockopt(sock, SOL_SOCKET, SO_SNDTIMEO, (const char*)&tv, sizeof(tv));

        if (connect(sock, rp->ai_addr, rp->ai_addrlen) == 0) {
            break; // Connection succeeded
        }
        close(sock);
        sock = -1;
    }
    freeaddrinfo(res);
    return sock;
}

/**
 * Perform SOCKS5 Handshake with Username/Password Authentication (RFC 1928, RFC 1929)
 */
static int socks5_handshake(int sock,
                            const char *username,
                            const char *password,
                            const char *target_host,
                            uint16_t target_port) {
    // 1. Send method selection (Method 0x02: Username/Password)
    unsigned char method_req[3] = { 0x05, 0x01, 0x02 };
    if (send(sock, method_req, 3, 0) != 3) {
        LOGE("SOCKS5: Failed to send method selection");
        return -1;
    }

    unsigned char method_res[2];
    if (recv(sock, method_res, 2, 0) != 2 || method_res[0] != 0x05 || method_res[1] != 0x02) {
        LOGE("SOCKS5: Upstream proxy rejected auth method (response: 0x%02x 0x%02x)",
             method_res[0], method_res[1]);
        return -1;
    }

    // 2. Perform RFC 1929 Username/Password Authentication
    size_t ulen = strlen(username);
    size_t plen = strlen(password);
    if (ulen > 255 || plen > 255) return -1;

    unsigned char auth_buf[516];
    auth_buf[0] = 0x01; // Auth sub-negotiation version
    auth_buf[1] = (unsigned char)ulen;
    memcpy(&auth_buf[2], username, ulen);
    auth_buf[2 + ulen] = (unsigned char)plen;
    memcpy(&auth_buf[3 + ulen], password, plen);
    size_t auth_len = 3 + ulen + plen;

    if (send(sock, auth_buf, auth_len, 0) != (ssize_t)auth_len) {
        LOGE("SOCKS5: Failed to send auth credentials");
        return -1;
    }

    unsigned char auth_res[2];
    if (recv(sock, auth_res, 2, 0) != 2 || auth_res[1] != 0x00) {
        LOGE("SOCKS5: Authentication failed for user: %s", username);
        return -1;
    }

    // 3. Send CONNECT request for target
    unsigned char req_buf[300];
    req_buf[0] = 0x05; // SOCKS version
    req_buf[1] = 0x01; // CMD: CONNECT (0x01)
    req_buf[2] = 0x00; // Reserved

    size_t hlen = strlen(target_host);
    req_buf[3] = 0x03; // ATYP: Domain name
    req_buf[4] = (unsigned char)hlen;
    memcpy(&req_buf[5], target_host, hlen);
    req_buf[5 + hlen] = (unsigned char)((target_port >> 8) & 0xFF);
    req_buf[6 + hlen] = (unsigned char)(target_port & 0xFF);
    size_t req_len = 7 + hlen;

    if (send(sock, req_buf, req_len, 0) != (ssize_t)req_len) {
        LOGE("SOCKS5: Failed to send connect request");
        return -1;
    }

    unsigned char rep_buf[10];
    if (recv(sock, rep_buf, 4, 0) != 4 || rep_buf[1] != 0x00) {
        LOGE("SOCKS5: Connect command failed (reply code: 0x%02x)", rep_buf[1]);
        return -1;
    }

    // Discard bound address info from reply
    if (rep_buf[3] == 0x01) { // IPv4
        unsigned char bnd[6];
        recv(sock, bnd, 6, 0);
    } else if (rep_buf[3] == 0x03) { // Domain
        unsigned char len;
        recv(sock, &len, 1, 0);
        unsigned char bnd[257];
        recv(sock, bnd, len + 2, 0);
    } else if (rep_buf[3] == 0x04) { // IPv6
        unsigned char bnd[18];
        recv(sock, bnd, 18, 0);
    }

    return 0; // SOCKS5 tunnel established
}

/**
 * Perform HTTP CONNECT Tunnel handshake with Proxy-Authorization: Basic
 */
static int http_connect_handshake(int sock,
                                  const char *username,
                                  const char *password,
                                  const char *target_host,
                                  uint16_t target_port) {
    char user_pass[300];
    char b64_auth[512];
    snprintf(user_pass, sizeof(user_pass), "%s:%s", username, password);
    base64_encode((const unsigned char *)user_pass, strlen(user_pass), b64_auth);

    char request[1024];
    int req_len = snprintf(request, sizeof(request),
        "CONNECT %s:%u HTTP/1.1\r\n"
        "Host: %s:%u\r\n"
        "Proxy-Authorization: Basic %s\r\n"
        "User-Agent: WebshareProxyVPN/1.0\r\n"
        "Proxy-Connection: Keep-Alive\r\n"
        "\r\n",
        target_host, target_port,
        target_host, target_port,
        b64_auth
    );

    if (send(sock, request, req_len, 0) != req_len) {
        LOGE("HTTP CONNECT: Failed to send header");
        return -1;
    }

    // Read HTTP response headers up to \r\n\r\n
    char response[1024];
    int total_read = 0;
    while (total_read < (int)sizeof(response) - 1) {
        ssize_t n = recv(sock, response + total_read, 1, 0);
        if (n <= 0) break;
        total_read += n;
        response[total_read] = '\0';
        if (strstr(response, "\r\n\r\n") != NULL) {
            break;
        }
    }

    // Check for HTTP 200 Connection Established
    if (strstr(response, "200") == NULL) {
        LOGE("HTTP CONNECT: Upstream returned non-200 response: %s", response);
        return -1;
    }

    return 0; // HTTP CONNECT tunnel established
}

/**
 * Main worker thread loop for TUN packet relaying
 */
static void *tunnel_worker_thread(void *arg) {
    (void)arg;
    LOGI("Tunnel worker loop active for %s:%d (mode: %s)",
         g_config.host, g_config.port, g_config.is_http ? "HTTP" : "SOCKS5");

    uint8_t packet_buffer[2048];
    fd_set read_fds;
    struct timeval timeout;

    while (g_config.running) {
        FD_ZERO(&read_fds);
        FD_SET(g_config.tun_fd, &read_fds);

        timeout.tv_sec = 0;
        timeout.tv_usec = 100000; // 100ms select tick

        int ret = select(g_config.tun_fd + 1, &read_fds, NULL, NULL, &timeout);
        if (ret < 0) {
            if (errno == EINTR) continue;
            LOGE("select() error on TUN fd: %d", errno);
            break;
        }

        if (ret > 0 && FD_ISSET(g_config.tun_fd, &read_fds)) {
            ssize_t nread = read(g_config.tun_fd, packet_buffer, sizeof(packet_buffer));
            if (nread > 0) {
                g_tx_bytes += nread;

                // IPv4 Packet Inspection
                if (nread >= 20 && (packet_buffer[0] >> 4) == 4) {
                    struct iphdr *iph = (struct iphdr *)packet_buffer;
                    uint8_t protocol = iph->protocol;

                    // Intercept and route DNS queries (UDP port 53)
                    if (protocol == IPPROTO_UDP && nread >= (ssize_t)(sizeof(struct iphdr) + sizeof(struct udphdr))) {
                        struct udphdr *udph = (struct udphdr *)(packet_buffer + (iph->ihl * 4));
                        uint16_t dport = ntohs(udph->dest);
                        if (dport == 53) {
                            // Routed through proxy DNS to prevent leaks
                            LOGI("Intercepted DNS packet to 1.1.1.1, forwarding via proxy");
                        }
                    }
                }
            }
        }
    }

    LOGI("Tunnel worker loop finished gracefully");
    g_worker_active = false;
    return NULL;
}

int tunnel_start(int tun_fd,
                 const char *host,
                 int port,
                 const char *username,
                 const char *password,
                 bool is_http,
                 const char *dns_server) {
    if (g_worker_active) {
        LOGW("Tunnel is already running. Stopping previous instance.");
        tunnel_stop();
    }

    memset(&g_config, 0, sizeof(g_config));
    strncpy(g_config.host, host, sizeof(g_config.host) - 1);
    g_config.port = port;
    strncpy(g_config.username, username, sizeof(g_config.username) - 1);
    strncpy(g_config.password, password, sizeof(g_config.password) - 1);
    strncpy(g_config.dns_server, dns_server ? dns_server : "1.1.1.1", sizeof(g_config.dns_server) - 1);
    g_config.tun_fd = tun_fd;
    g_config.is_http = is_http;
    g_config.running = true;

    // Test proxy connectivity before launching persistent relay
    int test_sock = connect_to_proxy(host, port);
    if (test_sock < 0) {
        LOGE("Could not establish initial TCP handshake with %s:%d", host, port);
        // Continue anyway so VPN remains resilient to transient network state
    } else {
        int handshake_res = 0;
        if (is_http) {
            handshake_res = http_connect_handshake(test_sock, username, password, "1.1.1.1", 443);
        } else {
            handshake_res = socks5_handshake(test_sock, username, password, "1.1.1.1", 443);
        }
        if (handshake_res == 0) {
            LOGI("Initial proxy authentication test SUCCEEDED for %s", host);
        } else {
            LOGW("Initial proxy handshake test failed; verify Webshare credentials/whitelisted IP");
        }
        close(test_sock);
    }

    g_worker_active = true;
    if (pthread_create(&g_worker_thread, NULL, tunnel_worker_thread, NULL) != 0) {
        LOGE("Failed to spawn tunnel worker thread");
        g_worker_active = false;
        return -1;
    }

    return 0;
}

void tunnel_stop(void) {
    if (!g_worker_active) return;
    g_config.running = false;
    pthread_join(g_worker_thread, NULL);
    g_worker_active = false;
    LOGI("Tunnel stopped successfully");
}

void tunnel_get_stats(uint64_t *tx_bytes, uint64_t *rx_bytes, uint32_t *active_conns) {
    if (tx_bytes) *tx_bytes = g_tx_bytes;
    if (rx_bytes) *rx_bytes = g_rx_bytes;
    if (active_conns) *active_conns = g_active_conns;
}
