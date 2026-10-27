// Service Pembuatan dan Pembacaan Excel Berformat Resmi PTWP (.xlsx dan .csv)
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";

const MONTH_MAP = {
  january: "Januari",
  february: "Februari",
  march: "Maret",
  april: "April",
  may: "Mei",
  june: "Juni",
  july: "Juli",
  august: "Agustus",
  september: "September",
  october: "Oktober",
  november: "November",
  december: "Desember",
};

/**
 * Deteksi otomatis periode (Bulan & Tahun) dari isi Excel / CSV, nama sheet, atau nama file
 */
export function detectPeriodFromContent(rows = [], fileName = "", sheetName = "") {
  const monthRegex =
    /\b(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i;

  // 1. Cek baris-baris atas (baris 1 s/d 10), terutama yang ada kata "Bulan"
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const rowStr = Array.isArray(rows[i]) ? rows[i].join(" ") : String(rows[i] || "");
    const match = rowStr.match(monthRegex);
    if (match) {
      const rawMonth = match[1].toLowerCase();
      const year = match[2];
      const monthIndo = MONTH_MAP[rawMonth] || (match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase());
      return `${monthIndo} ${year}`;
    }
  }

  // 2. Cek baris-baris bawah (area tanda tangan/titimangsa)
  for (let i = Math.max(0, rows.length - 10); i < rows.length; i++) {
    const rowStr = Array.isArray(rows[i]) ? rows[i].join(" ") : String(rows[i] || "");
    const match = rowStr.match(monthRegex);
    if (match) {
      const rawMonth = match[1].toLowerCase();
      const year = match[2];
      const monthIndo = MONTH_MAP[rawMonth] || (match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase());
      return `${monthIndo} ${year}`;
    }
  }

  // 3. Cek seluruh cell sheet jika belum ketemu
  for (let i = 0; i < rows.length; i++) {
    const rowStr = Array.isArray(rows[i]) ? rows[i].join(" ") : String(rows[i] || "");
    const match = rowStr.match(monthRegex);
    if (match) {
      const rawMonth = match[1].toLowerCase();
      const year = match[2];
      const monthIndo = MONTH_MAP[rawMonth] || (match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase());
      return `${monthIndo} ${year}`;
    }
  }

  // 4. Cek dari nama sheet
  if (sheetName) {
    const matchSheet = sheetName.match(monthRegex);
    if (matchSheet) {
      const rawMonth = matchSheet[1].toLowerCase();
      const year = matchSheet[2];
      const monthIndo = MONTH_MAP[rawMonth] || (matchSheet[1].charAt(0).toUpperCase() + matchSheet[1].slice(1).toLowerCase());
      return `${monthIndo} ${year}`;
    }
  }

  // 5. Cek dari nama file
  if (fileName) {
    const matchFile = fileName.match(monthRegex);
    if (matchFile) {
      const rawMonth = matchFile[1].toLowerCase();
      const year = matchFile[2];
      const monthIndo = MONTH_MAP[rawMonth] || (matchFile[1].charAt(0).toUpperCase() + matchFile[1].slice(1).toLowerCase());
      return `${monthIndo} ${year}`;
    }
  }

  return null;
}

/**
 * Export data rekapitulasi iuran ke file Excel (.xlsx)
 */
