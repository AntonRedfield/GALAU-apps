/**
 * Layanan Penyimpanan & Basis Data Adaptif GALAU
 * Token Siswa: 6 Karakter (Kombinasi Huruf Kecil & Angka: e.g. a7b3x9, k4m8z1)
 * Login Admin: Kata Sandi / PIN Sederhana (Default: admin123)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db, isFirebaseActive, firebaseAdminLogin, firebaseAdminLogout } from './firebase';
import { INITIAL_TOKENS, SAMPLE_COMPLETED_REPORTS } from '../data/seedTokens';
import { DEFAULT_CRISIS_CONTACTS } from '../data/scoringRules';
import { RAW_QUESTIONS } from '../data/assessmentQuestions';

const LOCAL_STORAGE_TOKENS = 'galau_tokens_db_v2';
const LOCAL_STORAGE_REPORTS = 'galau_reports_db_v2';
const LOCAL_STORAGE_CRISIS = 'galau_crisis_contacts_db';
const LOCAL_STORAGE_QUESTIONS = 'galau_questions_db_v2';
const LOCAL_STORAGE_ACTIVE_SESSION = 'galau_active_session_backup_v1';
const LOCAL_STORAGE_PENDING_SYNC = 'galau_pending_sync_reports_v1';

/**
 * Generator Token 6 Karakter (Huruf & Angka, Seluruhnya Huruf Kecil)
 * Contoh output: a7b3x9, k4m8z1, r2t9w5
 */
export function generate6DigitToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Inisialisasi data lokal jika kosong
function ensureLocalSeedData() {
  if (!localStorage.getItem(LOCAL_STORAGE_TOKENS)) {
    localStorage.setItem(LOCAL_STORAGE_TOKENS, JSON.stringify(INITIAL_TOKENS));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_REPORTS)) {
    localStorage.setItem(LOCAL_STORAGE_REPORTS, JSON.stringify(SAMPLE_COMPLETED_REPORTS));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_CRISIS)) {
    localStorage.setItem(LOCAL_STORAGE_CRISIS, JSON.stringify(DEFAULT_CRISIS_CONTACTS));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_QUESTIONS)) {
    localStorage.setItem(LOCAL_STORAGE_QUESTIONS, JSON.stringify(RAW_QUESTIONS));
  }
}

ensureLocalSeedData();

/**
 * Validasi Token Penilaian Siswa (6 Karakter Huruf Kecil & Angka)
 */
export async function validateToken(tokenInput) {
  const cleanToken = (tokenInput || '').trim().toLowerCase();

  if (!cleanToken) {
    return { success: false, message: 'Silakan masukkan token 6 karakter.' };
  }

  // Mode Firebase Aktif
  if (isFirebaseActive && db) {
    try {
      const q = query(collection(db, 'assessment_tokens'), where('token', '==', cleanToken));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      }
    } catch (e) {
      console.warn('Firebase query gagal, beralih ke local storage:', e);
    }
  }

  // Fallback Local Storage
  const tokens = JSON.parse(localStorage.getItem(LOCAL_STORAGE_TOKENS) || '[]');
  const found = tokens.find(t => (t.token || '').toLowerCase() === cleanToken);

  if (found) {
    return { success: true, data: found };
  }

  return {
    success: false,
    message: `Token "${cleanToken}" tidak ditemukan atau belum didaftarkan oleh Admin/Guru BK.`
  };
}

/**
 * Validasi Login Admin / Guru BK dengan Email & Kata Sandi
 * Mendukung Konfigurasi Lingkungan (.env), Firestore Database, dan Firebase Authentication
 */
