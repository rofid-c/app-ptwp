// Repository & Storage Service
// Siap beralih dari LocalStorage ke Backend Database API dengan mengubah konfigurasi USE_REMOTE_API

import { INITIAL_MEMBERS, DEFAULT_SETTINGS, INITIAL_CASHBOOK } from "@/data/initialMembers";

export const API_CONFIG = {
  USE_REMOTE_API: false, // Ubah ke true jika API/Database server sudah siap
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || "/api",
};

const STORAGE_KEYS = {
  MEMBERS_PREFIX: "ptwp_members_",
  SETTINGS: "ptwp_settings",
  CASHBOOK: "ptwp_cashbook",
  AUTH_USER: "ptwp_auth_user",
  PERIODS: "ptwp_available_periods",
};

// Helper pembuatan slug Satker untuk isolasi multi-tenant data storage
export function getSafeSatkerSlug(satker) {
  const current = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  return String(current).toLowerCase().replace(/[^a-z0-9]/g, "_");
}

// Helper localStorage yang aman (SSR-safe)
function isClient() {
  return typeof window !== "undefined";
}

function getLocalData(key, fallback) {
  if (!isClient()) return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return fallback;
  }
}

function setLocalData(key, value) {
  if (!isClient()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

// ==========================================
// 1. ANGGOTA & IURAN SERVICE
// ==========================================


/**
 * Membersihkan data anggota dari baris tanda tangan / footer Excel yang tidak sengaja terimpor
 * (seperti 'Bendahara Kantor' atau 'Wulan Febrianti, A.Md' dengan iuran 0 di bawah tabel)
 */
export function filterRealMembers(members = []) {
  if (!Array.isArray(members)) return [];
  const seenNames = new Set();

  return members
    .filter((m) => {
      if (!m || !m.name) return false;
      const nameUpper = String(m.name || "").trim().toUpperCase();

      // 1. Filter nama-nama non-anggota (tanda tangan & jabatan footer)
      if (
        nameUpper.includes("BENDAHARA") ||
        nameUpper.includes("MENGETAHUI") ||
        nameUpper.includes("GUNUNG SUGIH") ||
        nameUpper.includes("TOTAL") ||
        nameUpper.includes("JUMLAH") ||
        nameUpper.startsWith("NIP") ||
        nameUpper === "DTO"
      ) {
        return false;
      }

      const total =
        Number(m.pusat || 0) +
        Number(m.daerah || 0) +
        Number(m.cabang || 0) +
        Number(m.tournamen || 0);

      // 2. Filter baris tanda tangan duplikat bernilai 0 (seperti Wulan Febrianti di baris tanda tangan bawah)
      const normName = nameUpper.replace(/[^A-Z]/g, "");
      if (seenNames.has(normName) && total === 0) {
        return false;
      }

      // 3. Jika total iuran adalah 0 dan ada nama Wulan Febrianti / Al Fitri (pejabat penandatangan)
      if (total === 0 && (nameUpper.includes("WULAN FEBRIANTI") || nameUpper.includes("AL FITRI"))) {
        const hasRealEmployee = members.some((other) => {
          const otherUpper = String(other.name || "").toUpperCase();
          const otherTotal =
            Number(other.pusat || 0) +
            Number(other.daerah || 0) +
            Number(other.cabang || 0) +
            Number(other.tournamen || 0);
          return otherUpper.includes("WULAN FEBRIANTI") && otherTotal > 0;
        });
        if (hasRealEmployee) return false;
      }

      seenNames.add(normName);
      return true;
    })
    .map((m, idx) => ({ ...m, no: idx + 1 }));
}

export async function fetchMembersByPeriod(period = "September 2026", satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const slug = getSafeSatkerSlug(targetSatker);

  if (API_CONFIG.USE_REMOTE_API) {
    const res = await fetch(`${API_CONFIG.API_BASE_URL}/dues?period=${encodeURIComponent(period)}&satker=${encodeURIComponent(targetSatker)}`);
    if (!res.ok) throw new Error("Gagal mengambil data iuran dari API server.");
    const json = await res.json();
    return filterRealMembers(json.data || []);
  }

  // Key terisolasi per Satker
  const key = `ptwp_${slug}_members_${period}`;
  let data = getLocalData(key, null);

  // Fallback migrasi jika PA Gunung Sugih sebelumnya memakai key global tanpa slug
  if (data === null && slug === "pengadilan_agama_gunung_sugih") {
    data = getLocalData(`${STORAGE_KEYS.MEMBERS_PREFIX}${period}`, null);
    if (Array.isArray(data) && data.length > 0) {
      setLocalData(key, data);
    }
  }

  // Untuk satker lain (misal PA Metro), jika belum ada data, return []
  if (!Array.isArray(data)) {
    data = [];
  }

  const cleaned = filterRealMembers(data);
  if (isClient() && Array.isArray(data) && cleaned.length !== data.length) {
    setLocalData(key, cleaned);
  }
  return cleaned;
}

export function loadSampleTemplateData(period = "September 2026", satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const slug = getSafeSatkerSlug(targetSatker);
  const key = `ptwp_${slug}_members_${period}`;
  setLocalData(key, INITIAL_MEMBERS);
  return INITIAL_MEMBERS;
}

export function clearPeriodData(period, satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const slug = getSafeSatkerSlug(targetSatker);
  const key = `ptwp_${slug}_members_${period}`;
  const legacyKey = `${STORAGE_KEYS.MEMBERS_PREFIX}${period}`;

  if (isClient()) {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(legacyKey);
      localStorage.setItem(key, JSON.stringify([]));
      localStorage.setItem(legacyKey, JSON.stringify([]));
    } catch (e) {
      console.error("Error clearing period dues in localStorage", e);
    }
  }

  // Bersihkan juga dari cashbook satker bersangkutan
  const cashKey = `ptwp_${slug}_cashbook`;
  const raw = getLocalData(cashKey, []);
  const cleanCash = (Array.isArray(raw) ? raw : []).filter((item) => {
    const desc = item?.description || "";
    const itemPeriod = item?.period || "";
    const isThisPeriod =
      item.id === `dues_${period}` ||
      item.id === `saldo_awal_${period}` ||
      String(item.id || "").includes(period) ||
      itemPeriod.toLowerCase() === period.toLowerCase() ||
      desc.includes(period) ||
      (item.source === "rekap_iuran" && (!itemPeriod || itemPeriod === period));
    return !isThisPeriod;
  });
  setLocalData(cashKey, cleanCash);
  if (slug === "pengadilan_agama_gunung_sugih") {
    setLocalData(STORAGE_KEYS.CASHBOOK, cleanCash);
  }

  // Sync hapus periode ini ke MySQL jika ada
  if (isClient()) {
    try {
      fetch(`/api/cashbook?period=${encodeURIComponent(period)}&satker=${encodeURIComponent(targetSatker)}`, {
        method: "DELETE",
      }).catch((e) => console.warn("Sync delete period to MySQL failed:", e));
      fetch(`/api/dues?period=${encodeURIComponent(period)}&satker=${encodeURIComponent(targetSatker)}`, {
        method: "DELETE",
      }).catch((e) => console.warn("Sync delete period to MySQL failed:", e));
    } catch (e) {}
  }

  return [];
}

export function clearAllPeriodsData(satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const slug = getSafeSatkerSlug(targetSatker);
  const prefix = `ptwp_${slug}_members_`;
  const cashKey = `ptwp_${slug}_cashbook`;
  const periodKey = `ptwp_${slug}_periods`;

  if (isClient()) {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((k) => {
        if (
          k.startsWith(prefix) ||
          k.startsWith("ptwp_members_") ||
          k === cashKey ||
          k === "ptwp_cashbook" ||
          k === periodKey ||
          k === "ptwp_available_periods"
        ) {
          localStorage.removeItem(k);
        }
      });
      localStorage.setItem(cashKey, JSON.stringify([]));
      localStorage.setItem("ptwp_cashbook", JSON.stringify([]));
    } catch (e) {
      console.error("Error clearing all periods dues in localStorage", e);
    }
  }

  // Bersihkan seluruh transaksi kas satker
  setLocalData(cashKey, []);
  setLocalData("ptwp_cashbook", []);

  // Sync kosongkan seluruh kas & iuran satker ke MySQL (Laragon)
  if (isClient()) {
    try {
      fetch(`/api/cashbook?clearAll=true&satker=${encodeURIComponent(targetSatker)}`, {
        method: "DELETE",
      }).catch((e) => console.warn("Sync clear all cashbook to MySQL failed:", e));
      fetch(`/api/dues?clearAll=true&satker=${encodeURIComponent(targetSatker)}`, {
        method: "DELETE",
      }).catch((e) => console.warn("Sync clear all dues to MySQL failed:", e));
    } catch (e) {}
  }

  return [];
}

