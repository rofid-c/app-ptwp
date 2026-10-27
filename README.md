# 🎾 PTWP-Hub (Sistem Informasi & Rekapitulasi Iuran PTWP)
> **Aplikasi Pengelolaan Iuran, Kas, dan Agenda PTWP Cabang Pengadilan Agama Gunung Sugih**  
> Didesain responsif (*mobile-first & desktop-optimized*) dengan sistem Export/Import Excel otomatis bersesuaian format resmi peradilan.

---

## 📌 Daftar Isi
1. [Latar Belakang & Tujuan](#-latar-belakang--tujuan)
2. [Konsep Desain UI/UX (Desktop vs Mobile)](#-konsep-desain-uiux-desktop-vs-mobile)
3. [Fitur-Fitur Utama Aplikasi](#-fitur-fitur-utama-aplikasi)
4. [Spesifikasi Format Excel Resmi (Export/Import)](#-spesifikasi-format-excel-resmi-exportimport)
5. [Struktur Data & Tarif Iuran Standar](#-struktur-data--tarif-iuran-standar)
6. [Struktur Direktori Proyek](#-struktur-direktori-proyek)
7. [Panduan Instalasi & Menjalankan Aplikasi](#-panduan-instalasi--menjalankan-aplikasi)
8. [Rencana Arsitektur & Teknologi](#-rencana-arsitektur--teknologi)

---

## 🎯 Latar Belakang & Tujuan
PTWP (Persatuan Tenis Warga Peradilan) merupakan wadah olahraga resmi di bawah Mahkamah Agung Republik Indonesia. Pada tingkat cabang satuan kerja (**Pengadilan Agama Gunung Sugih**), bendahara mengelola:
- Rekapitulasi iuran rutin bulanan untuk 4 tingkatan (*Iuran Pusat, Daerah, Cabang, dan Tournamen*) dari 46+ personil lintas jabatan (Ketua, Hakim, Panitera, Jurusita, hingga Staf/PPNPN).
- Kebutuhan pelaporan berkala berformat resmi Microsoft Excel bertanda tangan Bendahara Kantor.
- Pemantauan perbendaharaan kas cabang untuk operasional latihan rutin serta persiapan turnamen resmi (KPTA Cup Lampung, MA Cup).

Aplikasi **PTWP-Hub** hadir untuk mendigitalkan dan mengotomatiskan seluruh alur kerja perbendaharaan cabang dengan tampilan antarmuka yang modern, cepat, dan nyaman diakses baik melalui smartphone (HP) anggota maupun laptop kantor bendahara.

---

## 🎨 Konsep Desain UI/UX (Desktop vs Mobile)

### 1. Identitas Visual (*Judicial Emerald & Tennis Court Theme*)
- **Primary / Dominan (Emerald Court Green)**: `#0F5132` / `#0A3826` — Merepresentasikan wibawa instansi peradilan syar'iyah sekaligus warna lapangan tenis.
- **Accent / Highlight (Tennis Ball Yellow & Gold)**: `#EAB308` / `#FEF08A` — Warna kontras dinamis untuk badge status, kartu saldo, dan aksen sorotan.
- **Surface & Background**:
  - *Light Mode*: Latar belakang bersih lembut (`#F4F7F5`) dengan kartu berbingkai tipis modern (`#E2E8F0`).
  - *Dark Mode*: Nuansa elegan slate gelap (`#061510`) dengan sentuhan deep forest green (`#0A2118`).
- **Tipografi**: Menggunakan font modern Google Fonts **Plus Jakarta Sans** untuk antarmuka dan **JetBrains Mono** untuk angka nominal akuntansi agar presisi dan mudah dibaca.

---

### 2. Tampilan Desktop (Laptop / PC Kantor)
Desktop dioptimalkan untuk bendahara saat mengelola data tabel dan dokumen:
- **Sidebar Navigasi Tetap**: Menu kiri mencakup *Dashboard Utama*, *Rekap Iuran*, *Buku Kas Cabang*, *Agenda Turnamen*, dan *Pengaturan*.
- **Smart Data Table (Sticky Header)**:
  - Kolom lengkap: `No`, `Nama Lengkap`, `Jabatan`, `Pusat`, `Daerah`, `Cabang`, `Tour`, `Total`, `Status`, dan `Aksi`.
  - Judul kolom tetap terlihat (*sticky*) saat menggulir tabel 46+ pegawai.
  - Filter cepat per kategori jabatan: `Semua`, `Hakim`, `Kepaniteraan`, `Kesekretariatan`, dan `Staf`.
- **Top Navbar Global**:
  - Pemilih periode kalender global terpadu (`📅 Bulan Tahun ▾`).
  - Pencarian cepat nama pegawai.
  - Tombol cetak PDF resmi dan toggle mode gelap/terang.
  - Profil pengguna interaktif dengan indikator sesi aktif.

---

### 3. Tampilan Mobile (Smartphone Android / iOS)
Layar smartphone dioptimalkan agar tidak perlu melakukan geser horizontal yang menyulitkan:
- **Responsive Adaptive Card View**: Setiap pegawai ditampilkan dalam bentuk kartu ringkas berisikan rincian 4 pos iuran dan tombol ubah status sekali ketuk (*1-tap toggle*).
- **Mobile Bottom Navigation**: Menu utama (*Dashboard, Iuran, Kas, Akun*) diletakkan di bagian bawah layar agar mudah dijangkau dengan satu tangan/jempol.
- **Filter Cepat & Search Bar**: Mempermudah pencarian nama personil di lapangan secara instan.

---

## ⚡ Fitur-Fitur Utama Aplikasi

### 1. Modul Rekapitulasi Iuran (Core)
- **Data Riil 46 Pegawai PA Gunung Sugih**: Telah memuat data pegawai bawaan lengkap dengan besaran nominal per golongan.
- **Kalkulasi Otomatis (Real-time Calculation)**: Total baris tiap pegawai dan grand total pos iuran dihitung otomatis tanpa jeda.
- **Multi-Bulan & Multi-Tahun**: Navigasi riwayat iuran antar-bulan tanpa menimpa data periode lain.
- **Pencatatan Status Lunas Instan**: Klik status lunas/belum lunas langsung memperbarui kas perbendaharaan.

### 2. Modul Export Excel Resmi (.xlsx)
- Menghasilkan file Excel fisik yang identik dengan format buku kas instansi:
  - Header ber-merge di tengah (`IURAN PTWP CABANG PENGADILAN AGAMA GUNUNG SUGIH`).
  - Baris penanda periode bulan (`Bulan : September 2026`).
  - Format angka akuntansi/Rupiah (`#,##0`).
  - Formula dinamis Excel (`=SUM(...)`) pada baris TOTAL.
  - Blok tanda tangan resmi di kanan bawah (*Gunung Sugih, [Bulan Tahun] - Bendahara Kantor: Wulan Febrianti, A.Md*).

### 3. Modul Import Excel Cerdas (Multi-Sheet Parser)
- Mengunggah berkas Excel (.xlsx / .csv) tahunan maupun bulanan.
- **Auto-Detection**: Mengenali otomatis lembar bulan (Januari s/d Desember), kolom Nama, Jabatan, dan nominal 4 pos iuran.
- **Live Preview Modal**: Pratinjau 5 baris pertama sebelum data disimpan ke dalam sistem.

### 4. Modul Executive Dashboard
- **Financial Health Bar**: Kartu ringkasan fokus pada **Iuran Terkumpul** dan **Saldo Kas PTWP**.
- **Breakdown 4 Pos Iuran**: Persentase realisasi penerimaan iuran Pusat, Daerah, Cabang, dan Turnamen.
- **Distribusi Anggota**: Komposisi personil berdasarkan unit kerja (Hakim, Kepaniteraan, Kesekretariatan, Staf).

### 5. Modul Buku Kas Cabang (Pemasukan & Pengeluaran)
- Pencatatan transaksi kas masuk riil (dari rekap iuran) dan pengeluaran operasional (pembelian bola tenis, sewa lapangan, konsumsi, kontingen turnamen).
- Perhitungan saldo kas berjalan otomatis: $\text{Saldo Kas} = \text{Kas Masuk} - \text{Kas Keluar}$.

### 6. Modul Autentikasi & Profil Pengguna
- **Halaman Login Bersih & Formal**:
  - Pilihan Satuan Kerja se-wilayah PTA Bandar Lampung dengan **Pengadilan Agama Gunung Sugih** sebagai pilihan utama/default.
  - Akses masuk menggunakan Username, NIP, atau WhatsApp + Password.
- **Modal Profil Pengguna Interaktif**:
  - Mengklik profil pengguna memunculkan pop-up profil yang rapi (Nama, Role, Satker, status aktif).
  - Akses cepat ke pengaturan satker & pejabat.
  - Tombol Logout aman dengan konfirmasi dialog untuk mencegah logout tak sengaja.

### 7. Pengaturan Satker & Penandatangan
- Ubah nama satuan kerja, kota, nama Ketua Cabang PTWP, dan nama Bendahara Kantor secara fleksibel tanpa menyentuh kode program.

---

## 📑 Spesifikasi Format Excel Resmi (Export/Import)

Struktur baris dan kolom yang didukung oleh modul Excel:

| Baris | Kolom A | Kolom B | Kolom C | Kolom D | Kolom E | Kolom F | Kolom G | Kolom H |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | <colspan 8> **IURAN PTWP CABANG PENGADILAN AGAMA GUNUNG SUGIH** | | | | | | | |
| **3** | | **Bulan : September 2026** | | | | | | |
| **5** | **NO** | **N A M A** | **JABATAN** | **IURAN PUSAT** | **IURAN DAERAH** | **IURAN CABANG** | **IURAN TOURNAMEN** | **TOTAL** |
| **10**| 1 | Dr. H. Al Fitri | Ketua | 20.000 | 20.000 | 20.000 | 20.000 | 80.000 |
| **11**| 2 | Ibrahim Lubis, S.H.I | Wakil Ketua | 20.000 | 20.000 | 20.000 | 17.500 | 77.500 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |
| **56**| **TOTAL** | | | **435.000** | **435.000** | **435.000** | **214.250** | **1.519.250** |
| **58**| | | | | | **Gunung Sugih, September 2026** | | |
| **59**| | | | | | **Bendahara Kantor** | | |
| **64**| | | | | | **Wulan Febrianti, A.Md** | | |

---

## 👥 Struktur Data & Tarif Iuran Standar (PA Gunung Sugih)

| Golongan / Jabatan | Contoh Pejabat | Pusat (Rp) | Daerah (Rp) | Cabang (Rp) | Tour (Rp) | Total (Rp) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Ketua** | Dr. H. Al Fitri | 20.000 | 20.000 | 20.000 | 20.000 | **80.000** |
| **Wakil Ketua** | Ibrahim Lubis, S.H.I., M.H | 20.000 | 20.000 | 20.000 | 17.500 | **77.500** |
| **Hakim** | Ertika Urie / Fitri | 20.000 | 20.000 | 20.000 | 15.000 | **75.000** |
| **Panitera / Sekretaris** | Bustanul Arifin / Aswari | 20.000 | 20.000 | 20.000 | 10.000 | **70.000** |
| **Panmud / Kasub / JabFung** | Novendaria / Ir. Lutfi / Zairi | 15.000 | 15.000 | 15.000 | 7.500 | **52.500** |
| **Panitera Pengganti (PP)** | Tugi / Erlia / Nurhasanah | 10.000 | 10.000 | 10.000 | 4.000 | **34.000** |
| **Jurusita (JS / JSP)** | M. Nur Ardian / Aswan / Finnur | 10.000 | 10.000 | 10.000 | 3.500 | **33.500** |
| **Staf / PPNPN** | Feby / Junisko / Windiyan / Natasya | 5.000 | 5.000 | 5.000 | 1.750 | **16.750** |

---

## 📁 Struktur Direktori Proyek

```text
APP PTWP/
├── src/
│   ├── app/
│   │   ├── globals.css         # Desain sistem global (Google Stitch, tokens, CSS variables)
│   │   ├── layout.jsx          # Root layout & meta tags SEO
│   │   ├── page.jsx            # Entry point halaman utama & state manager
│   │   └── api/dues/           # REST API endpoints (opsional / backend bridge)
│   ├── components/
│   │   ├── AuthView.jsx        # Halaman Login & Registrasi formal
│   │   ├── UserProfileModal.jsx# Modal profil akun, sesi aktif & tombol logout aman
│   │   ├── DashboardView.jsx   # Tampilan Executive Dashboard
│   │   ├── DuesTable.jsx       # Tabel Rekap Iuran desktop (8 kolom)
│   │   ├── DuesMobileCards.jsx # Tampilan kartu iuran khusus smartphone
│   │   ├── CashBookView.jsx    # Modul Buku Kas & Mutasi Kas Cabang
│   │   ├── ExcelExportModal.jsx# Dialog ekspor berkas Excel resmi
│   │   ├── ExcelImportModal.jsx# Dialog impor berkas Excel multi-sheet
│   │   ├── PeriodPickerModal.jsx# Dialog pemilih bulan & tahun iuran
│   │   ├── Navbar.jsx          # Topbar navigasi atas & kalender global
│   │   ├── Sidebar.jsx         # Sidebar navigasi desktop
│   │   ├── MobileBottomNav.jsx # Bottom navigation khusus smartphone
│   │   └── SettingsModal.jsx   # Modal pengaturan profil satker & penandatangan
│   └── services/
│       ├── storageService.js   # Repository data lokal & kalkulasi iuran
│       └── excelService.js     # Engine ekspor/impor Excel (ExcelJS & SheetJS)
├── public/                     # Aset statis & logo
├── package.json                # Dependensi proyek
└── README.md                   # Dokumentasi lengkap sistem
```

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### Persyaratan Sistem:
- **Node.js**: Versi 18.x atau lebih baru.
- **NPM**: Versi 9.x atau lebih baru.

### Langkah Menjalankan:
1. **Buka direktori proyek di terminal:**
   ```bash
   cd "C:\Users\rfd23\Documents\APP PTWP"
   ```
2. **Pasang dependensi (jika baru pertama kali):**
   ```bash
   npm install
   ```
3. **Jalankan development server:**
   ```bash
   npm run dev
   ```
4. **Buka aplikasi:**
   - **Di Laptop/PC**: Buka peramban ke [http://localhost:3000](http://localhost:3000)
   - **Di Smartphone (HP satu jaringan WiFi)**: Buka peramban ke `http://[IP-Komputer]:3000` (contoh: `http://192.168.100.223:3000`).

---

## 🛠️ Rencana Arsitektur & Teknologi
- **Framework Utama**: [Next.js 14](https://nextjs.org/) (React 18) — Memberikan performa cepat, SSR/SSG teroptimasi, dan tata letak responsif.
- **Excel Engine**: [exceljs](https://github.com/exceljs/exceljs) — Menjamin kepatuhan format fisik laporan dinas (border, warna header hijau dinas, merge cell, dan formula SUM).
- **Import Parser**: [xlsx (SheetJS)](https://sheetjs.com/) — Membaca berbagai format file lembar kerja (.xlsx, .xls, .csv).
- **Icons**: [Lucide React](https://lucide.dev/) — Ikon grafis vektor modern dan konsisten.
- **Styling**: Vanilla CSS Kustom + Google Stitch Design Tokens — Menjamin performa cepat tanpa beban library CSS yang berat.
- **Arsitektur Penyimpanan**: *Service Repository Pattern* — Menggunakan localStorage terstruktur yang siap disambungkan ke Database API eksternal kapan saja.
