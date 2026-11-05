import React, { useState, useEffect } from 'react';
import {
  Brain, Printer, ShieldCheck, Heart, User, FileSpreadsheet,
  CheckCircle, Sparkles, Compass, ArrowRight, PlusCircle, FileText, HeartHandshake,
  Copy, Check
} from 'lucide-react';
import { recordIntervention, getCrisisContacts } from '../services/storageService';

export function ReportView({ reportData, userRole, onBackToDashboard, onRetake, onProceedToConsult }) {
  const [activeTab, setActiveTab] = useState(userRole === 'counselor' || userRole === 'admin' ? 'official' : 'student');
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [crisisContacts, setCrisisContacts] = useState([]);
  const [newInterventionText, setNewInterventionText] = useState('');
  const [newInterventionType, setNewInterventionType] = useState('Konseling Individu');
  const [interventionsList, setInterventionsList] = useState(reportData.interventions || []);
  const [copiedId, setCopiedId] = useState(false);
  const [showIdentityDetails, setShowIdentityDetails] = useState(false);

  const { studentInfo, scores } = reportData;
  const { dass, triage, domainAnalysis, recommendations } = scores;

  useEffect(() => {
    setCrisisContacts(getCrisisContacts());
  }, []);

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    const rows = [
      ['DOKUMEN HASIL ASESMEN - GALAU'],
      ['Tanggal', new Date(reportData.completedAt || Date.now()).toLocaleDateString('id-ID')],
      ['ID LAPORAN', reportData.id], ['Token', reportData.token], [''],
      ['BIODATA KONSELI'], ['Nama', studentInfo.fullName],
      ['Lahir', studentInfo.birthDate || '-'], ['Usia', `${studentInfo.age || '-'} Th`],
      ['Pekerjaan', studentInfo.occupation || '-'], ['Kelamin', studentInfo.gender], [''],
      ['DASS-42'], ['Subskala', 'Skor', 'Maks', 'Kategori'],
      ['Depresi', dass.depresi.score, dass.depresi.max, dass.depresi.severity.label],
      ['Kecemasan', dass.kecemasan.score, dass.kecemasan.max, dass.kecemasan.severity.label],
      ['Stres', dass.stres.score, dass.stres.max, dass.stres.severity.label], [''],
      ['TRIASE'], ['Level', triage.level], ['Label', triage.label],
      ['Alasan', triage.reasons.join('; ')], [''],
      ['DOMAIN DCM'], ['Domain', '%', 'Item'],
      ...domainAnalysis.map(d => [d.domainId, `${d.percentage}%`, `${d.problemCount}`])
    ];
    const csv = 'data:text/csv;charset=utf-8,' + rows.map(r => r.map(i => `"${i}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `Laporan_${reportData.id}_${reportData.token}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddIntervention = async (e) => {
    e.preventDefault();
    if (!newInterventionText.trim()) return;
    const newAction = await recordIntervention(reportData.id, {
      type: newInterventionType, notes: newInterventionText,
      counselorName: userRole === 'admin' ? 'Koordinator BK' : 'Guru BK', status: 'Terjadwal'
    });
    setInterventionsList([newAction, ...interventionsList]);
    setNewInterventionText('');
  };

  const domainTitles = {
    akademik: 'Akademik & Belajar', sosial: 'Sosial & Interpersonal',
    keluarga: 'Dinamika Keluarga', fisik: 'Fisik & Perkembangan',
    karier: 'Karier & Kemandirian', spiritual: 'Spiritual & Moral'
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      {/* Print header */}
      <div className="print-header" style={{ display: 'none' }}>
        <h2 style={{ fontSize: '16pt', fontWeight: 800 }}>BIMBINGAN, KONSELING & KESEHATAN MENTAL</h2>
        <h3 style={{ fontSize: '13pt', fontFamily: 'monospace' }}>ID LAPORAN: {reportData.id} • TOKEN: {reportData.token}</h3>
        <p style={{ fontSize: '9pt', color: '#555' }}>Rekapitulasi DASS-42 & DCM — Dokumen Rahasia Layanan BK</p>
      </div>

      {/* Tab bar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg)', padding: '0.25rem', borderRadius: 'var(--radius-md)', flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${activeTab === 'student' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('student')}>
            <Heart size={14} /> Rangkuman
          </button>
          <button className={`btn btn-sm ${activeTab === 'official' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('official')}>
            <Brain size={14} /> Laporan Analitis
          </button>
          {onProceedToConsult && (
            <button
              className="btn btn-sm"
              onClick={onProceedToConsult}
              style={{
                background: reportData.consultationStatus === 'completed' ? '#DCFCE7' : '#EFF6FF',
                color: reportData.consultationStatus === 'completed' ? '#15803D' : '#1D4ED8',
                borderColor: reportData.consultationStatus === 'completed' ? '#86EFAC' : '#BFDBFE',
                fontWeight: 700
              }}
            >
              <HeartHandshake size={14} />
              <span>{reportData.consultationStatus === 'completed' ? '✅ Bukti Konsultasi Selesai' : '💬 Konsultasi (Consult Done)'}</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}><Printer size={14} /> Cetak</button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}><FileSpreadsheet size={14} /> CSV</button>
          {onBackToDashboard && <button className="btn btn-outline btn-sm" onClick={onBackToDashboard}>Kembali</button>}
        </div>
      </div>

      {/* STUDENT VIEW */}
      {activeTab === 'student' && (
        <div>
          <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
            <div style={{
              width: '48px', height: '48px', background: 'var(--primary-light)', color: 'var(--primary)',
              borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem'
            }}>
              <Sparkles size={24} />
            </div>

            {/* Prominent ID Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontFamily: 'monospace',
              fontWeight: 800,
              color: 'var(--primary)',
              marginBottom: '0.75rem'
            }}>
              <span>ID LAPORAN: {reportData.id}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(reportData.id);
                  setCopiedId(true);
                  setTimeout(() => setCopiedId(false), 2000);
                }}
                title="Salin ID Laporan untuk pencarian database"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: copiedId ? '#16A34A' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
              >
                {copiedId ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
              </button>
            </div>

            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.35rem', fontWeight: 800 }}>
              Hasil Asesmen #{reportData.id}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '520px', margin: '0 auto 1.25rem' }}>
              ID Dokumen: <strong style={{ fontFamily: 'monospace' }}>{reportData.id}</strong> (Gunakan kode ID ini saat berkonsultasi agar pencarian data di sistem lebih cepat dan terjaga kerahasiaannya).
            </p>

            {/* Reflection */}
            <div style={{
              background: 'var(--status-normal-bg)', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)',
              padding: '1.15rem', textAlign: 'left', marginBottom: '1.25rem'
            }}>
              <h3 style={{ fontSize: '0.95rem', color: '#166534', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={17} color="#16A34A" /> Refleksi Kesejahteraan Emosional
              </h3>
              <p style={{ color: '#15803D', fontSize: '0.82rem', lineHeight: 1.5 }}>
                Merasa lelah, cemas, atau bingung adalah hal wajar. Ingatlah bahwa kamu tidak sendirian dalam menghadapi tantangan ini.
              </p>
            </div>

            {/* Crisis contacts */}
            {(triage.level === 'KRITIS' || triage.level === 'TINGGI') && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
                padding: '1.25rem', textAlign: 'left', marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#991B1B' }}>
                  <Heart size={20} color="#DC2626" />
                  <strong style={{ fontSize: '1rem' }}>Kamu Tidak Sendirian</strong>
                </div>
                <p style={{ color: '#7F1D1D', fontSize: '0.82rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                  Jika kamu membutuhkan teman bicara yang aman, hubungi layanan di bawah:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.5rem' }}>
                  {crisisContacts.map((c, i) => (
                    <div key={i} style={{ background: 'white', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#991B1B' }}>{c.name}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#DC2626', margin: '0.1rem 0' }}>{c.number}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Self-care tips */}
            <div style={{ textAlign: 'left', marginTop: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.65rem' }}>Langkah Merawat Pikiran:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.5rem' }}>
                {[
                  ['Istirahat Sejenak', 'Tarik napas dan lepaskan gawai 15 menit.'],
                  ['Ceritakan', 'Ruang BK terbuka untuk mendengar tanpa menghakimi.'],
                  ['Minta Bantuan', 'Meminta pertolongan adalah tanda keberanian.']
                ].map(([title, desc], i) => (
                  <div key={i} style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <strong style={{ fontSize: '0.82rem' }}>{i + 1}. {title}</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Step CTA: Get Consult Done */}
            {onProceedToConsult && (
              <div style={{
                background: reportData.consultationStatus === 'completed' ? '#F0FDF4' : '#EEF2FF',
                border: `1px solid ${reportData.consultationStatus === 'completed' ? '#86EFAC' : '#C7D2FE'}`,
                borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center', marginTop: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: reportData.consultationStatus === 'completed' ? '#166534' : 'var(--primary)', marginBottom: '0.35rem' }}>
                  <HeartHandshake size={20} />
                  <strong style={{ fontSize: '1rem' }}>Langkah Terakhir: Sesi Konsultasi & Tindak Lanjut</strong>
                </div>
                <p style={{ fontSize: '0.82rem', color: reportData.consultationStatus === 'completed' ? '#15803D' : 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 1rem' }}>
                  {reportData.consultationStatus === 'completed'
                    ? 'Sesi konsultasi Anda telah selesai tercatat dan diverifikasi. Anda dapat melihat lembar bukti resmi atau mencetaknya.'
                    : 'Dapatkan bimbingan solusi praktis bersama konselor atau selesaikan formulir konsultasi untuk memperoleh Lembar Bukti Resmi.'}
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={onProceedToConsult}
                  style={{
                    background: reportData.consultationStatus === 'completed' ? '#16A34A' : 'var(--primary)',
                    borderColor: reportData.consultationStatus === 'completed' ? '#16A34A' : 'var(--primary)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <HeartHandshake size={18} />
                  <span>{reportData.consultationStatus === 'completed' ? 'Lihat Bukti Konsultasi Selesai (Consult Done)' : 'Lanjutkan ke Sesi Konsultasi (Get Consult Done)'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OFFICIAL / COUNSELOR VIEW */}
      {activeTab === 'official' && (
        <div>
          {/* Profile & Triage */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.85rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="badge badge-primary" style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}>
                    ID DOKUMEN BASIS DATA
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(reportData.id);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.15rem 0.45rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    title="Salin ID Laporan ke Clipboard"
                  >
                    {copiedId ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                    <span>{copiedId ? 'Tersalin' : 'Salin ID'}</span>
                  </button>
                </div>

                {/* ID Laporan Utama Pengganti Nama, Lahir & Pekerjaan */}
                <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'monospace', margin: '0 0 0.35rem 0', letterSpacing: '0.5px' }}>
                  {reportData.id}
                </h2>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <span>Token: <strong style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{reportData.token}</strong></span>
                  <span>•</span>
                  <span>Waktu: {new Date(reportData.completedAt || Date.now()).toLocaleString('id-ID')}</span>
                </div>

                {/* Biodata Terkait (Dapat dibuka jika konselor butuh rujukan nama) */}
                <div style={{ marginTop: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowIdentityDetails(!showIdentityDetails)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                  >
                    {showIdentityDetails ? '▲ Sembunyikan Biodata Asli' : '▼ Lihat Biodata Asli (Nama, Lahir, Pekerjaan)'}
                  </button>

                  {showIdentityDetails && (
                    <div style={{
                      marginTop: '0.4rem',
                      padding: '0.6rem 0.85rem',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem',
                      color: 'var(--text)'
                    }}>
                      <div style={{ marginBottom: '0.2rem' }}><strong>Nama Konseli:</strong> {studentInfo.fullName || '-'}</div>
                      <div style={{ marginBottom: '0.2rem' }}><strong>Lahir / Usia:</strong> {studentInfo.birthDate || '-'} ({studentInfo.age || '-'} Tahun) | <strong>Kelamin:</strong> {studentInfo.gender || '-'}</div>
                      <div><strong>Pekerjaan / Instansi:</strong> {studentInfo.occupation || '-'}</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                textAlign: 'right', background: triage.level === 'KRITIS' ? '#FEF2F2' : triage.level === 'TINGGI' ? '#FFF7ED' : '#F0FDF4',
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${triage.color}`
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>TRIASE</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: triage.color }}>{triage.level}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{triage.label}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', border: '1px solid var(--border)' }}>
              <strong style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Dasar Triase:</strong>
              <ul style={{ margin: '0.25rem 0 0 1.15rem', fontSize: '0.8rem', color: 'var(--text)' }}>
                {triage.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>

          {/* DASS-42 Scores */}
          <h3 style={{ fontSize: '1.05rem', margin: '1.25rem 0 0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Brain size={17} color="var(--primary)" /> Skor DASS-42
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'Depresi', data: dass.depresi, max: 42, cutoff: 'Normal 0-9, Ringan 10-13, Sedang 14-20, Parah 21-27, Sangat Parah 28+' },
              { label: 'Kecemasan', data: dass.kecemasan, max: 42, cutoff: 'Normal 0-7, Ringan 8-9, Sedang 10-14, Parah 15-19, Sangat Parah 20+' },
              { label: 'Stres', data: dass.stres, max: 42, cutoff: 'Normal 0-14, Ringan 15-18, Sedang 19-25, Parah 26-33, Sangat Parah 34+' }
            ].map(({ label, data, max, cutoff }) => (
              <div className="score-card" key={label}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.92rem' }}>{label}</strong>
                    <span className={`badge ${data.severity.badgeClass}`}>{data.severity.label}</span>
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: data.severity.color, margin: '0.35rem 0' }}>
                    {data.score} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {max}</span>
                  </div>
                  <div className="meter-bar">
                    <div className="meter-fill" style={{ width: `${Math.min(100, (data.score / max) * 100)}%`, background: data.severity.color }} />
                  </div>
                </div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{cutoff}</p>
              </div>
            ))}
          </div>

          {/* Domain Analysis */}
          <div className="glass-card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Compass size={17} color="var(--accent)" /> Domain DCM
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
              {domainAnalysis.map((item, idx) => (
                <div key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem' }}>{domainTitles[item.domainId] || item.domainId}</strong>
                    <span style={{ fontWeight: 700, color: item.percentage > 50 ? '#EA580C' : 'var(--accent)' }}>{item.percentage}%</span>
                  </div>
                  <div className="meter-bar" style={{ height: '6px', margin: '0.35rem 0' }}>
                    <div className="meter-fill" style={{
                      width: `${item.percentage}%`,
                      background: item.percentage > 60 ? '#EF4444' : item.percentage > 35 ? '#F59E0B' : '#10B981'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Masalah: {item.problemCount}</span>
                    <span>Total: {item.totalScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations & Interventions */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={17} color="var(--primary)" /> Rekomendasi Intervensi
              </h3>
              {triage.level === 'KRITIS' && (
                <button className="btn btn-danger btn-sm no-print" onClick={() => setShowReferralModal(true)}>
                  <FileText size={13} /> Surat Rujukan
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {recommendations.map((rec, idx) => (
                <div key={idx} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <strong style={{ fontSize: '0.88rem' }}>{rec.action}</strong>
                    <span className="badge badge-mild" style={{ fontSize: '0.65rem' }}>{rec.priority}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{rec.description}</p>
                </div>
              ))}
            </div>

            {/* Intervention log */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Log Tindak Lanjut ({interventionsList.length})
              </h4>

              <form onSubmit={handleAddIntervention} className="no-print" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <select className="form-select" style={{ width: 'auto', minWidth: '160px' }} value={newInterventionType} onChange={(e) => setNewInterventionType(e.target.value)}>
                  <option value="Konseling Individu">Konseling Individu</option>
                  <option value="Konseling Kelompok">Konseling Kelompok</option>
                  <option value="Home Visit">Home Visit</option>
                  <option value="Alih Tangan Kasus (Referral)">Referral</option>
                </select>
                <input type="text" className="form-input" style={{ flex: 1, minWidth: '200px' }}
                  placeholder="Ringkasan tindak lanjut..." value={newInterventionText} onChange={(e) => setNewInterventionText(e.target.value)} />
                <button type="submit" className="btn btn-primary btn-sm">
                  <PlusCircle size={14} /> Simpan
                </button>
              </form>

              {interventionsList.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum ada catatan konseling.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {interventionsList.map((item, idx) => (
                    <div key={idx} style={{
                      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                      padding: '0.6rem 0.85rem', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <strong>[{item.date}] {item.type}:</strong> {item.notes}
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Oleh: {item.counselorName || 'Guru BK'}</div>
                      </div>
                      <span className="badge badge-normal" style={{ fontSize: '0.65rem' }}>{item.status || 'Aktif'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Referral Modal */}
      {showReferralModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Surat Rujukan</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Merujuk ke psikolog klinis atau psikiater.
            </p>

            <div style={{
              background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              padding: '1rem', fontSize: '0.82rem', fontFamily: 'serif', lineHeight: 1.5, marginBottom: '1rem'
            }}>
              <p><strong>Hal:</strong> Alih Tangan Kasus</p>
              <p><strong>Kepada Yth.:</strong> Psikiater / Psikolog Klinis Mitra</p>
              <p style={{ marginTop: '0.5rem' }}>Konseli yang kami rujuk:</p>
              <ul style={{ margin: '0.35rem 0 0.35rem 1.25rem' }}>
                <li>Nama: {studentInfo.fullName}</li>
                <li>Lahir / Usia: {studentInfo.birthDate || '-'} ({studentInfo.age || '-'} Th)</li>
                <li>Pekerjaan: {studentInfo.occupation || '-'}</li>
                <li>Skrining: Triase {triage.level} (D:{dass.depresi.score}, A:{dass.kecemasan.score}, S:{dass.stres.score})</li>
              </ul>
              <p>Membutuhkan penanganan profesional lanjutan.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowReferralModal(false)}>Tutup</button>
              <button className="btn btn-primary" onClick={() => { window.print(); setShowReferralModal(false); }}>
                <Printer size={14} /> Cetak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
