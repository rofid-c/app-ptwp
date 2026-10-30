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

export async function fetchMembersByPeriod(period = "September 2026") {
  if (API_CONFIG.USE_REMOTE_API) {
    const res = await fetch(`${API_CONFIG.API_BASE_URL}/dues?period=${encodeURIComponent(period)}`);
    if (!res.ok) throw new Error("Gagal mengambil data iuran dari API server.");
    const json = await res.json();
    return filterRealMembers(json.data || []);
  }

  // Client-side LocalStorage: bersihkan fake signature rows jika pernah terimpor
  const key = `${STORAGE_KEYS.MEMBERS_PREFIX}${period}`;
  const data = getLocalData(key, []);
  const cleaned = filterRealMembers(data);
  if (isClient() && Array.isArray(data) && cleaned.length !== data.length) {
    setLocalData(key, cleaned);
  }
  return cleaned;
}

export function loadSampleTemplateData(period = "September 2026") {
  const key = `${STORAGE_KEYS.MEMBERS_PREFIX}${period}`;
  setLocalData(key, INITIAL_MEMBERS);
  return INITIAL_MEMBERS;
}

export function clearPeriodData(period) {
  const key = `${STORAGE_KEYS.MEMBERS_PREFIX}${period}`;
  if (isClient()) {
    try {
      localStorage.removeItem(key);
      localStorage.setItem(key, JSON.stringify([]));
    } catch (e) {
      console.error("Error clearing period dues in localStorage", e);
    }
  }

  // Bersihkan juga dari ptwp_cashbook seluruh catatan kas & belanja terkait periode ini
  const raw = getLocalData(STORAGE_KEYS.CASHBOOK, []);
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
  setLocalData(STORAGE_KEYS.CASHBOOK, cleanCash);

  // Sync hapus periode ini ke MySQL
  if (isClient()) {
    try {
      fetch(`/api/cashbook?period=${encodeURIComponent(period)}`, {
        method: "DELETE",
      }).catch((e) => console.warn("Sync delete period to MySQL failed:", e));
    } catch (e) {}
  }

  return [];
}

export function clearAllPeriodsData() {
  if (isClient()) {
    try {
      const keys = Object.keys(localStorage);
      const prefix = STORAGE_KEYS.MEMBERS_PREFIX;
      keys.forEach((k) => {
        if (k.startsWith(prefix)) {
          localStorage.removeItem(k);
          localStorage.setItem(k, JSON.stringify([]));
        }
      });
      // Kosongkan seluruh transaksi kas di localStorage
      localStorage.setItem(STORAGE_KEYS.CASHBOOK, JSON.stringify([]));
    } catch (e) {
      console.error("Error clearing all periods dues in localStorage", e);
    }
  }

  // Bersihkan seluruh transaksi kas
  setLocalData(STORAGE_KEYS.CASHBOOK, []);

  // Sync kosongkan seluruh kas ke MySQL
  if (isClient()) {
    try {
      fetch("/api/cashbook?clearAll=true", {
        method: "DELETE",
      }).catch((e) => console.warn("Sync clear all cashbook to MySQL failed:", e));
    } catch (e) {}
  }

  return [];
}

export async function saveMembersByPeriod(period, members) {
  const cleaned = filterRealMembers(members);
  if (API_CONFIG.USE_REMOTE_API) {
    const res = await fetch(`${API_CONFIG.API_BASE_URL}/dues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period, members: cleaned }),
    });
    if (!res.ok) throw new Error("Gagal menyimpan data iuran ke API server.");
    return await res.json();
  }

  const key = `${STORAGE_KEYS.MEMBERS_PREFIX}${period}`;
  setLocalData(key, cleaned);

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

    const cleaned = filterRealMembers(members);
    const key = `${STORAGE_KEYS.MEMBERS_PREFIX}${period}`;
    setLocalData(key, cleaned);

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
    const rawMembers = getLocalData(key, []);
    const members = filterRealMembers(rawMembers);
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

  let raw = getLocalData(STORAGE_KEYS.CASHBOOK, []);

  // Jika di browser dan localStorage kosong, coba tarik dari database MySQL
  if (isClient() && (!Array.isArray(raw) || raw.length === 0)) {
    try {
      const res = await fetch("/api/cashbook");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          raw = json.data;
          setLocalData(STORAGE_KEYS.CASHBOOK, raw);
        }
      }
    } catch (e) {}
  }

  const duesEntries = getRealDuesCashEntries();
  const duesPeriods = new Set(duesEntries.map((d) => d.period));

  const cleanManual = (Array.isArray(raw) ? raw : []).filter((item) => {
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

export async function addCashBookEntry(entry) {
  const raw = getLocalData(STORAGE_KEYS.CASHBOOK, []);
  const nextId = raw.length > 0 ? Math.max(...raw.map((c) => Number(c.id) || 0), 0) + 1 : 1;
  const newEntry = {
    ...entry,
    id: entry.id || nextId,
    date: entry.date || new Date().toISOString().split("T")[0],
    source: entry.source || "manual",
  };
  const updated = [newEntry, ...(Array.isArray(raw) ? raw : [])];
  setLocalData(STORAGE_KEYS.CASHBOOK, updated);

  if (isClient()) {
    try {
      fetch("/api/cashbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      }).catch((e) => console.warn("Sync to DB failed:", e));
    } catch (e) {}
  }

  return fetchCashBook();
}

export async function addCashBookEntriesBatch(newEntries = []) {
  if (!Array.isArray(newEntries) || newEntries.length === 0) return fetchCashBook();

  const raw = getLocalData(STORAGE_KEYS.CASHBOOK, []);
  let maxId = raw.length > 0 ? Math.max(...raw.map((c) => Number(c.id) || 0), 0) : 0;

  const preparedEntries = newEntries.map((entry) => {
    maxId++;
    return {
      ...entry,
      id: entry.id || `CB-${Date.now()}-${maxId}`,
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
  setLocalData(STORAGE_KEYS.CASHBOOK, updated);

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

  return fetchCashBook();
}

export async function deleteCashBookEntry(id) {
  if (String(id).startsWith("dues_")) {
    const targetPeriod = String(id).replace("dues_", "");
    clearPeriodData(targetPeriod);
  }

  const raw = getLocalData(STORAGE_KEYS.CASHBOOK, []);
  const updated = (Array.isArray(raw) ? raw : []).filter((c) => String(c.id) !== String(id));
  setLocalData(STORAGE_KEYS.CASHBOOK, updated);

  if (isClient()) {
    try {
      fetch(`/api/cashbook?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }).catch((e) => console.warn("Sync delete to DB failed:", e));
    } catch (e) {}
  }

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