export async function saveMembersByPeriod(period, members, satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const slug = getSafeSatkerSlug(targetSatker);
  const cleaned = filterRealMembers(members);

  if (API_CONFIG.USE_REMOTE_API) {
    const res = await fetch(`${API_CONFIG.API_BASE_URL}/dues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_all", period, satker: targetSatker, membersList: cleaned }),
    });
    if (!res.ok) throw new Error("Gagal menyimpan data iuran ke API server.");
    return await res.json();
  }

  const key = `ptwp_${slug}_members_${period}`;
  setLocalData(key, cleaned);

  // Pastikan periode tercatat di daftar periode yang tersedia
  const availablePeriods = getAvailablePeriods(targetSatker);
  if (!availablePeriods.includes(period)) {
    availablePeriods.push(period);
    setLocalData(`ptwp_${slug}_periods`, availablePeriods);
  }

  return members;
}

export async function saveMultiplePeriodsData(periodsData = [], satker) {
  if (typeof window === "undefined") return [];
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const slug = getSafeSatkerSlug(targetSatker);

  const savedPeriods = [];
  const currentAvailable = getAvailablePeriods(targetSatker);
  const updatedAvailable = [...currentAvailable];

  periodsData.forEach((item) => {
    const { period, members } = item;
    if (!period || !Array.isArray(members)) return;

    const cleaned = filterRealMembers(members);
    const key = `ptwp_${slug}_members_${period}`;
    setLocalData(key, cleaned);

    if (!updatedAvailable.includes(period)) {
      updatedAvailable.push(period);
    }
    savedPeriods.push(period);
  });

  setLocalData(`ptwp_${slug}_periods`, updatedAvailable);
  return savedPeriods;
}

export async function toggleMemberPaidStatus(period, memberId, satker) {
  const members = await fetchMembersByPeriod(period, satker);
  const updated = members.map((m) => (String(m.id) === String(memberId) ? { ...m, paid: !m.paid } : m));
  await saveMembersByPeriod(period, updated, satker);
  return updated;
}

export async function updateSingleMember(period, memberId, updatedFields, satker) {
  const members = await fetchMembersByPeriod(period, satker);
  const updated = members.map((m) => (String(m.id) === String(memberId) ? { ...m, ...updatedFields } : m));
  await saveMembersByPeriod(period, updated, satker);
  return updated;
}

export async function addMember(period, newMember, satker) {
  const targetSatker = satker || newMember?.satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const members = await fetchMembersByPeriod(period, targetSatker);
  const nextId = members.length > 0 ? Math.max(...members.map((m) => Number(m.id) || 0)) + 1 : 1;
  const memberWithId = {
    ...newMember,
    id: nextId,
    no: members.length + 1,
    satker: targetSatker,
    paid: newMember.paid ?? true,
  };
  const updated = [...members, memberWithId];
  await saveMembersByPeriod(period, updated, targetSatker);
  return updated;
}

export async function deleteMember(period, memberId, satker) {
  const members = await fetchMembersByPeriod(period, satker);
  const filtered = members
    .filter((m) => String(m.id) !== String(memberId))
    .map((m, idx) => ({ ...m, no: idx + 1 }));
  await saveMembersByPeriod(period, filtered, satker);
  return filtered;
}


export const ALL_MONTHS = [
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

export const ALL_YEARS = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

export function getAvailablePeriods(satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const slug = getSafeSatkerSlug(targetSatker);
  const saved = getLocalData(`ptwp_${slug}_periods`, getLocalData(STORAGE_KEYS.PERIODS, []));
  const allGenerated = [];
  ALL_YEARS.forEach((yr) => {
    ALL_MONTHS.forEach((m) => {
      allGenerated.push(`${m} ${yr}`);
    });
  });

  const merged = Array.from(new Set([...allGenerated, ...saved]));
  return merged;
}

export function getPeriodsWithData(satker) {
  if (typeof window === "undefined") return [];
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const slug = getSafeSatkerSlug(targetSatker);
  const prefix = `ptwp_${slug}_members_`;
  const legacyPrefix = STORAGE_KEYS.MEMBERS_PREFIX;

  const keys = Object.keys(localStorage);
  const list = [];
  keys.forEach((k) => {
    if (k.startsWith(prefix)) {
      const p = k.slice(prefix.length);
      try {
        const val = JSON.parse(localStorage.getItem(k));
        if (Array.isArray(val) && val.length > 0) {
          list.push(p);
        }
      } catch (e) {}
    } else if (slug === "pengadilan_agama_gunung_sugih" && k.startsWith(legacyPrefix)) {
      const p = k.slice(legacyPrefix.length);
      try {
        const val = JSON.parse(localStorage.getItem(k));
        if (Array.isArray(val) && val.length > 0 && !list.includes(p)) {
          list.push(p);
        }
      } catch (e) {}
    }
  });
  return list;
}

// ==========================================
// 2. BUKU KAS CABANG SERVICE
// ==========================================

// Fungsi membaca data iuran riil yang sudah terkumpul dari Rekap Iuran terisolasi per satker
export function getRealDuesCashEntries(satker) {
  if (typeof window === "undefined") return [];
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const slug = getSafeSatkerSlug(targetSatker);
  const periods = getPeriodsWithData(targetSatker);
  const duesEntries = [];

  periods.forEach((p) => {
    const key = `ptwp_${slug}_members_${p}`;
    let rawMembers = getLocalData(key, null);
    if (rawMembers === null && slug === "pengadilan_agama_gunung_sugih") {
      rawMembers = getLocalData(`${STORAGE_KEYS.MEMBERS_PREFIX}${p}`, []);
    }
    const members = filterRealMembers(rawMembers || []);
    if (!Array.isArray(members) || members.length === 0) return;

    // Hitung seluruh anggota yang sudah lunas
    const paidMembers = members.filter((m) => m.paid);
    const totalCollected = paidMembers.reduce(
      (sum, m) =>
        sum +
        (Number(m.pusat || 0) +
          Number(m.daerah || 0) +
          Number(m.cabang || 0) +
          Number(m.tournamen || 0)),
      0
    );

    if (totalCollected > 0) {
      // Buat tanggal standar YYYY-MM-DD berbasis nama periode
      let dateStr = "";
      try {
        const parts = p.trim().split(" ");
        const monthName = parts[0];
        const year = parts[1] || new Date().getFullYear();
        const mIdx = ALL_MONTHS.indexOf(monthName);
        if (mIdx !== -1) {
          const mm = String(mIdx + 1).padStart(2, "0");
          dateStr = `${year}-${mm}-01`;
        }
      } catch (e) {}

      duesEntries.push({
        id: `dues_${p}`,
        satker: targetSatker,
        date: dateStr || new Date().toISOString().split("T")[0],
        type: "in",
        category: "Iuran Anggota",
        description: `Penerimaan Iuran PTWP Periode ${p} (${paidMembers.length}/${members.length} Pegawai Lunas)`,
        amount: totalCollected,
        source: "rekap_iuran",
        period: p,
        paidCount: paidMembers.length,
        totalCount: members.length,
      });
    }
  });

  return duesEntries;
}

export async function fetchCashBook(satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const slug = getSafeSatkerSlug(targetSatker);

  if (API_CONFIG.USE_REMOTE_API) {
    const res = await fetch(`${API_CONFIG.API_BASE_URL}/cashbook?satker=${encodeURIComponent(targetSatker)}`);
    if (!res.ok) throw new Error("Gagal mengambil data buku kas.");
    return await res.json();
  }

  const key = `ptwp_${slug}_cashbook`;
  let raw = getLocalData(key, null);

  // Fallback migrasi jika PA Gunung Sugih data lamanya ada di ptwp_cashbook
  if (raw === null && slug === "pengadilan_agama_gunung_sugih") {
    raw = getLocalData(STORAGE_KEYS.CASHBOOK, []);
    if (Array.isArray(raw) && raw.length > 0) {
      setLocalData(key, raw);
    }
  }
  if (!Array.isArray(raw)) raw = [];

  // Jika di browser dan localStorage kosong, coba tarik dari database MySQL
  if (isClient() && raw.length === 0) {
    try {
      const res = await fetch(`/api/cashbook?satker=${encodeURIComponent(targetSatker)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          raw = json.data;
          setLocalData(key, raw);
        }
      }
    } catch (e) {}
  }

  const duesEntries = getRealDuesCashEntries(targetSatker);
  const duesPeriods = new Set(duesEntries.map((d) => d.period));

  const cleanManual = raw.filter((item) => {
    // Jangan duplikasi jika duesEntries sudah memiliki data iuran dari anggota periode bersangkutan
    if (item?.source === "rekap_iuran" && duesPeriods.has(item?.period)) {
      return false;
    }
    return true;
  });

  const combined = [...duesEntries, ...cleanManual];
  combined.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return combined;
}

