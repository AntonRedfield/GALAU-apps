import React, { useState } from 'react';
import { X, Database } from 'lucide-react';
import { getStoredFirebaseConfig, saveFirebaseConfig, removeFirebaseConfig, isFirebaseActive } from '../services/firebase';

export function FirebaseModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const currentConfig = getStoredFirebaseConfig();
  const [formData, setFormData] = useState({
    apiKey: currentConfig.apiKey || '',
    authDomain: currentConfig.authDomain || '',
    projectId: currentConfig.projectId || '',
    storageBucket: currentConfig.storageBucket || '',
    messagingSenderId: currentConfig.messagingSenderId || '',
    appId: currentConfig.appId || ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = (e) => {
    e.preventDefault();
    saveFirebaseConfig(formData);
  };

  const handleResetToLocal = () => {
    if (window.confirm('Reset konfigurasi khusus dan gunakan konfigurasi bawaan?')) removeFirebaseConfig();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.1rem' }}>Konfigurasi Database Cloud</h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{
          background: isFirebaseActive ? 'var(--status-normal-bg)' : 'var(--status-moderate-bg)',
          border: `1px solid ${isFirebaseActive ? 'var(--status-normal)' : 'var(--status-moderate)'}`,
          borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8rem'
        }}>
          <strong>Status: </strong>
          {isFirebaseActive
            ? <span style={{ color: '#047857', fontWeight: 600 }}>Terhubung ke Cloud ({formData.projectId || 'Firebase'})</span>
            : <span style={{ color: '#B45309', fontWeight: 600 }}>Penyimpanan Lokal Aktif — Data tersimpan aman dengan cadangan otomatis.</span>
          }
        </div>

        <form onSubmit={handleSave}>
          {[
            { name: 'apiKey', label: 'API Key', placeholder: 'AIzaSyA...' },
            { name: 'projectId', label: 'Project ID', placeholder: 'galau-sekolah-2026' },
            { name: 'authDomain', label: 'Auth Domain', placeholder: 'project.firebaseapp.com' },
            { name: 'appId', label: 'App ID', placeholder: '1:123:web:abc' }
          ].map(field => (
            <div className="form-group" key={field.name}>
              <label className="form-label">{field.label}</label>
              <input type="text" name={field.name} value={formData[field.name]} onChange={handleChange}
                placeholder={field.placeholder} className="form-input" />
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleResetToLocal}>Reset Konfigurasi</button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Tutup</button>
              <button type="submit" className="btn btn-primary">Simpan</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
