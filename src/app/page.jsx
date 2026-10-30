"use client";

import React, { useState, useEffect } from "react";
import { exportExpensesToExcel } from "@/services/excelService";
import {
  FileSpreadsheet,
  UploadCloud,
  Printer,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Filter,
  Trash2,
  RotateCcw,
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
import AdminView from "@/components/AdminView";
import DuesExpenseView from "@/components/DuesExpenseView";
import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";

import {
  fetchMembersByPeriod,
  saveMembersByPeriod,
  filterRealMembers,
  toggleMemberPaidStatus,
  addMember,
  updateSingleMember,
  deleteMember,
  getAvailablePeriods,
  getPeriodsWithData,
  fetchCashBook,
  addCashBookEntry,
  addCashBookEntriesBatch,
  deleteCashBookEntry,
  fetchSettings,
  saveSettings,
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
  loadSampleTemplateData,
  clearPeriodData,
  clearAllPeriodsData,
  saveMultiplePeriodsData,
  INITIAL_USERS,
} from "@/services/storageService";


export default function HomePage() {
  const [period, setPeriod] = useState("September 2026");
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [members, setMembers] = useState([]);
  const [cashbook, setCashbook] = useState([]);
  const [settings, setSettings] = useState({});
  const [currentUser, setCurrentUser] = useState(INITIAL_USERS[0]);
  const [isAuthView, setIsAuthView] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "dues" | "cashbook"
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [duesSubTab, setDuesSubTab] = useState("in"); // "in" | "out"
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
  const [expenseSearchQuery, setExpenseSearchQuery] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Helper ganti periode aktif yang persisten across reload/restart
  const changePeriod = (newPeriod) => {
    setPeriod(newPeriod);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ptwp_active_period", newPeriod);
      } catch (e) {}
    }
  };

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

      const isLoggedOut = typeof window !== "undefined" && localStorage.getItem("ptwp_is_logged_out") === "true";
      const user = getCurrentUser();
      if (user && !isLoggedOut) {
        setCurrentUser(user);
        setIsAuthView(false);
        if (user?.role === "super_admin" || user?.username?.toLowerCase() === "aku admin") {
          setActiveTab("admin");
        } else {
          setActiveTab("dashboard");
        }
      } else if (isLoggedOut) {
        setCurrentUser(null);
        setIsAuthView(true);
      } else {
        // Default session aktif agar pengguna langsung masuk ke dashboard
        setCurrentUser(user);
        setIsAuthView(false);
        if (user?.role === "super_admin" || user?.username?.toLowerCase() === "aku admin") {
          setActiveTab("admin");
        } else {
          setActiveTab("dashboard");
        }
      }

      // Ambil periode tersimpan jika pengguna sebelumnya memilih periode lain
      let initialPeriod = "September 2026";
      if (typeof window !== "undefined") {
        const savedPeriod = localStorage.getItem("ptwp_active_period");
        if (savedPeriod) {
          initialPeriod = savedPeriod;
          setPeriod(savedPeriod);
        }
      }

      const duesData = await fetchMembersByPeriod(initialPeriod);
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
      if (updated.length === 0) {
        clearPeriodData(period);
      }
      await reloadCashbook();
    }
  };

  // Import Excel / CSV Success (Mendukung deteksi multi-bulan, single-bulan, dan matrix cashbook)
  const handleImportSuccess = async (importedData, targetPeriod, isMulti = false) => {
    // 1. Format Rekapitulasi Kas Triwulan (PA Gunung Sugih - 12 Bulan)
    if (importedData && importedData.type === "matrix_cashbook" && Array.isArray(importedData.months)) {
      const satkerName = settings.institution || currentUser?.satker || "Pengadilan Agama Gunung Sugih";
      const newCashEntries = [];
      const newPeriods = [];

      const monthNumMap = {
        januari: "01", februari: "02", maret: "03", april: "04",
        mei: "05", juni: "06", juli: "07", agustus: "08",
        september: "09", oktober: "10", november: "11", desember: "12"
      };

      // Cek apakah ada saldo awal tahun di bulan pertama (misal Januari 2026)
      const firstMonth = importedData.months[0];
      if (firstMonth && Number(firstMonth.saldoAwal || 0) > 0) {
        newCashEntries.push({
          id: `saldo_awal_${firstMonth.period}`,
          date: `${firstMonth.year || "2026"}-01-01`,
          type: "in",
          category: "Saldo Awal",
          amount: Number(firstMonth.saldoAwal),
          description: `Saldo Awal Kas PTWP Tahun ${firstMonth.year || "2026"}`,
          source: "saldo_awal",
          period: firstMonth.period,
          satker: satkerName,
        });
      }

      for (const m of importedData.months) {
        newPeriods.push(m.period);
        const mParts = m.period.split(" ");
        const mLower = (mParts[0] || "").toLowerCase();
        const mYear = mParts[1] || m.year || "2026";
        const monthNum = monthNumMap[mLower] || "01";

        // Kas Masuk dari iuran pegawai jika tercatat di berkas
        if (Number(m.iuranMasuk || 0) > 0) {
          newCashEntries.push({
            id: `dues_${m.period}`,
            date: `${mYear}-${monthNum}-28`,
            type: "in",
            category: "Iuran Anggota",
            amount: Number(m.iuranMasuk),
            description: `Penerimaan Iuran PTWP Periode ${m.period}` + (m.iuranKet ? ` (${m.iuranKet})` : ""),
            source: "rekap_iuran",
            period: m.period,
            satker: satkerName,
          });
        }

        // Pos pengeluaran / belanja
        if (Array.isArray(m.expenses)) {
          m.expenses.forEach((exp, idx) => {
            const cleanUraian = (exp.uraian || "").replace(/[^a-zA-Z0-9]/g, "_").substring(0, 16);
            newCashEntries.push({
              id: exp.id || `exp_${m.period.replace(/\s+/g, '_')}_${idx}_${cleanUraian}`,
              date: exp.date || `${mYear}-${monthNum}-20`,
              type: "out",
              category: exp.category || "Operasional Lapangan",
              amount: Number(exp.amount || 0),
              description: exp.uraian + (exp.ket ? ` - ${exp.ket}` : ""),
              source: "rekap_keluar",
              period: m.period,
              satker: satkerName,
            });
          });
        }
      }

      // Simpan semua transaksi sekaligus secara batch
      await addCashBookEntriesBatch(newCashEntries);

      // Perbarui daftar periode yang tersedia
      const updatedAvailable = getAvailablePeriods();
      newPeriods.forEach((p) => {
        if (!updatedAvailable.includes(p)) updatedAvailable.push(p);
      });
      setAvailablePeriods(updatedAvailable);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("ptwp_available_periods", JSON.stringify(updatedAvailable));
        } catch (e) {}
      }

      // Prioritaskan September jika ada di dalam bulan yang diimpor
      const septPeriod = newPeriods.find((p) => p.toLowerCase().includes("september"));
      const finalPeriod = septPeriod || targetPeriod || newPeriods[newPeriods.length - 1] || period;

      changePeriod(finalPeriod);
      setDuesSubTab("out"); // Arahkan langsung ke sub-tab belanja agar pengguna langsung melihat hasilnya
      await reloadCashbook();

      setTimeout(() => {
        alert(`✅ Berhasil mengimpor ${importedData.months.length} bulan laporan kas PTWP!\n\n• Sebanyak ${newCashEntries.length} transaksi kas & belanja telah berhasil diterapkan ke sistem.\n• Periode aktif diarahkan ke ${finalPeriod}.`);
      }, 200);
      return;
    }

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

      changePeriod(finalPeriod);

      const currentMonthData = importedData.find((d) => d.period === finalPeriod);
      if (currentMonthData) {
        setMembers(filterRealMembers(currentMonthData.members));
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
        changePeriod(finalPeriod);
      }
      setMembers(filterRealMembers(importedData));
      await reloadCashbook();
    }
  };

  const handleLoadSample = async () => {
    const sample = loadSampleTemplateData(period);
    setMembers(sample);
    await reloadCashbook();
  };

  const handleClearData = async () => {
    if (
      confirm(
        `Kosongkan data iuran untuk periode ${period}?\n\n` +
        `• Seluruh tabel rekap periode ini akan dikosongkan.\n` +
        `• Catatan penerimaan iuran terkait di Buku Kas akan otomatis dihapus.\n` +
        `• Saldo Kas PTWP akan langsung berkurang.`
      )
    ) {
      clearPeriodData(period);
      setMembers([]);
      await reloadCashbook();
    }
  };

  const handleClearAllData = async () => {
    const periodsWithData = getPeriodsWithData();
    if (
      confirm(
        `Apakah Anda yakin ingin mengosongkan seluruh data rekap dari SEMUA ${periodsWithData.length} periode?\n\n` +
        `• Seluruh tabel rekap iuran akan dikosongkan secara permanen.\n` +
        `• Seluruh catatan penerimaan iuran di Buku Kas akan dihapus.\n` +
        `• Saldo Kas PTWP akan berkurang sesuai seluruh iuran yang dihapus.`
      )
    ) {
      clearAllPeriodsData();
      setMembers([]);
      await reloadCashbook();
    }
  };

  // Tambah Kas Manual
  const handleAddCashEntry = async (entry) => {
    const updated = await addCashBookEntry(entry);
    setCashbook(updated);
  };

  // Hapus Kas (Manual maupun Penerimaan Iuran Rekap)
  const handleDeleteCashEntry = async (id, item) => {
    const isDues = item?.source === "rekap_iuran" || String(id).startsWith("dues_");
    if (isDues) {
      const targetPeriod = item?.period || String(id).replace("dues_", "");
      if (
        confirm(
          `Apakah Anda yakin ingin menghapus penerimaan iuran untuk periode "${targetPeriod}"?\n\n` +
          `• Catatan iuran ini akan dihapus dari Buku Kas.\n` +
          `• Rekap iuran pada periode "${targetPeriod}" akan ikut dikosongkan.\n` +
          `• Saldo Kas PTWP akan otomatis berkurang.`
        )
      ) {
        clearPeriodData(targetPeriod);
        if (targetPeriod === period) {
          setMembers([]);
        }
        await reloadCashbook();
      }
      return;
    }

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
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ptwp_is_logged_out", "true");
      } catch (e) {}
    }
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

  // Filter pengeluaran khusus periode aktif
  // Daftar seluruh periode yang memiliki catatan pos pengeluaran/belanja
  const getPeriodsWithExpenses = () => {
    const expenseEntries = cashbook.filter((c) => c.type === "out");
    const periodsSet = new Set();
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    expenseEntries.forEach((c) => {
      if (c.period) {
        periodsSet.add(c.period.trim());
      } else if (c.date) {
        const parts = c.date.split("-");
        if (parts.length >= 2) {
          const yr = parts[0];
          const mIdx = parseInt(parts[1], 10) - 1;
          if (mIdx >= 0 && mIdx < 12) {
            periodsSet.add(`${monthNames[mIdx]} ${yr}`);
          }
        }
      }
    });
    return Array.from(periodsSet);
  };

  // Filter pengeluaran khusus periode aktif
  const currentPeriodExpenses = cashbook.filter((c) => {
    if (c.type !== "out") return false;
    if (c.period && c.period.toLowerCase() === period.toLowerCase()) return true;
    if (c.date) {
      const pLower = period.toLowerCase();
      const monthNames = [
        { name: "januari", num: "01" }, { name: "februari", num: "02" }, { name: "maret", num: "03" },
        { name: "april", num: "04" }, { name: "mei", num: "05" }, { name: "juni", num: "06" },
        { name: "juli", num: "07" }, { name: "agustus", num: "08" }, { name: "september", num: "09" },
        { name: "oktober", num: "10" }, { name: "november", num: "11" }, { name: "desember", num: "12" }
      ];
      const found = monthNames.find((m) => pLower.includes(m.name));
      if (found && c.date.includes(`-${found.num}-`)) return true;
    }
    return false;
  });

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

  // Deteksi iuran masuk dari buku kas jika tabel anggota belum diisi
  const duesInCashbookThisPeriod = cashbook
    .filter((c) => c.type === "in" && (c.period?.toLowerCase() === period.toLowerCase() || (c.source === "rekap_iuran" && c.period === period)))
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const effectiveUangMasuk = totalCollected > 0 ? totalCollected : duesInCashbookThisPeriod;
  const totalPeriodExpenses = currentPeriodExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netBalance = effectiveUangMasuk - totalPeriodExpenses;

  const baseExpenseCategories = [
    "Setoran Wajib Pusat",
    "Setoran Wajib Daerah",
    "Operasional Lapangan",
    "Konsumsi",
    "Pemeliharaan Lapangan",
    "Kegiatan & Turnamen",
  ];

  const dynamicExpenseCategories = Array.from(
    new Set([
      ...baseExpenseCategories,
      ...currentPeriodExpenses.map((e) => e.category).filter(Boolean),
    ])
  );

  const getExpenseCount = (cat) => {
    if (cat === "all") return currentPeriodExpenses.length;
    return currentPeriodExpenses.filter(
      (e) => (e.category || "").toLowerCase() === cat.toLowerCase()
    ).length;
  };

  const filteredExpenses = currentPeriodExpenses.filter((e) => {
    const q = expenseSearchQuery.toLowerCase();
    const matchQuery =
      !q ||
      (e.uraian || e.description || "").toLowerCase().includes(q) ||
      (e.ket || "").toLowerCase().includes(q) ||
      (e.category || "").toLowerCase().includes(q);
    const matchCategory =
      expenseCategoryFilter === "all" ||
      (e.category || "").toLowerCase() === expenseCategoryFilter.toLowerCase();
    return matchQuery && matchCategory;
  });

  const handleClearExpenses = async () => {
    if (currentPeriodExpenses.length === 0) {
      alert(`Belum ada data belanja pada periode ${period}.`);
      return;
    }
    if (
      confirm(
        `Apakah Anda yakin ingin mengosongkan seluruh catatan belanja untuk periode "${period}"?\n\n` +
        `• Sebanyak ${currentPeriodExpenses.length} pos belanja akan dihapus.\n` +
        `• Saldo Kas PTWP akan disesuaikan kembali.`
      )
    ) {
      for (const exp of currentPeriodExpenses) {
        await deleteCashBookEntry(exp.id);
      }
      await reloadCashbook();
    }
  };

  const handleClearAllExpenses = async () => {
    const allExpenses = cashbook.filter((c) => c.type === "out");
    if (allExpenses.length === 0) {
      alert("Belum ada data belanja yang tersimpan.");
      return;
    }
    if (
      confirm(
        `Apakah Anda yakin ingin mengosongkan SELURUH data belanja dari semua periode?\n\n` +
        `• Sebanyak ${allExpenses.length} catatan belanja akan dihapus secara permanen.\n` +
        `• Saldo Kas PTWP akan disesuaikan kembali.`
      )
    ) {
      for (const exp of allExpenses) {
        await deleteCashBookEntry(exp.id);
      }
      await reloadCashbook();
    }
  };

  const handleExportExpenses = async () => {
    if (currentPeriodExpenses.length === 0) {
      alert(`Belum ada data belanja pada periode ${period} untuk diekspor.`);
      return;
    }
    await exportExpensesToExcel({
      expenses: currentPeriodExpenses,
      period: period,
      institution: settings.institution || "PENGADILAN AGAMA GUNUNG SUGIH",
      city: settings.city || "Gunung Sugih",
      treasurerName: settings.treasurerName || "Wulan Febrianti, A.Md",
      treasurerTitle: settings.treasurerTitle || "Bendahara Kantor",
      effectiveUangMasuk: effectiveUangMasuk,
      totalPeriodExpenses: totalPeriodExpenses,
      netBalance: netBalance,
    });
  };

  const isSuper = currentUser?.role === "super_admin" || currentUser?.username?.toLowerCase() === "aku admin";

  useEffect(() => {
    if (!isSuper && activeTab === "admin") {
      setActiveTab("dashboard");
    } else if (isSuper && activeTab !== "admin") {
      setActiveTab("admin");
    }
  }, [currentUser, activeTab, isSuper]);

  const isAdmin = currentUser?.role === "bendahara" || currentUser?.role === "pimpinan" || currentUser?.role === "super_admin";

  if (isAuthView) {
    return (
      <AuthView
        onLoginSuccess={(user) => {
          loginUser(user, "", user.satker);
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem("ptwp_is_logged_out");
            } catch (e) {}
          }
          setCurrentUser(user);
          if (user?.role === "super_admin" || user?.username?.toLowerCase() === "aku admin") {
            setActiveTab("admin");
          } else {
            setActiveTab("dashboard");
          }
          if (user?.satker) {
            setSettings((prev) => ({
              ...prev,
              institution: user.satker.toUpperCase(),
              branch: `CABANG ${user.satker.toUpperCase()}`,
            }));
          }
          setIsAuthView(false);
        }}
        onBypassToDashboard={() => {
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem("ptwp_is_logged_out");
            } catch (e) {}
          }
          setIsAuthView(false);
        }}
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
                  {duesSubTab === "in" ? "IURAN" : "REALISASI BELANJA DAN PENGELUARAN IURAN"} PTWP CABANG {settings.institution || "PENGADILAN AGAMA GUNUNG SUGIH"}
                </h2>
                <p style={{ textAlign: "center", fontSize: "11pt", marginBottom: "15px" }}>
                  Bulan : {period}
                </p>
              </div>

              {/* SUB-TAB NAVIGATOR: IURAN MASUK vs IURAN KELUAR */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "16px",
                  background: "var(--bg-card, #ffffff)",
                  padding: "6px",
                  borderRadius: "14px",
                  border: "1px solid var(--border-light, #e2e8f0)",
                  width: "fit-content",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setDuesSubTab("in")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: duesSubTab === "in" ? "#146c43" : "transparent",
                    color: duesSubTab === "in" ? "#ffffff" : "var(--text-muted, #64748b)",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <ArrowDownLeft size={16} />
                  <span>Iuran Masuk (Penerimaan Anggota)</span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: "99px",
                      background: duesSubTab === "in" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.06)",
                      color: duesSubTab === "in" ? "#ffffff" : "var(--text-muted, #64748b)",
                    }}
                  >
                    {members.length} Pegawai
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDuesSubTab("out")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: duesSubTab === "out" ? "#dc2626" : "transparent",
                    color: duesSubTab === "out" ? "#ffffff" : "var(--text-muted, #64748b)",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <ArrowUpRight size={16} />
                  <span>Iuran Keluar (Realisasi Belanja)</span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: "99px",
                      background: duesSubTab === "out" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.06)",
                      color: duesSubTab === "out" ? "#ffffff" : "var(--text-muted, #64748b)",
                    }}
                  >
                    {currentPeriodExpenses.length} Pos Belanja
                  </span>
                </button>
              </div>

              {/* 1. CONTROL & FILTER TOOLBAR (STRUKTUR SAMA PERSIS ANTARA MASUK & KELUAR) */}
              <div className="stitch-toolbar">
                {/* Baris 1: Header Halaman (Kiri: Judul & Status Periode, Kanan: Search & Tambah) */}
                <div className="stitch-toolbar-top">
                  <div className="stitch-breadcrumb">
                    <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                      Rekap Iuran
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "99px",
                        background: duesSubTab === "in" ? "rgba(15, 81, 50, 0.08)" : "rgba(220, 38, 38, 0.08)",
                        color: duesSubTab === "in" ? "#0f5132" : "#dc2626",
                        border: `1px solid ${duesSubTab === "in" ? "rgba(15, 81, 50, 0.2)" : "rgba(220, 38, 38, 0.2)"}`,
                      }}
                    >
                      Periode {period}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "3px 9px",
                        borderRadius: "99px",
                        background: "var(--bg-app)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border-light)",
                      }}
                    >
                      {duesSubTab === "in" ? `${members.length} Anggota` : `${currentPeriodExpenses.length} Pos Belanja`}
                    </span>
                  </div>

                  {/* Kanan Atas: Quick Search & Tombol Utama Tambah */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <div className="stitch-quick-search-box">
                      <Search size={15} color="var(--text-muted)" />
                      <input
                        type="text"
                        placeholder="Filter baris..."
                        value={duesSubTab === "in" ? searchQuery : expenseSearchQuery}
                        onChange={(e) => {
                          if (duesSubTab === "in") setSearchQuery(e.target.value);
                          else setExpenseSearchQuery(e.target.value);
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      className="stitch-btn-action stitch-btn-add"
                      onClick={() => {
                        if (duesSubTab === "in") {
                          setEditingMember(null);
                          setIsMemberFormOpen(true);
                        } else {
                          setIsAddExpenseOpen(true);
                        }
                      }}
                      title={duesSubTab === "in" ? "Tambah Anggota Baru" : "Catat Belanja Baru"}
                      style={{ height: "36px", padding: "0 14px", background: duesSubTab === "in" ? "#146c43" : "#dc2626" }}
                    >
                      <Plus size={16} />
                      <span>Tambah</span>
                    </button>
                  </div>
                </div>

                {/* Baris 2: Kiri: Filter Kategori, Kanan: Pengelolaan Berkas & Data */}
                <div className="stitch-toolbar-bottom">
                  {/* Category Filter Pills (Kiri Bawah) */}
                  <div className="stitch-filter-pills-group" style={{ overflowX: "auto" }}>
                    {duesSubTab === "in" ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={`stitch-filter-pill-btn ${expenseCategoryFilter === "all" ? "active" : ""}`}
                          onClick={() => setExpenseCategoryFilter("all")}
                        >
                          Semua ({currentPeriodExpenses.length})
                        </button>
                        {dynamicExpenseCategories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            className={`stitch-filter-pill-btn ${expenseCategoryFilter.toLowerCase() === cat.toLowerCase() ? "active" : ""}`}
                            onClick={() => setExpenseCategoryFilter(cat)}
                            style={{ whiteSpace: "nowrap" }}
                          >
                            {cat} ({getExpenseCount(cat)})
                          </button>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Tombol Aksi Berkas & Data Lengkap (Kanan Bawah) - IDENTIK DI DUA TAB */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="stitch-btn-action stitch-btn-import"
                      onClick={() => setIsImportOpen(true)}
                      title="Import data dari Excel (.xlsx / .csv)"
                    >
                      <UploadCloud size={15} />
                      <span>Import Excel</span>
                    </button>

                    <button
                      type="button"
                      className="stitch-btn-action stitch-btn-export"
                      onClick={() => {
                        if (duesSubTab === "in") {
                          setIsExportOpen(true);
                        } else {
                          handleExportExpenses();
                        }
                      }}
                      title="Export berkas berformat resmi pengadilan (.xlsx)"
                    >
                      <FileSpreadsheet size={15} />
                      <span>Export Excel Resmi</span>
                    </button>

                    <button
                      type="button"
                      className="stitch-btn-action stitch-btn-print"
                      onClick={() => window.print()}
                      title="Cetak Laporan Rekap Iuran"
                    >
                      <Printer size={15} />
                      <span>Cetak</span>
                    </button>

                    <button
                      type="button"
                      className="stitch-btn-action stitch-btn-clear"
                      onClick={duesSubTab === "in" ? handleClearData : handleClearExpenses}
                      title={duesSubTab === "in" ? `Kosongkan data iuran periode ${period}` : `Kosongkan belanja periode ${period}`}
                    >
                      <Trash2 size={14} />
                      <span>Kosongkan</span>
                    </button>

                    <button
                      type="button"
                      className="stitch-btn-action stitch-btn-reset"
                      onClick={duesSubTab === "in" ? handleClearAllData : handleClearAllExpenses}
                      title="Kosongkan seluruh data dari seluruh periode yang tersimpan"
                    >
                      <RotateCcw size={14} />
                      <span>Reset Semua</span>
                      <span className="stitch-btn-badge">
                        {duesSubTab === "in" ? (getPeriodsWithData().length > 0 ? `${getPeriodsWithData().length} Bln` : "9 Bln") : `${cashbook.filter(c => c.type === 'out').length} Pos`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. 4 KEY METRIC CARDS: Uang Masuk - Total Saldo Kas - Uang Keluar - Saldo Bersih */}
              <div
                className="stitch-dash-grid"
                style={{
                  marginBottom: "16px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "12px",
                }}
              >
                {/* Card 1: Uang Masuk */}
                <div className="stitch-card">
                  <div className="hairline-court" style={{ background: "#16a34a" }}></div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Uang Masuk
                    </span>
                    <ArrowDownLeft size={16} color="#16a34a" />
                  </div>
                  <div className="font-mono-num" style={{ fontSize: "19px", fontWeight: 700, color: "#0f5132" }}>
                    {formatRupiah(effectiveUangMasuk)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                    {totalTarget > 0 ? (
                      <>
                        <div style={{ flex: 1, height: "6px", background: "var(--border-light)", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ width: `${percentageCollected}%`, height: "100%", background: "#16a34a", borderRadius: "99px" }}></div>
                        </div>
                        <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#0f5132" }}>{percentageCollected}%</span>
                      </>
                    ) : (
                      <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Penerimaan periode {period}</span>
                    )}
                  </div>
                  {unpaidMembers.length > 0 && (
                    <div style={{ fontSize: "11px", color: "#d97706", fontWeight: 600, marginTop: "5px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>⚠️ {unpaidMembers.length} belum bayar:</span>
                      <strong style={{ color: "#b45309" }}>-{formatRupiah(totalUnpaid)}</strong>
                    </div>
                  )}
                </div>

                {/* Card 2: Total Saldo Kas */}
                <div className="stitch-card">
                  <div className="hairline-gold"></div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Total Saldo Kas
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

                {/* Card 3: Uang Keluar */}
                <div className="stitch-card">
                  <div className="hairline-court" style={{ background: "#dc2626" }}></div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Uang Keluar
                    </span>
                    <ArrowUpRight size={16} color="#dc2626" />
                  </div>
                  <div className="font-mono-num" style={{ fontSize: "19px", fontWeight: 700, color: "#dc2626" }}>
                    {formatRupiah(totalPeriodExpenses)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "11.5px", color: "var(--text-muted)" }}>
                    <span>{currentPeriodExpenses.length} pos belanja & pengeluaran</span>
                  </div>
                </div>

                {/* Card 4: Saldo Bersih */}
                <div className="stitch-card">
                  <div className="hairline-court" style={{ background: netBalance >= 0 ? "#0284c7" : "#ea580c" }}></div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Saldo Bersih
                    </span>
                    <Scale size={16} color={netBalance >= 0 ? "#0284c7" : "#ea580c"} />
                  </div>
                  <div
                    className="font-mono-num"
                    style={{
                      fontSize: "19px",
                      fontWeight: 700,
                      color: netBalance >= 0 ? "#0284c7" : "#ea580c",
                    }}
                  >
                    {formatRupiah(netBalance)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "11.5px", color: "var(--text-muted)" }}>
                    <span style={{ color: netBalance >= 0 ? "#0284c7" : "#ea580c", fontWeight: 600 }}>
                      ● {netBalance >= 0 ? "Surplus (Masuk > Keluar)" : "Defisit (Keluar > Masuk)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. DATA TABLE VIEW: IURAN MASUK vs IURAN KELUAR */}
              {duesSubTab === "in" ? (
                <>
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
                  />
                </>
              ) : (
                <DuesExpenseView
                  period={period}
                  expenses={filteredExpenses}
                  onDeleteExpense={handleDeleteCashEntry}
                  isAdmin={isAdmin}
                  formatRupiah={formatRupiah}
                  isAddModalOpen={isAddExpenseOpen}
                  setIsAddModalOpen={setIsAddExpenseOpen}
                  onAddExpense={handleAddCashEntry}
                />
              )}
            </div>
          )}

          {/* TAB 2: BUKU KAS CABANG */}
          {activeTab === "cashbook" && (
            <CashBookView
              cashbook={cashbook}
              onAddEntry={handleAddCashEntry}
              onDeleteEntry={handleDeleteCashEntry}
              isAdmin={isAdmin}
              currentUser={currentUser}
            />
          )}

          {/* TAB 3: PORTAL SUPER ADMINISTRATOR */}
          {activeTab === "admin" && isSuper && (
            <AdminView currentUser={currentUser} />
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
        mode={duesSubTab}
        periodsWithData={duesSubTab === "in" ? getPeriodsWithData() : getPeriodsWithExpenses()}
        onSelectPeriod={(newPeriod) => {
          changePeriod(newPeriod);
          if (!availablePeriods.includes(newPeriod)) {
            setAvailablePeriods((prev) => [newPeriod, ...prev]);
          }
        }}
      />
    </div>
  );
}
