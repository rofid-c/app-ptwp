"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  UploadCloud,
  Printer,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import MetricCards from "@/components/MetricCards";
import DuesTable from "@/components/DuesTable";
import DuesMobileCards from "@/components/DuesMobileCards";
import ExcelExportModal from "@/components/ExcelExportModal";
import ExcelImportModal from "@/components/ExcelImportModal";
import CashBookView from "@/components/CashBookView";
import AuthModal from "@/components/AuthModal";
import MemberFormModal from "@/components/MemberFormModal";
import SettingsModal from "@/components/SettingsModal";
import DashboardView from "@/components/DashboardView";
import AddCashModal from "@/components/AddCashModal";
import PeriodPickerModal from "@/components/PeriodPickerModal";
import AuthView from "@/components/AuthView";
import UserProfileModal from "@/components/UserProfileModal";

import {
  fetchMembersByPeriod,
  saveMembersByPeriod,
  toggleMemberPaidStatus,
  addMember,
  updateSingleMember,
  deleteMember,
  getAvailablePeriods,
  getPeriodsWithData,
  fetchCashBook,
  addCashBookEntry,
  deleteCashBookEntry,
  fetchSettings,
  saveSettings,
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
  loadSampleTemplateData,
  clearPeriodData,
  saveMultiplePeriodsData,
} from "@/services/storageService";


