// =============================================
// AI Voice EMR Blockchain — Doctor Dashboard
// =============================================

import { useState, useEffect } from 'react'
import './App.css'

const API_URL = 'http://localhost:5001/api';

function App() {
    const [records, setRecords] = useState([]);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [verification, setVerification] = useState(null);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [backendStatus, setBackendStatus] = useState('checking');
    const [blockchainStatus, setBlockchainStatus] = useState(null);
    const [showGuide, setShowGuide] = useState(false);
    const [guideStep, setGuideStep] = useState(0);
    const [activeTab, setActiveTab] = useState('records'); // 'records' | 'appointments'
    const [appointments, setAppointments] = useState([]);

    const guideSlides = [
        {
            icon: '🏥',
            title: 'Welcome to AI Voice EMR',
            subtitle: 'Your Intelligent Medical Records Assistant',
            content: 'This system helps you manage patient records that are automatically created when patients call your clinic. An AI assistant speaks with the patient, collects their symptoms, and creates a medical record draft for you to review.',
            highlight: 'Every record is protected by blockchain technology — making it impossible for anyone to secretly change a patient\'s medical history.',
        },
        {
            icon: '📞',
            title: 'How Records Appear',
            subtitle: 'Automatic & Hands-Free',
            content: 'When a patient calls your clinic number, the AI voice assistant greets them, asks about their symptoms, age, and medical history, and then creates a structured medical record automatically.',
            highlight: 'New records appear in the "Patient EMR Records" panel on the left side of your dashboard within seconds after the call ends. The page refreshes automatically.',
        },
        {
            icon: '📝',
            title: 'Review & Edit Records',
            subtitle: 'You Are Always in Control',
            content: 'Click on any patient record in the left panel to open it in the EMR Editor on the right. You can review and correct any information the AI captured — patient name, age, symptoms, duration, diagnosis, and recommended actions.',
            highlight: '💾 Save Changes — Click this button after making any corrections. Your edits are saved instantly to the database.',
        },
        {
            icon: '✅',
            title: 'Approve the Record',
            subtitle: 'Lock It with Blockchain Security',
            content: 'Once you are satisfied that the record is accurate and complete, click the "Approve EMR" button. This does two important things:',
            bullets: [
                'Marks the record as doctor-approved (no more edits allowed)',
                'Creates a unique digital fingerprint (hash) of the record',
                'Stores that fingerprint permanently on the blockchain',
            ],
            highlight: 'After approval, the record becomes tamper-proof. If anyone tries to change it, the system will detect the modification.',
        },
        {
            icon: '🔍',
            title: 'Verify Record Integrity',
            subtitle: 'Proof That Nothing Was Changed',
            content: 'At any time, you can click "Verify Blockchain Integrity" on an approved record. The system will:',
            bullets: [
                'Recalculate the digital fingerprint from the current record data',
                'Compare it with the fingerprint stored on the blockchain',
                'Show you VERIFIED ✅ if they match, or TAMPERED ⚠️ if someone altered the data',
            ],
            highlight: 'This protects both you and your patients — providing legal-grade proof that records have not been tampered with.',
        },
        {
            icon: '🎯',
            title: 'Quick Reference',
            subtitle: 'Your Dashboard at a Glance',
            content: '',
            quickRef: [
                { icon: '📋', label: 'Patient Records', desc: 'Click any record to view details' },
                { icon: '💾', label: 'Save Changes', desc: 'Save your corrections to a record' },
                { icon: '✅', label: 'Approve EMR', desc: 'Lock the record & store on blockchain' },
                { icon: '🔍', label: 'Verify Integrity', desc: 'Check if a record has been altered' },
                { icon: '↻', label: 'Refresh', desc: 'Reload the latest records' },
            ],
            highlight: 'You can open this guide anytime by clicking the ❓ button in the top navigation bar.',
        },
    ];

    useEffect(() => {
        fetchRecords();
        fetchAppointments();
        checkBackendStatus();
        checkBlockchainStatus();
        // Auto-refresh records every 15 seconds
        const interval = setInterval(() => { fetchRecords(); fetchAppointments(); }, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message, type = 'info') => setToast({ message, type });

    const checkBackendStatus = async () => {
        try {
            const res = await fetch(`${API_URL.replace('/api', '')}/`);
            setBackendStatus(res.ok ? 'online' : 'offline');
        } catch { setBackendStatus('offline'); }
    };

    const checkBlockchainStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/blockchain/status`);
            const data = await res.json();
            setBlockchainStatus(data.blockchain);
        } catch { setBlockchainStatus({ connected: false }); }
    };

    const fetchRecords = async () => {
        try {
            // Add timestamp to bust browser 304 cache
            const res = await fetch(`${API_URL}/emr?t=${Date.now()}`);
            const data = await res.json();
            if (data.success) setRecords(data.records || []);
        } catch (err) { console.error('Failed to fetch records:', err); }
    };

    const fetchAppointments = async () => {
        try {
            const res = await fetch(`${API_URL}/appointments?t=${Date.now()}`);
            const data = await res.json();
            if (data.success) setAppointments(data.appointments || []);
        } catch (err) { console.error('Failed to fetch appointments:', err); }
    };

    const selectRecord = (record) => {
        setSelectedRecord(record);
        setEditForm({
            patient_name: record.patient_name || '',
            age: record.age || '',
            symptoms: Array.isArray(record.symptoms)
                ? record.symptoms.join(', ')
                : record.symptoms || '',
            duration: record.duration || '',
            medical_history: record.medical_history || '',
            diagnosis_guess: record.diagnosis_guess || '',
            recommended_action: record.recommended_action || '',
        });
        setVerification(null);
    };

    const handleEditChange = (field, value) => setEditForm(prev => ({ ...prev, [field]: value }));

    const handleUpdateRecord = async () => {
        if (!selectedRecord) return;
        setLoading(true);
        try {
            // Convert symptoms back to array if it was joined
            const payload = {
                ...editForm,
                symptoms: editForm.symptoms.split(',').map(s => s.trim()).filter(Boolean),
            };
            const res = await fetch(`${API_URL}/emr/${selectedRecord.record_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Record updated successfully', 'success');
                fetchRecords();
                setSelectedRecord({ ...selectedRecord, ...payload });
            } else {
                showToast(data.error || 'Update failed', 'error');
            }
        } catch { showToast('Failed to connect to server', 'error'); }
        setLoading(false);
    };

    const handleApprove = async () => {
        if (!selectedRecord) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/approve-emr/${selectedRecord.record_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ EMR approved!', 'success');
                fetchRecords();
                setSelectedRecord(data.record);
            } else {
                showToast(data.error || 'Approval failed', 'error');
            }
        } catch { showToast('Failed to connect to server', 'error'); }
        setLoading(false);
    };

    const handleVerify = async () => {
        if (!selectedRecord) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/verify-record`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ record_id: selectedRecord.record_id }),
            });
            const data = await res.json();
            // Backend returns {status, computed_hash, blockchain_hash} directly
            if (data.status === 'VERIFIED' || data.status === 'TAMPERED') {
                setVerification({
                    status: data.status,
                    record_id: selectedRecord.record_id,
                    current_hash: data.computed_hash,
                    blockchain_hash: data.blockchain_hash,
                    verified_at: new Date().toISOString(),
                });
                showToast(
                    data.status === 'VERIFIED'
                        ? '✅ Record integrity VERIFIED! Hashes match blockchain.'
                        : '⚠️ WARNING: Record may be TAMPERED! Hashes do not match.',
                    data.status === 'VERIFIED' ? 'success' : 'error'
                );
            } else {
                showToast(data.error || 'Verification failed', 'error');
            }
        } catch { showToast('Failed to connect to server', 'error'); }
        setLoading(false);
    };

    const formatSymptoms = (symptoms) => {
        if (!symptoms) return 'None reported';
        if (Array.isArray(symptoms)) return symptoms.join(', ');
        return symptoms;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    };

    const pendingCount = records.filter(r => r.status === 'pending_review').length;
    const approvedCount = records.filter(r => r.status === 'approved').length;
    const onChain = records.filter(r => r.blockchain_tx_hash).length;
    const upcomingCount = appointments.length;

    return (
        <div className="app-container">
            {/* ---- Navbar ---- */}
            <nav className="navbar">
                <div className="navbar-brand">
                    <div className="navbar-logo">🏥</div>
                    <div>
                        <div className="navbar-title">AI Voice EMR</div>
                        <div className="navbar-subtitle">Blockchain Integrity System</div>
                    </div>
                </div>
                <div className="navbar-status">
                    <div className="status-indicator">
                        <span className={`status-dot ${backendStatus === 'online' ? 'online' : 'offline'}`}></span>
                        Backend {backendStatus}
                    </div>
                    <div className="status-indicator">
                        <span className={`status-dot ${blockchainStatus?.connected ? 'online' : 'offline'}`}></span>
                        Blockchain {blockchainStatus?.connected ? 'connected' : 'offline'}
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={fetchRecords}>↻ Refresh</button>
                    <button className="btn btn-outline btn-sm" onClick={() => { setShowGuide(true); setGuideStep(0); }} style={{fontSize:'16px', padding:'4px 10px'}}>❓</button>
                </div>
            </nav>

            {/* ---- Tab Bar ---- */}
            <div className="tab-bar">
                <button
                    className={`tab-btn ${activeTab === 'records' ? 'active' : ''}`}
                    onClick={() => setActiveTab('records')}
                >
                    📋 EMR Records
                    {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('appointments'); fetchAppointments(); }}
                >
                    📅 Appointments
                    {upcomingCount > 0 && <span className="tab-badge appt">{upcomingCount}</span>}
                </button>
            </div>
            <main className="main-content">
                {/* Stats Row */}
                <div className="stats-row">
                    <div className="stat-card blue">
                        <div className="stat-label">Total Records</div>
                        <div className="stat-value">{records.length}</div>
                    </div>
                    <div className="stat-card amber">
                        <div className="stat-label">Pending Review</div>
                        <div className="stat-value">{pendingCount}</div>
                    </div>
                    <div className="stat-card green">
                        <div className="stat-label">Approved</div>
                        <div className="stat-value">{approvedCount}</div>
                    </div>
                    <div className="stat-card purple">
                        <div className="stat-label">On Blockchain</div>
                        <div className="stat-value">{onChain}</div>
                    </div>
                </div>

                {/* ---- Appointments Tab View ---- */}
                {activeTab === 'appointments' && (
                    <div style={{ gridColumn: '1 / -1' }}>
                        {appointments.length === 0 ? (
                            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                                <div className="empty-state-icon">📅</div>
                                <div className="empty-state-title">No Appointments Yet</div>
                                <div className="empty-state-text">
                                    When a patient books an appointment during their call, it will appear here automatically.
                                </div>
                            </div>
                        ) : (
                            <div className="appt-grid">
                                {appointments.map((appt) => {
                                    const dateLabel = appt.appointment_date || '—';
                                    const timeLabel = appt.appointment_time || '—';
                                    const symptoms = Array.isArray(appt.symptoms)
                                        ? appt.symptoms.join(', ')
                                        : appt.symptoms || 'Not specified';
                                    return (
                                        <div key={appt.record_id} className="appt-card">
                                            <div className="appt-card-header">
                                                <div className="appt-patient-info">
                                                    <div className="appt-avatar">
                                                        {(appt.patient_name || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="appt-name">{appt.patient_name}</div>
                                                        <div className="appt-age">Age: {appt.age || '—'}</div>
                                                    </div>
                                                </div>
                                                <span className={`record-status ${appt.status === 'approved' ? 'approved' : 'pending'}`}>
                                                    {appt.status === 'approved' ? 'Approved' : 'Pending'}
                                                </span>
                                            </div>

                                            <div className="appt-datetime">
                                                <div className="appt-date-badge">
                                                    <span>📅</span> {dateLabel}
                                                </div>
                                                <div className="appt-time-badge">
                                                    <span>🕐</span> {timeLabel}
                                                </div>
                                            </div>

                                            <div className="appt-field">
                                                <span className="appt-field-label">Symptoms</span>
                                                <span className="appt-field-value">{symptoms}</span>
                                            </div>
                                            <div className="appt-field">
                                                <span className="appt-field-label">AI Diagnosis</span>
                                                <span className="appt-field-value">{appt.diagnosis_guess || '—'}</span>
                                            </div>
                                            <div className="appt-field">
                                                <span className="appt-field-label">Recommendation</span>
                                                <span className="appt-field-value">{appt.recommended_action || '—'}</span>
                                            </div>

                                            <div className="appt-footer">
                                                <span className="appt-id">ID: {appt.record_id}</span>
                                                {appt.blockchain_tx_hash && (
                                                    <span className="appt-chain-badge">⛓️ On-Chain</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ---- Records Tab: Two column layout ---- */}
                {activeTab === 'records' && <>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Records List */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <span className="card-title-icon">📋</span>
                                Patient EMR Records
                            </div>
                        </div>
                        <div className="card-body">
                            {records.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">📞</div>
                                    <div className="empty-state-title">No Records Yet</div>
                                    <div className="empty-state-text">
                                        Records will appear here automatically after a patient call finishes.
                                    </div>
                                </div>
                            ) : (
                                <div className="records-list">
                                    {records.map((record) => (
                                        <div
                                            key={record.record_id}
                                            className={`record-item ${selectedRecord?.record_id === record.record_id ? 'active' : ''}`}
                                            onClick={() => selectRecord(record)}
                                        >
                                            <div className="record-info">
                                                <div className="record-name">{record.patient_name || 'Unknown Patient'}</div>
                                                <div className="record-meta">
                                                    <span>Age: {record.age || 'N/A'}</span>
                                                    <span>·</span>
                                                    <span>{formatDate(record.created_at)}</span>
                                                    {record.blockchain_tx_hash && <span style={{color:'#a78bfa'}}>⛓ On-Chain</span>}
                                                </div>
                                            </div>
                                            <span className={`record-status ${record.status === 'approved' ? 'approved' : 'pending'}`}>
                                                {record.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Blockchain Info Panel (shows when record is selected and has a hash) */}
                    {selectedRecord?.sha256_hash && (
                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">
                                    <span className="card-title-icon">⛓️</span>
                                    Blockchain Record
                                </div>
                            </div>
                            <div className="card-body" style={{ fontSize: '12px' }}>
                                <div style={{ marginBottom: '10px' }}>
                                    <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>SHA256 Hash</div>
                                    <div style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', wordBreak: 'break-all', fontSize: '11px', padding: '8px', background: 'var(--bg-glass)', borderRadius: '6px' }}>
                                        {selectedRecord.sha256_hash}
                                    </div>
                                </div>
                                {selectedRecord.blockchain_tx_hash && (
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Blockchain TX Hash</div>
                                        <div style={{ fontFamily: 'monospace', color: 'var(--accent-purple)', wordBreak: 'break-all', fontSize: '11px', padding: '8px', background: 'var(--bg-glass)', borderRadius: '6px' }}>
                                            {selectedRecord.blockchain_tx_hash}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column — EMR Editor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <span className="card-title-icon">📝</span>
                                EMR Editor
                            </div>
                            {selectedRecord && (
                                <span className={`record-status ${selectedRecord.status === 'approved' ? 'approved' : 'pending'}`}>
                                    {selectedRecord.status === 'approved' ? '✓ Approved' : '⏳ Pending Review'}
                                </span>
                            )}
                        </div>
                        <div className="card-body">
                            {selectedRecord ? (
                                <div className="emr-form">
                                    {/* Patient Name & Age */}
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Patient Name</label>
                                            <input
                                                className="form-input"
                                                value={editForm.patient_name}
                                                onChange={(e) => handleEditChange('patient_name', e.target.value)}
                                                disabled={selectedRecord.status === 'approved'}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Age</label>
                                            <input
                                                className="form-input"
                                                type="number"
                                                value={editForm.age}
                                                onChange={(e) => handleEditChange('age', e.target.value)}
                                                disabled={selectedRecord.status === 'approved'}
                                            />
                                        </div>
                                    </div>

                                    {/* Symptoms */}
                                    <div className="form-group">
                                        <label className="form-label">Symptoms <span style={{color:'var(--text-muted)',fontWeight:400,fontSize:'11px'}}>(comma separated)</span></label>
                                        <textarea
                                            className="form-textarea"
                                            rows={2}
                                            value={editForm.symptoms}
                                            onChange={(e) => handleEditChange('symptoms', e.target.value)}
                                            disabled={selectedRecord.status === 'approved'}
                                            placeholder="e.g. fever, headache, cough"
                                        />
                                    </div>

                                    {/* Duration & Medical History */}
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Duration</label>
                                            <input
                                                className="form-input"
                                                value={editForm.duration}
                                                onChange={(e) => handleEditChange('duration', e.target.value)}
                                                disabled={selectedRecord.status === 'approved'}
                                                placeholder="e.g. 3 days"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Medical History</label>
                                            <input
                                                className="form-input"
                                                value={editForm.medical_history}
                                                onChange={(e) => handleEditChange('medical_history', e.target.value)}
                                                disabled={selectedRecord.status === 'approved'}
                                            />
                                        </div>
                                    </div>

                                    {/* Diagnosis Guess */}
                                    <div className="form-group">
                                        <label className="form-label">AI Diagnosis Guess</label>
                                        <textarea
                                            className="form-textarea"
                                            rows={2}
                                            value={editForm.diagnosis_guess}
                                            onChange={(e) => handleEditChange('diagnosis_guess', e.target.value)}
                                            disabled={selectedRecord.status === 'approved'}
                                        />
                                    </div>

                                    {/* Recommended Action */}
                                    <div className="form-group">
                                        <label className="form-label">Recommended Action</label>
                                        <textarea
                                            className="form-textarea"
                                            rows={2}
                                            value={editForm.recommended_action}
                                            onChange={(e) => handleEditChange('recommended_action', e.target.value)}
                                            disabled={selectedRecord.status === 'approved'}
                                        />
                                    </div>

                                    {/* Timestamps */}
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                        <span>📅 Created: {formatDate(selectedRecord.created_at)}</span>
                                        {selectedRecord.approved_at && <span>✅ Approved: {formatDate(selectedRecord.approved_at)}</span>}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="btn-group">
                                        {selectedRecord.status !== 'approved' && (
                                            <>
                                                <button className="btn btn-primary" onClick={handleUpdateRecord} disabled={loading}>
                                                    {loading ? <span className="spinner"></span> : '💾'} Save Changes
                                                </button>
                                                <button className="btn btn-success" onClick={handleApprove} disabled={loading}>
                                                    {loading ? <span className="spinner"></span> : '✓'} Approve EMR
                                                </button>
                                            </>
                                        )}
                                        {selectedRecord.sha256_hash && (
                                            <button className="btn btn-primary" onClick={handleVerify} disabled={loading}>
                                                {loading ? <span className="spinner"></span> : '🔍'} Verify Blockchain Integrity
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-state-icon">📝</div>
                                    <div className="empty-state-title">No Record Selected</div>
                                    <div className="empty-state-text">
                                        Click a patient record on the left to view and edit their EMR.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Verification Result */}
                    {verification && (
                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">
                                    <span className="card-title-icon">🔐</span>
                                    Integrity Verification Result
                                </div>
                            </div>
                            <div className="card-body">
                                <div className={`verification-result ${verification.status.toLowerCase()}`}>
                                    <div className={`verification-status ${verification.status.toLowerCase()}`} style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
                                        {verification.status === 'VERIFIED' ? '✅ VERIFIED — Record is Intact' : '⚠️ TAMPERED — Record has been Modified'}
                                    </div>
                                    <div className="verification-details">
                                        <div className="verification-row">
                                            <span className="label">Record ID</span>
                                            <span className="value" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{verification.record_id}</span>
                                        </div>
                                        <div className="verification-row">
                                            <span className="label">DB Hash Match</span>
                                            <span className="value">{verification.status === 'VERIFIED' ? '✅ Match' : '❌ Mismatch'}</span>
                                        </div>
                                        {verification.blockchain_hash && (
                                            <div className="verification-row">
                                                <span className="label">Blockchain Match</span>
                                                <span className="value">{verification.status === 'VERIFIED' ? '✅ Match' : '❌ Mismatch'}</span>
                                            </div>
                                        )}
                                        <div className="verification-row">
                                            <span className="label">Verified At</span>
                                            <span className="value">{formatDate(verification.verified_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                </>}
            </main>

            {/* ---- Tutorial Guide Modal ---- */}
            {showGuide && (
                <div className="guide-overlay" onClick={() => setShowGuide(false)}>
                    <div className="guide-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="guide-close" onClick={() => setShowGuide(false)}>✕</button>
                        
                        {/* Progress dots */}
                        <div className="guide-progress">
                            {guideSlides.map((_, i) => (
                                <span
                                    key={i}
                                    className={`guide-dot ${i === guideStep ? 'active' : ''} ${i < guideStep ? 'done' : ''}`}
                                    onClick={() => setGuideStep(i)}
                                />
                            ))}
                        </div>

                        <div className="guide-icon">{guideSlides[guideStep].icon}</div>
                        <h2 className="guide-title">{guideSlides[guideStep].title}</h2>
                        <p className="guide-subtitle">{guideSlides[guideStep].subtitle}</p>
                        
                        {guideSlides[guideStep].content && (
                            <p className="guide-content">{guideSlides[guideStep].content}</p>
                        )}

                        {guideSlides[guideStep].bullets && (
                            <ul className="guide-bullets">
                                {guideSlides[guideStep].bullets.map((b, i) => (
                                    <li key={i}>{b}</li>
                                ))}
                            </ul>
                        )}

                        {guideSlides[guideStep].quickRef && (
                            <div className="guide-quickref">
                                {guideSlides[guideStep].quickRef.map((item, i) => (
                                    <div key={i} className="guide-quickref-item">
                                        <span className="guide-quickref-icon">{item.icon}</span>
                                        <div>
                                            <div className="guide-quickref-label">{item.label}</div>
                                            <div className="guide-quickref-desc">{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="guide-highlight">
                            💡 {guideSlides[guideStep].highlight}
                        </div>

                        <div className="guide-nav">
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={() => setGuideStep(Math.max(0, guideStep - 1))}
                                disabled={guideStep === 0}
                            >
                                ← Back
                            </button>
                            <span className="guide-step-label">{guideStep + 1} / {guideSlides.length}</span>
                            {guideStep < guideSlides.length - 1 ? (
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setGuideStep(guideStep + 1)}
                                >
                                    Next →
                                </button>
                            ) : (
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => setShowGuide(false)}
                                >
                                    Got It! ✓
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ---- Toast Notification ---- */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}

export default App
