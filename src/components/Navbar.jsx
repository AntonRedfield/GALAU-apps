import React from 'react';
import { Brain, Database, UserCheck, LogOut, ShieldCheck, Info } from 'lucide-react';
import { isFirebaseActive } from '../services/firebase';

export function Navbar({
  currentToken,
  onLogout,
  onOpenFirebaseModal,
  activeView,
  setActiveView,
  onOpenInfoModal
}) {
  return (
    <header className="navbar">
      <div className="nav-brand" onClick={() => setActiveView('login')} style={{ cursor: 'pointer' }}>
        <div className="brand-icon-box">
          <Brain size={20} />
        </div>
        <div>
          <h1 className="brand-title">GALAU</h1>
          <p className="brand-subtitle">Guidance, Assessment of Life-distress, Anxiety & Utility</p>
        </div>
      </div>

      <div className="nav-actions">
        {/* Info & Tutorial Button (Logo 'i') */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenInfoModal}
          title="Petunjuk & Informasi Aplikasi"
          style={{ padding: '0.4rem 0.65rem' }}
        >
          <Info size={15} color="var(--primary)" />
          <span className="hidden sm:inline" style={{ fontSize: '0.78rem' }}>Panduan</span>
        </button>

        {/* Cloud Database Connection Settings */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenFirebaseModal}
          title="Status Koneksi Cloud & Basis Data"
          style={{ padding: '0.4rem 0.65rem' }}
        >
          <Database size={14} color={isFirebaseActive ? '#10B981' : '#3B82F6'} />
          <span style={{ fontSize: '0.78rem' }}>{isFirebaseActive ? 'Cloud Sync' : 'Database'}</span>
        </button>

        {currentToken && (
          <>
            {(currentToken.role === 'counselor' || currentToken.role === 'admin') && (
              <button
                className={`btn btn-sm ${activeView === 'counselor' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveView('counselor')}
              >
                <ShieldCheck size={14} />
                <span>Konselor</span>
              </button>
            )}

            <span className="badge badge-normal" style={{ fontSize: '0.72rem', textTransform: 'none' }}>
              <UserCheck size={12} /> {currentToken.token}
            </span>

            <button className="btn btn-secondary btn-sm" onClick={onLogout} title="Keluar">
              <LogOut size={14} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
