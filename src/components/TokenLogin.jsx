import React, { useState } from 'react';
import {
  KeyRound, ArrowRight, ShieldAlert, Lock, User, ArrowLeft,
  Info
} from 'lucide-react';
import { validateToken, validateAdminCredentials } from '../services/storageService';

export function TokenLogin({ onLoginSuccess, onOpenInfoModal }) {
  const [step, setStep] = useState('token'); // 'token' | 'admin_login'
  const [tokenInput, setTokenInput] = useState('');
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    const cleanToken = tokenInput.trim().toLowerCase();
    if (!cleanToken) {
      setErrorMessage('Silakan isi kolom token terlebih dahulu.');
      return;
    }

    // Jika admin memasukkan token khusus "konsultan" (atau "master")
    if (cleanToken === 'konsultan' || cleanToken === 'master') {
      setErrorMessage('');
      setStep('admin_login');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const res = await validateToken(cleanToken);
      if (res.success) {
        onLoginSuccess(res.data);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Gagal memvalidasi token. Silakan periksa kembali token Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAuthSubmit = async (e) => {
    e.preventDefault();
    if (!adminId.trim() || !adminPassword.trim()) {
      setErrorMessage('Silakan isi email/ID dan kata sandi administrator.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await validateAdminCredentials(adminId, adminPassword);
      if (res.success) {
        onLoginSuccess(res.data);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Terjadi kendala saat memverifikasi kredensial administrator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto' }}>
      <div className="glass-card" style={{ padding: '2rem 1.75rem', position: 'relative' }}>

        {/* Top-Right Info Button (i Logo) */}
        <button
          type="button"
          onClick={onOpenInfoModal}
          title="Petunjuk & Informasi Aplikasi GALAU"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            border: '1px solid #C7D2FE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          className="hover:scale-105"
        >
          <Info size={16} strokeWidth={2.5} />
        </button>

        {errorMessage && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C',
            borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem', marginBottom: '1.25rem',
            fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <ShieldAlert size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. SISWA / KONSELI TOKEN LOGIN */}
        {step === 'token' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '52px', height: '52px', background: 'var(--primary-light)', color: 'var(--primary)',
              borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <KeyRound size={26} />
            </div>

            <h2 style={{ fontSize: '1.45rem', marginBottom: '0.35rem', fontWeight: 800 }}>
              Masuk dengan Token
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '1.75rem', lineHeight: 1.45 }}>
              Langkah 1 dari 5 • Masukkan 6 karakter token akses yang diberikan oleh Guru BK untuk memulai asesmen mandiri.
            </p>

            <form onSubmit={handleTokenSubmit}>
              <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: 700 }}>
                  KODE TOKEN AKSES
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={tokenInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTokenInput(val);
                    setErrorMessage('');
                    // Opsional: jika langsung mengetik konsultan persis, bisa auto-buka form admin
                    if (val.trim().toLowerCase() === 'konsultan') {
                      setErrorMessage('');
                      setStep('admin_login');
                    }
                  }}
                  placeholder="Silakan masukkan kode token..."
                  maxLength={20}
                  style={{
                    fontSize: '1.4rem', letterSpacing: '0.15em', textAlign: 'center',
                    fontWeight: 700, fontFamily: 'monospace', padding: '0.85rem'
                  }}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading || !tokenInput.trim()}
                style={{ width: '100%', marginBottom: '1.25rem' }}
              >
                {loading ? 'Memvalidasi Token...' : <><span>Mulai Asesmen</span><ArrowRight size={16} /></>}
              </button>
            </form>

            {/* Quick Action Footer: Info Button only */}
            <div style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '1.25rem'
            }}>
              {/* Petunjuk Penggunaan Button with 'i' logo */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onOpenInfoModal}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: 'var(--bg)',
                  fontSize: '0.8rem',
                  padding: '0.55rem 0.85rem'
                }}
              >
                <Info size={15} color="var(--primary)" />
                <span>Petunjuk Penggunaan & Informasi Aplikasi</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. ADMINISTRATOR & KONSELOR LOGIN (Muncul saat token "konsultan" dimasukkan) */}
        {step === 'admin_login' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '52px', height: '52px', background: '#FEF3C7', color: '#D97706',
                borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '0.85rem'
              }}>
                <Lock size={26} />
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.3rem' }}>
                Portal Guru BK & Administrator
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.4 }}>
                Masukkan ID / Email dan kata sandi untuk mengakses dasbor pemantauan triase dan bank soal.
              </p>
            </div>

            <form onSubmit={handleAdminAuthSubmit}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  ID / EMAIL ADMINISTRATOR
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    placeholder="Silakan masukkan ID atau email Anda..."
                    style={{ paddingLeft: '2.2rem' }}
                    autoFocus
                  />
                  <User size={15} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  KATA SANDI
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="form-input"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Silakan masukkan kata sandi Anda..."
                    style={{ paddingLeft: '2.2rem' }}
                  />
                  <Lock size={15} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading || !adminId.trim() || !adminPassword.trim()}
                style={{ width: '100%', marginBottom: '0.85rem' }}
              >
                {loading ? 'Memverifikasi...' : <><span>Buka Panel Konselor</span><ArrowRight size={16} /></>}
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setStep('token'); setTokenInput(''); setErrorMessage(''); }}
                  style={{ flex: 1, fontSize: '0.8rem' }}
                >
                  <ArrowLeft size={14} /> <span>Kembali</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onOpenInfoModal}
                  title="Petunjuk Aplikasi"
                  style={{ width: '42px', padding: 0, justifyContent: 'center' }}
                >
                  <Info size={16} color="var(--primary)" />
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
