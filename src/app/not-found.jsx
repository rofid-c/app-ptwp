"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FileQuestion, Home, RotateCcw, ArrowLeft, LogIn, ExternalLink } from "lucide-react";

export default function NotFound() {
  const [currentUrl, setCurrentUrl] = useState("");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
      const savedTheme = localStorage.getItem("ptwp_theme") || "light";
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  return (
    <div className="ptwp-error-wrapper">
      {/* Background Decorative Blur Orbs */}
      <div className="error-blur-orb orb-1" />
      <div className="error-blur-orb orb-2" />

      <div className="ptwp-error-card">
        {/* Top Header Pill */}
        <div className="error-brand-pill">
          <span className="error-brand-badge">P</span>
          <span className="error-brand-title">PTWP SISTEM TERPADU</span>
          <span className="error-code-badge badge-404">ERROR 404</span>
        </div>

        {/* Hero Visual Icon */}
        <div className="error-icon-box">
          <FileQuestion size={44} className="error-main-icon" />
          <div className="error-icon-glow" />
        </div>

        {/* Error Typography */}
        <h1 className="error-heading">404 • Halaman Tidak Ditemukan</h1>
        <p className="error-subtext">
          Alamat web atau dokumen yang Anda cari tidak tersedia, telah dipindahkan, atau terdapat kesalahan pengetikan pada URL peramban.
        </p>

        {/* URL Inspection Helper */}
        {currentUrl && (
          <div className="error-url-box">
            <span className="url-label">Alamat yang diakses:</span>
            <code className="url-code">{currentUrl}</code>
          </div>
        )}

        {/* Quick Diagnostic Tips */}
        <div className="error-tips-box">
          <span className="tips-title">💡 Petunjuk Akses Satker:</span>
          <ul className="tips-list">
            <li>
              Jika menjalankan di komputer lokal, gunakan alamat resmi <strong>http://localhost:3000</strong> (jangan gunakan <em>0.0.0.0</em> karena ditolak oleh sistem Windows).
            </li>
            <li>Pastikan koneksi jaringan server internal Pengadilan Agama telah aktif.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="error-actions-group">
          <Link href="/" className="error-btn btn-primary">
            <Home size={16} />
            <span>Kembali ke Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") window.location.reload();
            }}
            className="error-btn btn-secondary"
          >
            <RotateCcw size={16} />
            <span>Muat Ulang</span>
          </button>

          <Link href="/login" className="error-btn btn-outline">
            <LogIn size={16} />
            <span>Masuk Akun</span>
          </Link>
        </div>

        {/* Footer System Info */}
        <div className="error-footer-bar">
          <span>PTWP Wilayah Hukum Pengadilan Tinggi Agama Bandar Lampung</span>
          <span className="error-version-chip">v2.6 Multi-Satker</span>
        </div>
      </div>
    </div>
  );
}