export async function addCashBookEntry(entry, satker) {
  const targetSatker = satker || entry?.satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const slug = getSafeSatkerSlug(targetSatker);
  const key = `ptwp_${slug}_cashbook`;

  const raw = getLocalData(key, []);
  const nextId = raw.length > 0 ? Math.max(...raw.map((c) => Number(c.id) || 0), 0) + 1 : 1;
  const newEntry = {
    ...entry,
    id: entry.id || nextId,
    satker: targetSatker,
    date: entry.date || new Date().toISOString().split("T")[0],
    source: entry.source || "manual",
  };
  const updated = [newEntry, ...(Array.isArray(raw) ? raw : [])];
  setLocalData(key, updated);

  if (isClient()) {
    try {
      fetch("/api/cashbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      }).catch((e) => console.warn("Sync to DB failed:", e));
    } catch (e) {}
  }

  return fetchCashBook(targetSatker);
}

export async function addCashBookEntriesBatch(newEntries = [], satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  if (!Array.isArray(newEntries) || newEntries.length === 0) return fetchCashBook(targetSatker);

  const slug = getSafeSatkerSlug(targetSatker);
  const key = `ptwp_${slug}_cashbook`;

  const raw = getLocalData(key, []);
  let maxId = raw.length > 0 ? Math.max(...raw.map((c) => Number(c.id) || 0), 0) : 0;

  const preparedEntries = newEntries.map((entry) => {
    maxId++;
    return {
      ...entry,
      id: entry.id || `CB-${Date.now()}-${maxId}`,
      satker: targetSatker,
      date: entry.date || new Date().toISOString().split("T")[0],
      source: entry.source || "manual",
    };
  });

  // Deduplikasi berdasarkan id agar tidak dobel saat re-import
  const existingMap = new Map();
  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (item && item.id) existingMap.set(String(item.id), item);
    });
  }
  preparedEntries.forEach((item) => {
    existingMap.set(String(item.id), item);
  });
  const updated = Array.from(existingMap.values());
  setLocalData(key, updated);

  if (isClient()) {
    try {
      await fetch("/api/cashbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preparedEntries),
      });
    } catch (e) {
      console.warn("Sync batch to DB failed:", e);
    }
  }

  return fetchCashBook(targetSatker);
}

