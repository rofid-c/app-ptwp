import mysql from "mysql2/promise";

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "db_ptwp",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: "utf8mb4",
    });
  }
  return pool;
}

export async function query(sql, params = []) {
  try {
    const p = getPool();
    const [rows, fields] = await p.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("[Database Query Error]:", error.message);
    throw error;
  }
}

export async function checkConnection() {
  try {
    const p = getPool();
    const connection = await p.getConnection();
    connection.release();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export default { getPool, query, checkConnection };
