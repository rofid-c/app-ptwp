"use client";

import React, { useState, useEffect } from "react";
import { fetchMembersByPeriod } from "@/services/storageService";
import {
  Calendar,
  CheckCircle2,
  TrendingUp,
  Receipt,
  ArrowDown,
  ArrowUp,
  Zap,
  Table,
  Plus,
  Download,
  Users,
  Building2,
  Clock,
  Landmark,
  Target,
  Activity,
  MoreHorizontal,
  ArrowUpRight,
  Scale,
  BookOpen,
} from "lucide-react";

// Algoritma Catmull-Rom ke Cubic Bezier untuk kurva gelombang yang sangat halus
function getSmoothPath(points) {
  if (!points || points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 5.5;
    const cp1y = p1.y + (p2.y - p0.y) / 5.5;

    const cp2x = p2.x - (p3.x - p1.x) / 5.5;
    const cp2y = p2.y - (p3.y - p1.y) / 5.5;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

// Hook animasi angka (Count-Up dari 0 ke target nominal real dengan durasi 1.8 detik)
function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrameId;
    const startValue = 0;
    const endValue = Number(target || 0);

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing curve: easeOutExpo (alami, halus, melambat di ujung)
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(startValue + (endValue - startValue) * easeOut));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [target, duration]);

  return count;
}

