import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Brain, KeyRound, FileSpreadsheet, Plus, Search,
  ExternalLink, RefreshCw, Copy, Layers, FileText, Edit2, Trash2,
  Image, Video, AlertCircle, RotateCcw, X, CheckCircle2, HelpCircle
} from 'lucide-react';
import {
  getAllAssessmentReports,
  getAllTokens,
  createNewTokens,
  getAllAssessmentQuestions,
  saveAssessmentQuestion,
  deleteAssessmentQuestion,
  resetAssessmentQuestionsToDefault,
  parseGoogleDriveMedia
} from '../services/storageService';
import { ASSESSMENT_DOMAINS } from '../data/assessmentQuestions';

export function CounselorDashboard({ onSelectReport, onOpenFirebaseModal }) {
  const [reports, setReports] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('triage');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [tokenCount, setTokenCount] = useState(5);
  const [tokenClass, setTokenClass] = useState('X - IPA 1');
  const [generatedTokensMsg, setGeneratedTokensMsg] = useState('');

  // Questions Database CRUD states
  const [questionSearchQuery, setQuestionSearchQuery] = useState('');
  const [questionDomainFilter, setQuestionDomainFilter] = useState('all');
  const [questionSubscaleFilter, setQuestionSubscaleFilter] = useState('all');
  const [questionMediaFilter, setQuestionMediaFilter] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionFeedbackMsg, setQuestionFeedbackMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [r, t, q] = await Promise.all([
      getAllAssessmentReports(),
      getAllTokens(),
      getAllAssessmentQuestions()
    ]);
    setReports(r);
    setTokens(t);
    setQuestions(q);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Filter siswa triase
  const filteredReports = reports.filter(r => {
    const s = r.studentInfo || {};
    const dass = r.scores?.dass || {};
    const triage = r.scores?.triage || {};
    const matchSearch =
      (s.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.occupation || s.className || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (filterSeverity === 'all') return true;
    if (filterSeverity === 'kritis') return triage.level === 'KRITIS';
    if (filterSeverity === 'tinggi') return triage.level === 'TINGGI';
    if (filterSeverity === 'depresi_parah') return dass.depresi?.severity?.key === 'parah' || dass.depresi?.severity?.key === 'sangatParah';
    if (filterSeverity === 'kecemasan_parah') return dass.kecemasan?.severity?.key === 'parah' || dass.kecemasan?.severity?.key === 'sangatParah';
    if (filterSeverity === 'stres_parah') return dass.stres?.severity?.key === 'parah' || dass.stres?.severity?.key === 'sangatParah';
    return true;
  });

  // Filter bank soal
  const filteredQuestions = questions.filter(q => {
    const textMatch = (q.text || '').toLowerCase().includes(questionSearchQuery.toLowerCase()) ||
      String(q.id).includes(questionSearchQuery) ||
      (q.subscaleTitle || '').toLowerCase().includes(questionSearchQuery.toLowerCase());
    if (!textMatch) return false;
    if (questionDomainFilter !== 'all' && q.domainId !== questionDomainFilter) return false;
    if (questionSubscaleFilter !== 'all' && q.subscale !== questionSubscaleFilter) return false;
    if (questionMediaFilter === 'with_media' && !q.mediaUrl) return false;
    if (questionMediaFilter === 'screening' && !q.isScreeningCore) return false;
    if (questionMediaFilter === 'emergency' && !q.isEmergency) return false;
    return true;
  });

  const calculateDcmGroupAnalysis = () => {
    const itemMap = {};
    reports.forEach(r => {
      const name = r.studentInfo?.fullName || 'Pengguna';
      const occ = r.studentInfo?.occupation || 'Umum';
      (r.scores?.domainAnalysis || []).forEach(d => {
        (d.problemItems || []).forEach(item => {
          if (!itemMap[item.id]) itemMap[item.id] = { id: item.id, text: item.text, domainId: d.domainId, students: [] };
          itemMap[item.id].students.push({ name, occupation: occ });
        });
      });
    });
    return Object.values(itemMap).filter(i => i.students.length >= 1).sort((a, b) => b.students.length - a.students.length);
  };

  const groupClusters = calculateDcmGroupAnalysis();

  const handleGenerateTokens = async (e) => {
    e.preventDefault();
    const created = await createNewTokens(Number(tokenCount), tokenClass);
    setGeneratedTokensMsg(`${created.length} token diterbitkan untuk ${tokenClass}`);
    loadData();
    setTimeout(() => setGeneratedTokensMsg(''), 3000);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Disalin: ${text}`);
  };

  // CRUD Soal Actions
  const handleOpenAddQuestion = () => {
    const maxId = questions.reduce((max, q) => Math.max(max, Number(q.id) || 0), 0);
    setEditingQuestion({
      id: maxId + 1,
      text: '',
      domainId: 'akademik',
      subscale: 'depresi',
      subscaleTitle: 'Depresi (Pesimisme Belajar)',
      isScreeningCore: false,
      isEmergency: false,
      mediaUrl: '',
      mediaType: 'image'
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditQuestion = (q) => {
    setEditingQuestion({
      ...q,
      mediaType: q.mediaType || 'image',
      mediaUrl: q.mediaUrl || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!editingQuestion.text.trim()) {
      alert('Teks butir pertanyaan wajib diisi.');
      return;
    }
    const saved = await saveAssessmentQuestion(editingQuestion);
    setQuestionFeedbackMsg(`Soal #${saved.id} berhasil disimpan!`);
    setIsEditModalOpen(false);
    setEditingQuestion(null);
    loadData();
    setTimeout(() => setQuestionFeedbackMsg(''), 3000);
  };

  const handleDeleteQuestion = async (q) => {
    if (window.confirm(`Hapus Soal #${q.id}: "${q.text.substring(0, 45)}..."?`)) {
      await deleteAssessmentQuestion(q.id);
      setQuestionFeedbackMsg(`Soal #${q.id} berhasil dihapus.`);
      loadData();
      setTimeout(() => setQuestionFeedbackMsg(''), 3000);
    }
  };

  const handleResetQuestions = async () => {
    if (window.confirm('Reset seluruh bank soal ke 126 soal standar bawaan (DASS-42 & DCM)? Soal kustom akan dikembalikan.')) {
      await resetAssessmentQuestionsToDefault();
      setQuestionFeedbackMsg('Bank soal berhasil dipulihkan ke 126 soal standar bawaan.');
      loadData();
      setTimeout(() => setQuestionFeedbackMsg(''), 3000);
    }
  };

  // Live preview media Google Drive pada modal edit
  const modalMediaPreview = editingQuestion?.mediaUrl
    ? parseGoogleDriveMedia(editingQuestion.mediaUrl, editingQuestion.mediaType)
    : null;

  return (
    <div>
      {/* Header */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span className="badge badge-mild" style={{ marginBottom: '0.2rem' }}>Portal Konselor</span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Pemantauan, Triase & Bank Soal</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Monitoring DASS-42, DCM, pengelolaan token & database instrumen.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            <RefreshCw size={14} /> Segarkan
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${activeTab === 'triage' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('triage')}>
            <ShieldAlert size={14} /> Siswa ({reports.length})
          </button>
          <button className={`btn btn-sm ${activeTab === 'group_analysis' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('group_analysis')}>
            <Layers size={14} /> Kelompok ({groupClusters.length})
          </button>
          <button className={`btn btn-sm ${activeTab === 'tokens' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('tokens')}>
            <KeyRound size={14} /> Token ({tokens.length})
          </button>
          <button className={`btn btn-sm ${activeTab === 'questions' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('questions')}>
            <FileText size={14} /> Bank Soal ({questions.length})
          </button>
        </div>
      </div>

      {/* TRIAGE TAB */}
      {activeTab === 'triage' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'Semua' },
                { key: 'kritis', label: `Kritis (${reports.filter(r => r.scores?.triage?.level === 'KRITIS').length})`, danger: true },
                { key: 'depresi_parah', label: 'Depresi↑' },
                { key: 'kecemasan_parah', label: 'Cemas↑' },
                { key: 'stres_parah', label: 'Stres↑' }
              ].map(f => (
                <button key={f.key}
                  className={`btn btn-sm ${filterSeverity === f.key ? (f.danger ? 'btn-danger' : 'btn-primary') : 'btn-secondary'}`}
                  onClick={() => setFilterSeverity(f.key)}>
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '220px' }}>
              <input type="text" placeholder="Cari nama..." className="form-input"
                style={{ paddingLeft: '2rem', fontSize: '0.8rem' }} value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} />
              <Search size={14} style={{ position: 'absolute', left: '8px', top: '11px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Pekerjaan</th>
                  <th>Depresi</th>
                  <th>Kecemasan</th>
                  <th>Stres</th>
                  <th>Triase</th>
                  <th>Konsultasi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>Tidak ada data yang cocok.</td></tr>
                ) : filteredReports.map((r, i) => {
                  const s = r.studentInfo || {};
                  const dass = r.scores?.dass || {};
                  const triage = r.scores?.triage || {};
                  const isConsultDone = r.consultationStatus === 'completed' || Boolean(r.consultation);
                  return (
                    <tr key={i}>
                      <td>
                        <strong>{s.fullName || '-'}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.age ? `${s.age} Th` : ''}</div>
                      </td>
                      <td>{s.occupation || 'Umum'}</td>
                      <td><span className={`badge ${dass.depresi?.severity?.badgeClass || 'badge-normal'}`}>{dass.depresi?.score ?? '-'}</span></td>
                      <td><span className={`badge ${dass.kecemasan?.severity?.badgeClass || 'badge-normal'}`}>{dass.kecemasan?.score ?? '-'}</span></td>
                      <td><span className={`badge ${dass.stres?.severity?.badgeClass || 'badge-normal'}`}>{dass.stres?.score ?? '-'}</span></td>
                      <td>
                        <span className="badge" style={{
                          background: triage.color ? `${triage.color}15` : 'var(--bg)',
                          color: triage.color || 'var(--text)', borderColor: triage.color || 'var(--border)'
                        }}>
                          {triage.level || 'NORMAL'}
                        </span>
                      </td>
                      <td>
                        {isConsultDone ? (
                          <span className="badge badge-normal" style={{ fontSize: '0.68rem', background: '#DCFCE7', color: '#15803D' }}>
                            ✅ Selesai
                          </span>
                        ) : (
                          <span className="badge badge-moderate" style={{ fontSize: '0.68rem' }}>
                            🟡 Belum
                          </span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => onSelectReport(r)}>
                          <ExternalLink size={13} /> Buka
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GROUP ANALYSIS TAB */}
      {activeTab === 'group_analysis' && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Kluster Masalah Kelompok</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Pengelompokan otomatis untuk konseling kelompok tepat sasaran.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {groupClusters.map((c, idx) => (
              <div key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="badge badge-mild" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{c.domainId}</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.78rem' }}>{c.students.length} Siswa</span>
                </div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', lineHeight: 1.4 }}>"{c.text}"</h4>
                <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', fontSize: '0.72rem' }}>
                  <strong>Anggota:</strong>
                  <ul style={{ margin: '0.2rem 0 0 0.85rem', color: 'var(--text-secondary)' }}>
                    {c.students.map((st, si) => <li key={si}>{st.name}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOKENS TAB */}
      {activeTab === 'tokens' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Token Asesmen</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Token 6-digit acak untuk akses asesmen.</p>
            </div>

            <form onSubmit={handleGenerateTokens} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Instansi / Kategori" className="form-input"
                style={{ width: '180px' }} value={tokenClass} onChange={(e) => setTokenClass(e.target.value)} required />
              <select className="form-select" style={{ width: '110px' }} value={tokenCount} onChange={(e) => setTokenCount(e.target.value)}>
                <option value={1}>1</option><option value={5}>5</option><option value={10}>10</option>
                <option value={20}>20</option><option value={35}>35</option>
              </select>
              <button type="submit" className="btn btn-primary btn-sm"><Plus size={14} /> Buat</button>
            </form>
          </div>

          {generatedTokensMsg && (
            <div style={{
              background: 'var(--status-normal-bg)', border: '1px solid var(--status-normal)', color: '#065F46',
              padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.85rem', fontSize: '0.82rem', fontWeight: 600
            }}>✓ {generatedTokensMsg}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>Total: <strong>{tokens.length}</strong> | Tersedia: <strong style={{ color: 'var(--status-normal)' }}>{tokens.filter(t => t.status !== 'completed').length}</strong></span>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              const unused = tokens.filter(t => t.status !== 'completed');
              if (!unused.length) { alert('Tidak ada token tersedia.'); return; }
              navigator.clipboard.writeText(unused.map((t, i) => `${i + 1}. ${t.token} (${t.className || 'Umum'})`).join('\n'));
              alert(`${unused.length} token disalin!`);
            }}>
              <Copy size={13} /> Salin Semua
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token</th><th>Instansi</th><th>Status</th><th>Pengguna</th><th>Dibuat</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t, idx) => (
                  <tr key={idx}>
                    <td>
                      <span style={{
                        fontFamily: 'monospace', fontWeight: 800, color: 'var(--text)', fontSize: '0.95rem',
                        letterSpacing: '0.06em', background: 'var(--primary-light)', padding: '0.15rem 0.4rem',
                        borderRadius: '4px', border: '1px solid #C7D2FE'
                      }}>{t.token}</span>
                    </td>
                    <td>{t.className || 'Umum'}</td>
                    <td><span className={`badge ${t.status === 'completed' ? 'badge-normal' : 'badge-mild'}`}>{t.status === 'completed' ? 'Selesai' : 'Tersedia'}</span></td>
                    <td>{t.studentName || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                    <td>{new Date(t.createdAt || Date.now()).toLocaleDateString('id-ID')}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => handleCopy(t.token)}><Copy size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUESTIONS DATABASE (CRUD & MEDIA GOOGLE DRIVE) TAB */}
      {activeTab === 'questions' && (
        <div className="glass-card">
          {/* Top Actions & Feedback */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Database Bank Soal & Media</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                Kelola butir asesmen DASS-42 & DCM serta lampirkan Gambar/Video via Google Drive link.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={handleOpenAddQuestion}>
                <Plus size={14} /> Tambah Soal Baru
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleResetQuestions} title="Kembalikan ke 126 Soal Standar">
                <RotateCcw size={13} /> Reset Standar
              </button>
            </div>
          </div>

          {questionFeedbackMsg && (
            <div style={{
              background: 'var(--status-normal-bg)', border: '1px solid var(--status-normal)', color: '#065F46',
              padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.82rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600
            }}>
              <CheckCircle2 size={15} /> {questionFeedbackMsg}
            </div>
          )}

          {/* Quick Metrics */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.5rem', marginBottom: '1rem', fontSize: '0.75rem'
          }}>
            <div style={{ background: 'var(--bg)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Soal:</span>
              <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text)' }}>{questions.length}</strong>
            </div>
            <div style={{ background: 'var(--bg)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Dengan Media G-Drive:</span>
              <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--primary)' }}>
                {questions.filter(q => q.mediaUrl).length}
              </strong>
            </div>
            <div style={{ background: 'var(--bg)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Skrining Inti:</span>
              <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--accent)' }}>
                {questions.filter(q => q.isScreeningCore).length}
              </strong>
            </div>
            <div style={{ background: 'var(--bg)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Krisis / Emergency:</span>
              <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--status-critical)' }}>
                {questions.filter(q => q.isEmergency).length}
              </strong>
            </div>
          </div>

          {/* Filters & Search */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '0.65rem', marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Domain Filter */}
              <select className="form-select" style={{ fontSize: '0.78rem', width: 'auto', minWidth: '150px' }}
                value={questionDomainFilter} onChange={(e) => setQuestionDomainFilter(e.target.value)}>
                <option value="all">Semua Domain (6)</option>
                {ASSESSMENT_DOMAINS.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>

              {/* Subscale Filter */}
              <select className="form-select" style={{ fontSize: '0.78rem', width: 'auto', minWidth: '130px' }}
                value={questionSubscaleFilter} onChange={(e) => setQuestionSubscaleFilter(e.target.value)}>
                <option value="all">Semua Subskala</option>
                <option value="depresi">Depresi</option>
                <option value="kecemasan">Kecemasan</option>
                <option value="stres">Stres</option>
              </select>

              {/* Special Filter */}
              <select className="form-select" style={{ fontSize: '0.78rem', width: 'auto', minWidth: '140px' }}
                value={questionMediaFilter} onChange={(e) => setQuestionMediaFilter(e.target.value)}>
                <option value="all">Semua Tipe Soal</option>
                <option value="with_media">📸 Ada Media G-Drive</option>
                <option value="screening">🎯 Skrining Inti</option>
                <option value="emergency">⚠️ Krisis/Emergency</option>
              </select>
            </div>

            <div style={{ position: 'relative', width: '220px' }}>
              <input type="text" placeholder="Cari isi butir soal..." className="form-input"
                style={{ paddingLeft: '2rem', fontSize: '0.8rem' }} value={questionSearchQuery}
                onChange={(e) => setQuestionSearchQuery(e.target.value)} />
              <Search size={14} style={{ position: 'absolute', left: '8px', top: '11px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>#</th>
                  <th>Butir Pertanyaan</th>
                  <th style={{ width: '130px' }}>Domain</th>
                  <th style={{ width: '110px' }}>Subskala</th>
                  <th style={{ width: '110px' }}>Media</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Tidak ada soal yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : filteredQuestions.map((q) => {
                  const media = q.mediaUrl ? parseGoogleDriveMedia(q.mediaUrl, q.mediaType) : null;
                  return (
                    <tr key={q.id}>
                      <td>
                        <strong style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{q.id}</strong>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>
                          {q.text}
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                          {q.isScreeningCore && (
                            <span className="badge badge-mild" style={{ fontSize: '0.65rem' }}>Skrining Inti</span>
                          )}
                          {q.isEmergency && (
                            <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>⚠️ Krisis</span>
                          )}
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {q.subscaleTitle}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-normal" style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>
                          {q.domainId}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 700,
                          color: q.subscale === 'depresi' ? '#4F46E5' : q.subscale === 'kecemasan' ? '#D97706' : '#DC2626'
                        }}>
                          {q.subscale?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {media ? (
                          <a
                            href={q.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="media-tag"
                            title="Buka media di Google Drive"
                            style={{ textDecoration: 'none' }}
                          >
                            {media.type === 'video' ? <Video size={12} /> : <Image size={12} />}
                            <span>{media.type === 'video' ? 'Video' : 'Gambar'}</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditQuestion(q)} title="Edit Soal">
                            <Edit2 size={13} />
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteQuestion(q)} title="Hapus Soal"
                            style={{ color: 'var(--status-critical)' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL EDIT / TAMBAH SOAL */}
      {isEditModalOpen && editingQuestion && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  {editingQuestion.id && questions.some(q => q.id === editingQuestion.id)
                    ? `Edit Soal #${editingQuestion.id}`
                    : `Tambah Soal Baru (#${editingQuestion.id})`}
                </h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion}>
              {/* Question Text */}
              <div className="form-group">
                <label className="form-label">Teks Butir Pertanyaan *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={editingQuestion.text}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                  placeholder="Tuliskan pernyataan asesmen yang dirasakan konseli/siswa..."
                  required
                />
              </div>

              {/* Domain & Subscale Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Domain Kehidupan</label>
                  <select
                    className="form-select"
                    value={editingQuestion.domainId}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, domainId: e.target.value })}
                  >
                    {ASSESSMENT_DOMAINS.map(d => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subskala Gejala</label>
                  <select
                    className="form-select"
                    value={editingQuestion.subscale}
                    onChange={(e) => {
                      const newSub = e.target.value;
                      const label = newSub === 'depresi' ? 'Depresi' : newSub === 'kecemasan' ? 'Kecemasan' : 'Stres';
                      setEditingQuestion({
                        ...editingQuestion,
                        subscale: newSub,
                        subscaleTitle: `${label} (${editingQuestion.domainId})`
                      });
                    }}
                  >
                    <option value="depresi">Depresi</option>
                    <option value="kecemasan">Kecemasan</option>
                    <option value="stres">Stres</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Judul Subskala</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingQuestion.subscaleTitle || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, subscaleTitle: e.target.value })}
                    placeholder="Contoh: Depresi (Pesimisme Belajar)"
                  />
                </div>
              </div>

              {/* Flags: Screening & Emergency */}
              <div style={{
                background: 'var(--bg)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', marginBottom: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(editingQuestion.isScreeningCore)}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, isScreeningCore: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <span>Soal Skrining Inti (Fase 1 DCM)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--status-critical)' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(editingQuestion.isEmergency)}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, isEmergency: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--status-critical)' }}
                  />
                  <span>Indikator Krisis Kritis (Emergency Alert)</span>
                </label>
              </div>

              {/* GOOGLE DRIVE MEDIA ATTACHMENT SECTION */}
              <div style={{
                background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 'var(--radius-md)',
                padding: '1rem', marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0F766E' }}>
                    <Image size={16} />
                    <strong style={{ fontSize: '0.88rem' }}>Lampiran Media Google Drive</strong>
                  </div>
                  {editingQuestion.mediaUrl && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
                      onClick={() => setEditingQuestion({ ...editingQuestion, mediaUrl: '' })}
                    >
                      Hapus Media
                    </button>
                  )}
                </div>

                <p style={{ fontSize: '0.75rem', color: '#115E59', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                  Lampirkan gambar ilustrasi atau video panduan menggunakan tautan Google Drive.
                  Pastikan akses file di Google Drive diatur ke <em>"Anyone with the link" (Siapa saja yang memiliki link dapat melihat)</em>.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', color: '#134E4A' }}>
                      LINK GOOGLE DRIVE (VIEW / SHARING LINK)
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      value={editingQuestion.mediaUrl || ''}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, mediaUrl: e.target.value })}
                      placeholder="https://drive.google.com/file/d/1ABCXYZ.../view?usp=sharing"
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>

                  <div style={{ minWidth: '130px' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', color: '#134E4A' }}>
                      TIPE MEDIA
                    </label>
                    <select
                      className="form-select"
                      value={editingQuestion.mediaType || 'image'}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, mediaType: e.target.value })}
                      style={{ fontSize: '0.82rem' }}
                    >
                      <option value="image">Gambar (Foto)</option>
                      <option value="video">Video (G-Drive)</option>
                    </select>
                  </div>
                </div>

                {/* Live Preview Box */}
                {modalMediaPreview && modalMediaPreview.embedUrl && (
                  <div style={{
                    marginTop: '0.75rem', padding: '0.65rem', background: '#FFFFFF',
                    border: '1px solid #CCFBF1', borderRadius: 'var(--radius-sm)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.75rem' }}>
                      <span style={{ fontWeight: 700, color: '#0F766E' }}>
                        ✓ Pratinjau Tautan ({modalMediaPreview.type === 'video' ? 'Video' : 'Gambar'})
                      </span>
                      <a href={editingQuestion.mediaUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '0.72rem', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span>Buka Tab Baru</span> <ExternalLink size={11} />
                      </a>
                    </div>

                    {modalMediaPreview.type === 'video' ? (
                      <div className="question-media-video-container" style={{ maxHeight: '200px' }}>
                        <iframe
                          src={modalMediaPreview.embedUrl}
                          title="Pratinjau Video"
                          allowFullScreen
                          className="question-media-iframe"
                        />
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', maxHeight: '180px', overflow: 'hidden', background: '#0F172A', borderRadius: '4px' }}>
                        <img
                          src={modalMediaPreview.embedUrl}
                          alt="Pratinjau Gambar"
                          style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const msg = document.getElementById('preview-error-note');
                            if (msg) msg.style.display = 'block';
                          }}
                        />
                        <div id="preview-error-note" style={{ display: 'none', padding: '0.5rem', color: '#CBD5E1', fontSize: '0.75rem' }}>
                          Pratinjau dibatasi oleh kebijakan Google Drive. Pastikan opsi 'Anyone with link can view' telah aktif.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle2 size={16} /> Simpan Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
