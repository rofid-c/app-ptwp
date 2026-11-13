// Repository & Storage Service (Pure MySQL via Next.js Backend API Routes)
// Seluruh data (Iuran Anggota, Buku Kas, Pengaturan, Akun Pengguna, Permohonan) tersimpan murni di MySQL (db_ptwp - Laragon)

export const API_CONFIG = {
  USE_REMOTE_API: true,
  API_BASE_URL: "/api",
};

const SESSION_KEY = "ptwp_session_user";

function isClient() {
  return typeof window !== "undefined";
}

/**
 * Fetch wrapper yang secara otomatis menyertakan Signed Session Token
 * untuk memastikan otorisasi dan isolasi multi-tenant satker
 */
export async function apiFetch(url, options = {}) {
  if (!isClient()) return fetch(url, options);
  const currentUser = getCurrentUser();
  const token = currentUser?.token;
  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("x-auth-token", token);
  }
  return fetch(url, {
    ...options,
    headers,
  });
}

// Helper pembuatan slug Satker untuk keperluan URL / identitas
export function getSafeSatkerSlug(satker) {
  const current = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  return String(current).toLowerCase().replace(/[^a-z0-9]/g, "_");
}

/**
 * Membersihkan data anggota dari baris tanda tangan / footer Excel yang tidak sengaja terimpor
 */
