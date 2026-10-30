"use client";

import React from "react";
import { LayoutDashboard, FileSpreadsheet, Wallet, User, ShieldCheck } from "lucide-react";

export default function MobileBottomNav({
  activeTab = "dashboard",
  setActiveTab,
  currentUser,
  onOpenAuth,
  onOpenProfile,
}) {
  const isSuper = currentUser?.role === "super_admin" || currentUser?.username?.toLowerCase() === "aku admin";

  if (isSuper) {
    return (
      <nav className="mobile-bottom-nav">
        <div className="bottom-nav-inner" style={{ justifyContent: "space-around" }}>
          <button
            type="button"
            className={`bottom-nav-item ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            <ShieldCheck className="icon" size={18} />
            <span>Portal Admin</span>
          </button>

          <button
            type="button"
            className="bottom-nav-item"
            onClick={() => {
              if (currentUser && onOpenProfile) {
                onOpenProfile();
              } else if (onOpenAuth) {
                onOpenAuth();
              }
            }}
          >
            <User className="icon" size={18} />
            <span>Profil Admin</span>
          </button>
        </div>
      </nav>
    );
  }

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
          onClick={() => {
            if (currentUser && onOpenProfile) {
              onOpenProfile();
            } else if (onOpenAuth) {
              onOpenAuth();
            }
          }}
        >
          <User className="icon" size={18} />
          <span>Akun</span>
        </button>
      </div>
    </nav>
  );
}
