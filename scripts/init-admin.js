/**
 * Skrip CLI Inisialisasi & Reset Akun Super Administrator PTWP
 * 
 * Penggunaan interaktif:
 *   node scripts/init-admin.js
 * 
 * Penggunaan non-interaktif (otomatis / CI/CD):
 *   node scripts/init-admin.js --username="superadmin" --password="PasswordKuat123!"
 */

const crypto = require("crypto");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

// Muat variabel environment dari .env.local atau .env secara native tanpa dependensi tambahan
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx > 0) {
            const k = trimmed.substring(0, eqIdx).trim();
            const v = trimmed.substring(eqIdx + 1).trim().replace(/^["'](.*)["']$/, "$1");
            if (!process.env[k]) {
              process.env[k] = v;
            }
          }
        }
      });
    }
  }
}
loadEnv();

function hashPassword(plainPassword) {
  if (!plainPassword) return "";
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(plainPassword), salt, 64).toString("hex");
  return `$scrypt$${salt}$${hash}`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (const arg of args) {
    if (arg.startsWith("--")) {
      const [key, ...vals] = arg.slice(2).split("=");
      parsed[key] = vals.join("=");
    }
  }
  return parsed;
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("\n=======================================================");
  console.log("   SETUP & INISIALISASI ADMINISTRATOR SISTEM PTWP");
  console.log("=======================================================\n");

  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "db_ptwp",
  };

  let pool;
  try {
    pool = mysql.createPool(dbConfig);
    const conn = await pool.getConnection();
    conn.release();
    console.log(`[OK] Terhubung ke MySQL basis data: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}\n`);
  } catch (err) {
    console.error(`[ERROR] Gagal terhubung ke MySQL:`, err.message);
    console.error(`Pastikan MySQL berjalan dan periksa konfigurasi .env.local.`);
    process.exit(1);
  }

  const cliArgs = parseArgs();
  let username = cliArgs.username;
  let password = cliArgs.password;
  let name = cliArgs.name || "Super Administrator PTWP";
  let email = cliArgs.email || "superadmin@mahkamahagung.go.id";

  if (!username || !password) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      if (!username) {
        username = await ask(rl, "Masukkan Username Administrator [default: superadmin]: ");
        if (!username) username = "superadmin";
      }

      if (!name) {
        name = await ask(rl, "Masukkan Nama Lengkap [default: Super Administrator PTWP]: ");
        if (!name) name = "Super Administrator PTWP";
      }

      if (!email) {
        email = await ask(rl, "Masukkan Email Administrator [default: admin@ptwp.local]: ");
        if (!email) email = "admin@ptwp.local";
      }

      while (!password || password.length < 8) {
        password = await ask(rl, "Masukkan Kata Sandi Baru (minimal 8 karakter): ");
        if (!password || password.length < 8) {
          console.log("Kata sandi terlalu pendek! Minimal harus 8 karakter.");
        }
      }

      const confirmPass = await ask(rl, "Ulangi Kata Sandi untuk konfirmasi: ");
      if (password !== confirmPass) {
        console.error("\n[GAGAL] Konfirmasi kata sandi tidak cocok. Inisialisasi dibatalkan.");
        rl.close();
        process.exit(1);
      }

      rl.close();
    } catch (e) {
      rl.close();
      console.error(e);
      process.exit(1);
    }
  }

  if (password.length < 8) {
    console.error("[ERROR] Kata sandi harus memiliki panjang minimal 8 karakter.");
    process.exit(1);
  }

  const hashedPassword = hashPassword(password);
  const satker = "Pengadilan Tinggi Agama Bandar Lampung";
  const title = "Administrator Daerah PTA";
  const role = "admin";
  const roleLabel = "Administrator PTA Bandar Lampung";
  const level = "daerah";

  try {
    await pool.query(
      `INSERT INTO users (username, password, name, phone, email, satker, title, role, role_label, level, status)
       VALUES (?, ?, ?, '081299998888', ?, ?, ?, ?, ?, ?, 'active')
       ON DUPLICATE KEY UPDATE 
         password = VALUES(password),
         name = VALUES(name),
         email = VALUES(email),
         satker = VALUES(satker),
         title = VALUES(title),
         role = VALUES(role),
         role_label = VALUES(role_label),
         level = VALUES(level),
         status = 'active'`,
      [username, hashedPassword, name, email, satker, title, role, roleLabel, level]
    );

    console.log("\n-------------------------------------------------------");
    console.log(" [BERHASIL] Akun Administrator PTA berhasil disimpan!");
    console.log(` - Username : ${username}`);
    console.log(` - Nama     : ${name}`);
    console.log(` - Email    : ${email}`);
    console.log(` - Role     : ${roleLabel}`);
    console.log(` - Satker   : ${satker}`);
    console.log(` - Keamanan : Terenkripsi scrypt dengan random salt`);
    console.log("-------------------------------------------------------\n");
  } catch (dbErr) {
    console.error("[ERROR] Gagal menyimpan akun administrator:", dbErr.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
