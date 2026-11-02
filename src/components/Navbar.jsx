"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  Sun,
  Moon,
  Printer,
  Calendar,
  Search,
  Settings,
  Clock,
  Building2,
} from "lucide-react";

export default function Navbar({
  period = "September 2026",
  onPeriodChange,
  availablePeriods = [],
  theme = "light",
  onToggleTheme,
  onOpenAuth,
  onOpenProfile,
  onPrint,
  onToggleMobileMenu,
  currentUser,
  searchQuery = "",
  onSearchChange,
  onOpenPeriodPicker,
  onOpenSettings,
  showSearch = false,
  searchPlaceholder = "Cari nama, jabatan...",
  // Khusus Monitoring PTA Bandar Lampung
  activeTab = "dashboard",
  onSelectTab,
  settings = {},
}) {
  const isSuper =
    currentUser?.role === "super_admin" ||
    currentUser?.username?.toLowerCase() === "aku admin";

  const satkerText = (
    currentUser?.satker ||
    settings?.institution ||
    settings?.satker ||
    ""
  ).toLowerCase();

  const isPTA =
    satkerText.includes("tinggi agama bandar lampung") ||
    satkerText.includes("pta bandar lampung") ||
    satkerText.includes("pengadilan tinggi agama") ||
    satkerText.includes("pta");

  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="stitch-topbar" aria-label="Bilah Atas Navigasi">
      {/* =====================================================================
          1. PULAU KIRI: Kalender Periode (Terputus / Terpisah)
          ===================================================================== */}
      <div className="top-island-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobileMenu}
          title="Buka Menu"
          aria-label="Buka Menu"
        >
          <Menu size={20} />
        </button>

        {!isSuper ? (
          <button
            type="button"
            className="island-calendar-btn"
            onClick={onOpenPeriodPicker}
            title="Klik untuk memilih bulan & tahun iuran"
          >
            <Calendar size={15} color="#0f5132" />
            <span className="calendar-label">{period}</span>
            <span className="calendar-caret">▾</span>
          </button>
        ) : (
          <div className="island-admin-badge">
            <span>Portal Super Admin</span>
          </div>
        )}
      </div>

      {/* =====================================================================
          2. PULAU TENGAH: Search - Cetak PDF - Pengaturan - Monitoring Cabang (PTA)
          ===================================================================== */}
      <div className="top-island-center">
        {/* Search Input Box (Hanya Tampil Saat di Menu Rekap Iuran Sesuai Permintaan) */}
        {showSearch && (
          <>
            <div className="island-search-group">
              <Search size={15} className="island-search-icon" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                className="island-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange && onSearchChange("")}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "15px",
                    lineHeight: 1,
                    padding: "0 2px",
                  }}
                  title="Hapus pencarian"
                >
                  ×
                </button>
              )}
            </div>
            <div className="island-inner-divider" />
          </>
        )}

        {/* Cetak PDF Button */}
        {!isSuper && (
          <button
            type="button"
            className="island-tool-btn"
            onClick={onPrint}
            title="Cetak Laporan Resmi (PDF/Print)"
          >
            <Printer size={15} />
            <span className="tool-text">Cetak PDF</span>
          </button>
        )}

        {!isSuper && <div className="island-inner-divider" />}

        {/* Pengaturan Button */}
        <button
          type="button"
          className="island-tool-btn"
          onClick={() => {
            if (onOpenSettings) onOpenSettings();
          }}
          title="Pengaturan Satker & Pejabat"
        >
          <Settings size={15} />
          <span className="tool-text">Pengaturan</span>
        </button>

        {/* =====================================================================
            KHUSUS PTA BANDAR LAMPUNG: Menu Monitoring Cabang (Samping Kanan Pengaturan)
            ===================================================================== */}
        {isPTA && (
          <>
            <div className="island-inner-divider" />
            <button
              type="button"
              className={`island-tool-btn island-monitoring-direct-btn ${
                activeTab === "monitoring" ? "active-monitoring" : ""
              }`}
              onClick={() => {
                if (onSelectTab) {
                  onSelectTab(activeTab === "monitoring" ? "dashboard" : "monitoring");
                }
              }}
              title="Monitoring Pengadilan Agama Cabang"
            >
              <Building2 size={15} />
              <span className="tool-text">Monitoring Cabang</span>
            </button>
          </>
        )}
      </div>

      {/* =====================================================================
          3. PULAU KANAN: Jam Digital Saja (Mode Tema dipusatkan di Sidebar)
          ===================================================================== */}
      <div className="top-island-right">
        <div className="island-clock-badge" title="Waktu Sistem Saat Ini">
          <Clock size={15} color="#0f5132" />
          <div className="clock-digits">
            <span className="time-text font-mono-num">{timeStr || "12:00:00"}</span>
            <span className="tz-text">WIB</span>
          </div>
        </div>
      </div>
    </header>
  );
}
