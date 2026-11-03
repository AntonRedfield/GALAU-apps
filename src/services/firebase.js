/**
 * Inisialisasi Firebase SDK
 * Mendukung konfigurasi melalui Environment Variables (.env)
 * atau konfigurasi langsung melalui Antarmuka Pengaturan (localStorage)
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const STORAGE_KEY_FIREBASE_CONFIG = 'galau_firebase_config';

// Cek konfigurasi default dari env atau localStorage
export function getStoredFirebaseConfig() {
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (fromStorage) {
      const parsed = JSON.parse(fromStorage);
      if (isFirebaseConfigValid(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Gagal membaca konfigurasi Firebase dari localStorage:', e);
  }

  // Fallback ke Vite Environment Variables jika ada
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  };
}

export function isFirebaseConfigValid(config) {
  return Boolean(
    config &&
    config.apiKey &&
    config.apiKey.trim().length > 10 &&
    config.projectId &&
    config.projectId.trim().length > 3
  );
}

let firebaseApp = null;
let firestoreDb = null;
let firebaseAuthInstance = null;

export function initFirebase() {
  const config = getStoredFirebaseConfig();

  if (!isFirebaseConfigValid(config)) {
    return { isConfigured: false, db: null, auth: null };
  }

  try {
    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }
    firestoreDb = getFirestore(firebaseApp);
    firebaseAuthInstance = getAuth(firebaseApp);
    return { isConfigured: true, db: firestoreDb, auth: firebaseAuthInstance };
  } catch (error) {
    console.error('Inisialisasi Firebase Gagal:', error);
    return { isConfigured: false, error, db: null, auth: null };
  }
}

export function saveFirebaseConfig(newConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(newConfig));
    // Re-inisialisasi
    window.location.reload();
  } catch (e) {
    console.error('Gagal menyimpan konfigurasi Firebase:', e);
  }
}

export function removeFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
  window.location.reload();
}

/**
 * Login Admin menggunakan Firebase Authentication (Email & Password)
 * @param {string} email - Email admin (e.g. admin@sekolah.id)
 * @param {string} password - Password admin
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function firebaseAdminLogin(email, password) {
  if (!firebaseAuthInstance) {
    return { success: false, error: 'Firebase belum dikonfigurasi.' };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(firebaseAuthInstance, email, password);
    return {
      success: true,
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || 'Administrator'
      }
    };
  } catch (error) {
    let errorMsg = 'Autentikasi gagal.';
    switch (error.code) {
      case 'auth/invalid-email':
        errorMsg = 'Format email tidak valid.';
        break;
      case 'auth/user-not-found':
        errorMsg = 'Akun admin tidak ditemukan di Firebase.';
        break;
      case 'auth/wrong-password':
        errorMsg = 'Kata sandi salah.';
        break;
      case 'auth/invalid-credential':
        errorMsg = 'Email atau kata sandi salah.';
        break;
      case 'auth/too-many-requests':
        errorMsg = 'Terlalu banyak percobaan gagal. Coba lagi nanti.';
        break;
      default:
        errorMsg = `Kesalahan autentikasi: ${error.message}`;
    }
    return { success: false, error: errorMsg };
  }
}

/**
 * Logout Firebase Auth
 */
export async function firebaseAdminLogout() {
  if (firebaseAuthInstance) {
    try {
      await signOut(firebaseAuthInstance);
    } catch (e) {
      console.warn('Gagal logout Firebase:', e);
    }
  }
}

/**
 * Subscribe to Auth state changes
 */
export function onFirebaseAuthChanged(callback) {
  if (firebaseAuthInstance) {
    return onAuthStateChanged(firebaseAuthInstance, callback);
  }
  return () => {};
}

/**
 * Get current authenticated user
 */
export function getCurrentUser() {
  return firebaseAuthInstance?.currentUser || null;
}

// Inisialisasi awal
const currentFirebase = initFirebase();
export const db = currentFirebase.db;
export const auth = currentFirebase.auth;
export const isFirebaseActive = currentFirebase.isConfigured;
