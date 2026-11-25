"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  MessageCircle,
  Phone,
  Building2,
  Eye,
  EyeOff,
  RefreshCw,
  Lock,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
import {
  getAccountRequests,
  approveAccountRequest,
  rejectAccountRequest,
  deleteAccountRequest,
  getRegisteredUsers,
  deleteRegisteredUser,
  addDirectUser,
} from "@/services/storageService";
import { SAMPLE_SATKER } from "@/components/AuthView";

export default function AdminView({ currentUser }) {
  const [activeSubTab, setActiveSubTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [satkerFilter, setSatkerFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [notification, setNotification] = useState(null);
  const [approvedModalData, setApprovedModalData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "123",
    satker: SAMPLE_SATKER[0] || "Pengadilan Agama Gunung Sugih",
    phone: "",
    email: "",
    role: "anggota",
    title: "Pegawai",
  });

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [resReq, resUsers] = await Promise.all([
        fetch("/api/requests", { cache: "no-store" }),
        fetch("/api/users", { cache: "no-store" }),
      ]);
      if (resReq.ok && resUsers.ok) {
        const jsonReq = await resReq.json();
        const jsonUsers = await resUsers.json();
        if (jsonReq.success && Array.isArray(jsonReq.data)) {
          setRequests(jsonReq.data);
        }
        if (jsonUsers.success && Array.isArray(jsonUsers.data)) {
          setUsers(jsonUsers.data);
        }
      }
    } catch (err) {
      console.error("Gagal memuat data dari API MySQL:", err);
      showToast("Gagal terhubung ke MySQL Laragon.", "error");
    } finally {
      setTimeout(() => setIsRefreshing(false), 350);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  const handleCopy = (text, key) => {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast(`Tersalin: "${text}"`, "info");
      setTimeout(() => {
        setCopiedKey((curr) => (curr === key ? null : curr));
      }, 2000);
    }
  };

  const handleApprove = async (req) => {
    try {
      setProcessingId(req.id);
      const res = await fetch("/api/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: req.id, action: "approve" }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          await loadData();
          setApprovedModalData({
            name: req.name,
            username: json.user?.username || req.name.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
            satker: req.satker,
            phone: req.phone,
            email: req.email,
            isSelfPassword: true,
          });
          showToast(`Akses berhasil diizinkan untuk ${req.name}!`, "success");
          return;
        } else {
          showToast(json.error || "Gagal mengizinkan permohonan.", "error");
        }
      }
    } catch (e) {
      showToast("Gagal memproses permohonan ke MySQL.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id, name) => {
    if (confirm(`Yakin ingin menolak permohonan akun untuk "${name}"?`)) {
      try {
        setProcessingId(id);
        const res = await fetch("/api/requests", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action: "reject" }),
        });
        if (res.ok) {
          await loadData();
          showToast(`Permohonan ${name} berhasil ditolak.`, "info");
        }
      } catch (e) {
        showToast("Gagal menolak permohonan.", "error");
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleDeleteRequest = async (id) => {
    if (confirm("Hapus catatan permohonan ini dari daftar?")) {
      try {
        const res = await fetch(`/api/requests?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (res.ok) {
          await loadData();
          showToast("Data permohonan berhasil dihapus dari database.", "info");
        }
      } catch (e) {
        showToast("Gagal menghapus data permohonan.", "error");
      }
    }
  };

  const handleRevokeUser = async (username, name) => {
    const uLower = String(username || "").toLowerCase();
    if (uLower === "aku admin" || uLower === "root") {
      alert("Akun Super Administrator tidak dapat dihapus!");
      return;
    }
    if (confirm(`PENTING: Apakah Anda yakin ingin MENCABUT HAK AKSES akun "${name}" (${username})? Pengguna ini tidak akan bisa login lagi.`)) {
      try {
        const res = await fetch(`/api/users?username=${encodeURIComponent(username)}`, { method: "DELETE" });
        if (res.ok) {
          await loadData();
          showToast(`Hak akses akun "${name}" berhasil dicabut dari database MySQL.`, "success");
        }
      } catch (e) {
        showToast("Gagal mencabut hak akses pengguna.", "error");
      }
    }
  };

  const handleAddDirectUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.username.trim() || !newUser.password.trim()) {
      showToast("Nama, Username, dan Password wajib diisi.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        await loadData();
        showToast(`Akun "${newUser.name}" berhasil dibuat & langsung aktif di MySQL!`, "success");
        setNewUser({
          name: "",
          username: "",
          password: "123",
          satker: SAMPLE_SATKER[0] || "Pengadilan Agama Gunung Sugih",
          phone: "",
          email: "",
          role: "anggota",
          title: "Pegawai",
        });
        setActiveSubTab("users");
      } else {
        const json = await res.json();
        showToast(json.error || "Gagal menambahkan akun.", "error");
      }
    } catch (e) {
      showToast("Gagal menghubungi server database.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingRequestsCount = requests.filter((r) => r.status === "pending" || !r.status).length;

  const filteredRequests = requests.filter((r) => {
    const matchSearch =
      (r.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.satker || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.phone || "").includes(searchQuery);

    const matchSatker = satkerFilter === "ALL" || r.satker === satkerFilter;
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "pending" && (r.status === "pending" || !r.status)) ||
      r.status === statusFilter;

    return matchSearch && matchSatker && matchStatus;
  });

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.satker || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone || "").includes(searchQuery);

    const matchSatker = satkerFilter === "ALL" || u.satker === satkerFilter;
    return matchSearch && matchSatker;
  });

  return (
    <div className="admin-view-root" style={{ padding: "24px 20px", maxWidth: "1280px", margin: "0 auto", color: "var(--text-primary)" }}>
      {/* Toast Notification Interaktif dengan Progress Bar */}
      {notification && (
        <div
          className="admin-toast-box"
          style={{
            background: notification.type === "error" ? "#fef2f2" : notification.type === "info" ? "#f0f9ff" : "#f0fdf4",
            color: notification.type === "error" ? "#b91c1c" : notification.type === "info" ? "#0369a1" : "#15803d",
            border: `1.5px solid ${notification.type === "error" ? "#fca5a5" : notification.type === "info" ? "#bae6fd" : "#86efac"}`,
          }}
        >
          <div className="admin-toast-content">
            <span style={{ fontSize: "16px", display: "flex", alignItems: "center" }}>
              {notification.type === "error" ? (
                <AlertTriangle size={18} color="#dc2626" />
              ) : notification.type === "info" ? (
                <Sparkles size={18} color="#0284c7" />
              ) : (
                <CheckCircle2 size={18} color="#16a34a" />
              )}
            </span>
            <span style={{ flex: 1 }}>{notification.message}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                padding: "2px",
                display: "inline-flex",
                opacity: 0.7,
              }}
              title="Tutup notifikasi"
            >
              <X size={15} />
            </button>
          </div>
          <div
            className="admin-toast-progress-bar"
            style={{
              background: notification.type === "error" ? "#ef4444" : notification.type === "info" ? "#0284c7" : "#16a34a",
            }}
          />
        </div>
      )}

      {/* HEADER BANNER KHUSUS ADMIN DENGAN EFEK INTERAKTIF */}
      <div className="admin-header-banner">
        <div className="admin-banner-glow" />
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "18px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "15px",
                background: "linear-gradient(135deg, #16a34a 0%, #0f5132 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.35)",
                border: "2px solid #fef08a",
                transition: "transform 0.25s ease",
              }}
            >
              <ShieldCheck size={32} color="#fef08a" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px", flexWrap: "wrap" }}>
                <span className="admin-banner-badge">
                  <Sparkles size={11} />
                  SUPER ADMINISTRATOR
                </span>
                <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.8)", fontWeight: 500 }}>
                  Otoritas Akses Wilayah Hukum PTA Bandar Lampung
                </span>
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
                Portal Manajemen Akun & Otorisasi RBAC
              </h1>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", margin: "4px 0 0 0" }}>
                Setujui permohonan akun masuk, terbitkan izin akses login, atau cabut hak akses pengguna.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={isRefreshing}
            className="admin-refresh-btn"
            title="Segarkan data permohonan dan akun langsung dari MySQL"
          >
            <RefreshCw size={15} className={isRefreshing ? "admin-spin-icon" : ""} />
            <span>{isRefreshing ? "Menyegarkan..." : "Segarkan Data"}</span>
          </button>
        </div>
      </div>

      {/* STATS SUMMARY CARDS DENGAN INTERAKSI HOVER & QUICK FILTER */}
      <div className="admin-stats-grid">
        {/* Card 1: Permohonan Menunggu */}
        <div
          className="admin-stat-card"
          onClick={() => {
            setActiveSubTab("requests");
            setStatusFilter("pending");
          }}
          title="Klik untuk melihat permohonan yang menunggu persetujuan"
        >
          <div className="admin-stat-icon-wrap" style={{ background: "#fef3c7", color: "#d97706" }}>
            <Clock size={23} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", fontWeight: 700, display: "flex", alignItems: "center" }}>
              <span>Permohonan Menunggu</span>
              {pendingRequestsCount > 0 && <span className="admin-ping-dot" title="Perlu ditindaklanjuti" />}
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#d97706", lineHeight: 1.2, marginTop: "2px" }}>
              {pendingRequestsCount}
            </div>
          </div>
        </div>

        {/* Card 2: Total Akun Terdaftar */}
        <div
          className="admin-stat-card"
          onClick={() => {
            setActiveSubTab("users");
          }}
          title="Klik untuk melihat daftar seluruh akun aktif"
        >
          <div className="admin-stat-icon-wrap" style={{ background: "#dcfce7", color: "#16a34a" }}>
            <UserCheck size={23} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", fontWeight: 700 }}>
              Total Akun Terdaftar
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#16a34a", lineHeight: 1.2, marginTop: "2px" }}>
              {users.length}
            </div>
          </div>
        </div>

        {/* Card 3: Satker Terlayani */}
        <div
          className="admin-stat-card"
          onClick={() => {
            setSatkerFilter("ALL");
          }}
          title="Klik untuk reset filter satuan kerja"
        >
          <div className="admin-stat-icon-wrap" style={{ background: "#f1f5f9", color: "#475569" }}>
            <Building2 size={23} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", fontWeight: 700 }}>
              Satker Terlayani
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-primary, #0f172a)", lineHeight: 1.2, marginTop: "2px" }}>
              {SAMPLE_SATKER.length} Satker
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS ADMIN & SEARCH BAR INTERAKTIF */}
      <div className="admin-tabs-nav-bar">
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveSubTab("requests")}
            className={`admin-nav-tab ${activeSubTab === "requests" ? "active" : ""}`}
          >
            <span>Permohonan Masuk (Izin Akun)</span>
            {pendingRequestsCount > 0 ? (
              <span className="admin-badge-count admin-badge-pulse-red">
                {pendingRequestsCount}
              </span>
            ) : (
              <span
                className="admin-badge-count"
                style={{ background: "var(--border-light, #e2e8f0)", color: "var(--text-muted, #64748b)" }}
              >
                {requests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("users")}
            className={`admin-nav-tab ${activeSubTab === "users" ? "active" : ""}`}
          >
            <span>Daftar Akun Terdaftar (Hapus Akses)</span>
            <span
              className="admin-badge-count"
              style={{ background: "var(--border-light, #e2e8f0)", color: "var(--text-muted, #64748b)" }}
            >
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("add_user")}
            className={`admin-nav-tab ${activeSubTab === "add_user" ? "active" : ""}`}
          >
            <Plus size={16} />
            <span>Tambah Akun Baru</span>
          </button>
        </div>

        {/* Global Search Bar & Satker Filter */}
        {activeSubTab !== "add_user" && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div className="admin-search-wrapper">
              <Search size={15} color="#64748b" />
              <input
                type="text"
                placeholder="Cari nama, satker, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="admin-clear-search-btn"
                  title="Bersihkan pencarian"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Satker */}
            <select
              value={satkerFilter}
              onChange={(e) => setSatkerFilter(e.target.value)}
              className="admin-satker-select"
            >
              <option value="ALL">Semua Satker ({SAMPLE_SATKER.length})</option>
              {SAMPLE_SATKER.map((satker) => (
                <option key={satker} value={satker}>
                  {satker.replace("Pengadilan Agama", "PA").replace("Pengadilan Tinggi Agama", "PTA")}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ========================================================
          SUBTAB 1: PERMOHONAN AKUN MASUK (IZINKAN / TOLAK)
          ======================================================== */}
      {activeSubTab === "requests" && (
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className="admin-filter-pill-btn"
              style={{
                background: statusFilter === "ALL" ? "#0f5132" : "var(--border-light, #e2e8f0)",
                color: statusFilter === "ALL" ? "#ffffff" : "var(--text-muted, #64748b)",
                boxShadow: statusFilter === "ALL" ? "0 2px 8px rgba(15, 81, 50, 0.3)" : "none",
              }}
            >
              <span>Semua Permohonan</span>
              <span style={{ fontSize: "11px", opacity: 0.9 }}>({requests.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className="admin-filter-pill-btn"
              style={{
                background: statusFilter === "pending" ? "#d97706" : "var(--border-light, #e2e8f0)",
                color: statusFilter === "pending" ? "#ffffff" : "var(--text-muted, #64748b)",
                boxShadow: statusFilter === "pending" ? "0 2px 8px rgba(217, 119, 6, 0.3)" : "none",
              }}
            >
              <Clock size={13} />
              <span>Menunggu Izin</span>
              <span style={{ fontSize: "11px", opacity: 0.9 }}>({pendingRequestsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("approved")}
              className="admin-filter-pill-btn"
              style={{
                background: statusFilter === "approved" ? "#16a34a" : "var(--border-light, #e2e8f0)",
                color: statusFilter === "approved" ? "#ffffff" : "var(--text-muted, #64748b)",
                boxShadow: statusFilter === "approved" ? "0 2px 8px rgba(22, 163, 74, 0.3)" : "none",
              }}
            >
              <CheckCircle2 size={13} />
              <span>Disetujui</span>
              <span style={{ fontSize: "11px", opacity: 0.9 }}>
                ({requests.filter((r) => r.status === "approved").length})
              </span>
            </button>
          </div>

          {filteredRequests.length === 0 ? (
            <div
              className="admin-table-card"
              style={{
                padding: "54px 20px",
                textAlign: "center",
                borderStyle: "dashed",
              }}
            >
              <div className="admin-empty-icon-float" style={{ fontSize: "44px", marginBottom: "14px" }}>
                📋
              </div>
              <h3 style={{ fontSize: "16.5px", fontWeight: 700, margin: "0 0 6px 0" }}>
                Tidak Ada Permohonan Akun
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted, #64748b)", margin: 0 }}>
                {searchQuery || satkerFilter !== "ALL" || statusFilter !== "ALL"
                  ? "Tidak ada permohonan yang sesuai dengan filter atau kata kunci pencarian Anda."
                  : "Belum ada permohonan baru yang diajukan melalui formulir pendaftaran."}
              </p>
            </div>
          ) : (
            <div className="admin-table-card">
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-app, #f8fafc)", borderBottom: "1.5px solid var(--border-light, #e2e8f0)" }}>
                      <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: 700 }}>Pemohon</th>
                      <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: 700 }}>Email Instansi</th>
                      <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: 700 }}>Satuan Kerja</th>
                      <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: 700 }}>WhatsApp</th>
                      <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: 700 }}>Jabatan</th>
                      <th style={{ padding: "14px 18px", textAlign: "center", fontWeight: 700 }}>Status</th>
                      <th style={{ padding: "14px 18px", textAlign: "center", fontWeight: 700 }}>Aksi Kelola</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req) => {
                      const isPending = !req.status || req.status === "pending";
                      const isApproved = req.status === "approved";
                      const isRejected = req.status === "rejected";
                      const isItemLoading = processingId === req.id;

                      return (
                        <tr
                          key={req.id}
                          className="admin-interactive-row"
                          style={{
                            borderBottom: "1px solid var(--border-light, #f1f5f9)",
                            background: isPending ? "rgba(254, 243, 199, 0.22)" : "transparent",
                          }}
                        >
                          <td style={{ padding: "14px 18px" }}>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{req.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                              {new Date(req.createdAt || Date.now()).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                              <span
                                style={{
                                  fontSize: "10.5px",
                                  padding: "2px 7px",
                                  borderRadius: "5px",
                                  background: req.password ? "#dcfce7" : "#f1f5f9",
                                  color: req.password ? "#15803d" : "#64748b",
                                  fontWeight: 600,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3.5px",
                                }}
                              >
                                <Lock size={10} />
                                {req.password ? "Password Diatur Mandiri" : "Password Default"}
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: "14px 18px" }}>
                            <span
                              onClick={() => handleCopy(req.email, `req_email_${req.id}`)}
                              className="admin-copyable-pill"
                              style={{ color: "#0284c7", background: "#f0f9ff", borderColor: "#bae6fd" }}
                              title="Klik untuk menyalin email"
                            >
                              <span>{req.email}</span>
                              {copiedKey === `req_email_${req.id}` ? <Check size={11} color="#0284c7" /> : <Copy size={11} color="#0284c7" />}
                            </span>
                          </td>

                          <td style={{ padding: "14px 18px" }}>
                            <span style={{ fontWeight: 600 }}>{req.satker}</span>
                          </td>

                          <td style={{ padding: "14px 18px" }}>
                            <a
                              href={`https://wa.me/${String(req.phone || "").replace(/^0/, "62")}?text=${encodeURIComponent(
                                `Halo Bapak/Ibu ${req.name}, pengajuan akun PTWP Anda sedang diproses oleh Administrator.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-wa-pill"
                              title="Hubungi pemohon via WhatsApp"
                            >
                              <Phone size={13} />
                              <span>{req.phone}</span>
                            </a>
                          </td>

                          <td style={{ padding: "14px 18px" }}>
                            <span
                              style={{
                                background: "var(--bg-app, #f1f5f9)",
                                padding: "3.5px 9px",
                                borderRadius: "6px",
                                fontWeight: 600,
                                fontSize: "11.5px",
                              }}
                            >
                              {req.title || "Pegawai"}
                            </span>
                            {req.note && (
                              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
                                💬 {req.note}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: "14px 18px", textAlign: "center" }}>
                            {isPending && (
                              <span
                                style={{
                                  background: "#fef3c7",
                                  color: "#b45309",
                                  padding: "5px 10px",
                                  borderRadius: "8px",
                                  fontSize: "11.5px",
                                  fontWeight: 700,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                }}
                              >
                                <Clock size={12} />
                                <span>Menunggu Izin</span>
                              </span>
                            )}
                            {isApproved && (
                              <span
                                style={{
                                  background: "#dcfce7",
                                  color: "#15803d",
                                  padding: "5px 10px",
                                  borderRadius: "8px",
                                  fontSize: "11.5px",
                                  fontWeight: 700,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                }}
                              >
                                <CheckCircle2 size={12} />
                                <span>Diizinkan</span>
                              </span>
                            )}
                            {isRejected && (
                              <span
                                style={{
                                  background: "#fee2e2",
                                  color: "#b91c1c",
                                  padding: "5px 10px",
                                  borderRadius: "8px",
                                  fontSize: "11.5px",
                                  fontWeight: 700,
                                }}
                              >
                                Ditolak
                              </span>
                            )}
                          </td>

                          <td style={{ padding: "14px 18px", textAlign: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleApprove(req)}
                                  disabled={isItemLoading}
                                  className="admin-btn-action-approve"
                                  title="Izinkan Akun & Terbitkan Akses Login"
                                >
                                  {isItemLoading ? (
                                    <>
                                      <Loader2 size={14} className="admin-spin-icon" />
                                      <span>Memproses...</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck size={14} />
                                      <span>Izinkan Akun</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleReject(req.id, req.name)}
                                  disabled={isItemLoading}
                                  className="admin-btn-action-reject"
                                  title="Tolak Permohonan Akun"
                                >
                                  <UserX size={14} />
                                  <span>Tolak</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteRequest(req.id)}
                                className="admin-btn-action-delete"
                                title="Hapus Riwayat Pengajuan"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUBTAB 2: DAFTAR AKUN TERDAFTAR (HAPUS AKSES)
          ======================================================== */}
      {activeSubTab === "users" && (
        <div className="admin-table-card">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ background: "var(--bg-app, #f8fafc)", borderBottom: "1.5px solid var(--border-light, #e2e8f0)" }}>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: 700 }}>Nama Pengguna</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: 700 }}>Username Login</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: 700 }}>Satuan Kerja</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: 700 }}>Peran / Jabatan</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: 700 }}>Keamanan Password</th>
                  <th style={{ padding: "14px 18px", textAlign: "center", fontWeight: 700 }}>Hak Akses</th>
                  <th style={{ padding: "14px 18px", textAlign: "center", fontWeight: 700 }}>Aksi Kelola</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                      Tidak ditemukan pengguna yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSuper = u.role === "super_admin" || u.username.toLowerCase() === "aku admin" || u.username.toLowerCase() === "root";
                    const isCopied = copiedKey === `user_${u.username}`;

                    return (
                      <tr key={u.username} className="admin-interactive-row" style={{ borderBottom: "1px solid var(--border-light, #f1f5f9)" }}>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{u.name}</div>
                          {u.email && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{u.email}</div>}
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          <span
                            onClick={() => handleCopy(u.username, `user_${u.username}`)}
                            className="admin-copyable-pill"
                            title="Klik untuk menyalin username"
                          >
                            <span>{u.username}</span>
                            {isCopied ? <Check size={11} color="#16a34a" /> : <Copy size={11} color="#16a34a" />}
                          </span>
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ fontWeight: 600 }}>{u.satker || "Belum Ditetapkan"}</span>
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              fontSize: "11.5px",
                              fontWeight: 700,
                              padding: "3.5px 9px",
                              borderRadius: "6px",
                              background: isSuper ? "#fef3c7" : u.role === "bendahara" ? "#dbeafe" : "#f1f5f9",
                              color: isSuper ? "#b45309" : u.role === "bendahara" ? "#1e40af" : "#475569",
                            }}
                          >
                            {u.roleLabel || u.title || "Pegawai"}
                          </span>
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontSize: "11px",
                                color: "#059669",
                                background: "#ecfdf5",
                                border: "1px solid #a7f3d0",
                                padding: "2.5px 8px",
                                borderRadius: "6px",
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <ShieldCheck size={12} />
                              Terenkripsi (scrypt)
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          <span
                            style={{
                              background: "#dcfce7",
                              color: "#15803d",
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "3.5px 9px",
                              borderRadius: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "#16a34a",
                                display: "inline-block",
                              }}
                            />
                            Aktif
                          </span>
                        </td>

                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          {isSuper ? (
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", fontWeight: 600 }}>
                              Super Admin
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRevokeUser(u.username, u.name)}
                              className="admin-btn-action-reject"
                              title="Hapus Hak Akses Pengguna dari MySQL"
                            >
                              <UserX size={13} />
                              <span>Hapus Akses</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          SUBTAB 3: TAMBAH AKUN CEPAT OLEH ADMIN
          ======================================================== */}
      {activeSubTab === "add_user" && (
        <div className="admin-form-card">
          <div style={{ marginBottom: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Plus size={20} color="#16a34a" />
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>
                Tambah Akun Pengguna Langsung
              </h2>
            </div>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted, #64748b)", margin: 0 }}>
              Buat akun langsung untuk pegawai atau bendahara tanpa harus mengisi formulir pendaftaran luar.
            </p>
          </div>

          <form onSubmit={handleAddDirectUserSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Nama Lengkap & Gelar <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Rina Anggraini, S.H."
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="admin-input-field"
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  Username Login <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: rina_gs"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="admin-input-field"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  Password Awal <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="admin-input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Satuan Kerja (Otorisasi Akses RBAC) <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <select
                value={newUser.satker}
                onChange={(e) => setNewUser({ ...newUser, satker: e.target.value })}
                className="admin-input-field"
              >
                {SAMPLE_SATKER.map((satker) => (
                  <option key={satker} value={satker}>
                    {satker}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  Peran di Sistem
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="admin-input-field"
                >
                  <option value="anggota">Anggota Pegawai</option>
                  <option value="bendahara">Bendahara Cabang</option>
                  <option value="pimpinan">Ketua / Pimpinan</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  No. WhatsApp (Kontak)
                </label>
                <input
                  type="text"
                  placeholder="081234..."
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="admin-input-field"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Alamat Email
              </label>
              <input
                type="email"
                placeholder="nama@instansi.go.id"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="admin-input-field"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="admin-btn-submit-form"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="admin-spin-icon" />
                  <span>Menyimpan ke Database MySQL...</span>
                </>
              ) : (
                <>
                  <UserCheck size={16} />
                  <span>Simpan & Berikan Akses</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL POP-UP KREDENSIAL HASIL APPROVAL AKUN
          ======================================================== */}
      {approvedModalData && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-container">
            <div className="admin-modal-icon-circle">
              <CheckCircle2 size={34} />
            </div>

            <h3 style={{ fontSize: "18.5px", fontWeight: 800, margin: "0 0 6px 0" }}>
              Akses Akun Berhasil Diterbitkan!
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted, #64748b)", margin: "0 0 20px 0" }}>
              Akun resmi untuk <strong>{approvedModalData.name}</strong> telah aktif dan siap digunakan.
            </p>

            <div
              style={{
                background: "var(--bg-app, #f8fafc)",
                border: "1.5px solid var(--border-light, #e2e8f0)",
                borderRadius: "14px",
                padding: "16px 18px",
                textAlign: "left",
                fontSize: "13px",
                marginBottom: "22px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div>
                <span style={{ color: "var(--text-muted, #64748b)" }}>Satuan Kerja:</span>{" "}
                <strong>{approvedModalData.satker}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span style={{ color: "var(--text-muted, #64748b)" }}>Username:</span>{" "}
                  <strong style={{ fontFamily: "monospace", color: "#0f5132" }}>{approvedModalData.username}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(approvedModalData.username, "modal_username")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0f5132",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                  title="Salin Username"
                >
                  {copiedKey === "modal_username" ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                  <span>{copiedKey === "modal_username" ? "Tersalin" : "Salin"}</span>
                </button>
              </div>
              <div>
                <span style={{ color: "var(--text-muted, #64748b)" }}>Password:</span>{" "}
                <strong style={{ fontFamily: "monospace", color: "#0f5132" }}>{approvedModalData.password || "••••••••"}</strong>
                {approvedModalData.isSelfPassword ? (
                  <span style={{ marginLeft: "8px", fontSize: "11px", color: "#16a34a", fontWeight: 700 }}>
                    ✓ (Diatur sendiri saat mendaftar)
                  </span>
                ) : (
                  <span style={{ marginLeft: "8px", fontSize: "11px", color: "#64748b" }}>
                    (Password default)
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {approvedModalData.phone && (
                <a
                  href={`https://wa.me/${String(approvedModalData.phone).replace(/^0/, "62")}?text=${encodeURIComponent(
                    approvedModalData.isSelfPassword
                      ? `Assalamu'alaikum Wr. Wb. Yth. ${approvedModalData.name},\n\nAkun Anda untuk sistem PTWP telah DISETUJUI & AKTIF.\n\nBerikut kredensial login Anda:\n• Satker: ${approvedModalData.satker}\n• Username: ${approvedModalData.username}\n• Password: (Gunakan password yang Anda buat sendiri saat mendaftar)\n\nSilakan login pada aplikasi PTWP. Terima kasih.`
                      : `Assalamu'alaikum Wr. Wb. Yth. ${approvedModalData.name},\n\nAkun Anda untuk sistem PTWP telah DISETUJUI & AKTIF.\n\nBerikut kredensial login Anda:\n• Satker: ${approvedModalData.satker}\n• Username: ${approvedModalData.username}\n• Password: ${approvedModalData.password}\n\nSilakan login pada aplikasi PTWP. Terima kasih.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn-action-approve"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    textDecoration: "none",
                    fontSize: "13px",
                  }}
                >
                  <MessageCircle size={16} />
                  <span>Kirim Kredensial via WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setApprovedModalData(null)}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: "12px",
                  border: "1.5px solid var(--border-light, #cbd5e1)",
                  background: "var(--bg-card, #ffffff)",
                  color: "var(--text-primary, #334155)",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
