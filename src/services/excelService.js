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

/**
 * Export data realisasi pengeluaran / belanja iuran ke file Excel (.xlsx)
 */
export async function exportExpensesToExcel({
  expenses = [],
  period = "September 2026",
  city = "Gunung Sugih",
  treasurerName = "Wulan Febrianti, A.Md",
  treasurerTitle = "Bendahara Kantor",
  institution = "PENGADILAN AGAMA GUNUNG SUGIH",
  effectiveUangMasuk = 0,
  totalPeriodExpenses = 0,
  netBalance = 0,
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PTWP-Hub PA Gunung Sugih";
  workbook.lastModifiedBy = "Bendahara PTWP";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Belanja " + period.replace(/[\/\\]/g, "-"), {
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
    },
    views: [{ showGridLines: true }],
  });

  worksheet.columns = [
    { key: "no", width: 6 },
    { key: "uraian", width: 38 },
    { key: "category", width: 24 },
    { key: "date", width: 14 },
    { key: "amount", width: 18 },
    { key: "ket", width: 28 },
  ];

  worksheet.mergeCells("A1:F1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "REALISASI BELANJA DAN PENGELUARAN IURAN PTWP";
  titleCell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF991B1B" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(1).height = 22;

  worksheet.mergeCells("A2:F2");
  const subTitleCell = worksheet.getCell("A2");
  subTitleCell.value = "CABANG " + institution.toUpperCase();
  subTitleCell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FF334155" } };
  subTitleCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(2).height = 20;

  worksheet.getCell("A4").value = "Bulan :  " + period;
  worksheet.getCell("A4").font = { name: "Arial", size: 10, bold: true };
  worksheet.getCell("A4").alignment = { vertical: "middle", horizontal: "left" };
  worksheet.getRow(4).height = 18;

  const headerRow = worksheet.getRow(6);
  headerRow.values = ["NO", "URAIAN PENGELUARAN", "KATEGORI", "TANGGAL", "PENGELUARAN (RP)", "KETERANGAN / CATATAN"];
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF991B1B" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  });

  let currentRowIndex = 7;
  const startDataRow = currentRowIndex;

  expenses.forEach((item, index) => {
    const row = worksheet.getRow(currentRowIndex);
    row.height = 20;
    row.getCell(1).value = index + 1;
    row.getCell(2).value = item.uraian || item.description || "-";
    row.getCell(3).value = item.category || "Operasional";
    row.getCell(4).value = item.date || "-";
    row.getCell(5).value = Number(item.amount || 0);
    row.getCell(6).value = item.ket || "-";

    row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    row.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(3).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(4).alignment = { vertical: "middle", horizontal: "center" };
    row.getCell(5).alignment = { vertical: "middle", horizontal: "right" };
    row.getCell(5).numFmt = "#,##0";
    row.getCell(6).alignment = { vertical: "middle", horizontal: "left" };

    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c);
      cell.font = { name: "Arial", size: 9 };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD1D5DB" } },
        left: { style: "thin", color: { argb: "FFD1D5DB" } },
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
        right: { style: "thin", color: { argb: "FFD1D5DB" } },
      };
      if (index % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }
    }
    currentRowIndex++;
  });

  const lastDataRow = Math.max(startDataRow, currentRowIndex - 1);

  const totalRow = worksheet.getRow(currentRowIndex);
  totalRow.height = 22;
  worksheet.mergeCells("A" + currentRowIndex + ":D" + currentRowIndex);
  totalRow.getCell(1).value = "TOTAL PENGELUARAN BULAN INI";
  totalRow.getCell(1).font = { name: "Arial", size: 9, bold: true, color: { argb: "FF991B1B" } };
  totalRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };

  if (expenses.length > 0) {
    totalRow.getCell(5).value = { formula: "SUM(E" + startDataRow + ":E" + lastDataRow + ")" };
  } else {
    totalRow.getCell(5).value = 0;
  }
  totalRow.getCell(5).font = { name: "Arial", size: 9, bold: true, color: { argb: "FF991B1B" } };
  totalRow.getCell(5).alignment = { vertical: "middle", horizontal: "right" };
  totalRow.getCell(5).numFmt = "#,##0";

  for (let c = 1; c <= 6; c++) {
    const cell = totalRow.getCell(c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "double", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  }

  currentRowIndex++;

  const netRow = worksheet.getRow(currentRowIndex);
  netRow.height = 22;
  worksheet.mergeCells("A" + currentRowIndex + ":D" + currentRowIndex);
  netRow.getCell(1).value = "SISA SALDO BERSIH PERIODE " + period.toUpperCase() + " (IURAN MASUK - BELANJA)";
  netRow.getCell(1).font = { name: "Arial", size: 9, bold: true, color: { argb: "FF0F5132" } };
  netRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };

  netRow.getCell(5).value = Number(netBalance || 0);
  netRow.getCell(5).font = { name: "Arial", size: 9, bold: true, color: { argb: netBalance >= 0 ? "FF0F5132" : "FFEA580C" } };
  netRow.getCell(5).alignment = { vertical: "middle", horizontal: "right" };
  netRow.getCell(5).numFmt = "#,##0";

  for (let c = 1; c <= 6; c++) {
    const cell = netRow.getCell(c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  }

  const sigRowStart = currentRowIndex + 3;
  worksheet.getCell("E" + sigRowStart).value = city + ", " + new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  worksheet.getCell("E" + sigRowStart).font = { name: "Arial", size: 9 };
  worksheet.getCell("E" + sigRowStart).alignment = { vertical: "middle", horizontal: "center" };

  worksheet.getCell("E" + (sigRowStart + 1)).value = treasurerTitle;
  worksheet.getCell("E" + (sigRowStart + 1)).font = { name: "Arial", size: 9 };
  worksheet.getCell("E" + (sigRowStart + 1)).alignment = { vertical: "middle", horizontal: "center" };

  worksheet.getCell("E" + (sigRowStart + 5)).value = treasurerName;
  worksheet.getCell("E" + (sigRowStart + 5)).font = { name: "Arial", size: 9, bold: true, underline: true };
  worksheet.getCell("E" + (sigRowStart + 5)).alignment = { vertical: "middle", horizontal: "center" };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const sanitizedPeriod = period.replace(/[^a-zA-Z0-9]/g, "_");
  link.download = "REALISASI_BELANJA_PTWP_" + sanitizedPeriod + ".xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  return true;
}

