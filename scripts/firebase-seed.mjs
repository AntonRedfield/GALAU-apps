/**
 * ============================================================================
 * GALAU Firebase Setup & Seed Script
 * ============================================================================
 * Menanam data awal (seed) ke Cloud Firestore:
 *  - admin_users (akun administrator)
 *  - assessment_tokens (token awal universal)
 *  - assessments (contoh laporan analitis psikologis)
 *  - crisis_contacts (kontak darurat krisis)
 *  - assessment_questions (126 butir soal asesmen DASS-42 & DCM)
 *
 * Konfigurasi dibaca otomatis dari file `.env` atau environment variables.
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { RAW_QUESTIONS } from '../src/data/assessmentQuestions.js';

// Muat .env jika ada
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const FIREBASE_CONFIG = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || ''
};

const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@sekolah.id';
const ADMIN_PASSWORD = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'AdminBK2026!';
const ADMIN_DISPLAY_NAME = process.env.VITE_ADMIN_DISPLAY_NAME || 'Koordinator BK & Administrator';

const INITIAL_TOKENS = [
  {
    token: 'a7b3x9', role: 'student', label: 'Token Pengguna Umum (Karyawan Swasta)',
    studentName: 'Ahmad Fauzan', birthDate: '2001-08-14', age: 25,
    occupation: 'Karyawan Swasta', className: 'Karyawan Swasta', status: 'unused',
    createdAt: '2026-10-10T08:00:00Z', expiresAt: '2026-12-31T23:59:59Z'
  },
  {
    token: 'k4m8z1', role: 'student', label: 'Token Mahasiswa & Organisasi',
    studentName: 'Nabila Putri Cahyani', birthDate: '2003-03-22', age: 23,
    occupation: 'Mahasiswa / Organisasi Kampus', className: 'Mahasiswa', status: 'unused',
    createdAt: '2026-10-10T08:00:00Z', expiresAt: '2026-12-31T23:59:59Z'
  },
  {
    token: 'r2t9w5', role: 'student', label: 'Token Uji Coba Cepat (Wiraswasta)',
    studentName: 'Rian Pratama', birthDate: '1998-11-05', age: 28,
    occupation: 'Wirausaha / Freelancer', className: 'Wirausaha', status: 'unused',
    createdAt: '2026-10-12T00:00:00Z', expiresAt: '2026-12-31T23:59:59Z'
  },
  {
    token: 'c3v7b2', role: 'student', label: 'Token Tenaga Profesional',
    studentName: 'Dimas Setiawan', birthDate: '1995-06-19', age: 31,
    occupation: 'Tenaga Profesional / ASN', className: 'Tenaga Profesional', status: 'unused',
    createdAt: '2026-10-12T00:00:00Z', expiresAt: '2026-12-31T23:59:59Z'
  }
];

const SAMPLE_REPORTS = [
  {
    id: 'REP-2026-001',
    token: 'p4m9k2',
    studentInfo: {
      fullName: 'Muhammad Rizky Ramadhan', birthDate: '2000-04-18', age: 26,
      occupation: 'Karyawan PT Mega Corpora', gender: 'Laki-laki',
      phone: '081234567891',
      initialNotes: 'Sering merasa cemas dan tegang berlebih menghadapi beban kerja dan target perusahaan.'
    },
    scores: {
      dass: {
        depresi: { score: 12, raw: 36, max: 42, severity: { key: 'ringan', label: 'Ringan', color: '#3B82F6', badgeClass: 'badge-mild' } },
        kecemasan: { score: 18, raw: 54, max: 42, severity: { key: 'parah', label: 'Parah', color: '#EF4444', badgeClass: 'badge-severe' } },
        stres: { score: 28, raw: 84, max: 42, severity: { key: 'parah', label: 'Parah', color: '#EF4444', badgeClass: 'badge-severe' } }
      },
      triage: {
        level: 'TINGGI', label: 'Tinggi (Butuh Konseling Intensif)', color: '#EA580C',
        reasons: ['Terdapat subskala Kecemasan dan Stres pada tingkat Parah.'],
        emergencyFlags: []
      },
      domainAnalysis: [
        { domainId: 'karier', percentage: 76, problemCount: 14, totalScore: 48 },
        { domainId: 'akademik', percentage: 65, problemCount: 11, totalScore: 41 },
        { domainId: 'sosial', percentage: 38, problemCount: 5, totalScore: 24 }
      ],
      recommendations: [
        { action: 'Konseling Individu', priority: 'Prioritas Tinggi (3 Hari)', description: 'Sesi privat tatap muka bersama konselor.' }
      ],
      completedAt: '2026-10-11T14:20:00Z'
    },
    interventions: [
      { id: 'INT-01', date: '2026-10-12', type: 'Konseling Individu', notes: 'Klien hadir sesi pertama.', counselorName: 'Konselor Pembimbing', status: 'Sedang Berjalan' }
    ]
  },
  {
    id: 'REP-2026-002',
    token: 'x8n1q7',
    studentInfo: {
      fullName: 'Aurelia Citra Lestari', birthDate: '2004-09-12', age: 22,
      occupation: 'Mahasiswa / Pekerja Lepas', gender: 'Perempuan',
      phone: '081398712345',
      initialNotes: 'Merasa terisolasi dan sangat tertekan dengan dinamika keluarga di rumah.'
    },
    scores: {
      dass: {
        depresi: { score: 29, raw: 87, max: 42, severity: { key: 'sangatParah', label: 'Sangat Parah', color: '#7F1D1D', badgeClass: 'badge-critical' } },
        kecemasan: { score: 22, raw: 66, max: 42, severity: { key: 'sangatParah', label: 'Sangat Parah', color: '#7F1D1D', badgeClass: 'badge-critical' } },
        stres: { score: 35, raw: 105, max: 42, severity: { key: 'sangatParah', label: 'Sangat Parah', color: '#7F1D1D', badgeClass: 'badge-critical' } }
      },
      triage: {
        level: 'KRITIS', label: 'Kritis (Perhatian Darurat Segera)', color: '#DC2626',
        reasons: ['Subskala DASS Depresi, Kecemasan, dan Stres seluruhnya berada pada tingkat Sangat Parah.'],
        emergencyFlags: [{ id: 123, text: 'Dorongan menyakiti diri sendiri.', score: 3, domainId: 'spiritual', reason: 'Indikasi Krisis' }]
      },
      domainAnalysis: [
        { domainId: 'keluarga', percentage: 92, problemCount: 19, totalScore: 58 },
        { domainId: 'sosial', percentage: 88, problemCount: 17, totalScore: 55 }
      ],
      recommendations: [
        { action: 'Alih Tangan Kasus (Referral)', priority: 'Segera (1x24 Jam)', description: 'Rujukan ke RSUD / Psikolog Klinis.' }
      ],
      completedAt: '2026-10-11T16:45:00Z'
    },
    interventions: []
  }
];

const CRISIS_CONTACTS = [
  { name: 'Kemenkes Sejiwa Hotline', number: '119 (Tekan 8)', desc: 'Layanan Darurat Konseling Kesehatan Mental (24 Jam Bebas Pulsa)' },
  { name: 'Halo Kemenkes', number: '1500-567', desc: 'Pusat Kontak Informasi Kesehatan Nasional' },
  { name: 'LISA Suicide Prevention Helpline', number: '+62 811-3855-472', desc: 'Dukungan Krisis Pencegahan Bunuh Diri (24 Jam WhatsApp/Call)' },
  { name: 'Ruang BK Sahabat Remaja Sekolah', number: '+62 821-4321-9988', desc: 'Kontak Langsung Ruang Konseling & Guru BK Piket' }
];

async function main() {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('  🌱 GALAU - Firestore Backend Seeder');
  console.log('════════════════════════════════════════════════════════════════\n');

  if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
    console.error('❌ Konfigurasi Firebase belum lengkap.');
    console.error('   Pastikan file .env telah diisi dengan VITE_FIREBASE_API_KEY & VITE_FIREBASE_PROJECT_ID.\n');
    process.exit(1);
  }

  console.log('📡 Menginisialisasi koneksi Firestore...');
  const app = initializeApp(FIREBASE_CONFIG);
  const db = getFirestore(app);
  console.log(`   Project ID : ${FIREBASE_CONFIG.projectId}\n`);

  // 1. SEED ADMIN REGISTRY
  console.log('🛡️  Menanam Akun Admin...');
  try {
    await setDoc(doc(db, 'admin_users', ADMIN_EMAIL), {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: ADMIN_DISPLAY_NAME,
      role: 'admin',
      className: 'Pusat Layanan Konseling & BK',
      createdAt: new Date().toISOString(),
      permissions: ['all']
    });
    console.log(`   ✅ Admin terdaftar: ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error(`   ❌ Gagal registrasi admin: ${err.message}`);
  }
  console.log('');

  // 2. SEED TOKENS
  console.log('🔑 Menanam Token Asesmen...');
  for (const token of INITIAL_TOKENS) {
    try {
      await setDoc(doc(db, 'assessment_tokens', `token_${token.token}`), token);
      console.log(`   ✅ Token: ${token.token} (${token.studentName || token.label})`);
    } catch (err) {
      console.error(`   ❌ Gagal token ${token.token}: ${err.message}`);
    }
  }
  console.log('');

  // 3. SEED SAMPLE ASSESSMENT REPORTS
  console.log('📊 Menanam Laporan Asesmen Awal...');
  for (const report of SAMPLE_REPORTS) {
    try {
      await setDoc(doc(db, 'assessments', report.id), report);
      console.log(`   ✅ Laporan: ${report.id} (${report.studentInfo.fullName})`);
    } catch (err) {
      console.error(`   ❌ Gagal laporan ${report.id}: ${err.message}`);
    }
  }
  console.log('');

  // 4. SEED CRISIS CONTACTS
  console.log('🆘 Menanam Kontak Darurat Krisis...');
  for (let i = 0; i < CRISIS_CONTACTS.length; i++) {
    try {
      await setDoc(doc(db, 'crisis_contacts', `contact_${i + 1}`), CRISIS_CONTACTS[i]);
      console.log(`   ✅ ${CRISIS_CONTACTS[i].name}`);
    } catch (err) {
      console.error(`   ❌ Gagal kontak ${CRISIS_CONTACTS[i].name}: ${err.message}`);
    }
  }
  console.log('');

  // 5. SEED ALL 126 QUESTIONS
  console.log(`📚 Menanam ${RAW_QUESTIONS.length} Butir Soal Asesmen (DASS-42 & DCM)...`);
  let countQ = 0;
  for (const q of RAW_QUESTIONS) {
    try {
      await setDoc(doc(db, 'assessment_questions', String(q.id)), q);
      countQ++;
    } catch (err) {
      console.error(`   ❌ Gagal simpan soal #${q.id}: ${err.message}`);
    }
  }
  console.log(`   ✅ Berhasil menanam ${countQ} dari ${RAW_QUESTIONS.length} butir soal ke Firestore!\n`);

  // 6. VERIFIKASI
  console.log('🔍 Verifikasi Koleksi Firestore...');
  try {
    const adminSnap = await getDocs(collection(db, 'admin_users'));
    const tokensSnap = await getDocs(collection(db, 'assessment_tokens'));
    const reportsSnap = await getDocs(collection(db, 'assessments'));
    const crisisSnap = await getDocs(collection(db, 'crisis_contacts'));
    const questSnap = await getDocs(collection(db, 'assessment_questions'));

    console.log(`   📦 admin_users          : ${adminSnap.size} dokumen`);
    console.log(`   📦 assessment_tokens     : ${tokensSnap.size} dokumen`);
    console.log(`   📦 assessments           : ${reportsSnap.size} dokumen`);
    console.log(`   📦 crisis_contacts       : ${crisisSnap.size} dokumen`);
    console.log(`   📦 assessment_questions  : ${questSnap.size} dokumen`);
  } catch (err) {
    console.error(`   ❌ Gagal verifikasi: ${err.message}`);
  }

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('  🎉 DATABASE FIREBASE SIAP DIGUNAKAN!');
  console.log('════════════════════════════════════════════════════════════════\n');

  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ FATAL ERROR:', err);
  process.exit(1);
});
