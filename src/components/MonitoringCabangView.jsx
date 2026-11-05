"use client";

import React, { useState, useEffect, useMemo } from "react";
import DashboardView from "@/components/DashboardView";
import {
  fetchMembersByPeriod,
  fetchCashBook,
  fetchSettings,
  getPeriodsWithData,
} from "@/services/storageService";
import { INITIAL_MEMBERS } from "@/data/initialMembers";
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
}) {
  const [selectedBranch, setSelectedBranch] = useState("Pengadilan Agama Gunung Sugih");
  const [branchSearch, setBranchSearch] = useState("");
  const [branchMembers, setBranchMembers] = useState([]);
  const [branchCashbook, setBranchCashbook] = useState([]);
  const [branchSettings, setBranchSettings] = useState({});
  const [periodsWithData, setPeriodsWithData] = useState([]);

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

        // Jika cabang belum memiliki data tersendiri, sediakan data representatif sesuai profil cabang
        if (!mems || mems.length === 0) {
          const branchMeta = PA_BRANCHES.find((b) => b.name === selectedBranch);
          const targetCount = branchMeta ? branchMeta.membersCount : 40;
          const adjustedMems = INITIAL_MEMBERS.slice(0, targetCount).map(
            (m, idx) => ({
              ...m,
              id: idx + 1,
              no: idx + 1,
              paid: idx !== 2 && idx !== 7, // Variasi status bayar
            })
          );
          setBranchMembers(adjustedMems);
        } else {
          setBranchMembers(mems);
        }

        if (!cash || cash.length === 0) {
          setBranchCashbook([
            {
              id: "cash-init-1",
              date: "2026-09-02",
              type: "in",
              description: `Penerimaan Iuran Anggota PTWP ${selectedBranch}`,
              amount: 2750000,
              category: "Iuran Anggota",
            },
            {
              id: "cash-init-2",
              date: "2026-09-10",
              type: "out",
              description: "Belanja Pengadaan Bola Tenis & Konsumsi Lapangan",
              amount: 650000,
              category: "Belanja Lapangan",
            },
          ]);
        } else {
          setBranchCashbook(cash);
        }

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

  return (
    <div className="monitoring-split-layout">
      {/* =====================================================================
          BAGIAN KIRI: Dashboard Utama Utuh Skala ~72% (Tanpa Overlap / Tanpa Animasi Ukuran)
          Sesuai permintaan: "tidak berubah ukurannya, jadi utuh kyk ukuran 70% gitu"
          ===================================================================== */}
      <div className="monitoring-left-pane">
        {/* Dashboard Terintegrasi dengan Data Cabang Bersangkutan */}
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
      </div>

      {/* =====================================================================
          BAGIAN KANAN: 2 Tabel Tabung Melengkung
          1. Tabel Tabung Atas : Kalender Periode (Hanya Bulan & Tahun, Tanggal Dihapus)
          2. Tabel Tabung Bawah: Menu Navigasi 14 PA Cabang
          ===================================================================== */}
      <aside className="monitoring-right-pane" aria-label="Panel Navigasi Monitoring">
        {/* -----------------------------------------------------------------
            1. TABEL TABUNG ATAS: KALENDER PERIODE (Bulan & Tahun Saja)
            Sesuai permintaan: "kalender tgl tidak usah di tampilkan"
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

          {/* Grid 12 Bulan (Dengan Tanda "Ada Data" Sesuai Modal Periode) */}
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
                  <div className="branch-icon-square">
                    <span className="branch-code-text">{branch.code}</span>
                  </div>

                  <div className="branch-meta-info">
                    <span className="branch-name-label">{branch.shortName}</span>
                    <span className="branch-region-label">{branch.region}</span>
                  </div>

                  <div className="branch-status-wrap">
                    <span
                      className={`branch-compliance-pill ${
                        branch.collectionRate === "100.0%"
                          ? "pill-perfect"
                          : "pill-good"
                      }`}
                    >
                      {branch.collectionRate}
                    </span>
                    {isCurrent && (
                      <span className="branch-current-indicator">
                        <CheckCircle2 size={12} color="#0f5132" />
                      </span>
                    )}
                  </div>
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