export async function validateAdminCredentials(adminId, password) {
  const cleanId = (adminId || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  // === 1. KREDENSIAL UTAMA DARI ENVIRONMENT (.env) ===
  const envAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
  const envAdminPassword = (import.meta.env.VITE_ADMIN_PASSWORD || '').trim();

  if (envAdminEmail && cleanId === envAdminEmail && cleanPass === envAdminPassword) {
    if (isFirebaseActive && db) {
      try {
        await setDoc(doc(db, 'admin_users', envAdminEmail), {
          email: envAdminEmail,
          role: 'admin',
          displayName: 'Administrator Utama',
          lastLogin: new Date().toISOString(),
          status: 'active'
        }, { merge: true });
      } catch (err) {
        console.warn('Gagal sync admin ke Firestore:', err);
      }
    }

    return {
      success: true,
      data: {
        token: 'KONSULTAN',
        role: 'admin',
        studentName: 'Koordinator BK & Administrator',
        className: 'Pusat Layanan Konseling & BK',
        email: envAdminEmail,
        status: 'active',
        authMethod: 'env_admin'
      }
    };
  }

  // === 2. VERIFIKASI FIRESTORE DATABASE `admin_users` ===
  if (isFirebaseActive && db) {
    try {
      const adminDocRef = doc(db, 'admin_users', cleanId);
      const adminDocSnap = await getDoc(adminDocRef);
      if (adminDocSnap.exists()) {
        const adminData = adminDocSnap.data();
        if (adminData.password && adminData.password === cleanPass) {
          return {
            success: true,
            data: {
              token: 'KONSULTAN',
              role: adminData.role || 'admin',
              studentName: adminData.displayName || 'Administrator BK',
              className: adminData.className || 'Ruang Layanan BK',
              email: cleanId,
              status: 'active',
              authMethod: 'firestore'
            }
          };
        }
      }
    } catch (e) {
      console.warn('Cek admin di Firestore gagal:', e);
    }
  }

  // === 3. FIREBASE AUTHENTICATION (jika diaktifkan) ===
  if (isFirebaseActive && cleanId.includes('@')) {
    const firebaseResult = await firebaseAdminLogin(cleanId, cleanPass);
    if (firebaseResult.success) {
      return {
        success: true,
        data: {
          token: 'KONSULTAN',
          role: 'admin',
          studentName: firebaseResult.user.displayName || 'Administrator GALAU',
          className: 'Ruang Layanan BK',
          status: 'active',
          uid: firebaseResult.user.uid,
          email: firebaseResult.user.email,
          authMethod: 'firebase_auth'
        }
      };
    }
  }

  // === 4. FALLBACK KREDENSIAL LOKAL (admin / admin123) ===
  const validIds = ['admin', 'gurubk', 'guru-bk', 'master', 'konselor'];
  const validPasswords = ['admin123', 'admin', 'master123', 'gurubk123'];

  if (validIds.includes(cleanId) && validPasswords.includes(cleanPass)) {
    return {
      success: true,
      data: {
        token: 'KONSULTAN',
        role: 'admin',
        studentName: cleanId === 'gurubk' || cleanId === 'konselor' ? 'Guru BK Pembimbing' : 'Koordinator BK & Administrator',
        className: 'Ruang Layanan BK',
        status: 'active',
        authMethod: 'local'
      }
    };
  }

  return {
    success: false,
    message: 'ID Administrator atau kata sandi tidak sesuai. Silakan periksa kembali kredensial Anda.'
  };
}

export async function validateAdminLogin(passwordOrCredentials) {
  return validateAdminCredentials('admin', passwordOrCredentials);
}

/**
 * Logout Admin dari Firebase Auth
 */
export async function logoutAdmin() {
  await firebaseAdminLogout();
}


/**
 * Dapatkan semua token yang terdaftar
 */
export async function getAllTokens() {
  if (isFirebaseActive && db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'assessment_tokens'));
      const list = [];
      querySnapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
      if (list.length > 0) return list;
    } catch (e) {
      console.warn('Firebase getAllTokens gagal, membaca lokal:', e);
    }
  }

  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_TOKENS) || '[]');
}

/**
 * Buat Token Baru 6 Karakter (Batch atau Satuan oleh Admin)
 * Seluruh token berupa huruf & angka huruf kecil (e.g. a7b3x9)
 */
