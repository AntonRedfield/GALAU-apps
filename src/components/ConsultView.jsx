import React, { useState } from 'react';
import {
  HeartHandshake, CheckCircle2, Clock, Phone, MessageSquare,
  FileText, Printer, ArrowLeft, ShieldCheck, Sparkles, AlertCircle,
  Copy, Check, User, Calendar, Briefcase, Award, ExternalLink
} from 'lucide-react';
import { updateConsultationStatus } from '../services/storageService';

export function ConsultView({
  reportData,
  userRole,
  onBackToReport,
  onConsultationCompleted,
  onResetSession
}) {
  const { studentInfo, scores } = reportData;
  const { dass, triage, domainAnalysis, recommendations } = scores;

  const isAlreadyCompleted = reportData.consultationStatus === 'completed' || Boolean(reportData.consultation);

  const [isCompleted, setIsCompleted] = useState(isAlreadyCompleted);
  const [consultData, setConsultData] = useState(() => {
    if (reportData.consultation) return reportData.consultation;
    return {
      counselorName: userRole === 'admin' ? 'Koordinator BK & Konselor' : 'Guru BK Pembimbing / Konselor',
      consultationType: 'Tatap Muka di Ruang BK',
      topic: triage.level === 'KRITIS' ? 'Intervensi Krisis & Regulasi Emosi' :
             dass.kecemasan.score >= 14 ? 'Manajemen Kecemasan & Relaksasi' :
             dass.depresi.score >= 14 ? 'Pemulihan Suasana Hati & Motivasi' :
             'Bimbingan Pribadi & Penyesuaian Diri',
      notes: reportData.studentInfo?.initialNotes
        ? `Telah didiskusikan keluhan awal: "${reportData.studentInfo.initialNotes}". Klien memahami dinamika stres yang dialami.`
        : 'Sesi konsultasi telah membahas hasil skrining DASS-42 dan pemetaan masalah DCM. Klien menunjukkan pemahaman positif.',
      actionPlan: 'Mempraktikkan teknik regulasi emosi harian (latihan pernapasan), menjaga jadwal istirahat seimbang, dan melakukan konsultasi tindak lanjut bila diperlukan.'
    };
  });

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // WhatsApp formatted link
  const generateWaLink = () => {
    const phone = '6281234567890'; // nomor standar BK / Konselor
    const text = encodeURIComponent(
      `Halo Bapak/Ibu Konselor/Guru BK,\n\n` +
      `Saya ingin berkonsultasi mengenai hasil skrining psikologis GALAU saya:\n` +
      `- *ID Laporan:* ${reportData.id}\n` +
      `- *Token Akses:* ${reportData.token}\n` +
      `- *Nama:* ${studentInfo.fullName || '-'}\n\n` +
      `Hasil Skrining Saya:\n` +
      `- Triase: *${triage.level}* (${triage.label})\n` +
      `- Depresi: ${dass.depresi.score} (${dass.depresi.severity.label})\n` +
      `- Kecemasan: ${dass.kecemasan.score} (${dass.kecemasan.severity.label})\n` +
      `- Stres: ${dass.stres.score} (${dass.stres.severity.label})\n\n` +
      `Mohon arahan tindak lanjut. Terima kasih.`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  const handleFinishConsultation = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...consultData,
        completedAt: new Date().toISOString(),
        verified: true
      };
      const updated = await updateConsultationStatus(reportData.id, payload);
      setIsCompleted(true);
      if (onConsultationCompleted && updated) {
        onConsultationCompleted(updated);
      }
    } catch (err) {
      console.error('Gagal memperbarui status konsultasi:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopySummary = () => {
    const summaryText =
      `LEMBAR BUKTI SELESAI KONSULTASI (GALAU)\n` +
      `ID Laporan: ${reportData.id}\n` +
      `Token: ${reportData.token}\n` +
      `Nama: ${studentInfo.fullName}\n` +
      `Tanggal: ${new Date(consultData.completedAt || Date.now()).toLocaleDateString('id-ID')}\n` +
      `Status: SELESAI KONSULTASI (CONSULT DONE)\n` +
      `Konselor: ${consultData.counselorName}\n` +
      `Topik: ${consultData.topic}\n` +
      `Hasil Triase: ${triage.level}\n` +
      `Rencana Aksi: ${consultData.actionPlan}`;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const highestDomains = [...(domainAnalysis || [])].sort((a, b) => b.percentage - a.percentage).slice(0, 3);
  const domainTitles = {
    akademik: 'Akademik & Belajar', sosial: 'Sosial & Hubungan',
    keluarga: 'Dinamika Keluarga', fisik: 'Kondisi Fisik & Vitalitas',
    karier: 'Karier & Masa Depan', spiritual: 'Spiritual & Nilai Diri'
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Navigation Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBackToReport}>
          <ArrowLeft size={15} />
          <span>Kembali ke Hasil Asesmen</span>
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isCompleted && (
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <Printer size={15} />
              <span>Cetak Bukti Konsultasi</span>
            </button>
          )}
          {onResetSession && (
            <button className="btn btn-secondary btn-sm" onClick={onResetSession}>
              <span>Selesai / Sesi Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Status Banner */}
      <div className="glass-card" style={{
        background: isCompleted ? '#F0FDF4' : 'var(--surface)',
        borderColor: isCompleted ? '#86EFAC' : 'var(--border)',
        marginBottom: '1.25rem',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: isCompleted ? '#DCFCE7' : 'var(--primary-light)',
              color: isCompleted ? '#16A34A' : 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {isCompleted ? <CheckCircle2 size={28} /> : <HeartHandshake size={28} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span className={`badge ${isCompleted ? 'badge-normal' : 'badge-moderate'}`}>
                  {isCompleted ? '✅ KONSULTASI SELESAI (CONSULT DONE)' : '🟡 SIAP DIKONSULTASIKAN'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Langkah 5 dari 5</span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                {isCompleted ? 'Sesi Konsultasi Telah Selesai' : 'Sesi Konsultasi & Tindak Lanjut'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {isCompleted
                  ? `Sesi konsultasi resmi telah tervalidasi pada ${new Date(consultData.completedAt || Date.now()).toLocaleDateString('id-ID')}. Bukti konsultasi siap diunduh/dicetak.`
                  : 'Diskusikan hasil skrining bersama konselor atau selesaikan formulir catatan konsultasi terpandu di bawah ini.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Diagnostic Brief */}
      <div className="glass-card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={16} color="var(--primary)" />
          <span>Ringkasan Profil Hasil Asesmen</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
          <div style={{ background: 'var(--bg)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>KONSELI</span>
            <strong style={{ fontSize: '0.95rem' }}>{studentInfo.fullName}</strong>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              {studentInfo.occupation || 'Umum'} • {studentInfo.age ? `${studentInfo.age} Th` : '-'}
            </div>
          </div>

          <div style={{
            background: triage.level === 'KRITIS' ? '#FEF2F2' : triage.level === 'TINGGI' ? '#FFF7ED' : 'var(--bg)',
            padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${triage.color || 'var(--border)'}`
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>STATUS TRIASE</span>
            <strong style={{ fontSize: '1rem', color: triage.color || 'var(--text)' }}>{triage.level}</strong>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              {triage.label}
            </div>
          </div>

          <div style={{ background: 'var(--bg)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>SUB-SKALA DASS-42</span>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
              <span className={`badge ${dass.depresi.severity.badgeClass}`} style={{ fontSize: '0.7rem' }}>D: {dass.depresi.score}</span>
              <span className={`badge ${dass.kecemasan.severity.badgeClass}`} style={{ fontSize: '0.7rem' }}>A: {dass.kecemasan.score}</span>
              <span className={`badge ${dass.stres.severity.badgeClass}`} style={{ fontSize: '0.7rem' }}>S: {dass.stres.score}</span>
            </div>
          </div>
        </div>

        {highestDomains.length > 0 && (
          <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Fokus Masalah DCM Utama:</span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
              {highestDomains.map((dom, idx) => (
                <span key={idx} className="badge badge-mild" style={{ fontSize: '0.72rem', textTransform: 'none' }}>
                  {domainTitles[dom.domainId] || dom.domainId} ({dom.percentage}%)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action / Completion Pathways */}
      {!isCompleted ? (
        <div>
          {/* Quick Contact Option */}
          <div className="glass-card" style={{ marginBottom: '1.25rem', background: '#F0FDFA', borderColor: '#99F6E4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F766E', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <MessageSquare size={17} /> Opsi Cepat: Konsultasi via WhatsApp
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#115E59' }}>
                  Hubungi konselor pembimbing langsung dengan pesan terformat berisi rangkuman skrining Anda.
                </p>
              </div>

              <a
                href={generateWaLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{ background: '#0D9488', borderColor: '#0D9488' }}
              >
                <Phone size={15} />
                <span>Buka WhatsApp Konselor</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Consultation Notes & Done Form */}
          <div className="glass-card">
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <HeartHandshake size={18} color="var(--primary)" />
                <span>Formulir Selesai Konsultasi (Get Consult Done)</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Catat ringkasan pembahasan bimbingan dan tandai konsultasi selesai untuk mendapatkan lembar bukti resmi.
              </p>
            </div>

            <form onSubmit={handleFinishConsultation}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nama Konselor / Guru BK</label>
                  <input
                    type="text"
                    className="form-input"
                    value={consultData.counselorName}
                    onChange={(e) => setConsultData({ ...consultData, counselorName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Media / Metode Konseling</label>
                  <select
                    className="form-select"
                    value={consultData.consultationType}
                    onChange={(e) => setConsultData({ ...consultData, consultationType: e.target.value })}
                  >
                    <option value="Tatap Muka di Ruang BK">Tatap Muka di Ruang BK</option>
                    <option value="Sesi Virtual (Zoom / G-Meet)">Sesi Virtual (Zoom / G-Meet)</option>
                    <option value="WhatsApp / Telepon">WhatsApp / Telepon</option>
                    <option value="Konsultasi Mandiri Terpandu">Konsultasi Mandiri Terpandu</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Topik Utama Konsultasi</label>
                <input
                  type="text"
                  className="form-input"
                  value={consultData.topic}
                  onChange={(e) => setConsultData({ ...consultData, topic: e.target.value })}
                  placeholder="Contoh: Manajemen Beban Kerja & Regulasi Cemas"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Catatan Hasil Konsultasi & Pemahaman Konseli</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  value={consultData.notes}
                  onChange={(e) => setConsultData({ ...consultData, notes: e.target.value })}
                  placeholder="Ringkasan poin-poin yang didiskusikan dan solusi yang disepakati..."
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Rencana Tindak Lanjut (Action Plan Konseli)</label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  value={consultData.actionPlan}
                  onChange={(e) => setConsultData({ ...consultData, actionPlan: e.target.value })}
                  placeholder="Langkah konkret yang akan dilakukan konseli sehari-hari..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary btn-lg"
                  style={{ minWidth: '220px', background: '#16A34A', borderColor: '#16A34A' }}
                >
                  <CheckCircle2 size={18} />
                  <span>{saving ? 'Menyimpan...' : 'Selesaikan Konsultasi (Get Consult Done)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* CONSULT DONE CERTIFICATE / MEMO VIEW */
        <div>
          <div className="glass-card" style={{
            border: '2px solid #86EFAC',
            background: 'linear-gradient(to bottom, #FFFFFF, #F0FDF4)',
            padding: '2rem 1.75rem',
            marginBottom: '1.25rem',
            position: 'relative'
          }}>
            {/* Top decorative seal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #BBF7D0', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <span className="badge badge-normal" style={{ marginBottom: '0.4rem', background: '#DCFCE7', color: '#15803D' }}>
                  <Award size={13} /> DOKUMEN RESMI LAYANAN KONSELING
                </span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#14532D' }}>
                  LEMBAR BUKTI SELESAI KONSULTASI
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#166534' }}>
                  Layanan Bimbingan, Konseling & Kesejahteraan Psikologis GALAU
                </p>
              </div>

              <div style={{
                textAlign: 'right', border: '2px dashed #16A34A', padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)', background: '#F0FDF4', color: '#166534'
              }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em' }}>STATUS VERIFIKASI</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800 }}>CONSULT DONE ✅</div>
                <div style={{ fontSize: '0.68rem', fontFamily: 'monospace' }}>ID: {reportData.id}</div>
              </div>
            </div>

            {/* Konseli & Konsultasi Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'white', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>ID DOKUMEN BASIS DATA</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, marginTop: '0.2rem', fontFamily: 'monospace', color: 'var(--primary)' }}>
                  {reportData.id}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Token Akses: <strong style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{reportData.token}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Konseli: {studentInfo.fullName || '-'} ({studentInfo.occupation || 'Umum'})
                </div>
              </div>

              <div style={{ background: 'white', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>DATA PELAKSANAAN</span>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: '0.2rem' }}>
                  Konselor: {consultData.counselorName}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Media: {consultData.consultationType}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Tanggal: {new Date(consultData.completedAt || Date.now()).toLocaleDateString('id-ID', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700, marginTop: '0.2rem' }}>
                  Triase: {triage.level} ({triage.label})
                </div>
              </div>
            </div>

            {/* Subject and Action Plan */}
            <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
              <div style={{ marginBottom: '0.65rem' }}>
                <strong style={{ fontSize: '0.82rem', color: '#14532D' }}>Topik Bahasan:</strong>
                <p style={{ fontSize: '0.85rem', marginTop: '0.15rem' }}>{consultData.topic}</p>
              </div>

              <div style={{ marginBottom: '0.65rem' }}>
                <strong style={{ fontSize: '0.82rem', color: '#14532D' }}>Rangkuman & Catatan Konseling:</strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem', lineHeight: 1.5 }}>
                  {consultData.notes}
                </p>
              </div>

              <div>
                <strong style={{ fontSize: '0.82rem', color: '#14532D' }}>Rencana Tindak Lanjut (Action Plan):</strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem', lineHeight: 1.5 }}>
                  {consultData.actionPlan}
                </p>
              </div>
            </div>

            {/* Signature Block for Print */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #BBF7D0', fontSize: '0.8rem', color: '#166534' }}>
              <div style={{ textAlign: 'center', minWidth: '160px' }}>
                <div>Konseli / Klien,</div>
                <div style={{ height: '40px' }}></div>
                <strong>({studentInfo.fullName})</strong>
              </div>

              <div style={{ textAlign: 'center', minWidth: '160px' }}>
                <div>Konselor Pembimbing,</div>
                <div style={{ height: '40px' }}></div>
                <strong>({consultData.counselorName})</strong>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} />
                <span>Cetak Lembar Bukti Konsultasi</span>
              </button>
              <button className="btn btn-secondary" onClick={handleCopySummary}>
                {copied ? <Check size={16} color="#16A34A" /> : <Copy size={16} />}
                <span>{copied ? 'Tersalin!' : 'Salin Ringkasan'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline" onClick={onBackToReport}>
                <span>Lihat Detail Asesmen</span>
              </button>
              {onResetSession && (
                <button className="btn btn-secondary" onClick={onResetSession}>
                  <span>Sesi Baru</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ConsultView;

