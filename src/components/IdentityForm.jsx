import React, { useState } from 'react';
import { UserCheck, ShieldCheck, ArrowRight, Settings2, Sparkles, Calendar, Briefcase, User, Phone } from 'lucide-react';

function calculateAge(birthDateString) {
  if (!birthDateString) return '';
  const birth = new Date(birthDateString);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? age : 0;
}

export function IdentityForm({ tokenData, onProceed }) {
  const [formData, setFormData] = useState({
    fullName: tokenData.studentName || '',
    birthDate: tokenData.birthDate || '2001-05-20',
    age: tokenData.age || 24,
    occupation: tokenData.occupation || tokenData.className || 'Karyawan Swasta',
    gender: 'Laki-laki',
    phone: '',
    initialNotes: '',
    assessmentMode: 'adaptive',
    scaleInterface: 'shuffle',
    consentAgreed: true
  });

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'birthDate') {
      const computedAge = calculateAge(value);
      setFormData({ ...formData, birthDate: value, age: computedAge });
      return;
    }
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) { setErrorMsg('Nama lengkap wajib diisi.'); return; }
    if (!formData.birthDate) { setErrorMsg('Tanggal lahir wajib diisi.'); return; }
    if (!formData.occupation.trim()) { setErrorMsg('Pekerjaan / Instansi wajib diisi.'); return; }
    if (!formData.consentAgreed) { setErrorMsg('Harap setujui persetujuan pengisian data terlebih dahulu.'); return; }
    setErrorMsg('');
    onProceed({ ...formData, token: tokenData.token });
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="glass-card">
        {/* Header Identitas */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '42px', height: '42px', background: 'var(--primary-light)', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
            }}>
              <UserCheck size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Isi Data Identitas Diri</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Langkah 2 dari 5 • Lengkapi profil untuk akurasi rekomendasi
              </p>
            </div>
          </div>
          <span className="badge badge-normal" style={{ fontFamily: 'monospace', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
            Token: {tokenData.token}
          </span>
        </div>

        {errorMsg && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #F87171', color: '#B91C1C',
            borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem', marginBottom: '1.25rem', fontSize: '0.85rem'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Main 3 Simplified Fields: Name, Birthdate, Occupation */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <User size={15} color="var(--primary)" /> Nama Lengkap *
            </label>
            <input
              type="text"
              name="fullName"
              className="form-input"
              placeholder="Contoh: Ahmad Fauzan"
              value={formData.fullName}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={15} color="var(--primary)" /> Tanggal Lahir *
              </label>
              <input
                type="date"
                name="birthDate"
                className="form-input"
                value={formData.birthDate}
                onChange={handleChange}
                required
              />
              <span className="form-hint" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                Usia terhitung: <strong>{formData.age ? `${formData.age} Tahun` : '-'}</strong>
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Briefcase size={15} color="var(--primary)" /> Pekerjaan / Aktivitas *
              </label>
              <input
                type="text"
                name="occupation"
                className="form-input"
                placeholder="Contoh: Karyawan, Mahasiswa, Wiraswasta"
                value={formData.occupation}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Jenis Kelamin</label>
              <select name="gender" className="form-select" value={formData.gender} onChange={handleChange}>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={14} color="var(--text-muted)" /> Nomor WhatsApp / HP (Opsional)
              </label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                placeholder="Contoh: 08123456789"
                value={formData.phone}
                onChange={handleChange}
              />
              <span className="form-hint">Untuk notifikasi & jadwal konsultasi konselor</span>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Keluhan atau Kondisi yang Dialami Saat Ini (Opsional)</label>
            <textarea
              name="initialNotes"
              rows={2}
              className="form-textarea"
              placeholder="Ceritakan singkat hal yang membebani pikiran atau perasaan Anda akhir-akhir ini..."
              value={formData.initialNotes}
              onChange={handleChange}
            />
          </div>

          {/* Optional Collapsed Advanced Settings */}
          <div style={{ marginBottom: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
            >
              <Settings2 size={13} />
              <span>{showAdvancedSettings ? 'Sembunyikan Pengaturan Format' : 'Pengaturan Format Asesmen (Opsional)'}</span>
            </button>

            {showAdvancedSettings && (
              <div style={{
                marginTop: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
                padding: '0.85rem', border: '1px solid var(--border)', display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem'
              }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Mode Skrining</label>
                  <select name="assessmentMode" className="form-select" value={formData.assessmentMode} onChange={handleChange} style={{ fontSize: '0.8rem' }}>
                    <option value="adaptive">Adaptif Cerdas (18 Skrining + Ekspansi)</option>
                    <option value="comprehensive">Lengkap Seluruh Butir (126 Soal)</option>
                    <option value="dass42">Standar DASS-42 (42 Butir)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Antarmuka Skala</label>
                  <select name="scaleInterface" className="form-select" value={formData.scaleInterface} onChange={handleChange} style={{ fontSize: '0.8rem' }}>
                    <option value="shuffle">Acak Otomatis (Slider, Semantik, Baterai)</option>
                    <option value="slider">Slider VAS</option>
                    <option value="semantic">Jangkar Pilihan Semantik</option>
                    <option value="battery">Level Baterai</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Consent Checkbox */}
          <div style={{
            background: 'var(--status-normal-bg)', border: '1px solid #BBF7D0',
            borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem', color: '#166534' }}>
              <ShieldCheck size={16} />
              <strong style={{ fontSize: '0.82rem' }}>Persetujuan Layanan & Kerahasiaan Data</strong>
            </div>
            <p style={{ fontSize: '0.76rem', color: '#15803D', lineHeight: 1.45, marginBottom: '0.5rem' }}>
              Data Anda dirahasiakan dan diproses secara aman untuk keperluan bimbingan & konseling psikologis.
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>
              <input
                type="checkbox"
                name="consentAgreed"
                checked={formData.consentAgreed}
                onChange={handleChange}
                style={{ width: '16px', height: '16px', accentColor: '#16A34A' }}
              />
              <span>Saya menyetujui pengisian asesmen ini secara sadar & sukarela.</span>
            </label>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
              <span>Lanjutkan ke Asesmen</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default IdentityForm;
