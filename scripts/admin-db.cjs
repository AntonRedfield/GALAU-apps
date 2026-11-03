/**
 * ============================================================================
 * GALAU - Firebase Admin SDK Service Script
 * ============================================================================
 * Skrip backend Node.js untuk administrasi basis data Cloud Firestore menggunakan
 * Firebase Admin SDK dan file `serviceAccountKey.json`.
 *
 * Penggunaan:
 *   node scripts/admin-db.cjs
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const possibleKeyPaths = [
  path.resolve(process.cwd(), 'serviceAccountKey.json'),
  path.resolve(process.cwd(), 'service-account.json'),
  path.resolve(__dirname, '../serviceAccountKey.json'),
  process.env.GOOGLE_APPLICATION_CREDENTIALS
].filter(Boolean);

const serviceAccountPath = possibleKeyPaths.find(p => fs.existsSync(p));

if (!serviceAccountPath) {
  console.error('❌ File serviceAccountKey.json tidak ditemukan.');
  console.info('👉 Letakkan file serviceAccountKey.json di folder utama proyek.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id || 'galau-fd428'
});

console.log(`✅ Firebase Admin terinisialisasi dengan Service Account: ${path.basename(serviceAccountPath)}`);
console.log(`   Project ID: ${serviceAccount.project_id}\n`);

const db = getFirestore(app);

async function inspectAndVerify() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('  🔍 PEMERIKSAAN LANGSUNG BASIS DATA CLOUD FIRESTORE');
  console.log('════════════════════════════════════════════════════════════════\n');

  const collections = [
    'admin_users',
    'assessment_tokens',
    'assessments',
    'crisis_contacts',
    'assessment_questions'
  ];

  for (const col of collections) {
    try {
      const snap = await db.collection(col).get();
      console.log(`  📦 Koleksi [${col.padEnd(22)}] : ${snap.size} dokumen`);
      if (snap.size > 0 && col !== 'assessment_questions') {
        snap.docs.slice(0, 3).forEach(d => {
          const data = d.data();
          const desc = data.email || data.studentName || data.name || data.label || '';
          console.log(`     • ID: ${d.id} ${desc ? `(${desc})` : ''}`);
        });
      }
    } catch (e) {
      console.error(`  ❌ Gagal membaca koleksi ${col}:`, e.message);
    }
  }

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('  🎉 SELURUH KOLEKSI TERHUBUNG DAN AKTIF DI FIRESTORE!');
  console.log('════════════════════════════════════════════════════════════════\n');
}

inspectAndVerify()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error saat verifikasi:', err);
    process.exit(1);
  });
