"use client";

import React, { useState, useRef, useEffect } from "react";
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
  ArrowLeft,
  Mail,
  Send,
  Sparkles,
  CheckCircle2,
  Landmark,
  Globe2,
  KeyRound,
  UserCheck,
  ExternalLink,
  ChevronDown,
  Check,
  RefreshCw,
  Copy,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { verifyCredentials } from "@/services/storageService";

export const SAMPLE_SATKER = [
  "Pengadilan Agama Gunung Sugih",
  "Pengadilan Tinggi Agama Bandar Lampung",
  "Pengadilan Agama Tanjung Karang",
  "Pengadilan Agama Metro",
  "Pengadilan Agama Kalianda",
  "Pengadilan Agama Tanggamus",
  "Pengadilan Agama Pringsewu",
  "Pengadilan Agama Gedong Tataan",
  "Pengadilan Agama Sukadana",
  "Pengadilan Agama Kotabumi",
  "Pengadilan Agama Blambangan Umpu",
  "Pengadilan Agama Krui",
  "Pengadilan Agama Tulang Bawang Tengah",
  "Pengadilan Agama Tulang Bawang",
  "Pengadilan Agama Mesuji",
];

export default function AuthView({
  onLoginSuccess,
  onBypassToDashboard,
  defaultMode = "login", // "login" | "request_account"
}) {
  const [mode, setMode] = useState(defaultMode === "register" ? "request_account" : defaultMode);
  const [level, setLevel] = useState("cabang"); // "cabang" | "pusat"
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSatker, setLoginSatker] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Formulir Pengajuan Akun state (Gambar 2 - Hubungi Administrasi)
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqSatker, setReqSatker] = useState("Pengadilan Agama Gunung Sugih");
  const [reqPhone, setReqPhone] = useState("");
  const [reqTitle, setReqTitle] = useState("Hakim");
  const [reqNote, setReqNote] = useState("");
  const [reqPassword, setReqPassword] = useState("");
  const [reqConfirmPassword, setReqConfirmPassword] = useState("");
  const [showReqPassword, setShowReqPassword] = useState(false);
  const [showReqConfirmPassword, setShowReqConfirmPassword] = useState(false);
  const [reqSubmitted, setReqSubmitted] = useState(false);

  // Custom Dropdown states
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [isReqDropdownOpen, setIsReqDropdownOpen] = useState(false);
  const loginDropdownRef = useRef(null);
  const reqDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(e.target)) {
        setIsLoginDropdownOpen(false);
      }
      if (reqDropdownRef.current && !reqDropdownRef.current.contains(e.target)) {
        setIsReqDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Feedback status
  const [errorMsg, setErrorMsg] = useState("");
  const [targetSatker, setTargetSatker] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Lupa Password & Kode Redeem state
  const [forgotStep, setForgotStep] = useState(1); // 1: Verifikasi + Captcha, 2: Tampil Kode Redeem, 3: Masukkan Kode Redeem, 4: Buat PW Baru, 5: Sukses
  const [forgotName, setForgotName] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [captchaSvg, setCaptchaSvg] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [generatedRedeemCode, setGeneratedRedeemCode] = useState("");
  const [redeemExpiresIn, setRedeemExpiresIn] = useState(0);
  const [redeemAccount, setRedeemAccount] = useState(null);
  const [copiedRedeem, setCopiedRedeem] = useState(false);
  const [inputRedeemCode, setInputRedeemCode] = useState("");
  const [resetGrantToken, setResetGrantToken] = useState("");
  const [verifiedRedeemAccount, setVerifiedRedeemAccount] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetResultAccount, setResetResultAccount] = useState(null);

  useEffect(() => {
    if (mode !== "forgot_password" || (forgotStep !== 2 && forgotStep !== 3) || redeemExpiresIn <= 0) return;
    const timer = setInterval(() => {
      setRedeemExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, forgotStep, redeemExpiresIn]);

  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    setCaptchaInput("");
    try {
      const res = await fetch("/api/auth/forgot-password", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCaptchaSvg(json.captchaSvg || "");
          setCaptchaToken(json.captchaToken || "");
        }
      }
    } catch (err) {
      console.error("Gagal memuat CAPTCHA:", err);
    } finally {
      setCaptchaLoading(false);
    }
  };

  const openForgotPasswordMode = () => {
    setMode("forgot_password");
    setForgotStep(1);
    setErrorMsg("");
    setSuccessMsg("");
    setTargetSatker("");
    setForgotName("");
    setForgotEmail("");
    setForgotPhone("");
    setGeneratedRedeemCode("");
    setRedeemExpiresIn(0);
    setRedeemAccount(null);
    setCopiedRedeem(false);
    setInputRedeemCode("");
    setResetGrantToken("");
    setVerifiedRedeemAccount(null);
    setNewPassword("");
    setConfirmNewPassword("");
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setResetResultAccount(null);
    loadCaptcha();
  };

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleForgotVerifySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!forgotName.trim()) {
      setErrorMsg("Mohon masukkan Nama Lengkap atau Username akun Anda.");
      return;
    }
    if (!forgotEmail.trim() || !forgotEmail.includes("@")) {
      setErrorMsg("Mohon masukkan Alamat Email terdaftar yang valid.");
      return;
    }
    if (!forgotPhone.trim()) {
      setErrorMsg("Mohon masukkan Nomor WhatsApp yang terdaftar.");
      return;
    }
    if (!captchaInput.trim()) {
      setErrorMsg("Mohon ketik kode CAPTCHA terlebih dahulu.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          name: forgotName.trim(),
          email: forgotEmail.trim(),
          phone: forgotPhone.trim(),
          captchaToken,
          captchaInput: captchaInput.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setGeneratedRedeemCode(json.redeemCode);
        setRedeemExpiresIn(Number(json.expiresInSeconds || 900));
        setRedeemAccount(json.account || null);
        setCopiedRedeem(false);
        setInputRedeemCode("");
        setResetGrantToken("");
        setNewPassword("");
        setConfirmNewPassword("");
        setForgotStep(2);
      } else {
        setErrorMsg(json.error || "Verifikasi gagal. Silakan periksa kembali data Anda.");
        if (json.refreshCaptcha) {
          loadCaptcha();
        }
      }
    } catch (err) {
      console.error("Forgot password request error:", err);
      setErrorMsg("Gagal terhubung ke server database MySQL. Pastikan Laragon aktif.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyRedeemCodeSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!inputRedeemCode.trim()) {
      setErrorMsg("Mohon masukkan Kode Redeem terlebih dahulu.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_redeem",
          redeemCode: inputRedeemCode.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.resetGrantToken) {
        setResetGrantToken(json.resetGrantToken);
        setVerifiedRedeemAccount(json.account || null);
        setNewPassword("");
        setConfirmNewPassword("");
        setShowNewPassword(false);
        setShowConfirmNewPassword(false);
        setForgotStep(4);
      } else {
        setErrorMsg(json.error || "Kode Redeem salah atau sudah kedaluwarsa.");
      }
    } catch (err) {
      console.error("Verify redeem code error:", err);
      setErrorMsg("Gagal terhubung ke server database MySQL.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleRedeemPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!resetGrantToken || !inputRedeemCode.trim()) {
      setErrorMsg("Silakan masukkan dan verifikasi Kode Redeem terlebih dahulu.");
      setForgotStep(3);
      return;
    }
    if (!newPassword.trim() || newPassword.trim().length < 6) {
      setErrorMsg("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (newPassword.trim() !== confirmNewPassword.trim()) {
      setErrorMsg("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "redeem",
          resetGrantToken,
          redeemCode: inputRedeemCode.trim(),
          newPassword: newPassword.trim(),
          confirmPassword: confirmNewPassword.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setResetResultAccount({
          username: json.username,
          satker: json.satker,
        });
        setGeneratedRedeemCode("");
        setInputRedeemCode("");
        setResetGrantToken("");
        setVerifiedRedeemAccount(null);
        setNewPassword("");
        setConfirmNewPassword("");
        setForgotStep(5);
      } else {
        setErrorMsg(json.error || "Kode Redeem tidak valid atau sudah kedaluwarsa.");
      }
    } catch (err) {
      console.error("Redeem password error:", err);
      setErrorMsg("Gagal terhubung ke server database MySQL.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleRequestAccountSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!reqName.trim()) {
      setErrorMsg("Mohon masukkan nama lengkap Anda.");
      return;
    }
    if (!reqEmail.trim()) {
      setErrorMsg("Mohon masukkan email kantor atau email yang disetujui.");
      return;
    }
    if (!reqPhone.trim()) {
      setErrorMsg("Mohon masukkan nomor WhatsApp atau kontak aktif Anda.");
      return;
    }
    if (!reqPassword.trim()) {
      setErrorMsg("Mohon tentukan kata sandi (password) untuk akun Anda.");
      return;
    }
    if (reqPassword.trim().length < 4) {
      setErrorMsg("Kata sandi minimal 4 karakter.");
      return;
    }
    if (reqPassword !== reqConfirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok. Mohon ketik ulang dengan benar.");
      return;
    }

    // Simpan ke MySQL via API
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reqName.trim(),
          email: reqEmail.trim(),
          satker: reqSatker,
          phone: reqPhone.trim(),
          title: reqTitle,
          password: reqPassword.trim(),
          note: reqNote.trim(),
        }),
      });
      if (!res.ok) {
        throw new Error("Gagal mengirim permohonan ke database");
      }
    } catch (err) {
      console.error("API submit request error:", err);
      setErrorMsg("Gagal menyimpan permohonan ke database server MySQL. Pastikan Laragon aktif.");
      return;
    }

    setReqSubmitted(true);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setTargetSatker("");

    if (!loginIdentifier.trim()) {
      setErrorMsg("Mohon masukkan Username, NIP, atau Nomor WhatsApp.");
      return;
    }

    if (!loginPassword.trim()) {
      setErrorMsg("Mohon masukkan kata sandi Anda.");
      return;
    }

    // Verifikasi murni via MySQL Database API
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          satker: loginSatker,
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          setSuccessMsg(`Berhasil masuk ke ${json.user.satker}! Mengarahkan ke dashboard...`);
          setTimeout(() => {
            onLoginSuccess && onLoginSuccess(json.user);
          }, 350);
          return;
        } else if (json.error) {
          setErrorMsg(json.error);
          if (json.registeredSatker) setTargetSatker(json.registeredSatker);
          return;
        }
      } else {
        setErrorMsg("Koneksi ke database MySQL Laragon terputus. Pastikan MySQL di Laragon aktif.");
      }
    } catch (err) {
      console.error("Database API error:", err);
      setErrorMsg("Gagal terhubung ke database server MySQL. Pastikan Laragon aktif.");
    }
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
    } else if (roleType === "pta" || roleType === "pusat") {
      mockUser = {
        name: "Pengurus Daerah PTA Bandar Lampung",
        username: "admin_pta",
        phone: "08119876543",
        role: "admin",
        roleLabel: "Pengurus Daerah PTWP PTA",
        title: "Pengurus Daerah",
        satker: "Pengadilan Tinggi Agama Bandar Lampung",
        level: "daerah",
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "10px" }}>
          <div
            style={{
              width: "78px",
              height: "78px",
              borderRadius: "50%",
              background: "#ffffff",
              border: "3px solid #eab308",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 28px rgba(0, 0, 0, 0.4)",
              overflow: "hidden",
            }}
          >
            <img
              src="/logo-ptwp.png"
              alt="Logo PTWP"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <div>
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
            {/* Header Login vs Lupa Password vs Formulir Pengajuan Akun */}
            {mode === "login" ? (
              <div style={{ marginBottom: "22px", textAlign: "center" }}>
                <h2 style={{ fontSize: "19px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                  Masuk ke Akun
                </h2>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
                  Silakan masukkan kredensial akun PTWP Anda
                </p>
              </div>
            ) : mode === "forgot_password" ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#f1f5f9",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#475569",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <ArrowLeft size={14} />
                    <span>Kembali ke Login</span>
                  </button>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#0f5132",
                      background: "#dcfce7",
                      padding: "4px 9px",
                      borderRadius: "6px",
                    }}
                  >
                    {forgotStep <= 4 ? `Langkah ${forgotStep} / 4` : "Reset Selesai"}
                  </span>
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                    {forgotStep === 1
                      ? "Lupa Kata Sandi"
                      : forgotStep === 2
                      ? "Kode Redeem Sementara"
                      : forgotStep === 3
                      ? "Verifikasi Kode Redeem"
                      : forgotStep === 4
                      ? "Buat Kata Sandi Baru"
                      : "Kata Sandi Diperbarui"}
                  </h2>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: 1.45 }}>
                    {forgotStep === 1
                      ? "Masukkan nama lengkap, alamat email, dan nomor WhatsApp terdaftar, lalu selesaikan CAPTCHA."
                      : forgotStep === 2
                      ? "Salin atau catat kode redeem berikut sebelum masa berlakunya habis."
                      : forgotStep === 3
                      ? "Masukkan kode redeem Anda terlebih dahulu untuk melanjutkan ke pembuatan kata sandi baru."
                      : forgotStep === 4
                      ? "Kode redeem terverifikasi. Silakan buat kata sandi baru untuk akun Anda."
                      : "Akun Anda kini dapat diakses menggunakan kata sandi yang baru."}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErrorMsg("");
                      setSuccessMsg("");
                      setReqSubmitted(false);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#f1f5f9",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#475569",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <ArrowLeft size={14} />
                    <span>Kembali ke Login</span>
                  </button>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#15803d",
                      background: "#dcfce7",
                      padding: "4px 9px",
                      borderRadius: "6px",
                    }}
                  >
                    Verifikasi Admin
                  </span>
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                    Formulir Pengajuan Akun
                  </h2>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: 1.45 }}>
                    Lengkapi data di bawah ini. Administrator akan memverifikasi dan menerbitkan akun Anda.
                  </p>
                </div>
              </div>
            )}

            {/* Alert Messages */}
            {errorMsg && (
              <div
                style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "12.5px",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                  <span>⚠️ {errorMsg}</span>
                </div>
                {targetSatker && (
                  <button
                    type="button"
                    onClick={() => {
                      setLoginSatker(targetSatker);
                      setTargetSatker("");
                      setErrorMsg("");
                    }}
                    style={{
                      background: "#dc2626",
                      color: "#fff",
                      border: "none",
                      padding: "5px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Pindah ke {targetSatker}
                  </button>
                )}
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
              <form key="login-form" onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Pilihan Satker */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                    Satuan Kerja / Cabang Pengadilan
                  </label>
                  <div style={{ position: "relative" }} ref={loginDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsLoginDropdownOpen((prev) => !prev)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: `1.5px solid ${isLoginDropdownOpen ? "#16a34a" : "#cbd5e1"}`,
                        fontSize: "13px",
                        fontWeight: loginSatker ? 600 : 500,
                        color: loginSatker ? "#0f172a" : "#94a3b8",
                        background: "#f8fafc",
                        outline: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                        boxShadow: isLoginDropdownOpen ? "0 0 0 3px rgba(22, 163, 74, 0.15)" : "none",
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {loginSatker || "Pilih Satuan Kerja / Cabang Pengadilan..."}
                      </span>
                      <ChevronDown
                        size={16}
                        color="#64748b"
                        style={{
                          flexShrink: 0,
                          transform: isLoginDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                        }}
                      />
                    </button>

                    {isLoginDropdownOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 4px)",
                          left: 0,
                          right: 0,
                          zIndex: 60,
                          background: "#ffffff",
                          borderRadius: "12px",
                          border: "1.5px solid #cbd5e1",
                          boxShadow: "0 14px 30px -4px rgba(0, 0, 0, 0.2), 0 4px 10px -2px rgba(0, 0, 0, 0.08)",
                          maxHeight: "220px",
                          overflowY: "auto",
                          padding: "6px",
                        }}
                      >
                        {SAMPLE_SATKER.map((satker, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setLoginSatker(satker);
                              setIsLoginDropdownOpen(false);
                            }}
                            style={{
                              padding: "9px 12px",
                              borderRadius: "8px",
                              fontSize: "12.5px",
                              fontWeight: satker === loginSatker ? 700 : 500,
                              color: satker === loginSatker ? "#166534" : "#1e293b",
                              background: satker === loginSatker ? "#dcfce7" : "transparent",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "8px",
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (satker !== loginSatker) e.currentTarget.style.background = "#f1f5f9";
                            }}
                            onMouseLeave={(e) => {
                              if (satker !== loginSatker) e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {satker}
                            </span>
                            {satker === loginSatker && <Check size={14} color="#16a34a" style={{ flexShrink: 0 }} />}
                          </div>
                        ))}
                      </div>
                    )}
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
                    <button
                      type="button"
                      onClick={openForgotPasswordMode}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        fontSize: "11.5px",
                        color: "#0f5132",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Lupa password?
                    </button>
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

                {/* Hubungi Administrasi Prompt */}
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "14px",
                    borderTop: "1px solid #f1f5f9",
                    textAlign: "center",
                    fontSize: "13px",
                    color: "#64748b",
                  }}
                >
                  Belum memiliki akun?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("request_account");
                      setErrorMsg("");
                      setSuccessMsg("");
                      setReqSubmitted(false);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0f5132",
                      fontWeight: 700,
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontSize: "13px",
                      padding: 0,
                    }}
                  >
                    Hubungi Administrasi
                  </button>
                </div>
              </form>
            ) : mode === "forgot_password" ? (
              /* ========================================================
                 FORMULIR LUPA PASSWORD & KODE REDEEM
                 ======================================================== */
              <div>
                {forgotStep === 1 && (
                  <form
                    key="forgot-step-1-form"
                    onSubmit={handleForgotVerifySubmit}
                    autoComplete="off"
                    style={{ display: "flex", flexDirection: "column", gap: "14px" }}
                  >
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                        Nama Lengkap atau Username <span style={{ color: "#dc2626" }}>*</span>
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
                          name="forgot_name"
                          autoComplete="off"
                          placeholder="Sesuai nama atau username terdaftar"
                          value={forgotName}
                          onChange={(e) => setForgotName(e.target.value)}
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

                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                        Alamat Email Terdaftar <span style={{ color: "#dc2626" }}>*</span>
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
                        <Mail size={18} color="#64748b" />
                        <input
                          type="email"
                          name="forgot_email"
                          autoComplete="off"
                          placeholder="Contoh: nama@instansi.go.id"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
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

                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                        Nomor WhatsApp Terdaftar <span style={{ color: "#dc2626" }}>*</span>
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
                        <Phone size={18} color="#64748b" />
                        <input
                          type="tel"
                          name="forgot_phone"
                          autoComplete="off"
                          placeholder="Contoh: 08123456789"
                          value={forgotPhone}
                          onChange={(e) => setForgotPhone(e.target.value)}
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

                    {/* CAPTCHA Box */}
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                        Verifikasi Keamanan (CAPTCHA) <span style={{ color: "#dc2626" }}>*</span>
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <div
                          style={{
                            flex: "0 0 auto",
                            width: "170px",
                            height: "52px",
                            borderRadius: "10px",
                            border: "1.5px solid #cbd5e1",
                            background: "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          {captchaLoading ? (
                            <span style={{ fontSize: "11.5px", color: "#64748b" }}>Memuat...</span>
                          ) : captchaSvg ? (
                            <img
                              src={`data:image/svg+xml;utf8,${encodeURIComponent(captchaSvg)}`}
                              alt="Kode CAPTCHA"
                              style={{ width: "170px", height: "52px", display: "block", userSelect: "none" }}
                            />
                          ) : (
                            <span style={{ fontSize: "11.5px", color: "#dc2626" }}>Gagal memuat</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={loadCaptcha}
                          disabled={captchaLoading}
                          title="Muat ulang CAPTCHA"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: "1.5px solid #cbd5e1",
                            background: "#ffffff",
                            color: "#334155",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            height: "52px",
                          }}
                        >
                          <RefreshCw size={15} />
                          <span>Ganti</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        name="forgot_captcha"
                        autoComplete="off"
                        placeholder="Ketik 5 karakter CAPTCHA di atas"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                        maxLength={8}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "13.5px",
                          fontFamily: "monospace",
                          letterSpacing: "2px",
                          fontWeight: 700,
                          background: "#f8fafc",
                          color: "#0f172a",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "12px",
                        marginTop: "4px",
                        borderRadius: "12px",
                        border: "none",
                        background: forgotLoading
                          ? "#94a3b8"
                          : "linear-gradient(135deg, #146c43 0%, #0f5132 100%)",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: 700,
                        cursor: forgotLoading ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 12px rgba(15, 81, 50, 0.35)",
                      }}
                    >
                      <ShieldCheck size={16} />
                      <span>{forgotLoading ? "Memverifikasi..." : "Verifikasi & Buat Kode Redeem"}</span>
                    </button>

                    <div style={{ textAlign: "center", paddingTop: "6px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg("");
                          setInputRedeemCode("");
                          setResetGrantToken("");
                          setNewPassword("");
                          setConfirmNewPassword("");
                          setForgotStep(3);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#0f5132",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Sudah memiliki Kode Redeem aktif? Masukkan kode di sini
                      </button>
                    </div>
                  </form>
                )}

                {forgotStep === 2 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1.5px solid #86efac",
                        borderRadius: "14px",
                        padding: "16px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#15803d", textTransform: "uppercase", marginBottom: "6px" }}>
                        Kode Redeem Reset Password
                      </div>

                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: "22px",
                          fontWeight: 800,
                          letterSpacing: "2px",
                          color: "#0f5132",
                          background: "#ffffff",
                          border: "1px dashed #16a34a",
                          borderRadius: "10px",
                          padding: "12px 10px",
                          marginBottom: "10px",
                          userSelect: "all",
                        }}
                      >
                        {generatedRedeemCode}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator?.clipboard?.writeText) {
                              navigator.clipboard.writeText(generatedRedeemCode);
                              setCopiedRedeem(true);
                              setTimeout(() => setCopiedRedeem(false), 2000);
                            }
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            background: "#ffffff",
                            border: "1px solid #86efac",
                            color: "#0f5132",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {copiedRedeem ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                          <span>{copiedRedeem ? "Kode Tersalin" : "Salin Kode"}</span>
                        </button>

                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            background: redeemExpiresIn > 0 ? "#fef3c7" : "#fee2e2",
                            color: redeemExpiresIn > 0 ? "#b45309" : "#dc2626",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          <Clock size={13} />
                          <span>
                            {redeemExpiresIn > 0
                              ? `Berlaku ${formatCountdown(redeemExpiresIn)}`
                              : "Kode Kedaluwarsa"}
                          </span>
                        </span>
                      </div>
                    </div>

                    {redeemAccount && (
                      <div
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "10px 12px",
                          fontSize: "12px",
                          color: "#334155",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div><strong>Nama:</strong> {redeemAccount.name}</div>
                        {redeemAccount.email && <div><strong>Email:</strong> {redeemAccount.email}</div>}
                        <div><strong>Username Login:</strong> <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{redeemAccount.username}</span></div>
                        <div><strong>Satker:</strong> {redeemAccount.satker}</div>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        fontSize: "11.5px",
                        color: "#92400e",
                        lineHeight: 1.45,
                      }}
                    >
                      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span>
                        Kode dibuat acak hanya untuk sekali pakai dan akan hangus otomatis jika sudah digunakan atau masa berlakunya habis.
                      </span>
                    </div>

                    {redeemExpiresIn > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg("");
                          setInputRedeemCode("");
                          setResetGrantToken("");
                          setNewPassword("");
                          setConfirmNewPassword("");
                          setForgotStep(3);
                        }}
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
                        }}
                      >
                        <span>Next: Masukkan Kode Redeem</span>
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={openForgotPasswordMode}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          width: "100%",
                          padding: "12px",
                          borderRadius: "12px",
                          border: "none",
                          background: "#dc2626",
                          color: "#ffffff",
                          fontSize: "14px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <RefreshCw size={16} />
                        <span>Waktu Habis — Buat Kode Baru</span>
                      </button>
                    )}
                  </div>
                )}

                {forgotStep === 3 && (
                  <form
                    key="forgot-step-3-form"
                    onSubmit={handleVerifyRedeemCodeSubmit}
                    autoComplete="off"
                    style={{ display: "flex", flexDirection: "column", gap: "14px" }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                        <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                          Masukkan Kode Redeem <span style={{ color: "#dc2626" }}>*</span>
                        </label>
                        {generatedRedeemCode && (
                          <span style={{ fontSize: "11.5px", fontWeight: 700, color: redeemExpiresIn > 0 ? "#b45309" : "#dc2626" }}>
                            {redeemExpiresIn > 0 ? `Sisa waktu ${formatCountdown(redeemExpiresIn)}` : "Kedaluwarsa"}
                          </span>
                        )}
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
                        <KeyRound size={18} color="#64748b" />
                        <input
                          type="text"
                          name="ptwp_redeem_code_input"
                          autoComplete="off"
                          spellCheck={false}
                          placeholder="Contoh: PTWP-XXXX-XXXX"
                          value={inputRedeemCode}
                          onChange={(e) => setInputRedeemCode(e.target.value.toUpperCase())}
                          style={{
                            border: "none",
                            background: "transparent",
                            outline: "none",
                            width: "100%",
                            fontSize: "14px",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            letterSpacing: "1px",
                            color: "#0f172a",
                          }}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "12px",
                        marginTop: "2px",
                        borderRadius: "12px",
                        border: "none",
                        background: forgotLoading
                          ? "#94a3b8"
                          : "linear-gradient(135deg, #146c43 0%, #0f5132 100%)",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: 700,
                        cursor: forgotLoading ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 12px rgba(15, 81, 50, 0.35)",
                      }}
                    >
                      <span>{forgotLoading ? "Memeriksa Kode..." : "Verifikasi Kode Redeem"}</span>
                      <ArrowRight size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg("");
                        if (generatedRedeemCode) {
                          setForgotStep(2);
                        } else {
                          openForgotPasswordMode();
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#475569",
                        fontWeight: 600,
                        fontSize: "12.5px",
                        cursor: "pointer",
                      }}
                    >
                      {generatedRedeemCode ? "Lihat Kode Redeem Lagi" : "Minta Kode Redeem Baru"}
                    </button>
                  </form>
                )}

                {forgotStep === 4 && (
                  <form
                    key="forgot-step-4-form"
                    onSubmit={handleRedeemPasswordSubmit}
                    autoComplete="off"
                    style={{ display: "flex", flexDirection: "column", gap: "14px" }}
                  >
                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #86efac",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        fontSize: "12px",
                        color: "#166534",
                        display: "flex",
                        flexDirection: "column",
                        gap: "3px",
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>✓ Kode Redeem Terverifikasi ({inputRedeemCode})</div>
                      {verifiedRedeemAccount && (
                        <div>
                          Akun: <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{verifiedRedeemAccount.username}</span> ({verifiedRedeemAccount.satker})
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                        Kata Sandi Baru <span style={{ color: "#dc2626" }}>*</span>
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
                        <Lock size={18} color="#64748b" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="ptwp_new_password"
                          autoComplete="new-password"
                          placeholder="Minimal 6 karakter"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
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
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((p) => !p)}
                          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                        Ulangi Kata Sandi Baru <span style={{ color: "#dc2626" }}>*</span>
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
                        <Lock size={18} color="#64748b" />
                        <input
                          type={showConfirmNewPassword ? "text" : "password"}
                          name="ptwp_confirm_new_password"
                          autoComplete="new-password"
                          placeholder="Ketik ulang kata sandi baru"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
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
                        <button
                          type="button"
                          onClick={() => setShowConfirmNewPassword((p) => !p)}
                          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "12px",
                        marginTop: "4px",
                        borderRadius: "12px",
                        border: "none",
                        background: forgotLoading
                          ? "#94a3b8"
                          : "linear-gradient(135deg, #146c43 0%, #0f5132 100%)",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: 700,
                        cursor: forgotLoading ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 12px rgba(15, 81, 50, 0.35)",
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>{forgotLoading ? "Menyimpan..." : "Simpan Kata Sandi Baru"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg("");
                        setResetGrantToken("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                        setForgotStep(3);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#475569",
                        fontWeight: 600,
                        fontSize: "12.5px",
                        cursor: "pointer",
                      }}
                    >
                      Kembali ke Input Kode Redeem
                    </button>
                  </form>
                )}

                {forgotStep === 5 && (
                  <div style={{ textAlign: "center", padding: "10px 4px" }}>
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        background: "#dcfce7",
                        color: "#16a34a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px auto",
                        boxShadow: "0 6px 16px rgba(22, 163, 74, 0.2)",
                      }}
                    >
                      <CheckCircle2 size={30} />
                    </div>

                    <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                      Kata Sandi Berhasil Diubah!
                    </h3>
                    <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, marginBottom: "18px" }}>
                      Kata sandi baru telah aktif dan kode redeem sudah hangus secara otomatis.
                    </p>

                    {resetResultAccount && (
                      <div
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: "12px 14px",
                          marginBottom: "18px",
                          textAlign: "left",
                          fontSize: "12.5px",
                          color: "#334155",
                          display: "flex",
                          flexDirection: "column",
                          gap: "5px",
                        }}
                      >
                        <div><strong>Username Login:</strong> <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{resetResultAccount.username}</span></div>
                        <div><strong>Satker:</strong> {resetResultAccount.satker}</div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (resetResultAccount?.username) {
                          setLoginIdentifier(resetResultAccount.username);
                        }
                        setLoginSatker("");
                        setLoginPassword("");
                        setErrorMsg("");
                        setSuccessMsg("Silakan pilih Satuan Kerja dan masuk menggunakan kata sandi baru Anda.");
                        setMode("login");
                      }}
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
                      }}
                    >
                      <span>Masuk ke Akun Sekarang</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            ) : reqSubmitted ? (
              /* Tampilan Konfirmasi Sukses Pengajuan Akun */
              <div style={{ textAlign: "center", padding: "12px 4px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "#dcfce7",
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px auto",
                    boxShadow: "0 6px 16px rgba(22, 163, 74, 0.2)",
                  }}
                >
                  <CheckCircle2 size={30} />
                </div>

                <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                  Pengajuan Berhasil Dikirim!
                </h3>

                <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, marginBottom: "18px" }}>
                  Data permohonan akun atas nama <strong>{reqName}</strong> telah diterima untuk diverifikasi oleh Administrator Satker <strong>{reqSatker}</strong>.
                </p>

                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    marginBottom: "20px",
                    textAlign: "left",
                    fontSize: "12px",
                    color: "#334155",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div><strong>Nama:</strong> {reqName}</div>
                  <div><strong>Email:</strong> {reqEmail}</div>
                  <div><strong>Satker:</strong> {reqSatker}</div>
                  <div><strong>Jabatan:</strong> {reqTitle}</div>
                  <div><strong>No. WA:</strong> {reqPhone}</div>
                  <div><strong>Kata Sandi:</strong> •••••••• <span style={{ color: "#16a34a", fontSize: "11px", fontWeight: 600 }}>(Telah diatur sendiri)</span></div>
                  {reqNote && <div><strong>Catatan:</strong> {reqNote}</div>}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <a
                    href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                      `Halo Administrator PTWP, saya telah mengisi formulir pengajuan akun baru:\n\n• Nama: ${reqName}\n• Email: ${reqEmail}\n• Satker: ${reqSatker}\n• No WA: ${reqPhone}\n• Jabatan: ${reqTitle}\n\nMohon diverifikasi dan diaktifkan. Terima kasih.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "11px",
                      borderRadius: "12px",
                      background: "#16a34a",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "13px",
                      textDecoration: "none",
                      boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
                    }}
                  >
                    <Phone size={15} />
                    <span>Konfirmasi Cepat via WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setReqSubmitted(false);
                      setReqPassword("");
                      setReqConfirmPassword("");
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#334155",
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Kembali ke Halaman Login
                  </button>
                </div>
              </div>
            ) : (
              /* ========================================================
                 FORMULIR PENGAJUAN AKUN (SESUAI GAMBAR 2)
                 ======================================================== */
              <form onSubmit={handleRequestAccountSubmit} style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
                {/* Nama lengkap */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                    Nama lengkap <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "13px",
                      background: "#f8fafc",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>

                {/* Email kantor atau email yang disetujui */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                    Email kantor atau email yang disetujui <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="nama@instansi.go.id"
                    value={reqEmail}
                    onChange={(e) => setReqEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "13px",
                      background: "#f8fafc",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>

                {/* Satuan kerja */}
                <div style={{ position: "relative" }} ref={reqDropdownRef}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                    Satuan kerja <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsReqDropdownOpen((prev) => !prev)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: `1.5px solid ${isReqDropdownOpen ? "#16a34a" : "#cbd5e1"}`,
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#0f172a",
                      background: "#f8fafc",
                      outline: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      boxSizing: "border-box",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {reqSatker}
                    </span>
                    <ChevronDown
                      size={16}
                      color="#64748b"
                      style={{
                        flexShrink: 0,
                        transform: isReqDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    />
                  </button>

                  {isReqDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        right: 0,
                        zIndex: 50,
                        background: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                        maxHeight: "190px",
                        overflowY: "auto",
                      }}
                    >
                      {SAMPLE_SATKER.map((satker) => (
                        <div
                          key={satker}
                          onClick={() => {
                            setReqSatker(satker);
                            setIsReqDropdownOpen(false);
                          }}
                          style={{
                            padding: "9px 14px",
                            fontSize: "12.5px",
                            fontWeight: reqSatker === satker ? 700 : 500,
                            color: reqSatker === satker ? "#0f5132" : "#334155",
                            background: reqSatker === satker ? "#f0fdf4" : "transparent",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          <span>{satker}</span>
                          {reqSatker === satker && <Check size={14} color="#0f5132" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Nomor WhatsApp & Jabatan */}
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                      No. WhatsApp <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="08123456789"
                      value={reqPhone}
                      onChange={(e) => setReqPhone(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "13px",
                        background: "#f8fafc",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                      Jabatan
                    </label>
                    <select
                      value={reqTitle}
                      onChange={(e) => setReqTitle(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 8px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "13px",
                        background: "#f8fafc",
                        outline: "none",
                        cursor: "pointer",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="Hakim">Hakim</option>
                      <option value="Panitera">Panitera</option>
                      <option value="Sekretaris">Sekretaris</option>
                      <option value="Kasubag">Kasubag</option>
                      <option value="Panitera Pengganti">Panitera Pengganti</option>
                      <option value="Jurusita">Jurusita</option>
                      <option value="Staf Pelaksana">Staf Pelaksana</option>
                      <option value="PPNPN">PPNPN</option>
                    </select>
                  </div>
                </div>

                {/* Buat Kata Sandi Akun & Konfirmasi Kata Sandi */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                      Buat Kata Sandi <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        border: "1.5px solid #cbd5e1",
                        borderRadius: "10px",
                        padding: "9px 12px",
                        background: "#f8fafc",
                      }}
                    >
                      <Lock size={15} color="#64748b" style={{ flexShrink: 0 }} />
                      <input
                        type={showReqPassword ? "text" : "password"}
                        placeholder="Min. 4 karakter"
                        value={reqPassword}
                        onChange={(e) => setReqPassword(e.target.value)}
                        style={{
                          border: "none",
                          background: "transparent",
                          outline: "none",
                          width: "100%",
                          fontSize: "13px",
                          color: "#0f172a",
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowReqPassword(!showReqPassword)}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "#94a3b8",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        {showReqPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                      Ulangi Kata Sandi <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        border: "1.5px solid #cbd5e1",
                        borderRadius: "10px",
                        padding: "9px 12px",
                        background: "#f8fafc",
                      }}
                    >
                      <Lock size={15} color="#64748b" style={{ flexShrink: 0 }} />
                      <input
                        type={showReqConfirmPassword ? "text" : "password"}
                        placeholder="Ulangi sandi"
                        value={reqConfirmPassword}
                        onChange={(e) => setReqConfirmPassword(e.target.value)}
                        style={{
                          border: "none",
                          background: "transparent",
                          outline: "none",
                          width: "100%",
                          fontSize: "13px",
                          color: "#0f172a",
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowReqConfirmPassword(!showReqConfirmPassword)}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "#94a3b8",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        {showReqConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "-4px", lineHeight: "1.4" }}>
                  🔒 <em>Kata sandi ini Anda buat sendiri untuk login setelah disetujui.</em>
                </div>

                {/* Catatan Pengajuan (Opsional) */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "5px" }}>
                    Catatan Pengajuan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Keperluan akun / pegawai baru / mutasi..."
                    value={reqNote}
                    onChange={(e) => setReqNote(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "13px",
                      background: "#f8fafc",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "12px",
                    marginTop: "6px",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(135deg, #146c43 0%, #0f5132 100%)",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(15, 81, 50, 0.35)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Send size={15} />
                  <span>Kirim Pengajuan ke Administrator</span>
                </button>
              </form>
            )}
        </div>
      </div>
    </div>
  );
}