/**
 * Export dokumen resmi gabungan (Sheet 1: Rekap Iuran, Sheet 2: Realisasi Belanja) per cabang
 */
export async function exportCombinedBranchReport({
  satker = "Pengadilan Agama Gunung Sugih",
  members = [],
  expenses = [],
  period = "September 2026",
  city = "Gunung Sugih",
  treasurerName = "Bendahara Kantor",
  treasurerTitle = "Bendahara PTWP",
  institution = "PENGADILAN AGAMA GUNUNG SUGIH",
  totalPeriodExpenses = 0,
  netBalance = 0,
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PTWP-Hub Terpadu";
  workbook.lastModifiedBy = "Pengawas Daerah PTA / Bendahara PTWP";
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. TAMBAHKAN SHEET 1: IURAN
  const sheetIuran = workbook.addWorksheet(`Iuran ${period.replace(/[\/\\]/g, "-")}`, {
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
    },
    views: [{ showGridLines: true }],
  });

  sheetIuran.columns = [
    { key: "no", width: 6 },
    { key: "name", width: 36 },
    { key: "title", width: 18 },
    { key: "pusat", width: 15 },
    { key: "daerah", width: 15 },
    { key: "cabang", width: 15 },
    { key: "tournamen", width: 18 },
    { key: "total", width: 17 },
  ];

  sheetIuran.mergeCells("A1:H1");
  const title1 = sheetIuran.getCell("A1");
  title1.value = `IURAN PTWP CABANG ${institution.toUpperCase()}`;
  title1.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF0F5132" } };
  title1.alignment = { vertical: "middle", horizontal: "center" };
  sheetIuran.getRow(1).height = 24;

  sheetIuran.getCell("B3").value = `Bulan :  ${period}`;
  sheetIuran.getCell("B3").font = { name: "Arial", size: 10, bold: true };
  sheetIuran.getCell("B3").alignment = { vertical: "middle", horizontal: "left" };
  sheetIuran.getRow(3).height = 18;

  const headerRow1 = sheetIuran.getRow(5);
  headerRow1.values = ["NO", "N A M A", "JABATAN", "IURAN PUSAT", "IURAN DAERAH", "IURAN CABANG", "IURAN TOURNAMEN", "TOTAL"];
  headerRow1.height = 24;
  headerRow1.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F5132" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  });

  const guideRow1 = sheetIuran.getRow(7);
  guideRow1.values = ["1", "2", "9", "", "", "", "15", "16"];
  guideRow1.height = 16;
  guideRow1.eachCell((cell) => {
    cell.font = { name: "Arial", size: 8, italic: true, color: { argb: "FF555555" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "hair", color: { argb: "FFCCCCCC" } },
      bottom: { style: "hair", color: { argb: "FFCCCCCC" } },
      left: { style: "hair", color: { argb: "FFCCCCCC" } },
      right: { style: "hair", color: { argb: "FFCCCCCC" } },
    };
  });

  let curRow1 = 10;
  const startRow1 = curRow1;
  members.forEach((m, idx) => {
    const row = sheetIuran.getRow(curRow1);
    const rowTot = (m.pusat || 0) + (m.daerah || 0) + (m.cabang || 0) + (m.tournamen || 0);
    row.values = [idx + 1, m.name, m.title || "", Number(m.pusat || 0), Number(m.daerah || 0), Number(m.cabang || 0), Number(m.tournamen || 0), Number(rowTot)];
    row.height = 20;
    row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    row.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(3).alignment = { vertical: "middle", horizontal: "left" };
    for (let c = 4; c <= 8; c++) {
      const cell = row.getCell(c);
      cell.alignment = { vertical: "middle", horizontal: "right" };
      cell.numFmt = "#,##0";
    }
    for (let c = 1; c <= 8; c++) {
      row.getCell(c).border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
      row.getCell(c).font = { name: "Arial", size: 9 };
    }
    curRow1++;
  });

  const endRow1 = Math.max(startRow1, curRow1 - 1);
  const totalRow1 = sheetIuran.getRow(curRow1);
  totalRow1.height = 22;
  totalRow1.getCell(1).value = "TOTAL";
  sheetIuran.mergeCells(`A${curRow1}:C${curRow1}`);
  totalRow1.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
  totalRow1.getCell(1).font = { name: "Arial", size: 9, bold: true };
  ["D", "E", "F", "G", "H"].forEach((col) => {
    const cell = sheetIuran.getCell(`${col}${curRow1}`);
    cell.value = { formula: `SUM(${col}${startRow1}:${col}${endRow1})` };
    cell.numFmt = "#,##0";
    cell.font = { name: "Arial", size: 9, bold: true };
    cell.alignment = { vertical: "middle", horizontal: "right" };
  });
  for (let c = 1; c <= 8; c++) {
    const cell = totalRow1.getCell(c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  }

  const sigRow1 = curRow1 + 2;
  sheetIuran.getCell(`F${sigRow1}`).value = `${city},        ${period}`;
  sheetIuran.getCell(`F${sigRow1}`).font = { name: "Arial", size: 9 };
  sheetIuran.getCell(`F${sigRow1}`).alignment = { vertical: "middle", horizontal: "center" };

  sheetIuran.getCell(`F${sigRow1 + 1}`).value = treasurerTitle;
  sheetIuran.getCell(`F${sigRow1 + 1}`).font = { name: "Arial", size: 9 };
  sheetIuran.getCell(`F${sigRow1 + 1}`).alignment = { vertical: "middle", horizontal: "center" };

  sheetIuran.getCell(`F${sigRow1 + 5}`).value = treasurerName;
  sheetIuran.getCell(`F${sigRow1 + 5}`).font = { name: "Arial", size: 9, bold: true, underline: true };
  sheetIuran.getCell(`F${sigRow1 + 5}`).alignment = { vertical: "middle", horizontal: "center" };

  // 2. TAMBAHKAN SHEET 2: BELANJA
  const sheetBelanja = workbook.addWorksheet(`Belanja ${period.replace(/[\/\\]/g, "-")}`, {
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
    },
    views: [{ showGridLines: true }],
  });

  sheetBelanja.columns = [
    { key: "no", width: 6 },
    { key: "uraian", width: 38 },
    { key: "category", width: 24 },
    { key: "date", width: 14 },
    { key: "amount", width: 18 },
    { key: "ket", width: 28 },
  ];

  sheetBelanja.mergeCells("A1:F1");
  const title2 = sheetBelanja.getCell("A1");
  title2.value = "REALISASI BELANJA DAN PENGELUARAN IURAN PTWP";
  title2.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF991B1B" } };
  title2.alignment = { vertical: "middle", horizontal: "center" };
  sheetBelanja.getRow(1).height = 22;

  sheetBelanja.mergeCells("A2:F2");
  const subTitle2 = sheetBelanja.getCell("A2");
  subTitle2.value = "CABANG " + institution.toUpperCase();
  subTitle2.font = { name: "Arial", size: 11, bold: true, color: { argb: "FF334155" } };
  subTitle2.alignment = { vertical: "middle", horizontal: "center" };
  sheetBelanja.getRow(2).height = 20;

  sheetBelanja.getCell("A4").value = "Bulan :  " + period;
  sheetBelanja.getCell("A4").font = { name: "Arial", size: 10, bold: true };
  sheetBelanja.getCell("A4").alignment = { vertical: "middle", horizontal: "left" };
  sheetBelanja.getRow(4).height = 18;

  const headerRow2 = sheetBelanja.getRow(6);
  headerRow2.values = ["NO", "URAIAN PENGELUARAN", "KATEGORI", "TANGGAL", "PENGELUARAN (RP)", "KETERANGAN / CATATAN"];
  headerRow2.height = 24;
  headerRow2.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF991B1B" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  });

  let curRow2 = 7;
  const startRow2 = curRow2;
  expenses.forEach((item, index) => {
    const row = sheetBelanja.getRow(curRow2);
    row.height = 20;
    row.getCell(1).value = index + 1;
    row.getCell(2).value = item.uraian || item.description || "-";
    row.getCell(3).value = item.category || "Operasional";
    row.getCell(4).value = item.date || "-";
    row.getCell(5).value = Number(item.amount || 0);
    row.getCell(6).value = item.ket || "-";

    row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    row.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(3).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(4).alignment = { vertical: "middle", horizontal: "center" };
    row.getCell(5).alignment = { vertical: "middle", horizontal: "right" };
    row.getCell(5).numFmt = "#,##0";
    row.getCell(6).alignment = { vertical: "middle", horizontal: "left" };

    for (let c = 1; c <= 6; c++) {
      row.getCell(c).border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
      row.getCell(c).font = { name: "Arial", size: 9 };
    }
    curRow2++;
  });

  const endRow2 = Math.max(startRow2, curRow2 - 1);
  const totalRow2 = sheetBelanja.getRow(curRow2);
  totalRow2.height = 22;
  sheetBelanja.mergeCells("A" + curRow2 + ":D" + curRow2);
  totalRow2.getCell(1).value = "TOTAL PENGELUARAN PERIODE " + period.toUpperCase();
  totalRow2.getCell(1).font = { name: "Arial", size: 9, bold: true, color: { argb: "FF991B1B" } };
  totalRow2.getCell(1).alignment = { vertical: "middle", horizontal: "center" };

  totalRow2.getCell(5).value = { formula: "SUM(E" + startRow2 + ":E" + endRow2 + ")" };
  totalRow2.getCell(5).font = { name: "Arial", size: 9, bold: true, color: { argb: "FF991B1B" } };
  totalRow2.getCell(5).alignment = { vertical: "middle", horizontal: "right" };
  totalRow2.getCell(5).numFmt = "#,##0";

  for (let c = 1; c <= 6; c++) {
    const cell = totalRow2.getCell(c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  }

  const sigRow2 = curRow2 + 3;
  sheetBelanja.getCell("E" + sigRow2).value = city + ", " + new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  sheetBelanja.getCell("E" + sigRow2).font = { name: "Arial", size: 9 };
  sheetBelanja.getCell("E" + sigRow2).alignment = { vertical: "middle", horizontal: "center" };

  sheetBelanja.getCell("E" + (sigRow2 + 1)).value = treasurerTitle;
  sheetBelanja.getCell("E" + (sigRow2 + 1)).font = { name: "Arial", size: 9 };
  sheetBelanja.getCell("E" + (sigRow2 + 1)).alignment = { vertical: "middle", horizontal: "center" };

  sheetBelanja.getCell("E" + (sigRow2 + 5)).value = treasurerName;
  sheetBelanja.getCell("E" + (sigRow2 + 5)).font = { name: "Arial", size: 9, bold: true, underline: true };
  sheetBelanja.getCell("E" + (sigRow2 + 5)).alignment = { vertical: "middle", horizontal: "center" };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const sanitizedSatker = satker.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
  const sanitizedPeriod = period.replace(/[^a-zA-Z0-9]/g, "_");
  link.download = `DOKUMEN_LENGKAP_PTWP_${sanitizedSatker}_${sanitizedPeriod}.xlsx`;
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

export function findStackedMonthSections(rows = []) {
  const sections = [];
  const monthNamesMap = {
    januari: "Januari", februari: "Februari", maret: "Maret", april: "April",
    mei: "Mei", juni: "Juni", juli: "Juli", agustus: "Agustus",
    september: "September", oktober: "Oktober", november: "November", desember: "Desember",
  };
  const regex = /(?:Bulan\s*:\s*)\s*([a-zA-Z]+)(?:\s+(\d{4}))?/i;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowStr = Array.isArray(row) ? row.join(" ") : String(row || "");
    const match = rowStr.match(regex);
    if (match) {
      const rawMonth = match[1].toLowerCase().trim();
      if (monthNamesMap[rawMonth]) {
        sections.push({
          rowIdx: i,
          monthName: monthNamesMap[rawMonth],
          year: match[2] || "2026",
        });
      }
    }
  }
  return sections;
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
    const rawNameUpper = rawName.toUpperCase();
    const firstCol = String(row[0] || "").trim().toUpperCase();
    const rowFullText = row.map((c) => String(c || "").trim()).join(" ").toUpperCase();

    // 1. Baris TOTAL / JUMLAH adalah batas akhir tabel anggota!
    // Setelah baris total, seluruh baris di bawahnya adalah tanda tangan & footer
    if (
      firstCol.includes("TOTAL") ||
      firstCol.includes("JUMLAH") ||
      rawNameUpper.includes("TOTAL") ||
      rawNameUpper.includes("JUMLAH") ||
      rowFullText.startsWith("TOTAL") ||
      rowFullText.startsWith("JUMLAH") ||
      rowFullText.includes("TOTAL IURAN") ||
      rowFullText.includes("JUMLAH TOTAL")
    ) {
      break;
    }

    // 2. Filter blok tanda tangan pejabat, bendahara, kota, atau NIP
    if (
      firstCol.includes("BENDAHARA") ||
      firstCol.includes("MENGETAHUI") ||
      firstCol.includes("GUNUNG SUGIH") ||
      firstCol.includes("NIP") ||
      rawNameUpper.includes("BENDAHARA") ||
      rawNameUpper.includes("MENGETAHUI") ||
      rawNameUpper.includes("GUNUNG SUGIH") ||
      rawNameUpper.includes("KETUA CABANG") ||
      rawNameUpper.includes("PENGADILAN AGAMA") ||
      rawNameUpper.includes("NIP.") ||
      rawNameUpper === "DTO" ||
      rowFullText.includes("BENDAHARA KANTOR") ||
      rowFullText.includes("KETUA CABANG PTWP") ||
      rowFullText.includes("MENGETAHUI,")
    ) {
      continue;
    }

    if (!rawName || rawName === "2" || /^\d+$/.test(rawName) || rawName.length < 3) {
      continue;
    }

    const p = cleanNum(row[colIdx.pusat]);
    const d = cleanNum(row[colIdx.daerah]);
    const c = cleanNum(row[colIdx.cabang]);
    const t = cleanNum(row[colIdx.tournamen]);
    const totalDuesRow = p + d + c + t;

    // 3. Filter baris tanda tangan kosong (total iuran 0 yang merupakan duplikat pejabat / tanpa nomor)
    if (totalDuesRow === 0) {
      const alreadyExists = parsedMembers.some(
        (m) => m.name.toLowerCase().trim() === rawName.toLowerCase().trim()
      );
      if (alreadyExists) continue;

      if (!row[0] || String(row[0]).trim() === "" || isNaN(Number(String(row[0]).trim()))) {
        continue;
      }
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
      pusat: p,
      daerah: d,
      cabang: c,
      tournamen: t,
      paid: true,
    });

    autoId++;
  }

  return parsedMembers;
}