export function filterRealMembers(members = []) {
  if (!Array.isArray(members)) return [];
  const seenNames = new Set();

  return members
    .filter((m) => {
      if (!m || !m.name) return false;
      const nameUpper = String(m.name || "").trim().toUpperCase();

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

      const normName = nameUpper.replace(/[^A-Z]/g, "");
      if (seenNames.has(normName) && total === 0) {
        return false;
      }

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

// ==========================================
// 1. ANGGOTA & IURAN SERVICE (MySQL)
// ==========================================

export async function fetchMembersByPeriod(period = "September 2026", satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  if (!isClient()) return [];

  try {
    const res = await apiFetch(`/api/dues?period=${encodeURIComponent(period)}&satker=${encodeURIComponent(targetSatker)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return filterRealMembers(json.data);
      }
    }
  } catch (e) {
    console.error("[StorageService] Gagal fetch iuran anggota dari MySQL:", e);
  }
  return [];
}

export async function clearPeriodData(period, satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  if (!isClient()) return [];

  try {
    await Promise.all([
      apiFetch(`/api/dues?period=${encodeURIComponent(period)}&satker=${encodeURIComponent(targetSatker)}`, {
        method: "DELETE",
      }),
      apiFetch(`/api/cashbook?period=${encodeURIComponent(period)}&satker=${encodeURIComponent(targetSatker)}`, {
        method: "DELETE",
      }),
    ]);
  } catch (e) {
    console.error("[StorageService] Gagal menghapus data periode dari MySQL:", e);
  }
  return [];
}

export async function clearAllPeriodsData(satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  if (!isClient()) return [];

  try {
    await Promise.all([
      apiFetch(`/api/dues?clearAll=true&satker=${encodeURIComponent(targetSatker)}`, {
        method: "DELETE",
      }),
      apiFetch(`/api/cashbook?clearAll=true&satker=${encodeURIComponent(targetSatker)}`, {
        method: "DELETE",
      }),
    ]);
  } catch (e) {
    console.error("[StorageService] Gagal mengosongkan seluruh data dari MySQL:", e);
  }
  return [];
}

export async function saveMembersByPeriod(period, members, satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const cleaned = filterRealMembers(members);
  if (!isClient()) return cleaned;

  try {
    await apiFetch("/api/dues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_all", period, satker: targetSatker, membersList: cleaned }),
    });

    // Sinkronisasi otomatis penerimaan iuran ke buku kas jika ada penerimaan
    const paidMembers = cleaned.filter((m) => m.paid);
    const totalCollected = paidMembers.reduce(
      (sum, m) =>
        sum +
        (Number(m.pusat || 0) +
          Number(m.daerah || 0) +
          Number(m.cabang || 0) +
          Number(m.tournamen || 0)),
      0
    );

    // Jangan dobelkan jika Januari sudah memiliki Saldo Awal tahunan
    if (totalCollected > 0 && !period.toLowerCase().startsWith("januari")) {
      const monthParts = period.split(" ");
      const mLower = (monthParts[0] || "").toLowerCase();
      const mYear = monthParts[1] || "2026";
      const monthNumMap = {
        januari: "01", februari: "02", maret: "03", april: "04",
        mei: "05", juni: "06", juli: "07", agustus: "08",
        september: "09", oktober: "10", november: "11", desember: "12"
      };
      const mm = monthNumMap[mLower] || "01";

      const duesEntry = {
        id: `dues_${period}`,
        satker: targetSatker,
        date: `${mYear}-${mm}-28`,
        type: "in",
        category: "Iuran Anggota",
        amount: totalCollected,
        description: `Penerimaan Iuran PTWP Periode ${period} (${paidMembers.length}/${cleaned.length} Pegawai Lunas)`,
        source: "rekap_iuran",
        period: period,
      };
      await addCashBookEntriesBatch([duesEntry], targetSatker);
    }
  } catch (e) {
    console.error("[StorageService] Gagal menyimpan anggota ke MySQL:", e);
  }

  return cleaned;
}

export async function saveMultiplePeriodsData(periodsData = [], satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  if (!isClient() || !Array.isArray(periodsData) || periodsData.length === 0) return [];

  try {
    const res = await apiFetch("/api/dues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_multiple_periods",
        satker: targetSatker,
        periodsData: periodsData.map((p) => ({
          period: p.period,
          members: filterRealMembers(p.members),
        })),
      }),
    });
    if (res.ok) {
      // Sinkronisasi otomatis seluruh penerimaan iuran multi-bulan ke tabel cashbook di MySQL
      const monthNumMap = {
        januari: "01", februari: "02", maret: "03", april: "04",
        mei: "05", juni: "06", juli: "07", agustus: "08",
        september: "09", oktober: "10", november: "11", desember: "12"
      };

      const duesCashEntries = [];
      for (const item of periodsData) {
        const cleanedMembers = filterRealMembers(item.members);
        const paidMembers = cleanedMembers.filter((m) => m.paid);
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
          const monthParts = item.period.split(" ");
          const mLower = (monthParts[0] || "").toLowerCase();
          const mYear = monthParts[1] || "2026";
          const mm = monthNumMap[mLower] || "01";

          duesCashEntries.push({
            id: `dues_${item.period}`,
            satker: targetSatker,
            date: `${mYear}-${mm}-28`,
            type: "in",
            category: "Iuran Anggota",
            amount: totalCollected,
            description: `Penerimaan Iuran PTWP Periode ${item.period} (${paidMembers.length}/${cleanedMembers.length} Pegawai Lunas)`,
            source: "rekap_iuran",
            period: item.period,
          });
        }
      }

      if (duesCashEntries.length > 0) {
        await addCashBookEntriesBatch(duesCashEntries, targetSatker);
      }

      await refreshPeriodsWithData(targetSatker);
      return periodsData.map((p) => p.period);
    }
  } catch (e) {
    console.error("[StorageService] Gagal menyimpan multi-periode ke MySQL:", e);
  }
  return [];
}

export async function toggleMemberPaidStatus(period, memberId, satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const user = getCurrentUser();
  const members = await fetchMembersByPeriod(period, targetSatker);
  const targetMember = members.find((m) => String(m.id) === String(memberId));
  const newStatus = targetMember ? !targetMember.paid : true;

  try {
    await apiFetch("/api/dues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_paid",
        satker: targetSatker,
        period,
        memberId,
        paid: newStatus,
        userName: user?.name || "Bendahara Cabang",
        userRole: user?.roleLabel || user?.role || "Bendahara",
      }),
    });
  } catch (e) {
    console.error("[StorageService] Gagal toggle bayar ke MySQL:", e);
  }

  return members.map((m) => (String(m.id) === String(memberId) ? { ...m, paid: newStatus } : m));
}

export async function updateSingleMember(period, memberId, updatedFields, satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  try {
    await apiFetch("/api/dues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_member",
        satker: targetSatker,
        period,
        memberId,
        memberData: updatedFields,
      }),
    });
  } catch (e) {
    console.error("[StorageService] Gagal update anggota ke MySQL:", e);
  }
  return fetchMembersByPeriod(period, targetSatker);
}

export async function addMember(period, newMember, satker) {
  const targetSatker = satker || newMember?.satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  try {
    await apiFetch("/api/dues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_member",
        satker: targetSatker,
        period,
        memberData: newMember,
      }),
    });
  } catch (e) {
    console.error("[StorageService] Gagal menambah anggota ke MySQL:", e);
  }
  return fetchMembersByPeriod(period, targetSatker);
}

export async function deleteMember(period, memberId, satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  try {
    await apiFetch(`/api/dues?memberId=${encodeURIComponent(memberId)}&satker=${encodeURIComponent(targetSatker)}`, {
      method: "DELETE",
    });
  } catch (e) {
    console.error("[StorageService] Gagal menghapus anggota dari MySQL:", e);
  }
  return fetchMembersByPeriod(period, targetSatker);
}

export const ALL_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const ALL_YEARS = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

export function getAvailablePeriods(satker) {
  const allGenerated = [];
  ALL_YEARS.forEach((yr) => {
    ALL_MONTHS.forEach((m) => {
      allGenerated.push(`${m} ${yr}`);
    });
  });
  return allGenerated;
}

let inMemoryPeriodsWithData = {};

export function invalidatePeriodsCache(satker) {
  if (satker) {
    delete inMemoryPeriodsWithData[satker];
  } else {
    inMemoryPeriodsWithData = {};
  }
}

export async function refreshPeriodsWithData(satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  if (!isClient()) return [];
  try {
    const res = await apiFetch(`/api/dues?getPeriods=true&satker=${encodeURIComponent(targetSatker)}`, {
      cache: "no-store",
    });
    const json = await res.json();
    if (json.success && Array.isArray(json.periods)) {
      inMemoryPeriodsWithData[targetSatker] = json.periods;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ptwp-periods-updated", { detail: { satker: targetSatker } }));
      }
      return json.periods;
    }
  } catch (e) {}
  return inMemoryPeriodsWithData[targetSatker] || [];
}

export function getPeriodsWithData(satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  if (isClient() && !inMemoryPeriodsWithData[targetSatker]) {
    apiFetch(`/api/dues?getPeriods=true&satker=${encodeURIComponent(targetSatker)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.periods)) {
          inMemoryPeriodsWithData[targetSatker] = json.periods;
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("ptwp-periods-updated", { detail: { satker: targetSatker } }));
          }
        }
      })
      .catch(() => {});
  }

  return inMemoryPeriodsWithData[targetSatker] || [];
}

