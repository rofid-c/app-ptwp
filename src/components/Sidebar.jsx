"use client";

import React from "react";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Wallet,
  Settings,
  ShieldCheck,
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
}) {
  const isSuper = currentUser?.role === "super_admin" || currentUser?.username?.toLowerCase() === "aku admin";
  const navItems = [
    ...(isSuper
      ? [
          {
            id: "admin",
            label: "Portal Admin",
            icon: ShieldCheck,
          },
        ]
      : []),
    {
      id: "dashboard",
      label: isSuper ? "Dashboard Cabang" : "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "dues",
      label: isSuper ? "Rekap Iuran Cabang" : "Rekap Iuran",
      icon: FileSpreadsheet,
      badge: totalMembersCount > 0 ? `${totalMembersCount}` : null,
    },
    {
      id: "cashbook",
      label: isSuper ? "Buku Kas Cabang" : "Buku Kas",
      icon: Wallet,
    },
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <aside className={`stitch-sidebar ${mobileOpen ? "mobile-open" : ""}`} id="app-sidebar">
      <div className="flex-col-container">
        {/* Brand Header */}
        <div className="stitch-brand-header">
          <div className="stitch-brand-badge">P</div>
          <div className="stitch-brand-info">
            <span className="brand-title">{isSuper ? "PTWP PUSAT" : "PTWP CABANG"}</span>
            <span className="brand-subtitle">
              {isSuper
                ? "Super Administrator"
                : currentUser?.satker
                ? currentUser.satker.replace("Pengadilan Agama", "PA").replace("Pengadilan Tinggi Agama", "PTA")
                : "PA Gunung Sugih"}
            </span>
          </div>
        </div>

        {/* Navigasi Menu */}
        <nav className="stitch-sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`stitch-nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleSelectTab(item.id)}
              >
                <Icon className="icon" size={19} />
                <span>{item.label}</span>
                {item.badge && <span className="stitch-nav-badge">{item.badge}</span>}
              </button>
            );
          })}

          <button
            type="button"
            className="stitch-nav-item"
            onClick={() => {
              if (setMobileOpen) setMobileOpen(false);
              if (onOpenSettings) onOpenSettings();
            }}
            style={{ marginTop: "6px" }}
          >
            <Settings className="icon" size={19} />
            <span>Pengaturan</span>
          </button>
        </nav>
      </div>

      {/* Bagian Bawah: Akun & Status Sistem */}
      <div className="stitch-sidebar-footer">
        {/* User Card */}
        <div
          className="stitch-user-card"
          onClick={() => {
            if (currentUser && onOpenProfile) {
              onOpenProfile();
            } else if (onOpenAuth) {
              onOpenAuth();
            }
          }}
          title={currentUser ? "Klik untuk melihat profil akun" : "Klik untuk masuk akun"}
        >
          <div className="stitch-avatar">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "P"}
          </div>
          <div className="stitch-user-meta">
            <div className="stitch-user-name">{currentUser?.name || "Masuk Akun"}</div>
            <div className="stitch-user-role">
              {currentUser?.role === "super_admin"
                ? "Super Administrator"
                : currentUser?.role === "pusat"
                ? "Pengurus Pusat"
                : currentUser?.role === "bendahara"
                ? "Bendahara"
                : currentUser?.role === "pimpinan"
                ? "Ketua"
                : "Pegawai"}
            </div>
          </div>
          <ShieldCheck size={16} color="#eab308" />
        </div>

        {/* System Version Tag */}
        <div className="stitch-sys-bar">
          <div className="stitch-dot-gold"></div>
          <span className="stitch-sys-title">Sistem Iuran Terpadu</span>
          <span className="stitch-sys-badge">v2.6</span>
        </div>
      </div>
    </aside>
  );
}