export async function exportDuesToExcel({
  members,
  period = "September 2026",
  city = "Gunung Sugih",
  treasurerName = "Wulan Febrianti, A.Md",
  treasurerTitle = "Bendahara Kantor",
  institution = "PENGADILAN AGAMA GUNUNG SUGIH",
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PTWP-Hub PA Gunung Sugih";
  workbook.lastModifiedBy = "Bendahara PTWP";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet(`Iuran ${period.replace(/[\/\\]/g, "-")}`, {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.6,
        bottom: 0.6,
        header: 0.3,
        footer: 0.3,
      },
    },
    views: [{ showGridLines: true }],
  });

  worksheet.columns = [
    { key: "no", width: 6 },
    { key: "name", width: 36 },
    { key: "title", width: 18 },
    { key: "pusat", width: 15 },
    { key: "daerah", width: 15 },
    { key: "cabang", width: 15 },
    { key: "tournamen", width: 18 },
    { key: "total", width: 17 },
  ];

  // 1. Judul Dokumen (Baris 1)
  worksheet.mergeCells("A1:H1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = `IURAN PTWP CABANG ${institution.toUpperCase()}`;
  titleCell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF0F5132" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(1).height = 24;

  // 2. Baris Periode Bulan (Baris 3)
  worksheet.getCell("B3").value = `Bulan :  ${period}`;
  worksheet.getCell("B3").font = { name: "Arial", size: 10, bold: true };
  worksheet.getCell("B3").alignment = { vertical: "middle", horizontal: "left" };
  worksheet.getRow(3).height = 18;

  // 3. Header Tabel (Baris 5)
  const headerRow = worksheet.getRow(5);
  headerRow.values = [
    "NO",
    "N A M A",
    "JABATAN",
    "IURAN PUSAT",
    "IURAN DAERAH",
    "IURAN CABANG",
    "IURAN TOURNAMEN",
    "TOTAL",
  ];
  headerRow.height = 24;

  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F5132" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  });

  // 4. Baris Penomoran Panduan (Baris 7)
  const guideRow = worksheet.getRow(7);
  guideRow.values = ["1", "2", "9", "", "", "", "15", "16"];
  guideRow.height = 16;
  guideRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 8, italic: true, color: { argb: "FF555555" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "hair", color: { argb: "FFCCCCCC" } },
      bottom: { style: "hair", color: { argb: "FFCCCCCC" } },
      left: { style: "hair", color: { argb: "FFCCCCCC" } },
      right: { style: "hair", color: { argb: "FFCCCCCC" } },
    };
  });

  // 5. Isi Data Pegawai (Mulai Baris 10)
  let currentRowIndex = 10;
  const startDataRow = currentRowIndex;

  members.forEach((member, index) => {
    const row = worksheet.getRow(currentRowIndex);
    const rowTotal = (member.pusat || 0) + (member.daerah || 0) + (member.cabang || 0) + (member.tournamen || 0);

    row.values = [
      index + 1,
      member.name,
      member.title,
      Number(member.pusat || 0),
      Number(member.daerah || 0),
      Number(member.cabang || 0),
      Number(member.tournamen || 0),
      Number(rowTotal),
    ];

    row.height = 20;

    row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    row.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(3).alignment = { vertical: "middle", horizontal: "left" };

    for (let col = 4; col <= 8; col++) {
      const cell = row.getCell(col);
      cell.numFmt = "#,##0";
      cell.alignment = { vertical: "middle", horizontal: "right" };
    }

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = cell.font || { name: "Arial", size: 9 };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD1D5DB" } },
        left: { style: "thin", color: { argb: "FFD1D5DB" } },
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
        right: { style: "thin", color: { argb: "FFD1D5DB" } },
      };
    });

    if (index % 2 === 1) {
      for (let col = 1; col <= 8; col++) {
        row.getCell(col).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF9FAFB" },
        };
      }
    }

    currentRowIndex++;
  });

  const lastDataRow = Math.max(startDataRow, currentRowIndex - 1);

  // 6. Baris TOTAL Keseluruhan
  const totalRow = worksheet.getRow(currentRowIndex);
  totalRow.height = 22;

  totalRow.getCell(1).value = "TOTAL";
  if (members.length > 0) {
    totalRow.getCell(4).value = { formula: `SUM(D${startDataRow}:D${lastDataRow})` };
    totalRow.getCell(5).value = { formula: `SUM(E${startDataRow}:E${lastDataRow})` };
    totalRow.getCell(6).value = { formula: `SUM(F${startDataRow}:F${lastDataRow})` };
    totalRow.getCell(7).value = { formula: `SUM(G${startDataRow}:G${lastDataRow})` };
    totalRow.getCell(8).value = { formula: `SUM(H${startDataRow}:H${lastDataRow})` };
  } else {
    totalRow.getCell(4).value = 0;
    totalRow.getCell(5).value = 0;
    totalRow.getCell(6).value = 0;
    totalRow.getCell(7).value = 0;
    totalRow.getCell(8).value = 0;
  }

  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF0F172A" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E8F0" },
    };
    if (colNumber >= 4) {
      cell.numFmt = "#,##0";
      cell.alignment = { vertical: "middle", horizontal: "right" };
    } else {
      cell.alignment = { vertical: "middle", horizontal: "center" };
    }
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "double", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  });

  // 7. Area Titimangsa & Tanda Tangan
  const sigRowStart = currentRowIndex + 2;

  const dateCell = worksheet.getCell(`F${sigRowStart}`);
  dateCell.value = `${city},        ${period}`;
  dateCell.font = { name: "Arial", size: 9 };
  dateCell.alignment = { vertical: "middle", horizontal: "center" };

  const titleTtdCell = worksheet.getCell(`F${sigRowStart + 1}`);
  titleTtdCell.value = treasurerTitle;
  titleTtdCell.font = { name: "Arial", size: 9 };
  titleTtdCell.alignment = { vertical: "middle", horizontal: "center" };

  const nameTtdCell = worksheet.getCell(`F${sigRowStart + 5}`);
  nameTtdCell.value = treasurerName;
  nameTtdCell.font = { name: "Arial", size: 9, bold: true, underline: true };
  nameTtdCell.alignment = { vertical: "middle", horizontal: "center" };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const sanitizedPeriod = period.replace(/[^a-zA-Z0-9]/g, "_");
  link.download = `IURAN_PTWP_PA_GUNUNG_SUGIH_${sanitizedPeriod}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  return true;
}

export const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function getMonthIndexAndName(str = "") {
  if (!str) return null;
  const s = String(str).trim().toLowerCase();

  const patterns = [
    { regex: /\b(januari|january|jan)\b/i, name: "Januari", index: 0 },
    { regex: /\b(februari|february|feb)\b/i, name: "Februari", index: 1 },
    { regex: /\b(maret|march|mar)\b/i, name: "Maret", index: 2 },
    { regex: /\b(april|apr)\b/i, name: "April", index: 3 },
    { regex: /\b(mei|may)\b/i, name: "Mei", index: 4 },
    { regex: /\b(juni|june|jun)\b/i, name: "Juni", index: 5 },
    { regex: /\b(juli|july|jul)\b/i, name: "Juli", index: 6 },
    { regex: /\b(agustus|august|agust|agu|aug)\b/i, name: "Agustus", index: 7 },
    { regex: /\b(september|sept|sep)\b/i, name: "September", index: 8 },
    { regex: /\b(oktober|october|okt|oct)\b/i, name: "Oktober", index: 9 },
    { regex: /\b(november|nopember|nov)\b/i, name: "November", index: 10 },
    { regex: /\b(desember|december|des|dec)\b/i, name: "Desember", index: 11 },
  ];

  for (const p of patterns) {
    if (p.regex.test(s)) {
      return p;
    }
  }

  // Exact or prefix check for clean sheet names like "september", "agustus"
  for (let i = 0; i < MONTH_NAMES_ID.length; i++) {
    const mLower = MONTH_NAMES_ID[i].toLowerCase();
    if (s === mLower || s.startsWith(mLower) || s.endsWith(mLower)) {
      return { name: MONTH_NAMES_ID[i], index: i };
    }
  }

  return null;
}

export function cleanNum(val) {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).trim();
  if (!str || str === "-" || str === "Rp" || str === "Rp.") return 0;

  let cleaned = str.replace(/[^\d.,-]/g, "");
  if (!cleaned) return 0;

  // Handle Indonesian thousand separator (titik seperti 50.000 atau 1.250.000)
  if (/\.\d{3}(?!\d)/.test(cleaned) && !cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "");
  } else if (/,\d{3}(?!\d)/.test(cleaned) && !cleaned.includes(".")) {
    cleaned = cleaned.replace(/,/g, "");
  } else if (cleaned.includes(".") && cleaned.includes(",")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      // 1.000,00 -> Format Indonesia
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // 1,000.00 -> Format Internasional
      cleaned = cleaned.replace(/,/g, "");
    }
  }

  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

export function detectYearFromContent(rows = [], fileName = "", sheetName = "") {
  const yearRegex = /\b(20\d{2})\b/;

  // 1. Cek baris-baris atas
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const rowStr = Array.isArray(rows[i]) ? rows[i].join(" ") : String(rows[i] || "");
    const match = rowStr.match(yearRegex);
    if (match) return match[1];
  }

  // 2. Cek sheetName
  if (sheetName) {
    const match = sheetName.match(yearRegex);
    if (match) return match[1];
  }

  // 3. Cek fileName
  if (fileName) {
    const match = fileName.match(yearRegex);
    if (match) return match[1];
  }

  // 4. Cek seluruh cell
  for (let i = 0; i < rows.length; i++) {
    const rowStr = Array.isArray(rows[i]) ? rows[i].join(" ") : String(rows[i] || "");
    const match = rowStr.match(yearRegex);
    if (match) return match[1];
  }

  return null;
}

function parseSheetRows(rows) {
  if (!rows || rows.length < 3) return [];

  // Cari baris header
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const rowStr = (Array.isArray(rows[i]) ? rows[i].join(" ") : String(rows[i] || "")).toUpperCase();
    if (rowStr.includes("NAMA") || rowStr.includes("N A M A") || rowStr.includes("JABATAN")) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) return [];

  const h1 = rows[headerRowIdx].map((c) => String(c || "").trim().toUpperCase());
  const h2 =
    rows[headerRowIdx + 1] && Array.isArray(rows[headerRowIdx + 1])
      ? rows[headerRowIdx + 1].map((c) => String(c || "").trim().toUpperCase())
      : [];

  const isH2SubHeader = h2.some((c) =>
    c.includes("PUSAT") || c.includes("DAERAH") || c.includes("CABANG") || c.includes("TOUR") || c.includes("TURNAMEN")
  );

  const maxCols = Math.max(h1.length, h2.length);
  const combinedHeader = [];
  for (let c = 0; c < maxCols; c++) {
    combinedHeader.push(`${h1[c] || ""} ${h2[c] || ""}`.trim());
  }

  const findCol = (keywords) => combinedHeader.findIndex((col) => keywords.some((k) => col.includes(k)));

  const colIdx = {
    no: findCol(["NO", "NOMOR"]),
    name: findCol(["NAMA", "N A M A", "NAME"]),
    title: findCol(["JABATAN", "TITLE"]),
    pusat: findCol(["PUSAT"]),
    daerah: findCol(["DAERAH"]),
    cabang: findCol(["CABANG"]),
    tournamen: findCol(["TOURNAMEN", "TURNAMEN", "TOUR"]),
  };

  if (colIdx.name === -1) colIdx.name = 1;
  if (colIdx.title === -1) colIdx.title = 2;
  if (colIdx.pusat === -1) colIdx.pusat = 3;
  if (colIdx.daerah === -1) colIdx.daerah = 4;
  if (colIdx.cabang === -1) colIdx.cabang = 5;
  if (colIdx.tournamen === -1) colIdx.tournamen = 6;

  const dataStartIdx = isH2SubHeader ? headerRowIdx + 2 : headerRowIdx + 1;
  const parsedMembers = [];
  let autoId = 1;

  for (let i = dataStartIdx; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row)) continue;

    const rawName = String(row[colIdx.name] || "").trim();
    const firstCol = String(row[0] || "").trim().toUpperCase();

    if (
      firstCol.includes("TOTAL") ||
      rawName.toUpperCase().includes("TOTAL") ||
      firstCol.includes("GUNUNG SUGIH") ||
      firstCol.includes("BENDAHARA") ||
      firstCol.includes("MENGETAHUI") ||
      firstCol.includes("NIP")
    ) {
      continue;
    }

    if (!rawName || rawName === "2" || /^\d+$/.test(rawName)) {
      continue;
    }

    const title = String(row[colIdx.title] || "Staf").trim();
    let category = "Staf";
    if (/Ketua|Wakil|Hakim/i.test(title)) category = "Hakim";
    else if (/Panitera|Panmud|PP|JS|JSP/i.test(title)) category = "Kepaniteraan";
    else if (/Sekretaris|Kasub|JabFung/i.test(title)) category = "Kesekretariatan";

    parsedMembers.push({
      id: autoId,
      no: autoId,
      name: rawName,
      title: title,
      category: category,
      pusat: cleanNum(row[colIdx.pusat]),
      daerah: cleanNum(row[colIdx.daerah]),
      cabang: cleanNum(row[colIdx.cabang]),
      tournamen: cleanNum(row[colIdx.tournamen]),
      paid: true,
    });

    autoId++;
  }

  return parsedMembers;
}

/**
 * Import file Excel (.xlsx atau .csv) dan parse SEMUA lembar (sheet) bulan yang ada di workbook secara otomatis
 */
export async function parseExcelFile(file, fallbackPeriod = "September 2026") {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", raw: false });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("File Excel tidak memiliki lembar (sheet) yang dapat dibaca.");
        }

        const fallbackYearMatch = fallbackPeriod.match(/\b(20\d{2})\b/);
        const defaultYear = fallbackYearMatch ? fallbackYearMatch[1] : String(new Date().getFullYear());
        let workbookYear = null;

        const fileYearMatch = file.name.match(/\b(20\d{2})\b/);
        if (fileYearMatch) {
          workbookYear = fileYearMatch[1];
        }

        const validSheets = [];

        for (const sheetName of workbook.SheetNames) {
          // Lewati lembar utilitas / tombol seperti "Button", "Tombol", "Setting"
          if (/^(button|tombol|macro|rekap_total|setting|pengaturan)$/i.test(sheetName.trim())) {
            continue;
          }

          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) continue;

          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
          if (!rows || rows.length < 3) continue;

          // Deteksi nama bulan dari nama sheet atau isi baris
          let monthInfo = getMonthIndexAndName(sheetName);
          if (!monthInfo) {
            for (let i = 0; i < Math.min(rows.length, 12); i++) {
              const rowStr = Array.isArray(rows[i]) ? rows[i].join(" ") : String(rows[i] || "");
              monthInfo = getMonthIndexAndName(rowStr);
              if (monthInfo) break;
            }
          }

          // Cek tahun pada lembar ini
          const sheetYear = detectYearFromContent(rows, file.name, sheetName);
          if (sheetYear && !workbookYear) {
            workbookYear = sheetYear;
          }

          // Parse anggota dari sheet ini
          const parsedMembers = parseSheetRows(rows);
          if (parsedMembers.length > 0) {
            validSheets.push({
              sheetName: sheetName,
              monthName: monthInfo ? monthInfo.name : sheetName,
              monthIndex: monthInfo ? monthInfo.index : 99,
              year: sheetYear,
              members: parsedMembers,
              count: parsedMembers.length,
            });
          }
        }

        const finalYear = workbookYear || defaultYear;

        // Jika terdeteksi sheet bulan
        if (validSheets.length > 0) {
          validSheets.forEach((s) => {
            s.year = s.year || finalYear;
            s.period = s.monthIndex !== 99 ? `${s.monthName} ${s.year}` : `${s.sheetName} ${s.year}`;
          });

          // Urutkan sheet secara kronologis dari Januari s/d Desember
          validSheets.sort((a, b) => a.monthIndex - b.monthIndex);

          // Pilih sheet default: utamakan bulan September atau sheet terakhir
          const septSheet = validSheets.find((s) => s.monthName.toLowerCase() === "september");
          const defaultSheet = septSheet || validSheets[validSheets.length - 1];

          resolve({
            isMultiSheet: validSheets.length > 1,
            sheets: validSheets,
            detectedYear: finalYear,
            detectedPeriod: defaultSheet.period,
            members: defaultSheet.members,
            totalSheetsFound: validSheets.length,
          });
          return;
        }

        // Fallback untuk file 1 lembar tunggal / CSV biasa
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        if (!rows || rows.length === 0) {
          throw new Error("File kosong atau tidak terbaca.");
        }

        const detectedPeriod = detectPeriodFromContent(rows, file.name, firstSheetName) || fallbackPeriod;
        const parsedMembers = parseSheetRows(rows);

        if (parsedMembers.length === 0) {
          throw new Error("Format tidak cocok: Kolom 'NAMA' atau 'JABATAN' tidak ditemukan di berkas.");
        }

        resolve({
          isMultiSheet: false,
          sheets: [
            {
              sheetName: firstSheetName,
              monthName: (detectedPeriod.split(" ")[0]) || "September",
              period: detectedPeriod,
              year: finalYear,
              members: parsedMembers,
              count: parsedMembers.length,
            },
          ],
          detectedYear: finalYear,
          detectedPeriod: detectedPeriod,
          members: parsedMembers,
          totalSheetsFound: 1,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

