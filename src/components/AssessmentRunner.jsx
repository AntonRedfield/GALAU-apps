import React, { useState, useEffect, useMemo } from 'react';
import {
  RAW_QUESTIONS,
  STANDARD_DASS42_QUESTION_IDS,
  SCREENING_CORE_QUESTION_IDS,
  ASSESSMENT_DOMAINS
} from '../data/assessmentQuestions';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock, Sparkles,
  HelpCircle, AlertCircle, Sliders, Tag, BatteryMedium, GitBranch, Info, Eye, Shuffle,
  Wifi, WifiOff, ShieldCheck
} from 'lucide-react';
import { getAllAssessmentQuestions, parseGoogleDriveMedia, saveActiveSessionBackup } from '../services/storageService';

const SCALE_MODES = ['slider', 'semantic', 'battery'];

/**
 * Otomatis acak format opsi jawaban (Slider, Semantik & Baterai) antar soal:
 * - Maksimal 5 soal berturut-turut untuk format opsi yang sama
 * - Soal berikutnya wajib berganti ke jenis opsi yang berbeda
 */
function buildShuffledScaleTypes(questions, existingMap = {}, preferredMode = 'shuffle') {
  if (preferredMode !== 'shuffle' && SCALE_MODES.includes(preferredMode)) {
    const fixedMap = { ...existingMap };
    questions.forEach(q => {
      if (!fixedMap[q.id]) fixedMap[q.id] = preferredMode;
    });
    return fixedMap;
  }

  const updated = { ...existingMap };
  let lastMode = null;
  let currentStreak = 0;

  questions.forEach(q => {
    let mode = updated[q.id];

    if (mode && SCALE_MODES.includes(mode)) {
      if (mode === lastMode) {
        currentStreak++;
        if (currentStreak > 5) {
          // Wajib ganti ke jenis lain jika sudah melebihi 5 berturut-turut
          const alternatives = SCALE_MODES.filter(m => m !== lastMode);
          mode = alternatives[Math.floor(Math.random() * alternatives.length)];
          updated[q.id] = mode;
          lastMode = mode;
          currentStreak = 1;
        }
      } else {
        lastMode = mode;
        currentStreak = 1;
      }
    } else {
      if (currentStreak >= 5) {
        // Maksimal 5 tercapai: soal berikutnya WAJIB jenis berbeda
        const alternatives = SCALE_MODES.filter(m => m !== lastMode);
        mode = alternatives[Math.floor(Math.random() * alternatives.length)];
        currentStreak = 1;
      } else if (currentStreak >= 2 && Math.random() < 0.45) {
        // Variasi shuffle alami setiap 2-4 soal agar tidak monoton
        const alternatives = SCALE_MODES.filter(m => m !== lastMode);
        mode = alternatives[Math.floor(Math.random() * alternatives.length)];
        currentStreak = 1;
      } else {
        mode = lastMode || SCALE_MODES[Math.floor(Math.random() * SCALE_MODES.length)];
        currentStreak++;
      }
      updated[q.id] = mode;
      lastMode = mode;
    }
  });

  return updated;
}

