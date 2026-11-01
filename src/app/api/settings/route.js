import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const satker = searchParams.get("satker") || "Pengadilan Agama Gunung Sugih";

    const rows = await query("SELECT * FROM settings WHERE satker = ?", [satker]);
    if (rows && rows.length > 0) {
      return NextResponse.json({ success: true, data: rows[0] });
    }
    return NextResponse.json({
      success: true,
      data: {
        satker,
        institution: satker.toUpperCase(),
        branch: `CABANG ${satker.toUpperCase()}`,
        treasurer_name: "",
        treasurer_nip: "",
        chairperson_name: "",
        chairperson_nip: "",
        bank_name: "Bank Syariah Indonesia (BSI)",
        bank_account: "",
        bank_holder: `PTWP Cabang ${satker}`,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { satker, institution, branch, treasurer_name, treasurer_nip, chairperson_name, chairperson_nip, bank_name, bank_account, bank_holder } = body;

    await query(
      `INSERT INTO settings (satker, institution, branch, treasurer_name, treasurer_nip, chairperson_name, chairperson_nip, bank_name, bank_account, bank_holder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         institution = VALUES(institution),
         branch = VALUES(branch),
         treasurer_name = VALUES(treasurer_name),
         treasurer_nip = VALUES(treasurer_nip),
         chairperson_name = VALUES(chairperson_name),
         chairperson_nip = VALUES(chairperson_nip),
         bank_name = VALUES(bank_name),
         bank_account = VALUES(bank_account),
         bank_holder = VALUES(bank_holder)`,
      [satker, institution || "", branch || "", treasurer_name || "", treasurer_nip || "", chairperson_name || "", chairperson_nip || "", bank_name || "", bank_account || "", bank_holder || ""]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
