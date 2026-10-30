"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { ALL_MONTHS } from "@/services/storageService";

export default function PeriodPickerModal({
  isOpen,
  onClose,
  currentPeriod = "September 2026",
  onSelectPeriod,
  periodsWithData = [],
  mode = "in", // "in" (Iuran Masuk) | "out" (Iuran Keluar / Realisasi Belanja)
}) {
  // Parse periode aktif saat ini
  const parseYearFromPeriod = (periodStr) => {
    if (!periodStr) return 2026;
    const parts = periodStr.trim().split(/\s+/);
    return parseInt(parts[1], 10) || 2026;
  };

  const [selectedYear, setSelectedYear] = useState(() => parseYearFromPeriod(currentPeriod));

  // Sinkronkan selectedYear setiap kali modal dibuka atau currentPeriod berubah
  useEffect(() => {
    if (isOpen) {
      setSelectedYear(parseYearFromPeriod(currentPeriod));
    }
  }, [isOpen, currentPeriod]);

  if (!isOpen) return null;

  const isExpenseMode = mode === "out";

  // Palette warna dinamis berdasarkan mode (Masuk = Hijau PTWP, Keluar = Merah Aksen Belanja)
  const theme = isExpenseMode
    ? {
        primary: "#dc2626",
        primaryHover: "#b91c1c",
        iconBg: "#fee2e2",
        iconColor: "#dc2626",
        badgeBg: "#fef2f2",
        badgeBorder: "#fca5a5",
        badgeDot: "#dc2626",
        badgeText: "#dc2626",
        badgeLabel: "Ada Belanja",
        activeBg: "#dc2626",
        activeBorder: "#b91c1c",
        activeText: "#ffffff",
        activeDot: "#fef08a",
        shadow: "rgba(220, 38, 38, 0.25)",
        footerBadgeBg: "#fee2e2",
        footerBadgeBorder: "#fecaca",
        footerBadgeColor: "#dc2626",
        title: "Pilih Periode Pengeluaran",
        subtitle: "Tersedia seluruh bulan & tahun anggaran",
      }
    : {
        primary: "#0f5132",
        primaryHover: "#0b3d26",
        iconBg: "#e8f5e9",
        iconColor: "#0f5132",
        badgeBg: "#f0fdf4",
        badgeBorder: "#86efac",
        badgeDot: "#16a34a",
        badgeText: "#0f5132",
        badgeLabel: "Ada Data",
        activeBg: "#0f5132",
        activeBorder: "#0f5132",
        activeText: "#ffffff",
        activeDot: "#fef08a",
        shadow: "rgba(15, 81, 50, 0.25)",
        footerBadgeBg: "#dcfce7",
        footerBadgeBorder: "#bbf7d0",
        footerBadgeColor: "#0f5132",
        title: "Pilih Periode Iuran",
        subtitle: "Tersedia seluruh bulan & tahun",
      };

  const months = ALL_MONTHS || [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // Daftar tahun lengkap dan simetris (2020 - 2035)
  const years = Array.from({ length: 16 }, (_, i) => 2020 + i);

  const handleSelectMonth = (monthName) => {
    const newPeriod = `${monthName} ${selectedYear}`;
    onSelectPeriod && onSelectPeriod(newPeriod);
    onClose && onClose();
  };

  const handleSetCurrentMonth = () => {
    const now = new Date();
    const currentMonthIndex = now.getMonth();
    const currentYr = now.getFullYear();
    const monthName = months[currentMonthIndex] || "Oktober";
    const newPeriod = `${monthName} ${currentYr}`;
    onSelectPeriod && onSelectPeriod(newPeriod);
    onClose && onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "var(--bg-surface, #ffffff)",
          borderRadius: "16px",
          padding: "22px 24px",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.25), 0 0 1px 1px rgba(0, 0, 0, 0.08)",
          border: "1px solid var(--border-light, #e2e8f0)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {/* 1. Header: Ikon, Judul, Subtitle & Tombol Tutup */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: theme.iconBg,
                color: theme.iconColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 200ms ease",
              }}
            >
              <Calendar size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0, lineHeight: 1.2 }}>
                {theme.title}
              </h3>
              <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary, #64748b)", margin: "4px 0 0 0", lineHeight: 1 }}>
                {theme.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Tutup dialog"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid var(--border-light, #e2e8f0)",
              background: "var(--bg-app, #f8fafc)",
              color: "var(--text-secondary, #64748b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 150ms ease",
              flexShrink: 0,
            }}
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* 2. Navigator Tahun (Simetris & Rapi) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-app, #f8fafc)",
            border: "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "10px",
            padding: "5px 8px",
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedYear((prev) => Math.max(2020, prev - 1))}
            disabled={selectedYear <= 2020}
            title="Tahun Sebelumnya"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              border: "1px solid var(--border-light, #e2e8f0)",
              background: "#ffffff",
              color: selectedYear <= 2020 ? "#cbd5e1" : theme.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: selectedYear <= 2020 ? "not-allowed" : "pointer",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
            }}
          >
            <ChevronLeft size={18} strokeWidth={2.2} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary, #64748b)" }}>
              Tahun:
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "17px",
                fontWeight: 800,
                color: theme.primary,
                cursor: "pointer",
                outline: "none",
                padding: "2px 4px",
                fontFamily: "inherit",
              }}
            >
              {years.map((y) => (
                <option key={y} value={y} style={{ color: "#0f172a", fontWeight: 600 }}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setSelectedYear((prev) => Math.min(2035, prev + 1))}
            disabled={selectedYear >= 2035}
            title="Tahun Berikutnya"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              border: "1px solid var(--border-light, #e2e8f0)",
              background: "#ffffff",
              color: selectedYear >= 2035 ? "#cbd5e1" : theme.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: selectedYear >= 2035 ? "not-allowed" : "pointer",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
            }}
          >
            <ChevronRight size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* 3. Grid 12 Bulan (Tinggi Tetap & 100% Simetris di Semua Kotak) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
          }}
        >
          {months.map((m) => {
            const periodString = `${m} ${selectedYear}`;
            const isSelected = periodString.toLowerCase() === currentPeriod.toLowerCase();
            const hasData = periodsWithData.some(
              (p) => p.toLowerCase() === periodString.toLowerCase()
            );

            return (
              <button
                key={m}
                type="button"
                onClick={() => handleSelectMonth(m)}
                style={{
                  height: "58px",
                  borderRadius: "10px",
                  border: isSelected
                    ? `2px solid ${theme.activeBorder}`
                    : hasData
                    ? `1.5px solid ${theme.badgeBorder}`
                    : "1px solid var(--border-light, #e2e8f0)",
                  background: isSelected
                    ? theme.activeBg
                    : hasData
                    ? theme.badgeBg
                    : "#ffffff",
                  color: isSelected
                    ? theme.activeText
                    : hasData
                    ? theme.badgeText
                    : "var(--text-primary, #0f172a)",
                  fontWeight: isSelected ? 800 : hasData ? 700 : 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px 4px",
                  transition: "all 150ms ease",
                  boxShadow: isSelected
                    ? `0 4px 12px ${theme.shadow}`
                    : "0 1px 2px rgba(0, 0, 0, 0.03)",
                }}
              >
                <span style={{ lineHeight: 1.2 }}>{m}</span>
                <span
                  style={{
                    height: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "3px",
                    fontSize: "10px",
                    fontWeight: 700,
                    lineHeight: 1,
                    visibility: hasData ? "visible" : "hidden",
                    color: isSelected ? theme.activeDot : theme.badgeText,
                  }}
                >
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: isSelected ? theme.activeDot : theme.badgeDot,
                      display: "inline-block",
                      marginRight: "4px",
                    }}
                  />
                  {theme.badgeLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* 4. Footer: Tombol Pintas & Label Periode Aktif */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid var(--border-light, #e2e8f0)",
            paddingTop: "14px",
            marginTop: "2px",
          }}
        >
          <button
            type="button"
            onClick={handleSetCurrentMonth}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#f1f5f9",
              color: theme.primary,
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            Bulan Ini
          </button>

          <div
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--text-secondary, #64748b)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>Aktif:</span>
            <span
              style={{
                fontWeight: 800,
                color: theme.footerBadgeColor,
                background: theme.footerBadgeBg,
                padding: "3px 9px",
                borderRadius: "6px",
                border: `1px solid ${theme.footerBadgeBorder}`,
              }}
            >
              {currentPeriod}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
