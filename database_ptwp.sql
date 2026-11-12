-- ========================================================
-- SISTEM TERPADU PTWP MAHKAMAH AGUNG RI (MULTI SATKER)
-- Skema Database: db_ptwp
-- ========================================================

CREATE DATABASE IF NOT EXISTS `db_ptwp` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `db_ptwp`;

-- 1. TABEL SATUAN KERJA (SATKER)
DROP TABLE IF EXISTS `satker`;
CREATE TABLE `satker` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `code` VARCHAR(50) NOT NULL,
  `type` ENUM('cabang', 'daerah', 'pusat') DEFAULT 'cabang',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `satker` (`name`, `code`, `type`) VALUES
('Pengadilan Agama Gunung Sugih', 'PA_GS', 'cabang'),
('Pengadilan Tinggi Agama Bandar Lampung', 'PTA_BDL', 'daerah'),
('Pengadilan Agama Tanjung Karang', 'PA_TJK', 'cabang'),
('Pengadilan Agama Metro', 'PA_METRO', 'cabang'),
('Pengadilan Agama Kalianda', 'PA_KLA', 'cabang'),
('Pengadilan Agama Tanggamus', 'PA_TGM', 'cabang'),
('Pengadilan Agama Pringsewu', 'PA_PRW', 'cabang'),
('Pengadilan Agama Gedong Tataan', 'PA_GDT', 'cabang'),
('Pengadilan Agama Sukadana', 'PA_SKD', 'cabang'),
('Pengadilan Agama Kotabumi', 'PA_KTB', 'cabang'),
('Pengadilan Agama Blambangan Umpu', 'PA_BBU', 'cabang'),
('Pengadilan Agama Krui', 'PA_KRU', 'cabang'),
('Pengadilan Agama Tulang Bawang Tengah', 'PA_TBT', 'cabang'),
('Pengadilan Agama Tulang Bawang', 'PA_TBW', 'cabang'),
('Pengadilan Agama Mesuji', 'PA_MSJ', 'cabang');

-- 2. TABEL PENGGUNA (USERS)
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT '',
  `email` VARCHAR(150) DEFAULT '',
  `satker` VARCHAR(255) NOT NULL,
  `title` VARCHAR(100) DEFAULT 'Pegawai',
  `role` ENUM('super_admin', 'bendahara', 'anggota', 'pusat', 'pimpinan') DEFAULT 'anggota',
  `role_label` VARCHAR(150) DEFAULT 'Pegawai / Anggota',
  `level` VARCHAR(50) DEFAULT 'cabang',
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`username`, `password`, `name`, `phone`, `email`, `satker`, `title`, `role`, `role_label`, `level`) VALUES
('Aku admin', '$scrypt$b38cb8ad300371fac3d68585674c67ae$d6b5a006f79f607060c9b088ebb7adc1583c92c16ac1532ecae268f173ed4ba26d10fb1e8fb912807a1ae2d1be2be5b73b30da6ee1295ec6cb1ba8ee0e52856f', 'Super Administrator PTWP', '081299998888', 'superadmin@mahkamahagung.go.id', 'Mahkamah Agung RI', 'Super Administrator Pusat', 'super_admin', 'Super Administrator Pusat', 'super_admin'),
('user test', '$scrypt$0f1a1c471c2fcffdfed6ef7cfd8b3e70$1e120b346f2cdfa9bae19289fe8476562781a1b60320235ae585c97a0f97ced0f7442682cdaf053553a07f61dd1105d931935d8fc205cadeddf1408f062555cf', 'User Test PA Gunung Sugih', '081234567890', 'test@pags.go.id', 'Pengadilan Agama Gunung Sugih', 'Bendahara Cabang', 'bendahara', 'Bendahara Pengeluaran', 'cabang'),
('bendahara_metro', '$scrypt$4b7ca1e5fdc7f6ca5457932d3aae0d60$0835fa03a56cc35582416abe0f8f2267ffda7cc69d5b9b5c7b7da8a1518ce0c58fda9bbd00d49d702c143ac1d041db482aa95628806e38bf61d4d2bca6ca5c2f', 'Bendahara PA Metro', '081211112222', 'bendahara@pametro.go.id', 'Pengadilan Agama Metro', 'Bendahara Pengeluaran', 'bendahara', 'Bendahara Pengeluaran', 'cabang'),
('bendahara_pta', '$scrypt$7ba8b3a7e3b22550f71dcb38e46c9b5e$c19becbc39eff680016fab66ac04d427238b49f18f14097c9297288a32099ead45fb214993f7e92eba6a4a889fe263226255b3f22a42d3f4d9f7c46eb8c77040', 'Bendahara PTA Bandar Lampung', '081233334444', 'bendahara@ptabdl.go.id', 'Pengadilan Tinggi Agama Bandar Lampung', 'Bendahara Pengurus Daerah', 'bendahara', 'Bendahara Daerah', 'daerah');

