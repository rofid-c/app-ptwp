"use client";

import React from "react";
import {
  Menu,
  Sun,
  Moon,
  Printer,
  Calendar,
  Search,
  User,
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
}) {
  return (
    <header className="stitch-topbar">
      <div className="stitch-topbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobileMenu}
          title="Buka Menu"
        >
          <Menu size={22} />
        </button>

        {/* Pemilih Periode Bulan & Tahun */}
        <button
          type="button"
          className="stitch-period-pill"
          onClick={onOpenPeriodPicker}
          title="Klik untuk memilih bulan & tahun iuran"
          style={{ cursor: "pointer", border: "1px solid var(--border-light)", background: "var(--bg-app)" }}
        >
          <Calendar size={15} color="#0f5132" />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
            {period}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "2px" }}>▾</span>
        </button>

        {/* Search Bar Topbar */}
        <div className="stitch-search-pill">
          <Search size={15} color="#64748b" />
          <input
            type="text"
            placeholder="Cari anggota, transaksi..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="stitch-search-input"
          />
        </div>
      </div>

      <div className="stitch-topbar-right">
        {/* Tombol Cetak Dokumen Resmi */}
        <button
          type="button"
          className="quick-icon-btn"
          onClick={onPrint}
          title="Cetak Laporan Resmi (PDF/Print)"
        >
          <Printer size={17} />
        </button>

        {/* Toggle Dark / Light Theme */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="stitch-topbar-divider"></div>

        {/* User Profile Pill */}
        <button
          type="button"
          className="stitch-user-btn"
          onClick={() => {
            if (currentUser && onOpenProfile) {
              onOpenProfile();
            } else if (onOpenAuth) {
              onOpenAuth();
            }
          }}
          title={currentUser ? "Klik untuk melihat profil akun" : "Klik untuk masuk akun"}
        >
          <div className="stitch-user-text">
            <span className="stitch-user-name-label">{currentUser?.name || "Tamu / Anggota"}</span>
            <span className="stitch-user-role-label">
              {currentUser?.role === "bendahara" ? "Bendahara" : currentUser?.role === "pimpinan" ? "Ketua" : "Pegawai"}
            </span>
          </div>
          <div className="stitch-user-avatar-circle">
            <User size={15} />
          </div>
        </button>
      </div>
    </header>
  );
}
