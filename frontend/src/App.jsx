// =============================================
// AI Voice EMR Blockchain — Doctor Dashboard
// =============================================
// Main React application component. This is the
// Doctor Dashboard where all the magic happens.
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
    const [simulateText, setSimulateText] = useState('');
    const [showSimulate, setShowSimulate] = useState(false);

    // Fetch records on mount
    useEffect(() => {
        fetchRecords();
        checkBackendStatus();
        checkBlockchainStatus();
    }, []);

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    const checkBackendStatus = async () => {
        try {
            const res = await fetch(`${API_URL.replace('/api', '')}/`);
            if (res.ok) setBackendStatus('online');
            else setBackendStatus('offline');
        } catch {
            setBackendStatus('offline');
        }
    };

    const checkBlockchainStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/blockchain/status`);
            const data = await res.json();
            setBlockchainStatus(data.blockchain);
        } catch {
            setBlockchainStatus({ connected: false });
        }
    };

    const fetchRecords = async () => {
        try {
            const res = await fetch(`${API_URL}/emr`);
            const data = await res.json();
            if (data.success) {
                setRecords(data.records || []);
            }
        } catch (err) {
            console.error('Failed to fetch records:', err);
        }
    };

    const selectRecord = (record) => {
        setSelectedRecord(record);
        setEditForm({
            patient_name: record.patient_name || '',
            age: record.age || '',
            symptoms: record.symptoms || '',
            diagnosis: record.diagnosis || '',
            prescription: record.prescription || '',
        });
        setVerification(null);
    };

    const handleEditChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const handleUpdateRecord = async () => {
        if (!selectedRecord) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/emr/${selectedRecord.record_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Record updated successfully', 'success');
                fetchRecords();
                setSelectedRecord({ ...selectedRecord, ...editForm });
            } else {
                showToast(data.error || 'Update failed', 'error');
            }
        } catch (err) {
            showToast('Failed to connect to server', 'error');
        }
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
                showToast('✅ EMR approved and stored on blockchain!', 'success');
                fetchRecords();
                setSelectedRecord(data.record);
            } else {
                showToast(data.error || 'Approval failed', 'error');
            }
        } catch (err) {
            showToast('Failed to connect to server', 'error');
        }
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
            if (data.success) {
                setVerification(data.verification);
                showToast(
                    data.verification.status === 'VERIFIED' ? '✅ Record verified!' : '⚠️ Record may be tampered!',
                    data.verification.status === 'VERIFIED' ? 'success' : 'error'
                );
            } else {
                showToast(data.error || 'Verification failed', 'error');
            }
        } catch (err) {
            showToast('Failed to connect to server', 'error');
        }
        setLoading(false);
    };

    const handleSimulateCall = async () => {
        if (!simulateText.trim()) {
            showToast('Please enter a transcript', 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/simulate-call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: simulateText }),
            });
            const data = await res.json();
            if (data.success) {
                showToast('📞 Call simulated! EMR created.', 'success');
                fetchRecords();
                selectRecord(data.record);
                setSimulateText('');
                setShowSimulate(false);
            } else {
                showToast(data.error || 'Simulation failed', 'error');
            }
        } catch (err) {
            showToast('Failed to connect to server', 'error');
        }
        setLoading(false);
    };

    const getConfidenceClass = (score) => {
        if (score >= 70) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    };

    const pendingCount = records.filter(r => r.status === 'pending_review').length;
    const approvedCount = records.filter(r => r.status === 'approved').length;
    const verifiedCount = records.filter(r => r.blockchain_tx_hash).length;

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
                    <button className="btn btn-primary btn-sm" onClick={() => setShowSimulate(!showSimulate)}>
                        📞 Simulate Call
                    </button>
                </div>
            </nav>

            {/* ---- Simulate Call Modal ---- */}
            {showSimulate && (
                <div style={{
                    padding: '16px 32px',
                    background: 'rgba(59, 130, 246, 0.05)',
                    borderBottom: '1px solid var(--border-subtle)',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <span className="card-title-icon">📞</span>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Simulate Patient Call</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Paste a conversation transcript below</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <textarea
                                className="form-textarea"
                                style={{ flex: 1, minHeight: '60px' }}
                                placeholder="Hello, my name is John Smith. I am 45 years old. I have been experiencing severe headache and fever for the past 3 days. I also have a cough and sore throat."
                                value={simulateText}
                                onChange={(e) => setSimulateText(e.target.value)}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button className="btn btn-success btn-sm" onClick={handleSimulateCall} disabled={loading}>
                                    {loading ? <span className="spinner"></span> : '🎯'} Process
                                </button>
                                <button className="btn btn-outline btn-sm" onClick={() => setShowSimulate(false)}>
                                    ✕ Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ---- Main Content ---- */}
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
                        <div className="stat-value">{verifiedCount}</div>
                    </div>
                </div>

                {/* Left Column — Records List & Transcript */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Records List */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <span className="card-title-icon">📋</span>
                                EMR Records
                            </div>
                            <button className="btn btn-outline btn-sm" onClick={fetchRecords}>↻ Refresh</button>
                        </div>
                        <div className="card-body">
                            {records.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">📋</div>
                                    <div className="empty-state-title">No Records Yet</div>
                                    <div className="empty-state-text">
                                        Use "Simulate Call" to create your first EMR record from a conversation transcript.
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
                                                <div className="record-name">{record.patient_name}</div>
                                                <div className="record-meta">
                                                    <span>ID: {record.record_id}</span>
                                                    <span>Age: {record.age || 'N/A'}</span>
                                                    <span>Confidence: {record.confidence_score}%</span>
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

                    {/* Transcript Viewer */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <span className="card-title-icon">🎙️</span>
                                Conversation Transcript
                            </div>
                        </div>
                        <div className="card-body">
                            {selectedRecord ? (
                                <div className="transcript-content">{selectedRecord.transcript}</div>
                            ) : (
                                <div className="transcript-empty">
                                    <div className="transcript-empty-icon">🎙️</div>
                                    <p>Select a record to view the transcript</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column — EMR Editor & Verification */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* EMR Editor */}
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
                                    {/* Confidence Score */}
                                    <div className="form-group">
                                        <div className="form-label">
                                            NLP Confidence: {selectedRecord.confidence_score}%
                                        </div>
                                        <div className="confidence-bar">
                                            <div
                                                className={`confidence-fill ${getConfidenceClass(selectedRecord.confidence_score)}`}
                                                style={{ width: `${selectedRecord.confidence_score}%` }}
                                            />
                                        </div>
                                    </div>

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

                                    <div className="form-group">
                                        <label className="form-label">Symptoms</label>
                                        <textarea
                                            className="form-textarea"
                                            value={editForm.symptoms}
                                            onChange={(e) => handleEditChange('symptoms', e.target.value)}
                                            disabled={selectedRecord.status === 'approved'}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Diagnosis</label>
                                        <textarea
                                            className="form-textarea"
                                            value={editForm.diagnosis}
                                            onChange={(e) => handleEditChange('diagnosis', e.target.value)}
                                            disabled={selectedRecord.status === 'approved'}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Prescription</label>
                                        <textarea
                                            className="form-textarea"
                                            value={editForm.prescription}
                                            onChange={(e) => handleEditChange('prescription', e.target.value)}
                                            disabled={selectedRecord.status === 'approved'}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="btn-group">
                                        {selectedRecord.status !== 'approved' && (
                                            <>
                                                <button className="btn btn-primary" onClick={handleUpdateRecord} disabled={loading}>
                                                    {loading ? <span className="spinner"></span> : '💾'} Save Changes
                                                </button>
                                                <button className="btn btn-success" onClick={handleApprove} disabled={loading}>
                                                    {loading ? <span className="spinner"></span> : '✓'} Approve & Store on Blockchain
                                                </button>
                                            </>
                                        )}
                                        {selectedRecord.status === 'approved' && (
                                            <button className="btn btn-primary" onClick={handleVerify} disabled={loading}>
                                                {loading ? <span className="spinner"></span> : '🔍'} Verify Integrity
                                            </button>
                                        )}
                                    </div>

                                    {/* Hash Info (if approved) */}
                                    {selectedRecord.sha256_hash && (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '12px',
                                            background: 'var(--bg-glass)',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--border-subtle)',
                                            fontSize: '12px'
                                        }}>
                                            <div style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>SHA256 Hash</div>
                                            <div style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', wordBreak: 'break-all', fontSize: '11px' }}>
                                                {selectedRecord.sha256_hash}
                                            </div>
                                            {selectedRecord.blockchain_tx_hash && (
                                                <>
                                                    <div style={{ color: 'var(--text-muted)', marginTop: '10px', marginBottom: '6px' }}>Blockchain TX</div>
                                                    <div style={{ fontFamily: 'monospace', color: 'var(--accent-purple)', wordBreak: 'break-all', fontSize: '11px' }}>
                                                        {selectedRecord.blockchain_tx_hash}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-state-icon">📝</div>
                                    <div className="empty-state-title">No Record Selected</div>
                                    <div className="empty-state-text">
                                        Select a record from the list to view and edit the EMR details.
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
                                    Verification Result
                                </div>
                            </div>
                            <div className="card-body">
                                <div className={`verification-result ${verification.status.toLowerCase()}`}>
                                    <div className={`verification-status ${verification.status.toLowerCase()}`}>
                                        {verification.status === 'VERIFIED' ? '✅' : '⚠️'} {verification.status}
                                    </div>
                                    <div className="verification-details">
                                        <div className="verification-row">
                                            <span className="label">Record ID</span>
                                            <span className="value">{verification.record_id}</span>
                                        </div>
                                        <div className="verification-row">
                                            <span className="label">Current Hash</span>
                                            <span className="value">{verification.current_hash}</span>
                                        </div>
                                        <div className="verification-row">
                                            <span className="label">Database Hash</span>
                                            <span className="value">{verification.database_hash}</span>
                                        </div>
                                        <div className="verification-row">
                                            <span className="label">DB Match</span>
                                            <span className="value">{verification.database_match ? '✅ Yes' : '❌ No'}</span>
                                        </div>
                                        {verification.blockchain_hash && (
                                            <>
                                                <div className="verification-row">
                                                    <span className="label">Blockchain Hash</span>
                                                    <span className="value">{verification.blockchain_hash}</span>
                                                </div>
                                                <div className="verification-row">
                                                    <span className="label">Blockchain Match</span>
                                                    <span className="value">{verification.blockchain_match ? '✅ Yes' : '❌ No'}</span>
                                                </div>
                                            </>
                                        )}
                                        <div className="verification-row">
                                            <span className="label">Verified At</span>
                                            <span className="value">{new Date(verification.verified_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

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