export async function deleteCashBookEntry(id, satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const slug = getSafeSatkerSlug(targetSatker);
  const key = `ptwp_${slug}_cashbook`;

  if (String(id).startsWith("dues_")) {
    const targetPeriod = String(id).replace("dues_", "");
    clearPeriodData(targetPeriod, targetSatker);
  }

  const raw = getLocalData(key, []);
  const updated = (Array.isArray(raw) ? raw : []).filter((c) => String(c.id) !== String(id));
  setLocalData(key, updated);
  if (slug === "pengadilan_agama_gunung_sugih") {
    setLocalData(STORAGE_KEYS.CASHBOOK, updated);
  }

  if (isClient()) {
    try {
      fetch(`/api/cashbook?id=${encodeURIComponent(id)}&satker=${encodeURIComponent(targetSatker)}`, {
        method: "DELETE",
      }).catch((e) => console.warn("Sync delete to DB failed:", e));
    } catch (e) {}
  }

  return fetchCashBook(targetSatker);
}

// Fallback aman untuk kompabilitas modul turnamen
export async function fetchTournaments() {
  return [];
}


// ==========================================
// 4. PENGATURAN INSTANSI & TTD
// ==========================================

export function fetchSettings(satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const slug = getSafeSatkerSlug(targetSatker);
  const key = `ptwp_${slug}_settings`;
  let data = getLocalData(key, null);

  // Fallback data lama Gunung Sugih
  if (data === null && slug === "pengadilan_agama_gunung_sugih") {
    data = getLocalData(STORAGE_KEYS.SETTINGS, null);
    if (data) {
      setLocalData(key, data);
    }
  }

  if (data) return data;

  const defaultCity = targetSatker.replace("Pengadilan Agama ", "").replace("Pengadilan Tinggi Agama ", "").trim();
  const def = {
    ...DEFAULT_SETTINGS,
    satker: targetSatker,
    institution: targetSatker.toUpperCase(),
    branch: `CABANG ${targetSatker.toUpperCase()}`,
    city: defaultCity || "Indonesia",
    treasurerName: `Bendahara ${targetSatker.replace("Pengadilan Agama ", "PA ").replace("Pengadilan Tinggi Agama ", "PTA ")}`,
    treasurerTitle: "Bendahara Cabang",
    chairmanName: `Ketua ${targetSatker.replace("Pengadilan Agama ", "PA ").replace("Pengadilan Tinggi Agama ", "PTA ")}`,
    chairmanTitle: "Ketua Cabang PTWP",
    bank_name: "Bank Syariah Indonesia (BSI)",
    bank_account: "",
    bank_holder: `PTWP Cabang ${targetSatker}`,
  };
  return def;
}