export function getRealDuesCashEntries(satker) {
  return [];
}

// ==========================================
// 2. BUKU KAS CABANG SERVICE (MySQL)
// ==========================================

export async function fetchCashBook(satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  if (!isClient()) return [];

  try {
    const res = await apiFetch(`/api/cashbook?satker=${encodeURIComponent(targetSatker)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data.map((item) => ({
          ...item,
          amount: Number(item.amount || 0),
        }));
      }
    }
  } catch (e) {
    console.error("[StorageService] Gagal fetch buku kas dari MySQL:", e);
  }
  return [];
}

// Helper ekstraksi periode dari tanggal (YYYY-MM-DD -> "Bulan YYYY")
function derivePeriodFromDate(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).split("-");
  if (parts.length >= 2) {
    const yr = parts[0];
    const mIdx = parseInt(parts[1], 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${ALL_MONTHS[mIdx]} ${yr}`;
    }
  }
  return null;
}

export async function addCashBookEntry(entry, satker) {
  const targetSatker = satker || entry?.satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  const entryDate = entry.date || new Date().toISOString().split("T")[0];
  const derivedPeriod = entry.period || derivePeriodFromDate(entryDate);

  const newEntry = {
    ...entry,
    period: derivedPeriod || null,
    satker: targetSatker,
    date: entryDate,
    source: entry.source || "manual",
  };

  try {
    await apiFetch("/api/cashbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEntry),
    });
  } catch (e) {
    console.error("[StorageService] Gagal simpan mutasi kas ke MySQL:", e);
  }

  await refreshPeriodsWithData(targetSatker);
  return fetchCashBook(targetSatker);
}

