# 🧠 GALAU (Guidance, Assessment of Life-distress, Anxiety & Utility)

> **Sistem Bimbingan, Konseling & Asesmen Kesejahteraan Psikologis Remaja Terpadu**  
> Mengintegrasikan instrumen baku **DASS-42** (*Depression Anxiety Stress Scales*) dan instrumen skrining kebutuhan **DCM** (*Daftar Cek Masalah*).

[![Deploy to GitHub Pages](https://github.com/AntonRedfield/GALAU-apps/actions/workflows/deploy.yml/badge.svg)](https://github.com/AntonRedfield/GALAU-apps/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen)](https://antonredfield.github.io/GALAU-apps/)

---

## 🌐 Live Application
Aplikasi ini di-hosting secara otomatis melalui GitHub Pages:  
👉 **[https://antonredfield.github.io/GALAU-apps/](https://antonredfield.github.io/GALAU-apps/)**

---

## ✨ Fitur Utama

1. **Akses Berbasis Token Khusus**
   - Siswa mengakses instrumen menggunakan token khusus (misal: format `GLU-...` atau mode latihan).
   - Konselor / Admin masuk dengan token kredensial untuk membuka **Dashboard Konselor**.

2. **Instrumen Asesmen Terstandar**
   - **DASS-42**: Evaluasi 42 butir skala Depresi, Kecemasan (Anxiety), dan Stres.
   - **Skrining Masalah (DCM)**: Evaluasi kebutuhan siswa di bidang Pribadi, Sosial, Belajar, dan Karier.
   - Timer pengerjaan adaptif, indikator kemajuan (progress bar), dan validasi jawaban otomatis.

3. **Laporan & Diagnosis Komprehensif**
   - Perhitungan skor otomatis dengan kategorisasi norma baku (Normal, Ringan, Sedang, Parah, Sangat Parah).
   - Rekomendasi intervensi bimbingan dan konseling berbasis bukti.
   - Fitur cetak laporan / Ekspor PDF siap arsip.

4. **Dashboard Konselor Interaktif**
   - Manajemen token asesmen siswa.
   - Rekapitulasi hasil skrining dan pemetaan risiko siswa.
   - Opsi sinkronisasi database awan Firebase Firestore atau LocalStorage offline.

5. **Kepatuhan Privasi & Etika Profesi**
   - Selaras dengan standar perlindungan data pribadi (UU PDP No. 27/2022) dan Kode Etik Bimbingan & Konseling.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS modern (Glassmorphism, Dark/Light palettes, responsive layouts)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database / Sync**: [Firebase Firestore](https://firebase.google.com/) & Web LocalStorage
- **CI/CD**: GitHub Actions & GitHub Pages

---

## 🚀 Menjalankan Secara Lokal

### Prasyarat
- Node.js (v18 atau lebih baru)
- npm / pnpm / yarn

### Langkah Instalasi
```bash
# 1. Clone repositori
git clone https://github.com/AntonRedfield/GALAU-apps.git
cd GALAU-apps

# 2. Pasang dependensi
npm install

# 3. Jalankan server pengembangan
npm run dev
```
Buka browser di `http://localhost:3000` (atau port yang ditampilkan di terminal).

### Membangun Paket Produksi
```bash
npm run build
```
File build siap saji akan disimpan pada folder `/dist`.

---

## 🔒 Konfigurasi Firebase (Opsional)
Aplikasi mendukung penyimpanan offline melalui browser Storage secara default. Untuk menghubungkan dengan database Firebase Firestore online, masukkan konfigurasi proyek Anda melalui menu **Koneksi Database** di aplikasi atau lihat panduan di [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md).

---

## 📄 Lisensi
Hak Cipta &copy; 2026 AntonRedfield. Dikembangkan untuk layanan Bimbingan, Konseling, dan Kesejahteraan Psikologis Siswa.