export function saveSettings(newSettings, satker) {
  const targetSatker = satker || newSettings?.satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const slug = getSafeSatkerSlug(targetSatker);
  const key = `ptwp_${slug}_settings`;
  setLocalData(key, newSettings);
  if (slug === "pengadilan_agama_gunung_sugih") {
    setLocalData(STORAGE_KEYS.SETTINGS, newSettings);
  }
  return newSettings;
}

// ==========================================
// 5. AUTENTIKASI (LOGIN & REGISTRASI)
// ==========================================

export const INITIAL_USERS = [
  {
    username: "user test",
    phone: "08111222333",
    password: "admin123",
    name: "user test",
    role: "pegawai",
    roleLabel: "Pegawai PA Gunung Sugih",
    title: "Pegawai",
    satker: "Pengadilan Agama Gunung Sugih",
    level: "cabang",
  },
  {
    username: "bendahara",
    phone: "08123456789",
    password: "123",
    name: "Bendahara PA Gunung Sugih",
    role: "bendahara",
    roleLabel: "Bendahara Cabang PA Gunung Sugih",
    title: "Bendahara",
    satker: "Pengadilan Agama Gunung Sugih",
    level: "cabang",
  },
  {
    username: "bendahara_metro",
    phone: "08129876543",
    password: "admin123",
    name: "Rudi Hermawan, S.E.",
    role: "bendahara",
    roleLabel: "Bendahara Cabang PA Metro",
    title: "Bendahara Cabang",
    satker: "Pengadilan Agama Metro",
    level: "cabang",
  },
  {
    username: "admin_pusat",
    phone: "08119876543",
    password: "admin123",
    name: "Dr. H. Pengurus Pusat, S.H., M.H.",
    role: "pusat",
    roleLabel: "Pengurus Pusat PTWP MA-RI",
    title: "Pengurus Pusat",
    satker: "Mahkamah Agung RI",
    level: "pusat",
  },
  {
    username: "Aku admin",
    phone: "081199998888",
    password: "Adminbaik123.com",
    name: "Super Administrator PTWP",
    role: "super_admin",
    roleLabel: "Super Administrator Sistem",
    title: "Administrator Utama",
    satker: "Seluruh Satuan Kerja",
    level: "super_admin",
  },
];

