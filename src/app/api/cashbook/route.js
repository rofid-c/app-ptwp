import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { enforceSatkerAccess } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

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
      await recordAuditLog({
        request,
        user: auth.user,
        satker: safeSatker,
        action: "ADD_CASH_BATCH",
        module: "Buku Kas",
        entityId: `batch_${Date.now()}`,
        period: body[0]?.period || null,
        newValue: { count: body.length },
        description: `Pencatatan batch transaksi kas/belanja sebanyak ${body.length} baris untuk ${safeSatker}.`,
      });

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
    const tipeLabel = type === "in" ? "Kas Masuk" : "Kas Keluar / Belanja";
    await recordAuditLog({
      request,
      user: auth.user,
      satker: safeSatker,
      action: "ADD_CASH",
      module: "Buku Kas",
      entityId: entryId,
      period: period || null,
      newValue: { type, category, amount: Number(amount || 0), description },
      description: `Pencatatan ${tipeLabel}: Rp ${Number(amount || 0).toLocaleString("id-ID")} (${category} - "${description}").`,
    });

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
    const id = searchParams.get("id");
    const period = searchParams.get("period");
    const clearAll = searchParams.get("clearAll");

    if (clearAll === "true") {
      await query("DELETE FROM cashbook WHERE satker = ?", [satker]);

      await recordAuditLog({
        request,
        user: auth.user,
        satker,
        action: "DELETE_ALL_CASH",
        module: "Buku Kas",
        entityId: "all",
        description: `Pengosongan seluruh data buku kas untuk ${satker}.`,
      });

      return NextResponse.json({ success: true, message: `Seluruh data buku kas ${satker} berhasil dikosongkan.` });
    }

    if (period) {
      await query("DELETE FROM cashbook WHERE satker = ? AND (period = ? OR description LIKE ? OR id LIKE ?)", [
        satker,
        period,
        `%${period}%`,
        `%${period}%`,
      ]);

      await recordAuditLog({
        request,
        user: auth.user,
        satker,
        action: "DELETE_PERIOD_CASH",
        module: "Buku Kas",
        entityId: period,
        period,
        description: `Pengosongan data kas periode ${period} (${satker}).`,
      });

      return NextResponse.json({ success: true, message: `Data kas periode ${period} (${satker}) berhasil dikosongkan.` });
    }

    if (!id) return NextResponse.json({ success: false, error: "ID mutasi kas wajib diisi." });

    // Ambil info data kas sebelum dihapus untuk audit trail
    const existingRows = await query("SELECT * FROM cashbook WHERE id = ? AND satker = ?", [id, satker]);
    const existingEntry = existingRows && existingRows.length > 0 ? existingRows[0] : null;

    await query("DELETE FROM cashbook WHERE id = ? AND satker = ?", [id, satker]);

    await recordAuditLog({
      request,
      user: auth.user,
      satker,
      action: "DELETE_CASH",
      module: "Buku Kas",
      entityId: id,
      period: existingEntry?.period || null,
      oldValue: existingEntry ? { type: existingEntry.type, amount: Number(existingEntry.amount), description: existingEntry.description } : null,
      description: `Penghapusan mutasi kas ID "${id}": ${existingEntry?.description || "-"} (Rp ${Number(existingEntry?.amount || 0).toLocaleString("id-ID")}).`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
