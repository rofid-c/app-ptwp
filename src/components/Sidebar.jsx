"use client";

import React from "react";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Wallet,
  Settings,
  ShieldCheck,
  Sun,
  Moon,
  X,
  Building2,
} from "lucide-react";

export default function Sidebar({
  activeTab = "dashboard",
  setActiveTab,
  mobileOpen = false,
  setMobileOpen,
  currentUser,
  onOpenAuth,
  onOpenSettings,
  onOpenProfile,
  totalMembersCount = 0,
  theme = "light",
  onToggleTheme,
}) {
  const isSuper =
    currentUser?.role === "super_admin" ||
    currentUser?.username?.toLowerCase() === "aku admin";

  const isPTA = Boolean(
    (currentUser?.satker || "").toLowerCase().includes("tinggi") ||
    (currentUser?.satker || "").toLowerCase().includes("pta")
  );

  const navItems = isSuper
    ? [
        {
          id: "admin",
          label: "Portal Admin",
          icon: ShieldCheck,
        },
      ]
    : [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        ...(isPTA
          ? [
              {
                id: "monitoring",
                label: "Monitoring Cabang",
                icon: Building2,
              },
            ]
          : []),
        {
          id: "dues",
          label: "Rekap Iuran",
          icon: FileSpreadsheet,
          badge: totalMembersCount > 0 ? `${totalMembersCount}` : null,
        },
        {
          id: "cashbook",
          label: "Buku Kas",
          icon: Wallet,
        },
      ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (setMobileOpen) setMobileOpen(false);
  };

  const satkerShort = currentUser?.satker
    ? currentUser.satker
        .replace("Pengadilan Agama", "PA")
        .replace("Pengadilan Tinggi Agama", "PTA")
    : "PA Gunung Sugih";

  return (
    <>
      {/* =========================================================================
          DESKTOP FLOATING CAPSULE DOCK (Clean Tabung Docking di Pinggir Kiri)
          ========================================================================= */}
      <aside className="stitch-desktop-dock" aria-label="Navigasi Utama">
        {/* TOP: Brand Logo & Sun/Moon Toggle */}
        <div className="dock-top-group">
          {/* Circular Brand Icon */}
          <button
            type="button"
            className="dock-brand-circle"
            onClick={() => handleSelectTab("dashboard")}
            aria-label="PTWP Brand Logo"
          >
            <img
              src="/logo-ptwp.png"
              alt="Logo PTWP"
              className="dock-brand-img"
              width={40}
              height={40}
            />
            <span className="dock-tooltip">
              {isSuper ? "PTWP PUSAT" : isPTA ? "PTWP DAERAH PTA" : `PTWP Cabang ${satkerShort}`}
            </span>
          </button>

          {/* Mini Theme Switcher Pill (Sun / Moon persis Gambar 2) */}
          {onToggleTheme && (
            <div className="dock-theme-pill" title="Ubah Mode Tampilan (Terang / Gelap)">
              <button
                type="button"
                className={`dock-theme-btn ${theme === "light" ? "active" : ""}`}
                onClick={(e) => {
                  if (theme !== "light") onToggleTheme(e, "light");
                }}
                aria-label="Mode Terang"
              >
                <Sun size={13} />
              </button>
              <button
                type="button"
                className={`dock-theme-btn ${theme === "dark" ? "active" : ""}`}
                onClick={(e) => {
                  if (theme !== "dark") onToggleTheme(e, "dark");
                }}
                aria-label="Mode Gelap"
              >
                <Moon size={13} />
              </button>
            </div>
          )}
        </div>

        {/* CENTER: Floating White Capsule Dock ("Tabel Tabung Putih") */}
        <div className="dock-center-group">
          <nav className="dock-capsule-tube">
            {/* Sliding Active Pill Indicator (Meluncur Halus Bergeser, Tidak Teleport Kaku) */}
            {navItems.findIndex((item) => item.id === activeTab) !== -1 && (
              <div
                className="dock-tube-slider"
                aria-hidden="true"
                style={{
                  transform: `translateY(${navItems.findIndex((item) => item.id === activeTab) * 52}px)`,
                }}
              />
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`dock-tube-item ${isActive ? "active" : ""}`}
                  onClick={() => handleSelectTab(item.id)}
                  aria-label={item.label}
                >
                  <Icon className="dock-icon" size={20} />
                  {item.badge && (
                    <span className="dock-badge-dot">{item.badge}</span>
                  )}
                  <span className="dock-tooltip">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM: User Profile Avatar & Version */}
        <div className="dock-bottom-group">
          <button
            type="button"
            className="dock-user-avatar-btn"
            onClick={() => {
              if (currentUser && onOpenProfile) {
                onOpenProfile();
              } else if (onOpenAuth) {
                onOpenAuth();
              }
            }}
            aria-label="Profil Akun"
          >
            <div className="dock-avatar-circle">
              {currentUser?.name
                ? currentUser.name.charAt(0).toUpperCase()
                : "U"}
            </div>
            <span className="dock-online-dot" />
            <span className="dock-tooltip">
              {currentUser?.name || "Masuk Akun"} (
              {currentUser?.role === "super_admin"
                ? "Super Admin"
                : currentUser?.role === "bendahara"
                ? "Bendahara"
                : currentUser?.role === "pimpinan"
                ? "Ketua"
                : "Pegawai"}
              )
            </span>
          </button>

          <span className="dock-version-pill" title="Versi Aplikasi">
            v2.6
          </span>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE SLIDE-OUT DRAWER (Hanya Aktif di Mobile Ketika Hamburger Ditekan)
          ========================================================================= */}
      {mobileOpen && (
        <div
          className="mobile-drawer-backdrop open"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      <aside
        className={`mobile-drawer-sheet ${mobileOpen ? "open" : ""}`}
        aria-hidden={!mobileOpen}
      >
        <div className="mobile-drawer-header">
          <div className="mobile-drawer-brand">
            <div className="stitch-brand-badge">
              <img
                src="/logo-ptwp.png"
                alt="Logo PTWP"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              />
            </div>
            <div className="stitch-brand-info">
              <span className="brand-title">
                {isSuper ? "PTWP PUSAT" : "PTWP CABANG"}
              </span>
              <span className="brand-subtitle">{satkerShort}</span>
            </div>
          </div>
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setMobileOpen && setMobileOpen(false)}
            aria-label="Tutup Menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mobile-drawer-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`mobile-nav-link ${isActive ? "active" : ""}`}
                onClick={() => handleSelectTab(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="mobile-nav-badge">{item.badge}</span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            className="mobile-nav-link"
            onClick={() => {
              if (setMobileOpen) setMobileOpen(false);
              if (onOpenSettings) onOpenSettings();
            }}
          >
            <Settings size={19} />
            <span>Pengaturan</span>
          </button>
        </nav>

        <div className="mobile-drawer-footer">
          <div
            className="stitch-user-card"
            onClick={() => {
              if (setMobileOpen) setMobileOpen(false);
              if (currentUser && onOpenProfile) {
                onOpenProfile();
              } else if (onOpenAuth) {
                onOpenAuth();
              }
            }}
          >
            <div className="stitch-avatar">
              {currentUser?.name
                ? currentUser.name.charAt(0).toUpperCase()
                : "P"}
            </div>
            <div className="stitch-user-meta">
              <div className="stitch-user-name">
                {currentUser?.name || "Masuk Akun"}
              </div>
              <div className="stitch-user-role">
                {currentUser?.role === "super_admin"
                  ? "Super Administrator"
                  : currentUser?.role === "bendahara"
                  ? "Bendahara"
                  : "Pegawai"}
              </div>
            </div>
            <ShieldCheck size={16} color="#eab308" />
          </div>

          <div className="stitch-sys-bar">
            <div className="stitch-dot-gold" />
            <span className="stitch-sys-title">Sistem Iuran Terpadu</span>
            <span className="stitch-sys-badge">v2.6</span>
          </div>
        </div>
      </aside>
    </>
  );
}