export async function createNewTokens(count = 1, className = 'Umum', role = 'student') {
  const existingTokens = JSON.parse(localStorage.getItem(LOCAL_STORAGE_TOKENS) || '[]');
  const existingCodes = new Set(existingTokens.map(t => (t.token || '').toLowerCase()));

  const newTokens = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    // Generate 6 digit token unik
    let tokenCode = generate6DigitToken();
    while (existingCodes.has(tokenCode)) {
      tokenCode = generate6DigitToken();
    }
    existingCodes.add(tokenCode);

    const tokenObj = {
      token: tokenCode, // 6 karakter lowercase
      role,
      className, // Instansi / Organisasi / Kategori
      occupation: className,
      label: `Token ${className} (#${i + 1})`,
      studentName: '',
      birthDate: '',
      age: null,
      status: 'unused',
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };
    newTokens.push(tokenObj);

    if (isFirebaseActive && db) {
      try {
        await addDoc(collection(db, 'assessment_tokens'), tokenObj);
      } catch (err) {
        console.warn('Gagal simpan token ke Firebase:', err);
      }
    }
  }

  // Simpan ke local storage
  const updated = [...newTokens, ...existingTokens];
  localStorage.setItem(LOCAL_STORAGE_TOKENS, JSON.stringify(updated));

  return newTokens;
}

/**
 * ============================================================================
 * CADANGAN OTOMATIS & TANGGAP DARURAT SESI (DISASTER RECOVERY BACKUP)
 * ============================================================================
 * Menyimpan snapshot sesi aktif (token, data siswa, jawaban, nomor soal, laporan)
 * secara instan dalam format JSON ringan di penyimpanan lokal perangkat.
 * Jika terjadi musibah (sinyal terputus, mati lampu, tab tertutup, refresh tidak sengaja),
 * sesi dapat langsung dipulihkan secara mulus tanpa kehilangan data jawaban.
 */

export function saveActiveSessionBackup(sessionData) {
  try {
    if (!sessionData) return;
    const existing = getActiveSessionBackup() || {};
    const payload = {
      ...existing,
      ...sessionData,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_SESSION, JSON.stringify(payload));
    return payload;
  } catch (err) {
    console.warn('Gagal menyimpan cadangan sesi aktif:', err);
    return null;
  }
}

export function getActiveSessionBackup() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function clearActiveSessionBackup() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_SESSION);
  } catch (err) {
    console.warn('Gagal membersihkan cadangan sesi:', err);
  }
}

/**
 * Antrean Sinkronisasi Laporan Otomatis (Pending Sync Queue)
 * Menampung laporan yang selesai saat sinyal drop untuk dikirimkan otomatis ke server saat online.
 */
export function enqueuePendingSyncReport(report) {
  try {
    const queue = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PENDING_SYNC) || '[]');
    const existingIdx = queue.findIndex(item => item.id === report.id || item.token === report.token);
    if (existingIdx >= 0) {
      queue[existingIdx] = report;
    } else {
      queue.push(report);
    }
    localStorage.setItem(LOCAL_STORAGE_PENDING_SYNC, JSON.stringify(queue));
  } catch (e) {
    console.warn('Gagal menyimpan ke antrean sinkronisasi:', e);
  }
}

export async function syncPendingReportsToFirestore() {
  if (!isFirebaseActive || !db) return { synced: 0, pending: 0 };
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { synced: 0, pending: 0 };

  try {
    const queue = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PENDING_SYNC) || '[]');
    if (!Array.isArray(queue) || queue.length === 0) return { synced: 0, pending: 0 };

    const remaining = [];
    let syncedCount = 0;

    for (const report of queue) {
      try {
        await setDoc(doc(db, 'assessments', report.id), report);
        await updateTokenStatus(report.token, 'completed', report.studentInfo);
        syncedCount++;
      } catch (err) {
        console.warn(`Sinkronisasi tertunda untuk ${report.id} gagal, dicoba lagi nanti:`, err);
        remaining.push(report);
      }
    }

    localStorage.setItem(LOCAL_STORAGE_PENDING_SYNC, JSON.stringify(remaining));
    if (syncedCount > 0) {
      console.info(`[GALAU Cloud Sync] Berhasil menyinkronkan ${syncedCount} laporan yang tersimpan secara lokal.`);
    }
    return { synced: syncedCount, pending: remaining.length };
  } catch (err) {
    console.warn('Gagal memproses antrean sinkronisasi:', err);
    return { synced: 0, pending: 0 };
  }
}

// Inisialisasi pendengar sinyal online untuk sinkronisasi otomatis
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncPendingReportsToFirestore();
  });
  // Coba sinkronisasi saat inisialisasi jika online
  setTimeout(() => {
    syncPendingReportsToFirestore();
  }, 3000);
}

