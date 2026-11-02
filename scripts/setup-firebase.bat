@echo off
chcp 65001 >nul
echo.
echo ══════════════════════════════════════════════════
echo   GALAU - Firebase Backend Setup (Windows)
echo ══════════════════════════════════════════════════
echo.

REM Step 1: Login
echo [STEP 1/5] Login ke Firebase...
echo   Buka browser dan login dengan akun Google Anda.
echo.
call firebase login
if %ERRORLEVEL% neq 0 (
    echo ❌ Firebase login gagal!
    pause
    exit /b 1
)
echo.

REM Step 2: Create Project
echo [STEP 2/5] Membuat Firebase Project...
set PROJECT_ID=galau-counseling-app
echo   Project ID: %PROJECT_ID%
echo.
call firebase projects:create %PROJECT_ID% --display-name "GALAU Counseling Assessment"
if %ERRORLEVEL% neq 0 (
    echo ⚠️  Project mungkin sudah ada. Lanjut...
)
echo.

REM Step 3: Select project
echo [STEP 3/5] Menggunakan project %PROJECT_ID%...
call firebase use %PROJECT_ID%
echo.

REM Step 4: Enable services
echo [STEP 4/5] Mengaktifkan Firestore dan Authentication...
echo   Catatan: Aktifkan Email/Password auth di Firebase Console:
echo   https://console.firebase.google.com/project/%PROJECT_ID%/authentication/providers
echo.

REM Step 5: Deploy rules
echo [STEP 5/5] Deploy Firestore rules...
call firebase deploy --only firestore:rules
echo.

echo ══════════════════════════════════════════════════
echo   ✅ Setup Selesai!
echo ══════════════════════════════════════════════════
echo.
echo   Langkah selanjutnya:
echo   1. Buka Firebase Console dan aktifkan Email/Password Auth
echo   2. Salin konfigurasi Firebase ke file .env
echo   3. Jalankan: node scripts/firebase-seed.mjs
echo   4. Jalankan: npm run dev
echo.
pause

