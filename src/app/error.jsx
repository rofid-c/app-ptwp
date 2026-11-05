"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ServerCrash, RotateCcw, Home, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

export default function Error({ error, reset }) {
  const [showDetails, setShowDetails] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Log error ke konsol untuk kebutuhan audit debugging
    console.error("PTWP Runtime Error Detected:", error);

    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("ptwp_theme") || "light";
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, [error]);

  const handleClearSessionAndRestart = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("ptwp_auth_user");
        sessionStorage.clear();
      } catch (e) {}
      window.location.href = "/";
    }
  };

  return (
    <div className="ptwp-error-wrapper">
      <div className="error-blur-orb orb-1 error-orb-red" />
      <div className="error-blur-orb orb-2 error-orb-gold" />

      <div className="ptwp-error-card card-server-error">
        {/* Top Header Pill */}
        <div className="error-brand-pill">
          <span className="error-brand-badge badge-warning">!</span>
          <span className="error-brand-title">PTWP SISTEM TERPADU</span>
          <span className="error-code-badge badge-500">ERROR 500 / 505</span>
        </div>

        {/* Hero Visual Icon */}
        <div className="error-icon-box icon-box-warning">
          <ServerCrash size={44} className="error-main-icon icon-warning" />
          <div className="error-icon-glow glow-warning" />
        </div>

        {/* Error Typography */}
        <h1 className="error-heading">500 • Gangguan Server / Sistem</h1>
        <p className="error-subtext">
          Terjadi kendala teknis sementara saat memproses data aplikasi. Sistem keselamatan data PTWP telah mengisolasi proses agar data perbendaharaan tetap aman.
        </p>

        {/* Quick Diagnostic Tips */}
        <div className="error-tips-box">
          <span className="tips-title">💡 Solusi Cepat:</span>
          <ul className="tips-list">
            <li>
              Gunakan tombol <strong>Coba Pulihkan Sesi</strong> di bawah untuk memuat ulang status aplikasi.
            </li>
            <li>
              Pastikan Anda membuka alamat <strong>http://localhost:3000</strong> bukan <em>0.0.0.0</em>.
            </li>
            <li>Jika kendala berlanjut, bersihkan sesi atau hubungi Administrator Satker PTWP.</li>
          </ul>
        </div>

        {/* Error Details Accordion (Bisa dibuka untuk melihat teknis) */}
        {error && (
          <div className="error-tech-container">
            <button
              type="button"
              className="error-tech-toggle"
              onClick={() => setShowDetails(!showDetails)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertTriangle size={14} color="#f59e0b" />
                <span>Rincian Diagnostik Teknis (Untuk Admin/IT)</span>
              </div>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showDetails && (
              <div className="error-tech-details">
                <p className="tech-msg"><strong>Pesan:</strong> {error?.message || "Kesalahan runtime tidak terdefinisi"}</p>
                {error?.digest && (
                  <p className="tech-digest"><strong>Kode Digest:</strong> <code>{error.digest}</code></p>
                )}
                {error?.stack && (
                  <pre className="tech-stack">{error.stack}</pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="error-actions-group">
          <button
            type="button"
            onClick={() => reset ? reset() : window.location.reload()}
            className="error-btn btn-primary"
          >
            <RotateCcw size={16} />
            <span>Coba Pulihkan Sesi</span>
          </button>

          <Link href="/" className="error-btn btn-secondary">
            <Home size={16} />
            <span>Kembali ke Beranda</span>
          </Link>

          <button
            type="button"
            onClick={handleClearSessionAndRestart}
            className="error-btn btn-outline"
            title="Bersihkan data sesi sementara dan muat ulang"
          >
            <span>Reset Cache Sesi</span>
          </button>
        </div>

        {/* Footer System Info */}
        <div className="error-footer-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={13} color="#10b981" />
            <span>Integritas Basis Data Iuran Terlindungi</span>
          </div>
          <span className="error-version-chip">v2.6 Secure Core</span>
        </div>
      </div>
    </div>
  );
}