export default function HomePage() {
  const [period, setPeriod] = useState("September 2026");
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [members, setMembers] = useState([]);
  const [cashbook, setCashbook] = useState([]);
  const [settings, setSettings] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthView, setIsAuthView] = useState(true);

  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "dues" | "cashbook"
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [theme, setTheme] = useState("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [enableWhatsApp, setEnableWhatsApp] = useState(false);

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddCashOpen, setIsAddCashOpen] = useState(false);
  const [isPeriodPickerOpen, setIsPeriodPickerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const reloadCashbook = async () => {
    const cashData = await fetchCashBook();
    setCashbook(cashData);
  };

  // Initial load
  useEffect(() => {
    async function loadInitialData() {
      const periods = getAvailablePeriods();
      setAvailablePeriods(periods);

      const savedSettings = fetchSettings();
      setSettings(savedSettings);

      const user = getCurrentUser();
      setCurrentUser(user);

      const duesData = await fetchMembersByPeriod(period);
      setMembers(duesData);

      const cashData = await fetchCashBook();
      setCashbook(cashData);
    }

    loadInitialData();
  }, []);

  // Update members saat ganti periode & reload cashbook
  useEffect(() => {
    async function loadPeriodMembers() {
      const duesData = await fetchMembersByPeriod(period);
      setMembers(duesData);
      const cashData = await fetchCashBook();
      setCashbook(cashData);
    }
    loadPeriodMembers();
  }, [period]);

  // Theme switcher
  const handleToggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (typeof document !== "undefined") {
      if (nextTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    }
  };

  // Status bayar toggle - otomatis perbarui Buku Kas & Dashboard
  const handleToggleStatus = async (memberId) => {
    const updated = await toggleMemberPaidStatus(period, memberId);
    setMembers(updated);
    reloadCashbook();
  };

  // Tambah / Update Member
  const handleSaveMember = async (memberData) => {
    if (editingMember) {
      const updated = await updateSingleMember(period, editingMember.id, memberData);
      setMembers(updated);
      setEditingMember(null);
    } else {
      const updated = await addMember(period, memberData);
      setMembers(updated);
    }
    reloadCashbook();
  };

  const handleEditClick = (member) => {
    setEditingMember(member);
    setIsMemberFormOpen(true);
  };

  const handleDeleteMember = async (memberId) => {
    if (confirm("Apakah Anda yakin ingin menghapus anggota ini dari daftar periode ini?")) {
      const updated = await deleteMember(period, memberId);
      setMembers(updated);
      reloadCashbook();
    }
  };

  // Import Excel / CSV Success (Mendukung deteksi multi-bulan dan single-bulan dari berkas)
  const handleImportSuccess = async (importedData, targetPeriod, isMulti = false) => {
    if (isMulti && Array.isArray(importedData)) {
      // Import banyak bulan sekaligus
      await saveMultiplePeriodsData(importedData);

      const allNewPeriods = importedData.map((d) => d.period);
      const updatedAvailable = getAvailablePeriods();
      setAvailablePeriods(updatedAvailable);

      // Prioritaskan September jika ada, atau targetPeriod, atau bulan terakhir
      const finalPeriod =
        allNewPeriods.find((p) => p.toLowerCase().includes("september")) ||
        targetPeriod ||
        allNewPeriods[allNewPeriods.length - 1] ||
        period;

      setPeriod(finalPeriod);

      const currentMonthData = importedData.find((d) => d.period === finalPeriod);
      if (currentMonthData) {
        setMembers(currentMonthData.members);
      } else {
        const duesData = await fetchMembersByPeriod(finalPeriod);
        setMembers(duesData);
      }

      await reloadCashbook();
    } else {
      // Import 1 lembar bulan tunggal
      const finalPeriod = targetPeriod || period;
      await saveMembersByPeriod(finalPeriod, importedData);

      if (finalPeriod !== period) {
        if (!availablePeriods.includes(finalPeriod)) {
          setAvailablePeriods((prev) => [finalPeriod, ...prev]);
        }
        setPeriod(finalPeriod);
      }
      setMembers(importedData);
      await reloadCashbook();
    }
  };

  const handleLoadSample = async () => {
    const sample = loadSampleTemplateData(period);
    setMembers(sample);
    reloadCashbook();
  };

  const handleClearData = async () => {
    if (confirm(`Kosongkan data iuran untuk periode ${period}?`)) {
      const empty = clearPeriodData(period);
      setMembers(empty);
      reloadCashbook();
    }
  };

  // Tambah Kas Manual
  const handleAddCashEntry = async (entry) => {
    const updated = await addCashBookEntry(entry);
    setCashbook(updated);
  };

  // Hapus Kas Manual
  const handleDeleteCashEntry = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus catatan mutasi kas ini?")) {
      const updated = await deleteCashBookEntry(id);
      setCashbook(updated);
    }
  };

  // Pengaturan
  const handleSaveSettings = (newSettings) => {
    const updated = saveSettings(newSettings);
    setSettings(updated);

    // Jika nama bendahara diubah di Pengaturan, otomatis perbarui nama akun login yang tampil di sidebar
    if (newSettings.treasurerName && currentUser?.role === "bendahara") {
      const updatedUser = { ...currentUser, name: newSettings.treasurerName };
      setCurrentUser(updatedUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("ptwp_auth_user", JSON.stringify(updatedUser));
      }
    }
  };


  // Auth
  const handleLogin = (nip, password) => {
    const user = loginUser(nip, password);
    setCurrentUser(user);
  };

  const handleRegister = (userData) => {
    const user = registerUser(userData);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setIsAuthView(true);
    setIsAuthOpen(false);
  };

  // Filter anggota
  const filteredMembers = members.filter((m) => {
    const matchName = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === "all" || m.category === categoryFilter;
    return matchName && matchCat;
  });

  const totalTarget = members.reduce(
    (sum, m) => sum + (Number(m.pusat || 0) + Number(m.daerah || 0) + Number(m.cabang || 0) + Number(m.tournamen || 0)),
    0
  );
  const paidMembers = members.filter((m) => m.paid);
  const totalCollected = paidMembers.reduce(
    (sum, m) => sum + (Number(m.pusat || 0) + Number(m.daerah || 0) + Number(m.cabang || 0) + Number(m.tournamen || 0)),
    0
  );
  const unpaidMembers = members.filter((m) => !m.paid);
  const totalUnpaid = Math.max(0, totalTarget - totalCollected);
  const percentageCollected = totalTarget > 0 ? ((totalCollected / totalTarget) * 100).toFixed(1) : "0.0";
  const percentageUnpaid = totalTarget > 0 ? ((totalUnpaid / totalTarget) * 100).toFixed(1) : "0.0";

  const totalCashIn = cashbook.filter((c) => c.type === "in").reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalCashOut = cashbook.filter((c) => c.type === "out").reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const currentBalance = totalCashIn - totalCashOut;

  const hakimCount = members.filter((m) => m.category === "Hakim").length;
  const paniteraCount = members.filter((m) => m.category === "Kepaniteraan").length;
  const sekretariatCount = members.filter((m) => m.category === "Kesekretariatan").length;
  const stafCount = members.filter((m) => m.category === "Staf").length;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  const isAdmin = currentUser?.role === "bendahara" || currentUser?.role === "pimpinan";

  if (isAuthView) {
    return (
      <AuthView
        onLoginSuccess={(user) => {
          loginUser(user.username, "");
          setCurrentUser(user);
          setIsAuthView(false);
        }}
        onBypassToDashboard={() => setIsAuthView(false)}
        defaultMode="login"
      />
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigasi (Desktop) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthView(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        totalMembersCount={members.length}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <Navbar
          period={period}
          onPeriodChange={setPeriod}
          availablePeriods={availablePeriods}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenAuth={() => setIsAuthView(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onPrint={() => window.print()}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          currentUser={currentUser}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenPeriodPicker={() => setIsPeriodPickerOpen(true)}
        />

        <main className="content-area">
          {/* TAB 0: DASHBOARD UTAMA (STITCH DESIGN) */}
          {activeTab === "dashboard" && (
            <DashboardView
              members={members}
              cashbook={cashbook}
              period={period}
              settings={settings}
              onOpenDues={() => setActiveTab("dues")}
              onOpenAddCash={() => setIsAddCashOpen(true)}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenPeriodPicker={() => setIsPeriodPickerOpen(true)}
            />
          )}

          {/* TAB 1: REKAPITULASI IURAN */}
          {activeTab === "dues" && (
            <div>
              {/* Header Cetak Formal (Hanya tampil saat Print) */}
              <div style={{ display: "none" }} className="print-header">
                <h2 style={{ textAlign: "center", fontSize: "14pt", fontWeight: "bold" }}>
                  IURAN PTWP CABANG {settings.institution || "PENGADILAN AGAMA GUNUNG SUGIH"}
                </h2>
                <p style={{ textAlign: "center", fontSize: "11pt", marginBottom: "15px" }}>
                  Bulan : {period}
                </p>
              </div>

              {/* 1. Control & Filter Toolbar Sesuai Google Stitch */}
              <div className="stitch-toolbar">
                {/* Baris Atas: Title, Periode Pill & Action Buttons */}
                <div className="stitch-toolbar-top">
                  <div className="stitch-breadcrumb">
                    <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                      Rekap Iuran
                    </span>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0f5132", display: "inline-block" }}></span>
                    <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>
                      Periode {period}
                    </span>
                  </div>

                  {/* Tombol Aksi Utama */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {isAdmin && (
                      <button
                        type="button"
                        className="stitch-btn-action stitch-btn-import"
                        onClick={() => setIsImportOpen(true)}
                        title="Import data dari Excel (.xlsx / .csv)"
                      >
                        <UploadCloud size={16} />
                        <span>Import Excel</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="stitch-btn-action stitch-btn-export"
                      onClick={() => setIsExportOpen(true)}
                      title="Export berkas berformat resmi pengadilan"
                    >
                      <FileSpreadsheet size={16} />
                      <span>Export Excel Resmi</span>
                    </button>

                    <button
                      type="button"
                      className="stitch-btn-action stitch-btn-print"
                      onClick={() => window.print()}
                      title="Cetak Laporan Rekap Iuran"
                    >
                      <Printer size={16} />
                      <span>Cetak</span>
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        className="stitch-btn-action stitch-btn-add"
                        onClick={() => {
                          setEditingMember(null);
                          setIsMemberFormOpen(true);
                        }}
                        title="Tambah Anggota Baru"
                      >
                        <Plus size={16} />
                        <span>Tambah</span>
                      </button>
                    )}

                    {isAdmin && members.length > 0 && (
                      <button
                        type="button"
                        className="stitch-btn-action stitch-btn-clear"
                        onClick={handleClearData}
                        title="Kosongkan seluruh data pada periode ini"
                      >
                        <span>Kosongkan</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Baris Bawah: Category Filter Pills & Table Filter Search */}
                <div className="stitch-toolbar-bottom">
                  {/* Category Filter Pills */}
                  <div className="stitch-filter-pills-group">
                    <button
                      type="button"
                      className={`stitch-filter-pill-btn ${categoryFilter === "all" ? "active" : ""}`}
                      onClick={() => setCategoryFilter("all")}
                    >
                      Semua ({members.length})
                    </button>
                    <button
                      type="button"
                      className={`stitch-filter-pill-btn ${categoryFilter === "Hakim" ? "active" : ""}`}
                      onClick={() => setCategoryFilter("Hakim")}
                    >
                      Hakim ({hakimCount})
                    </button>
                    <button
                      type="button"
                      className={`stitch-filter-pill-btn ${categoryFilter === "Kepaniteraan" ? "active" : ""}`}
                      onClick={() => setCategoryFilter("Kepaniteraan")}
                    >
                      Kepaniteraan ({paniteraCount})
                    </button>
                    <button
                      type="button"
                      className={`stitch-filter-pill-btn ${categoryFilter === "Kesekretariatan" ? "active" : ""}`}
                      onClick={() => setCategoryFilter("Kesekretariatan")}
                    >
                      Kesekretariatan ({sekretariatCount})
                    </button>
                    <button
                      type="button"
                      className={`stitch-filter-pill-btn ${categoryFilter === "Staf" ? "active" : ""}`}
                      onClick={() => setCategoryFilter("Staf")}
                    >
                      Staf ({stafCount})
                    </button>
                  </div>

                  {/* Quick Search Box di Baris Filter */}
                  <div className="stitch-quick-search-box">
                    <Search size={15} color="var(--text-muted)" />
                    <input
                      type="text"
                      placeholder="Filter baris..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Key Metric Bar (Hanya Terkumpul & Saldo Kas PTWP) */}
              <div className="stitch-dash-grid" style={{ marginBottom: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                {/* Card 1: Terkumpul */}
                <div className="stitch-card">
                  <div className="hairline-court" style={{ background: "#16a34a" }}></div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Terkumpul
                    </span>
                    <CheckCircle2 size={16} color="#16a34a" />
                  </div>
                  <div className="font-mono-num" style={{ fontSize: "19px", fontWeight: 700, color: "#0f5132" }}>
                    {formatRupiah(totalCollected)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                    <div style={{ flex: 1, height: "6px", background: "var(--border-light)", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{ width: `${percentageCollected}%`, height: "100%", background: "#16a34a", borderRadius: "99px" }}></div>
                    </div>
                    <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#0f5132" }}>{percentageCollected}%</span>
                  </div>
                </div>

                {/* Card 2: Saldo Kas PTWP */}
                <div className="stitch-card">
                  <div className="hairline-gold"></div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Saldo Kas PTWP
                    </span>
                    <span style={{ color: "#eab308" }}>🏛️</span>
                  </div>
                  <div className="font-mono-num" style={{ fontSize: "19px", fontWeight: 700, color: "var(--text-main)" }}>
                    {formatRupiah(currentBalance)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "11.5px", color: "var(--text-muted)" }}>
                    <span style={{ color: "#0f5132", fontWeight: 600 }}>● Kas Operasional PTWP</span>
                  </div>
                </div>
              </div>


              {/* Tampilan Desktop: Tabel Lengkap 8 Kolom dengan Sticky Header */}
              <DuesTable
                members={filteredMembers}
                settings={settings}
                period={period}
                onToggleStatus={handleToggleStatus}
                onEditMember={handleEditClick}
                onDeleteMember={handleDeleteMember}
                isAdmin={isAdmin}
                onOpenImport={() => setIsImportOpen(true)}
                onOpenAdd={() => {
                  setEditingMember(null);
                  setIsMemberFormOpen(true);
                }}
                onLoadSample={handleLoadSample}
              />

              {/* Tampilan HP: Mobile Adaptive Card View */}
              <DuesMobileCards
                members={filteredMembers}
                period={period}
                settings={settings}
                onToggleStatus={handleToggleStatus}
                onEditMember={handleEditClick}
                onDeleteMember={handleDeleteMember}
                isAdmin={isAdmin}
                enableWhatsAppReminder={enableWhatsApp}
                onOpenImport={() => setIsImportOpen(true)}
                onOpenAdd={() => {
                  setEditingMember(null);
                  setIsMemberFormOpen(true);
                }}
                onLoadSample={handleLoadSample}
              />

            </div>
          )}

          {/* TAB 2: BUKU KAS CABANG */}
          {activeTab === "cashbook" && (
            <CashBookView
              cashbook={cashbook}
              onAddEntry={handleAddCashEntry}
              onDeleteEntry={handleDeleteCashEntry}
              isAdmin={isAdmin}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthView(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* MODAL-MODAL DIALOG */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
      />
      <ExcelExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        members={members}
        period={period}
        settings={settings}
      />

      <ExcelImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
        period={period}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
      />

      <MemberFormModal
        isOpen={isMemberFormOpen}
        onClose={() => {
          setIsMemberFormOpen(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
        editMember={editingMember}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        enableWhatsApp={enableWhatsApp}
        onToggleWhatsApp={setEnableWhatsApp}
      />

      <AddCashModal
        isOpen={isAddCashOpen}
        onClose={() => setIsAddCashOpen(false)}
        onAddEntry={handleAddCashEntry}
      />

      <PeriodPickerModal
        isOpen={isPeriodPickerOpen}
        onClose={() => setIsPeriodPickerOpen(false)}
        currentPeriod={period}
        onSelectPeriod={(newPeriod) => {
          setPeriod(newPeriod);
          if (!availablePeriods.includes(newPeriod)) {
            setAvailablePeriods((prev) => [newPeriod, ...prev]);
          }
        }}
        periodsWithData={getPeriodsWithData()}
      />
    </div>
  );
}