export async function addCashBookEntriesBatch(newEntries = [], satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  if (!Array.isArray(newEntries) || newEntries.length === 0) return fetchCashBook(targetSatker);

  const preparedEntries = newEntries.map((entry) => {
    const entryDate = entry.date || new Date().toISOString().split("T")[0];
    const derivedPeriod = entry.period || derivePeriodFromDate(entryDate);
    return {
      ...entry,
      period: derivedPeriod || null,
      satker: targetSatker,
      date: entryDate,
      source: entry.source || "manual",
    };
  });

  try {
    await apiFetch("/api/cashbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preparedEntries),
    });
  } catch (e) {
    console.error("[StorageService] Gagal simpan batch kas ke MySQL:", e);
  }

  await refreshPeriodsWithData(targetSatker);
  return fetchCashBook(targetSatker);
}

export async function deleteCashBookEntry(id, satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";

  if (String(id).startsWith("dues_")) {
    const targetPeriod = String(id).replace("dues_", "");
    await clearPeriodData(targetPeriod, targetSatker);
  }

  try {
    await apiFetch(`/api/cashbook?id=${encodeURIComponent(id)}&satker=${encodeURIComponent(targetSatker)}`, {
      method: "DELETE",
    });
  } catch (e) {
    console.error("[StorageService] Gagal hapus mutasi kas dari MySQL:", e);
  }

  return fetchCashBook(targetSatker);
}

export async function fetchTournaments() {
  return [];
}

// ==========================================
// 3. PENGATURAN SATKER & PEJABAT (MySQL)
// ==========================================

let inMemorySettings = {};

function getDefaultSettings(targetSatker) {
  const defaultCity = targetSatker.replace("Pengadilan Agama ", "").replace("Pengadilan Tinggi Agama ", "").trim() || "Gunung Sugih";
  return {
    satker: targetSatker,
    institution: targetSatker.toUpperCase(),
    branch: `CABANG ${targetSatker.toUpperCase()}`,
    city: defaultCity,
    treasurerName: "Wulan Febrianti, A.Md",
    treasurer_name: "Wulan Febrianti, A.Md",
    treasurerTitle: "Bendahara Kantor",
    treasurer_title: "Bendahara Kantor",
    chairmanName: "Dr. H. Al Fitri",
    chairperson_name: "Dr. H. Al Fitri",
    chairmanTitle: "Ketua Cabang PTWP",
    chairperson_title: "Ketua Cabang PTWP",
    bank_name: "Bank Syariah Indonesia (BSI)",
    bank_account: "",
    bank_holder: `PTWP Cabang ${targetSatker}`,
  };
}

