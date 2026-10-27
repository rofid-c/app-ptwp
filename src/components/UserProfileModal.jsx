"use client";

import React from "react";
import { X, User, ShieldCheck, Building2, LogOut, Settings, Phone, CheckCircle2 } from "lucide-react";

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  settings = {},
  onOpenSettings,
  onLogout,
}) {
  if (!isOpen) return null;

  const roleText =
    currentUser?.role === "bendahara"
      ? "Bendahara Cabang"
      : currentUser?.role === "pimpinan"
      ? "Ketua Cabang"
      : "Anggota PTWP";

  const initial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U";

  const handleLogoutClick = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari akun ini?")) {
      onLogout && onLogout();
      onClose();
    }
  };

  const handleSettingsClick = () => {
    onClose();
    if (onOpenSettings) onOpenSettings();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "440px", borderRadius: "16px", overflow: "hidden" }}
      >
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
            onClick={onClose}
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
        <div className="modal-body" style={{ padding: "20px" }}>
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
                  {settings.institution || "Pengadilan Agama Gunung Sugih"}
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

          {/* Opsi Aksi Profil */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleSettingsClick}
              style={{
                width: "100%",
                justifyContent: "center",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              <Settings size={16} />
              <span>Pengaturan Satker & Pejabat</span>
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
      </div>
    </div>
  );
}