/**
 * Simpan Hasil Asesmen Lengkap
 */
export async function saveAssessmentReport(reportData) {
  const reportId = reportData.id || `REP-${Date.now()}`;
  const completeReport = {
    ...reportData,
    id: reportId,
    savedAt: new Date().toISOString()
  };

  // 1. Simpan segera ke basis data lokal (cadangan aman terproteksi dari gangguan sinyal)
  const reports = JSON.parse(localStorage.getItem(LOCAL_STORAGE_REPORTS) || '[]');
  const existingIndex = reports.findIndex(r => r.id === reportId || r.token === reportData.token);
  if (existingIndex >= 0) {
    reports[existingIndex] = completeReport;
  } else {
    reports.unshift(completeReport);
  }
  localStorage.setItem(LOCAL_STORAGE_REPORTS, JSON.stringify(reports));

  // 2. Perbarui status token lokal
  await updateTokenStatus(reportData.token, 'completed', reportData.studentInfo);

  // 3. Cadangkan ke snapshot sesi aktif
  saveActiveSessionBackup({
    currentReport: completeReport,
    activeView: 'report',
    status: 'completed'
  });

  // 4. Sinkronkan ke Firebase jika jaringan aktif, atau simpan ke antrean jika sinyal terputus
  let syncedToCloud = false;
  if (isFirebaseActive && db && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      await setDoc(doc(db, 'assessments', reportId), completeReport);
      syncedToCloud = true;
    } catch (e) {
      console.warn('Gagal simpan langsung ke Firestore (masuk antrean sinkronisasi otomatis):', e);
    }
  }

  if (!syncedToCloud && isFirebaseActive) {
    enqueuePendingSyncReport(completeReport);
  }

  return completeReport;
}

/**
 * Perbarui Status Token
 */
export async function updateTokenStatus(tokenStr, status, studentInfo = null) {
  const clean = (tokenStr || '').trim().toLowerCase();

  if (isFirebaseActive && db) {
    try {
      const q = query(collection(db, 'assessment_tokens'), where('token', '==', clean));
      const snaps = await getDocs(q);
      snaps.forEach(async d => {
        const updatePayload = { status, updatedAt: new Date().toISOString() };
        if (studentInfo) {
          updatePayload.studentName = studentInfo.fullName || '';
          updatePayload.occupation = studentInfo.occupation || studentInfo.className || '';
          updatePayload.birthDate = studentInfo.birthDate || '';
          updatePayload.age = studentInfo.age || null;
        }
        await updateDoc(doc(db, 'assessment_tokens', d.id), updatePayload);
      });
    } catch (err) {
      console.warn('Gagal update token di Firebase:', err);
    }
  }

  const tokens = JSON.parse(localStorage.getItem(LOCAL_STORAGE_TOKENS) || '[]');
  const idx = tokens.findIndex(t => (t.token || '').toLowerCase() === clean);
  if (idx >= 0) {
    tokens[idx].status = status;
    if (studentInfo) {
      tokens[idx].studentName = studentInfo.fullName || tokens[idx].studentName;
      tokens[idx].occupation = studentInfo.occupation || tokens[idx].occupation;
      tokens[idx].birthDate = studentInfo.birthDate || tokens[idx].birthDate;
      tokens[idx].age = studentInfo.age || tokens[idx].age;
    }
    localStorage.setItem(LOCAL_STORAGE_TOKENS, JSON.stringify(tokens));
  }
}

/**
 * Ambil Semua Laporan Asesmen untuk Konselor / Admin
 */
export async function getAllAssessmentReports() {
  if (isFirebaseActive && db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'assessments'));
      const list = [];
      querySnapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
      if (list.length > 0) return list;
    } catch (e) {
      console.warn('Firebase getAllAssessmentReports gagal:', e);
    }
  }

  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_REPORTS) || '[]');
}

/**
 * Ambil Laporan Tunggal berdasarkan Token atau Report ID
 */
export async function getAssessmentReport(reportIdOrToken) {
  const reports = await getAllAssessmentReports();
  const clean = (reportIdOrToken || '').trim().toLowerCase();
  return reports.find(r => r.id === reportIdOrToken || (r.token || '').toLowerCase() === clean) || null;
}

