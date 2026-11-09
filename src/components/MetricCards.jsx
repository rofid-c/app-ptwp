"use client";

import React from "react";
import { Wallet, CheckCircle2, Clock, Landmark } from "lucide-react";

export default function MetricCards({ members = [], cashbook = [] }) {
  // Hitung total dan statistik
  const totalDuesExpected = members.reduce(
    (sum, m) => sum + (Number(m.pusat || 0) + Number(m.daerah || 0) + Number(m.cabang || 0) + Number(m.tournamen || 0)),
    0
  );

  const paidMembers = members.filter((m) => m.paid);
  const totalDuesCollected = paidMembers.reduce(
    (sum, m) => sum + (Number(m.pusat || 0) + Number(m.daerah || 0) + Number(m.cabang || 0) + Number(m.tournamen || 0)),
    0
  );

  const unpaidMembersCount = members.length - paidMembers.length;
  const percentageCollected = members.length > 0 ? Math.round((paidMembers.length / members.length) * 100) : 0;

  // Hitung saldo kas cabang
  const totalCashIn = cashbook.filter((c) => c.type === "in").reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalCashOut = cashbook.filter((c) => c.type === "out").reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const currentCashBalance = totalCashIn - totalCashOut;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="metrics-grid">
      {/* 1. Total Tagihan Iuran Periode Ini */}
      <div className="metric-card gold">
        <div className="metric-header">
          <span className="metric-title">Total Iuran Periode</span>
          <div className="metric-icon-box">
            <Wallet size={20} />
          </div>
        </div>
        <div className="metric-value font-mono-num">{formatRupiah(totalDuesExpected)}</div>
        <div className="metric-footer">
          <span>Dari {members.length} anggota aktif</span>
        </div>
      </div>

      {/* 2. Total Terkumpul */}
      <div className="metric-card success">
        <div className="metric-header">
          <span className="metric-title">Iuran Terkumpul</span>
          <div className="metric-icon-box">
            <CheckCircle2 size={20} />
          </div>
        </div>
        <div className="metric-value font-mono-num">{formatRupiah(totalDuesCollected)}</div>
        <div className="metric-footer">
          <span className="metric-badge green">{percentageCollected}% Lunas</span>
          <span>({paidMembers.length} pegawai)</span>
        </div>
      </div>

      {/* 3. Belum Lunas */}
      <div className="metric-card amber">
        <div className="metric-header">
          <span className="metric-title">Belum Menyelesaikan</span>
          <div className="metric-icon-box">
            <Clock size={20} />
          </div>
        </div>
        <div className="metric-value font-mono-num">{unpaidMembersCount} Pegawai</div>
        <div className="metric-footer">
          <span className="metric-badge amber">
            {formatRupiah(totalDuesExpected - totalDuesCollected)} tertunda
          </span>
        </div>
      </div>

      {/* 4. Saldo Kas */}
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Saldo Kas</span>
          <div className="metric-icon-box">
            <Landmark size={20} />
          </div>
        </div>
        <div className="metric-value font-mono-num">{formatRupiah(currentCashBalance)}</div>
        <div className="metric-footer">
          <span>Kas operasional cabang</span>
        </div>
      </div>
    </div>
  );
}
