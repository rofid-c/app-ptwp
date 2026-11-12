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

    const rows = await query("SELECT * FROM settings WHERE satker = ?", [satker]);
    const r = rows && rows.length > 0 ? rows[0] : {};

    const defaultCity = satker.replace("Pengadilan Agama ", "").replace("Pengadilan Tinggi Agama ", "").trim() || "Gunung Sugih";
    const data = {
      id: r.id || 1,
      satker: r.satker || satker,
      institution: r.institution || satker.toUpperCase(),
      branch: r.branch || `CABANG ${satker.toUpperCase()}`,
      city: r.city || defaultCity,
      treasurerName: r.treasurer_name || "Wulan Febrianti, A.Md",
      treasurer_name: r.treasurer_name || "Wulan Febrianti, A.Md",
      treasurerNip: r.treasurer_nip || "",
      treasurer_nip: r.treasurer_nip || "",
      treasurerTitle: r.treasurer_title || "Bendahara Kantor",
      treasurer_title: r.treasurer_title || "Bendahara Kantor",
      chairmanName: r.chairperson_name || "Dr. H. Al Fitri",
      chairperson_name: r.chairperson_name || "Dr. H. Al Fitri",
      chairmanNip: r.chairperson_nip || "",
      chairperson_nip: r.chairperson_nip || "",
      chairmanTitle: r.chairperson_title || "Ketua Cabang PTWP",
      chairperson_title: r.chairperson_title || "Ketua Cabang PTWP",
      bank_name: r.bank_name || "Bank Syariah Indonesia (BSI)",
      bank_account: r.bank_account || "",
      bank_holder: r.bank_holder || `PTWP Cabang ${satker}`,
    };

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const requestedSatker = body.satker;

    // Otorisasi & Penegakan Isolasi Satker
    const auth = enforceSatkerAccess(request, requestedSatker, "write");
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.statusCode });
    }
    const satker = auth.targetSatker;
    const actorName = auth.user.name || "Bendahara Cabang";
    const actorRole = auth.user.roleLabel || auth.user.role || "Bendahara";

    const institution = body.institution || satker.toUpperCase();
    const branch = body.branch || `CABANG ${satker.toUpperCase()}`;
    const city = body.city || "";
    const treasurerName = body.treasurerName || body.treasurer_name || "";
    const treasurerNip = body.treasurerNip || body.treasurer_nip || "";
    const treasurerTitle = body.treasurerTitle || body.treasurer_title || "Bendahara Kantor";
    const chairpersonName = body.chairmanName || body.chairperson_name || "";
    const chairpersonNip = body.chairmanNip || body.chairperson_nip || "";
    const chairpersonTitle = body.chairmanTitle || body.chairperson_title || "Ketua Cabang PTWP";
    const bankName = body.bank_name || body.bankName || "Bank Syariah Indonesia (BSI)";
    const bankAccount = body.bank_account || body.bankAccount || "";
    const bankHolder = body.bank_holder || body.bankHolder || `PTWP Cabang ${satker}`;

    await query(
      `INSERT INTO settings (satker, institution, branch, city, treasurer_name, treasurer_nip, treasurer_title, chairperson_name, chairperson_nip, chairperson_title, bank_name, bank_account, bank_holder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         institution = VALUES(institution),
         branch = VALUES(branch),
         city = VALUES(city),
         treasurer_name = VALUES(treasurer_name),
         treasurer_nip = VALUES(treasurer_nip),
         treasurer_title = VALUES(treasurer_title),
         chairperson_name = VALUES(chairperson_name),
         chairperson_nip = VALUES(chairperson_nip),
         chairperson_title = VALUES(chairperson_title),
         bank_name = VALUES(bank_name),
         bank_account = VALUES(bank_account),
         bank_holder = VALUES(bank_holder)`,
      [satker, institution, branch, city, treasurerName, treasurerNip, treasurerTitle, chairpersonName, chairpersonNip, chairpersonTitle, bankName, bankAccount, bankHolder]
    );

    // Rekam jejak audit pengaturan
    try {
      await query(
        `INSERT INTO audit_logs (satker, user_name, user_role, action, module, entity_id, period, old_value, new_value, description)
         VALUES (?, ?, ?, 'UPDATE_SETTINGS', 'Pengaturan', ?, NULL, NULL, ?, ?)`,
        [
          satker,
          actorName,
          actorRole,
          `settings_${satker}`,
          JSON.stringify({ treasurer: treasurerName, chairperson: chairpersonName, bank: bankName }),
          `Pembaruan data pengaturan satker, pejabat penandatangan, dan rekening bank untuk ${satker}.`,
        ]
      );
    } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
