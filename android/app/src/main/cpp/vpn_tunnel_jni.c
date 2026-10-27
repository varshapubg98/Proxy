#include <jni.h>
#include <string.h>
#include <stdlib.h>
#include <android/log.h>
#include "http_proxy_engine.h"

#define TAG "ProxyVpnJni"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

JNIEXPORT jint JNICALL
Java_com_webshare_proxyvpn_TunnelJni_nativeStartTunnel(
        JNIEnv *env,
        jobject thiz,
        jint tun_fd,
        jstring j_host,
        jint port,
        jstring j_username,
        jstring j_password,
        jboolean is_http,
        jstring j_dns_server) {
    (void)thiz;

    const char *host = (*env)->GetStringUTFChars(env, j_host, NULL);
    const char *username = (*env)->GetStringUTFChars(env, j_username, NULL);
    const char *password = (*env)->GetStringUTFChars(env, j_password, NULL);
    const char *dns_server = j_dns_server ? (*env)->GetStringUTFChars(env, j_dns_server, NULL) : NULL;

    LOGI("TunnelJni: Starting native tunnel -> %s:%d (proto: %s, user: %s)",
         host, port, is_http ? "HTTP" : "SOCKS5", username);

    int result = tunnel_start(tun_fd, host, port, username, password, (bool)is_http, dns_server);

    (*env)->ReleaseStringUTFChars(env, j_host, host);
    (*env)->ReleaseStringUTFChars(env, j_username, username);
    (*env)->ReleaseStringUTFChars(env, j_password, password);
    if (dns_server) {
        (*env)->ReleaseStringUTFChars(env, j_dns_server, dns_server);
    }

    return (jint)result;
}

JNIEXPORT void JNICALL
Java_com_webshare_proxyvpn_TunnelJni_nativeStopTunnel(
        JNIEnv *env,
        jobject thiz) {
    (void)env;
    (void)thiz;
    LOGI("TunnelJni: Stopping native tunnel");
    tunnel_stop();
}

JNIEXPORT jlongArray JNICALL
Java_com_webshare_proxyvpn_TunnelJni_nativeGetStats(
        JNIEnv *env,
        jobject thiz) {
    (void)thiz;
    uint64_t tx = 0, rx = 0;
    uint32_t conns = 0;
    tunnel_get_stats(&tx, &rx, &conns);

    jlongArray result = (*env)->NewLongArray(env, 3);
    if (result == NULL) return NULL;

    jlong fill[3];
    fill[0] = (jlong)tx;
    fill[1] = (jlong)rx;
    fill[2] = (jlong)conns;

    (*env)->SetLongArrayRegion(env, result, 0, 3, fill);
    return result;
}
