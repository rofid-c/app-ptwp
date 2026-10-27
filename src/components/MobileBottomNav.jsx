"use client";

import React from "react";
import { LayoutDashboard, FileSpreadsheet, Wallet, User } from "lucide-react";

export default function MobileBottomNav({
  activeTab = "dashboard",
  setActiveTab,
  onOpenAuth,
}) {
  return (
    <nav className="mobile-bottom-nav">
      <div className="bottom-nav-inner">
        <button
          type="button"
          className={`bottom-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <LayoutDashboard className="icon" size={18} />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${activeTab === "dues" ? "active" : ""}`}
          onClick={() => setActiveTab("dues")}
        >
          <FileSpreadsheet className="icon" size={18} />
          <span>Iuran</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${activeTab === "cashbook" ? "active" : ""}`}
          onClick={() => setActiveTab("cashbook")}
        >
          <Wallet className="icon" size={18} />
          <span>Kas</span>
        </button>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={onOpenAuth}
        >
          <User className="icon" size={18} />
          <span>Akun</span>
        </button>
      </div>
    </nav>
  );
}
