import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TokenLogin } from './components/TokenLogin';
import { IdentityForm } from './components/IdentityForm';
import { AssessmentRunner } from './components/AssessmentRunner';
import { ReportView } from './components/ReportView';
import { ConsultView } from './components/ConsultView';
import { CounselorDashboard } from './components/CounselorDashboard';
import { FirebaseModal } from './components/FirebaseModal';
import { AppInfoModal } from './components/AppInfoModal';
import { calculateAssessmentScores } from './data/scoringRules';
import {
  saveAssessmentReport,
  saveActiveSessionBackup,
  getActiveSessionBackup,
  clearActiveSessionBackup,
  generateNextReportId
} from './services/storageService';
import { Check, ArrowRight, ShieldCheck, User, X } from 'lucide-react';

const SYSTEM_STEPS = [
  { key: 'login', num: 1, title: 'Input Token', desc: 'Akses Token' },
  { key: 'identity', num: 2, title: 'Isi Identitas', desc: 'Nama, Lahir, Pekerjaan' },
  { key: 'assessment', num: 3, title: 'Isi Asesmen', desc: 'Skrining DASS-42 & DCM' },
  { key: 'report', num: 4, title: 'Hasil Asesmen', desc: 'Skor & Triase' },
  { key: 'consult', num: 5, title: 'Konsultasi Selesai', desc: 'Get Consult Done' }
];