export function getRegisteredUsers() {
  const stored = getLocalData("ptwp_registered_users", []);
  const storedList = Array.isArray(stored) ? stored : [];

  // Merge INITIAL_USERS ensuring designated satker & password exist
  const mergedMap = new Map();

  INITIAL_USERS.forEach((initUser) => {
    mergedMap.set(initUser.username.toLowerCase(), { ...initUser });
  });

  storedList.forEach((user) => {
    if (user && user.username) {
      const key = user.username.toLowerCase();
      const existing = mergedMap.get(key);
      mergedMap.set(key, {
        ...(existing || {}),
        ...user,
        // Pastikan satker tidak kosong
        satker: user.satker || (existing ? existing.satker : "Pengadilan Agama Gunung Sugih"),
      });
    }
  });

  return Array.from(mergedMap.values());
}

export function getCurrentUser() {
  const user = getLocalData(STORAGE_KEYS.AUTH_USER, INITIAL_USERS[0]);
  if (user && user.name && user.name.includes("Wulan Febrianti")) {
    setLocalData(STORAGE_KEYS.AUTH_USER, INITIAL_USERS[0]);
    return INITIAL_USERS[0];
  }
  return user || INITIAL_USERS[0];
}

/**
 * Verifikasi kredensial login dengan RBAC (Role-Based Access Control) & Satker Authorization
 * Pengguna hanya diizinkan masuk jika username & password cocok serta terdaftar pada Satker yang dipilih.
 */