-- 3. TABEL PERMOHONAN AKUN (ACCOUNT_REQUESTS)
DROP TABLE IF EXISTS `account_requests`;
CREATE TABLE `account_requests` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `satker` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `title` VARCHAR(100) DEFAULT 'Hakim',
  `password` VARCHAR(255) NOT NULL,
  `note` TEXT,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `approved_at` TIMESTAMP NULL,
  `rejected_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABEL ANGGOTA PTWP (MEMBERS)
-- Data anggota diisi melalui fitur Import Excel oleh bendahara masing-masing cabang
-- Menggunakan Composite Primary Key (satker, period, id) agar daftar pegawai terisolasi akurat per periode bulan
DROP TABLE IF EXISTS `members`;
CREATE TABLE `members` (
  `id` VARCHAR(100) NOT NULL,
  `satker` VARCHAR(255) NOT NULL,
  `period` VARCHAR(50) NOT NULL DEFAULT 'September 2026',
  `nip` VARCHAR(50) DEFAULT '',
  `name` VARCHAR(255) NOT NULL,
  `title` VARCHAR(100) DEFAULT '',
  `category` VARCHAR(100) DEFAULT 'Hakim',
  `pusat` DECIMAL(15,2) DEFAULT 0,
  `daerah` DECIMAL(15,2) DEFAULT 0,
  `cabang` DECIMAL(15,2) DEFAULT 0,
  `tournamen` DECIMAL(15,2) DEFAULT 0,
  `paid` TINYINT(1) DEFAULT 1,
  `paid_date` VARCHAR(50) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`satker`, `period`, `id`),
  INDEX `idx_satker_period` (`satker`, `period`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABEL STATUS PEMBAYARAN IURAN PER PERIODE (DUES_RECORDS)
-- Status pembayaran terisi otomatis berdasarkan rekap iuran tiap periode
DROP TABLE IF EXISTS `dues_records`;
CREATE TABLE `dues_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `period` VARCHAR(50) NOT NULL,
  `satker` VARCHAR(255) NOT NULL,
  `member_id` VARCHAR(100) NOT NULL,
  `paid` TINYINT(1) DEFAULT 1,
  `paid_date` VARCHAR(50) DEFAULT NULL,
  `created_by` VARCHAR(150) DEFAULT 'Sistem',
  `updated_by` VARCHAR(150) DEFAULT 'Sistem',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_period_member` (`period`, `satker`, `member_id`),
  INDEX `idx_satker_period` (`satker`, `period`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABEL BUKU KAS (CASHBOOK)
-- Catatan mutasi kas masuk/keluar yang dicatat oleh bendahara
-- Menggunakan Composite Primary Key (satker, id) agar ID mutasi tidak bentrok antar cabang
DROP TABLE IF EXISTS `cashbook`;
CREATE TABLE `cashbook` (
  `id` VARCHAR(100) NOT NULL,
  `satker` VARCHAR(255) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `type` ENUM('in', 'out') NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `description` TEXT NOT NULL,
  `source` VARCHAR(50) DEFAULT 'manual',
  `period` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`satker`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABEL PENGATURAN (SETTINGS)
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `satker` VARCHAR(255) NOT NULL UNIQUE,
  `institution` VARCHAR(255) DEFAULT '',
  `branch` VARCHAR(255) DEFAULT '',
  `treasurer_name` VARCHAR(255) DEFAULT '',
  `treasurer_nip` VARCHAR(100) DEFAULT '',
  `chairperson_name` VARCHAR(255) DEFAULT '',
  `chairperson_nip` VARCHAR(100) DEFAULT '',
  `bank_name` VARCHAR(100) DEFAULT 'Bank Syariah Indonesia (BSI)',
  `bank_account` VARCHAR(100) DEFAULT '7142893019',
  `bank_holder` VARCHAR(255) DEFAULT 'PTWP Cabang Pengadilan Agama Gunung Sugih',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`satker`, `institution`, `branch`, `treasurer_name`, `treasurer_nip`, `chairperson_name`, `chairperson_nip`) VALUES
('Pengadilan Agama Gunung Sugih', 'PENGADILAN AGAMA GUNUNG SUGIH', 'CABANG PENGADILAN AGAMA GUNUNG SUGIH', 'User Test PA Gunung Sugih', '198909182014022006', 'Ketua Pengadilan Agama Gunung Sugih', '196805121994031001'),
('Pengadilan Agama Metro', 'PENGADILAN AGAMA METRO', 'CABANG PENGADILAN AGAMA METRO', 'Bendahara PA Metro', '198501012010011002', 'Ketua Pengadilan Agama Metro', '197001011996031001');

-- 8. TABEL ARSIP BERKAS EXCEL ASLI PENGELUARAN CABANG (EXPENSE_DOCUMENTS)
-- Menyimpan dokumen Excel murni (.xlsx) asli yang diunggah oleh bendahara cabang
-- created_at dipertahankan permanen sebagai waktu unggah awal, updated_at untuk perubahan
DROP TABLE IF EXISTS `expense_documents`;
CREATE TABLE `expense_documents` (
  `id` VARCHAR(100) PRIMARY KEY,
  `satker` VARCHAR(255) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `file_data` LONGBLOB NOT NULL,
  `file_size` INT NOT NULL,
  `mime_type` VARCHAR(100) DEFAULT 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  `year` VARCHAR(10) DEFAULT '2026',
  `uploaded_by` VARCHAR(150) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_satker` (`satker`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TABEL JEJAK REKAM AUDIT TERPADU (AUDIT_LOGS)
-- Merekam seluruh riwayat kronologis perubahan data iuran, kas, dokumen, dan pengaturan (Append-Only)
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `satker` VARCHAR(255) NOT NULL,
  `user_id` INT DEFAULT NULL,
  `user_name` VARCHAR(255) NOT NULL,
  `user_role` VARCHAR(100) DEFAULT 'Bendahara',
  `action` VARCHAR(50) NOT NULL,
  `module` VARCHAR(100) NOT NULL,
  `entity_id` VARCHAR(100) DEFAULT NULL,
  `period` VARCHAR(50) DEFAULT NULL,
  `old_value` JSON DEFAULT NULL,
  `new_value` JSON DEFAULT NULL,
  `description` TEXT NOT NULL,
  `ip_address` VARCHAR(50) DEFAULT '127.0.0.1',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_satker` (`satker`),
  INDEX `idx_audit_module` (`module`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SELESAI
