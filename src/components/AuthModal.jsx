"use client";

import React, { useState } from "react";
import { X, Lock, User, ShieldCheck, ArrowRight, Phone } from "lucide-react";

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onRegister,
  onLogout,
}) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Register form state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("STAF");
  const [role, setRole] = useState("anggota");

  if (!isOpen) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!identifier) return;
    onLogin && onLogin(identifier, password);
    onClose();
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!name || !username || !phone) return;
    onRegister &&
      onRegister({
        name,
        username,
        phone,
        password,
        title,
        role,
      });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <ShieldCheck size={22} color="var(--primary-700)" />
            <span>{isRegisterMode ? "Pendaftaran Akun Anggota" : "Login PTWP-Hub"}</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Status Akun Aktif Saat Ini */}
          {currentUser && (
            <div
              style={{
                background: "var(--bg-app)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Sedang Masuk Sebagai:
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--text-primary)" }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--primary-700)", fontWeight: 600 }}>
                  {currentUser.roleLabel || currentUser.role} {currentUser.phone ? `• ${currentUser.phone}` : ""}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  onLogout && onLogout();
                }}
                style={{ color: "var(--status-danger)" }}
              >
                Keluar
              </button>
            </div>
          )}

          {!isRegisterMode ? (
            /* Form Login Ringkas (Username/No WA + Password) */
            <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                  Username / No. WhatsApp
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1.5px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "10px 14px", background: "var(--bg-app)" }}>
                  <User size={18} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Contoh: bendahara atau 08123456789"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "13.5px" }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                  Password
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1.5px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "10px 14px", background: "var(--bg-app)" }}>
                  <Lock size={18} color="var(--text-muted)" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "13.5px" }}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "11px", marginTop: "4px" }}>
                <span>Masuk Sekarang</span>
                <ArrowRight size={16} />
              </button>

              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  style={{ background: "none", border: "none", color: "var(--primary-700)", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
                >
                  Belum punya akun? Daftar sebagai Anggota
                </button>
              </div>
            </form>
          ) : (
            /* Form Registrasi Anggota */
            <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Wulan Febrianti, A.Md"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: "13px" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="wulan"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ width: "100%", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: "13px" }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    No. WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: "100%", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: "13px" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Jabatan
                  </label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="period-select"
                    style={{ width: "100%" }}
                  >
                    <option value="Hakim">Hakim</option>
                    <option value="Panitera">Panitera</option>
                    <option value="Panmud">Panmud</option>
                    <option value="Kasub">Kasub</option>
                    <option value="PP">PP (Panitera Pengganti)</option>
                    <option value="JS">Jurusita</option>
                    <option value="STAF">STAF / Pelaksana</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Peran Akun
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="period-select"
                    style={{ width: "100%" }}
                  >
                    <option value="anggota">Pegawai / Anggota</option>
                    <option value="bendahara">Bendahara / Pengurus</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Buat password akun"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: "100%", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: "13px" }}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "4px" }}>
                <span>Daftar Akun Anggota</span>
              </button>

              <div style={{ textAlign: "center", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  style={{ background: "none", border: "none", color: "var(--primary-700)", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
                >
                  Sudah punya akun? Kembali ke Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
