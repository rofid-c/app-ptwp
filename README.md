# 🎾 PTWP-Hub (Sistem Informasi & Rekapitulasi Iuran PTWP)
> **Aplikasi Pengelolaan Iuran, Kas, dan Agenda PTWP Cabang Pengadilan Agama Gunung Sugih**  
> Didesain responsif (*mobile-first & desktop-optimized*) dengan sistem Export/Import Excel otomatis bersesuaian format resmi peradilan.

---

## 📌 Daftar Isi
1. [Latar Belakang & Tujuan](#-latar-belakang--tujuan)
2. [Konsep Desain UI/UX (Desktop vs Mobile)](#-konsep-desain-uiux-desktop-vs-mobile)
3. [Fitur-Fitur Fungsional](#-fitur-fitur-fungsional)
4. [Spesifikasi Format Excel Resmi (Export/Import)](#-spesifikasi-format-excel-resmi-exportimport)
5. [Struktur Data & Tarif Iuran Standar](#-struktur-data--tarif-iuran-standar)
6. [Panduan Desain untuk Google Stitch](#-panduan-desain-untuk-google-stitch)
7. [Rencana Arsitektur & Teknologi](#-rencana-arsitektur--teknologi)

---

## 🎯 Latar Belakang & Tujuan
PTWP (Persatuan Tenis Warga Peradilan) merupakan wadah olahraga resmi di bawah Mahkamah Agung RI. Pada tingkat cabang satker (Pengadilan Agama Gunung Sugih), bendahara mengelola:
- Rekapitulasi iuran rutin bulanan untuk 4 tingkatan (Iuran Pusat, Daerah, Cabang, dan Tournamen) dari 46+ pegawai lintas jabatan (Hakim hingga Staf/PPNPN).
- Kebutuhan laporan formal berkala bertanda tangan Bendahara Kantor dalam format Microsoft Excel.
- Pemantauan kas cabang untuk operasional latihan dan persiapan turnamen resmi (KPTA Cup, MA Cup).

Aplikasi ini hadir untuk mempermudah bendahara dan pengurus dengan antarmuka yang modern, nyaman dibuka dari smartphone anggota/bendahara maupun dari laptop kantor.

---

## 🎨 Konsep Desain UI/UX (Desktop vs Mobile)

### 1. Palet Warna & Identitas Visual (Court & Justice Theme)
- **Primary / Dominan (Emerald Court Green)**: `#0F5132` / `#134E4A` — Merepresentasikan wibawa instansi Pengadilan Agama sekaligus warna rumput/lapangan tenis.
- **Accent / Highlight (Tennis Ball Yellow & Gold)**: `#EAB308` / `#FACC15` — Warna dinamis untuk badge status, tombol aksi utama, dan kartu sorotan.
- **Surface / Background**:
  - *Light Mode*: Latar belakang bersih putih-keabu lembut (`#F8FAFC`) dengan kartu berbingkai tipis modern (`#E2E8F0`).
  - *Dark Mode*: Nuansa elegan slate gelap (`#0F172A`) dengan sentuhan deep forest green (`#062319`).
- **Tipografi**: Menggunakan font modern sans-serif yang tajam dan nyaman dibaca angka akuntansinya (Inter / Outfit / Roboto).

---

### 2. Tampilan Desktop (Laptop / PC)
Desktop dioptimalkan untuk bendahara saat bekerja intensif di meja kantor:

```
+-----------------------------------------------------------------------------------------------+
| [🎾 PTWP PA GUNUNG SUGIH]   [🔍 Cari Pegawai...]   [Bulan: September 2026 ▼]   [🌙 Mode] [👤] |
+------------------+----------------------------------------------------------------------------+
| 📊 Dashboard     |  +----------------+ +----------------+ +----------------+ +----------------+ |
| 📋 Rekap Iuran   |  | Total Iuran    | | Terkumpul      | | Belum Bayar    | | Saldo Kas      | |
| 💰 Kas Cabang    |  | Rp 1.519.250   | | Rp 1.250.000   | | 8 Pegawai      | | Rp 4.850.000   | |
| 🎾 Turnamen      |  +----------------+ +----------------+ +----------------+ +----------------+ |
| 👥 Data Anggota  |                                                                            |
| ⚙️ Pengaturan    |  Toolbar: [📥 Import Excel] [📤 Export Resmi] [🖨️ Cetak PDF] [➕ Tambah Data] |
|                  |                                                                            |
|                  |  Tabel Rekapitulasi (Sticky Header):                                       |
|                  |  +----+---------------------+------------+-------+--------+--------+-----+ |
|                  |  | NO | NAMA                | JABATAN    | PUSAT | DAERAH | CABANG | ... | |
|                  |  +----+---------------------+------------+-------+--------+--------+-----+ |
|                  |  |  1 | Dr. H. Al Fitri     | Ketua      | 20.000| 20.000 | 20.000 | ... | |
|                  |  |  2 | Ibrahim Lubis, S.H.I| Wakil Ketua| 20.000| 20.000 | 20.000 | ... | |
|                  |  +----+---------------------+------------+-------+--------+--------+-----+ |
|                  |  | TOTAL: Rp 435.000 | Rp 435.000 | Rp 435.000 | Rp 214.250 = 1.519.250 | |
|                  |                                                                            |
|                  |  Pratinjau Tanda Tangan:                                                   |
|                  |  Gunung Sugih, September 2026 | Bendahara Kantor: Wulan Febrianti, A.Md    |
+------------------+----------------------------------------------------------------------------+
```

**Karakteristik Desktop:**
- **Sidebar Navigasi Tetap**: Menu rapi di sisi kiri dengan ikon yang intuitif.
- **Smart Data Table**:
  - Kolom lengkap: Nomor, Nama Pegawai, Jabatan, Iuran Pusat, Iuran Daerah, Iuran Cabang, Iuran Tournamen, Total, Status Bayar, dan Aksi.
  - *Sticky Header*: Judul kolom tidak hilang saat scroll ke baris ke-46.
  - *Filter Cepat*: Tombol tab instan (`Semua`, `Hakim`, `Kepaniteraan`, `Kesekretariatan`, `Staf`).

---

### 3. Tampilan HP (Smartphone / Tablet)
Layar HP memiliki ruang horizontal terbatas. Menampilkan tabel 8 kolom langsung di HP akan membuat teks kekecilan dan memaksa scroll kiri-kanan.  
**Solusi HP: Responsive Adaptive Card View (Tampilan Kartu Pegawai)**.

```
+------------------------------------+
| 🎾 PTWP PA Gunung Sugih       [≡] |
| Periode: September 2026            |
+------------------------------------+
| [ 46 Anggota ]  [ 82% Lunas ]      |
| Total: Rp 1.519.250                |
+------------------------------------+
| [🔍 Cari Nama Pegawai...]          |
| [ Semua ] [ Hakim ] [ Staf ] [Filter]|
+------------------------------------+
| +--------------------------------+ |
| | #1 Dr. H. Al Fitri             | |
| | [ Ketua ]          [● Lunas]   | |
| |                                | |
| | Pusat: 20k    | Daerah: 20k    | |
| | Cabang: 20k   | Tour: 20k      | |
| | ------------------------------ | |
| | Total Iuran:    Rp 80.000      | |
| | [ Detail / Edit ] [ Status v ] | |
| +--------------------------------+ |
| +--------------------------------+ |
| | #2 Ibrahim Lubis, S.H.I., M.H  | |
| | [ Wakil Ketua ]    [● Lunas]   | |
| | Total Iuran:    Rp 77.500      | |
| +--------------------------------+ |
+------------------------------------+
| [ 🏠 Home ] [ 📋 Iuran ] [ 📤 Export ] | (Bottom Bar)
+------------------------------------+
```

**Karakteristik Mobile:**
- **Card-Based Feed**: Setiap anggota dirangkum dalam kartu yang rapi dan mudah di-*tap*.
- **Bottom Navigation**: 3-4 menu utama diletakkan di bawah layar agar mudah dijangkau satu tangan/jempol.
- **Bottom Sheet Modal**: Form tambah/edit data muncul meluncur mulus dari bawah layar, tanpa membebani navigasi.
- **Quick Status Toggle**: Cukup sekali ketuk untuk menandai sudah bayar atau belum.

---

## ⚡ Fitur-Fitur Fungsional

### 1. Modul Rekapitulasi Iuran (Inti)
- **Data Bawaan 46 Pegawai**: Langsung memuat data riil PA Gunung Sugih.
- **Perhitungan Otomatis (Auto-Calculate)**: Total baris tiap pegawai dan grand total dihitung otomatis secara *real-time* saat nominal diubah.
- **Multi-Bulan & Multi-Tahun**: Navigasi riwayat iuran (Januari s/d Desember, tahun ke tahun) tanpa saling menimpa data.
- **Pencarian & Filter Instan**: Cari berdasarkan nama anggota, NIP, atau kelompok jabatan.

### 2. Modul Export Excel Pintar (Auto-Formatting)
- Menghasilkan file `.xlsx` yang tampilannya persis seperti format fisik resmi Pengadilan:
  - Header judul ber-merge di tengah (`IURAN PTWP CABANG PENGADILAN AGAMA GUNUNG SUGIH`).
  - Baris periode bulan (`Bulan : September 2026`).
  - Baris penomoran panduan kolom resmi (`1, 2, 9, ... 15, 16`).
  - Garis border sel hitam rapi (*thin borders*).
  - Format angka akuntansi/Rupiah standar Excel.
  - Formula Excel dinamis (`=SUM(...)`) pada baris TOTAL.
  - Bagian titimangsa tanda tangan otomatis di kanan bawah:
    - Lokasi & Tanggal (*Gunung Sugih, [Tanggal/Bulan/Tahun]*).
    - Jabatan penandatangan (*Bendahara Kantor*).
    - Nama bendahara resmi (*Wulan Febrianti, A.Md*).

### 3. Modul Import Excel Cerdas
- Memungkinkan bendahara mengunggah file spreadsheet bulanan (`.xlsx` / `.csv`).
- **Auto-Mapping**: Sistem otomatis mengenali kolom Nama, Jabatan, dan rincian iuran.
- **Live Preview Modal**: Bendahara dapat memeriksa pratinjau data sebelum menekan tombol "Simpan ke Sistem".

### 4. Modul Executive Dashboard & Statistik
- **Metrik Utama**: Total Iuran Periode, Persentase Terkumpul, Jumlah Anggota Aktif, Saldo Kas.
- **Visualisasi Chart**:
  - Grafik tren pembayaran per bulan.
  - Diagram proporsi iuran (Pusat vs Daerah vs Cabang vs Tournamen).
  - Progress bar pelunasan per unit kerja.

### 5. Modul Buku Kas Cabang (Pemasukan & Pengeluaran)
- Pencatatan pengeluaran operasional cabang (beli bola tenis, sewa lapangan, perlengkapan latihan, biaya kontingen turnamen).
- Rekapitulasi saldo kas berjalan (Iuran Masuk - Pengeluaran Kas).

### 6. Modul Agenda Tenis & Turnamen
- Kalender jadwal latihan rutin satker (hari, waktu, lokasi lapangan).
- Info turnamen resmi PTWP (KPTA Cup Lampung, MA Cup, Invitasi Antar-Peradilan).
- Daftar skuad atlet cabang PA Gunung Sugih (Ganda Putra Hakim, Ganda Karyawan, Tunggal Putri, Veteran).

### 7. Modul Autentikasi & Manajemen Pengguna (Login & Registrasi)
- **Halaman Login Terpadu**:
  - Akses masuk menggunakan **NIP (18 digit)**, Username, atau Email + Password.
  - Opsi *Remember Me* dan *Lupa Password*.
- **Halaman Registrasi Anggota (Pendaftaran Pegawai)**:
  - Form registrasi mandiri pegawai: Nama Lengkap beserta Gelar, NIP, Jabatan (dropdown), No. WhatsApp, Email, dan Password.
  - Validasi NIP dan nomor kontak agar terhubung otomatis ke data rekap iuran.
- **Tingkatan Hak Akses (Role-Based Access Control / RBAC)**:
  - **1. Bendahara / Admin**: Akses penuh ke seluruh fitur (edit iuran seluruh pegawai, import/export Excel, catat kas keluar, atur jadwal & pengaturan satker).
  - **2. Anggota / Pegawai**: Login untuk melihat status pembayaran iuran pribadinya, mengunduh bukti kuitansi digital, dan melihat agenda tenis cabang.
  - **3. Pimpinan / Ketua Cabang**: Akses pemantauan dashboard eksekutif, verifikasi rekapitulasi bulanan, dan approval laporan.

### 8. Modul Pengaturan Satker & Pejabat
- Pengaturan profil satker (Nama Pengadilan, Alamat, Logo).
- Pengaturan Penandatangan (Nama Bendahara, Nama Ketua PTWP Cabang, NIP/Gelar).
- Pengaturan Tarif Default per Golongan/Jabatan.

### 9. Fitur Tambahan (Opsional)
- **📲 1-Click WhatsApp Reminder** *(Status: Opsi / Dapat Diaktifkan saat Diperlukan)*:
  - Tombol pengingat cepat via WhatsApp bagi anggota yang belum menyelesaikan iuran dengan draf pesan otomatis yang santun.


---

## 📑 Spesifikasi Format Excel Resmi (Export/Import)

Format file Excel wajib memenuhi struktur berikut:

| Baris | Kolom A | Kolom B | Kolom C | Kolom D | Kolom E | Kolom F | Kolom G | Kolom H |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | <colspan 8> **IURAN PTWP CABANG PENGADILAN AGAMA GUNUNG SUGIH** | | | | | | | |
| **3** | | **Bulan : September 2026** | | | | | | |
| **5** | **NO** | **N A M A** | **JABATAN** | **IURAN PUSAT** | **IURAN DAERAH** | **IURAN CABANG** | **IURAN TOURNAMEN** | **TOTAL** |
| **7** | 1 | 2 | 9 | | | | 15 | 16 |
| **10**| 1 | Dr. H. Al Fitri | Ketua | 20.000 | 20.000 | 20.000 | 20.000 | 80.000 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |
| **56**| **TOTAL** | | | **435.000** | **435.000** | **435.000** | **214.250** | **1.519.250** |
| **58**| | | | | | **Gunung Sugih, September 2026** | | |
| **59**| | | | | | **Bendahara Kantor** | | |
| **64**| | | | | | **Wulan Febrianti, A.Md** | | |

---

## 👥 Struktur Data & Tarif Iuran Standar

Data awal beranggotakan 46 personil PA Gunung Sugih dengan pembagian tarif standar:

| Golongan / Jabatan | Contoh Pejabat | Iuran Pusat | Iuran Daerah | Iuran Cabang | Iuran Tournamen | Total Iuran |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Ketua** | Dr. H. Al Fitri | 20.000 | 20.000 | 20.000 | 20.000 | **80.000** |
| **Wakil Ketua** | Ibrahim Lubis, S.H.I., M.H | 20.000 | 20.000 | 20.000 | 17.500 | **77.500** |
| **Hakim** | Ertika Urie / Fitri | 20.000 | 20.000 | 20.000 | 15.000 | **75.000** |
| **Panitera / Sekretaris** | Bustanul Arifin / Aswari | 20.000 | 20.000 | 20.000 | 10.000 | **70.000** |
| **Panmud / Kasub / JabFung** | Novendaria / Ir. Lutfi / Zairi | 15.000 | 15.000 | 15.000 | 7.500 | **52.500** |
| **Panitera Pengganti (PP)** | Tugi / Erlia / Nurhasanah | 10.000 | 10.000 | 10.000 | 4.000 | **34.000** |
| **Jurusita (JS / JSP)** | M. Nur Ardian / Aswan / Finnur | 10.000 | 10.000 | 10.000 | 3.500 | **33.500** |
| **Staf / Pelaksana** | Feby / Junisko / Windiyan / Natasya | 5.000 | 5.000 | 5.000 | 1.750 | **16.750** |

---

## 🎨 Panduan Desain untuk Google Stitch

Dokumen pelengkap **`DESIGN.md`** telah disiapkan khusus untuk digunakan langsung pada **Google Stitch**.

### Layar yang Disarankan untuk Dibuat di Stitch:
1. **Screen 1: Desktop - Dashboard & Rekap Iuran**
   - Layar desktop lebar (1440px).
   - Sidebar hijau tua Mahkamah Agung (`#0F5132`).
   - 4 kartu ringkasan di atas.
   - Tabel data 46 pegawai dengan badge status dan tombol Export Excel emas/kuning.
2. **Screen 2: Mobile - Daftar Iuran Anggota (Card View)**
   - Layar smartphone (390px x 844px).
   - Header aplikasi ringkas dengan pemilih bulan.
   - Kartu pegawai dengan rincian 4 jenis iuran.
   - Bottom navigation bar (Home, Iuran, Kas, Profil).
3. **Screen 3: Modal / Drawer - Import & Export Excel Preview**
   - Modal popup elegan untuk drag & drop file spreadsheet dan live preview hasil mapping data.
4. **Screen 4: Desktop - Buku Kas Cabang & Agenda Turnamen**
   - Halaman pencatatan operasional kas dan agenda jadwal latihan lapangan tenis.

---

## 🛠️ Rencana Arsitektur & Teknologi

- **Frontend & Fullstack Framework**: Next.js (React) — Menjamin responsif di HP & Laptop, serta siap integrasi backend.
- **Excel Engine**: `exceljs` — Mendukung pemformatan lengkap (styling, merge cell, warna header, auto-width, border kotak, rumus SUM, dan blok tanda tangan).
- **Import Parser**: `xlsx` (SheetJS) — Mampu membaca beragam ekstensi file (.xlsx, .xls, .csv).
- **Styling**: Vanilla CSS kustom berstandar modern (CSS variables, CSS grid, flexbox, glassmorphism, responsive breakpoints) tanpa ketergantungan utility yang kaku.
- **Persistensi Data**: Service repository pattern (dimulai dari state/localStorage terstruktur, siap beralih ke Database API kapan saja).