export function AssessmentRunner({ studentData, onCompleteAssessment }) {
  const assessmentMode = studentData.assessmentMode || 'adaptive';
  const preferredScaleMode = studentData.scaleInterface || 'shuffle';
  const draftKey = studentData.token || studentData.fullName || 'user';

  const [responses, setResponses] = useState(() => {
    try {
      const saved = localStorage.getItem(`draft_responses_${draftKey}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [questionScaleTypes, setQuestionScaleTypes] = useState(() => {
    try {
      const saved = localStorage.getItem(`draft_scaletypes_${draftKey}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showInstructionTooltip, setShowInstructionTooltip] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Pantau status koneksi secara berkala dan reaktif
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (draftKey && Object.keys(questionScaleTypes).length > 0) {
      localStorage.setItem(`draft_scaletypes_${draftKey}`, JSON.stringify(questionScaleTypes));
    }
  }, [questionScaleTypes, draftKey]);

  const [allQuestions, setAllQuestions] = useState(RAW_QUESTIONS);

  useEffect(() => {
    getAllAssessmentQuestions().then(loaded => {
      if (loaded && loaded.length > 0) {
        setAllQuestions(loaded);
      }
    });
  }, []);

  // Simpan respon dan cadangan sesi otomatis ke format ringan JSON
  useEffect(() => {
    if (draftKey) {
      localStorage.setItem(`draft_responses_${draftKey}`, JSON.stringify(responses));
      saveActiveSessionBackup({
        activeView: 'assessment',
        studentData,
        responses
      });
    }
  }, [responses, draftKey, studentData]);

  // Domain expansion logic for adaptive mode
  const expandedDomainIds = useMemo(() => {
    if (assessmentMode !== 'adaptive') return new Set();
    const expanded = new Set();
    ASSESSMENT_DOMAINS.forEach(dom => {
      const domainScreeningQuestions = allQuestions.filter(q => q.domainId === dom.id && q.isScreeningCore);
      if (domainScreeningQuestions.some(q => responses[q.id] !== undefined && responses[q.id] >= 2)) {
        expanded.add(dom.id);
      }
    });
    return expanded;
  }, [responses, assessmentMode, allQuestions]);

  // Build active question queue
  const activeQuestions = useMemo(() => {
    if (assessmentMode === 'comprehensive') return allQuestions;
    if (assessmentMode === 'dass42') return allQuestions.filter(q => STANDARD_DASS42_QUESTION_IDS.includes(q.id));

    const queue = [];
    ASSESSMENT_DOMAINS.forEach(dom => {
      const domQ = allQuestions.filter(q => q.domainId === dom.id);
      queue.push(...(expandedDomainIds.has(dom.id) ? domQ : domQ.filter(q => q.isScreeningCore)));
    });
    return queue;
  }, [assessmentMode, expandedDomainIds, allQuestions]);

  // Sinkronisasi otomatis format opsi jawaban untuk seluruh soal aktif
  useEffect(() => {
    if (activeQuestions.length > 0) {
      setQuestionScaleTypes(prev => {
        const needsInit = activeQuestions.some(q => !prev[q.id]);
        if (needsInit || Object.keys(prev).length === 0) {
          return buildShuffledScaleTypes(activeQuestions, prev, preferredScaleMode);
        }
        return prev;
      });
    }
  }, [activeQuestions, preferredScaleMode]);

  const totalQuestions = activeQuestions.length;

  const [currentQuestionId, setCurrentQuestionId] = useState(() => {
    try {
      const savedQ = localStorage.getItem(`draft_current_q_${draftKey}`);
      if (savedQ && Number(savedQ)) return Number(savedQ);
    } catch {}
    return activeQuestions[0]?.id || 1;
  });

  // Simpan posisi soal saat ini untuk pemulihan bencana (misal: ter-refresh atau tertutup)
  useEffect(() => {
    if (draftKey && currentQuestionId) {
      localStorage.setItem(`draft_current_q_${draftKey}`, String(currentQuestionId));
      saveActiveSessionBackup({
        currentQuestionId,
        activeView: 'assessment'
      });
    }
  }, [currentQuestionId, draftKey]);

  const currentIndex = useMemo(() => {
    const idx = activeQuestions.findIndex(q => q.id === currentQuestionId);
    return idx >= 0 ? idx : 0;
  }, [activeQuestions, currentQuestionId]);

  const currentQ = activeQuestions[currentIndex] || activeQuestions[0] || allQuestions[0];
  const currentDomain = ASSESSMENT_DOMAINS.find(d => d.id === currentQ.domainId) || ASSESSMENT_DOMAINS[0];
  const currentValue = responses[currentQ.id] !== undefined ? responses[currentQ.id] : 0;

  // Format tampilan aktif untuk soal saat ini (auto-shuffle atau manual override)
  const currentScaleType = questionScaleTypes[currentQ.id] || (preferredScaleMode !== 'shuffle' ? preferredScaleMode : 'slider');

  const handleManualScaleTypeChange = (newType) => {
    setQuestionScaleTypes(prev =>
      buildShuffledScaleTypes(activeQuestions, { ...prev, [currentQ.id]: newType }, preferredScaleMode)
    );
  };

  const scoreToSliderPos = (score) => [10, 38, 63, 88][score] || 10;
  const [sliderVal, setSliderVal] = useState(() => scoreToSliderPos(currentValue));

  useEffect(() => {
    setSliderVal(scoreToSliderPos(responses[currentQ.id] !== undefined ? responses[currentQ.id] : 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentQ.id, responses]);

  const handleSliderChange = (e) => {
    const rawVal = Number(e.target.value);
    setSliderVal(rawVal);
    let mappedScore = rawVal <= 25 ? 0 : rawVal <= 50 ? 1 : rawVal <= 75 ? 2 : 3;
    setResponses(prev => ({ ...prev, [currentQ.id]: mappedScore }));
  };

  const handleSelectScore = (score) => {
    setResponses(prev => ({ ...prev, [currentQ.id]: score }));
    setSliderVal(scoreToSliderPos(score));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) setCurrentQuestionId(activeQuestions[currentIndex + 1].id);
    else setShowReviewModal(true);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentQuestionId(activeQuestions[currentIndex - 1].id);
  };

  const answeredCount = Object.keys(responses).filter(id => activeQuestions.some(q => q.id === Number(id))).length;
  const percentCompleted = Math.round((answeredCount / totalQuestions) * 100);
  const domainOptions = currentDomain.options;

  const batteryMatrix = [
    { score: 0, icon: '🔋', title: 'Penuh', subtitle: 'Tidak mengganggu', desc: 'Tenang, energi utuh (0 Hari)', color: '#10B981', bgClass: 'battery-card-0' },
    { score: 1, icon: '🪫', title: 'Berkurang', subtitle: 'Sedikit mengganggu', desc: 'Sesekali muncul (1-2 Hari)', color: '#3B82F6', bgClass: 'battery-card-1' },
    { score: 2, icon: '⚠️', title: 'Lemah', subtitle: 'Sangat mengganggu', desc: 'Cukup berat (3-5 Hari)', color: '#F59E0B', bgClass: 'battery-card-2' },
    { score: 3, icon: '🔴', title: 'Habis', subtitle: 'Melumpuhkan', desc: 'Kewalahan (6-7 Hari)', color: '#DC2626', bgClass: 'battery-card-3' }
  ];

  const handleFinalSubmit = () => {
    setShowReviewModal(false);
    try {
      localStorage.removeItem(`draft_responses_${draftKey}`);
      localStorage.removeItem(`draft_scaletypes_${draftKey}`);
      localStorage.removeItem(`draft_current_q_${draftKey}`);
    } catch {}
    const fullResponses = { ...responses };
    if (assessmentMode === 'adaptive') {
      allQuestions.forEach(q => { if (fullResponses[q.id] === undefined) fullResponses[q.id] = 0; });
      onCompleteAssessment(fullResponses, allQuestions);
    } else if (assessmentMode === 'comprehensive') {
      onCompleteAssessment(fullResponses, allQuestions);
    } else {
      onCompleteAssessment(fullResponses, activeQuestions);
    }
  };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Spanduk Tanggap Darurat jika Sinyal Terputus */}
      {!isOnline && (
        <div style={{
          background: '#FEF3C7',
          border: '1px solid #FCD34D',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.82rem',
          color: '#92400E',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <WifiOff size={18} color="#D97706" style={{ flexShrink: 0 }} />
          <div>
            <strong>Sinyal Terputus (Cadangan Darurat Aktif):</strong> Jangan khawatir! Seluruh jawaban Anda tetap tersimpan otomatis di penyimpanan lokal perangkat ini. Anda dapat terus melanjutkan pengisian dengan aman. Data akan disinkronkan saat koneksi kembali normal.
          </div>
        </div>
      )}

      {/* Adaptive banner */}
      {assessmentMode === 'adaptive' && (
        <div className="branching-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <GitBranch size={15} color="var(--primary)" />
            <span>
              <strong>Mode Adaptif:</strong> {expandedDomainIds.size > 0
                ? <span>{expandedDomainIds.size} domain diperluas</span>
                : <span>Domain dengan skor ≥2 akan diperluas otomatis</span>}
            </span>
          </div>
          <span className="badge badge-normal" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
            {expandedDomainIds.size} Terbuka
          </span>
        </div>
      )}

      {/* Stepper */}
      <div className="assessment-stepper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
            <span style={{ color: 'var(--primary)' }}>Soal {currentIndex + 1}/{totalQuestions}</span>
            <span style={{ color: 'var(--border)' }}>•</span>
            <span style={{ color: 'var(--accent)' }}>{currentDomain.title}</span>
            {currentQ.isScreeningCore && assessmentMode === 'adaptive' && (
              <span className="badge badge-mild" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>Skrining</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {preferredScaleMode === 'shuffle' && (
              <span
                className="badge badge-normal"
                style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '0.2rem 0.45rem' }}
                title="Format otomatis berganti antar soal (maksimal 5 soal berurutan)"
              >
                <Shuffle size={11} /> Auto-Shuffle
              </span>
            )}
            <div className="style-toggle-container">
              <button
                type="button"
                className={`style-toggle-btn ${currentScaleType === 'slider' ? 'active' : ''}`}
                onClick={() => handleManualScaleTypeChange('slider')}
                title="Ganti ke Slider VAS"
              >
                <Sliders size={11} /> Slider
              </button>
              <button
                type="button"
                className={`style-toggle-btn ${currentScaleType === 'semantic' ? 'active' : ''}`}
                onClick={() => handleManualScaleTypeChange('semantic')}
                title="Ganti ke Jangkar Semantik"
              >
                <Tag size={11} /> Semantik
              </button>
              <button
                type="button"
                className={`style-toggle-btn ${currentScaleType === 'battery' ? 'active' : ''}`}
                onClick={() => handleManualScaleTypeChange('battery')}
                title="Ganti ke Simbol Baterai"
              >
                <BatteryMedium size={11} /> Baterai
              </button>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.8rem' }}>{percentCompleted}%</span>
          </div>
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percentCompleted}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {/* Sub-header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-mild" style={{ textTransform: 'none', fontSize: '0.72rem' }}>
              {currentQ.subscaleTitle}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#059669', fontWeight: 500 }} title="Seluruh jawaban otomatis dicadangkan di perangkat">
              <CheckCircle2 size={12} color="#10B981" /> Cadangan Tersimpan
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={12} /> 7 hari terakhir
            <button type="button" onClick={() => setShowInstructionTooltip(!showInstructionTooltip)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '1px', display: 'flex' }}>
              <HelpCircle size={13} />
            </button>
          </div>
        </div>

        {/* Instruction tooltip */}
        {showInstructionTooltip && (
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            padding: '0.65rem 0.85rem', marginBottom: '0.85rem', fontSize: '0.75rem', color: 'var(--text-secondary)'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Info size={13} color="var(--primary)" /> Pedoman (7 Hari Terakhir):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.3rem' }}>
              <div><strong>0</strong> = Tidak pernah (0 Hari)</div>
              <div><strong>1</strong> = Kadang (1-2 Hari)</div>
              <div><strong>2</strong> = Sering (3-5 Hari)</div>
              <div><strong>3</strong> = Terus-menerus (6-7 Hari)</div>
            </div>
          </div>
        )}

        {/* Media Preview (Google Drive Image / Video) */}
        {(() => {
          if (!currentQ.mediaUrl) return null;
          const media = parseGoogleDriveMedia(currentQ.mediaUrl, currentQ.mediaType);
          if (!media || !media.embedUrl) return null;

          if (media.type === 'video') {
            return (
              <div className="question-media-wrapper">
                <div className="question-media-video-container">
                  <iframe
                    src={media.embedUrl}
                    title={`Video Soal #${currentQ.id}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="question-media-iframe"
                  />
                </div>
              </div>
            );
          }

          return (
            <div className="question-media-wrapper" style={{ textAlign: 'center' }}>
              <img
                src={media.embedUrl}
                alt={`Gambar Soal #${currentQ.id}`}
                className="question-media-img"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextSibling;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div style={{ display: 'none', padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Lampiran gambar dari Google Drive. </span>
                <a href={currentQ.mediaUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  Buka Gambar di Tab Baru ↗
                </a>
              </div>
            </div>
          );
        })()}

        {/* Question text */}
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.5, color: 'var(--text)', margin: '0.75rem 0 1.25rem' }}>
          "{currentQ.text}"
        </h3>

        {/* SLIDER VIEW */}
        {currentScaleType === 'slider' && (
          <div className="vas-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Geser sesuai intensitas:</span>
              <span className="badge badge-normal" style={{ fontSize: '0.78rem' }}>
                Skor {currentValue}: <strong>{domainOptions[currentValue]?.label}</strong>
              </span>
            </div>

            <input type="range" min="0" max="100" value={sliderVal} onChange={handleSliderChange} className="vas-slider" />

            <div className="vas-labels">
              <span style={{ color: 'var(--status-normal)' }}>Tidak sama sekali</span>
              <span style={{ color: 'var(--status-critical)' }}>Sangat parah</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginTop: '1rem', textAlign: 'center' }}>
              {domainOptions.map((opt, idx) => {
                const isSelected = currentValue === opt.value;
                return (
                  <div key={idx} onClick={() => handleSelectScore(opt.value)} style={{
                    padding: '0.5rem 0.25rem', borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--primary-light)' : 'var(--bg)',
                    border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    cursor: 'pointer', fontSize: '0.75rem',
                    fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                    transition: 'var(--transition)'
                  }}>
                    <div style={{ fontSize: '0.9rem', marginBottom: '0.15rem' }}>{batteryMatrix[idx].icon}</div>
                    <div style={{ fontWeight: 700 }}>{opt.label}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SEMANTIC VIEW */}
        {currentScaleType === 'semantic' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span>Pilih respon yang sesuai:</span>
              <span className="badge badge-normal" style={{ fontSize: '0.7rem' }}>Skala: {currentDomain.scaleType}</span>
            </div>

            <div className="options-grid">
              {domainOptions.map((opt) => {
                const isSelected = currentValue === opt.value;
                return (
                  <div key={opt.value} className={`option-card ${isSelected ? 'active' : ''}`} onClick={() => handleSelectScore(opt.value)}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: isSelected ? 'var(--primary)' : 'var(--bg)', color: isSelected ? '#FFF' : 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0
                    }}>{opt.value}</div>
                    <div>
                      <div className="option-title">{opt.label}</div>
                      <div className="option-desc">{opt.desc}</div>
                    </div>
                    {isSelected && <CheckCircle2 size={16} color="var(--primary)" style={{ position: 'absolute', top: '8px', right: '8px' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BATTERY VIEW */}
        {currentScaleType === 'battery' && (
          <div>
            <div style={{
              background: 'var(--accent-light)', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-sm)',
              padding: '0.6rem 0.85rem', marginBottom: '0.75rem', fontSize: '0.82rem', color: '#166534',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}>
              <Sparkles size={15} color="#16A34A" />
              <span><strong>Refleksi:</strong> "Seberapa banyak energi pikiran yang tersita?"</span>
            </div>

            <div className="options-grid">
              {batteryMatrix.map((item) => {
                const isSelected = currentValue === item.score;
                return (
                  <div key={item.score} className={`option-card ${item.bgClass} ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectScore(item.score)} style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>{item.icon}</div>
                    <div>
                      <div className="option-title" style={{ color: item.color }}>{item.title} — {item.subtitle}</div>
                      <div className="option-desc">{item.desc}</div>
                    </div>
                    {isSelected && <CheckCircle2 size={16} color={item.color} style={{ position: 'absolute', top: '8px', right: '8px' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Emergency empathy */}
        {currentQ.isEmergency && currentValue >= 2 && (
          <div className="emergency-banner" style={{ marginTop: '1rem' }}>
            <AlertCircle size={20} className="emergency-icon" />
            <div style={{ fontSize: '0.8rem' }}>
              <strong>Kami mendengar Anda.</strong> Di akhir pengisian, sistem akan menyediakan akses langsung ke layanan pendampingan profesional.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={handlePrev} disabled={currentIndex === 0} style={{ opacity: currentIndex === 0 ? 0.4 : 1 }}>
            <ArrowLeft size={16} /> Sebelumnya
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowReviewModal(true)}>
              <Eye size={14} /> {answeredCount}/{totalQuestions}
            </button>
            <button className="btn btn-primary" onClick={handleNext}>
              {currentIndex === totalQuestions - 1 ? 'Selesai' : 'Selanjutnya'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>Tinjau Pengisian</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
              Periksa kelengkapan jawaban sebelum dianalisis.
            </p>

            <div style={{
              background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '0.75rem',
              marginBottom: '1rem', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span>Terisi: <strong style={{ color: 'var(--primary)' }}>{answeredCount}/{totalQuestions}</strong></span>
              {assessmentMode === 'adaptive' && (
                <span className="badge badge-normal" style={{ fontSize: '0.7rem' }}>Domain aman di-bypass</span>
              )}
            </div>

            <div style={{
              maxHeight: '220px', overflowY: 'auto', display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '0.3rem',
              padding: '0.5rem', background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', marginBottom: '1rem'
            }}>
              {activeQuestions.map((q, idx) => {
                const isAnswered = responses[q.id] !== undefined;
                const score = responses[q.id];
                return (
                  <button key={q.id} onClick={() => { setCurrentQuestionId(q.id); setShowReviewModal(false); }}
                    style={{
                      height: '36px', borderRadius: '6px', border: '1px solid',
                      borderColor: isAnswered ? 'var(--primary)' : 'var(--border)',
                      background: isAnswered ? 'var(--primary-light)' : 'var(--bg)',
                      color: isAnswered ? 'var(--primary)' : 'var(--text-muted)',
                      fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1
                    }}
                    title={`#${q.id}: ${q.text.substring(0, 40)}...`}
                  >
                    <span>{idx + 1}</span>
                    {isAnswered && <span style={{ fontSize: '0.6rem', color: 'var(--primary)' }}>[{score}]</span>}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>Kembali</button>
              <button className="btn btn-primary" onClick={handleFinalSubmit}>
                <CheckCircle2 size={16} /> Kirim & Buat Laporan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
