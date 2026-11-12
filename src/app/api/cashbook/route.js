import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { enforceSatkerAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedSatker = searchParams.get("satker");

    // Otorisasi & Penegakan Isolasi Satker
    const auth = enforceSatkerAccess(request, requestedSatker, "read");
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.statusCode });
    }
    const satker = auth.targetSatker;

    const rows = await query("SELECT * FROM cashbook WHERE satker = ? ORDER BY date DESC, id DESC", [satker]);
    const formatted = rows.map((r) => ({
      ...r,
      amount: Number(r.amount || 0),
    }));
    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const firstRequestedSatker = Array.isArray(body) ? body[0]?.satker : body?.satker;

    // Otorisasi & Penegakan Isolasi Satker
    const auth = enforceSatkerAccess(request, firstRequestedSatker, "write");
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.statusCode });
    }
    const safeSatker = auth.targetSatker;
    const actorName = auth.user.name || "Bendahara Cabang";
    const actorRole = auth.user.roleLabel || auth.user.role || "Bendahara";

    // Dukungan Batch Insert untuk banyak transaksi kas & belanja sekaligus
    if (Array.isArray(body)) {
      if (body.length === 0) return NextResponse.json({ success: true, count: 0 });

      const values = body.map((item, idx) => [
        item.id || `CB-${Date.now()}-${idx}`,
        safeSatker,
        item.date || new Date().toISOString().split("T")[0],
        item.type || "out",
        item.category || "Operasional Lapangan",
        Number(item.amount || 0),
        item.description || "",
        item.source || "manual",
        item.period || null,
      ]);

      // Batch insert dengan chunking aman (50 rows per query) untuk menghindari limit placeholder MySQL
      const chunkSize = 50;
      for (let i = 0; i < values.length; i += chunkSize) {
        const chunk = values.slice(i, i + chunkSize);
        const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
        const flatValues = chunk.flat();

        await query(
          `INSERT INTO cashbook (id, satker, date, type, category, amount, description, source, period)
           VALUES ${placeholders}
           ON DUPLICATE KEY UPDATE date=VALUES(date), type=VALUES(type), category=VALUES(category), amount=VALUES(amount), description=VALUES(description), source=VALUES(source), period=VALUES(period)`,
          flatValues
        );
      }

      // Rekam jejak audit batch kas
      try {
        const first = body[0];
        await query(
          `INSERT INTO audit_logs (satker, user_name, user_role, action, module, entity_id, period, old_value, new_value, description)
           VALUES (?, ?, ?, 'ADD_CASH_BATCH', 'Buku Kas', ?, ?, NULL, ?, ?)`,
          [
            safeSatker,
            actorName,
            actorRole,
            `batch_${Date.now()}`,
            first?.period || null,
            JSON.stringify({ count: body.length }),
            `Pencatatan batch transaksi kas/belanja sebanyak ${body.length} baris untuk ${safeSatker}.`,
          ]
        );
      } catch (e) {}

      return NextResponse.json({ success: true, count: body.length });
    }

    const { id, date, type, category, amount, description, source, period } = body;

    const entryId = id || `CB-${Date.now()}`;
    await query(
      `INSERT INTO cashbook (id, satker, date, type, category, amount, description, source, period)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE date=VALUES(date), type=VALUES(type), category=VALUES(category), amount=VALUES(amount), description=VALUES(description), source=VALUES(source), period=VALUES(period)`,
      [entryId, safeSatker, date, type, category, amount, description, source || "manual", period || null]
    );

    // Rekam jejak audit transaksi kas
    try {
      const tipeLabel = type === "in" ? "Kas Masuk" : "Kas Keluar / Belanja";
      await query(
        `INSERT INTO audit_logs (satker, user_name, user_role, action, module, entity_id, period, old_value, new_value, description)
         VALUES (?, ?, ?, 'ADD_CASH', 'Buku Kas', ?, ?, NULL, ?, ?)`,
        [
          safeSatker,
          actorName,
          actorRole,
          entryId,
          period || null,
          JSON.stringify({ type, category, amount: Number(amount || 0), description }),
          `Pencatatan ${tipeLabel}: Rp ${Number(amount || 0).toLocaleString("id-ID")} (${category} - "${description}").`,
        ]
      );
    } catch (e) {}

    return NextResponse.json({ success: true, id: entryId });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedSatker = searchParams.get("satker");

    // Otorisasi & Penegakan Isolasi Satker
    const auth = enforceSatkerAccess(request, requestedSatker, "delete");
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.statusCode });
    }
    const satker = auth.targetSatker;
    const actorName = auth.user.name || "Bendahara Cabang";
    const id = searchParams.get("id");
    const period = searchParams.get("period");
    const clearAll = searchParams.get("clearAll");

    if (clearAll === "true") {
      await query("DELETE FROM cashbook WHERE satker = ?", [satker]);
      return NextResponse.json({ success: true, message: `Seluruh data buku kas ${satker} berhasil dikosongkan.` });
    }

    if (period) {
      await query("DELETE FROM cashbook WHERE satker = ? AND (period = ? OR description LIKE ? OR id LIKE ?)", [
        satker,
        period,
        `%${period}%`,
        `%${period}%`,
      ]);
      return NextResponse.json({ success: true, message: `Data kas periode ${period} (${satker}) berhasil dikosongkan.` });
    }

    if (!id) return NextResponse.json({ success: false, error: "ID mutasi kas wajib diisi." });

    // Ambil info data kas sebelum dihapus untuk audit trail
    const existingRows = await query("SELECT * FROM cashbook WHERE id = ? AND satker = ?", [id, satker]);
    const existingEntry = existingRows && existingRows.length > 0 ? existingRows[0] : null;

    await query("DELETE FROM cashbook WHERE id = ? AND satker = ?", [id, satker]);

    try {
      const actorName = searchParams.get("userName") || "Bendahara Cabang";
      await query(
        `INSERT INTO audit_logs (satker, user_name, user_role, action, module, entity_id, period, old_value, new_value, description)
         VALUES (?, ?, 'Bendahara', 'DELETE_CASH', 'Buku Kas', ?, ?, ?, NULL, ?)`,
        [
          satker,
          actorName,
          id,
          existingEntry?.period || null,
          existingEntry ? JSON.stringify({ type: existingEntry.type, amount: Number(existingEntry.amount), description: existingEntry.description }) : null,
          `Penghapusan mutasi kas ID "${id}": ${existingEntry?.description || "-"} (Rp ${Number(existingEntry?.amount || 0).toLocaleString("id-ID")}).`,
        ]
      );
    } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
