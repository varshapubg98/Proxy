import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Download,
  Copy,
  Check,
  FolderTree,
  Terminal,
  Smartphone,
  BookOpen,
  Info,
  Server,
  Key,
  Globe,
  Radio,
  ExternalLink,
  ChevronRight,
  Eye,
  EyeOff,
  AlertTriangle,
  FileCode,
  FileText,
  Activity,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ANDROID_FILES, AndroidFile } from './androidFiles';

type ActiveTab = 'simulator' | 'code' | 'architecture' | 'guide';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(ANDROID_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Android Simulated State (MVVM replication)
  const [domain, setDomain] = useState('p.webshare.io');
  const [port, setPort] = useState('1080');
  const [username, setUsername] = useState('webshare_user_demo');
  const [password, setPassword] = useState('supersecret123');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [protocol, setProtocol] = useState<'SOCKS5' | 'HTTP'>('SOCKS5');

  // VPN Connection Status: 'disconnected' | 'permission_dialog' | 'connecting' | 'connected' | 'error'
  const [vpnState, setVpnState] = useState<'disconnected' | 'permission_dialog' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Copy code helper
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ZIP Downloader for the complete Android Project
  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const zip = new JSZip();

      // Root files
      zip.file('README.md', ANDROID_FILES.find(f => f.name === 'README.md')?.content || '');
      zip.file('build.gradle.kts', `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}`);
      zip.file('settings.gradle.kts', `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "WebshareProxyVPN"
include(":app")`);
      zip.file('gradle.properties', `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official`);
      zip.file('.gitignore', `*.iml
.gradle
/local.properties
/.idea/caches
/.idea/libraries
/.idea/modules.xml
/.idea/workspace.xml
/.idea/navEditor.xml
/.idea/assetWizardSettings.xml
.DS_Store
/build
/captures
.externalNativeBuild
.cxx
local.properties`);

      // Add all project files into respective folders
      ANDROID_FILES.forEach(file => {
        if (file.name !== 'README.md') {
          zip.file(file.path, file.content);
        }
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'WebshareProxyVPN-Android.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to create ZIP', e);
    } finally {
      setDownloadingZip(false);
    }
  };

  // Validate and Trigger VPN start (Behavior on "OK")
  const handleStartVpn = () => {
    setValidationError(null);

    // 1. Validate fields
    if (!domain.trim()) {
      setValidationError('Domain Name cannot be empty');
      return;
    }

    const portNum = parseInt(port.trim(), 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setValidationError('Proxy Port must be a valid number between 1 and 65535');
      return;
    }

    // 2. Call VpnService.prepare(context) -> open permission dialog
    setVpnState('permission_dialog');
  };

  // User accepts Android system permission dialog
  const handleAcceptVpnPermission = () => {
    setVpnState('connecting');
    setTimeout(() => {
      setVpnState('connected');
    }, 1200);
  };

  // User declines permission
  const handleDeclineVpnPermission = () => {
    setVpnState('error');
    setErrorMessage('VPN permission denied by user');
  };

  // Disconnect button
  const handleDisconnect = () => {
    setVpnState('disconnected');
    setValidationError(null);
  };

  // Quick preset loader
  const loadPreset = (proto: 'SOCKS5' | 'HTTP') => {
    setProtocol(proto);
    setDomain('p.webshare.io');
    setPort(proto === 'SOCKS5' ? '1080' : '8080');
    setValidationError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base sm:text-lg text-white">Webshare Proxy VPN</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Android 14 (API 34)
                </span>
                <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Jetpack Compose & NDK
                </span>
              </div>
              <p className="text-xs text-slate-400">Routes 100% of device traffic through authenticated SOCKS5/HTTP tunnel</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleDownloadZip}
              disabled={downloadingZip}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-medium transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingZip ? 'Packing...' : 'Download Project (.zip)'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-6 border-t border-slate-800/80 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-3 flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'simulator'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Interactive Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'code'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Project Files ({ANDROID_FILES.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3 flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'architecture'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tunnel Architecture</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'guide'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Build & Test Guide</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* TAB 1: INTERACTIVE SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Interactive Phone Bezel */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-[360px] sm:w-[380px] bg-slate-900 rounded-[44px] p-4 shadow-2xl border-4 border-slate-700/80 ring-1 ring-slate-800 relative">
                {/* Phone Speaker & Camera Notch */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full flex items-center justify-center space-x-2 z-30">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                  <div className="w-12 h-1 bg-slate-800 rounded-full" />
                </div>

                {/* Inner Screen */}
                <div className="bg-slate-950 rounded-[34px] overflow-hidden border border-slate-800 min-h-[640px] flex flex-col relative text-slate-100 font-sans">
                  {/* Android Status Bar */}
                  <div className="h-10 pt-3 px-5 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-900 bg-slate-950 select-none">
                    <span className="font-semibold text-slate-300">09:41</span>
                    <div className="flex items-center space-x-2">
                      {vpnState === 'connected' && (
                        <span className="flex items-center space-x-0.5 text-emerald-400 font-medium">
                          <Key className="w-3 h-3" />
                          <span>VPN</span>
                        </span>
                      )}
                      <span>5G</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Material 3 TopAppBar */}
                  <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    <span className="font-bold text-sm tracking-wide text-white">Webshare Proxy VPN</span>
                  </div>

                  {/* Android Active Notification simulation (when connected) */}
                  {vpnState === 'connected' && (
                    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs animate-in fade-in">
                      <div className="flex items-center space-x-2">
                        <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-white">Proxy VPN active</div>
                          <div className="text-[10px] text-slate-400">Connected to {domain}:{port}</div>
                        </div>
                      </div>
                      <button
                        onClick={handleDisconnect}
                        className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}

                  {/* Scrollable Compose Screen Content */}
                  <div className="p-4 flex-1 overflow-y-auto space-y-4">
                    {/* Status Card */}
                    <div
                      className={`p-3.5 rounded-2xl border transition-all ${
                        vpnState === 'connected'
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : vpnState === 'connecting'
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                          : vpnState === 'error'
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            vpnState === 'connected'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : vpnState === 'connecting'
                              ? 'bg-amber-500/20 text-amber-400 animate-spin'
                              : vpnState === 'error'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {vpnState === 'connected' ? (
                            <ShieldCheck className="w-5 h-5" />
                          ) : vpnState === 'connecting' ? (
                            <Activity className="w-5 h-5" />
                          ) : vpnState === 'error' ? (
                            <ShieldAlert className="w-5 h-5" />
                          ) : (
                            <Shield className="w-5 h-5" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">VPN Status</div>
                          <div className="text-xs font-bold truncate">
                            {vpnState === 'connected' && `Connected via ${domain}:${port}`}
                            {vpnState === 'connecting' && 'Connecting...'}
                            {vpnState === 'disconnected' && 'Disconnected'}
                            {vpnState === 'error' && (errorMessage || 'Connection failed')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Compose Input Card */}
                    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-3">
                      <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                        Proxy Server Settings
                      </div>

                      {/* Domain Name */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">Domain Name</label>
                        <div className="relative">
                          <Globe className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="p.webshare.io or proxy IP"
                            className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Proxy Port */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">Proxy Port</label>
                        <div className="relative">
                          <Server className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="number"
                            min="1"
                            max="65535"
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            placeholder="1-65535 (1080 default)"
                            className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Proxy Username */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">Proxy Username</label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Webshare username / token"
                          className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                      </div>

                      {/* Proxy Password (Masked with toggle) */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">Proxy Password</label>
                        <div className="relative">
                          <input
                            type={isPasswordVisible ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Webshare password"
                            className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                          >
                            {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Encrypted at rest using AES-256 GCM MasterKey
                        </span>
                      </div>

                      {/* Protocol Selection: SOCKS5 (default) / HTTP */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1.5">Protocol</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setProtocol('SOCKS5')}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-medium transition ${
                              protocol === 'SOCKS5'
                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name="proto"
                              checked={protocol === 'SOCKS5'}
                              onChange={() => setProtocol('SOCKS5')}
                              className="accent-indigo-500"
                            />
                            <span>SOCKS5 (Default)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setProtocol('HTTP')}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-medium transition ${
                              protocol === 'HTTP'
                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name="proto"
                              checked={protocol === 'HTTP'}
                              onChange={() => setProtocol('HTTP')}
                              className="accent-indigo-500"
                            />
                            <span>HTTP CONNECT</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Inline Validation error */}
                    {validationError && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{validationError}</span>
                      </div>
                    )}

                    {/* Action Buttons: OK and Disconnect */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={handleStartVpn}
                        disabled={vpnState === 'connecting'}
                        className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs tracking-wider transition shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-1.5"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>OK (START)</span>
                      </button>

                      <button
                        onClick={handleDisconnect}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-semibold text-xs border border-slate-700 transition flex items-center justify-center space-x-1.5"
                      >
                        <span>DISCONNECT</span>
                      </button>
                    </div>

                    {/* Webshare Quick Presets */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-medium">
                        Quick Webshare Credentials Presets:
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => loadPreset('SOCKS5')}
                          className="flex-1 text-[10px] py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800"
                        >
                          SOCKS5 (:1080)
                        </button>
                        <button
                          onClick={() => loadPreset('HTTP')}
                          className="flex-1 text-[10px] py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800"
                        >
                          HTTP (:8080)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Android System VPN Permission Dialog Modal */}
                  {vpnState === 'permission_dialog' && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl max-w-xs w-full space-y-3">
                        <div className="flex items-center space-x-2 text-indigo-400">
                          <Key className="w-5 h-5" />
                          <h4 className="font-bold text-sm text-white">Connection request</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          <strong>Webshare Proxy VPN</strong> wants to set up a VPN connection that allows it to monitor
                          network traffic. Only accept if you trust the source.
                        </p>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                          <Key className="w-3 h-3 text-emerald-400" />
                          <span>Key icon appears at top of screen while VPN is active.</span>
                        </div>
                        <div className="flex justify-end space-x-2 pt-2">
                          <button
                            onClick={handleDeclineVpnPermission}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAcceptVpnPermission}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Technical Highlights & Testing Helper */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: State & Traffic Routing Inspection */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-base text-white">Live Android VpnService Runtime Status</h3>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      vpnState === 'connected'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {vpnState === 'connected' ? 'TUN ACTIVE' : 'IDLE'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Virtual TUN IP</span>
                    <span className="font-mono text-indigo-300 font-semibold">10.0.0.2 / 32</span>
                  </div>
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Routed Subnet</span>
                    <span className="font-mono text-emerald-300 font-semibold">0.0.0.0 / 0</span>
                  </div>
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">DNS Upstream</span>
                    <span className="font-mono text-amber-300 font-semibold">1.1.1.1 (Proxied)</span>
                  </div>
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Tunnel Engine</span>
                    <span className="font-mono text-purple-300 font-semibold">
                      {protocol === 'SOCKS5' ? 'tun2socks C' : 'HTTP CONNECT'}
                    </span>
                  </div>
                </div>

                {/* Simulated Verification */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Device Browser IP Verification (https://api.ipify.org):</span>
                    <a
                      href="https://api.ipify.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                    >
                      <span>Open External</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg font-mono text-xs flex items-center justify-between">
                    <span className="text-slate-400">Public IP Reported to Websites:</span>
                    <span
                      className={`font-bold ${
                        vpnState === 'connected' ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {vpnState === 'connected'
                        ? '185.191.126.42 (Webshare Proxy)'
                        : 'Real ISP / Cellular IP'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Prompt Requirements Checklist */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Specification Conformance Checklist</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Kotlin + Jetpack Compose (Material 3)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Min SDK 24, Target SDK 34 pinned in TOML</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Routes 0.0.0.0/0 device traffic</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>SOCKS5 (default) & HTTP with User/Pass Auth</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>addDisallowedApplication prevents loopback</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>VpnService.prepare with ActivityResultLauncher</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>foregroundServiceType="specialUse" notification</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>EncryptedSharedPreferences (AES-256 GCM)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CODE EXPLORER */}
        {activeTab === 'code' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* File List Column */}
            <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Project Files</span>
                <span className="text-xs text-indigo-400 font-mono">{ANDROID_FILES.length} files</span>
              </div>

              <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
                {ANDROID_FILES.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition flex items-center justify-between ${
                      selectedFile.path === file.path
                        ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-300 font-semibold'
                        : 'bg-slate-950/40 hover:bg-slate-800 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      {file.category === 'kotlin' ? (
                        <FileCode className="w-4 h-4 text-purple-400 shrink-0" />
                      ) : file.category === 'cpp' ? (
                        <Terminal className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : file.category === 'manifest' ? (
                        <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : file.category === 'docs' ? (
                        <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate font-mono">{file.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                      {file.language}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Code Viewer Column */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
              {/* Header */}
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-indigo-400 font-semibold">{selectedFile.path}</div>
                  <div className="text-[11px] text-slate-400">{selectedFile.description}</div>
                </div>

                <button
                  onClick={() => handleCopyCode(selectedFile.content)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              {/* Code Pre Block */}
              <div className="p-4 overflow-x-auto overflow-y-auto max-h-[580px] bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed">
                <pre>{selectedFile.content}</pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ARCHITECTURE */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>How Full-Device Proxy VPN Routing Works</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Android does not natively tunnel raw device sockets into an authenticated SOCKS5/HTTP proxy.
                  Here is how the TUN virtual interface and tun2socks engine bridge this gap:
                </p>
              </div>

              {/* Flow Steps */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                    1
                  </div>
                  <h4 className="font-semibold text-xs text-white">TUN Interface Setup</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    VpnService creates a Linux network device with IP <code className="text-indigo-300">10.0.0.2/32</code> and route <code className="text-indigo-300">0.0.0.0/0</code>.
                    All IP traffic generated by device apps is trapped into this TUN file descriptor.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                    2
                  </div>
                  <h4 className="font-semibold text-xs text-white">Loopback Prevention</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <code className="text-emerald-300">addDisallowedApplication(packageName)</code> tells the Linux kernel to bypass the VPN for this app, allowing its own TCP connection to Webshare to establish without looping.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs">
                    3
                  </div>
                  <h4 className="font-semibold text-xs text-white">JNI tun2socks Relay</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    The native C engine reads raw IP packets from the TUN fd, constructs TCP streams, and handshakes with Webshare via SOCKS5 (RFC 1928/1929) or HTTP CONNECT (Basic base64 auth).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                    4
                  </div>
                  <h4 className="font-semibold text-xs text-white">DNS Leak Protection</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    TUN declares DNS server <code className="text-amber-300">1.1.1.1</code>. Outgoing UDP port 53 packets are captured and proxied so local carrier DNS is never contacted.
                  </p>
                </div>
              </div>

              {/* Protocol Comparison Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Feature</th>
                      <th className="p-3">SOCKS5 Protocol (Default)</th>
                      <th className="p-3">HTTP CONNECT Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                    <tr>
                      <td className="p-3 font-medium">Default Port</td>
                      <td className="p-3 font-mono text-indigo-400">1080</td>
                      <td className="p-3 font-mono text-purple-400">8080 / 9999</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Authentication Mechanism</td>
                      <td className="p-3">RFC 1929 Sub-negotiation (0x01 ulen/plen)</td>
                      <td className="p-3">Proxy-Authorization: Basic base64(user:pass)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">UDP Support</td>
                      <td className="p-3 text-emerald-400 font-semibold">Yes (UDP Associate / UDP over TCP)</td>
                      <td className="p-3 text-amber-400">TCP only (DNS proxied via TCP)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Best For</td>
                      <td className="p-3">Full device traffic, gaming, streaming, browsing</td>
                      <td className="p-3">Web browsing, HTTPS, corporate networks</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BUILD & TEST GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <span>Build, Run, and Verification Guide</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Step-by-step instructions for Android Studio, real device deployment, and IP testing.
                </p>
              </div>

              {/* Section a: How to build */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-indigo-300 flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">A</span>
                  <span>How to Build (Android Studio, NDK, and CMake)</span>
                </h4>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                  <p>1. Open Android Studio (Iguana, Jellyfish, Koala or newer) and select <strong>Open</strong> on the project folder.</p>
                  <p>2. Open <strong>Tools &gt; SDK Manager &gt; SDK Tools</strong> tab and check:</p>
                  <ul className="list-disc list-inside pl-3 space-y-1 text-slate-400">
                    <li><strong>NDK (Side by side)</strong> (version 25.x or 26.x)</li>
                    <li><strong>CMake</strong> (version 3.22.1)</li>
                    <li><strong>Android SDK Platform 34</strong></li>
                  </ul>
                  <p>3. Let Gradle Sync complete automatically using <code className="text-indigo-300">gradle/libs.versions.toml</code>.</p>
                  <p>4. Build the project using <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700">Build &gt; Make Project</kbd> (Ctrl+F9 / Cmd+F9).</p>
                  <p>5. Run on an Android device or emulator running API 24 to 34.</p>
                </div>
              </div>

              {/* Section b: How to test */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-emerald-300 flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">B</span>
                  <span>How to Test with https://api.ipify.org</span>
                </h4>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                  <p>1. In the app UI, input your Webshare domain (e.g. <code className="text-emerald-300">p.webshare.io</code>), port (<code className="text-emerald-300">1080</code> for SOCKS5, <code className="text-emerald-300">8080</code> for HTTP), username, and password.</p>
                  <p>2. Tap <strong>OK</strong> and grant the system VPN permission dialog.</p>
                  <p>3. Ensure the status turns to <strong className="text-emerald-400">Connected via p.webshare.io:1080</strong> and the key icon appears in the Android status bar.</p>
                  <p>4. Launch Google Chrome or Firefox on the phone and navigate to:</p>
                  <div className="p-2.5 bg-slate-900 rounded font-mono text-indigo-300 text-xs flex items-center justify-between">
                    <span>https://api.ipify.org</span>
                    <a
                      href="https://api.ipify.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                    >
                      <span>Visit</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-emerald-300 font-semibold">
                    ✓ The browser must display your Webshare proxy IP, NOT your real cellular or Wi-Fi provider IP!
                  </p>
                </div>
              </div>

              {/* Section c: Known limitations */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-amber-300 flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">C</span>
                  <span>Known Limitations & Android System Behaviors</span>
                </h4>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                  <p><strong>1. Android System VPN Icon:</strong> Android displays an unhideable Key icon in the status bar whenever any VpnService is active. This is an intentional Android OS security design.</p>
                  <p><strong>2. Banking & DRM Applications:</strong> Certain banking apps and Google Play Integrity services detect active VPN tunnels (<code className="text-amber-300">NET_CAPABILITY_NOT_VPN</code>) and may refuse to open or prompt re-authentication.</p>
                  <p><strong>3. HTTP Mode UDP Limitation:</strong> Standard HTTP CONNECT proxies do not forward raw UDP packets. Use SOCKS5 if your apps rely on VoIP, Discord voice, or UDP gaming.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Webshare Proxy VPN • Kotlin • Jetpack Compose Material 3 • Android SDK 24-34 • NDK CMake tun2socks
      </footer>
    </div>
  );
}