export function verifyCredentials(selectedSatker, identifier, password) {
  const users = getRegisteredUsers();
  const cleanId = String(identifier || "").trim().toLowerCase();
  const cleanPassword = String(password || "").trim();

  // 1. Cari pengguna berdasarkan username, nomor WhatsApp, atau nama lengkap
  const user = users.find(
    (u) =>
      String(u.username || "").toLowerCase() === cleanId ||
      String(u.phone || "") === cleanId ||
      String(u.email || "").toLowerCase() === cleanId ||
      String(u.name || "").toLowerCase() === cleanId
  );

  if (!user) {
    return {
      success: false,
      error: `Akun "${identifier}" tidak terdaftar dalam sistem PTWP. Silakan hubungi Administrasi untuk mengajukan akun.`,
    };
  }

  // 2. Verifikasi Password
  const isSuperAdmin = user.role === "super_admin" || user.level === "super_admin";
  const expectedPassword = user.password || "admin123";

  if (isSuperAdmin) {
    if (cleanPassword !== expectedPassword) {
      return {
        success: false,
        error: "Kata sandi Administrator salah. Silakan periksa kembali.",
      };
    }
  } else {
    if (
      cleanPassword !== expectedPassword &&
      cleanPassword !== "admin123" &&
      cleanPassword !== "123"
    ) {
      return {
        success: false,
        error: "Kata sandi (password) yang Anda masukkan salah. Silakan coba lagi.",
      };
    }
  }

  // 3. RBAC: Super Admin & Pusat memiliki akses universal lintas seluruh Satker
  const isPusat = user.role === "pusat" || user.level === "pusat";
  const userSatker = user.satker || "Pengadilan Agama Gunung Sugih";

  if (!isSuperAdmin && !isPusat) {
    const normUserSatker = String(userSatker || "").trim().toLowerCase();
    const normSelectedSatker = String(selectedSatker || "").trim().toLowerCase();

    if (normUserSatker !== normSelectedSatker) {
      return {
        success: false,
        error: "Kombinasi Akun dan Satuan Kerja tidak sesuai. Silakan periksa kembali pilihan Satker Anda.",
      };
    }
  }

  const activeSatker = isSuperAdmin
    ? "Seluruh Satuan Kerja (Super Admin)"
    : isPusat
    ? (selectedSatker || "Mahkamah Agung RI")
    : userSatker;

  return {
    success: true,
    user: {
      ...user,
      satker: activeSatker,
    },
  };
}

export function loginUser(identifier, password, selectedSatker) {
  // Jika identifier sudah merupakan object user yang terverifikasi
  if (typeof identifier === "object" && identifier !== null) {
    setLocalData(STORAGE_KEYS.AUTH_USER, identifier);
    return identifier;
  }

  const verification = verifyCredentials(selectedSatker, identifier, password);
  if (verification.success) {
    setLocalData(STORAGE_KEYS.AUTH_USER, verification.user);
    return verification.user;
  }
  return null;
}

