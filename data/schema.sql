-- Drop existing tables if they exist to prevent schema collision
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS slides CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Create Users Table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL
);

-- Create News Table
CREATE TABLE news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    badge TEXT NOT NULL,
    image TEXT NOT NULL,
    summary TEXT NOT NULL,
    link TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Documents Table
CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    badge TEXT NOT NULL,
    image TEXT NOT NULL,
    description TEXT NOT NULL,
    driveUrl TEXT NOT NULL,
    filename TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Slides Table
CREATE TABLE slides (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    lead TEXT NOT NULL,
    image TEXT NOT NULL,
    buttonText TEXT NOT NULL,
    buttonLink TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Settings Table
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- Insert Default Users
INSERT INTO users (id, username, password, name, role) VALUES
('1', 'admin_kpm', 'password123', 'Admin KPM', 'adminkpm'),
('2', 'admin_gpm', 'password123', 'Admin GPM', 'admingpm'),
('3', 'admin_jurusan', 'password123', 'Admin Jurusan KPI', 'adminjurusan')
ON CONFLICT (id) DO NOTHING;

-- Insert Default News
INSERT INTO news (id, title, category, badge, image, summary, link) VALUES
('1', 'Rapat Evaluasi Mutu Semester', 'Kegiatan', 'badge-success', 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&q=60', 'Rapat Evaluasi Mutu Semester membahas capaian, kendala, dan rencana tindak lanjut untuk peningkatan mutu akademik lintas program studi secara periodik.', 'berita-evaluasi-semester.html'),
('2', 'Pengumpulan Bukti Akreditasi', 'Akreditasi', 'badge-warning', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&q=60', 'Tim sedang mengumpulkan dokumen pendukung dan bukti administratif sebagai persiapan untuk proses visitasi akreditasi nasional.', 'berita-pengumpulan-bukti-akreditasi.html'),
('3', 'Workshop Penjaminan Mutu', 'Workshop', 'badge-info', 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=60', 'Pelatihan peningkatan kapasitas staf dan dosen dalam implementasi praktik penjaminan mutu internal secara berkelanjutan.', 'berita-workshop-penjaminan-mutu.html')
ON CONFLICT (id) DO NOTHING;

-- Insert Default Documents
INSERT INTO documents (id, title, category, badge, image, description, driveUrl, filename) VALUES
('1', 'Buku Standar SPMI FDK 2026', 'Kebijakan', 'badge-success', 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&q=60', 'Pedoman Sistem Penjaminan Mutu Internal (SPMI) yang menjadi rujukan implementasi layanan tridharma fakultas.', 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvVY9tT95BS-y6K/preview', 'standar_spmi_fdk_2026.pdf'),
('2', 'Buku Panduan AMI 2026', 'Panduan', 'badge-warning', 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=60', 'Panduan teknis bagi auditor dan auditee dalam menyelenggarakan Audit Mutu Internal tahunan prodi.', 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvVY9tT95BS-y6K/preview', 'panduan_ami_2026.pdf'),
('3', 'Kuesioner Kepuasan Layanan', 'Instrumen', 'badge-info', 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=60', 'Instrumen survei resmi untuk mengukur indeks kepuasan mahasiswa, dosen, dan tenaga kependidikan.', 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvVY9tT95BS-y6K/preview', 'kuesioner_kepuasan_layanan.pdf'),
('4', 'SOP Evaluasi Pembelajaran', 'SOP', 'badge-success', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=60', 'Standar Operasional Prosedur pelaksanaan monitoring perkuliahan tengah dan akhir semester.', 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvVY9tT95BS-y6K/preview', 'sop_evaluasi_pembelajaran.pdf'),
('5', 'Kebijakan Mutu Akademik FDK', 'Kebijakan', 'badge-success', 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800&q=60', 'Dokumen pernyataan dewan pimpinan fakultas mengenai visi, arah, dan komitmen penjaminan mutu.', 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvVY9tT95BS-y6K/preview', 'kebijakan_mutu_fdk.pdf'),
('6', 'Laporan Monev Pengabdian', 'Laporan', 'badge-warning', 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=60', 'Laporan hasil pemantauan dan evaluasi mutu pelaksanaan pengabdian masyarakat dosen.', 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvVY9tT95BS-y6K/preview', 'monev_pengabdian_masyarakat.pdf')
ON CONFLICT (id) DO NOTHING;

-- Insert Default Slides
INSERT INTO slides (id, title, lead, image, buttonText, buttonLink) VALUES
('1', 'Komite Penjaminan Mutu (KPM)<br/>Fakultas Dakwah & Komunikasi', 'Mengawal standar akademik, memandu evaluasi berkelanjutan, dan mempersiapkan program studi menuju akreditasi unggul secara konsisten.', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80', 'Lihat Berita Utama', '#news'),
('2', 'Persiapan Akreditasi Internasional', 'Mengembangkan kurikulum berbasis kompetensi global dan melakukan asesmen berkala kesiapan program studi FDK.', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80', 'Cek Dokumen Akreditasi', './akreditasi/index.html'),
('3', 'Evaluasi Mutu Semesteran Efisien', 'Meningkatkan kepuasan layanan mahasiswa dan ketepatan evaluasi akademik dosen.', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&q=80', 'Baca Laporan Mutu', './laporan/index.html')
ON CONFLICT (id) DO NOTHING;

-- Insert Default Site Settings
INSERT INTO settings (key, value) VALUES
('config', '{
  "siteTitle": "KPM FDK UINAM",
  "siteSub": "Fakultas Dakwah & Komunikasi",
  "logo": "./assets/logoKpm.svg",
  "navLinks": [
    { "label": "Beranda", "url": "/index.html" },
    { "label": "Anggota", "url": "/anggota/index.html" },
    { "label": "Akreditasi", "url": "/akreditasi/index.html" },
    { "label": "Laporan", "url": "/laporan/index.html" },
    { "label": "Dokumen", "url": "/dokumen/index.html" }
  ],
  "footer": {
    "address": "Kampus II: Jalan H. M. Yasin Limpo No. 36 Romang Polong, Somba Opu, Gowa, Sulawesi Selatan",
    "phone": "085343803672",
    "email": "kpi.fdk@uin-alauddin.ac.id",
    "copyright": "Dibuat oleh Ariel Usman &copy; 2026"
  }
}')
ON CONFLICT (key) DO NOTHING;
