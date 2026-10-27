# DESIGN SYSTEM & STITCH SPECIFICATION: PTWP-HUB
**Aplikasi Web Responsif Pengelolaan & Rekapitulasi Iuran PTWP Cabang Pengadilan Agama Gunung Sugih**

---

## 1. Brand & Visual Identity

### 1.1 Color Palette (Design Tokens)
- **Primary / Judicial Forest Green**:
  - `primary-900`: `#062319` (Dark background accent / text in light mode)
  - `primary-800`: `#0B3B2B` (Sidebar background, dark headers)
  - `primary-700`: `#0F5132` (Primary Brand Color - official court green)
  - `primary-600`: `#134E4A` (Hover states & interactive elements)
  - `primary-100`: `#DCFCE7` (Light green chips / status badges)
  - `primary-50`: `#F0FDF4` (Row highlight & subtle card tint)
- **Secondary / Tennis Accent**:
  - `accent-gold`: `#EAB308` (Tennis ball yellow / gold badge)
  - `accent-amber`: `#F59E0B` (Warning / pending payment)
  - `accent-light`: `#FEF9C3` (Light yellow badge background)
- **Status & Feedback**:
  - `success`: `#16A34A` (Lunas / Paid)
  - `success-bg`: `#DCFCE7`
  - `warning`: `#D97706` (Belum Bayar / Pending)
  - `warning-bg`: `#FEF3C7`
  - `danger`: `#DC2626` (Tunggakan / Overdue)
- **Neutrals & Surfaces**:
  - `surface-bg`: `#F8FAFC` (Clean desktop & mobile page background)
  - `surface-card`: `#FFFFFF` (Card & modal background)
  - `surface-border`: `#E2E8F0` (Thin crisp borders)
  - `text-main`: `#0F172A` (Headings & table text)
  - `text-muted`: `#64748B` (Subtitles, labels, timestamps)

### 1.2 Typography
- **Font Family**: Inter, Roboto, or Outfit (Google Fonts)
- **Scale**:
  - Title / Hero: `24px - 28px` (SemiBold / Bold 700)
  - Section Header: `18px - 20px` (SemiBold 600)
  - Body Text: `14px` (Regular 400)
  - Caption / Subtext: `12px` (Medium 500)
  - Monospace / Numeric Figures: Tabular figures for Rupiah alignment (`font-variant-numeric: tabular-nums;`)

---

## 2. Layouts & Responsive Breakpoints

- **Desktop (>= 1024px)**:
  - Sidebar width: `260px` (Collapsible to `72px`)
  - Content area: Max width `1440px` centered with `32px` padding
  - Metrics Grid: 4 columns
  - Data Table: Full width with sticky header and right-aligned numeric columns
- **Tablet (768px - 1023px)**:
  - Metrics Grid: 2 columns
  - Data Table: Scrollable horizontal with sticky first 2 columns (No & Nama)
- **Mobile (< 768px, target 390px - 430px)**:
  - Sidebar converted to Bottom Navigation Bar (`64px` height) or Slide-in Drawer
  - Metrics Grid: 2x2 grid or horizontal swipe carousel
  - Data Representation: **Employee Card Feed** (bukan tabel lebar)
  - Actions: Floating Action Button (FAB) atau sticky bottom action bar

---

## 3. Screen Specifications for Google Stitch

Gunakan prompt di bawah ini untuk men-generate screen di Google Stitch:

### Screen 1: Desktop - Dashboard & Rekapitulasi Iuran (1440 x 900)
**Prompt Stitch:**
> "A modern judicial web application dashboard for 'PTWP Cabang Pengadilan Agama Gunung Sugih'. Desktop view (1440x900). Deep emerald green (#0F5132) left sidebar with navigation items (Dashboard, Rekap Iuran, Kas Cabang, Agenda Turnamen, Data Anggota, Pengaturan). Top header bar with institution logo, period dropdown 'Bulan: September 2026', search input, and admin avatar. Main content has four summary metric cards at the top (Total Iuran: Rp 1.519.250, Terkumpul: Rp 1.250.000, Belum Lunas: 8 Anggota, Saldo Kas: Rp 4.850.000) with subtle gradient borders. Below is a toolbar with action buttons: green 'Import Excel' button, gold 'Export Excel Resmi' button, print icon, and '+ Tambah Anggota' button. Below the toolbar is a comprehensive data table with columns: NO, NAMA, JABATAN, IURAN PUSAT, IURAN DAERAH, IURAN CABANG, IURAN TOURNAMEN, TOTAL, STATUS, AKSI. Include sample official court rows (Dr. H. Al Fitri - Ketua, Ibrahim Lubis - Wakil Ketua, Ertika Urie - Hakim, Novendaria - Panmud). Bottom row displays bold TOTAL sums with Rp 1.519.250. Right corner below the table shows signature block: 'Gunung Sugih, September 2026', 'Bendahara Kantor', 'Wulan Febrianti, A.Md'. Clean, crisp, high-contrast, professional judicial atmosphere."

---

### Screen 2: Mobile - Daftar Iuran Anggota (Card View) (390 x 844)
**Prompt Stitch:**
> "A mobile-first responsive view of PTWP Court Dues management application for iPhone (390x844). Clean light background (#F8FAFC) with deep green top app bar displaying 'PTWP PA Gunung Sugih' and month pill selector 'September 2026'. Below the header is a compact summary banner: 'Total: Rp 1.519.250 • 82% Lunas'. Search bar with filter pills (Semua, Hakim, Kepaniteraan, Staf). Below is a vertical list of employee cards: Card 1 shows '#1 Dr. H. Al Fitri', badge 'Ketua', status pill 'Lunas' in green, a clean 2x2 grid of dues (Pusat: 20k, Daerah: 20k, Cabang: 20k, Tour: 20k), bold total 'Rp 80.000', and a quick toggle button. Card 2 shows '#2 Ibrahim Lubis, S.H.I., M.H' (Wakil Ketua). Card 3 shows '#7 Novendaria Rosa Anita' (Panmud) with status 'Belum Bayar' in amber. At the bottom of the screen is an ergonomic bottom navigation bar with 4 tabs: Dashboard, Iuran, Kas, and Akun. Polished mobile UI, touch-friendly padding, rounded corners."

