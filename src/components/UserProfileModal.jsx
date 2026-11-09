"use client";

import React, { useState } from "react";
import {
  X,
  User,
  ShieldCheck,
  Building2,
  LogOut,
  Info,
  CheckCircle2,
  Scale,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Copyright,
  ShieldAlert,
} from "lucide-react";

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  settings = {},
  onLogout,
}) {
  const [view, setView] = useState("profile"); // 'profile' | 'about'

  if (!isOpen) return null;

  const roleText =
    currentUser?.role === "bendahara"
      ? "Bendahara Cabang"
      : currentUser?.role === "pimpinan"
      ? "Ketua Cabang"
      : currentUser?.role === "super_admin"
      ? "Super Administrator"
      : "Anggota PTWP";

  const initial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U";

  const handleModalClose = () => {
    setView("profile");
    onClose();
  };

  const handleLogoutClick = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari akun ini?")) {
      onLogout && onLogout();
      handleModalClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleModalClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "460px",
          width: "92%",
          borderRadius: "18px",
          overflow: "hidden",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
        }}
      >
        {/* ====================================================================
            TAMPILAN 1: PROFIL PENGGUNA
            ==================================================================== */}
        {view === "profile" && (
          <>
            {/* Header dengan Banner Hijau PTWP */}
            <div
              style={{
                background: "linear-gradient(135deg, #0b3b2b 0%, #0f5132 100%)",
                padding: "24px 20px 20px",
                color: "#ffffff",
                position: "relative",
                textAlign: "center",
              }}
            >
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleModalClose}
                aria-label="Tutup"
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  background: "rgba(255,255,255,0.15)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>

              {/* Avatar Besar */}
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  border: "3px solid #eab308",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "#ffffff",
                  margin: "0 auto 12px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                }}
              >
                {initial}
              </div>

              <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px 0", color: "#ffffff" }}>
                {currentUser?.name || "Pengguna Aktif"}
              </h3>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(234, 179, 8, 0.2)",
                  border: "1px solid rgba(234, 179, 8, 0.4)",
                  color: "#fef08a",
                  padding: "3px 12px",
                  borderRadius: "99px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={14} />
                <span>{roleText}</span>
              </div>
            </div>

            {/* Body Informasi Profil */}
            <div className="modal-body" style={{ padding: "20px", overflowY: "auto" }}>
              <div
                style={{
                  background: "var(--bg-app)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <Building2 size={17} color="var(--primary-700)" style={{ marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      Satuan Kerja / Cabang
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {settings.institution || currentUser?.satker || "Pengadilan Agama Gunung Sugih"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <User size={17} color="var(--primary-700)" style={{ marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      Username / Identitas Login
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {currentUser?.username || currentUser?.nip || "user testing"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CheckCircle2 size={17} color="#16a34a" style={{ flexShrink: 0 }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                        Status Sesi
                      </div>
                      <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#16a34a" }}>
                        Aktif & Terotentikasi
                      </div>
                    </div>
                    <span
                      style={{
                        display: "inline-block",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#16a34a",
                        boxShadow: "0 0 0 3px rgba(22, 163, 74, 0.2)",
                      }}
                    ></span>
                  </div>
                </div>
              </div>

              {/* Opsi Aksi Profil: About & Logout */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setView("about")}
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "11px 16px",
                    fontWeight: 700,
                    fontSize: "13.5px",
                    color: "var(--text-primary)",
                    borderColor: "var(--border-light)",
                    background: "var(--bg-app)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Info size={17} color="#0f5132" />
                  <span>About & Hak Cipta Lisensi</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleLogoutClick}
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    color: "#dc2626",
                    borderColor: "rgba(220, 38, 38, 0.3)",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  <LogOut size={16} />
                  <span>Keluar Akun (Logout)</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ====================================================================
            TAMPILAN 2: ABOUT / HAK CIPTA & LISENSI RESMI
            ==================================================================== */}
        {view === "about" && (
          <>
            {/* Header About */}
            <div
              style={{
                background: "linear-gradient(135deg, #0b3b2b 0%, #0f5132 100%)",
                padding: "20px 20px 16px",
                color: "#ffffff",
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                borderBottom: "3px solid #eab308",
              }}
            >
              <button
                type="button"
                onClick={() => setView("profile")}
                aria-label="Kembali ke profil"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <ArrowLeft size={18} />
              </button>

              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  border: "2px solid #eab308",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                }}
              >
                <img
                  src="/logo-ptwp.png"
                  alt="Logo PTWP"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#ffffff", letterSpacing: "0.3px" }}>
                  About & Hak Cipta
                </h3>
                <p style={{ fontSize: "11.5px", color: "#fef08a", margin: "2px 0 0", fontWeight: 600 }}>
                  PTWP-Hub Sistem Terpadu
                </p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={handleModalClose}
                aria-label="Tutup"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content About: Tata Aturan, Lisensi, & Sanksi Hukum */}
            <div
              className="modal-body"
              style={{
                padding: "20px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                fontSize: "12.5px",
                lineHeight: "1.6",
                color: "var(--text-primary)",
              }}
            >
              {/* Kartu Kepemilikan & Lisensi */}
              <div
                style={{
                  background: "rgba(15, 81, 50, 0.06)",
                  border: "1.5px solid rgba(15, 81, 50, 0.25)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Copyright size={18} color="#0f5132" />
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f5132", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Lisensi Resmi & Hak Cipta
                  </span>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                  Aplikasi Sistem Informasi PTWP-Hub
                </div>
                <div style={{ marginTop: "4px", color: "var(--text-muted)", fontSize: "12px" }}>
                  Dilisensikan secara resmi di bawah ketentuan <strong>MIT License</strong> atas nama:
                </div>
                <div
                  style={{
                    marginTop: "8px",
                    background: "#0b3b2b",
                    color: "#fef08a",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontWeight: 800,
                    fontSize: "14px",
                    letterSpacing: "0.5px",
                    textAlign: "center",
                    border: "1px solid #eab308",
                  }}
                >
                  © 2026 Rofid Safwanda
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "4px" }}>
                  All Rights Reserved • Seluruh Hak Cipta Dilindungi
                </div>
              </div>

              {/* Dasar Hukum Perlindungan Hak Cipta */}
              <div
                style={{
                  background: "var(--bg-app)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <Scale size={16} color="#0284c7" />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                    Dasar Perlindungan Hukum
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                  Aplikasi ini dilindungi sebagai <strong>Karya Program Komputer</strong> berdasarkan{" "}
                  <strong>Undang-Undang Republik Indonesia Nomor 28 Tahun 2014 tentang Hak Cipta</strong> (Pasal 40 ayat 1 huruf s).
                </p>
              </div>

              {/* Tata Aturan Penggunaan */}
              <div
                style={{
                  background: "var(--bg-app)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <FileText size={16} color="#eab308" />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                    Tata Aturan & Batasan Penggunaan
                  </span>
                </div>
                <ul style={{ margin: "4px 0 0", paddingLeft: "18px", color: "var(--text-muted)", fontSize: "11.5px" }}>
                  <li>Aplikasi digunakan khusus untuk operasional organisasi PTWP kedinasan peradilan.</li>
                  <li>Dilarang menghapus atau mengubah identitas hak cipta atas nama <strong>Rofid Safwanda</strong>.</li>
                  <li>Dilarang merekayasa balik (*reverse engineering*), membajak, atau mengklaim kepemilikan kode sumber secara sepihak.</li>
                  <li>Dilarang memperjualbelikan atau mengomersialisasi sistem tanpa izin tertulis dari pemegang hak cipta.</li>
                </ul>
              </div>

              {/* Sanksi Pidana & Hukuman Pelanggaran */}
              <div
                style={{
                  background: "rgba(220, 38, 38, 0.05)",
                  border: "1.5px solid rgba(220, 38, 38, 0.35)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <ShieldAlert size={17} color="#dc2626" />
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#dc2626", textTransform: "uppercase" }}>
                    Sanksi & Hukuman Pelanggaran
                  </span>
                </div>
                <div style={{ fontSize: "11.5px", color: "#991b1b", lineHeight: "1.5" }}>
                  Sesuai <strong>Pasal 113 UU RI No. 28 Tahun 2014</strong>:
                  <div style={{ marginTop: "4px", padding: "6px 8px", background: "rgba(220, 38, 38, 0.08)", borderRadius: "6px", fontStyle: "italic" }}>
                    "Setiap orang yang tanpa hak melakukan pelanggaran hak ekonomi program komputer dipidana dengan{" "}
                    <strong>pidana penjara paling lama 4 (empat) tahun</strong> dan/atau{" "}
                    <strong>denda paling banyak Rp 1.000.000.000,00 (satu miliar rupiah)</strong>."
                  </div>
                  <div style={{ marginTop: "4px", padding: "6px 8px", background: "rgba(220, 38, 38, 0.08)", borderRadius: "6px", fontStyle: "italic" }}>
                    "Pelanggaran dalam bentuk pembajakan dipidana dengan{" "}
                    <strong>pidana penjara paling lama 10 (sepuluh) tahun</strong> dan/atau{" "}
                    <strong>denda paling banyak Rp 4.000.000.000,00 (empat miliar rupiah)</strong>."
                  </div>
                </div>
              </div>

              {/* Tombol Navigasi Bawah */}
              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setView("profile")}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "9px 14px",
                    fontWeight: 600,
                    fontSize: "12.5px",
                  }}
                >
                  <ArrowLeft size={15} />
                  <span>Kembali ke Profil</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleModalClose}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "9px 14px",
                    fontWeight: 700,
                    fontSize: "12.5px",
                    background: "#0f5132",
                    borderColor: "transparent",
                  }}
                >
                  <span>Tutup</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