/**
 * Catat Intervensi / Tindak Lanjut Guru BK
 */
export async function recordIntervention(reportId, interventionData) {
  const reports = JSON.parse(localStorage.getItem(LOCAL_STORAGE_REPORTS) || '[]');
  const reportIndex = reports.findIndex(r => r.id === reportId);

  const newIntervention = {
    id: `INT-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    ...interventionData
  };

  if (reportIndex >= 0) {
    if (!reports[reportIndex].interventions) {
      reports[reportIndex].interventions = [];
    }
    reports[reportIndex].interventions.unshift(newIntervention);
    localStorage.setItem(LOCAL_STORAGE_REPORTS, JSON.stringify(reports));

    if (isFirebaseActive && db) {
      try {
        await updateDoc(doc(db, 'assessments', reportId), {
          interventions: reports[reportIndex].interventions
        });
      } catch (err) {
        console.warn('Gagal update intervensi di Firebase:', err);
      }
    }
  }

  return newIntervention;
}

/**
 * Perbarui Status & Catatan Sesi Konsultasi Selesai (Consult Done)
 */
export async function updateConsultationStatus(reportId, consultationData) {
  const reports = JSON.parse(localStorage.getItem(LOCAL_STORAGE_REPORTS) || '[]');
  const reportIndex = reports.findIndex(r => r.id === reportId);

  const completedConsultation = {
    status: 'completed',
    completedAt: new Date().toISOString(),
    counselorName: consultationData.counselorName || 'Guru BK Pembimbing / Konselor',
    consultationType: consultationData.consultationType || 'Tatap Muka di Ruang BK',
    topic: consultationData.topic || 'Regulasi Emosi & Penyesuaian Diri',
    notes: consultationData.notes || 'Sesi konsultasi telah diselesaikan dan konseli mendapatkan arahan praktis.',
    actionPlan: consultationData.actionPlan || 'Mempraktikkan teknik regulasi emosi harian dan menjaga keseimbangan pola hidup.',
    ...consultationData
  };

  let updatedReport = null;

  if (reportIndex >= 0) {
    reports[reportIndex].consultation = completedConsultation;
    reports[reportIndex].consultationStatus = 'completed';
    reports[reportIndex].updatedAt = new Date().toISOString();
    updatedReport = reports[reportIndex];
    localStorage.setItem(LOCAL_STORAGE_REPORTS, JSON.stringify(reports));

    if (isFirebaseActive && db) {
      try {
        await updateDoc(doc(db, 'assessments', reportId), {
          consultation: completedConsultation,
          consultationStatus: 'completed',
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Gagal update status konsultasi di Firebase:', err);
      }
    }
  }

  return updatedReport;
}

/**
 * Ambil dan Perbarui Daftar Kontak Krisis
 */
export function getCrisisContacts() {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_CRISIS) || JSON.stringify(DEFAULT_CRISIS_CONTACTS));
}

export function saveCrisisContacts(contacts) {
  localStorage.setItem(LOCAL_STORAGE_CRISIS, JSON.stringify(contacts));
  return contacts;
}

/**
 * ============================================================================
 * PENGELOLAAN MEDIA GOOGLE DRIVE (GAMBAR & VIDEO)
 * ============================================================================
 * Mengurai tautan Google Drive dan mengonversinya menjadi URL embed/pratinjau:
 * - Gambar: format thumbnail resolusi tinggi (bebas blokir CORS)
 * - Video: format iframe Google Drive Video Player (/preview)
 */
export function parseGoogleDriveMedia(url, explicitType = 'auto') {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Ekstraksi File ID Google Drive
  let driveId = null;
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const matchOpenId = trimmed.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  const matchD = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

  if (matchFileD) {
    driveId = matchFileD[1];
  } else if (matchIdParam) {
    driveId = matchIdParam[1];
  } else if (matchOpenId) {
    driveId = matchOpenId[1];
  } else if (matchD) {
    driveId = matchD[1];
  }

  // Menentukan tipe media
  let type = explicitType;
  if (!type || type === 'auto') {
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be') || trimmed.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
      type = 'video';
    } else {
      type = 'image';
    }
  }

  if (driveId) {
    if (type === 'video') {
      return {
        isDrive: true,
        type: 'video',
        id: driveId,
        embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
        rawUrl: trimmed
      };
    } else {
      return {
        isDrive: true,
        type: 'image',
        id: driveId,
        embedUrl: `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`,
        rawUrl: trimmed
      };
    }
  }

  // Format YouTube embed
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch) {
    return {
      isDrive: false,
      type: 'video',
      id: ytMatch[1],
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      rawUrl: trimmed
    };
  }

  // URL Langsung lainnya
  return {
    isDrive: false,
    type: type,
    id: null,
    embedUrl: trimmed,
    rawUrl: trimmed
  };
}

/**
 * ============================================================================
 * DATABASE BUTIR SOAL & JAWABAN (CRUD BANK SOAL)
 * ============================================================================
 */

/**
 * Ambil semua butir soal asesmen
 */
export async function getAllAssessmentQuestions() {
  if (isFirebaseActive && db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'assessment_questions'));
      const list = [];
      querySnapshot.forEach(d => list.push({ id: Number(d.id) || d.id, ...d.data() }));
      if (list.length > 0) {
        list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
        return list;
      }
    } catch (e) {
      console.warn('Firebase getAllAssessmentQuestions gagal, membaca lokal:', e);
    }
  }

  const saved = localStorage.getItem(LOCAL_STORAGE_QUESTIONS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  // Inisialisasi dari RAW_QUESTIONS bawaan jika belum ada
  localStorage.setItem(LOCAL_STORAGE_QUESTIONS, JSON.stringify(RAW_QUESTIONS));
  return [...RAW_QUESTIONS];
}

/**
 * Simpan / Tambah / Perbarui Butir Soal (Create & Update)
 */
export async function saveAssessmentQuestion(questionData) {
  const currentQuestions = await getAllAssessmentQuestions();
  let questionId = questionData.id;

  if (!questionId) {
    const maxId = currentQuestions.reduce((max, q) => Math.max(max, Number(q.id) || 0), 0);
    questionId = maxId + 1;
  } else {
    questionId = Number(questionId) || questionId;
  }

  const payload = {
    ...questionData,
    id: questionId,
    updatedAt: new Date().toISOString()
  };

  const existingIdx = currentQuestions.findIndex(q => String(q.id) === String(questionId));
  let updatedQuestions;
  if (existingIdx >= 0) {
    updatedQuestions = [...currentQuestions];
    updatedQuestions[existingIdx] = { ...updatedQuestions[existingIdx], ...payload };
  } else {
    updatedQuestions = [...currentQuestions, payload];
  }

  updatedQuestions.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  localStorage.setItem(LOCAL_STORAGE_QUESTIONS, JSON.stringify(updatedQuestions));

  if (isFirebaseActive && db) {
    try {
      await setDoc(doc(db, 'assessment_questions', String(questionId)), payload);
    } catch (err) {
      console.warn('Gagal simpan soal ke Firestore:', err);
    }
  }

  return payload;
}

/**
 * Hapus Butir Soal (Delete)
 */
export async function deleteAssessmentQuestion(questionId) {
  const currentQuestions = await getAllAssessmentQuestions();
  const filtered = currentQuestions.filter(q => String(q.id) !== String(questionId));

  localStorage.setItem(LOCAL_STORAGE_QUESTIONS, JSON.stringify(filtered));

  if (isFirebaseActive && db) {
    try {
      await deleteDoc(doc(db, 'assessment_questions', String(questionId)));
    } catch (err) {
      console.warn('Gagal hapus soal di Firestore:', err);
    }
  }

  return true;
}

/**
 * Reset Bank Soal ke Data Standar Bawaan (126 Soal)
 */
export async function resetAssessmentQuestionsToDefault() {
  localStorage.setItem(LOCAL_STORAGE_QUESTIONS, JSON.stringify(RAW_QUESTIONS));

  if (isFirebaseActive && db) {
    try {
      for (const q of RAW_QUESTIONS) {
        await setDoc(doc(db, 'assessment_questions', String(q.id)), q);
      }
    } catch (err) {
      console.warn('Gagal reset soal ke Firestore:', err);
    }
  }

  return [...RAW_QUESTIONS];
}
