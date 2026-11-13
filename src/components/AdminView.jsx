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
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApprove = async (req) => {
    const passwordToUse = (req.password && String(req.password).trim()) ? String(req.password).trim() : "123";
    try {
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
            username: json.user?.username || req.name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
            password: json.user?.password || passwordToUse,
            satker: req.satker,
            phone: req.phone,
            email: req.email,
            isSelfPassword: Boolean(req.password),
          });
          showToast(`Akses berhasil diizinkan untuk ${req.name}!`, "success");
          return;
        } else {
          showToast(json.error || "Gagal mengizinkan permohonan.", "error");
        }
      }
    } catch (e) {
      showToast("Gagal memproses permohonan ke MySQL.", "error");
    }
  };

  const handleReject = async (id, name) => {
    if (confirm(`Yakin ingin menolak permohonan akun untuk "${name}"?`)) {
      try {
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
    <div style={{ padding: "24px 20px", maxWidth: "1280px", margin: "0 auto", color: "var(--text-primary)" }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "13.5px",
            fontWeight: 700,
            background: notification.type === "error" ? "#fee2e2" : notification.type === "info" ? "#e0f2fe" : "#dcfce7",
            color: notification.type === "error" ? "#dc2626" : notification.type === "info" ? "#0284c7" : "#15803d",
            border: `1.5px solid ${notification.type === "error" ? "#fca5a5" : notification.type === "info" ? "#bae6fd" : "#86efac"}`,
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span>{notification.type === "error" ? "⚠️" : "✓"}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* HEADER BANNER KHUSUS ADMIN */}
      <div
        style={{
          background: "linear-gradient(135deg, #062e1e 0%, #0d4a32 50%, #062319 100%)",
          color: "#ffffff",
          borderRadius: "18px",
          padding: "26px 28px",
          marginBottom: "24px",
          boxShadow: "0 10px 25px -5px rgba(6, 46, 30, 0.4)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "18px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #16a34a 0%, #0f5132 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              border: "2px solid #fef08a",
            }}
          >
            <ShieldCheck size={32} color="#fef08a" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  background: "#fef08a",
                  color: "#1e3a2b",
                  padding: "3px 8px",
                  borderRadius: "6px",
                }}
              >
                SUPER ADMINISTRATOR
              </span>
              <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.75)" }}>
                Akses Universal Seluruh Satker
              </span>
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
              Portal Manajemen Akun & Otorisasi RBAC
            </h1>
            <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.8)", margin: "4px 0 0 0" }}>
              Setujui permohonan akun masuk, terbitkan izin akses login, atau cabut hak akses pengguna.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255, 255, 255, 0.15)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            padding: "9px 16px",
            borderRadius: "10px",
            fontSize: "12.5px",
            fontWeight: 700,
            cursor: "pointer",
            backdropFilter: "blur(4px)",
          }}
        >
          <RefreshCw size={15} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* STATS SUMMARY CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "var(--bg-card, #ffffff)",
            border: "1.5px solid var(--border-light, #e2e8f0)",
            borderRadius: "14px",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#fef3c7",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", fontWeight: 600 }}>
              Permohonan Menunggu
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#d97706" }}>
              {pendingRequestsCount}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-card, #ffffff)",
            border: "1.5px solid var(--border-light, #e2e8f0)",
            borderRadius: "14px",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#dcfce7",
              color: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", fontWeight: 600 }}>
              Total Akun Terdaftar
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#16a34a" }}>
              {users.length}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-card, #ffffff)",
            border: "1.5px solid var(--border-light, #e2e8f0)",
            borderRadius: "14px",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#f1f5f9",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", fontWeight: 600 }}>
              Satker Terlayani
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
              {SAMPLE_SATKER.length} Satker
            </div>
          </div>
        </div>
      </div>
      {/* NAVIGATION TABS ADMIN */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1.5px solid var(--border-light, #e2e8f0)",
          marginBottom: "20px",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setActiveSubTab("requests")}
            style={{
              padding: "10px 18px",
              border: "none",
              background: "transparent",
              borderBottom: activeSubTab === "requests" ? "3px solid #0f5132" : "3px solid transparent",
              color: activeSubTab === "requests" ? "#0f5132" : "var(--text-muted, #64748b)",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>Permohonan Masuk (Izin Akun)</span>
            {pendingRequestsCount > 0 && (
              <span
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 800,
                  padding: "2px 7px",
                  borderRadius: "12px",
                }}
              >
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("users")}
            style={{
              padding: "10px 18px",
              border: "none",
              background: "transparent",
              borderBottom: activeSubTab === "users" ? "3px solid #0f5132" : "3px solid transparent",
              color: activeSubTab === "users" ? "#0f5132" : "var(--text-muted, #64748b)",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>Daftar Akun Terdaftar (Hapus Akses)</span>
            <span
              style={{
                background: "var(--border-light, #e2e8f0)",
                color: "var(--text-muted, #64748b)",
                fontSize: "11px",
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: "12px",
              }}
            >
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("add_user")}
            style={{
              padding: "10px 18px",
              border: "none",
              background: "transparent",
              borderBottom: activeSubTab === "add_user" ? "3px solid #0f5132" : "3px solid transparent",
              color: activeSubTab === "add_user" ? "#0f5132" : "var(--text-muted, #64748b)",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Plus size={16} />
            <span>Tambah Akun Baru</span>
          </button>
        </div>

        {/* Global Search Bar */}
        {activeSubTab !== "add_user" && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "var(--bg-card, #ffffff)",
                border: "1.5px solid var(--border-light, #cbd5e1)",
                borderRadius: "10px",
                padding: "6px 12px",
              }}
            >
              <Search size={15} color="#64748b" />
              <input
                type="text"
                placeholder="Cari nama, satker, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: "12.5px",
                  background: "transparent",
                  color: "var(--text-primary)",
                  width: "180px",
                }}
              />
            </div>

            {/* Filter Satker */}
            <select
              value={satkerFilter}
              onChange={(e) => setSatkerFilter(e.target.value)}
              style={{
                padding: "7px 10px",
                borderRadius: "10px",
                border: "1.5px solid var(--border-light, #cbd5e1)",
                fontSize: "12px",
                background: "var(--bg-card, #ffffff)",
                color: "var(--text-primary)",
                outline: "none",
                cursor: "pointer",
                maxWidth: "180px",
              }}
            >
              <option value="ALL">Semua Satker</option>
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
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              style={{
                padding: "5px 12px",
                borderRadius: "8px",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                background: statusFilter === "ALL" ? "#0f5132" : "var(--border-light, #e2e8f0)",
                color: statusFilter === "ALL" ? "#ffffff" : "var(--text-muted, #64748b)",
              }}
            >
              Semua ({requests.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              style={{
                padding: "5px 12px",
                borderRadius: "8px",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                background: statusFilter === "pending" ? "#d97706" : "var(--border-light, #e2e8f0)",
                color: statusFilter === "pending" ? "#ffffff" : "var(--text-muted, #64748b)",
              }}
            >
              Menunggu Izin ({pendingRequestsCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("approved")}
              style={{
                padding: "5px 12px",
                borderRadius: "8px",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                background: statusFilter === "approved" ? "#16a34a" : "var(--border-light, #e2e8f0)",
                color: statusFilter === "approved" ? "#ffffff" : "var(--text-muted, #64748b)",
              }}
            >
              Disetujui ({requests.filter((r) => r.status === "approved").length})
            </button>
          </div>

          {filteredRequests.length === 0 ? (
            <div
              style={{
                padding: "48px 20px",
                textAlign: "center",
                background: "var(--bg-card, #ffffff)",
                borderRadius: "16px",
                border: "1.5px dashed var(--border-light, #cbd5e1)",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>
                Tidak Ada Permohonan Akun
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
                Belum ada permohonan baru yang diajukan melalui formulir pendaftaran.
              </p>
            </div>
          ) : (
            <div
              style={{
                background: "var(--bg-card, #ffffff)",
                borderRadius: "16px",
                border: "1.5px solid var(--border-light, #e2e8f0)",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-app, #f8fafc)", borderBottom: "1.5px solid var(--border-light, #e2e8f0)" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Pemohon</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Email Instansi</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Satuan Kerja</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>WhatsApp</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Jabatan</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700 }}>Status</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700 }}>Aksi Kelola</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req) => {
                      const isPending = !req.status || req.status === "pending";
                      const isApproved = req.status === "approved";
                      const isRejected = req.status === "rejected";

                      return (
                        <tr
                          key={req.id}
                          style={{
                            borderBottom: "1px solid var(--border-light, #f1f5f9)",
                            background: isPending ? "rgba(254, 243, 199, 0.2)" : "transparent",
                          }}
                        >
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{req.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
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
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: req.password ? "#dcfce7" : "#f1f5f9",
                                  color: req.password ? "#15803d" : "#64748b",
                                  fontWeight: 600,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                <Lock size={10} />
                                {req.password ? "Password Diatur Mandiri" : "Password Default"}
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontFamily: "monospace", color: "#0284c7", fontWeight: 600 }}>
                              {req.email}
                            </span>
                          </td>

                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontWeight: 600 }}>{req.satker}</span>
                          </td>

                          <td style={{ padding: "12px 16px" }}>
                            <a
                              href={`https://wa.me/${String(req.phone || "").replace(/^0/, "62")}?text=${encodeURIComponent(
                                `Halo Bapak/Ibu ${req.name}, pengajuan akun PTWP Anda sedang diproses oleh Administrator.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                color: "#16a34a",
                                fontWeight: 700,
                                textDecoration: "none",
                              }}
                            >
                              <Phone size={13} />
                              <span>{req.phone}</span>
                            </a>
                          </td>

                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                background: "#f1f5f9",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontWeight: 600,
                                fontSize: "11.5px",
                              }}
                            >
                              {req.title || "Pegawai"}
                            </span>
                            {req.note && (
                              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                💬 {req.note}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            {isPending && (
                              <span
                                style={{
                                  background: "#fef3c7",
                                  color: "#b45309",
                                  padding: "4px 9px",
                                  borderRadius: "8px",
                                  fontSize: "11.5px",
                                  fontWeight: 700,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
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
                                  padding: "4px 9px",
                                  borderRadius: "8px",
                                  fontSize: "11.5px",
                                  fontWeight: 700,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
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
                                  padding: "4px 9px",
                                  borderRadius: "8px",
                                  fontSize: "11.5px",
                                  fontWeight: 700,
                                }}
                              >
                                Ditolak
                              </span>
                            )}
                          </td>

                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleApprove(req)}
                                  title="Izinkan Akun & Terbitkan Akses"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    background: "#16a34a",
                                    color: "#ffffff",
                                    border: "none",
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)",
                                  }}
                                >
                                  <UserCheck size={14} />
                                  <span>Izinkan Akun</span>
                                </button>
                              )}

                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleReject(req.id, req.name)}
                                  title="Tolak Permohonan"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    background: "#fee2e2",
                                    color: "#dc2626",
                                    border: "1px solid #fecaca",
                                    padding: "6px 10px",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  <UserX size={14} />
                                  <span>Tolak</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteRequest(req.id)}
                                title="Hapus Riwayat Pengajuan"
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--text-muted, #94a3b8)",
                                  cursor: "pointer",
                                  padding: "6px",
                                  borderRadius: "6px",
                                }}
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
        <div
          style={{
            background: "var(--bg-card, #ffffff)",
            borderRadius: "16px",
            border: "1.5px solid var(--border-light, #e2e8f0)",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ background: "var(--bg-app, #f8fafc)", borderBottom: "1.5px solid var(--border-light, #e2e8f0)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Nama Pengguna</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Username Login</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Satuan Kerja</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Peran / Jabatan</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Password</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700 }}>Hak Akses</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isSuper = u.role === "super_admin" || u.username.toLowerCase() === "aku admin" || u.username.toLowerCase() === "root";
                  const isVisiblePassword = showPasswordMap[u.username];

                  return (
                    <tr key={u.username} style={{ borderBottom: "1px solid var(--border-light, #f1f5f9)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{u.name}</div>
                        {u.email && <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{u.email}</div>}
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f5132", background: "#f0fdf4", padding: "3px 8px", borderRadius: "6px" }}>
                          {u.username}
                        </span>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontWeight: 600 }}>{u.satker || "Belum Ditetapkan"}</span>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: isSuper ? "#fef3c7" : u.role === "bendahara" ? "#dbeafe" : "#f1f5f9",
                            color: isSuper ? "#b45309" : u.role === "bendahara" ? "#1e40af" : "#475569",
                          }}
                        >
                          {u.roleLabel || u.title || "Pegawai"}
                        </span>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "11px",
                              color: "#059669",
                              background: "#ecfdf5",
                              padding: "2px 8px",
                              borderRadius: "4px",
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

                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#15803d",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          Aktif
                        </span>
                      </td>

                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {isSuper ? (
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                            Super Admin
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRevokeUser(u.username, u.name)}
                            title="Hapus Hak Akses Pengguna"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "#fee2e2",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                              padding: "5px 10px",
                              borderRadius: "8px",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <UserX size={13} />
                            <span>Hapus Akses</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          SUBTAB 3: TAMBAH AKUN CEPAT OLEH ADMIN
          ======================================================== */}
      {activeSubTab === "add_user" && (
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            background: "var(--bg-card, #ffffff)",
            borderRadius: "18px",
            border: "1.5px solid var(--border-light, #e2e8f0)",
            padding: "28px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 4px 0" }}>
              Tambah Akun Pengguna Langsung
            </h2>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted, #64748b)", margin: 0 }}>
              Buat akun langsung untuk pegawai atau bendahara tanpa harus mengisi formulir pendaftaran.
            </p>
          </div>

          <form onSubmit={handleAddDirectUserSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                Nama Lengkap & Gelar <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Rina Anggraini, S.H."
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1.5px solid var(--border-light, #cbd5e1)",
                  fontSize: "13px",
                  background: "var(--bg-app, #f8fafc)",
                  color: "var(--text-primary)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                  Username Login <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: rina_gs"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid var(--border-light, #cbd5e1)",
                    fontSize: "13px",
                    background: "var(--bg-app, #f8fafc)",
                    color: "var(--text-primary)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                  Password Awal <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid var(--border-light, #cbd5e1)",
                    fontSize: "13px",
                    background: "var(--bg-app, #f8fafc)",
                    color: "var(--text-primary)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                Satuan Kerja (Otorisasi Akses RBAC) <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <select
                value={newUser.satker}
                onChange={(e) => setNewUser({ ...newUser, satker: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1.5px solid var(--border-light, #cbd5e1)",
                  fontSize: "13px",
                  background: "var(--bg-app, #f8fafc)",
                  color: "var(--text-primary)",
                  outline: "none",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                {SAMPLE_SATKER.map((satker) => (
                  <option key={satker} value={satker}>
                    {satker}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                  Peran di Sistem
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid var(--border-light, #cbd5e1)",
                    fontSize: "13px",
                    background: "var(--bg-app, #f8fafc)",
                    color: "var(--text-primary)",
                    outline: "none",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="anggota">Anggota Pegawai</option>
                  <option value="bendahara">Bendahara Cabang</option>
                  <option value="pimpinan">Ketua / Pimpinan</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                  No. WhatsApp (Kontak)
                </label>
                <input
                  type="text"
                  placeholder="081234..."
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid var(--border-light, #cbd5e1)",
                    fontSize: "13px",
                    background: "var(--bg-app, #f8fafc)",
                    color: "var(--text-primary)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "12px",
                marginTop: "10px",
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
              <UserCheck size={16} />
              <span>Simpan & Berikan Akses</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL POP-UP KREDENSIAL HASIL APPROVAL AKUN
          ======================================================== */}
      {approvedModalData && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              color: "#0f172a",
              borderRadius: "20px",
              padding: "28px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              textAlign: "center",
            }}
          >
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
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 6px 0" }}>
              Akses Akun Berhasil Diterbitkan!
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px 0" }}>
              Akun resmi untuk <strong>{approvedModalData.name}</strong> telah aktif dan siap digunakan.
            </p>

            <div
              style={{
                background: "#f8fafc",
                border: "1.5px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "left",
                fontSize: "13px",
                marginBottom: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div>
                <span style={{ color: "#64748b" }}>Satuan Kerja:</span>{" "}
                <strong>{approvedModalData.satker}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Username Login:</span>{" "}
                <strong style={{ fontFamily: "monospace", color: "#0f5132" }}>{approvedModalData.username}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Password:</span>{" "}
                <strong style={{ fontFamily: "monospace", color: "#0f5132" }}>{approvedModalData.password}</strong>
                {approvedModalData.isSelfPassword ? (
                  <span style={{ marginLeft: "8px", fontSize: "11px", color: "#16a34a", fontWeight: 700 }}>
                    ✓ (Diatur sendiri oleh pemohon)
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "11px",
                    borderRadius: "10px",
                    background: "#16a34a",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "13px",
                    textDecoration: "none",
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
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
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
