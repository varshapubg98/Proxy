#ifndef HTTP_PROXY_ENGINE_H
#define HTTP_PROXY_ENGINE_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    char host[256];
    int port;
    char username[128];
    char password[128];
    char dns_server[64];
    int tun_fd;
    bool is_http;
    volatile bool running;
} TunnelConfig;

/**
 * Starts the native proxy tunnel on the provided TUN file descriptor.
 * Routes device traffic through HTTP CONNECT or SOCKS5 with authentication.
 *
 * @return 0 on success, negative error code on failure.
 */
int tunnel_start(int tun_fd,
                 const char *host,
                 int port,
                 const char *username,
                 const char *password,
                 bool is_http,
                 const char *dns_server);

/**
 * Signals running tunnel workers to gracefully terminate and cleans up resources.
 */
void tunnel_stop(void);

/**
 * Retrieves tunnel state and metrics (packets relayed, bytes sent/received).
 */
void tunnel_get_stats(uint64_t *tx_bytes, uint64_t *rx_bytes, uint32_t *active_conns);

#ifdef __cplusplus
}
#endif

#endif // HTTP_PROXY_ENGINE_H
