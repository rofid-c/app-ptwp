"use client";

import React, { useState, useEffect } from "react";
import { flushSync } from "react-dom";
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
  ChevronUp,
  ChevronDown,
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
import AddExpenseModal from "@/components/AddExpenseModal";
import MonitoringCabangView from "@/components/MonitoringCabangView";
import NetworkStatusSentinel from "@/components/NetworkStatusSentinel";
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
  refreshPeriodsWithData,
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
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthView, setIsAuthView] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "dues" | "cashbook"
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isFilterVisible, setIsFilterVisible] = useState(true);
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
  const [selectedMonitoringBranch, setSelectedMonitoringBranch] = useState("all");
  const [monitoringSubTab, setMonitoringSubTab] = useState("dashboard");
  const currentSatkerName = currentUser?.satker || settings?.institution || settings?.satker || "Pengadilan Agama Gunung Sugih";

  // Helper ganti periode aktif yang persisten across reload/restart
  const changePeriod = (newPeriod) => {
    setPeriod(newPeriod);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ptwp_active_period", newPeriod);
      } catch (e) {}
    }
  };

  const reloadCashbook = async (satker = currentUser?.satker) => {
    const cashData = await fetchCashBook(satker);
    setCashbook(cashData);
  };

  // Khusus Monitoring Cabang: Seluruh aplikasi mengecil ke 80% (rasio aspek 80% seperti zoom browser)
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (activeTab === "monitoring") {
        document.body.style.zoom = "0.8";
        document.body.classList.add("monitoring-active-tab");
      } else {
        document.body.style.zoom = "1";
        document.body.classList.remove("monitoring-active-tab");
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.zoom = "1";
        document.body.classList.remove("monitoring-active-tab");
      }
    };
  }, [activeTab]);

  // Initial load
  useEffect(() => {
    async function loadInitialData() {
      // 1. Muat preferensi tema tampilan
      if (typeof window !== "undefined") {
        const savedTheme = localStorage.getItem("ptwp_theme");
        if (savedTheme === "dark") {
          setTheme("dark");
          document.documentElement.setAttribute("data-theme", "dark");
        }
      }

      // 2. Periksa sesi aktif (sessionStorage - hanya aktif selama browser/tab belum ditutup)
      const user = getCurrentUser();

      // Jika TIDAK ada sesi aktif (misal web baru dibuka setelah tab/browser ditutup):
      // WAJIB login dulu, jangan langsung masuk ke halaman utama!
      if (!user) {
        setCurrentUser(null);
        setIsAuthView(true);
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("ptwp_auth_user");
          } catch (e) {}
        }
        return;
      }

      // Jika ADA sesi aktif di tab ini (misal reload F5 saat sedang bekerja):
      setCurrentUser(user);
      setIsAuthView(false);

      const activeSatker = user.satker || "Pengadilan Agama Gunung Sugih";
      await refreshPeriodsWithData(activeSatker);
      const periods = getAvailablePeriods(activeSatker);
      setAvailablePeriods(periods);

      const savedSettings = fetchSettings(activeSatker);
      setSettings(savedSettings);

      if (user.role === "super_admin" || user.username?.toLowerCase() === "aku admin") {
        setActiveTab("admin");
      } else {
        setActiveTab("dashboard");
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

      const duesData = await fetchMembersByPeriod(initialPeriod, activeSatker);
      setMembers(duesData);

      const cashData = await fetchCashBook(activeSatker);
      setCashbook(cashData);
    }

    loadInitialData();
  }, []);

  // Update members & cashbook saat ganti periode & satker
  useEffect(() => {
    async function loadPeriodMembers() {
      const activeSatker = currentUser?.satker || "Pengadilan Agama Gunung Sugih";
      const duesData = await fetchMembersByPeriod(period, activeSatker);
      setMembers(duesData);
      const cashData = await fetchCashBook(activeSatker);
      setCashbook(cashData);
      const currentSettings = fetchSettings(activeSatker);
      setSettings(currentSettings);
    }
    loadPeriodMembers();
  }, [period, currentUser?.satker]);

  // Theme switcher dengan animasi Circular Ripple Reveal dari posisi ikon (persis Gambar 1)
  const handleToggleTheme = (e, targetTheme) => {
    const nextTheme = targetTheme || (theme === "light" ? "dark" : "light");
    if (nextTheme === theme) return;

    const applyTheme = (t) => {
      setTheme(t);
      if (typeof document !== "undefined") {
        if (t === "dark") {
          document.documentElement.setAttribute("data-theme", "dark");
          try {
            localStorage.setItem("ptwp_theme", "dark");
          } catch (err) {}
        } else {
          document.documentElement.removeAttribute("data-theme");
          try {
            localStorage.setItem("ptwp_theme", "light");
          } catch (err) {}
        }
      }
    };

    // Ambil koordinat titik klik pengguna (icon switch di sidebar)
    let x = e?.clientX;
    let y = e?.clientY;

    if (typeof x !== "number" || typeof y !== "number") {
      const pill = typeof document !== "undefined" && document.querySelector(".dock-theme-pill");
      if (pill) {
        const rect = pill.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      } else {
        x = 35;
        y = 120;
      }
    }

    // Jika View Transition API tidak didukung atau pengguna memilih reduced-motion
    if (
      typeof document === "undefined" ||
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      applyTheme(nextTheme);
      return;
    }

    // Hitung radius terjauh dari titik klik ke sudut layar yang terjauh
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      applyTheme(nextTheme);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 1800,
          easing: "cubic-bezier(0.32, 0.72, 0, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  // Status bayar toggle - otomatis perbarui Buku Kas & Dashboard
  const handleToggleStatus = async (memberId) => {
    const activeSatker = currentUser?.satker || "Pengadilan Agama Gunung Sugih";
    const updated = await toggleMemberPaidStatus(period, memberId, activeSatker);
    setMembers(updated);
    reloadCashbook(activeSatker);
  };

  // Tambah / Update Member
  const handleSaveMember = async (memberData) => {
    const activeSatker = currentUser?.satker || "Pengadilan Agama Gunung Sugih";
    if (editingMember) {
      const updated = await updateSingleMember(period, editingMember.id, memberData, activeSatker);
      setMembers(updated);
      setEditingMember(null);
    } else {
      const updated = await addMember(period, memberData, activeSatker);
      setMembers(updated);
    }
    reloadCashbook(activeSatker);
  };

  const handleEditClick = (member) => {
    setEditingMember(member);
    setIsMemberFormOpen(true);
  };

  const handleDeleteMember = async (memberId) => {
    const activeSatker = currentUser?.satker || "Pengadilan Agama Gunung Sugih";
    if (confirm("Apakah Anda yakin ingin menghapus anggota ini dari daftar periode ini?")) {
      const updated = await deleteMember(period, memberId, activeSatker);
      setMembers(updated);
      if (updated.length === 0) {
        clearPeriodData(period, activeSatker);
      }
      await reloadCashbook(activeSatker);
    }
  };

  // Import Excel / CSV Success (Mendukung deteksi multi-bulan, single-bulan, dan matrix cashbook)
  const handleImportSuccess = async (importedData, targetPeriod, isMulti = false, rawFile = null) => {
    const activeSatker = currentUser?.satker || settings.institution || "Pengadilan Agama Gunung Sugih";

    // Arsipkan dokumen Excel asli yang diunggah ke database MySQL (expense_documents)
    if (rawFile && typeof window !== "undefined") {
      try {
        const formData = new FormData();
        formData.append("file", rawFile);
        formData.append("satker", activeSatker);
        formData.append("year", targetPeriod?.match(/\b(20\d{2})\b/)?.[1] || "2026");
        formData.append("uploaded_by", currentUser?.name || currentUser?.username || "Bendahara Cabang");
        fetch("/api/expenses/documents", {
          method: "POST",
          body: formData,
        }).catch((e) => console.warn("Gagal mengarsipkan berkas asli ke DB:", e));
      } catch (err) {
        console.warn("Gagal mengarsipkan berkas asli ke DB:", err);
      }
    }

    // 1. Format Rekapitulasi Kas Triwulan (PA Gunung Sugih - 12 Bulan)
    if (importedData && importedData.type === "matrix_cashbook" && Array.isArray(importedData.months)) {
      const satkerName = activeSatker;
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
      await addCashBookEntriesBatch(newCashEntries, activeSatker);

      // Perbarui daftar periode yang tersedia
      const updatedAvailable = getAvailablePeriods(activeSatker);
      newPeriods.forEach((p) => {
        if (!updatedAvailable.includes(p)) updatedAvailable.push(p);
      });
      setAvailablePeriods(updatedAvailable);

      // Prioritaskan September jika ada di dalam bulan yang diimpor
      const septPeriod = newPeriods.find((p) => p.toLowerCase().includes("september"));
      const finalPeriod = septPeriod || targetPeriod || newPeriods[newPeriods.length - 1] || period;

      changePeriod(finalPeriod);
      setDuesSubTab("out"); // Arahkan langsung ke sub-tab belanja agar pengguna langsung melihat hasilnya
      await reloadCashbook(activeSatker);

      setTimeout(() => {
        alert(`✅ Berhasil mengimpor ${importedData.months.length} bulan laporan kas PTWP!\n\n• Sebanyak ${newCashEntries.length} transaksi kas & belanja telah berhasil diterapkan ke sistem.\n• Periode aktif diarahkan ke ${finalPeriod}.`);
      }, 200);
      return;
    }

    if (isMulti && Array.isArray(importedData)) {
      // Import banyak bulan sekaligus
      await saveMultiplePeriodsData(importedData, activeSatker);

      await refreshPeriodsWithData(activeSatker);
      const allNewPeriods = importedData.map((d) => d.period);
      const updatedAvailable = getAvailablePeriods(activeSatker);
      setAvailablePeriods(updatedAvailable);

      // Prioritaskan targetPeriod jika valid, atau September jika ada, atau bulan terakhir
      const finalPeriod =
        (targetPeriod && allNewPeriods.includes(targetPeriod) ? targetPeriod : null) ||
        allNewPeriods.find((p) => p.toLowerCase().includes("september")) ||
        allNewPeriods[allNewPeriods.length - 1] ||
        period;

      changePeriod(finalPeriod);

      const currentMonthData = importedData.find((d) => d.period === finalPeriod);
      if (currentMonthData) {
        setMembers(filterRealMembers(currentMonthData.members));
      } else {
        const duesData = await fetchMembersByPeriod(finalPeriod, activeSatker);
        setMembers(duesData);
      }

      await reloadCashbook(activeSatker);

      setTimeout(() => {
        alert(
          `✅ Berhasil mengimpor ${importedData.length} lembar bulan iuran PTWP!\n\n` +
          `• Data rekap iuran ${allNewPeriods.join(', ')} telah tersimpan rapi ke database MySQL.\n` +
          `• Seluruh penerimaan iuran berhasil dicatat ke Buku Kas.\n` +
          `• Periode aktif diarahkan ke ${finalPeriod}.`
        );
      }, 300);
    } else {
      // Import 1 lembar bulan tunggal
      const finalPeriod = targetPeriod || period;
      await saveMembersByPeriod(finalPeriod, importedData, activeSatker);

      await refreshPeriodsWithData(activeSatker);
      if (finalPeriod !== period) {
        if (!availablePeriods.includes(finalPeriod)) {
          setAvailablePeriods((prev) => [finalPeriod, ...prev]);
        }
        changePeriod(finalPeriod);
      }
      setMembers(filterRealMembers(importedData));
      await reloadCashbook(activeSatker);

      setTimeout(() => {
        alert(
          `✅ Berhasil mengimpor data iuran periode "${finalPeriod}"!\n\n` +
          `• Data anggota & status iuran berhasil disimpan ke database MySQL.\n` +
          `• Rekap iuran masuk telah dicatatkan ke Buku Kas.`
        );
      }, 300);
    }
  };

  const handleClearData = async () => {
    const activeSatker = currentUser?.satker || "Pengadilan Agama Gunung Sugih";
    if (
      confirm(
        `Kosongkan data iuran untuk periode ${period}?\n\n` +
        `• Seluruh tabel rekap periode ini akan dikosongkan.\n` +
        `• Catatan penerimaan iuran terkait di Buku Kas akan otomatis dihapus.\n` +
        `• Saldo Kas PTWP akan langsung berkurang.`
      )
    ) {
      clearPeriodData(period, activeSatker);
      setMembers([]);
      await reloadCashbook(activeSatker);
    }
  };

  const handleClearAllData = async () => {
    const activeSatker = currentUser?.satker || "Pengadilan Agama Gunung Sugih";
    const periodsWithData = getPeriodsWithData(activeSatker);
    if (
      confirm(
        `Apakah Anda yakin ingin mengosongkan seluruh data rekap dari SEMUA ${periodsWithData.length} periode?\n\n` +
        `• Seluruh tabel rekap iuran akan dikosongkan secara permanen.\n` +
        `• Seluruh catatan penerimaan iuran di Buku Kas akan dihapus.\n` +
        `• Saldo Kas PTWP akan berkurang sesuai seluruh iuran yang dihapus.`
      )
    ) {
      clearAllPeriodsData(activeSatker);
      setMembers([]);
      await reloadCashbook(activeSatker);
    }
  };

  // Tambah Kas Manual
  const handleAddCashEntry = async (entry) => {
    const activeSatker = currentUser?.satker || "Pengadilan Agama Gunung Sugih";
    const updated = await addCashBookEntry({
      ...entry,
      period: entry.period || period,
    }, activeSatker);
    setCashbook(updated);
  };

  // Hapus Kas (Manual maupun Penerimaan Iuran Rekap)
  const handleDeleteCashEntry = async (id, item) => {
    const activeSatker = currentUser?.satker || "Pengadilan Agama Gunung Sugih";
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
        clearPeriodData(targetPeriod, activeSatker);
        if (targetPeriod === period) {
          setMembers([]);
        }
        await reloadCashbook(activeSatker);
      }
      return;
    }

    if (confirm("Apakah Anda yakin ingin menghapus catatan mutasi kas ini?")) {
      const updated = await deleteCashBookEntry(id, activeSatker);
      setCashbook(updated);
    }
  };

  // Pengaturan
  const handleSaveSettings = (newSettings) => {
    const activeSatker = currentUser?.satker || newSettings?.satker || "Pengadilan Agama Gunung Sugih";
    const updated = saveSettings(newSettings, activeSatker);
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
    if (user) {
      setCurrentUser(user);
      const userSatker = user.satker || "Pengadilan Agama Gunung Sugih";
      setSettings(fetchSettings(userSatker));
      fetchMembersByPeriod(period, userSatker).then((d) => setMembers(d));
      fetchCashBook(userSatker).then((c) => setCashbook(c));
    }
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
    setMembers([]);
    setCashbook([]);
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

  // Helper konversi nama bulan & tahun ke integer key kronologis
  const getPeriodKey = (pStr) => {
    if (!pStr) return 0;
    const months = [
      "januari", "februari", "maret", "april", "mei", "juni",
      "juli", "agustus", "september", "oktober", "november", "desember"
    ];
    const parts = String(pStr).trim().toLowerCase().split(/\s+/);
    const mIdx = months.indexOf(parts[0]);
    const yr = parseInt(parts[1] || "2026", 10);
    return yr * 12 + (mIdx !== -1 ? mIdx : 0);
  };

  const getPeriodKeyFromDate = (dateStr) => {
    if (!dateStr) return 0;
    const parts = String(dateStr).split("-");
    if (parts.length >= 2) {
      const yr = parseInt(parts[0], 10);
      const mIdx = parseInt(parts[1], 10) - 1;
      return yr * 12 + mIdx;
    }
    return 0;
  };

  const activePeriodKey = getPeriodKey(period);

  // 1. Saldo Kumulatif dari bulan-bulan sebelum periode aktif
  const priorEntries = cashbook.filter((c) => {
    const pKey = c.period ? getPeriodKey(c.period) : (c.date ? getPeriodKeyFromDate(c.date) : 0);
    return pKey > 0 && pKey < activePeriodKey;
  });

  const priorCashIn = priorEntries.filter((c) => c.type === "in").reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const priorCashOut = priorEntries.filter((c) => c.type === "out").reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const priorCumulativeBalance = priorCashIn - priorCashOut;

  // Helper pencocokan entri kas dengan periode tertentu (berdasarkan period atau tanggal)
  const isEntryInPeriod = (entry, targetPeriod) => {
    if (!entry || !targetPeriod) return false;
    if (entry.period && entry.period.toLowerCase() === targetPeriod.toLowerCase()) return true;
    if (entry.date) {
      const pLower = targetPeriod.toLowerCase();
      const monthNames = [
        { name: "januari", num: "01" }, { name: "februari", num: "02" }, { name: "maret", num: "03" },
        { name: "april", num: "04" }, { name: "mei", num: "05" }, { name: "juni", num: "06" },
        { name: "juli", num: "07" }, { name: "agustus", num: "08" }, { name: "september", num: "09" },
        { name: "oktober", num: "10" }, { name: "november", num: "11" }, { name: "desember", num: "12" }
      ];
      const found = monthNames.find((m) => pLower.includes(m.name));
      if (found && entry.date.includes(`-${found.num}-`)) return true;
    }
    return false;
  };

  // 2. Cek apakah ada entri khusus Saldo Awal di periode ini (misal Saldo Awal 2025 di Januari 2026)
  const currentPeriodSaldoAwalEntry = cashbook.find((c) => {
    const isThisPeriod = isEntryInPeriod(c, period);
    return isThisPeriod && (c.source === "saldo_awal" || c.category === "Saldo Awal");
  });

  const periodSaldoAwal = priorCumulativeBalance + (currentPeriodSaldoAwalEntry ? Number(currentPeriodSaldoAwalEntry.amount || 0) : 0);

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
    return isEntryInPeriod(c, period);
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

  // 3. Uang Masuk Operasional Periode Aktif (tanpa entri Saldo Awal agar tidak dobel hitung dengan Saldo Awal)
  const currentPeriodCashInEntries = cashbook.filter((c) => {
    const isThisPeriod = isEntryInPeriod(c, period);
    const isNotSaldoAwal = c.source !== "saldo_awal" && c.category !== "Saldo Awal";
    return c.type === "in" && isThisPeriod && isNotSaldoAwal;
  });

  const duesInCashbookThisPeriod = currentPeriodCashInEntries.reduce((sum, c) => sum + Number(c.amount || 0), 0);

  // Jika periode Januari murni bersumber dari Saldo Awal kas tahun lalu (seperti di Excel bendahara), uang masuk operasional = 0
  const isPureSaldoAwalPeriod = Boolean(currentPeriodSaldoAwalEntry && duesInCashbookThisPeriod === 0);
  const effectiveUangMasuk = isPureSaldoAwalPeriod
    ? 0
    : (duesInCashbookThisPeriod > 0 ? duesInCashbookThisPeriod : totalCollected);

  // 4. Uang Keluar Periode Aktif
  const totalPeriodExpenses = currentPeriodExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // 5. Saldo Akhir Kas Periode Aktif:
  // Saldo Awal + Uang Masuk - Uang Keluar (identik 100% dengan running balance Excel bendahara)
  const periodSaldoAkhir = periodSaldoAwal + effectiveUangMasuk - totalPeriodExpenses;
  const netBalance = periodSaldoAkhir;

  const getExpenseCount = (cat) => {
    if (cat === "all") return currentPeriodExpenses.length;
    return currentPeriodExpenses.filter(
      (e) => (e.category || "").toLowerCase() === cat.toLowerCase()
    ).length;
  };

  // Hanya ambil kategori belanja yang benar-benar ada datanya pada periode ini (jika 0 tidak ditampilkan)
  const dynamicExpenseCategories = Array.from(
    new Set(currentPeriodExpenses.map((e) => e.category).filter(Boolean))
  ).filter((cat) => getExpenseCount(cat) > 0);

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
      periodSaldoAwal: periodSaldoAwal,
      effectiveUangMasuk: effectiveUangMasuk,
      totalPeriodExpenses: totalPeriodExpenses,
      periodSaldoAkhir: periodSaldoAkhir,
      netBalance: periodSaldoAkhir,
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

  // Animasi Lingkaran Membesar dari Tengah ke Full Screen (Smooth & Cepat 0.7 Detik)
  const handleLoginTransition = (stateUpdateFn) => {
    if (
      typeof document === "undefined" ||
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      stateUpdateFn();
      return;
    }

    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const endRadius = Math.hypot(x, y);

    setIsLoggingIn(true);

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        stateUpdateFn();
      });
    });

    transition.ready.then(() => {
      // 1. Dashboard baru membesar melingkar dari tengah menuhin layar (On Top, z-index 9999)
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 700,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );

      // 2. Form login lama memudar, blur & menyusut lembut agar tidak menindih/menutupi lingkaran
      document.documentElement.animate(
        {
          opacity: [1, 0.5, 0],
          transform: ["scale(1)", "scale(0.96)"],
          filter: ["blur(0px)", "blur(8px)"],
        },
        {
          duration: 700,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-old(root)",
        }
      );
    });

    transition.finished.finally(() => {
      setIsLoggingIn(false);
    });
  };

  if (isAuthView) {
    return (
      <AuthView
        onLoginSuccess={(user) => {
          handleLoginTransition(() => {
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
            const userSatker = user?.satker || "Pengadilan Agama Gunung Sugih";
            const userSettings = fetchSettings(userSatker);
            setSettings(userSettings);
            fetchMembersByPeriod(period, userSatker).then((d) => setMembers(d));
            fetchCashBook(userSatker).then((c) => setCashbook(c));
            setIsAuthView(false);
          });
        }}
        onBypassToDashboard={() => {
          handleLoginTransition(() => {
            const guestUser = INITIAL_USERS[0];
            loginUser(guestUser, "", guestUser.satker);
            setCurrentUser(guestUser);
            setIsAuthView(false);
          });
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
        theme={theme}
        onToggleTheme={handleToggleTheme}
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
          onPrint={() => {
            window.print();
          }}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          currentUser={currentUser}
          searchQuery={duesSubTab === "in" ? searchQuery : expenseSearchQuery}
          onSearchChange={(val) => {
            if (duesSubTab === "in") setSearchQuery(val);
            else setExpenseSearchQuery(val);
          }}
          showSearch={activeTab === "dues"}
          searchPlaceholder={duesSubTab === "in" ? "Cari nama, jabatan..." : "Cari pos belanja..."}
          onOpenPeriodPicker={() => setIsPeriodPickerOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          monitoringSubTab={monitoringSubTab}
          onMonitoringSubTabChange={setMonitoringSubTab}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          selectedMonitoringBranch={selectedMonitoringBranch}
          onSelectMonitoringBranch={setSelectedMonitoringBranch}
          settings={settings}
        />

        <main
          key={activeTab}
          className={`content-area ${activeTab !== "dashboard" && !isLoggingIn ? "page-transition-blur" : ""}`}
        >
          {/* TAB 0: DASHBOARD UTAMA (STITCH DESIGN) */}
            {activeTab === "dashboard" && (
              <div style={{ position: "relative" }}>
                <DashboardView
                  members={members}
                  cashbook={cashbook}
                  period={period}
                  settings={settings}
                  currentUser={currentUser}
                  isLoggingIn={isLoggingIn}
                  onOpenDues={() => setActiveTab("dues")}
                  onOpenAddCash={() => {
                    setIsAddCashOpen(true);
                  }}
                  onOpenExport={() => {
                    setIsExportOpen(true);
                  }}
                  onOpenPeriodPicker={() => setIsPeriodPickerOpen(true)}
                />

              </div>
            )}

            {/* TAB MONITORING PA CABANG (KHUSUS PTA BANDAR LAMPUNG) */}
            {activeTab === "monitoring" && (
              <MonitoringCabangView
                period={period}
                onPeriodChange={changePeriod}
                currentUser={currentUser}
                onPrint={() => window.print()}
                monitoringSubTab={monitoringSubTab}
                onMonitoringSubTabChange={setMonitoringSubTab}
              />
            )}

            {/* TAB 1: REKAPITULASI IURAN */}
            {activeTab === "dues" && (
              <div style={{ position: "relative" }}>
                {/* Header Cetak Formal (Hanya tampil saat Print) */}
                <div style={{ display: "none" }} className="print-header">
                  <h2 style={{ textAlign: "center", fontSize: "14pt", fontWeight: "bold" }}>
                    {duesSubTab === "in" ? "IURAN" : "REALISASI BELANJA DAN PENGELUARAN IURAN"} PTWP CABANG {settings.institution || "PENGADILAN AGAMA GUNUNG SUGIH"}
                  </h2>
                  <p style={{ textAlign: "center", fontSize: "11pt", marginBottom: "15px" }}>
                    Bulan : {period}
                  </p>
                </div>

              {/* SUB-TAB NAVIGATOR: KIRI (Iuran Masuk) - TENGAH (Import, Export, Hapus) - KANAN (Iuran Keluar) */}
              <div className="rekap-subtabs-bar">
                {/* 1. KIRI: Tab Iuran Masuk */}
                <button
                  type="button"
                  onClick={() => setDuesSubTab("in")}
                  className={`rekap-subtab-pill ${duesSubTab === "in" ? "active-in" : ""}`}
                >
                  <span>Iuran Masuk</span>
                </button>

                {/* 2. TENGAH: Import Excel, Export Excel, Hapus Data */}
                <div className="rekap-center-actions-pill">
                  <button
                    type="button"
                    className="rekap-action-btn rekap-action-import"
                    onClick={() => {
                      setIsImportOpen(true);
                    }}
                    title="Import data dari Excel (.xlsx / .csv)"
                  >
                    <UploadCloud size={15} />
                    <span>Import Excel</span>
                  </button>

                  <div className="rekap-action-divider" />

                  <button
                    type="button"
                    className="rekap-action-btn rekap-action-export"
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
                    <span>Export Excel</span>
                  </button>

                  <div className="rekap-action-divider" />

                  <button
                    type="button"
                    className="rekap-action-btn rekap-action-delete"
                    onClick={() => {
                      if (duesSubTab === "in") handleClearData();
                      else handleClearExpenses();
                    }}
                    title={duesSubTab === "in" ? `Kosongkan/Hapus data iuran periode ${period}` : `Kosongkan/Hapus belanja periode ${period}`}
                  >
                    <Trash2 size={14} />
                    <span>Hapus</span>
                  </button>

                  <div className="rekap-action-divider" />

                  <button
                    type="button"
                    className="rekap-action-btn rekap-action-reset"
                    onClick={() => {
                      if (duesSubTab === "in") handleClearAllData();
                      else handleClearAllExpenses();
                    }}
                    title="Kosongkan seluruh data dari seluruh periode yang tersimpan"
                  >
                    <RotateCcw size={13} />
                    <span>Reset Semua</span>
                    <span className="rekap-action-badge">
                      {duesSubTab === "in"
                        ? `${getPeriodsWithData(currentUser?.satker || settings.institution).length} Bln`
                        : `${cashbook.filter((c) => c.type === "out").length} Pos`}
                    </span>
                  </button>
                </div>

                {/* 3. KANAN: Tab Iuran Keluar */}
                <button
                  type="button"
                  onClick={() => {
                    setDuesSubTab("out");
                  }}
                  className={`rekap-subtab-pill ${duesSubTab === "out" ? "active-out" : ""}`}
                >
                  <span>Iuran Keluar</span>
                </button>
              </div>

              {/* Tampilan Konten Subtab dengan Efek Transisi Blur Halus 0,7 Detik */}
              <div key={duesSubTab} className="page-transition-blur">
                {/* 1. CONTROL & FILTER TOOLBAR (STRUKTUR SAMA PERSIS ANTARA MASUK & KELUAR) */}
              <div className="stitch-toolbar">
                {/* Baris 1: Header Halaman (Kiri: Judul & Status Periode, Kanan: Tombol Utama Tambah) */}
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

                  {/* Kanan Atas: Tombol Filter & Tambah */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {((duesSubTab === "in" && members.length > 0) || (duesSubTab === "out" && currentPeriodExpenses.length > 0)) && (
                      <button
                        type="button"
                        className={`rekap-filter-toggle-btn ${isFilterVisible ? "active" : ""}`}
                        onClick={() => setIsFilterVisible(!isFilterVisible)}
                        title={isFilterVisible ? "Sembunyikan filter kategori (hilangkan ke atas)" : "Tampilkan filter kategori"}
                      >
                        <Filter size={14} />
                        <span>Filter</span>
                        {((duesSubTab === "in" && categoryFilter !== "all") || (duesSubTab === "out" && expenseCategoryFilter !== "all")) && (
                          <span className="rekap-filter-active-dot" />
                        )}
                        {isFilterVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}

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
              </div>

              {/* Baris 2: Filter Kategori Mandiri di Bawah (Terpisah dan Tidak Menyatu dengan Kotak Atas) */}
              {((duesSubTab === "in" && members.length > 0) || (duesSubTab === "out" && currentPeriodExpenses.length > 0)) && (
                <div className={`rekap-filter-collapsible ${isFilterVisible ? "open" : "collapsed"}`}>
                  <div className="rekap-filter-tube">
                    {duesSubTab === "in" ? (
                      <>
                        <button
                          type="button"
                          className={`stitch-filter-pill-btn ${categoryFilter === "all" ? "active" : ""}`}
                          onClick={() => setCategoryFilter("all")}
                        >
                          Semua ({members.length})
                        </button>
                        {hakimCount > 0 && (
                          <button
                            type="button"
                            className={`stitch-filter-pill-btn ${categoryFilter === "Hakim" ? "active" : ""}`}
                            onClick={() => setCategoryFilter("Hakim")}
                          >
                            Hakim ({hakimCount})
                          </button>
                        )}
                        {paniteraCount > 0 && (
                          <button
                            type="button"
                            className={`stitch-filter-pill-btn ${categoryFilter === "Kepaniteraan" ? "active" : ""}`}
                            onClick={() => setCategoryFilter("Kepaniteraan")}
                          >
                            Kepaniteraan ({paniteraCount})
                          </button>
                        )}
                        {sekretariatCount > 0 && (
                          <button
                            type="button"
                            className={`stitch-filter-pill-btn ${categoryFilter === "Kesekretariatan" ? "active" : ""}`}
                            onClick={() => setCategoryFilter("Kesekretariatan")}
                          >
                            Kesekretariatan ({sekretariatCount})
                          </button>
                        )}
                        {stafCount > 0 && (
                          <button
                            type="button"
                            className={`stitch-filter-pill-btn ${categoryFilter === "Staf" ? "active" : ""}`}
                            onClick={() => setCategoryFilter("Staf")}
                          >
                            Staf ({stafCount})
                          </button>
                        )}
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
                </div>
              )}

              {/* 2. 4 KEY METRIC CARDS (STANDAR BUKU KAS BERJALAN): Saldo Awal - Uang Masuk - Uang Keluar - Saldo Akhir */}
              <div
                className="stitch-dash-grid"
                style={{
                  marginBottom: "16px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "12px",
                }}
              >
                {/* Card 1: Saldo Awal Kas */}
                <div className="stitch-card">
                  <div className="hairline-court" style={{ background: "#0284c7" }}></div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Saldo Awal Kas
                    </span>
                    <span style={{ fontSize: "15px" }}>🏛️</span>
                  </div>
                  <div className="font-mono-num" style={{ fontSize: "19px", fontWeight: 700, color: "var(--text-main)" }}>
                    {formatRupiah(periodSaldoAwal)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "11.5px", color: "var(--text-muted)" }}>
                    <span>{period.toLowerCase().startsWith("januari") ? "Sisa kas akhir tahun lalu" : `Sisa kas per 1 ${period.split(' ')[0]}`}</span>
                  </div>
                </div>

                {/* Card 2: Uang Masuk */}
                <div className="stitch-card">
                  <div className="hairline-court" style={{ background: "#16a34a" }}></div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Uang Masuk
                    </span>
                    <ArrowDownLeft size={16} color="var(--money-in)" />
                  </div>
                  <div className="font-mono-num" style={{ fontSize: "19px", fontWeight: 700, color: "var(--money-in)" }}>
                    {formatRupiah(effectiveUangMasuk)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                    {totalTarget > 0 && !isPureSaldoAwalPeriod ? (
                      <>
                        <div style={{ flex: 1, height: "6px", background: "var(--border-light)", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ width: `${percentageCollected}%`, height: "100%", background: "#16a34a", borderRadius: "99px" }}></div>
                        </div>
                        <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--money-in)" }}>{percentageCollected}%</span>
                      </>
                    ) : (
                      <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Penerimaan periode {period}</span>
                    )}
                  </div>
                  {unpaidMembers.length > 0 && !isPureSaldoAwalPeriod && (
                    <div style={{ fontSize: "11px", color: "#d97706", fontWeight: 600, marginTop: "5px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>⚠️ {unpaidMembers.length} belum bayar:</span>
                      <strong style={{ color: "#b45309" }}>-{formatRupiah(totalUnpaid)}</strong>
                    </div>
                  )}
                </div>

                {/* Card 3: Uang Keluar */}
                <div className="stitch-card">
                  <div className="hairline-court" style={{ background: "#dc2626" }}></div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Uang Keluar
                    </span>
                    <ArrowUpRight size={16} color="var(--money-out)" />
                  </div>
                  <div className="font-mono-num" style={{ fontSize: "19px", fontWeight: 700, color: "var(--money-out)" }}>
                    {formatRupiah(totalPeriodExpenses)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "11.5px", color: "var(--text-muted)" }}>
                    <span>{currentPeriodExpenses.length} pos belanja & setoran</span>
                  </div>
                </div>

                {/* Card 4: Saldo Akhir Kas */}
                <div className="stitch-card">
                  <div className="hairline-gold"></div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Saldo Akhir Kas
                    </span>
                    <Scale size={16} color={periodSaldoAkhir >= 0 ? "var(--primary-700)" : "var(--money-out)"} />
                  </div>
                  <div
                    className="font-mono-num"
                    style={{
                      fontSize: "19px",
                      fontWeight: 700,
                      color: periodSaldoAkhir >= 0 ? "var(--text-main)" : "var(--money-out)",
                    }}
                  >
                    {formatRupiah(periodSaldoAkhir)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "11.5px", color: "var(--text-muted)" }}>
                    <span style={{ color: periodSaldoAkhir >= 0 ? "var(--money-in)" : "var(--money-out)", fontWeight: 600 }}>
                      ● {periodSaldoAkhir >= 0 ? "Kas Tersedia (Aman)" : "Defisit Kas"}
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
                    onOpenImport={() => {
                      setIsImportOpen(true);
                    }}
                    onOpenAdd={() => {
                      setEditingMember(null);
                      setIsMemberFormOpen(true);
                    }}
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
                    onOpenImport={() => {
                      setIsImportOpen(true);
                    }}
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
                />
              )}
              </div>


            </div>
          )}

          {/* TAB 2: BUKU KAS CABANG */}
          {activeTab === "cashbook" && (
            <div style={{ position: "relative" }}>
              <CashBookView
                cashbook={cashbook}
                onAddEntry={(entry) => {
                  handleAddCashEntry(entry);
                }}
                onDeleteEntry={(id) => {
                  handleDeleteCashEntry(id);
                }}
                isAdmin={isAdmin}
                currentUser={currentUser}
              />

            </div>
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
        currentUser={currentUser}
        onSaveSettings={handleSaveSettings}
        enableWhatsApp={enableWhatsApp}
        onToggleWhatsApp={setEnableWhatsApp}
      />

      <AddCashModal
        isOpen={isAddCashOpen}
        onClose={() => setIsAddCashOpen(false)}
        onAddEntry={handleAddCashEntry}
      />

      {/* Modal Catat Pengeluaran Baru (Khusus Rekap Iuran Keluar) */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        period={period}
        onAddExpense={handleAddCashEntry}
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


      {/* Indikator Status Koneksi Jaringan */}
      <NetworkStatusSentinel />

    </div>
  );
}
