import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { enforceSatkerAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Batas ukuran maksimal file: 15 MB
const MAX_FILE_SIZE = 15 * 1024 * 1024;

// Ekstensi yang diizinkan untuk dokumen Excel
const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".xlsm"];

// Validasi Magic Bytes untuk memastikan file benar-benar berkas Excel yang valid
function isValidExcelBinary(buffer) {
  if (!buffer || buffer.length < 8) return false;

  // 1. XLSX / XLSM (Format OpenXML berbasis ZIP): Dimulai dengan "PK\x03\x04", "PK\x05\x06", atau "PK\x07\x08"
  const isZip =
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07);

  // 2. XLS (Format Binary OLE2 Compound Document): D0 CF 11 E0 A1 B1 1A E1
  const isOle2 =
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1;

  return isZip || isOle2;
}

// GET: Unduh dokumen Excel asli atau ambil status arsip dokumen cabang
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedSatker = searchParams.get("satker");
    const download = searchParams.get("download") === "true";
    const requestedYear = searchParams.get("year");

    // Otorisasi & Penegakan Isolasi Satker
    const auth = enforceSatkerAccess(request, requestedSatker, "read");
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.statusCode });
    }
    const satker = auth.targetSatker;

    // Filter berdasarkan tahun jika diberikan parameter year
    let yearClause = "";
    const params = [satker];
    if (requestedYear && requestedYear !== "all") {
      yearClause = "AND year = ?";
      params.push(String(requestedYear).trim());
    }

    // PENTING (OPTIMASI & EFISIENSI MEMORI):
    // Jangan pernah menarik kolom LONGBLOB (file_data) jika hanya memeriksa metadata atau ketersediaan dokumen!
    if (!download) {
      const rows = await query(
        `SELECT id, satker, filename, file_size, mime_type, year, uploaded_by, created_at, updated_at
         FROM expense_documents 
         WHERE satker = ? ${yearClause} 
         ORDER BY created_at DESC LIMIT 1`,
        params
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Belum ada dokumen Excel asli yang diunggah oleh cabang ini." },
          { status: 404 }
        );
      }

      const doc = rows[0];
      return NextResponse.json({
        success: true,
        hasDocument: true,
        document: {
          id: doc.id,
          satker: doc.satker,
          filename: doc.filename,
          fileSize: doc.file_size,
          mimeType: doc.mime_type,
          year: doc.year,
          uploadedBy: doc.uploaded_by,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at,
        },
      });
    }

    // Jika download === true, baru tarik kolom binary file_data
    const rows = await query(
      `SELECT filename, mime_type, file_data, file_size
       FROM expense_documents 
       WHERE satker = ? ${yearClause} 
       ORDER BY created_at DESC LIMIT 1`,
      params
    );

    if (rows.length === 0 || !rows[0].file_data) {
      return NextResponse.json(
        { success: false, error: "Berkas dokumen tidak ditemukan untuk diunduh." },
        { status: 404 }
      );
    }

    const doc = rows[0];
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
    const requestedSatker = formData.get("satker");
    const year = String(formData.get("year") || new Date().getFullYear()).trim();

    // Otorisasi & Penegakan Isolasi Satker
    const auth = enforceSatkerAccess(request, requestedSatker, "write");
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.statusCode });
    }
    const satker = auth.targetSatker;
    const uploadedBy = auth.user.name || formData.get("uploaded_by") || "Bendahara Cabang";

    // 1. Validasi Keberadaan Berkas
    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, error: "Berkas Excel tidak ditemukan dalam request." }, { status: 400 });
    }

    // 2. Validasi Batas Ukuran Berkas (Maksimal 15 MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Ukuran berkas (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimum yang diizinkan (15 MB).` 
        },
        { status: 400 }
      );
    }

    // 3. Validasi Ekstensi Berkas
    const originalName = String(file.name || "").trim();
    const extMatch = originalName.match(/\.[a-zA-Z0-9]+$/);
    const ext = extMatch ? extMatch[0].toLowerCase() : "";

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Tipe berkas tidak valid. Sistem hanya menerima berkas Excel dengan format .xlsx, .xls, atau .xlsm." 
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Double check ukuran buffer
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Ukuran berkas melebihi batas maksimum 15 MB." },
        { status: 400 }
      );
    }

    // 4. Validasi Magic Bytes (Header Biner Berkas Asli)
    if (!isValidExcelBinary(buffer)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Format berkas tidak sesuai. Berkas yang diunggah bukan berkas spreadsheet Excel (OpenXML / OLE2) yang valid." 
        },
        { status: 400 }
      );
    }

    // 5. Sanitasi Nama Berkas
    const sanitizedBase = originalName
      .replace(/[^a-zA-Z0-9._\- ()]/g, "_")
      .substring(0, 200);
    const filename = sanitizedBase || `Dokumen_Pengeluaran_${satker}_${year}${ext}`;

    const docId = `exp_doc_${satker.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_${year}`;
    const mimeType = file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const fileSize = buffer.length;

    // 6. Simpan atau perbarui dokumen di database (INSERT ... ON DUPLICATE KEY UPDATE)
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

    // 7. Rekam Jejak Audit (Audit Trail)
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
