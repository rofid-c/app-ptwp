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

export async function fetchMembersByPeriod(period = "September 2026") {
  if (API_CONFIG.USE_REMOTE_API) {
    const res = await fetch(`${API_CONFIG.API_BASE_URL}/dues?period=${encodeURIComponent(period)}`);
    if (!res.ok) throw new Error("Gagal mengambil data iuran dari API server.");
    const json = await res.json();
    return json.data || [];
  }

  // Client-side LocalStorage: data awal dikosongkan sesuai permintaan
  const key = `${STORAGE_KEYS.MEMBERS_PREFIX}${period}`;
  const data = getLocalData(key, []);
  return data;
}

export function loadSampleTemplateData(period = "September 2026") {
  const key = `${STORAGE_KEYS.MEMBERS_PREFIX}${period}`;
  setLocalData(key, INITIAL_MEMBERS);
  return INITIAL_MEMBERS;
}

export function clearPeriodData(period) {
  const key = `${STORAGE_KEYS.MEMBERS_PREFIX}${period}`;
  setLocalData(key, []);
  return [];
}


export async function saveMembersByPeriod(period, members) {
  if (API_CONFIG.USE_REMOTE_API) {
    const res = await fetch(`${API_CONFIG.API_BASE_URL}/dues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period, members }),
    });
    if (!res.ok) throw new Error("Gagal menyimpan data iuran ke API server.");
    return await res.json();
  }

  const key = `${STORAGE_KEYS.MEMBERS_PREFIX}${period}`;
  setLocalData(key, members);

  // Pastikan periode tercatat di daftar periode yang tersedia
  const availablePeriods = getAvailablePeriods();
  if (!availablePeriods.includes(period)) {
    availablePeriods.push(period);
    setLocalData(STORAGE_KEYS.PERIODS, availablePeriods);
  }

  return members;
}

export async function saveMultiplePeriodsData(periodsData = []) {
  if (typeof window === "undefined") return [];

  const savedPeriods = [];
  const currentAvailable = getAvailablePeriods();
  const updatedAvailable = [...currentAvailable];

  periodsData.forEach((item) => {
    const { period, members } = item;
    if (!period || !Array.isArray(members)) return;

    const key = `${STORAGE_KEYS.MEMBERS_PREFIX}${period}`;
    setLocalData(key, members);

    if (!updatedAvailable.includes(period)) {
      updatedAvailable.push(period);
    }
    savedPeriods.push(period);
  });

  setLocalData(STORAGE_KEYS.PERIODS, updatedAvailable);
  return savedPeriods;
}

export async function toggleMemberPaidStatus(period, memberId) {
  const members = await fetchMembersByPeriod(period);
  const updated = members.map((m) => (String(m.id) === String(memberId) ? { ...m, paid: !m.paid } : m));
  await saveMembersByPeriod(period, updated);
  return updated;
}

export async function updateSingleMember(period, memberId, updatedFields) {
  const members = await fetchMembersByPeriod(period);
  const updated = members.map((m) => (String(m.id) === String(memberId) ? { ...m, ...updatedFields } : m));
  await saveMembersByPeriod(period, updated);
  return updated;
}

export async function addMember(period, newMember) {
  const members = await fetchMembersByPeriod(period);
  const nextId = members.length > 0 ? Math.max(...members.map((m) => Number(m.id) || 0)) + 1 : 1;
  const memberWithId = {
    ...newMember,
    id: nextId,
    no: members.length + 1,
    paid: newMember.paid ?? true,
  };
  const updated = [...members, memberWithId];
  await saveMembersByPeriod(period, updated);
  return updated;
}

export async function deleteMember(period, memberId) {
  const members = await fetchMembersByPeriod(period);
  const filtered = members
    .filter((m) => String(m.id) !== String(memberId))
    .map((m, idx) => ({ ...m, no: idx + 1 }));
  await saveMembersByPeriod(period, filtered);
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

export function getAvailablePeriods() {
  const saved = getLocalData(STORAGE_KEYS.PERIODS, []);
  const allGenerated = [];
  ALL_YEARS.forEach((yr) => {
    ALL_MONTHS.forEach((m) => {
      allGenerated.push(`${m} ${yr}`);
    });
  });

  const merged = Array.from(new Set([...allGenerated, ...saved]));
  return merged;
}

export function getPeriodsWithData() {
  if (typeof window === "undefined") return [];
  const keys = Object.keys(localStorage);
  const prefix = STORAGE_KEYS.MEMBERS_PREFIX;
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
    }
  });
  return list;
}

// ==========================================
// 2. BUKU KAS CABANG SERVICE
// ==========================================

// Fungsi membaca data iuran riil yang sudah terkumpul dari Rekap Iuran
export function getRealDuesCashEntries() {
  if (typeof window === "undefined") return [];
  const periods = getPeriodsWithData();
  const duesEntries = [];

  periods.forEach((p) => {
    const key = `${STORAGE_KEYS.MEMBERS_PREFIX}${p}`;
    const members = getLocalData(key, []);
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

export async function fetchCashBook() {
  if (API_CONFIG.USE_REMOTE_API) {
    const res = await fetch(`${API_CONFIG.API_BASE_URL}/cashbook`);
    if (!res.ok) throw new Error("Gagal mengambil data buku kas.");
    return await res.json();
  }

  // 1. Ambil transaksi kas manual dari localStorage
  const raw = getLocalData(STORAGE_KEYS.CASHBOOK, []);

  // 2. Bersihkan seluruh data dummy mock bawaan (Dunlop, Sewa Lapangan, Konsumsi, Sisa Kas Agustus)
  const cleanManual = (Array.isArray(raw) ? raw : []).filter((item) => {
    const desc = item?.description || "";
    const isFake =
      desc.includes("Dunlop") ||
      desc.includes("Outdoor Pemda") ||
      desc.includes("Air Mineral") ||
      desc.includes("Sisa Saldo Kas Bulan Agustus") ||
      (desc.includes("Penerimaan Iuran PTWP Periode") && !item?.source);
    return !isFake;
  });

  if (Array.isArray(raw) && raw.length !== cleanManual.length) {
    setLocalData(STORAGE_KEYS.CASHBOOK, cleanManual);
  }

  // 3. Baca penerimaan iuran riil dari modul Rekap Iuran
  const duesEntries = getRealDuesCashEntries();

  // 4. Gabungkan iuran riil + transaksi manual yang dicatat bendahara
  const combined = [...duesEntries, ...cleanManual];

  // Urutkan tanggal terbaru ke paling awal
  combined.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return combined;
}

export async function addCashBookEntry(entry) {
  const raw = getLocalData(STORAGE_KEYS.CASHBOOK, []);
  const cleanManual = (Array.isArray(raw) ? raw : []).filter((item) => {
    const desc = item?.description || "";
    return !(
      desc.includes("Dunlop") ||
      desc.includes("Outdoor Pemda") ||
      desc.includes("Air Mineral") ||
      desc.includes("Sisa Saldo Kas Bulan Agustus") ||
      (desc.includes("Penerimaan Iuran PTWP Periode") && !item?.source)
    );
  });

  const nextId = cleanManual.length > 0 ? Math.max(...cleanManual.map((c) => Number(c.id) || 0)) + 1 : 1;
  const newEntry = {
    ...entry,
    id: nextId,
    date: entry.date || new Date().toISOString().split("T")[0],
    source: "manual",
  };
  const updated = [newEntry, ...cleanManual];
  setLocalData(STORAGE_KEYS.CASHBOOK, updated);
  return fetchCashBook();
}

export async function deleteCashBookEntry(id) {
  const raw = getLocalData(STORAGE_KEYS.CASHBOOK, []);
  const updated = (Array.isArray(raw) ? raw : []).filter((c) => String(c.id) !== String(id));
  setLocalData(STORAGE_KEYS.CASHBOOK, updated);
  return fetchCashBook();
}

// Fallback aman untuk kompabilitas modul turnamen
export async function fetchTournaments() {
  return [];
}


// ==========================================
// 4. PENGATURAN INSTANSI & TTD
// ==========================================

export function fetchSettings() {
  return getLocalData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(newSettings) {
  setLocalData(STORAGE_KEYS.SETTINGS, newSettings);
  return newSettings;
}

// ==========================================
// 5. AUTENTIKASI (LOGIN & REGISTRASI)
// ==========================================

export const INITIAL_USERS = [
  {
    username: "bendahara",
    phone: "08123456789",
    name: "Wulan Febrianti, A.Md",
    role: "bendahara",
    roleLabel: "Bendahara Kantor",
    title: "Bendahara",
  },
];

export function getRegisteredUsers() {
  return getLocalData("ptwp_registered_users", INITIAL_USERS);
}

export function getCurrentUser() {
  return getLocalData(STORAGE_KEYS.AUTH_USER, INITIAL_USERS[0]);
}

export function loginUser(identifier, password) {
  const users = getRegisteredUsers();
  const cleanId = String(identifier || "").trim().toLowerCase();

  // Cari berdasarkan username atau nomor WhatsApp
  let user = users.find(
    (u) =>
      u.username.toLowerCase() === cleanId ||
      u.phone === cleanId ||
      u.name.toLowerCase() === cleanId
  );

  if (!user) {
    // Buat session dinamis jika belum terdaftar
    user = {
      username: cleanId || "pengguna",
      phone: cleanId,
      name: identifier || "Pengguna PTWP",
      role: cleanId.includes("admin") || cleanId.includes("bendahara") ? "bendahara" : "anggota",
      roleLabel: cleanId.includes("admin") || cleanId.includes("bendahara") ? "Bendahara Kantor" : "Pegawai / Anggota",
      title: "Pegawai",
    };
  }

  setLocalData(STORAGE_KEYS.AUTH_USER, user);
  return user;
}

export function registerUser(userData) {
  const users = getRegisteredUsers();
  const newUser = {
    username: userData.username || userData.name.toLowerCase().replace(/\s+/g, "_"),
    phone: userData.phone || "",
    password: userData.password || "",
    name: userData.name,
    title: userData.title || "Staf",
    role: userData.role || "anggota",
    roleLabel: userData.role === "bendahara" ? "Bendahara Kantor" : "Pegawai / Anggota",
  };

  const updatedUsers = [...users, newUser];
  setLocalData("ptwp_registered_users", updatedUsers);
  setLocalData(STORAGE_KEYS.AUTH_USER, newUser);
  return newUser;
}

export function logoutUser() {
  if (isClient()) {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  }
}

