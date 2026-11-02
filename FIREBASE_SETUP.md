# Panduan Konfigurasi Backend & Database Firebase (GALAU)

Aplikasi **GALAU (Guidance, Assessment of Life-distress, Anxiety & Utility)** dirancang untuk berjalan di atas ekosistem **Google Cloud / Firebase** (Cloud Firestore, Authentication, & Firebase Hosting) dengan dukungan fallback offline instan (*Local-First*).

---

## 🔑 Akses Administrator & Konselor

Untuk mengakses Dasbor Pemantauan Konselor & Administrator:

1. Pada halaman awal login, masukkan kode token akses:
   ```text
   konsultan
   ```
2. Form login administrator akan otomatis terbuka.
3. Masukkan ID / Email dan kata sandi yang telah didaftarkan pada proyek Anda.

> **Catatan Keamanan:** 
> Kredensial akun administrator utama dapat ditentukan melalui variabel lingkungan `VITE_ADMIN_EMAIL` dan `VITE_ADMIN_PASSWORD` pada file `.env`.

---

## ☁️ Menghubungkan ke Proyek Firebase

### Langkah 1: Buat Proyek di Firebase Console
1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat proyek baru.
2. Buat database **Cloud Firestore** pada mode produksi (*Production Mode*), pilih lokasi server terdekat (misal: `asia-southeast2` Jakarta).
3. Daftarkan **Web App** di dalam proyek Anda untuk mendapatkan konfigurasi SDK.

### Langkah 2: Konfigurasi File `.env`
Salin file `.env.template` menjadi `.env` di direktori utama, lalu lengkapi nilai konfigurasi:

```env
VITE_FIREBASE_API_KEY=AIzaSyAxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Kredensial Administrator (Lokal / Self-hosted)
VITE_ADMIN_EMAIL=admin@sekolah.id
VITE_ADMIN_PASSWORD=KataSandiAman123!
```

---

## 🗄️ Struktur Koleksi Database Firestore

Aplikasi mengelola koleksi data berikut secara otomatis:

1. **`admin_users`** — Pendaftaran akun administrator & hak akses konselor.
2. **`assessment_tokens`** — Token 6-digit akses asesmen siswa (status: `unused` / `completed`).
3. **`assessments`** — Dokumen hasil skrining lengkap DASS-42, DCM, dan triase risiko.
4. **`crisis_contacts`** — Direktori kontak darurat krisis yang dapat dikonfigurasi sekolah.
5. **`assessment_questions`** — Bank 126 butir soal asesmen DASS-42 & DCM beserta tautan media pendukung.

---

## 📦 Menanam Data Awal (Seeding)

Setelah file `.env` terkonfigurasi, jalankan skrip seeder untuk menanam token awal, butir soal, dan kontak krisis ke database Firestore:

```bash
node scripts/firebase-seed.mjs
```

---

## 🔒 Penerapan Aturan Keamanan (Security Rules)

Unggah berkas `firestore.rules` melalui Firebase CLI:

```bash
firebase deploy --only firestore:rules
```
Atau salin isi berkas `firestore.rules` ke menu **Firestore Database > Rules** pada Firebase Console.