/**
 * Import file Excel (.xlsx atau .csv) dan parse SEMUA lembar (sheet) bulan yang ada di workbook secara otomatis
 */


export function parseMatrixWorkbook(workbook, defaultYear = "2026") {
  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) return [];

  const monthNamesMap = {
    januari: "Januari", februari: "Februari", maret: "Maret", april: "April",
    mei: "Mei", juni: "Juni", juli: "Juli", agustus: "Agustus",
    september: "September", oktober: "Oktober", november: "November", desember: "Desember",
    january: "Januari", february: "Februari", march: "Maret", august: "Agustus",
    october: "Oktober", december: "Desember",
  };

  const monthOrder = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const monthRegex = /\b(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|January|February|March|April|May|June|July|August|September|October|November|December)\b/i;

  const cleanNum = (val) => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    const s = String(val).replace(/[^0-9,-]/g, "").replace(",", ".");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : Math.round(n);
  };

  const sortedSheetNames = [...workbook.SheetNames].sort((a, b) => {
    const aMatch = a.match(/\d+/);
    const bMatch = b.match(/\d+/);
    const aNum = aMatch ? parseInt(aMatch[0]) : 99;
    const bNum = bMatch ? parseInt(bMatch[0]) : 99;
    return aNum - bNum;
  });

  const allMonths = [];

  for (const sheetName of sortedSheetNames) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (!rows || rows.length < 5) continue;

    // 1. Cari baris header tabel: Baris yang memiliki kolom "No" dan "URAIAN" (menghindari salah baca baris 0 judul)
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 12); i++) {
      const row = rows[i] || [];
      const c0 = String(row[0] || "").trim().toUpperCase();
      const c1 = String(row[1] || "").trim().toUpperCase();
      if (c0 === "NO" && (c1 === "URAIAN" || c1.includes("URAIAN"))) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx === -1) {
      for (let i = 1; i < Math.min(rows.length, 12); i++) {
        const row = rows[i] || [];
        let monthCount = 0;
        for (let c = 2; c < row.length; c++) {
          if (monthRegex.test(String(row[c] || ""))) monthCount++;
        }
        if (monthCount >= 2) {
          headerRowIdx = i;
          break;
        }
      }
    }

    if (headerRowIdx === -1) continue;

    const headerRow = rows[headerRowIdx];
    const subHeaderRow = rows[headerRowIdx + 1] || [];
    const sheetMonths = [];

    // Deteksi kolom bulan (misal kolom 2, 5, 8...)
    for (let c = 2; c < headerRow.length; c++) {
      const cellVal = String(headerRow[c] || "").trim();
      if (!cellVal) continue;

      const match = cellVal.match(monthRegex);
      if (match) {
        const mName = monthNamesMap[match[1].toLowerCase()] || match[1];
        const yearMatch = cellVal.match(/\b(20\d\d)\b/);
        const yr = yearMatch ? yearMatch[1] : defaultYear;
        const period = `${mName} ${yr}`;

        let colPemasukan = c;
        let colPengeluaran = c + 1;
        let colKet = c + 2;

        const sub1 = String(subHeaderRow[c] || "").toLowerCase();
        const sub2 = String(subHeaderRow[c + 1] || "").toLowerCase();
        const sub3 = String(subHeaderRow[c + 2] || "").toLowerCase();
        if (sub1.includes("pemasukan")) colPemasukan = c;
        if (sub2.includes("pengeluaran")) colPengeluaran = c + 1;
        if (sub3.includes("ket")) colKet = c + 2;

        sheetMonths.push({
          sheetName,
          period,
          monthName: mName,
          year: yr,
          label: cellVal,
          selected: true,
          colPemasukan,
          colPengeluaran,
          colKet,
          saldoAwal: 0,
          iuranMasuk: 0,
          iuranKet: "",
          expenses: [],
          totalPengeluaran: 0,
          saldoAkhir: 0,
        });
      }
    }

    if (sheetMonths.length === 0) continue;

    // 2. Ekstraksi baris-baris data pengeluaran dan pemasukan
    for (let r = headerRowIdx + 2; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !Array.isArray(row)) continue;

      const uraian = String(row[1] || "").trim();
      if (!uraian) continue;

      const uUpper = uraian.toUpperCase();
      if (
        uUpper.includes("BENDAHARA") ||
        uUpper.includes("KETUA") ||
        uUpper.includes("GUNUNG SUGIH") ||
        uUpper.includes("MENGETAHUI") ||
        uUpper === "DTO"
      ) {
        continue;
      }

      sheetMonths.forEach((sm) => {
        const pem = cleanNum(row[sm.colPemasukan]);
        const peng = cleanNum(row[sm.colPengeluaran]);
        let rawKet = row[sm.colKet];
        let ket = String(rawKet || "").trim();

        const monthNum = (monthOrder.indexOf(sm.monthName) + 1).toString().padStart(2, "0");
        let date = `${sm.year}-${monthNum}-20`;

        // Deteksi serial tanggal Excel (misal 46057 -> 2026-02-04)
        if (typeof rawKet === "number" && rawKet > 40000 && rawKet < 50000) {
          const jsDate = new Date(Math.round((rawKet - 25569) * 86400 * 1000));
          date = jsDate.toISOString().split("T")[0];
          ket = "";
        } else if (ket) {
          const dmy = ket.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
          if (dmy) {
            date = `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
          }
        }

        if (uUpper.includes("SALDO AWAL")) {
          sm.saldoAwal = pem;
        } else if (uUpper.includes("IURAN PTWP PEGAWAI") || uUpper.includes("IURAN PEGAWAI")) {
          sm.iuranMasuk = pem;
          if (ket) sm.iuranKet = ket;
        } else if (uUpper.includes("SALDO AKHIR")) {
          sm.saldoAkhir = pem || peng;
        } else if (uUpper.includes("JUMLAH SALDO PENGELUARAN")) {
          sm.totalPengeluaran = peng;
        } else if (peng > 0) {
          let category = "Operasional Lapangan";
          if (uUpper.includes("PUSAT")) category = "Setoran Wajib Pusat";
          else if (uUpper.includes("DAERAH")) category = "Setoran Wajib Daerah";
          else if (
            uUpper.includes("MINERAL") ||
            uUpper.includes("GORENGAN") ||
            uUpper.includes("REBUSAN") ||
            uUpper.includes("KONSUMSI")
          )
            category = "Konsumsi";
          else if (uUpper.includes("LAPANGAN") || uUpper.includes("NET") || uUpper.includes("PERBAIKAN"))
            category = "Pemeliharaan Lapangan";
          else if (uUpper.includes("BOLA")) category = "Operasional Lapangan";
          else if (uUpper.includes("HUT") || uUpper.includes("BANNER") || uUpper.includes("RAPAT"))
            category = "Kegiatan & Turnamen";

          sm.expenses.push({
            id: `exp_${sm.period}_${r}_${Date.now()}`,
            uraian,
            description: uraian + (ket ? ` - ${ket}` : ""),
            category,
            amount: peng,
            date,
            ket,
          });
        }
      });
    }

    sheetMonths.forEach((sm) => {
      if (sm.totalPengeluaran === 0) {
        sm.totalPengeluaran = sm.expenses.reduce((s, e) => s + e.amount, 0);
      }
      allMonths.push(sm);
    });
  }

  allMonths.sort((a, b) => {
    const idxA = monthOrder.indexOf(a.monthName);
    const idxB = monthOrder.indexOf(b.monthName);
    return (a.year - b.year) || (idxA - idxB);
  });

  return allMonths;
}

export function parseMatrixCashbook(rows = [], defaultYear = "2026") {
  if (!rows || rows.length < 5) return null;
  const dummyWb = {
    SheetNames: ["Sheet1"],
    Sheets: {
      Sheet1: XLSX.utils.aoa_to_sheet(rows),
    },
  };
  const res = parseMatrixWorkbook(dummyWb, defaultYear);
  return res.length > 0 ? res : null;
}


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
          const nameToId = new Map();
          let nextAutoId = 1;

          validSheets.forEach((s) => {
            s.year = s.year || finalYear;
            s.period = s.monthIndex !== 99 ? `${s.monthName} ${s.year}` : `${s.sheetName} ${s.year}`;

            // Penomoran ID anggota per lembar bulan (terisolasi per periode)
            if (Array.isArray(s.members)) {
              s.members.forEach((m, idx) => {
                m.id = String(idx + 1);
                m.no = idx + 1;
                m.satker = m.satker || "Pengadilan Agama Gunung Sugih";
                m.period = s.period;
              });
            }
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

        // Cek apakah berkas merupakan Format Rekapitulasi Saldo Kas (Matriks Multi-Bulan PA Gunung Sugih)
        const matrixResult = parseMatrixWorkbook(workbook, finalYear);
        if (matrixResult && matrixResult.length > 0) {
          const septMonth = matrixResult.find((m) => m.monthName.toLowerCase() === "september");
          const defaultMonth = septMonth || matrixResult[matrixResult.length - 1];

          resolve({
            isMatrixCashbook: true,
            isMultiSheet: false,
            matrixMonths: matrixResult,
            detectedYear: finalYear,
            detectedPeriod: defaultMonth.period,
            totalMonthsFound: matrixResult.length,
          });
          return;
        }

        // Cek apakah lembar tunggal / CSV ini berisi banyak bulan bertingkat (Stacked Multi-Month seperti CSV 9 Bulan)
        const stackedSections = findStackedMonthSections(rows);
        if (stackedSections.length > 1) {
          const monthOrder = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
          ];
          const validStackedSheets = [];
          for (let sIdx = 0; sIdx < stackedSections.length; sIdx++) {
            const sec = stackedSections[sIdx];
            const startRow = sec.rowIdx;
            const endRow = sIdx + 1 < stackedSections.length ? stackedSections[sIdx + 1].rowIdx : rows.length;
            const sliceRows = rows.slice(startRow, endRow);
            const parsed = parseSheetRows(sliceRows);
            if (parsed.length > 0) {
              const mIdx = monthOrder.indexOf(sec.monthName);
              const secYear = sec.year || finalYear;
              validStackedSheets.push({
                sheetName: `${sec.monthName} ${secYear}`,
                monthName: sec.monthName,
                monthIndex: mIdx !== -1 ? mIdx : 99,
                year: secYear,
                period: `${sec.monthName} ${secYear}`,
                members: parsed,
                count: parsed.length,
              });
            }
          }

          if (validStackedSheets.length > 1) {
            validStackedSheets.sort((a, b) => a.monthIndex - b.monthIndex);
            const septSheet = validStackedSheets.find((s) => s.monthName.toLowerCase() === "september");
            const defaultSheet = septSheet || validStackedSheets[validStackedSheets.length - 1];

            resolve({
              isMultiSheet: true,
              sheets: validStackedSheets,
              detectedYear: finalYear,
              detectedPeriod: defaultSheet.period,
              members: defaultSheet.members,
              totalSheetsFound: validStackedSheets.length,
            });
            return;
          }
        }

        const detectedPeriod = detectPeriodFromContent(rows, file.name, firstSheetName) || fallbackPeriod;
        const parsedMembers = parseSheetRows(rows);

        if (parsedMembers.length === 0) {
          throw new Error("Format tidak cocok: Kolom 'NAMA' atau 'JABATAN' tidak ditemukan di berkas, dan bukan merupakan format Rekapitulasi Kas.");
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

