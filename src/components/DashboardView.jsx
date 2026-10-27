"use client";

import React from "react";
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
} from "lucide-react";

export default function DashboardView({
  members = [],
  cashbook = [],
  period = "September 2026",
  settings = {},
  onOpenDues,
  onOpenAddCash,
  onOpenExport,
  onOpenPeriodPicker,
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

  // Distribusi Anggota per Bagian
  const totalMembers = members.length;
  const calcUnitStats = (catName) => {
    const unitMembers = members.filter((m) => m.category === catName);
    const count = unitMembers.length;
    const sharePct = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
    return { count, sharePct };
  };

  const hakimStats = calcUnitStats("Hakim");
  const paniteraStats = calcUnitStats("Kepaniteraan");
  const sekretariatStats = calcUnitStats("Kesekretariatan");
  const stafStats = calcUnitStats("Staf");

  const hasCashbook = Array.isArray(cashbook) && cashbook.length > 0;
  const hasRightColumn = hasCashbook;

  const renderRealisasiCard = () => (
    <div className="stitch-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={18} color="#0f5132" />
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Realisasi Penerimaan Iuran</h3>
        </div>
        <span className="font-mono-num" style={{ fontSize: "13px", fontWeight: 700, color: "#0f5132" }}>
          {percentageCollected}% Terkumpul
        </span>
      </div>

      {/* Dual Progress Bar */}
      <div style={{ width: "100%", background: "var(--border-light)", height: "8px", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{ width: `${percentageCollected}%`, background: "#0f5132", height: "100%", transition: "width 400ms" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
        <span>Terkumpul: <strong style={{ color: "#0f5132" }}>{formatRupiah(totalCollected)}</strong></span>
        <span>Kekurangan: <strong style={{ color: "#d97706" }}>{formatRupiah(totalUnpaid)}</strong></span>
      </div>

      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
        Breakdown Alokasi 4 Pos Iuran
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
        {/* Pusat */}
        <div style={{ background: "var(--bg-app)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
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
        <div style={{ background: "var(--bg-app)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
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
        <div style={{ background: "var(--bg-app)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
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
        <div style={{ background: "var(--bg-app)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
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

  const renderDistribusiCard = () => (
    <div className="stitch-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Building2 size={18} color="#0f5132" />
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Distribusi Anggota per Bagian</h3>
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>4 Kategori Bidang</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Hakim */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "4px" }}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Hakim</span>
            <span style={{ fontWeight: 700, color: "var(--primary-800)" }}>
              {hakimStats.count} Pegawai{" "}
              <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "11.5px" }}>({hakimStats.sharePct}%)</span>
            </span>
          </div>
          <div style={{ width: "100%", background: "var(--border-light)", height: "6px", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ width: `${hakimStats.sharePct}%`, background: "#0f5132", height: "100%", borderRadius: "99px" }} />
          </div>
        </div>

        {/* Kepaniteraan */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "4px" }}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Kepaniteraan</span>
            <span style={{ fontWeight: 700, color: "var(--primary-800)" }}>
              {paniteraStats.count} Pegawai{" "}
              <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "11.5px" }}>({paniteraStats.sharePct}%)</span>
            </span>
          </div>
          <div style={{ width: "100%", background: "var(--border-light)", height: "6px", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ width: `${paniteraStats.sharePct}%`, background: "#0f5132", height: "100%", borderRadius: "99px" }} />
          </div>
        </div>

        {/* Kesekretariatan */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "4px" }}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Kesekretariatan</span>
            <span style={{ fontWeight: 700, color: "var(--primary-800)" }}>
              {sekretariatStats.count} Pegawai{" "}
              <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "11.5px" }}>({sekretariatStats.sharePct}%)</span>
            </span>
          </div>
          <div style={{ width: "100%", background: "var(--border-light)", height: "6px", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ width: `${sekretariatStats.sharePct}%`, background: "#0f5132", height: "100%", borderRadius: "99px" }} />
          </div>
        </div>

        {/* Staf */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "4px" }}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Staf / PPNPN</span>
            <span style={{ fontWeight: 700, color: "var(--primary-800)" }}>
              {stafStats.count} Pegawai{" "}
              <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "11.5px" }}>({stafStats.sharePct}%)</span>
            </span>
          </div>
          <div style={{ width: "100%", background: "var(--border-light)", height: "6px", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ width: `${stafStats.sharePct}%`, background: "#0f5132", height: "100%", borderRadius: "99px" }} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="stitch-dash-container">
      {/* 1. Header Banner Dashboard */}
      <div className="stitch-dash-header">
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

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "99px",
              background: "#dcfce7",
              color: "#16a34a",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={14} />
            <span>
              {paidMembers.length} / {members.length} Lunas ({percentageCollected}%)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Kartu Metrik Dashboard (Iuran Terkumpul & Saldo Kas Cabang) */}
      <div className="stitch-dash-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {/* Card 1: Iuran Terkumpul */}
        <div className="stitch-card">
          <div className="hairline-court"></div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Iuran Terkumpul
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", background: "#dcfce7", color: "#16a34a" }}>
              {percentageCollected}%
            </span>
          </div>
          <div className="font-mono-num" style={{ fontSize: "20px", fontWeight: 700, color: "#0f5132" }}>
            {formatRupiah(totalCollected)}
          </div>
          <div style={{ width: "100%", background: "var(--border-light)", height: "6px", borderRadius: "99px", marginTop: "10px", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, percentageCollected))}%`,
                height: "100%",
                background: "#0f5132",
                borderRadius: "99px",
                transition: "width 500ms ease",
              }}
            />
          </div>
        </div>

        {/* Card 2: Saldo Kas Cabang */}
        <div className="stitch-card">
          <div className="hairline-gold"></div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Saldo Kas Cabang
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", background: "var(--primary-50)", color: "#003820" }}>
              Kas Aktif
            </span>
          </div>
          <div className="font-mono-num" style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
            {formatRupiah(currentBalance)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "12px", color: "var(--text-muted)" }}>
            <Landmark size={14} />
            <span>Rek. Kas Cabang PA GS</span>
          </div>
        </div>
      </div>

      {/* 3. Layout Pos Iuran, Kepatuhan, & Mutasi (Hanya tampilkan widget riil) */}
      {hasRightColumn ? (
        <div className="stitch-two-col">
          {/* Kolom Kiri: Realisasi Pos Iuran & Distribusi Anggota per Bagian */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {renderRealisasiCard()}
            {renderDistribusiCard()}
          </div>

          {/* Kolom Kanan: Mutasi Kas & Agenda (Hanya data riil, jika tidak ada disembunyikan) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {hasCashbook && (
              <div className="stitch-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Receipt size={18} color="#0f5132" />
                    <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Mutasi Kas Terakhir</h3>
                  </div>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Real-time</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {cashbook.slice(0, 4).map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        background: "var(--bg-app)",
                        border: "1px solid var(--border-light)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                        <div>
                          <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)", maxWidth: "180px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
                        }}
                      >
                        {entry.type === "in" ? "+" : "-"} {formatRupiah(entry.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (

        /* Jika belum ada mutasi kas atau agenda, pos iuran & kepatuhan tampil berdampingan penuh */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "18px" }}>
          {renderRealisasiCard()}
          {renderDistribusiCard()}
        </div>
      )}

      {/* 4. Banner Aksi Cepat Bendahara */}
      <div className="stitch-quick-bar">
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