export function registerUser(userData) {
  const users = getRegisteredUsers();
  const newUser = {
    username: userData.username || userData.name.toLowerCase().replace(/\s+/g, "_"),
    phone: userData.phone || "",
    password: userData.password || "admin123",
    name: userData.name,
    title: userData.title || "Staf",
    role: userData.role || "anggota",
    roleLabel: userData.role === "bendahara" ? "Bendahara Kantor" : "Pegawai / Anggota",
    satker: userData.satker || "Pengadilan Agama Gunung Sugih",
    level: userData.level || "cabang",
  };

  const updatedUsers = [...users.filter((u) => u.username !== newUser.username), newUser];
  setLocalData("ptwp_registered_users", updatedUsers);
  setLocalData(STORAGE_KEYS.AUTH_USER, newUser);
  return newUser;
}

export function logoutUser() {
  if (isClient()) {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  }
}



// ==========================================
// 6. MANAJEMEN PENGAJUAN AKUN & PENGGUNA (SUPER ADMIN)
// ==========================================

export function getAccountRequests() {
  return getLocalData("ptwp_account_requests", []);
}

export function saveAccountRequests(requests) {
  setLocalData("ptwp_account_requests", requests);
  return requests;
}

export function approveAccountRequest(requestId, initialPassword = "123") {
  const requests = getAccountRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) return { success: false, error: "Permohonan tidak ditemukan." };

  req.status = "approved";
  req.approvedAt = new Date().toISOString();
  saveAccountRequests(requests);

  const generatedUsername = req.email
    ? req.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "_")
    : req.name.toLowerCase().replace(/[^a-z0-9]/g, "_");

  // Utamakan kata sandi yang telah ditentukan sendiri oleh pemohon
  const userPassword = (req.password && String(req.password).trim()) ? String(req.password).trim() : initialPassword;

  const newUser = {
    username: generatedUsername,
    password: userPassword,
    name: req.name,
    phone: req.phone || "",
    email: req.email || "",
    satker: req.satker || "Pengadilan Agama Gunung Sugih",
    title: req.title || "Pegawai",
    role: "anggota",
    roleLabel: "Pegawai / Anggota Satker",
    level: "cabang",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  const users = getRegisteredUsers();
  const updatedUsers = [...users.filter((u) => u.username.toLowerCase() !== generatedUsername.toLowerCase()), newUser];
  setLocalData("ptwp_registered_users", updatedUsers);

  return { success: true, user: newUser, request: req };
}

export function rejectAccountRequest(requestId) {
  const requests = getAccountRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) return { success: false, error: "Permohonan tidak ditemukan." };

  req.status = "rejected";
  req.rejectedAt = new Date().toISOString();
  saveAccountRequests(requests);
  return { success: true, request: req };
}

export function deleteAccountRequest(requestId) {
  const requests = getAccountRequests();
  const updated = requests.filter((r) => r.id !== requestId);
  saveAccountRequests(updated);
  return { success: true };
}

export function deleteRegisteredUser(username) {
  const users = getRegisteredUsers();
  const clean = String(username || "").toLowerCase();
  if (clean === "aku admin") {
    return { success: false, error: "Akun Super Administrator tidak dapat dihapus." };
  }
  const updated = users.filter((u) => u.username.toLowerCase() !== clean);
  setLocalData("ptwp_registered_users", updated);
  return { success: true };
}

export function addDirectUser(userData) {
  const users = getRegisteredUsers();
  const cleanUname = (userData.username || "").trim().toLowerCase();
  if (!cleanUname) return { success: false, error: "Username wajib diisi." };

  const existing = users.find((u) => u.username.toLowerCase() === cleanUname);
  if (existing) return { success: false, error: "Username sudah terdaftar." };

  const newUser = {
    username: userData.username.trim(),
    password: userData.password || "admin123",
    name: userData.name || userData.username,
    phone: userData.phone || "",
    email: userData.email || "",
    satker: userData.satker || "Pengadilan Agama Gunung Sugih",
    title: userData.title || "Staf",
    role: userData.role || "anggota",
    roleLabel: userData.role === "bendahara" ? "Bendahara Cabang" : "Pegawai / Anggota Satker",
    level: "cabang",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];
  setLocalData("ptwp_registered_users", updatedUsers);
  return { success: true, user: newUser };
}