export function App() {
  // Pulihkan sesi otomatis jika terjadi musibah (sinyal terputus, refresh tak sengaja, tab tertutup)
  const initialBackup = getActiveSessionBackup();
  const hasRestorableSession = Boolean(
    initialBackup &&
    initialBackup.currentToken &&
    initialBackup.activeView &&
    initialBackup.activeView !== 'login'
  );

  const [activeView, setActiveView] = useState(() => (hasRestorableSession ? initialBackup.activeView : 'login'));
  const [currentToken, setCurrentToken] = useState(() => initialBackup?.currentToken || null);
  const [studentData, setStudentData] = useState(() => initialBackup?.studentData || null);
  const [currentReport, setCurrentReport] = useState(() => initialBackup?.currentReport || null);
  const [sessionRestoredNotice, setSessionRestoredNotice] = useState(hasRestorableSession);

  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Cadangkan sesi aktif setiap ada perubahan status / data
  useEffect(() => {
    if (currentToken) {
      saveActiveSessionBackup({
        activeView,
        currentToken,
        studentData,
        currentReport
      });
    }
  }, [activeView, currentToken, studentData, currentReport]);

  // 1. Alur Login Token Berhasil -> Step 2
  const handleLoginSuccess = (tokenData) => {
    setCurrentToken(tokenData);
    setSessionRestoredNotice(false);

    if (tokenData.role === 'counselor' || tokenData.role === 'admin') {
      setActiveView('counselor');
    } else {
      setActiveView('identity');
    }
  };

  // 2. Alur Pengisian Identitas Selesai -> Step 3
  const handleIdentityProceed = (formData) => {
    setStudentData(formData);
    setActiveView('assessment');
  };

  // 3. Alur Pengisian Asesmen Selesai -> Step 4 (Hasil Asesmen)
  const handleCompleteAssessment = async (responses, questions) => {
    const scores = calculateAssessmentScores(responses, questions);
    const standardReportId = await generateNextReportId();

    const reportPayload = {
      id: standardReportId,
      token: currentToken ? currentToken.token : 'GLU-DIRECT',
      studentInfo: studentData,
      scores,
      interventions: [],
      consultation: null,
      consultationStatus: 'pending',
      completedAt: new Date().toISOString()
    };

    // Simpan ke Firestore / LocalStorage
    const saved = await saveAssessmentReport(reportPayload);
    setCurrentReport(saved);
    setActiveView('report');
  };

  // 4. Update status konsultasi selesai (Step 5 - Consult Done)
  const handleConsultationCompleted = (updatedReport) => {
    if (updatedReport) {
      setCurrentReport(updatedReport);
      saveActiveSessionBackup({ currentReport: updatedReport });
    }
  };

  // 5. Logout / Reset Sesi ke Awal
  const handleLogout = () => {
    clearActiveSessionBackup();
    setSessionRestoredNotice(false);
    setCurrentToken(null);
    setStudentData(null);
    setCurrentReport(null);
    setActiveView('login');
  };

  // 6. Konselor memilih laporan untuk dilihat
  const handleSelectReport = (report) => {
    setCurrentReport(report);
    setActiveView('report');
  };

  // Menentukan nomor step aktif saat ini
  const getCurrentStepIndex = () => {
    switch (activeView) {
      case 'login': return 1;
      case 'identity': return 2;
      case 'assessment': return 3;
      case 'report': return 4;
      case 'consult': return 5;
      default: return 0;
    }
  };

  const currentStepNum = getCurrentStepIndex();

  const handleStepClick = (stepKey, stepNum) => {
    if (activeView === 'counselor') return;
    // Boleh kembali ke step sebelumnya atau melompat antara report & consult jika laporan sudah ada
    if (stepNum < currentStepNum) {
      if (stepKey === 'login') handleLogout();
      else if (stepKey === 'identity' && currentToken) setActiveView('identity');
      else if (stepKey === 'report' && currentReport) setActiveView('report');
    } else if (stepKey === 'consult' && currentReport) {
      setActiveView('consult');
    }
  };

  return (
    <div className="app-container">
      <Navbar
        currentToken={currentToken}
        onLogout={handleLogout}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        onOpenInfoModal={() => setIsInfoModalOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Simplified System Stepper Bar (5 Steps) */}
      {activeView !== 'counselor' && (
        <div className="system-stepper-bar no-print">
          <div className="system-stepper-track">
            {SYSTEM_STEPS.map((s, idx) => {
              const isPassed = currentStepNum > s.num;
              const isActive = currentStepNum === s.num;
              const isAccessible = isPassed || (s.num === 5 && Boolean(currentReport));

              return (
                <React.Fragment key={s.key}>
                  <div
                    onClick={() => isAccessible && handleStepClick(s.key, s.num)}
                    className={`system-stepper-step ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''} ${isAccessible ? 'accessible' : ''}`}
                  >
                    <div className="system-stepper-badge">
                      {isPassed ? <Check size={14} strokeWidth={3} /> : s.num}
                    </div>

                    <div className="system-stepper-text">
                      <span className="system-stepper-title">
                        {s.title}
                      </span>
                      <span className="system-stepper-desc">
                        {s.desc}
                      </span>
                    </div>
                  </div>

                  {idx < SYSTEM_STEPS.length - 1 && (
                    <div className={`system-stepper-line ${currentStepNum > idx + 1 ? 'passed' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      <main>
        {/* Banner Pemulihan Sesi Otomatis */}
        {sessionRestoredNotice && activeView !== 'login' && (
          <div className="no-print" style={{
            maxWidth: '760px',
            margin: '0 auto 1.25rem auto',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--status-normal-bg, #ECFDF5)',
            border: '1px solid var(--status-normal, #10B981)',
            color: '#065F46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0 }} />
              <span>
                <strong>Sesi Berhasil Dipulihkan:</strong> Anda melanjutkan sesi sebelumnya. Seluruh data identitas dan jawaban Anda tersimpan aman.
              </span>
            </div>
            <button
              onClick={() => setSessionRestoredNotice(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#065F46',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Tutup pemberitahuan"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Step 1: User input token */}
        {activeView === 'login' && (
          <TokenLogin
            onLoginSuccess={handleLoginSuccess}
            onOpenInfoModal={() => setIsInfoModalOpen(true)}
          />
        )}

        {/* Step 2: Fill identity such as name, birthdate, occupations */}
        {activeView === 'identity' && currentToken && (
          <IdentityForm
            tokenData={currentToken}
            onProceed={handleIdentityProceed}
          />
        )}

        {/* Step 3: Fill assessment */}
        {activeView === 'assessment' && studentData && (
          <AssessmentRunner
            studentData={studentData}
            onCompleteAssessment={handleCompleteAssessment}
          />
        )}

        {/* Step 4: Get result */}
        {activeView === 'report' && currentReport && (
          <ReportView
            reportData={currentReport}
            userRole={currentToken?.role || 'student'}
            onBackToDashboard={
              currentToken?.role === 'counselor' || currentToken?.role === 'admin'
                ? () => setActiveView('counselor')
                : null
            }
            onRetake={() => {
              setActiveView('identity');
            }}
            onProceedToConsult={() => setActiveView('consult')}
          />
        )}

        {/* Step 5: Get consult done */}
        {activeView === 'consult' && currentReport && (
          <ConsultView
            reportData={currentReport}
            userRole={currentToken?.role || 'student'}
            onBackToReport={() => setActiveView('report')}
            onConsultationCompleted={handleConsultationCompleted}
            onResetSession={handleLogout}
          />
        )}

        {/* Counselor / Admin Dashboard */}
        {activeView === 'counselor' && (
          <CounselorDashboard
            onSelectReport={handleSelectReport}
            onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
          />
        )}
      </main>

      <FirebaseModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />

      <AppInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />

      <footer className="app-footer no-print">
        <p><strong>GALAU</strong> &copy; 2026 - Pusat Bimbingan, Konseling & Kesejahteraan Psikologis. Norma DASS-42 & Skrining DCM.</p>
        <p className="app-footer-sub">
          Alur Sederhana: 1. Input Token ➔ 2. Isi Identitas (Nama, Lahir, Pekerjaan) ➔ 3. Asesmen ➔ 4. Hasil Asesmen ➔ 5. Konsultasi Selesai (Consult Done).
        </p>
      </footer>
    </div>
  );
}
export default App;