export function fetchSettings(satker) {
  const targetSatker = satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  if (isClient()) {
    apiFetch(`/api/settings?satker=${encodeURIComponent(targetSatker)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          inMemorySettings[targetSatker] = json.data;
        }
      })
      .catch(() => {});
  }
  return inMemorySettings[targetSatker] || getDefaultSettings(targetSatker);
}

export async function saveSettings(newSettings, satker) {
  const targetSatker = satker || newSettings?.satker || getCurrentUser()?.satker || "Pengadilan Agama Gunung Sugih";
  inMemorySettings[targetSatker] = { ...newSettings, satker: targetSatker };

  if (isClient()) {
    try {
      await apiFetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newSettings, satker: targetSatker }),
      });
    } catch (e) {
      console.error("[StorageService] Gagal menyimpan pengaturan ke MySQL:", e);
    }
  }

  return inMemorySettings[targetSatker];
}

// ==========================================
// 4. AUTENTIKASI & PENGGUNA (MySQL)
// ==========================================

export const INITIAL_USERS = [
  {
    username: "user test",
    name: "User Test PA Gunung Sugih",
    satker: "Pengadilan Agama Gunung Sugih",
    role: "bendahara",
  },
  {
    username: "bendahara",
    name: "Bendahara PA Gunung Sugih",
    satker: "Pengadilan Agama Gunung Sugih",
    role: "bendahara",
  },
  {
    username: "bendahara_pta",
    name: "Tata Usaha PTA",
    satker: "Pengadilan Tinggi Agama Bandar Lampung",
    role: "bendahara",
  },
];

let inMemoryUsers = [];

export function getRegisteredUsers() {
  if (isClient() && inMemoryUsers.length === 0) {
    apiFetch("/api/users")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          inMemoryUsers = json.data;
        }
      })
      .catch(() => {});
  }
  return inMemoryUsers.length > 0 ? inMemoryUsers : INITIAL_USERS;
}

export function getCurrentUser() {
  if (!isClient()) return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function verifyCredentials(selectedSatker, identifier, password) {
  try {
    const res = await apiFetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ satker: selectedSatker, identifier, password }),
    });
    const json = await res.json();
    return json;
  } catch (e) {
    return { success: false, error: "Gagal terhubung ke server database." };
  }
}

export function loginUser(userData, password, selectedSatker) {
  if (!isClient()) return userData;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
  } catch (e) {}
  return userData;
}

export async function registerUser(userData) {
  try {
    const res = await apiFetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: "Gagal mengirim pendaftaran ke server." };
  }
}

export function logoutUser() {
  if (!isClient()) return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {}
}

let inMemoryRequests = [];

export function getAccountRequests() {
  if (isClient() && inMemoryRequests.length === 0) {
    apiFetch("/api/requests")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          inMemoryRequests = json.data;
        }
      })
      .catch(() => {});
  }
  return inMemoryRequests;
}

export async function saveAccountRequests(requests) {
  return requests;
}

export async function approveAccountRequest(requestId, initialPassword = "123") {
  try {
    const res = await apiFetch("/api/requests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: requestId, action: "approve" }),
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function rejectAccountRequest(requestId) {
  try {
    const res = await apiFetch("/api/requests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: requestId, action: "reject" }),
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function deleteAccountRequest(requestId) {
  try {
    const res = await apiFetch(`/api/requests?id=${encodeURIComponent(requestId)}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function deleteRegisteredUser(username) {
  try {
    const res = await apiFetch(`/api/users?username=${encodeURIComponent(username)}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function addDirectUser(userData) {
  try {
    const res = await apiFetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ==========================================
// 5. JEJAK REKAM AUDIT TERPADU (AUDIT TRAIL)
// ==========================================

export async function fetchAuditLogs({ satker = "ALL", module = "ALL", search = "", limit = 150 } = {}) {
  if (!isClient()) return { success: true, data: [], stats: {} };
  try {
    const params = new URLSearchParams();
    if (satker && satker !== "ALL" && satker !== "Semua Satker") params.append("satker", satker);
    if (module && module !== "ALL" && module !== "Semua Modul") params.append("module", module);
    if (search && search.trim()) params.append("search", search.trim());
    params.append("limit", String(limit));

    const res = await apiFetch(`/api/audit?${params.toString()}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        return json;
      }
    }
  } catch (e) {
    console.error("[StorageService] Gagal fetch audit logs dari MySQL:", e);
  }
  return { success: false, data: [], stats: {} };
}

export async function addAuditLog(entry = {}) {
  if (!isClient()) return;
  try {
    const currentUser = getCurrentUser();
    const payload = {
      satker: entry.satker || currentUser?.satker || "Pengadilan Agama Gunung Sugih",
      userId: currentUser?.id || null,
      userName: entry.userName || currentUser?.name || "Pengguna Sistem",
      userRole: entry.userRole || currentUser?.roleLabel || currentUser?.role || "Bendahara",
      action: entry.action || "UPDATE",
      module: entry.module || "Umum",
      entityId: entry.entityId || null,
      period: entry.period || null,
      oldValue: entry.oldValue || null,
      newValue: entry.newValue || null,
      description: entry.description || "",
      ipAddress: "127.0.0.1",
    };

    await apiFetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("[StorageService] Gagal merekam audit log:", e);
  }
}
