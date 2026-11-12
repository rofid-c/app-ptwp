import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Unduh dokumen Excel asli atau ambil status arsip dokumen cabang
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const satker = searchParams.get("satker");
    const download = searchParams.get("download") === "true";
    const year = searchParams.get("year") || "2026";

    if (!satker) {
      return NextResponse.json({ success: false, error: "Parameter satker wajib diisi." }, { status: 400 });
    }

    // Ambil dokumen terbaru untuk satker & tahun bersangkutan
    const rows = await query(
      "SELECT id, satker, filename, file_size, mime_type, year, uploaded_by, created_at, file_data FROM expense_documents WHERE satker = ? ORDER BY created_at DESC LIMIT 1",
      [satker]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Belum ada dokumen Excel asli yang diunggah oleh cabang ini." },
        { status: 404 }
      );
    }

    const doc = rows[0];

    // Jika download=true, kembalikan binary file murni (.xlsx)
    if (download) {
      const buffer = Buffer.from(doc.file_data);
      const safeFilename = encodeURIComponent(doc.filename || `Dokumen_Asli_Pengeluaran_${satker}.xlsx`);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": doc.mime_type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${doc.filename}"; filename*=UTF-8''${safeFilename}`,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // Jika hanya cek metadata ketersediaan dokumen
    return NextResponse.json({
      success: true,
      hasDocument: true,
      document: {
        id: doc.id,
        satker: doc.satker,
        filename: doc.filename,
        fileSize: doc.file_size,
        year: doc.year,
        uploadedBy: doc.uploaded_by,
        createdAt: doc.created_at,
      },
    });
  } catch (err) {
    console.error("[API Expense Documents GET Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Simpan file Excel asli yang diunggah oleh cabang ke MySQL LONGBLOB
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const satker = formData.get("satker") || "Pengadilan Agama Gunung Sugih";
    const year = formData.get("year") || "2026";
    const uploadedBy = formData.get("uploaded_by") || "Bendahara Cabang";

    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, error: "Berkas Excel tidak ditemukan dalam request." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const docId = `exp_doc_${satker.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_${year}`;
    const filename = file.name || `Dokumen_Pengeluaran_${satker}_${year}.xlsx`;
    const mimeType = file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const fileSize = buffer.length;

    // Simpan atau perbarui dokumen di database (REPLACE / INSERT ... ON DUPLICATE KEY UPDATE)
    // Pertahankan created_at asli sebagai waktu unggah awal, hanya perbarui updated_at
    await query(
      `INSERT INTO expense_documents (id, satker, filename, file_data, file_size, mime_type, year, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         filename = VALUES(filename),
         file_data = VALUES(file_data),
         file_size = VALUES(file_size),
         mime_type = VALUES(mime_type),
         uploaded_by = VALUES(uploaded_by),
         updated_at = CURRENT_TIMESTAMP`,
      [docId, satker, filename, buffer, fileSize, mimeType, year, uploadedBy]
    );

    // Rekam Jejak Audit (Audit Trail)
    try {
      await query(
        `INSERT INTO audit_logs (satker, user_name, user_role, action, module, entity_id, period, old_value, new_value, description)
         VALUES (?, ?, ?, 'UPLOAD_DOCUMENT', 'Dokumen Belanja', ?, ?, NULL, ?, ?)`,
        [
          satker,
          uploadedBy || "Bendahara Cabang",
          "Bendahara",
          docId,
          year,
          JSON.stringify({ filename, fileSize, year }),
          `Unggah berkas Excel asli pengeluaran: ${filename} (${Math.round(fileSize / 1024)} KB) tahun anggaran ${year}.`,
        ]
      );
    } catch (auditErr) {
      console.error("[Audit Trail Log Error]:", auditErr.message);
    }

    return NextResponse.json({
      success: true,
      message: "Dokumen Excel asli berhasil diarsipkan ke database.",
      document: {
        id: docId,
        satker,
        filename,
        fileSize,
        year,
      },
    });
  } catch (err) {
    console.error("[API Expense Documents POST Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

