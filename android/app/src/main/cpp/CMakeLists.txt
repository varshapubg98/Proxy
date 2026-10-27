cmake_minimum_required(VERSION 3.22.1)

project("proxyvpn_tunnel")

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

# Locate Android logging library
find_library(log-lib log)

# Check if hev-socks5-tunnel submodule exists
set(HEV_SOCKS5_DIR "${CMAKE_CURRENT_SOURCE_DIR}/third_party/hev-socks5-tunnel")

if(EXISTS "${HEV_SOCKS5_DIR}/src/main.c")
    message(STATUS "hev-socks5-tunnel submodule detected at: ${HEV_SOCKS5_DIR}")
    include_directories(
        "${HEV_SOCKS5_DIR}/include"
        "${HEV_SOCKS5_DIR}/src"
        "${CMAKE_CURRENT_SOURCE_DIR}"
    )
    add_definitions(-DHAVE_HEV_SUBMODULE=1)
else()
    message(STATUS "Using integrated native tun2socks & HTTP CONNECT proxy engine")
    include_directories("${CMAKE_CURRENT_SOURCE_DIR}")
endif()

add_library(
    proxyvpn_tunnel
    SHARED
    vpn_tunnel_jni.c
    http_proxy_engine.c
)

target_link_libraries(
    proxyvpn_tunnel
    ${log-lib}
)
