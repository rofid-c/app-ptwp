import crypto from "crypto";

const AUTH_SECRET = process.env.AUTH_SECRET || "ptwp_mahkamah_agung_ri_secure_session_key_2026_super_secret";

/**
 * Hash password menggunakan scrypt dengan random salt 16-byte
 * Format: $scrypt$<salt>$<hash>
 */
export function hashPassword(plainPassword) {
  if (!plainPassword) return "";
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(plainPassword), salt, 64).toString("hex");
  return `$scrypt$${salt}$${hash}`;
}

/**
 * Verifikasi password dengan dukungan timing-safe comparison dan migrasi legacy plain text
 */
export function verifyPassword(inputPassword, storedPassword) {
  if (!inputPassword || !storedPassword) return { valid: false, needsUpgrade: false };

  const inputStr = String(inputPassword).trim();
  const storedStr = String(storedPassword).trim();

  // 1. Format scrypt modern: $scrypt$<salt>$<hash>
  if (storedStr.startsWith("$scrypt$")) {
    const parts = storedStr.split("$");
    if (parts.length === 4) {
      const salt = parts[2];
      const expectedHash = parts[3];
      const actualHashBuffer = crypto.scryptSync(inputStr, salt, 64);
      const expectedHashBuffer = Buffer.from(expectedHash, "hex");

      if (actualHashBuffer.length === expectedHashBuffer.length &&
          crypto.timingSafeEqual(actualHashBuffer, expectedHashBuffer)) {
        return { valid: true, needsUpgrade: false };
      }
    }
    return { valid: false, needsUpgrade: false };
  }

  // 2. Format legacy plain text (untuk pengguna yang belum di-hash)
  // Periksa kesesuaian eksak, jika benar maka beri tanda needsUpgrade = true untuk auto-hash
  if (inputStr === storedStr) {
    return { valid: true, needsUpgrade: true };
  }

  return { valid: false, needsUpgrade: false };
}

/**
 * Buat JWT-like signed token sederhana berbasis HMAC SHA-256
 */
export function createSessionToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    name: user.name,
    satker: user.satker,
    role: user.role,
    roleLabel: user.role_label || user.roleLabel,
    level: user.level,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 hari
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

/**
 * Verifikasi dan decode signed session token
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadBase64, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature);
  const expSigBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expSigBuffer)) {
    return null; // Tanda tangan tidak valid (tampered)
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf-8"));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Token kedaluwarsa
    }
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Ekstraksi pengguna terautentikasi dari request (Headers / Cookies)
 */
export function getAuthenticatedUser(request) {
  if (!request) return null;

  // 1. Dari Header Authorization: Bearer <token>
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.substring(7).trim();
    const user = verifySessionToken(token);
    if (user) return user;
  }

  // 2. Dari Header Khusus x-auth-token
  const customHeader = request.headers.get("x-auth-token");
  if (customHeader) {
    const user = verifySessionToken(customHeader.trim());
    if (user) return user;
  }

  // 3. Dari Cookies: ptwp_token
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/ptwp_token=([^;]+)/);
    if (match && match[1]) {
      const user = verifySessionToken(decodeURIComponent(match[1]));
      if (user) return user;
    }
  }

  return null;
}

/**
 * Multi-Tenant Satker Enforcement:
 * Menjamin isolasi ketat antar cabang:
 * - Super Admin: Akses penuh ke seluruh satker.
 * - Pengurus Daerah (PTA): Boleh membaca (read) seluruh cabang, tetapi write/delete dikunci ke satker PTA.
 * - Satker Cabang: HANYA boleh mengakses & mengubah data satker miliknya sendiri. Akses ke satker lain DIBLOKIR.
 */
export function enforceSatkerAccess(request, requestedSatker, action = "read") {
  const user = getAuthenticatedUser(request);

  // Jika tidak ada user login sama sekali
  if (!user) {
    return {
      authorized: false,
      user: null,
      targetSatker: null,
      error: "Autentikasi Diperlukan: Silakan masuk (login) ke akun Anda terlebih dahulu.",
      statusCode: 401,
    };
  }

  const userSatkerNorm = String(user.satker || "").trim().toLowerCase();
  const reqSatkerNorm = requestedSatker ? String(requestedSatker).trim().toLowerCase() : "";

  const isSuperAdmin =
    user.role === "super_admin" ||
    user.level === "super_admin" ||
    String(user.username || "").toLowerCase() === "aku admin" ||
    String(user.username || "").toLowerCase() === "root";

  const isPTA =
    user.level === "daerah" ||
    userSatkerNorm.includes("tinggi") ||
    userSatkerNorm.includes("pta");

  // 1. Super Admin: Akses bebas ke satker mana pun
  if (isSuperAdmin) {
    return {
      authorized: true,
      user,
      targetSatker: requestedSatker || user.satker || "Pengadilan Agama Gunung Sugih",
    };
  }

  // 2. Pengurus Daerah (PTA):
  // - Jika READ: boleh melihat data seluruh cabang (monitoring)
  // - Jika WRITE/DELETE: hanya boleh mengubah data PTA itu sendiri
  if (isPTA) {
    if (action === "read") {
      return {
        authorized: true,
        user,
        targetSatker: requestedSatker || user.satker,
      };
    }

    if (reqSatkerNorm && reqSatkerNorm !== userSatkerNorm) {
      return {
        authorized: false,
        user,
        targetSatker: user.satker,
        error: `Akses Ditolak: Pengurus Daerah hanya memiliki wewenang mengubah data ${user.satker}.`,
        statusCode: 403,
      };
    }

    return {
      authorized: true,
      user,
      targetSatker: user.satker,
    };
  }

  // 3. User Cabang (PA Gunung Sugih, PA Metro, dll):
  // ISOLASI KETAT: Jika mencoba mengakses/mengubah satker lain, tolak dengan 403 Forbidden!
  if (reqSatkerNorm && reqSatkerNorm !== userSatkerNorm) {
    return {
      authorized: false,
      user,
      targetSatker: user.satker,
      error: `Akses Ditolak (Pelanggaran Isolasi Satker): Anda terdaftar pada "${user.satker}" dan tidak diizinkan mengakses atau mengubah data "${requestedSatker}".`,
      statusCode: 403,
    };
  }

  // Selalu kunci targetSatker ke user.satker yang sah dari token
  return {
    authorized: true,
    user,
    targetSatker: user.satker,
  };
}