export default function DashboardView({
  members = [],
  cashbook = [],
  period = "September 2026",
  settings = {},
  currentUser,
  onOpenDues,
  onOpenAddCash,
  onOpenExport,
  onOpenPeriodPicker,
  hideHeader = false,
}) {
  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  // Kalkulasi Finansial Iuran
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

  // Saldo Kas Cabang
  const totalCashIn = cashbook.filter((c) => c.type === "in").reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalCashOut = cashbook.filter((c) => c.type === "out").reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const currentBalance = totalCashIn - totalCashOut;

  // Breakdown 4 Pos Iuran
  const posPusatTarget = members.reduce((sum, m) => sum + Number(m.pusat || 0), 0);
  const posPusatCollected = paidMembers.reduce((sum, m) => sum + Number(m.pusat || 0), 0);
  const posPusatPct = posPusatTarget > 0 ? Math.round((posPusatCollected / posPusatTarget) * 100) : 0;

  const posDaerahTarget = members.reduce((sum, m) => sum + Number(m.daerah || 0), 0);
  const posDaerahCollected = paidMembers.reduce((sum, m) => sum + Number(m.daerah || 0), 0);
  const posDaerahPct = posDaerahTarget > 0 ? Math.round((posDaerahCollected / posDaerahTarget) * 100) : 0;

  const posCabangTarget = members.reduce((sum, m) => sum + Number(m.cabang || 0), 0);
  const posCabangCollected = paidMembers.reduce((sum, m) => sum + Number(m.cabang || 0), 0);
  const posCabangPct = posCabangTarget > 0 ? Math.round((posCabangCollected / posCabangTarget) * 100) : 0;

  const posTourTarget = members.reduce((sum, m) => sum + Number(m.tournamen || 0), 0);
  const posTourCollected = paidMembers.reduce((sum, m) => sum + Number(m.tournamen || 0), 0);
  const posTourPct = posTourTarget > 0 ? Math.round((posTourCollected / posTourTarget) * 100) : 0;

  const [hoveredCategory, setHoveredCategory] = useState(null);
  const hasCashbook = Array.isArray(cashbook) && cashbook.length > 0;
  const hasRightColumn = hasCashbook;

  // Animasi Count-Up dari 0 ke nominal real (Durasi 1.8 detik)
  const animatedCollected = useCountUp(totalCollected, 1800);
  const animatedCashOut = useCountUp(totalCashOut, 1800);
  const animatedBalance = useCountUp(currentBalance, 1800);
  const animatedPercent = useCountUp(percentageCollected, 1800);

  // State untuk Kartu Analitik Kas Bulanan
  const ALL_MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  const periodParts = (period || "Agustus 2026").trim().split(" ");
  const currentMonthName = periodParts[0] || "Agustus";
  const targetYear = periodParts[1] || "2026";
  const activeMonthIdx = Math.max(0, ALL_MONTHS.indexOf(currentMonthName));

  const [selectedPointIdx, setSelectedPointIdx] = useState(activeMonthIdx !== -1 ? activeMonthIdx : 8);
  const [hoveredPointIdx, setHoveredPointIdx] = useState(null);
  const [visibleLines, setVisibleLines] = useState({
    balance: true,
    inflows: true,
    outflows: true,
  });

  const toggleLine = (key) => {
    setVisibleLines((prev) => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (activeCount === 1 && prev[key]) {
        return prev;
      }
      return { ...prev, [key]: !prev[key] };
    });
  };

  useEffect(() => {
    if (activeMonthIdx !== -1) {
      setSelectedPointIdx(activeMonthIdx);
      setHoveredPointIdx(null);
    }
  }, [activeMonthIdx, period]);

  // Kalkulasi data bulanan riil tahun berjalan dari cashbook dan rekap iuran
  const realMonthlyData = [];
  let cumulativeBal = 0;

  // Cek saldo awal sebelum tahun berjalan (jika ada)
  const priorEntries = (cashbook || []).filter((item) => {
    const d = item?.date || "";
    return d && d < `${targetYear}-01-01`;
  });
  cumulativeBal = priorEntries.reduce(
    (sum, e) => sum + (e.type === "in" ? Number(e.amount || 0) : -Number(e.amount || 0)),
    0
  );
  if (cumulativeBal < 0) cumulativeBal = 0;

  for (let mIdx = 0; mIdx < ALL_MONTHS.length; mIdx++) {
    const mName = ALL_MONTHS[mIdx];
    const monthNum = String(mIdx + 1).padStart(2, "0");
    const monthPrefix = `${targetYear}-${monthNum}`;

    const monthEntries = (cashbook || []).filter((item) => {
      const itemPeriod = (item?.period || "").toLowerCase();
      const itemDate = item?.date || "";
      if (itemPeriod) {
        return itemPeriod.includes(mName.toLowerCase()) && itemPeriod.includes(targetYear);
      }
      return itemDate.startsWith(monthPrefix);
    });

    let mIn = monthEntries
      .filter((e) => e.type === "in")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    let mOut = monthEntries
      .filter((e) => e.type === "out")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Jika bulan aktif adalah periode saat ini dan belum ada di cashbook, masukkan data penerimaan iuran riil
    if (mIdx === activeMonthIdx) {
      if (mIn === 0 && totalCollected > 0) mIn = totalCollected;
    }

    cumulativeBal += (mIn - mOut);
    const displayBalance = Math.max(0, cumulativeBal);

    const prevBal = mIdx > 0 ? realMonthlyData[mIdx - 1].balance : 0;
    const diff = displayBalance - prevBal;
    let growth = "0%";
    if (prevBal > 0) {
      const pct = ((diff / prevBal) * 100).toFixed(1);
      growth = `${diff >= 0 ? "+" : ""}${pct}%`;
    } else if (diff > 0) {
      growth = "+100%";
    } else {
      growth = "0%";
    }

    realMonthlyData.push({
      label: SHORT_MONTHS[mIdx],
      fullMonth: mName,
      periodTitle: `${mName} ${targetYear}`,
      inflows: mIn,
      outflows: mOut,
      balance: displayBalance,
      growth,
      isCurrent: mIdx === activeMonthIdx,
      hasData: monthEntries.length > 0 || (mIdx === activeMonthIdx && totalCollected > 0),
    });
  }

  const activeIdx = Math.min(
    hoveredPointIdx !== null ? hoveredPointIdx : selectedPointIdx,
    realMonthlyData.length - 1
  );
  const activePointData = realMonthlyData[activeIdx] || realMonthlyData[0];
  const animatedChartBalance = useCountUp(activePointData?.balance, 1800);

  // Sinkronisasi dinamis: Donut card mengikuti bulan yang sedang disorot/dipilih pada grafik tren
  const inspectedPeriod = activePointData?.periodTitle || period;
  const isCurrentActivePeriod = inspectedPeriod === period;

  const [cachedPeriodMembers, setCachedPeriodMembers] = useState({});

  useEffect(() => {
    if (!inspectedPeriod || inspectedPeriod === period) return;
    if (cachedPeriodMembers[inspectedPeriod]) return;

    let isMounted = true;
    const targetSatker = currentUser?.satker || "Pengadilan Agama Gunung Sugih";
    fetchMembersByPeriod(inspectedPeriod, targetSatker)
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setCachedPeriodMembers((prev) => ({
            ...prev,
            [inspectedPeriod]: data,
          }));
        }
      })
      .catch((err) => {
        console.warn(`[DashboardView] Error fetching members for ${inspectedPeriod}:`, err);
      });

    return () => {
      isMounted = false;
    };
  }, [inspectedPeriod, period, currentUser?.satker, cachedPeriodMembers]);

  let inspectedMembers = isCurrentActivePeriod
    ? members
    : cachedPeriodMembers[inspectedPeriod];

  // Fallback: Jika belum ada rekap khusus untuk bulan ini, gunakan master anggota
  // TETAP simpan nominal tagihan riil dari master (jangan di-nol-kan!) agar target grup tetap akurat
  if (!inspectedMembers || inspectedMembers.length === 0) {
    if (Array.isArray(members) && members.length > 0) {
      inspectedMembers = members.map((m) => ({
        ...m,
        paid: false,
      }));
    } else {
      inspectedMembers = [];
    }
  }

  const donutTotalTarget = inspectedMembers.reduce(
    (sum, m) =>
      sum +
      (Number(m.pusat || 0) +
        Number(m.daerah || 0) +
        Number(m.cabang || 0) +
        Number(m.tournamen || 0)),
    0
  );
  const donutPaidMembers = inspectedMembers.filter((m) => m.paid);
  const donutTotalCollected = donutPaidMembers.reduce(
    (sum, m) =>
      sum +
      (Number(m.pusat || 0) +
        Number(m.daerah || 0) +
        Number(m.cabang || 0) +
        Number(m.tournamen || 0)),
    0
  );
  const donutPctCollected =
    donutTotalTarget > 0 ? ((donutTotalCollected / donutTotalTarget) * 100).toFixed(1) : "0.0";
  const donutTotalMembers = inspectedMembers.length;
  const animatedDonutTarget = useCountUp(donutTotalTarget, 1800);

  const calcDonutUnitStats = (catName) => {
    const unitMembers = inspectedMembers.filter((m) => {
      if (catName === "Staf") {
        return (
          m.category === "Staf" ||
          m.category === "Staf / PPNPN" ||
          String(m.category || "").toLowerCase().includes("staf") ||
          String(m.category || "").toLowerCase().includes("ppnpn")
        );
      }
      return m.category === catName;
    });

    const count = unitMembers.length;
    const sharePct = donutTotalMembers > 0 ? Math.round((count / donutTotalMembers) * 100) : 0;
    const paidCount = unitMembers.filter((m) => m.paid).length;
    const totalIuran = unitMembers.reduce(
      (sum, m) =>
        sum +
        (Number(m.pusat || 0) +
          Number(m.daerah || 0) +
          Number(m.cabang || 0) +
          Number(m.tournamen || 0)),
      0
    );
    const collectedIuran = unitMembers
      .filter((m) => m.paid)
      .reduce(
        (sum, m) =>
          sum +
          (Number(m.pusat || 0) +
            Number(m.daerah || 0) +
            Number(m.cabang || 0) +
            Number(m.tournamen || 0)),
        0
      );

    return {
      count,
      sharePct,
      paidCount,
      totalIuran,
      collectedIuran,
    };
  };

  const donutCategoryConfig = [
    {
      key: "Hakim",
      title: "Hakim",
      stats: calcDonutUnitStats("Hakim"),
      icon: Scale,
      color: "#10b981",
      bgColor: "rgba(6, 78, 59, 0.1)",
      borderColor: "rgba(6, 78, 59, 0.22)",
      desc: "Hakim Tingkat Pertama",
    },
    {
      key: "Kepaniteraan",
      title: "Kepaniteraan",
      stats: calcDonutUnitStats("Kepaniteraan"),
      icon: BookOpen,
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.1)",
      borderColor: "rgba(16, 185, 129, 0.22)",
      desc: "Panitera & PP",
    },
    {
      key: "Kesekretariatan",
      title: "Kesekretariatan",
      stats: calcDonutUnitStats("Kesekretariatan"),
      icon: Building2,
      color: "#06b6d4",
      bgColor: "rgba(6, 182, 212, 0.1)",
      borderColor: "rgba(6, 182, 212, 0.22)",
      desc: "Kesekretariatan & Subbag",
    },
    {
      key: "Staf",
      title: "Staf / PPNPN",
      stats: calcDonutUnitStats("Staf"),
      icon: Users,
      color: "#eab308",
      bgColor: "rgba(234, 179, 8, 0.12)",
      borderColor: "rgba(234, 179, 8, 0.25)",
      desc: "Pelaksana & PPNPN",
    },
  ];

  // Skala sumbu Y dinamis berbasis nominal riil Rupiah (3 Garis: Saldo Kas, Uang Masuk, Pengeluaran)
  const anyVisible = visibleLines.balance || visibleLines.inflows || visibleLines.outflows;
  const maxVal = Math.max(
    ...realMonthlyData.map((d) =>
      anyVisible
        ? Math.max(
            visibleLines.balance ? (d.balance || 0) : 0,
            visibleLines.inflows ? (d.inflows || 0) : 0,
            visibleLines.outflows ? (d.outflows || 0) : 0
          )
        : Math.max(d.balance || 0, d.inflows || 0, d.outflows || 0)
    ),
    1000000
  );
  const step = maxVal > 30000000 ? 10000000 : maxVal > 15000000 ? 5000000 : 2000000;
  const yMax = Math.max(step * 4, Math.ceil((maxVal * 1.25) / step) * step);

  const formatJuta = (val) => {
    if (val === 0) return "0";
    const jt = val / 1000000;
    return `${jt % 1 === 0 ? jt : jt.toFixed(1)} Jt`;
  };

  const yTicks = [
    { label: formatJuta(yMax), y: 28 },
    { label: formatJuta(yMax * 0.75), y: 68 },
    { label: formatJuta(yMax * 0.50), y: 108 },
    { label: formatJuta(yMax * 0.25), y: 148 },
    { label: "0", y: 190 },
  ];

  const getYCoord = (val) => {
    const clamped = Math.max(0, Math.min(yMax, val || 0));
    return 190 - (clamped / yMax) * 162;
  };

  const svgWidth = 620;
  const svgHeight = 225;
  const leftPad = 44;
  const rightPad = 20;
  const baselineY = 190;
  const usableWidth = svgWidth - leftPad - rightPad;

  // Koordinat titik kurva untuk masing-masing garis
  const chartPointsBalance = realMonthlyData.map((d, i) => {
    const x = leftPad + (i * usableWidth) / (realMonthlyData.length - 1);
    const y = getYCoord(d.balance);
    return { x, y, ...d };
  });

  const chartPointsInflow = realMonthlyData.map((d, i) => {
    const x = leftPad + (i * usableWidth) / (realMonthlyData.length - 1);
    const y = getYCoord(d.inflows);
    return { x, y, ...d };
  });

  const chartPointsOutflow = realMonthlyData.map((d, i) => {
    const x = leftPad + (i * usableWidth) / (realMonthlyData.length - 1);
    const y = getYCoord(d.outflows);
    return { x, y, ...d };
  });

  // Kurva bezier Catmull-Rom untuk 3 garis
  const smoothCurveBalance = getSmoothPath(chartPointsBalance);
  const smoothCurveInflow = getSmoothPath(chartPointsInflow);
  const smoothCurveOutflow = getSmoothPath(chartPointsOutflow);

  const areaFillBalance = `${smoothCurveBalance} L ${chartPointsBalance[chartPointsBalance.length - 1].x} ${baselineY} L ${chartPointsBalance[0].x} ${baselineY} Z`;
  const areaFillInflow = `${smoothCurveInflow} L ${chartPointsInflow[chartPointsInflow.length - 1].x} ${baselineY} L ${chartPointsInflow[0].x} ${baselineY} Z`;
  const areaFillOutflow = `${smoothCurveOutflow} L ${chartPointsOutflow[chartPointsOutflow.length - 1].x} ${baselineY} L ${chartPointsOutflow[0].x} ${baselineY} Z`;

  const pBalance = chartPointsBalance[activeIdx] || chartPointsBalance[0];
  const pInflow = chartPointsInflow[activeIdx] || chartPointsInflow[0];
  const pOutflow = chartPointsOutflow[activeIdx] || chartPointsOutflow[0];
  const pAnchor = pBalance;

  // Posisi tooltip vertikal dinamis agar tidak terpotong ke atas
  const tooltipY = visibleLines.balance
    ? pBalance.y
    : visibleLines.inflows
    ? pInflow.y
    : visibleLines.outflows
    ? pOutflow.y
    : 100;
  const isNearTop = tooltipY < 85;

  const renderCashflowCard = () => (
    <div
      className="stitch-card"
      style={{
        position: "relative",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        borderRadius: "16px",
        padding: "20px 22px 18px",
        boxShadow: "var(--shadow-sm)",
        marginBottom: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Header Bar dengan Legend Filter 3 Kategori */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "12px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: "5px",
            }}
          >
            Tren Kas Bulanan (Tahun {targetYear})
          </div>

          {/* Big Amount & Growth Badge */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
            <div
              className="font-mono-num"
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.5px",
                lineHeight: 1.1,
              }}
            >
              {formatRupiah(animatedChartBalance)}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: activePointData.growth.startsWith("+")
                  ? "#dcfce7"
                  : activePointData.growth.startsWith("-")
                  ? "#fee2e2"
                  : "var(--bg-app)",
                color: activePointData.growth.startsWith("+")
                  ? "#16a34a"
                  : activePointData.growth.startsWith("-")
                  ? "#dc2626"
                  : "var(--text-muted)",
                border: `1px solid ${
                  activePointData.growth.startsWith("+")
                    ? "#86efac"
                    : activePointData.growth.startsWith("-")
                    ? "#fca5a5"
                    : "var(--border-light)"
                }`,
                padding: "3px 10px",
                borderRadius: "99px",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {activePointData.growth.startsWith("+") && <ArrowUpRight size={14} />}
              <span>{activePointData.growth}</span>
            </div>
          </div>
        </div>

        {/* Legend / Filter Toggles (Saldo Kas - Uang Masuk - Pengeluaran) */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {/* Saldo Kas Toggle (Biru) */}
          <button
            type="button"
            onClick={() => toggleLine("balance")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "99px",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: visibleLines.balance
                ? "1.5px solid #3b82f6"
                : "1px dashed var(--border-light, #cbd5e1)",
              background: visibleLines.balance ? "rgba(59, 130, 246, 0.12)" : "transparent",
              color: visibleLines.balance ? "#1d4ed8" : "var(--text-muted)",
              opacity: visibleLines.balance ? 1 : 0.5,
            }}
            title="Klik untuk tampilkan/sembunyikan Saldo Kas"
          >
            <span
              style={{
                width: "12px",
                height: "3px",
                borderRadius: "2px",
                background: visibleLines.balance ? "#2563eb" : "#94a3b8",
                display: "inline-block",
              }}
            />
            <span>Saldo Kas</span>
          </button>

          {/* Uang Masuk Toggle (Hijau) */}
          <button
            type="button"
            onClick={() => toggleLine("inflows")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "99px",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: visibleLines.inflows
                ? "1.5px solid #22c55e"
                : "1px dashed var(--border-light, #cbd5e1)",
              background: visibleLines.inflows ? "rgba(34, 197, 94, 0.12)" : "transparent",
              color: visibleLines.inflows ? "#15803d" : "var(--text-muted)",
              opacity: visibleLines.inflows ? 1 : 0.5,
            }}
            title="Klik untuk tampilkan/sembunyikan Uang Masuk"
          >
            <span
              style={{
                width: "12px",
                height: "3px",
                borderRadius: "2px",
                background: visibleLines.inflows ? "#16a34a" : "#94a3b8",
                display: "inline-block",
              }}
            />
            <span>Uang Masuk</span>
          </button>

          {/* Pengeluaran Toggle (Merah) */}
          <button
            type="button"
            onClick={() => toggleLine("outflows")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "99px",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: visibleLines.outflows
                ? "1.5px solid #ef4444"
                : "1px dashed var(--border-light, #cbd5e1)",
              background: visibleLines.outflows ? "rgba(239, 68, 68, 0.12)" : "transparent",
              color: visibleLines.outflows ? "#b91c1c" : "var(--text-muted)",
              opacity: visibleLines.outflows ? 1 : 0.5,
            }}
            title="Klik untuk tampilkan/sembunyikan Pengeluaran"
          >
            <span
              style={{
                width: "12px",
                height: "3px",
                borderRadius: "2px",
                background: visibleLines.outflows ? "#dc2626" : "#94a3b8",
                display: "inline-block",
              }}
            />
            <span>Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div style={{ position: "relative", width: "100%", marginTop: "8px" }}>
        {/* Floating Tooltip Card */}
        <div
          style={{
            position: "absolute",
            left: `${(pAnchor.x / svgWidth) * 100}%`,
            top: `${(tooltipY / svgHeight) * 100}%`,
            transform: isNearTop
              ? activeIdx >= chartPointsBalance.length - 3
                ? "translate(-88%, 15px)"
                : activeIdx <= 2
                ? "translate(-12%, 15px)"
                : "translate(-50%, 15px)"
              : activeIdx >= chartPointsBalance.length - 3
              ? "translate(-88%, -115%)"
              : activeIdx <= 2
              ? "translate(-12%, -115%)"
              : "translate(-50%, -115%)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-light)",
            borderRadius: "12px",
            padding: "10px 14px",
            boxShadow: "0 12px 28px -4px rgba(0, 0, 0, 0.16), 0 4px 8px -2px rgba(0, 0, 0, 0.06)",
            pointerEvents: "none",
            minWidth: "195px",
            zIndex: 15,
            transition: "left 0.2s cubic-bezier(0.16, 1, 0.3, 1), top 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "8px",
              paddingBottom: "5px",
              borderBottom: "1px solid var(--border-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{activePointData.periodTitle}</span>
            {activePointData.isCurrent && (
              <span
                style={{
                  fontSize: "9.5px",
                  padding: "1px 6px",
                  borderRadius: "99px",
                  background: "#dcfce7",
                  color: "#16a34a",
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                Aktif
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11.5px" }}>
            {/* Saldo Kas */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                opacity: visibleLines.balance ? 1 : 0.45,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#2563eb",
                    display: "inline-block",
                  }}
                />
                <span style={{ color: "var(--text-muted)" }}>Saldo Kas</span>
              </div>
              <strong className="font-mono-num" style={{ color: "#2563eb", fontSize: "12px" }}>
                {formatRupiah(activePointData.balance)}
              </strong>
            </div>

            {/* Uang Masuk */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                opacity: visibleLines.inflows ? 1 : 0.45,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#16a34a",
                    display: "inline-block",
                  }}
                />
                <span style={{ color: "var(--text-muted)" }}>Uang Masuk</span>
              </div>
              <span className="font-mono-num" style={{ color: "#16a34a", fontWeight: 700 }}>
                {formatRupiah(activePointData.inflows)}
              </span>
            </div>

            {/* Pengeluaran */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                opacity: visibleLines.outflows ? 1 : 0.45,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#dc2626",
                    display: "inline-block",
                  }}
                />
                <span style={{ color: "var(--text-muted)" }}>Pengeluaran</span>
              </div>
              <span className="font-mono-num" style={{ color: "#dc2626", fontWeight: 700 }}>
                {formatRupiah(activePointData.outflows)}
              </span>
            </div>
          </div>
        </div>

        {/* The SVG Smooth Wave Chart (3 Garis: Uang Masuk, Pengeluaran, Saldo Kas) */}
        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg
            key={`chart-svg-${targetYear}-${currentUser?.satker || ""}`}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: "100%", minWidth: "400px", height: "auto", display: "block" }}
          >
            <defs>
              <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                <stop offset="65%" stopColor="#2563eb" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16a34a" stopOpacity="0.18" />
                <stop offset="65%" stopColor="#16a34a" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc2626" stopOpacity="0.18" />
                <stop offset="65%" stopColor="#dc2626" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
              </linearGradient>

              {/* Clip-Path Reveal dari Kiri ke Kanan dengan Durasi 1.8 Detik */}
              <clipPath id="chartRevealFromLeft">
                <rect x="0" y="0" width="0" height={svgHeight}>
                  <animate
                    attributeName="width"
                    from="0"
                    to={svgWidth}
                    dur="1.8s"
                    fill="freeze"
                    calcMode="spline"
                    keyTimes="0; 1"
                    keySplines="0.25 0.7 0.1 1"
                  />
                </rect>
              </clipPath>
            </defs>

            {/* Horizontal Dashed Grid Lines & Y Labels */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <text
                  x="38"
                  y={tick.y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="11"
                  fontWeight="500"
                  fontFamily="inherit"
                >
                  {tick.label}
                </text>
                <line
                  x1={leftPad - 5}
                  y1={tick.y}
                  x2={svgWidth - rightPad}
                  y2={tick.y}
                  stroke="rgba(148, 163, 184, 0.22)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              </g>
            ))}

            {/* Elemen Grafik: Area Fill, Kurva Garis, dan Active Point Dots Muncul Perlahan dari Kiri (1.8 Detik) */}
            <g clipPath="url(#chartRevealFromLeft)" className="chart-reveal-from-left">
              {/* Area Fill Halus untuk masing-masing kurva aktif */}
              {visibleLines.outflows && <path d={areaFillOutflow} fill="url(#outflowGrad)" />}
              {visibleLines.inflows && <path d={areaFillInflow} fill="url(#inflowGrad)" />}
              {visibleLines.balance && <path d={areaFillBalance} fill="url(#balanceGrad)" />}

              {/* 1. Kurva Saldo Kas (Biru) */}
              {visibleLines.balance && (
                <path
                  d={smoothCurveBalance}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* 2. Kurva Uang Masuk (Hijau) */}
              {visibleLines.inflows && (
                <path
                  d={smoothCurveInflow}
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* 3. Kurva Pengeluaran (Merah) */}
              {visibleLines.outflows && (
                <path
                  d={smoothCurveOutflow}
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Vertical Guide Line */}
              <line
                x1={pAnchor.x}
                y1={24}
                x2={pAnchor.x}
                y2={baselineY}
                stroke="#94a3b8"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />

              {/* Active Point Dots pada masing-masing kurva */}
              {visibleLines.balance && (
                <g>
                  <circle cx={pBalance.x} cy={pBalance.y} r="7" fill="rgba(37, 99, 235, 0.25)" />
                  <circle cx={pBalance.x} cy={pBalance.y} r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
                </g>
              )}

              {visibleLines.inflows && (
                <g>
                  <circle cx={pInflow.x} cy={pInflow.y} r="7" fill="rgba(22, 163, 74, 0.25)" />
                  <circle cx={pInflow.x} cy={pInflow.y} r="4.5" fill="#16a34a" stroke="#ffffff" strokeWidth="2.5" />
                </g>
              )}

              {visibleLines.outflows && (
                <g>
                  <circle cx={pOutflow.x} cy={pOutflow.y} r="7" fill="rgba(220, 38, 38, 0.25)" />
                  <circle cx={pOutflow.x} cy={pOutflow.y} r="4.5" fill="#dc2626" stroke="#ffffff" strokeWidth="2.5" />
                </g>
              )}
            </g>

            {/* Invisible Hover Hotspots for Smooth Hover Interactions */}
            {chartPointsBalance.map((p, idx) => (
              <rect
                key={idx}
                x={p.x - usableWidth / (chartPointsBalance.length * 2)}
                y={20}
                width={usableWidth / chartPointsBalance.length}
                height={baselineY - 20}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredPointIdx(idx)}
                onMouseLeave={() => setHoveredPointIdx(null)}
                onClick={() => setSelectedPointIdx(idx)}
              />
            ))}
          </svg>
        </div>

        {/* Bottom X-Axis Months (Jan - Des) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingLeft: `${(leftPad / svgWidth) * 100}%`,
            paddingRight: `${(rightPad / svgWidth) * 100}%`,
            marginTop: "6px",
          }}
        >
          {realMonthlyData.map((d, idx) => {
            const isSelected = activeIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedPointIdx(idx);
                  setHoveredPointIdx(null);
                }}
                onMouseEnter={() => setHoveredPointIdx(idx)}
                onMouseLeave={() => setHoveredPointIdx(null)}
                style={{
                  background: isSelected ? "#dcfce7" : "transparent",
                  color: isSelected ? "#0f5132" : "var(--text-muted)",
                  border: isSelected ? "1px solid #86efac" : "1px solid transparent",
                  borderRadius: "7px",
                  padding: "2px 6px",
                  fontSize: "11px",
                  fontWeight: isSelected ? 800 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  outline: "none",
                }}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderRealisasiCard = () => (
    <div
      className="stitch-card"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        margin: 0,
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp size={18} color="#0f5132" />
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Realisasi Penerimaan Iuran</h3>
          </div>
        </div>

        {/* Dual Progress Bar */}
        <div style={{ width: "100%", background: "var(--border-light)", height: "8px", borderRadius: "99px", overflow: "hidden", marginBottom: "8px" }}>
          <div style={{ width: `${percentageCollected}%`, background: "#0f5132", height: "100%", transition: "width 400ms" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>
          <span>Terkumpul: <strong style={{ color: "#0f5132" }}>{formatRupiah(totalCollected)}</strong></span>
          <span>Kekurangan: <strong style={{ color: "#d97706" }}>{formatRupiah(totalUnpaid)}</strong></span>
        </div>

        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
          Breakdown Alokasi 4 Pos Iuran
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", flex: 1 }}>
        {/* Pusat */}
        <div style={{ background: "var(--bg-app)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Pusat</span>
            <span style={{ color: "#16a34a", fontWeight: 700 }}>{posPusatPct}%</span>
          </div>
          <div className="font-mono-num" style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
            {formatRupiah(posPusatCollected)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Target: {formatRupiah(posPusatTarget)}</div>
        </div>

        {/* Daerah */}
        <div style={{ background: "var(--bg-app)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Daerah</span>
            <span style={{ color: "#16a34a", fontWeight: 700 }}>{posDaerahPct}%</span>
          </div>
          <div className="font-mono-num" style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
            {formatRupiah(posDaerahCollected)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Target: {formatRupiah(posDaerahTarget)}</div>
        </div>

        {/* Cabang */}
        <div style={{ background: "var(--bg-app)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Cabang</span>
            <span style={{ color: posCabangPct >= 80 ? "#16a34a" : "#d97706", fontWeight: 700 }}>{posCabangPct}%</span>
          </div>
          <div className="font-mono-num" style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
            {formatRupiah(posCabangCollected)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Target: {formatRupiah(posCabangTarget)}</div>
        </div>

        {/* Turnamen */}
        <div style={{ background: "var(--bg-app)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Turnamen</span>
            <span style={{ color: posTourPct > 0 ? (posTourPct >= 80 ? "#16a34a" : "#d97706") : "var(--text-muted)", fontWeight: 700 }}>
              {posTourPct > 0 ? `${posTourPct}%` : "Belum Ditagih"}
            </span>
          </div>
          <div className="font-mono-num" style={{ fontSize: "14px", fontWeight: 700, color: posTourPct > 0 ? "var(--text-primary)" : "var(--text-muted)", marginTop: "4px" }}>
            {formatRupiah(posTourCollected)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Target: {formatRupiah(posTourTarget)}</div>
        </div>
      </div>
    </div>
  );

  const renderDonutDistribusiCard = () => {
    const donutBasis = donutTotalTarget > 0 ? donutTotalTarget : (donutTotalMembers > 0 ? donutTotalMembers : 1);
    const r = 64;
    const strokeW = 13;
    const visualGap = 5;
    const C = 2 * Math.PI * r; // ≈ 402.12
    const totalReduction = strokeW + visualGap;

    let cumulativeOffset = 0;
    const donutSegments = donutCategoryConfig.map((cat) => {
      const val = donutTotalTarget > 0 ? cat.stats.totalIuran : cat.stats.count;
      const ratio = Math.max(0, val / donutBasis);
      const arcLen = ratio * C;
      const visibleLen = Math.max(0.1, arcLen - totalReduction);
      const strokeDasharray = `${visibleLen.toFixed(2)} ${(C - visibleLen).toFixed(2)}`;
      const strokeDashoffset = -(cumulativeOffset + totalReduction / 2);
      cumulativeOffset += arcLen;

      return {
        ...cat,
        val,
        ratio,
        visibleLen,
        strokeDasharray,
        strokeDashoffset,
      };
    });

    const activeHoveredCat = donutCategoryConfig.find((c) => c.key === hoveredCategory);

    return (
      <div
        className="stitch-card"
        style={{
          position: "relative",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-light)",
          borderRadius: "16px",
          padding: "20px 22px 18px",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          gap: "14px",
        }}
      >
        {/* Header Widget yang Mengikuti Bulan yang Disorot di Grafik Tren */}
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: "3px",
            }}
          >
            Distribusi Iuran
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Kategori Anggota • {activePointData.periodTitle}
          </h3>
        </div>

        {/* Donut Chart Bersegmen dengan Info di Tengah */}
        <div
          style={{
            position: "relative",
            width: "172px",
            height: "172px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg viewBox="0 0 172 172" width="172" height="172" style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
            {donutSegments.map((seg) => {
              const isHovered = hoveredCategory === seg.key;
              const hasHover = hoveredCategory !== null;
              return (
                <circle
                  key={seg.key}
                  cx="86"
                  cy="86"
                  r={r}
                  fill="none"
                  stroke={donutTotalTarget > 0 ? seg.color : (isHovered ? seg.color : "rgba(148, 163, 184, 0.35)")}
                  strokeWidth={isHovered ? 16 : strokeW}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    opacity: hasHover && !isHovered ? 0.35 : 1,
                    transition: "all 250ms ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => setHoveredCategory(seg.key)}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
              );
            })}
          </svg>

          {/* Konten di Pusat Donut */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none",
              width: "106px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {activeHoveredCat ? activeHoveredCat.title : "Total Iuran"}
            </div>
            <div
              className="font-mono-num"
              style={{
                fontSize: activeHoveredCat ? "14.5px" : "15px",
                fontWeight: 800,
                color: activeHoveredCat ? activeHoveredCat.color : "var(--text-primary)",
                lineHeight: 1.15,
                marginTop: "2px",
                letterSpacing: "-0.3px",
                whiteSpace: "nowrap",
              }}
            >
              {activeHoveredCat
                ? formatRupiah(activeHoveredCat.stats.totalIuran)
                : formatRupiah(animatedDonutTarget)}
            </div>
            <div style={{ marginTop: "4px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "1px 8px",
                  borderRadius: "99px",
                  background: activeHoveredCat ? activeHoveredCat.bgColor : "#dcfce7",
                  color: activeHoveredCat ? activeHoveredCat.color : "#16a34a",
                }}
              >
                <Users size={10} />
                <span>
                  {activeHoveredCat
                    ? `${activeHoveredCat.stats.count} Pegawai`
                    : `${donutTotalMembers} Pegawai`}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Daftar 4 Kategori (Hakim, Kepaniteraan, Kesekretariatan, Staf) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {donutCategoryConfig.map((cat) => {
            const isHovered = hoveredCategory === cat.key;
            return (
              <div
                key={cat.key}
                onMouseEnter={() => setHoveredCategory(cat.key)}
                onMouseLeave={() => setHoveredCategory(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  background: isHovered ? cat.bgColor : "var(--bg-app)",
                  border: `1px solid ${isHovered ? cat.borderColor : "var(--border-light)"}`,
                  transition: "all 150ms ease",
                  cursor: "pointer",
                }}
              >
                {/* Kiri: Ikon Squircle + Judul & Status Lunas */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "9px",
                      background: cat.bgColor,
                      color: cat.color,
                      border: `1px solid ${cat.borderColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <cat.icon size={17} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {cat.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
                      {cat.stats.paidCount}/{cat.stats.count} Lunas
                    </div>
                  </div>
                </div>

                {/* Kanan: Nominal Total Iuran Kategori & Total Pegawai */}
                <div style={{ textAlign: "right" }}>
                  <div className="font-mono-num" style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--text-primary)" }}>
                    {formatRupiah(cat.stats.totalIuran)}
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginTop: "1px" }}>
                    {cat.stats.count} Pegawai
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMutasiCard = () => (
    <div
      className="stitch-card"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        margin: 0,
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Receipt size={18} color="#0f5132" />
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Mutasi Kas Terakhir</h3>
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "99px",
              background: "var(--bg-app)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-light)",
            }}
          >
            Real-time
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, justifyContent: "space-between" }}>
        {cashbook.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: "var(--text-muted)", fontSize: "13px" }}>
            Belum ada transaksi kas tercatat
          </div>
        ) : (
          cashbook.slice(0, 4).map((entry) => (
            <div
              key={entry.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "var(--bg-app)",
                border: "1px solid var(--border-light)",
                gap: "10px",
                flex: 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: entry.type === "in" ? "#dcfce7" : "#fee2e2",
                    color: entry.type === "in" ? "#16a34a" : "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {entry.type === "in" ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={entry.description}
                  >
                    {entry.description}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {entry.date} • {entry.category}
                  </div>
                </div>
              </div>

              <span
                className="font-mono-num"
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: entry.type === "in" ? "#16a34a" : "#dc2626",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {entry.type === "in" ? "+" : "-"} {formatRupiah(entry.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="stitch-dash-container">
      {/* 1. Header Banner Dashboard */}
      {!hideHeader && (
        <div className="stitch-dash-header widen-stagger widen-delay-1">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>Dashboard Utama</h2>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "99px",
                  background: "#0b3b2b",
                  color: "#ffffff",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Eksekutif
              </span>
            </div>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
              Ikhtisar perbendaharaan dan kepatuhan iuran PTWP {settings.institution || "Pengadilan Agama Gunung Sugih"}
            </p>
          </div>
        </div>
      )}

      {/* 2. Kartu Metrik Dashboard (Iuran Terkumpul, Total Pengeluaran & Saldo Kas Cabang) */}
      <div className="stitch-dash-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {/* Card 1: Iuran Terkumpul */}
        <div className="stitch-card widen-stagger widen-delay-2">
          <div className="hairline-court"></div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Iuran Terkumpul
            </span>
          </div>
          <div className="font-mono-num" style={{ fontSize: "20px", fontWeight: 700, color: "var(--money-in)" }}>
            {formatRupiah(animatedCollected)}
          </div>
          <div style={{ width: "100%", background: "var(--border-light)", height: "6px", borderRadius: "99px", marginTop: "10px", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, animatedPercent))}%`,
                height: "100%",
                background: "var(--money-in)",
                borderRadius: "99px",
                transition: "width 1800ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>
        </div>

        {/* Card 2: Total Pengeluaran */}
        <div className="stitch-card widen-stagger widen-delay-3" style={{ position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#ef4444" }}></div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Pengeluaran
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}>
              {cashbook.filter((c) => c.type === "out").length} Belanja
            </span>
          </div>
          <div className="font-mono-num" style={{ fontSize: "20px", fontWeight: 700, color: "#ef4444" }}>
            {formatRupiah(animatedCashOut)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
            <Receipt size={14} color="#ef4444" />
            <span>Realisasi belanja kas operasional</span>
          </div>
        </div>

        {/* Card 3: Saldo Kas */}
        <div className="stitch-card widen-stagger widen-delay-4">
          <div className="hairline-gold"></div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Saldo Kas
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", background: "var(--money-gold-bg)", color: "var(--money-gold)" }}>
              Kas Aktif
            </span>
          </div>
          <div className="font-mono-num" style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
            {formatRupiah(animatedBalance)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "12px", color: "var(--text-muted)" }}>
            <Landmark size={14} />
            <span>{settings?.bank_holder || (currentUser?.satker ? `Rek. Kas Cabang ${currentUser.satker.replace("Pengadilan Agama ", "PA ").replace("Pengadilan Tinggi Agama ", "PTA ")}` : "Rek. Kas Cabang")}</span>
          </div>
        </div>
      </div>

      {/* 3. Hero Row: Grafik Tren Kas Bulanan & Donut Distribusi Kategori Berdampingan */}
      <div className="stitch-dash-chart-row">
        <div className="widen-stagger widen-delay-5">{renderCashflowCard()}</div>
        <div className="widen-stagger widen-delay-6">{renderDonutDistribusiCard()}</div>
      </div>

      {/* 4. Layout Realisasi 4 Pos Iuran & Mutasi Kas Terakhir */}
      {hasCashbook ? (
        <div className="stitch-two-col" style={{ marginBottom: "20px" }}>
          <div className="widen-stagger widen-delay-7">{renderRealisasiCard()}</div>
          <div className="widen-stagger widen-delay-8">{renderMutasiCard()}</div>
        </div>
      ) : (
        <div className="widen-stagger widen-delay-7" style={{ marginBottom: "20px" }}>
          {renderRealisasiCard()}
        </div>
      )}

      {/* 5. Banner Aksi Cepat Bendahara */}
      <div className="stitch-quick-bar widen-stagger widen-delay-8">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#eab308",
              color: "#062319",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Zap size={18} />
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700 }}>Aksi Cepat Bendahara</div>
            <div style={{ fontSize: "11px", color: "#91bfa9" }}>
              Tindakan operasional dan sinkronisasi kas
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenDues}
            style={{ background: "#0f5132", borderColor: "transparent" }}
          >
            <Table size={15} />
            <span>Buka Rekap Iuran Lengkap</span>
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={onOpenAddCash}
            style={{
              background: "#0f5132",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={15} color="#ffffff" />
            <span style={{ color: "#ffffff" }}>Catat Kas Baru</span>
          </button>

          <button
            type="button"
            className="btn btn-gold btn-sm"
            onClick={onOpenExport}
            style={{ background: "#eab308", color: "#062319", fontWeight: 700 }}
          >
            <Download size={15} />
            <span>Unduh Ringkasan (.xlsx)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
