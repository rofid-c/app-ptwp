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
('Aku admin', 'Adminbaik123.com', 'Super Administrator PTWP', '081299998888', 'superadmin@mahkamahagung.go.id', 'Mahkamah Agung RI', 'Super Administrator Pusat', 'super_admin', 'Super Administrator Pusat', 'super_admin'),
('user test', 'admin123', 'User Test PA Gunung Sugih', '081234567890', 'test@pags.go.id', 'Pengadilan Agama Gunung Sugih', 'Bendahara Cabang', 'bendahara', 'Bendahara Pengeluaran', 'cabang'),
('bendahara_metro', 'admin123', 'Bendahara PA Metro', '081211112222', 'bendahara@pametro.go.id', 'Pengadilan Agama Metro', 'Bendahara Pengeluaran', 'bendahara', 'Bendahara Pengeluaran', 'cabang'),
('bendahara_pta', 'admin123', 'Bendahara PTA Bandar Lampung', '081233334444', 'bendahara@ptabdl.go.id', 'Pengadilan Tinggi Agama Bandar Lampung', 'Bendahara Pengurus Daerah', 'bendahara', 'Bendahara Daerah', 'daerah');

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
DROP TABLE IF EXISTS `members`;
CREATE TABLE `members` (
  `id` VARCHAR(100) PRIMARY KEY,
  `satker` VARCHAR(255) NOT NULL,
  `nip` VARCHAR(50) DEFAULT '',
  `name` VARCHAR(255) NOT NULL,
  `title` VARCHAR(100) DEFAULT '',
  `category` VARCHAR(100) DEFAULT 'Hakim',
  `pusat` DECIMAL(15,2) DEFAULT 0,
  `daerah` DECIMAL(15,2) DEFAULT 0,
  `cabang` DECIMAL(15,2) DEFAULT 0,
  `tournamen` DECIMAL(15,2) DEFAULT 0,
  `phone` VARCHAR(50) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABEL STATUS PEMBAYARAN IURAN PER PERIODE (DUES_RECORDS)
-- Status pembayaran terisi otomatis berdasarkan rekap iuran tiap periode
DROP TABLE IF EXISTS `dues_records`;
CREATE TABLE `dues_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `period` VARCHAR(50) NOT NULL,
  `satker` VARCHAR(255) NOT NULL,
  `member_id` VARCHAR(100) NOT NULL,
  `paid` TINYINT(1) DEFAULT 0,
  `paid_date` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_period_member` (`period`, `satker`, `member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABEL BUKU KAS (CASHBOOK)
-- Catatan mutasi kas masuk/keluar yang dicatat oleh bendahara
DROP TABLE IF EXISTS `cashbook`;
CREATE TABLE `cashbook` (
  `id` VARCHAR(100) PRIMARY KEY,
  `satker` VARCHAR(255) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `type` ENUM('in', 'out') NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `description` TEXT NOT NULL,
  `source` VARCHAR(50) DEFAULT 'manual',
  `period` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- SELESAI
