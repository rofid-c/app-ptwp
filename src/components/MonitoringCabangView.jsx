"use client";

import React, { useState, useEffect, useMemo } from "react";
import DashboardView from "@/components/DashboardView";
import MonitoringAuditTrailView from "@/components/MonitoringAuditTrailView";
import {
  fetchMembersByPeriod,
  fetchCashBook,
  fetchSettings,
  getPeriodsWithData,
  filterRealMembers,
} from "@/services/storageService";
import { exportExpensesToExcel } from "@/services/excelService";
import {
  Building2,
  Calendar as CalendarIcon,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  Printer,
  Sparkles,
  ShieldCheck,
  ChevronRight as ArrowRightIcon,
  FileSpreadsheet,
  Receipt,
  Download,
  Filter,
  FileCheck,
} from "lucide-react";

// Daftar 14 PA Cabang se-Wilayah PTA Bandar Lampung
export const PA_BRANCHES = [
  {
    id: "pa_gunung_sugih",
    name: "Pengadilan Agama Gunung Sugih",
    shortName: "PA Gunung Sugih",
    region: "Kab. Lampung Tengah",
    membersCount: 46,
    collectionRate: "100.0%",
    status: "Lunas",
    code: "GS",
  },
  {
    id: "pa_tanjung_karang",
    name: "Pengadilan Agama Tanjung Karang",
    shortName: "PA Tanjung Karang",
    region: "Kota Bandar Lampung",
    membersCount: 52,
    collectionRate: "100.0%",
    status: "Lunas",
    code: "TK",
  },
  {
    id: "pa_metro",
    name: "Pengadilan Agama Metro",
    shortName: "PA Metro",
    region: "Kota Metro",
    membersCount: 38,
    collectionRate: "97.4%",
    status: "Aktif",
    code: "MET",
  },
  {
    id: "pa_kalianda",
    name: "Pengadilan Agama Kalianda",
    shortName: "PA Kalianda",
    region: "Kab. Lampung Selatan",
    membersCount: 41,
    collectionRate: "100.0%",
    status: "Lunas",
    code: "KLD",
  },
  {
    id: "pa_tanggamus",
    name: "Pengadilan Agama Tanggamus",
    shortName: "PA Tanggamus",
    region: "Kab. Tanggamus",
    membersCount: 35,
    collectionRate: "94.2%",
    status: "Aktif",
    code: "TGS",
  },
  {
    id: "pa_pringsewu",
    name: "Pengadilan Agama Pringsewu",
    shortName: "PA Pringsewu",
    region: "Kab. Pringsewu",
    membersCount: 32,
    collectionRate: "100.0%",
    status: "Lunas",
    code: "PSW",
  },
  {
    id: "pa_gedong_tataan",
    name: "Pengadilan Agama Gedong Tataan",
    shortName: "PA Gedong Tataan",
    region: "Kab. Pesawaran",
    membersCount: 29,
    collectionRate: "100.0%",
    status: "Lunas",
    code: "GDT",
  },
  {
    id: "pa_sukadana",
    name: "Pengadilan Agama Sukadana",
    shortName: "PA Sukadana",
    region: "Kab. Lampung Timur",
    membersCount: 36,
    collectionRate: "96.8%",
    status: "Aktif",
    code: "SKD",
  },
  {
    id: "pa_kotabumi",
    name: "Pengadilan Agama Kotabumi",
    shortName: "PA Kotabumi",
    region: "Kab. Lampung Utara",
    membersCount: 40,
    collectionRate: "100.0%",
    status: "Lunas",
    code: "KTB",
  },
  {
    id: "pa_blambangan_umpu",
    name: "Pengadilan Agama Blambangan Umpu",
    shortName: "PA Blambangan Umpu",
    region: "Kab. Way Kanan",
    membersCount: 27,
    collectionRate: "100.0%",
    status: "Lunas",
    code: "BLU",
  },
  {
    id: "pa_krui",
    name: "Pengadilan Agama Krui",
    shortName: "PA Krui",
    region: "Kab. Pesisir Barat",
    membersCount: 25,
    collectionRate: "100.0%",
    status: "Lunas",
    code: "KRU",
  },
  {
    id: "pa_tulang_bawang_tengah",
    name: "Pengadilan Agama Tulang Bawang Tengah",
    shortName: "PA Tulang Bawang Tengah",
    region: "Kab. Tulang Bawang Barat",
    membersCount: 28,
    collectionRate: "100.0%",
    status: "Lunas",
    code: "TBT",
  },
  {
    id: "pa_tulang_bawang",
    name: "Pengadilan Agama Tulang Bawang",
    shortName: "PA Tulang Bawang",
    region: "Kab. Tulang Bawang",
    membersCount: 34,
    collectionRate: "95.0%",
    status: "Aktif",
    code: "TBW",
  },
  {
    id: "pa_mesuji",
    name: "Pengadilan Agama Mesuji",
    shortName: "PA Mesuji",
    region: "Kab. Mesuji",
    membersCount: 24,
    collectionRate: "100.0%",
    status: "Lunas",
    code: "MSJ",
  },
];

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function MonitoringCabangView({
  period = "September 2026",
  onPeriodChange,
  currentUser,
  onPrint,
  monitoringSubTab = "dashboard",
  onMonitoringSubTabChange,
}) {
  const [selectedBranch, setSelectedBranch] = useState("Pengadilan Agama Gunung Sugih");
  const [branchSearch, setBranchSearch] = useState("");
  const [branchMembers, setBranchMembers] = useState([]);
  const [branchCashbook, setBranchCashbook] = useState([]);
  const [branchSettings, setBranchSettings] = useState({});
  const [periodsWithData, setPeriodsWithData] = useState([]);

  // Filter & Search untuk Sub-Tab Rekap Belanja
  const [expenseSearchQuery, setExpenseSearchQuery] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");
  const [isExporting, setIsExporting] = useState(null); // null | 'expenses'
  const [hasOriginalDoc, setHasOriginalDoc] = useState(false);
  const [originalDocInfo, setOriginalDocInfo] = useState(null);

  // Periksa apakah cabang ini memiliki berkas Excel asli di MySQL
  useEffect(() => {
    let isMounted = true;
    async function checkDoc() {
      try {
        const res = await fetch(
          `/api/expenses/documents?satker=${encodeURIComponent(selectedBranch)}&download=false`
        );
        if (!isMounted) return;
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.hasDocument) {
            setHasOriginalDoc(true);
            setOriginalDocInfo(json.document);
            return;
          }
        }
        setHasOriginalDoc(false);
        setOriginalDocInfo(null);
      } catch {
        if (isMounted) {
          setHasOriginalDoc(false);
          setOriginalDocInfo(null);
        }
      }
    }
    checkDoc();
    return () => {
      isMounted = false;
    };
  }, [selectedBranch]);

  // Sinkronkan daftar periode yang memiliki data riil untuk satker terpilih
  useEffect(() => {
    const updatePeriods = () => {
      if (typeof window !== "undefined") {
        const targetSatker = selectedBranch || currentUser?.satker || "Pengadilan Agama Gunung Sugih";
        const pData = getPeriodsWithData(targetSatker);
        setPeriodsWithData(pData || []);
      }
    };

    updatePeriods();
    window.addEventListener("storage", updatePeriods);
    return () => {
      window.removeEventListener("storage", updatePeriods);
    };
  }, [selectedBranch, period, currentUser]);

  // Parse Periode aktif (e.g. "September 2026")
  const { currentMonthIdx, currentYear } = useMemo(() => {
    const parts = period.split(" ");
    const mName = parts[0] || "September";
    const yr = parseInt(parts[1], 10) || 2026;
    const idx = MONTH_NAMES.findIndex(
      (m) => m.toLowerCase() === mName.toLowerCase()
    );
    return {
      currentMonthIdx: idx !== -1 ? idx : 8,
      currentYear: yr,
    };
  }, [period]);

  // Muat data untuk cabang yang dipilih
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const mems = await fetchMembersByPeriod(period, selectedBranch);
        const cash = await fetchCashBook(selectedBranch);
        const sett = fetchSettings(selectedBranch);

        if (!isMounted) return;

        setBranchMembers(Array.isArray(mems) ? mems : []);
        setBranchCashbook(Array.isArray(cash) ? cash : []);
        setBranchSettings(sett || {});
      } catch (e) {
        console.error("Error loading branch data in MonitoringCabangView", e);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedBranch, period]);

  // Navigasi Bulan Kalender
  const handleMonthStep = (offset) => {
    let nextIdx = currentMonthIdx + offset;
    let nextYear = currentYear;
    if (nextIdx < 0) {
      nextIdx = 11;
      nextYear -= 1;
    } else if (nextIdx > 11) {
      nextIdx = 0;
      nextYear += 1;
    }
    const newPeriod = `${MONTH_NAMES[nextIdx]} ${nextYear}`;
    if (onPeriodChange) onPeriodChange(newPeriod);
  };

  // Filter Daftar PA Cabang
  const filteredBranches = useMemo(() => {
    const q = branchSearch.trim().toLowerCase();
    if (!q) return PA_BRANCHES;
    return PA_BRANCHES.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.shortName.toLowerCase().includes(q) ||
        b.region.toLowerCase().includes(q)
    );
  }, [branchSearch]);

  const activeBranchMeta = useMemo(() => {
    return (
      PA_BRANCHES.find((b) => b.name === selectedBranch) || PA_BRANCHES[0]
    );
  }, [selectedBranch]);

  // Format Helper
  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  const formatDateId = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Filter Pengeluaran Belanja Cabang Terpilih Periode Aktif
  const branchExpenses = useMemo(() => {
    const list = Array.isArray(branchCashbook) ? branchCashbook : [];
    return list.filter((c) => {
      if (c.type !== "out") return false;
      if (c.period) {
        return c.period.toLowerCase().trim() === period.toLowerCase().trim();
      }
      if (c.date) {
        const pLower = period.toLowerCase();
        const monthNames = [
          { name: "januari", num: "01" },
          { name: "februari", num: "02" },
          { name: "maret", num: "03" },
          { name: "april", num: "04" },
          { name: "mei", num: "05" },
          { name: "juni", num: "06" },
          { name: "juli", num: "07" },
          { name: "agustus", num: "08" },
          { name: "september", num: "09" },
          { name: "oktober", num: "10" },
          { name: "november", num: "11" },
          { name: "desember", num: "12" },
        ];
        const found = monthNames.find((m) => pLower.includes(m.name));
        if (found && c.date.includes(`-${found.num}-`)) return true;
      }
      return false;
    });
  }, [branchCashbook, period]);

  // Total Penerimaan Iuran Cabang
  const totalCollected = useMemo(() => {
    const realMems = filterRealMembers(branchMembers);
    const sumMembers = realMems.reduce((sum, m) => {
      if (m.isPaid) {
        const totalRow = Number(
          m.total ||
            Number(m.pusat || 0) +
              Number(m.daerah || 0) +
              Number(m.cabang || 0) +
              Number(m.tournamen || 0) ||
            0
        );
        return sum + totalRow;
      }
      return sum;
    }, 0);

    if (sumMembers > 0) return sumMembers;

    const duesInCashbook = (branchCashbook || [])
      .filter(
        (c) =>
          c.type === "in" &&
          (c.period?.toLowerCase() === period.toLowerCase() ||
            (c.source === "rekap_iuran" && c.period === period))
      )
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    return duesInCashbook;
  }, [branchMembers, branchCashbook, period]);

  const totalPeriodExpenses = useMemo(() => {
    return branchExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [branchExpenses]);

  const netBalance = totalCollected - totalPeriodExpenses;

  const paidMembersCount = useMemo(() => {
    return filterRealMembers(branchMembers).filter((m) => m.isPaid).length;
  }, [branchMembers]);

  // Kategori Dinamis Belanja
  const dynamicCategories = useMemo(() => {
    const cats = new Set(
      branchExpenses.map((e) => e.category).filter(Boolean)
    );
    return Array.from(cats);
  }, [branchExpenses]);

  // Filter Baris Belanja Berdasarkan Pencarian dan Kategori
  const filteredExpenses = useMemo(() => {
    return branchExpenses.filter((e) => {
      const q = expenseSearchQuery.trim().toLowerCase();
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
  }, [branchExpenses, expenseSearchQuery, expenseCategoryFilter]);

  // Aksi Ekspor Keuangan Pengeluaran: Unduh berkas Excel murni asli dari upload cabang di database
  const handleExportExpenseDocument = async () => {
    try {
      setIsExporting("expenses");

      // 1. Coba unduh berkas fisik Excel asli yang diunggah oleh cabang dari MySQL
      const downloadUrl = `/api/expenses/documents?satker=${encodeURIComponent(selectedBranch)}&download=true`;
      const res = await fetch(downloadUrl);

      if (res.ok) {
        const blob = await res.blob();
        const disposition = res.headers.get("content-disposition");
        let filename = originalDocInfo?.filename || `Dokumen_Asli_Pengeluaran_${activeBranchMeta.shortName}.xlsx`;
        if (disposition && disposition.includes("filename=")) {
          const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match && match[1]) {
            filename = match[1].replace(/['"]/g, "");
          }
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }

      // 2. Jika cabang belum pernah mengunggah dokumen fisik asli ke database (404),
      // berikan data murni seluruh pengeluaran cabang yang tersimpan
      if (branchExpenses.length > 0) {
        alert(
          `Cabang ${activeBranchMeta.shortName} belum memiliki arsip dokumen fisik Excel asli di server.\n\nSistem akan mengekspor seluruh data pengeluaran cabang yang tersimpan.`
        );
        const cityClean =
          activeBranchMeta.region?.replace(/^Kab\.\s*|^Kota\s*/i, "") ||
          "Gunung Sugih";
        await exportExpensesToExcel({
          expenses: branchExpenses,
          period: period,
          city: cityClean,
          treasurerName:
            branchSettings?.bendahara || "Bendahara Pengeluaran",
          treasurerTitle: "Bendahara PTWP",
          institution: activeBranchMeta.name.toUpperCase(),
          effectiveUangMasuk: totalCollected,
          totalPeriodExpenses: totalPeriodExpenses,
          netBalance: netBalance,
        });
      } else {
        alert(
          `Belum ada dokumen Excel asli yang diunggah oleh ${activeBranchMeta.shortName}, dan belum ada catatan pengeluaran belanja tersimpan.`
        );
      }
    } catch (err) {
      console.error("Gagal export dokumen pengeluaran:", err);
      alert("Terjadi kesalahan saat mengunduh dokumen pengeluaran.");
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="monitoring-split-layout">
      {/* =====================================================================
          BAGIAN KIRI: Rasio 80% (Skala 80%)
          - Sub-Tab "dashboard": Dashboard View Lengkap Utuh
          - Sub-Tab "expenses" : Rincian Rekap Belanja & Dokumen Cabang
          ===================================================================== */}
      <div className="monitoring-left-pane">
        {monitoringSubTab === "dashboard" ? (
          /* Dashboard Terintegrasi dengan Data Cabang Bersangkutan */
          <DashboardView
            members={branchMembers}
            cashbook={branchCashbook}
            period={period}
            settings={{
              ...branchSettings,
              branchName: activeBranchMeta.shortName,
              institution: activeBranchMeta.name.toUpperCase(),
            }}
            currentUser={{
              ...currentUser,
              satker: activeBranchMeta.name,
              name: "PTA Bandar Lampung",
              roleLabel: "Pengawas Daerah (PTA)",
            }}
            hideHeader={true}
            onOpenDues={() => {}}
            onOpenAddCash={() => {}}
            onOpenExport={() => {}}
            onOpenPeriodPicker={() => {}}
          />
        ) : monitoringSubTab === "audit" ? (
          /* Tampilan Jejak Rekam & Audit Trail Terpadu */
          <MonitoringAuditTrailView
            selectedBranch={selectedBranch}
            onSelectBranch={setSelectedBranch}
            currentUser={currentUser}
          />
        ) : (
          /* Tampilan Rincian Rekap Belanja & Dokumen Cabang Sesuai Permintaan */
          <div className="monitoring-expense-container">
            {/* Header Card Rekap Belanja */}
            <div className="monitoring-expense-header-card">
              <div className="expense-header-info">
                <div className="expense-header-icon-wrap">
                  <FileSpreadsheet size={22} color="#0f5132" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h3 className="expense-header-title">Rekap Pengeluaran Cabang</h3>
                    <span className="satker-tag-pill">{activeBranchMeta.shortName}</span>
                    <span className="period-tag-pill">{period}</span>
                    {hasOriginalDoc && (
                      <span
                        className="satker-tag-pill"
                        style={{
                          color: "#15803d",
                          background: "#dcfce7",
                          borderColor: "#86efac",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        title={`Dokumen Excel murni asli tersimpan: ${originalDocInfo?.filename || ""}`}
                      >
                        <FileCheck size={12} />
                        <span>Dokumen Asli Tersedia</span>
                      </span>
                    )}
                  </div>
                  <p className="expense-header-subtitle">
                    Rincian realisasi pengeluaran kas operasional dan unduhan berkas Excel murni asli yang diunggah oleh {activeBranchMeta.name}.
                  </p>
                </div>
              </div>

              {/* Action Button: Hanya Ekspor Keuangan Pengeluaran (Dokumen Lengkap Dihapus Sesuai Permintaan) */}
              <div className="expense-header-actions">
                <button
                  type="button"
                  className="exp-export-btn-primary"
                  onClick={handleExportExpenseDocument}
                  disabled={isExporting !== null}
                  title="Unduh berkas Excel murni pengeluaran yang diunggah oleh cabang dari database"
                >
                  <Download size={15} />
                  <span>
                    {isExporting === "expenses"
                      ? "Mengunduh Dokumen..."
                      : "Ekspor Keuangan Pengeluaran"}
                  </span>
                </button>
              </div>
            </div>

            {/* 3 Stat Cards Row */}
            <div className="monitoring-expense-stats-grid">
              {/* Card 1: Total Pengeluaran */}
              <div className="exp-stat-card card-expense">
                <div className="stat-card-header">
                  <span className="stat-card-title">Total Pengeluaran</span>
                  <span className="stat-card-pill pill-red">{branchExpenses.length} Pengeluaran</span>
                </div>
                <div className="stat-card-value font-mono text-red">
                  {formatRupiah(totalPeriodExpenses)}
                </div>
                <div className="stat-card-footer">
                  Total pengeluaran kas operasional {activeBranchMeta.shortName}
                </div>
              </div>

              {/* Card 2: Iuran Terkumpul */}
              <div className="exp-stat-card card-dues">
                <div className="stat-card-header">
                  <span className="stat-card-title">Iuran Terkumpul</span>
                  <span className="stat-card-pill pill-green">{paidMembersCount} Lunas</span>
                </div>
                <div className="stat-card-value font-mono text-green">
                  {formatRupiah(totalCollected)}
                </div>
                <div className="stat-card-footer">
                  Penerimaan iuran dari {filterRealMembers(branchMembers).length} pegawai
                </div>
              </div>

              {/* Card 3: Sisa Kas Bersih */}
              <div className="exp-stat-card card-balance">
                <div className="stat-card-header">
                  <span className="stat-card-title">Sisa Kas Bersih</span>
                  <span className={`stat-card-pill ${netBalance >= 0 ? "pill-gold" : "pill-red"}`}>
                    {netBalance >= 0 ? "Surplus" : "Defisit"}
                  </span>
                </div>
                <div className={`stat-card-value font-mono ${netBalance >= 0 ? "text-gold" : "text-red"}`}>
                  {formatRupiah(netBalance)}
                </div>
                <div className="stat-card-footer">
                  Selisih iuran terkumpul - realisasi belanja
                </div>
              </div>
            </div>

            {/* Main Content Card: Toolbar + Data Table */}
            <div className="monitoring-expense-table-card">
              {/* Toolbar: Search + Category Filter */}
              <div className="exp-card-toolbar">
                <div className="toolbar-search-wrap">
                  <Search size={14} className="toolbar-search-icon" />
                  <input
                    type="text"
                    placeholder="Cari uraian belanja, nota, keterangan..."
                    value={expenseSearchQuery}
                    onChange={(e) => setExpenseSearchQuery(e.target.value)}
                    className="toolbar-search-input"
                  />
                  {expenseSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setExpenseSearchQuery("")}
                      className="toolbar-search-clear"
                      title="Hapus pencarian"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="toolbar-filter-wrap">
                  <Filter size={13} className="toolbar-filter-icon" />
                  <select
                    value={expenseCategoryFilter}
                    onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                    className="toolbar-category-select"
                  >
                    <option value="all">Semua Kategori ({branchExpenses.length})</option>
                    {dynamicCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat} ({branchExpenses.filter((e) => (e.category || "").toLowerCase() === cat.toLowerCase()).length})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="toolbar-count-badge">
                  <span>{filteredExpenses.length} dari {branchExpenses.length} transaksi</span>
                </div>
              </div>

              {/* Table Container */}
              <div className="exp-table-scroll-container">
                <table className="exp-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: "48px", textAlign: "center" }}>NO</th>
                      <th>URAIAN PENGELUARAN / BELANJA</th>
                      <th style={{ width: "160px" }}>KATEGORI</th>
                      <th style={{ width: "120px" }}>TANGGAL</th>
                      <th style={{ width: "160px", textAlign: "right" }}>NOMINAL (RP)</th>
                      <th style={{ width: "180px" }}>KETERANGAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="exp-table-empty-td">
                          <div className="exp-table-empty-box">
                            <div className="empty-icon-circle">
                              <Receipt size={26} color="#94a3b8" />
                            </div>
                            <p className="empty-title">
                              {branchExpenses.length === 0
                                ? `Belum ada catatan pengeluaran belanja untuk ${activeBranchMeta.shortName} pada periode ${period}.`
                                : `Tidak ada data belanja yang cocok dengan filter pencarian.`}
                            </p>
                            <p className="empty-desc">
                              Pilih satker atau bulan lain pada panel samping kanan untuk melihat rekapitulasi cabang bersangkutan.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((exp, idx) => (
                        <tr key={exp.id || idx}>
                          <td style={{ textAlign: "center", fontWeight: 600, color: "var(--text-muted)" }}>
                            {idx + 1}
                          </td>
                          <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            {exp.uraian || exp.description || "-"}
                          </td>
                          <td>
                            <span className="exp-category-pill">
                              {exp.category || "Operasional"}
                            </span>
                          </td>
                          <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            {formatDateId(exp.date)}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", color: "#dc2626" }}>
                            {formatRupiah(exp.amount)}
                          </td>
                          <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {exp.ket || exp.notes || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredExpenses.length > 0 && (
                    <tfoot>
                      <tr className="exp-table-tfoot-row">
                        <td colSpan={4} style={{ textAlign: "right", fontWeight: 700, textTransform: "uppercase" }}>
                          TOTAL BELANJA DITAMPILKAN
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 800, fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", color: "#dc2626", fontSize: "13.5px" }}>
                          {formatRupiah(filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0))}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Footer Tip */}
              <div className="exp-card-footer-tip">
                <span>
                  💡 Dokumen Excel yang diunduh berformat resmi dinas Mahkamah Agung (.xlsx) lengkap dengan formula kalkulasi, kop dinas, dan lembar pengesahan.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          BAGIAN KANAN: 2 Tabel Tabung Melengkung (Rasio 20%)
          TETAP UTUH SESUAI GAMBAR ASLI:
          1. Tabel Tabung Atas : Kalender Periode (12 Bulan Tanpa Tanggal)
          2. Tabel Tabung Bawah: Menu Interaktif 14 PA Cabang
          ===================================================================== */}
      <aside className="monitoring-right-pane" aria-label="Panel Navigasi Monitoring">
        {/* -----------------------------------------------------------------
            1. TABEL TABUNG ATAS: KALENDER PERIODE (Bulan & Tahun Saja)
            ----------------------------------------------------------------- */}
        <div className="monitoring-tabung-card monitoring-calendar-card">
          {/* Header Kalender dengan Navigasi Bulan */}
          <div className="calendar-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div className="tabung-icon-badge">
                <CalendarIcon size={16} color="#0f5132" />
              </div>
              <div>
                <h4 className="tabung-title">Kalender Periode</h4>
                <p className="tabung-subtitle">{period}</p>
              </div>
            </div>

            <div className="calendar-nav-arrows">
              <button
                type="button"
                className="calendar-arrow-btn"
                onClick={() => handleMonthStep(-1)}
                title="Bulan Sebelumnya"
                aria-label="Bulan Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="calendar-arrow-btn"
                onClick={() => handleMonthStep(1)}
                title="Bulan Berikutnya"
                aria-label="Bulan Berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Grid 12 Bulan (Dengan Tanda "Ada Data") */}
          <div className="period-months-grid">
            {MONTH_NAMES.map((mName, idx) => {
              const periodString = `${mName} ${currentYear}`;
              const isMonthActive = idx === currentMonthIdx;
              const hasData = periodsWithData.some(
                (p) => (p || "").trim().toLowerCase() === periodString.toLowerCase()
              );

              return (
                <button
                  key={mName}
                  type="button"
                  onClick={() => {
                    if (onPeriodChange) {
                      onPeriodChange(periodString);
                    }
                  }}
                  className={`period-month-pill-btn ${isMonthActive ? "active" : ""} ${hasData ? "has-data" : "no-data"}`}
                  title={
                    hasData
                      ? `${mName} ${currentYear} • Ada Data Tersimpan`
                      : `${mName} ${currentYear} • Belum ada data`
                  }
                >
                  <span className="month-code">{mName.substring(0, 3)}</span>
                  <span
                    className={`month-data-indicator ${hasData ? "has-data-visible" : "has-data-hidden"}`}
                  >
                    <span className="month-indicator-dot" />
                    <span className="month-indicator-text">Ada Data</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* -----------------------------------------------------------------
            2. TABEL TABUNG BAWAH: MENU 14 PA CABANG
            ----------------------------------------------------------------- */}
        <div className="monitoring-tabung-card monitoring-branches-card">
          {/* Header Daftar Cabang */}
          <div className="branches-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div className="tabung-icon-badge">
                <Building2 size={16} color="#0f5132" />
              </div>
              <div>
                <h4 className="tabung-title">Wilayah PA Cabang</h4>
                <p className="tabung-subtitle">
                  14 Satker Tingkat Pertama
                </p>
              </div>
            </div>
            <span className="branches-count-pill">
              {filteredBranches.length} Satker
            </span>
          </div>

          {/* Kolom Pencarian Cabang Cepat */}
          <div className="branches-search-container">
            <Search size={14} className="branches-search-icon" />
            <input
              type="text"
              placeholder="Cari Pengadilan Agama..."
              value={branchSearch}
              onChange={(e) => setBranchSearch(e.target.value)}
              className="branches-search-input"
            />
            {branchSearch && (
              <button
                type="button"
                onClick={() => setBranchSearch("")}
                className="branches-clear-btn"
                title="Hapus pencarian"
              >
                ×
              </button>
            )}
          </div>

          {/* Daftar Interaktif 14 PA Cabang */}
          <div className="branches-scroll-list">
            {filteredBranches.map((branch) => {
              const isCurrent = branch.name === selectedBranch;

              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => setSelectedBranch(branch.name)}
                  className={`branch-item-btn ${isCurrent ? "active-branch" : ""}`}
                >
                  <span className="branch-name-label">{branch.shortName}</span>

                  {isCurrent && (
                    <span className="branch-current-indicator">
                      <CheckCircle2 size={15} color="#0f5132" />
                    </span>
                  )}
                </button>
              );
            })}

            {filteredBranches.length === 0 && (
              <div className="branches-empty-notice">
                <span>Tidak ada cabang yang cocok dengan "{branchSearch}".</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
