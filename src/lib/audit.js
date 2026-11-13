import { query } from "@/lib/db";
import { getClientIp, getAuthenticatedUser } from "@/lib/auth";

/**
 * Rekam jejak audit internal sistem (Immutable Audit Trail)
 * Log audit HANYA dapat dicatat secara internal oleh transaksi sistem backend,
 * tidak dapat dipalsukan, diubah (PUT), atau dihapus (DELETE) oleh client.
 * Identitas aktor (user_name, user_role, user_id) serta IP address
 * dijamin valid karena diekstraksi langsung dari session token kriptografis.
 */
export async function recordAuditLog({
  request = null,
  user = null,
  satker = null,
  action,
  module = "Umum",
  entityId = null,
  period = null,
  oldValue = null,
  newValue = null,
  description = "",
}) {
  try {
    const authUser = user || (request ? getAuthenticatedUser(request) : null);
    const userId = authUser?.id || null;
    const userName = authUser?.name || authUser?.username || "Sistem";
    const userRole = authUser?.roleLabel || authUser?.role || "Bendahara";
    const targetSatker = satker || authUser?.satker || "PTWP";
    const ipAddress = request ? getClientIp(request) : "127.0.0.1";

    const oldStr = oldValue ? (typeof oldValue === "string" ? oldValue : JSON.stringify(oldValue)) : null;
    const newStr = newValue ? (typeof newValue === "string" ? newValue : JSON.stringify(newValue)) : null;

    const res = await query(
      `INSERT INTO audit_logs (satker, user_id, user_name, user_role, action, module, entity_id, period, old_value, new_value, description, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        targetSatker,
        userId,
        userName,
        userRole,
        action,
        module,
        entityId ? String(entityId) : null,
        period ? String(period) : null,
        oldStr,
        newStr,
        description,
        ipAddress,
      ]
    );

    return res?.insertId || true;
  } catch (err) {
    console.error("[Audit Trail Log Error]:", err?.message || err);
    return null;
  }
}

