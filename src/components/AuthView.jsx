"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  User,
  Phone,
  Building2,
  Briefcase,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Landmark,
  ChevronRight,
  Globe2,
  KeyRound,
  UserCheck,
  ExternalLink,
} from "lucide-react";

export const SAMPLE_SATKER = [
  "Pengadilan Agama Gunung Sugih",
  "Pengadilan Agama Tanjung Karang",
  "Pengadilan Agama Metro",
  "Pengadilan Agama Kalianda",
  "Pengadilan Agama Kotabumi",
  "Pengadilan Agama Liwa",
  "Pengadilan Agama Tulang Bawang",
  "Pengadilan Agama Gedong Tataan",
  "Pengadilan Agama Sukadana",
  "Pengadilan Agama Pringsewu",
  "Pengadilan Agama Mesuji",
  "Pengadilan Agama Tulang Bawang Tengah",
  "Pengadilan Tinggi Agama Bandar Lampung",
  "Pengurus Pusat PTWP - Mahkamah Agung RI",
];

export default function AuthView({
  onLoginSuccess,
  onBypassToDashboard,
  defaultMode = "login", // "login" | "register"
}) {
  const [mode, setMode] = useState(defaultMode); // "login" | "register"
  const [level, setLevel] = useState("cabang"); // "cabang" | "pusat"
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSatker, setLoginSatker] = useState("Pengadilan Agama Gunung Sugih");
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regNip, setRegNip] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regSatker, setRegSatker] = useState("Pengadilan Agama Gunung Sugih");
  const [regTitle, setRegTitle] = useState("Hakim");
  const [regRole, setRegRole] = useState("bendahara");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // Feedback status
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!loginIdentifier.trim()) {
      setErrorMsg("Mohon masukkan Username, NIP, atau Nomor WhatsApp.");
      return;
    }

    const userData = {
      name: loginIdentifier.toLowerCase().includes("wulan")
        ? "Wulan Febrianti, A.Md"
        : loginIdentifier.toLowerCase().includes("pusat")
        ? "Pengurus Pusat Mahkamah Agung"
        : loginIdentifier,
      username: loginIdentifier.trim(),
      phone: loginIdentifier.startsWith("08") ? loginIdentifier : "08123456789",
      role: level === "pusat" ? "pusat" : loginIdentifier.toLowerCase().includes("anggota") ? "anggota" : "bendahara",
      roleLabel: level === "pusat" ? "Pengurus Pusat PTWP" : "Bendahara Cabang",
      satker: level === "pusat" ? "Mahkamah Agung RI" : loginSatker,
      level: level,
    };

    setSuccessMsg("Berhasil masuk! Mengarahkan ke dashboard...");
    setTimeout(() => {
      onLoginSuccess && onLoginSuccess(userData);
    }, 400);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!regName.trim() || !regPhone.trim()) {
      setErrorMsg("Nama lengkap dan Nomor WhatsApp wajib diisi.");
      return;
    }

    if (regPassword && regPassword !== regConfirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok dengan password.");
      return;
    }

    const userData = {
      name: regName.trim(),
      username: regNip.trim() || regName.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      phone: regPhone.trim(),
      title: regTitle,
      role: regRole,
      roleLabel: regRole === "bendahara" ? "Bendahara Cabang" : regRole === "ketua" ? "Ketua Cabang" : "Pegawai / Anggota",
      satker: regSatker,
      level: "cabang",
    };

    setSuccessMsg("Pendaftaran berhasil! Akun Anda siap digunakan.");
    setTimeout(() => {
      onLoginSuccess && onLoginSuccess(userData);
    }, 450);
  };

  const handleQuickLogin = (roleType) => {
    let mockUser;
    if (roleType === "bendahara") {
      mockUser = {
        name: "Wulan Febrianti, A.Md",
        username: "bendahara",
        phone: "08123456789",
        role: "bendahara",
        roleLabel: "Bendahara Cabang PA GS",
        title: "Bendahara Pengeluaran",
        satker: "Pengadilan Agama Gunung Sugih",
        level: "cabang",
      };
    } else if (roleType === "pusat") {
      mockUser = {
        name: "Dr. H. Pengurus Pusat, S.H., M.H.",
        username: "admin_pusat",
        phone: "08119876543",
        role: "pusat",
        roleLabel: "Pengurus Pusat PTWP MA-RI",
        title: "Pengurus Pusat",
        satker: "Mahkamah Agung RI",
        level: "pusat",
      };
    } else {
      mockUser = {
        name: "Ahmad Fauzi, S.H.I.",
        username: "anggota",
        phone: "08529876543",
        role: "anggota",
        roleLabel: "Pegawai / Anggota",
        title: "Hakim Pratama",
        satker: "Pengadilan Agama Gunung Sugih",
        level: "cabang",
      };
    }

    setSuccessMsg(`Login Cepat sebagai ${mockUser.roleLabel}...`);
    setTimeout(() => {
      onLoginSuccess && onLoginSuccess(mockUser);
    }, 300);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "stretch",
        background: "linear-gradient(135deg, #051f15 0%, #0a3826 50%, #062319 100%)",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Decorative Tennis & Judicial Glows */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "-5%",
          width: "550px",
          height: "550px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(22, 163, 74, 0.25) 0%, rgba(15, 81, 50, 0) 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "20%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(234, 179, 8, 0.12) 0%, rgba(202, 138, 4, 0) 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      {/* Grid Pattern Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* MAIN CONTAINER */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "36px 20px",
          gap: "20px",
        }}
      >
        {/* Header Logo & Title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "8px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #16a34a 0%, #0f5132 100%)",
              border: "2px solid rgba(234, 179, 8, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
            }}
          >
            <ShieldCheck size={28} color="#fef08a" />
          </div>

          <div>
            <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "1.5px", color: "#fef08a", textTransform: "uppercase" }}>
              MAHKAMAH AGUNG REPUBLIK INDONESIA
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", letterSpacing: "0.5px" }}>
              PTWP-HUB SISTEM TERPADU
            </div>
          </div>
        </div>

        {/* KARTU LOGIN & REGISTRASI ELEGAN */}
        <div
          style={{
            width: "100%",
            background: "#ffffff",
            borderRadius: "24px",
            padding: "32px 28px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            color: "#0f172a",
            position: "relative",
          }}
        >
            {/* Tab Switcher Masuk vs Daftar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                background: "#f1f5f9",
                borderRadius: "14px",
                padding: "4px",
                marginBottom: "20px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg("");
                }}
                style={{
                  padding: "9px 0",
                  borderRadius: "10px",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: mode === "login" ? "#ffffff" : "transparent",
                  color: mode === "login" ? "#0f5132" : "#64748b",
                  boxShadow: mode === "login" ? "0 2px 6px rgba(0, 0, 0, 0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                Masuk ke Akun
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMsg("");
                }}
                style={{
                  padding: "9px 0",
                  borderRadius: "10px",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: mode === "register" ? "#ffffff" : "transparent",
                  color: mode === "register" ? "#0f5132" : "#64748b",
                  boxShadow: mode === "register" ? "0 2px 6px rgba(0, 0, 0, 0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                Daftar Akun Baru
              </button>
            </div>

            {/* Alert Messages */}
            {errorMsg && (
              <div
                style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "12.5px",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>⚠️ {errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  background: "#dcfce7",
                  color: "#16a34a",
                  border: "1px solid #86efac",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "12.5px",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ========================================================
                FORMULIR 1: LOGIN
                ======================================================== */}
            {mode === "login" ? (
              <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Pilihan Satker */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                    Satuan Kerja / Cabang Pengadilan
                  </label>
                    <div style={{ position: "relative" }}>
                      <select
                        value={loginSatker}
                        onChange={(e) => setLoginSatker(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#0f172a",
                          background: "#f8fafc",
                          outline: "none",
                        }}
                      >
                        {SAMPLE_SATKER.map((satker, idx) => (
                          <option key={idx} value={satker}>
                            {satker}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                {/* Username / NIP / WA */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                    Username, NIP, atau No. WhatsApp
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      background: "#f8fafc",
                    }}
                  >
                    <User size={18} color="#64748b" />
                    <input
                      type="text"
                      placeholder="Contoh: bendahara atau 08123456789"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      style={{
                        border: "none",
                        background: "transparent",
                        outline: "none",
                        width: "100%",
                        fontSize: "13.5px",
                        color: "#0f172a",
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Password</label>
                    <a
                      href="#forgot"
                      onClick={(e) => {
                        e.preventDefault();
                        alert("Silakan hubungi administrator atau bendahara cabang untuk reset kata sandi.");
                      }}
                      style={{ fontSize: "11.5px", color: "#0f5132", fontWeight: 600, textDecoration: "none" }}
                    >
                      Lupa password?
                    </a>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      background: "#f8fafc",
                    }}
                  >
                    <Lock size={18} color="#64748b" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      style={{
                        border: "none",
                        background: "transparent",
                        outline: "none",
                        width: "100%",
                        fontSize: "13.5px",
                        color: "#0f172a",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: "#0f5132", cursor: "pointer" }}
                  />
                  <label htmlFor="rememberMe" style={{ fontSize: "12px", color: "#64748b", cursor: "pointer" }}>
                    Ingat sesi login di perangkat ini
                  </label>
                </div>

                {/* Tombol Submit Login */}
                <button
                  type="submit"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(135deg, #146c43 0%, #0f5132 100%)",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(15, 81, 50, 0.35)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight size={16} />
                </button>

                {/* Akses Cepat / Demo Akun */}
                <div style={{ marginTop: "10px", paddingTop: "12px", borderTop: "1px dashed #e2e8f0" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px", textAlign: "center" }}>
                    ⚡ Akses Cepat 1-Klik:
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("bendahara")}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #d1fae5",
                      background: "#ecfdf5",
                      color: "#0f5132",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <UserCheck size={15} />
                    <span>Masuk Cepat sebagai Bendahara Cabang</span>
                  </button>
                </div>
              </form>
            ) : (
              /* ========================================================
                 FORMULIR 2: REGISTRASI AKUN BARU
                 ======================================================== */
              <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Nama Lengkap */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Wulan Febrianti, A.Md"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "13px",
                      background: "#f8fafc",
                      outline: "none",
                    }}
                    required
                  />
                </div>

                {/* Baris NIP & No WA */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                      NIP (Nomor Induk)
                    </label>
                    <input
                      type="text"
                      placeholder="1995..."
                      value={regNip}
                      onChange={(e) => setRegNip(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "13px",
                        background: "#f8fafc",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                      No. WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="08123456789"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "13px",
                        background: "#f8fafc",
                        outline: "none",
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Pilihan Satker */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Satuan Kerja Pengadilan
                  </label>
                  <select
                    value={regSatker}
                    onChange={(e) => setRegSatker(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      background: "#f8fafc",
                      outline: "none",
                    }}
                  >
                    {SAMPLE_SATKER.map((satker, idx) => (
                      <option key={idx} value={satker}>
                        {satker}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jabatan & Peran */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                      Jabatan
                    </label>
                    <select
                      value={regTitle}
                      onChange={(e) => setRegTitle(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "12.5px",
                        background: "#f8fafc",
                        outline: "none",
                      }}
                    >
                      <option value="Hakim">Hakim</option>
                      <option value="Panitera">Panitera</option>
                      <option value="Panmud">Panmud</option>
                      <option value="Sekretaris">Sekretaris</option>
                      <option value="Kasub">Kasubag</option>
                      <option value="PP">Panitera Pengganti</option>
                      <option value="JS">Jurusita</option>
                      <option value="Staf">Staf / Pelaksana</option>
                      <option value="PPNPN">PPNPN</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                      Peran Akun
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "12.5px",
                        background: "#f8fafc",
                        outline: "none",
                      }}
                    >
                      <option value="bendahara">Bendahara Cabang</option>
                      <option value="ketua">Ketua / Pengurus</option>
                      <option value="anggota">Anggota Pegawai</option>
                    </select>
                  </div>
                </div>

                {/* Baris Password & Konfirmasi */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "13px",
                        background: "#f8fafc",
                        outline: "none",
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                      Ulangi Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "13px",
                        background: "#f8fafc",
                        outline: "none",
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Tombol Submit Registrasi */}
                <button
                  type="submit"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "11px",
                    marginTop: "6px",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(135deg, #146c43 0%, #0f5132 100%)",
                    color: "#ffffff",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(15, 81, 50, 0.35)",
                  }}
                >
                  <UserCheck size={16} />
                  <span>Daftar Akun Anggota</span>
                </button>
              </form>
            )}
        </div>

        {/* Tombol Bypass / Masuk Langsung Sebagai Tamu */}
        {onBypassToDashboard && (
          <button
            type="button"
            onClick={onBypassToDashboard}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "transparent",
              border: "1px dashed rgba(226, 240, 234, 0.4)",
              color: "rgba(226, 240, 234, 0.9)",
              padding: "8px 18px",
              borderRadius: "99px",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#fef08a")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(226, 240, 234, 0.4)")}
          >
            <span>Lihat Dashboard Langsung (Mode Pratinjau)</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
