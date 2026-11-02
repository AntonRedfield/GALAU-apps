import React, { useState } from 'react';
import {
  X, Info, BookOpen, Brain, Shield, HeartHandshake, PhoneCall,
  CheckCircle2, ArrowRight, UserCheck, AlertTriangle, Layers, Lock
} from 'lucide-react';
import { DEFAULT_CRISIS_CONTACTS } from '../data/scoringRules';

export function AppInfoModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('tutorial'); // 'tutorial' | 'instrument' | 'roles' | 'privacy'

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '780px', maxHeight: '88vh', overflowY: 'auto', padding: '1.75rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%', background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0
            }}>
              <Info size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Panduan & Informasi Aplikasi GALAU
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Guidance, Assessment of Life-distress, Anxiety & Utility
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} title="Tutup">
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border)',
          paddingBottom: '0.75rem', marginBottom: '1.25rem', overflowX: 'auto'
        }}>
          {[
            { key: 'tutorial', label: 'Alur 5 Langkah', icon: BookOpen },
            { key: 'instrument', label: 'Instrumen Asesmen', icon: Brain },
            { key: 'roles', label: 'Peran & Akses', icon: UserCheck },
            { key: 'privacy', label: 'Privasi & Bantuan Darurat', icon: Shield }
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                onClick={() => setActiveTab(t.key)}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: ALUR PENGGUNAAN (5 LANGKAH) */}
        {activeTab === 'tutorial' && (
          <div>
            <div style={{
              background: 'var(--primary-light)', border: '1px solid #C7D2FE',
              borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--text)'
            }}>
              <strong>Tentang GALAU:</strong> Sistem pendukung layanan Bimbingan dan Konseling terpadu yang membantu peserta didik / konseli mengenali kondisi psikologisnya secara mandiri, aman, dan tanpa penghakiman.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                {
                  step: 1,
                  title: 'Input Token Akses',
                  desc: 'Dapatkan token unik 6 digit (kombinasi huruf kecil & angka) dari Guru BK / Pembimbing. Token ini memastikan privasi dan menjaga keamanan identitas konseli.',
                  note: 'Guru BK & Administrator dapat memasukkan kode token akses pembimbing untuk membuka portal masuk administrator.'
                },
                {
                  step: 2,
                  title: 'Lengkapi Data Identitas',
                  desc: 'Isi nama lengkap, tanggal lahir, dan kelas/instansi. Data identitas hanya dapat diakses oleh Guru BK pembimbing dan dilindungi kerahasiaannya.',
                  note: 'Usia akan dihitung secara otomatis berdasarkan tanggal lahir yang dimasukkan.'
                },
                {
                  step: 3,
                  title: 'Pengisian Asesmen Berjenjang',
                  desc: 'Jawab butir-butir pertanyaan berdasarkan apa yang dirasakan selama 7 hari terakhir. Pertanyaan mencakup respon emosional dan berbagai domain kehidupan.',
                  note: 'Dilengkapi perlindungan darurat otomatis: jawaban tetap tersimpan aman di perangkat jika sinyal terputus atau browser ter-refresh, sehingga sesi dapat terus dilanjutkan tanpa mengulang.'
                },
                {
                  step: 4,
                  title: 'Hasil Analitis & Triase Risiko',
                  desc: 'Sistem menyajikan rangkuman hasil asesmen secara bersahabat: tingkat resiliensi, pemetaan domain utama, serta tingkat triase risiko (Normal, Waspada, Tinggi, Kritis).',
                  note: 'Teks hasil untuk konseli disajikan dalam bahasa suportif dan non-menghakimi.'
                },
                {
                  step: 5,
                  title: 'Konsultasi Selesai (Get Consult Done)',
                  desc: 'Langkah akhir berupa rencana tindak lanjut bersama Guru BK (Konseling Individu, Konseling Kelompok, atau Alih Tangan Kasus jika memerlukan rujukan profesional).',
                  note: 'Setelah sesi konsultasi tatap muka terlaksana, Guru BK akan memvalidasi status penyelesaian.'
                }
              ].map((item) => (
                <div
                  key={item.step}
                  style={{
                    display: 'flex', gap: '0.85rem', alignItems: 'flex-start',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem'
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'var(--primary)', color: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.9rem', flexShrink: 0
                  }}>
                    {item.step}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.92rem', fontWeight: 700 }}>
                      {item.title}
                    </h4>
                    <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {item.desc}
                    </p>
                    <div style={{
                      background: 'var(--bg)', borderRadius: '4px', padding: '0.35rem 0.6rem',
                      fontSize: '0.72rem', color: 'var(--text-muted)'
                    }}>
                      💡 {item.note}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: INSTRUMEN ASESMEN */}
        {activeTab === 'instrument' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Standar Psikometri: DASS-42 & DCM
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Aplikasi GALAU mengintegrasikan dua instrumen bimbingan psikologis yang telah divalidasi secara ilmiah:
            </p>

            {/* DASS-42 Box */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Brain size={18} color="var(--primary)" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                  1. DASS-42 (Depression, Anxiety, Stress Scales)
                </h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.45 }}>
                Mengukur tiga keadaan emosional negatif berdasarkan norma baku Lovibond & Lovibond:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.75rem' }}>
                <div style={{ background: 'var(--bg)', padding: '0.6rem', borderRadius: '4px', borderLeft: '3px solid #3B82F6' }}>
                  <strong>Depresi:</strong> Kehilangan minat, pesimisme, perasaan tidak berharga, dan ketidakberdayaan.
                </div>
                <div style={{ background: 'var(--bg)', padding: '0.6rem', borderRadius: '4px', borderLeft: '3px solid #F59E0B' }}>
                  <strong>Kecemasan:</strong> Reaksi fisiologis (jantung berdebar, keringat dingin), kegugupan situasional, dan kepanikan.
                </div>
                <div style={{ background: 'var(--bg)', padding: '0.6rem', borderRadius: '4px', borderLeft: '3px solid #EF4444' }}>
                  <strong>Stres:</strong> Ketegangan mental berkepanjangan, iritabilitas (mudah marah), dan kesulitan relaksasi.
                </div>
              </div>
            </div>

            {/* DCM Box */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Layers size={18} color="var(--accent)" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                  2. DCM (Daftar Cek Masalah) — 6 Domain Kehidupan
                </h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.45 }}>
                Memetakan kebutuhan bimbingan siswa di 6 bidang kehidupan nyata:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.75rem' }}>
                <div style={{ background: 'var(--bg)', padding: '0.5rem 0.65rem', borderRadius: '4px' }}>
                  🎓 <strong>Akademik & Belajar:</strong> Kesulitan belajar, ujian, motivasi tugas sekolah.
                </div>
                <div style={{ background: 'var(--bg)', padding: '0.5rem 0.65rem', borderRadius: '4px' }}>
                  👥 <strong>Sosial & Interpersonal:</strong> Pergaulan sebaya, perundungan, rasa terisolasi.
                </div>
                <div style={{ background: 'var(--bg)', padding: '0.5rem 0.65rem', borderRadius: '4px' }}>
                  🏠 <strong>Dinamika Keluarga:</strong> Komunikasi orang tua, keharmonisan rumah, beban peran.
                </div>
                <div style={{ background: 'var(--bg)', padding: '0.5rem 0.65rem', borderRadius: '4px' }}>
                  🩺 <strong>Fisik & Psikoseksual:</strong> Citra tubuh, pubertas, kesehatan fisik & identitas.
                </div>
                <div style={{ background: 'var(--bg)', padding: '0.5rem 0.65rem', borderRadius: '4px' }}>
                  🧭 <strong>Karier & Masa Depan:</strong> Pemilihan jurusan lanjutan, cita-cita, kemandirian.
                </div>
                <div style={{ background: 'var(--bg)', padding: '0.5rem 0.65rem', borderRadius: '4px' }}>
                  ✨ <strong>Spiritual, Moral & Adiksi:</strong> Nilai batin, kebiasaan buruk/adiksi digital.
                </div>
              </div>
            </div>

            {/* Triase */}
            <div style={{
              background: '#FFFBEB', border: '1px solid #FDE68A',
              borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', fontSize: '0.78rem'
            }}>
              <strong style={{ color: '#B45309', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
                <AlertTriangle size={15} /> Mesin Triase Risiko Otomatis
              </strong>
              <p style={{ margin: 0, color: '#78350F', lineHeight: 1.45 }}>
                Sistem secara otomatis mengelompokkan urgensi tindak lanjut menjadi <strong>Normal</strong>, <strong>Waspada</strong>, <strong>Tinggi</strong>, dan <strong>Kritis</strong>. Jika terdeteksi butir darurat (seperti dorongan menyakiti diri atau keparahan ekstrem), status Kritis langsung ditandai agar Guru BK dapat segera memberikan pendampingan suportif.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: PERAN & HAK AKSES */}
        {activeTab === 'roles' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Pembagian Hak Akses Pengguna
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="badge badge-normal">Siswa / Konseli</span>
                  <strong style={{ fontSize: '0.88rem' }}>Pengisian Mandiri & Akses Pribadi</strong>
                </div>
                <ul style={{ margin: '0.3rem 0 0 1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <li>Masuk menggunakan token 6 karakter yang diberikan oleh Guru BK.</li>
                  <li>Mengisi asesmen secara privat dengan bahasa yang aman dan ramah.</li>
                  <li>Melihat ringkasan penguatan diri (tanpa label patologis/menakutkan).</li>
                  <li>Mendapatkan akses nomor darurat krisis dan jadwal konseling lanjutan.</li>
                </ul>
              </div>

              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="badge badge-mild">Guru BK / Konselor</span>
                  <strong style={{ fontSize: '0.88rem' }}>Pemantauan, Triase & Intervensi</strong>
                </div>
                <ul style={{ margin: '0.3rem 0 0 1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <li>Melihat daftar siswa, skor numerik DASS-42, dan indikator triase risiko.</li>
                  <li>Mengakses <strong>Analisis Kelompok (Cluster Masalah)</strong> untuk merancang konseling kelompok.</li>
                  <li>Mencatat rekam intervensi (Konseling Individu, Kelompok, Home Visit, Alih Tangan Kasus).</li>
                  <li>Menerbitkan dan mengelola token asesmen siswa per kelas/kelompok.</li>
                </ul>
              </div>

              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="badge badge-critical" style={{ background: '#EEF2FF', color: '#4338CA', borderColor: '#C7D2FE' }}>
                    Administrator
                  </span>
                  <strong style={{ fontSize: '0.88rem' }}>Manajemen Sistem & Bank Soal</strong>
                </div>
                <ul style={{ margin: '0.3rem 0 0 1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <li>Akses penuh pengelolaan bank 126 soal DASS & DCM.</li>
                  <li>Menautkan media pendukung Google Drive (gambar/video interaktif) pada butir soal.</li>
                  <li>Menyesuaikan nomor kontak krisis hotline sekolah dan nasional.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PRIVASI & BANTUAN DARURAT */}
        {activeTab === 'privacy' && (
          <div>
            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', marginBottom: '0.3rem' }}>
                <Lock size={16} />
                <strong style={{ fontSize: '0.88rem' }}>Jaminan Kerahasiaan Data (UU PDP)</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#14532D', lineHeight: 1.5 }}>
                Aplikasi GALAU menjunjung tinggi etika kerahasiaan bimbingan dan konseling serta asas perlindungan data pribadi anak/remaja. Data hasil asesmen hanya diperuntukkan bagi Guru BK pembimbing dan tidak dipublikasikan ke pihak luar tanpa persetujuan.
              </p>
            </div>

            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#991B1B', marginBottom: '0.3rem' }}>
                <AlertTriangle size={16} />
                <strong style={{ fontSize: '0.88rem' }}>Pernyataan Medis (Disclaimer)</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#7F1D1D', lineHeight: 1.5 }}>
                Instrumen ini merupakan alat skrining kebutuhan bimbingan psikologis dan deteksi dini kesejahteraan mental, <strong>bukan vonis medis atau diagnosis psikiatris</strong>. Diagnosis klinis resmi hanya dapat ditegakkan oleh Psikolog Klinis atau Dokter Spesialis Kedokteran Jiwa (Psikiater).
              </p>
            </div>

            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PhoneCall size={16} color="var(--primary)" />
              Layanan Hotline & Bantuan Krisis Terverifikasi
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
              {DEFAULT_CRISIS_CONTACTS.map((c, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '0.75rem'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.15rem' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem', fontFamily: 'monospace' }}>
                    {c.number}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {c.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end'
        }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}

