"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  Sun,
  Moon,
  Printer,
  Calendar,
  Search,
  Clock,
  Building2,
  FileSpreadsheet,
  TrendingUp,
  LayoutDashboard,
  ReceiptText,
  History,
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
  onOpenExpenseDocs,
  monitoringSubTab = "dashboard",
  onMonitoringSubTabChange,
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
    currentUser?.username?.toLowerCase() === "aku admin" ||
    currentUser?.username?.toLowerCase() === "root";

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

  // Sliding pill indicator untuk 3 sub-tab monitoring di pulau tengah ("ijo-ijo bergeser")
  // Menggunakan offsetLeft & offsetWidth lokal agar 100% presisi dan kebal terhadap rasio zoom 80%
  const [sliderStyle, setSliderStyle] = useState({ left: 3, width: 110, opacity: 1 });
  const tabRefs = React.useRef({});

  useEffect(() => {
    if (activeTab !== "monitoring") return;

    const updateSlider = () => {
      const activeEl = tabRefs.current[monitoringSubTab];
      if (activeEl) {
        setSliderStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1,
        });
      }
    };

    updateSlider();
    const frameId = requestAnimationFrame(updateSlider);
    const timer = setTimeout(updateSlider, 60);
    window.addEventListener("resize", updateSlider);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timer);
      window.removeEventListener("resize", updateSlider);
    };
  }, [monitoringSubTab, activeTab]);

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
    <header
      className={`stitch-topbar ${activeTab === "monitoring" ? "navbar-monitoring-mode" : ""}`}
      aria-label="Bilah Atas Navigasi"
    >
      {/* =====================================================================
          1. PULAU KIRI:
          - Halaman Selain Monitoring: Kalender Periode
          - Halaman Monitoring Cabang: Cetak PDF (Kiri Atas)
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

        {isSuper ? (
          <div className="island-admin-badge">
            <span>Portal Super Admin</span>
          </div>
        ) : activeTab === "monitoring" ? (
          /* Khusus Monitoring Cabang: Cetak PDF di Kiri Atas (disembunyikan pada Audit Trail) */
          monitoringSubTab === "audit" ? null : (
            <button
              type="button"
              className="island-print-btn"
              onClick={onPrint}
              title="Cetak Laporan Resmi (PDF/Print)"
            >
              <Printer size={15} color="#0f5132" />
              <span className="tool-text">Cetak PDF</span>
            </button>
          )
        ) : (
          /* Halaman Selain Monitoring: Kalender di Kiri */
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
        )}
      </div>

      {/* =====================================================================
          2. PULAU TENGAH:
          - Halaman Monitoring Cabang: 3 Menu (Dashboard, Rekap Pengeluaran, Audit Trail)
          - Halaman Selain Monitoring: Search + Cetak PDF
          ===================================================================== */}
      {activeTab === "monitoring" ? (
        <div className="top-island-center monitoring-island-center">
          <div className="monitoring-nav-segmented">
            {/* Indikator Kapsul Hijau Berseluncur ("ijo-ijo bergeser" kebal rasio zoom) */}
            <div
              className="monitoring-slider-pill"
              style={{
                left: `${sliderStyle.left}px`,
                width: `${sliderStyle.width}px`,
                opacity: sliderStyle.opacity,
              }}
            />
            <button
              ref={(el) => {
                if (el) tabRefs.current["dashboard"] = el;
              }}
              type="button"
              className={`monitoring-segment-btn ${monitoringSubTab === "dashboard" ? "active" : ""}`}
              onClick={() => onMonitoringSubTabChange && onMonitoringSubTabChange("dashboard")}
              title="Tampilkan Dashboard Monitoring Cabang"
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </button>
            <button
              ref={(el) => {
                if (el) tabRefs.current["expenses"] = el;
              }}
              type="button"
              className={`monitoring-segment-btn ${monitoringSubTab === "expenses" ? "active" : ""}`}
              onClick={() => onMonitoringSubTabChange && onMonitoringSubTabChange("expenses")}
              title="Tampilkan Rekap Pengeluaran Cabang"
            >
              <ReceiptText size={14} />
              <span>Rekap Pengeluaran</span>
            </button>
            <button
              ref={(el) => {
                if (el) tabRefs.current["audit"] = el;
              }}
              type="button"
              className={`monitoring-segment-btn ${monitoringSubTab === "audit" ? "active" : ""}`}
              onClick={() => onMonitoringSubTabChange && onMonitoringSubTabChange("audit")}
              title="Tampilkan Jejak Rekam & Audit Trail Terpadu"
            >
              <History size={14} />
              <span>Audit Trail</span>
            </button>
          </div>
        </div>
      ) : (
        !isSuper && (
          <div className="top-island-center">
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

            <button
              type="button"
              className="island-tool-btn"
              onClick={onPrint}
              title="Cetak Laporan Resmi (PDF/Print)"
            >
              <Printer size={15} color="#0f5132" />
              <span className="tool-text">Cetak PDF</span>
            </button>
          </div>
        )
      )}

      {/* =====================================================================
          3. PULAU KANAN: Jam Digital Sistem
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
