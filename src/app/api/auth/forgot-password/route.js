import crypto from "crypto";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  hashPassword,
  createCaptchaToken,
  verifyCaptchaToken,
  hashRedeemCode,
  createResetGrantToken,
  verifyResetGrantToken,
  getClientIp,
} from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

const CAPTCHA_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const REDEEM_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const REDEEM_TTL_MINUTES = 15;

// Simpan nonce CAPTCHA yang sudah dipakai agar token yang sama tidak bisa dipakai berulang
const usedCaptchaNonces = new Map();

function cleanupUsedNonces() {
  const now = Date.now();
  for (const [nonce, exp] of usedCaptchaNonces.entries()) {
    if (exp <= now) usedCaptchaNonces.delete(nonce);
  }
}

let tableEnsured = false;
async function ensurePasswordResetsTable() {
  if (tableEnsured) return;
  await query(`
    CREATE TABLE IF NOT EXISTS \`password_resets\` (
      \`id\` VARCHAR(64) PRIMARY KEY,
      \`user_id\` INT NOT NULL,
      \`username\` VARCHAR(100) NOT NULL,
      \`satker\` VARCHAR(255) NOT NULL,
      \`redeem_code_hash\` VARCHAR(255) NOT NULL,
      \`expires_at\` DATETIME NOT NULL,
      \`used_at\` DATETIME NULL DEFAULT NULL,
      \`ip_address\` VARCHAR(50) DEFAULT '127.0.0.1',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX \`idx_pr_username\` (\`username\`),
      INDEX \`idx_pr_hash\` (\`redeem_code_hash\`),
      INDEX \`idx_pr_expires\` (\`expires_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  tableEnsured = true;
}

function normalizePhone(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("62")) {
    digits = "0" + digits.slice(2);
  }
  return digits;
}

function generateRandomCode(alphabet, length) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return out;
}

function buildCaptchaSvg(code) {
  const width = 170;
  const height = 52;
  const colors = ["#0f5132", "#146c43", "#1e293b", "#b45309", "#0369a1"];

  let noiseLines = "";
  for (let i = 0; i < 6; i++) {
    const x1 = crypto.randomInt(0, width);
    const y1 = crypto.randomInt(0, height);
    const x2 = crypto.randomInt(0, width);
    const y2 = crypto.randomInt(0, height);
    const color = colors[crypto.randomInt(0, colors.length)];
    noiseLines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-opacity="0.28" stroke-width="1.4" />`;
  }

  let noiseDots = "";
  for (let i = 0; i < 24; i++) {
    const cx = crypto.randomInt(4, width - 4);
    const cy = crypto.randomInt(4, height - 4);
    const r = (crypto.randomInt(10, 22) / 10).toFixed(1);
    noiseDots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#64748b" fill-opacity="0.25" />`;
  }

  let chars = "";
  const startX = 20;
  const stepX = 27;
  for (let i = 0; i < code.length; i++) {
    const x = startX + i * stepX + crypto.randomInt(-2, 3);
    const y = 34 + crypto.randomInt(-5, 5);
    const rotate = crypto.randomInt(-18, 19);
    const color = colors[crypto.randomInt(0, colors.length)];
    chars += `<text x="${x}" y="${y}" fill="${color}" font-family="monospace" font-size="24" font-weight="800" transform="rotate(${rotate} ${x} ${y})">${code[i]}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" rx="10" fill="#f1f5f9" />
    ${noiseLines}
    ${noiseDots}
    ${chars}
  </svg>`;
}

// GET: Muat tantangan CAPTCHA baru
export async function GET() {
  try {
    const captchaText = generateRandomCode(CAPTCHA_ALPHABET, 5);
    const captchaToken = createCaptchaToken(captchaText);
    const captchaSvg = buildCaptchaSvg(captchaText);

    return NextResponse.json({
      success: true,
      captchaToken,
      captchaSvg,
    });
  } catch (err) {
    console.error("[Forgot Password CAPTCHA Error]:", err);
    return NextResponse.json({ success: false, error: "Gagal membuat CAPTCHA." }, { status: 500 });
  }
}

// POST:
// - action: "request"       -> Step 1: Verifikasi Nama + Email + No. WA + CAPTCHA -> terbitkan Kode Redeem
// - action: "verify_redeem" -> Step 3: Verifikasi Kode Redeem terlebih dahulu -> terbitkan resetGrantToken
// - action: "redeem"        -> Step 4: Simpan Password Baru & hanguskan Kode Redeem secara atomik
export async function POST(request) {
  try {
    await ensurePasswordResetsTable();
    const body = await request.json();
    const action = body?.action || "request";

    // =========================================================================
    // ACTION 1: Verifikasi Nama + Email + No. WA + CAPTCHA -> Kode Redeem
    // =========================================================================
    if (action === "request") {
      const cleanName = String(body.name || "").trim().toLowerCase();
      const cleanEmail = String(body.email || "").trim().toLowerCase();
      const normInputPhone = normalizePhone(body.phone);
      const captchaToken = body.captchaToken;
      const captchaInput = body.captchaInput;

      if (!cleanName || cleanName.length < 2) {
        return NextResponse.json(
          { success: false, error: "Mohon masukkan Nama Lengkap atau Username akun Anda." },
          { status: 400 }
        );
      }

      if (!cleanEmail || !cleanEmail.includes("@")) {
        return NextResponse.json(
          { success: false, error: "Mohon masukkan Alamat Email yang valid." },
          { status: 400 }
        );
      }

      if (!normInputPhone || normInputPhone.length < 8) {
        return NextResponse.json(
          { success: false, error: "Mohon masukkan nomor WhatsApp yang valid (minimal 8 digit)." },
          { status: 400 }
        );
      }

      cleanupUsedNonces();
      const captchaCheck = verifyCaptchaToken(captchaToken, captchaInput);
      if (!captchaCheck.valid) {
        return NextResponse.json(
          { success: false, error: captchaCheck.reason, refreshCaptcha: true },
          { status: 400 }
        );
      }

      if (usedCaptchaNonces.has(captchaCheck.nonce)) {
        return NextResponse.json(
          { success: false, error: "CAPTCHA sudah digunakan. Silakan muat ulang CAPTCHA.", refreshCaptcha: true },
          { status: 400 }
        );
      }
      usedCaptchaNonces.set(captchaCheck.nonce, Date.now() + 5 * 60 * 1000);

      // Cari akun aktif yang Nama/Username DAN Email-nya cocok
      const candidates = await query(
        `SELECT id, username, name, email, phone, satker, role, status
         FROM users
         WHERE status = 'active'
           AND (LOWER(TRIM(name)) = ? OR LOWER(TRIM(username)) = ?)
           AND LOWER(TRIM(email)) = ?`,
        [cleanName, cleanName, cleanEmail]
      );

      const matchedUser = (candidates || []).find((u) => {
        const normUserPhone = normalizePhone(u.phone);
        return normUserPhone.length >= 8 && normUserPhone === normInputPhone;
      });

      if (!matchedUser) {
        return NextResponse.json(
          {
            success: false,
            error: "Data Nama, Alamat Email, dan Nomor WhatsApp tidak cocok dengan akun aktif mana pun.",
            refreshCaptcha: true,
          },
          { status: 404 }
        );
      }

      // Nonaktifkan seluruh kode redeem lama yang belum dipakai untuk akun ini
      await query(
        "UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL",
        [matchedUser.id]
      );

      // Buat kode redeem acak (unik setiap permintaan): format PTWP-XXXX-XXXX
      const part1 = generateRandomCode(REDEEM_ALPHABET, 4);
      const part2 = generateRandomCode(REDEEM_ALPHABET, 4);
      const redeemCode = `PTWP-${part1}-${part2}`;
      const redeemCodeHash = hashRedeemCode(redeemCode);
      const resetId = `RST-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
      const ipAddress = getClientIp(request);

      await query(
        `INSERT INTO password_resets (id, user_id, username, satker, redeem_code_hash, expires_at, ip_address)
         VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), ?)`,
        [
          resetId,
          matchedUser.id,
          matchedUser.username,
          matchedUser.satker,
          redeemCodeHash,
          REDEEM_TTL_MINUTES,
          ipAddress,
        ]
      );

      const timeRows = await query(
        "SELECT expires_at, TIMESTAMPDIFF(SECOND, NOW(), expires_at) AS remaining_seconds FROM password_resets WHERE id = ?",
        [resetId]
      );

      await recordAuditLog({
        request,
        user: matchedUser,
        satker: matchedUser.satker || "PTWP",
        action: "FORGOT_PASSWORD_REQUEST",
        module: "Autentikasi",
        entityId: matchedUser.username,
        description: `Permintaan reset password & pembuatan kode redeem sementara untuk "${matchedUser.name}" (${matchedUser.username}).`,
      });

      return NextResponse.json({
        success: true,
        resetId,
        redeemCode,
        expiresInSeconds: Number(timeRows?.[0]?.remaining_seconds || REDEEM_TTL_MINUTES * 60),
        expiresAt: timeRows?.[0]?.expires_at || null,
        account: {
          name: matchedUser.name,
          email: matchedUser.email,
          username: matchedUser.username,
          satker: matchedUser.satker,
        },
      });
    }

    // =========================================================================
    // ACTION 2: Verifikasi Kode Redeem Terlebih Dahulu (sebelum form PW baru)
    // =========================================================================
    if (action === "verify_redeem") {
      const cleanCode = String(body.redeemCode || "").trim().toUpperCase().replace(/\s+/g, "");
      if (!cleanCode) {
        return NextResponse.json(
          { success: false, error: "Mohon masukkan Kode Redeem terlebih dahulu." },
          { status: 400 }
        );
      }

      const codeHash = hashRedeemCode(cleanCode);
      const rows = await query(
        `SELECT id, user_id, username, satker, used_at, expires_at,
                TIMESTAMPDIFF(SECOND, NOW(), expires_at) AS remaining_seconds
         FROM password_resets
         WHERE redeem_code_hash = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [codeHash]
      );

      if (!rows || rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Kode Redeem salah atau tidak ditemukan." },
          { status: 400 }
        );
      }

      const resetRecord = rows[0];

      if (resetRecord.used_at !== null) {
        return NextResponse.json(
          { success: false, error: "Kode Redeem ini sudah pernah dipakai dan tidak dapat digunakan lagi." },
          { status: 400 }
        );
      }

      if (Number(resetRecord.remaining_seconds) <= 0) {
        return NextResponse.json(
          { success: false, error: "Masa berlaku Kode Redeem sudah habis. Silakan lakukan verifikasi ulang." },
          { status: 400 }
        );
      }

      const resetGrantToken = createResetGrantToken({
        resetId: resetRecord.id,
        userId: resetRecord.user_id,
        username: resetRecord.username,
        satker: resetRecord.satker,
      });

      return NextResponse.json({
        success: true,
        resetGrantToken,
        remainingSeconds: Number(resetRecord.remaining_seconds),
        account: {
          username: resetRecord.username,
          satker: resetRecord.satker,
        },
      });
    }

    // =========================================================================
    // ACTION 3: Simpan Password Baru (wajib ada resetGrantToken + Kode Redeem valid)
    // =========================================================================
    if (action === "redeem") {
      const cleanCode = String(body.redeemCode || "").trim().toUpperCase().replace(/\s+/g, "");
      const resetGrantToken = body.resetGrantToken;
      const newPassword = String(body.newPassword || "").trim();
      const confirmPassword = String(body.confirmPassword || "").trim();

      const grant = verifyResetGrantToken(resetGrantToken);
      if (!grant) {
        return NextResponse.json(
          { success: false, error: "Sesi verifikasi Kode Redeem tidak valid atau sudah habis. Silakan masukkan Kode Redeem kembali." },
          { status: 400 }
        );
      }

      if (!cleanCode) {
        return NextResponse.json(
          { success: false, error: "Kode Redeem wajib disertakan." },
          { status: 400 }
        );
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "Kata sandi baru minimal harus 6 karakter." },
          { status: 400 }
        );
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json(
          { success: false, error: "Konfirmasi kata sandi baru tidak cocok." },
          { status: 400 }
        );
      }

      const codeHash = hashRedeemCode(cleanCode);
      const rows = await query(
        `SELECT id, user_id, username, satker, used_at, expires_at,
                TIMESTAMPDIFF(SECOND, NOW(), expires_at) AS remaining_seconds
         FROM password_resets
         WHERE id = ? AND redeem_code_hash = ?
         LIMIT 1`,
        [grant.resetId, codeHash]
      );

      if (!rows || rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Kode Redeem tidak cocok dengan sesi verifikasi Anda." },
          { status: 400 }
        );
      }

      const resetRecord = rows[0];

      if (resetRecord.used_at !== null) {
        return NextResponse.json(
          { success: false, error: "Kode Redeem ini sudah pernah dipakai dan tidak dapat digunakan lagi." },
          { status: 400 }
        );
      }

      if (Number(resetRecord.remaining_seconds) <= 0) {
        return NextResponse.json(
          { success: false, error: "Masa berlaku Kode Redeem sudah habis. Silakan ajukan verifikasi ulang." },
          { status: 400 }
        );
      }

      // Kunci kode secara atomik agar tidak bisa dipakai dua kali secara bersamaan
      const lockRes = await query(
        `UPDATE password_resets
         SET used_at = NOW()
         WHERE id = ? AND used_at IS NULL AND expires_at > NOW()`,
        [resetRecord.id]
      );

      if (!lockRes || lockRes.affectedRows !== 1) {
        return NextResponse.json(
          { success: false, error: "Kode Redeem sudah kedaluwarsa atau baru saja digunakan." },
          { status: 400 }
        );
      }

      const hashedNewPassword = hashPassword(newPassword);
      await query("UPDATE users SET password = ? WHERE id = ?", [hashedNewPassword, resetRecord.user_id]);

      await recordAuditLog({
        request,
        user: {
          id: resetRecord.user_id,
          username: resetRecord.username,
          name: resetRecord.username,
          satker: resetRecord.satker,
          role: "user",
        },
        satker: resetRecord.satker || "PTWP",
        action: "RESET_PASSWORD_SUCCESS",
        module: "Autentikasi",
        entityId: resetRecord.username,
        description: `Kata sandi akun "${resetRecord.username}" berhasil direset menggunakan Kode Redeem sekali pakai.`,
      });

      return NextResponse.json({
        success: true,
        username: resetRecord.username,
        satker: resetRecord.satker,
        message: "Kata sandi baru berhasil disimpan. Kode Redeem kini tidak dapat digunakan lagi.",
      });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (err) {
    console.error("[Forgot Password API Error]:", err);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server database MySQL." },
      { status: 500 }
    );
  }
}