---

### Screen 3: Desktop & Mobile Modal - Import & Export Excel Preview
**Prompt Stitch:**
> "A sleek modal dialog overlay for Excel Import & Export in PTWP PA Gunung Sugih application. Centered white card with rounded corners and glassmorphism backdrop. Header title: 'Pratinjau Export / Import Excel Resmi'. Inside is a drag-and-drop file upload zone with a dashed border, spreadsheet icon, and text 'Tarik file .xlsx atau klik untuk memilih'. Below is a live data preview showing how the official headers will look: 'IURAN PTWP CABANG PENGADILAN AGAMA GUNUNG SUGIH', 'Bulan: September 2026', followed by a mini 5-row table preview with columns NO, NAMA, JABATAN, PUSAT, DAERAH, CABANG, TOUR, TOTAL, and signature footer preview for Bendahara 'Wulan Febrianti, A.Md'. Two primary buttons at the bottom: Secondary 'Batal' and vibrant emerald green 'Unduh File Excel Resmi (.xlsx)' with download icon."

---

### Screen 4: Desktop - Buku Kas Cabang & Agenda Turnamen (1440 x 900)
**Prompt Stitch:**
> "A dual-section financial and sports agenda screen for PTWP tennis association. Left section is 'Buku Kas PTWP Cabang' with recent transaction entries: incoming member dues (+Rp 1.519.250), purchase of tennis balls Dunlop Fort (-Rp 350.000), court maintenance (-Rp 200.000), showing current cash balance badge 'Rp 4.850.000'. Right section is 'Agenda Tenis & Turnamen' displaying next weekly practice card: 'Latihan Rutin Jumat Pagi di Lapangan Pemda', countdown to 'Turnamen PTWP KPTA Bandar Lampung Cup 2026', and athlete roster badges (Ganda Hakim, Ganda Karyawan, Tunggal Putri). Elegant layout, tennis-inspired subtle graphics, clean typography."

---

### Screen 5: Halaman Login & Registrasi (Desktop: 1440 x 900 & Mobile: 390 x 844)
**Prompt Stitch (Login):**
> "An elegant judicial authentication page for 'PTWP Cabang Pengadilan Agama Gunung Sugih'. Split desktop view (1440x900) or centered card for mobile. Left side has a majestic deep emerald green (#0F5132) gradient banner with court gavel / tennis emblem watermark, quote 'Sportivitas & Integritas Warga Peradilan', and quick stats. Right side is a crisp clean card featuring the official logo, title 'Masuk ke PTWP-Hub', subtitle 'Sistem Pengelolaan Iuran & Kegiatan Tenis'. Form fields: NIP / Username / Email with icon, Password with toggle eye icon, 'Ingat Saya' checkbox, and 'Lupa Password?' link. Primary button in vibrant tennis gold (#EAB308) with dark text 'Masuk Sekarang'. Below is a divider and link 'Belum punya akun? Registrasi Pegawai'. Professional, trustworthy, modern judicial aesthetic."

**Prompt Stitch (Registrasi Pegawai):**
> "A user-friendly employee registration screen for judicial staff joining 'PTWP Cabang PA Gunung Sugih'. Clean card layout with progress indicator. Form fields: Nama Lengkap beserta Gelar, NIP (18 digit), Dropdown Pilihan Jabatan (Hakim, Panmud, Kasub, PP, Jurusita, Staf), Nomor WhatsApp Aktif (untuk info iuran), Password, dan Konfirmasi Password. Role badge selector: 'Pegawai / Anggota' vs 'Pengurus / Bendahara (Membutuhkan Approval)'. Disclaimer text on privacy and data protection in courts. Primary action button 'Daftar Akun Anggota' and link back to 'Sudah punya akun? Masuk'."

---

## 4. Key UI Components

1. **Metric Card Component (`MetricCard`)**:
   - Icon container with 15% opacity background
   - Metric Title (uppercase, 11px, tracking-wider)
   - Big Value (22px bold)
   - Secondary subtitle / percentage pill indicator

2. **Dues Table Component (`DuesTable`)**:
   - Hoverable table rows
   - Numeric alignment: `text-align: right;` with monospace numbers
   - Sticky header with shadow on scroll
   - Checkbox column for batch actions

3. **Adaptive Employee Card (`EmployeeMobileCard`)**:
   - Name and Title header
   - Dues breakdown grid (4 cells)
   - Total amount highlighted
   - Action buttons (Detail, Toggle Status)

4. **Status Badge (`StatusBadge`)**:
   - `Lunas`: Green background `#DCFCE7`, text `#16A34A`
   - `Belum Bayar`: Amber background `#FEF3C7`, text `#D97706`
   - `Bebas Iuran / Mutasi`: Gray background `#F1F5F9`, text `#64748B`

5. **Auth Card Component (`AuthContainer` & `InputField`)**:
   - Floating label or crisp modern label with icons (User, Lock, Mail, Phone)
   - Real-time validation feedback (NIP format, password match)
   - Seamless role switching tab (Admin / Bendahara vs Pegawai)

