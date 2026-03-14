// =============================================
// EMR Routes
// =============================================
// CRUD endpoints for Electronic Medical Records.
// Handles creating, reading, updating, and
// approving EMR records.
// =============================================

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { generateHash } = require('../utils/hashUtil');
const { getContract } = require('../config/blockchainClient');

/**
 * GET /api/emr
 * Fetch all EMR records (for the dashboard)
 */
router.get('/emr', async (req, res) => {
    try {
        if (!supabase) {
            return res.json({
                success: true,
                message: 'Database not configured — returning sample data',
                records: getSampleRecords(),
            });
        }

        const { data, error } = await supabase
            .from('emr_records')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, records: data });
    } catch (error) {
        console.error('Fetch EMR error:', error);
        res.status(500).json({ error: 'Failed to fetch records', details: error.message });
    }
});

/**
 * GET /api/emr/:recordId
 * Fetch a single EMR record by ID
 */
router.get('/emr/:recordId', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { data, error } = await supabase
            .from('emr_records')
            .select('*')
            .eq('record_id', req.params.recordId)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Record not found' });

        res.json({ success: true, record: data });
    } catch (error) {
        console.error('Fetch single EMR error:', error);
        res.status(500).json({ error: 'Failed to fetch record', details: error.message });
    }
});

/**
 * PUT /api/emr/:recordId
 * Update an EMR record (doctor edits before approval)
 */
router.put('/emr/:recordId', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { patient_name, age, symptoms, diagnosis, prescription } = req.body;

        const { data, error } = await supabase
            .from('emr_records')
            .update({ patient_name, age, symptoms, diagnosis, prescription })
            .eq('record_id', req.params.recordId)
            .select();

        if (error) throw error;

        res.json({ success: true, message: 'Record updated', record: data[0] });
    } catch (error) {
        console.error('Update EMR error:', error);
        res.status(500).json({ error: 'Failed to update record', details: error.message });
    }
});

/**
 * POST /api/approve-emr/:recordId
 * Doctor approves an EMR record.
 * This triggers:
 * 1. SHA256 hash generation
 * 2. Blockchain storage
 * 3. Database update with hash and txHash
 */
router.post('/approve-emr/:recordId', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        // Step 1: Fetch the record
        const { data: record, error: fetchError } = await supabase
            .from('emr_records')
            .select('*')
            .eq('record_id', req.params.recordId)
            .single();

        if (fetchError) throw fetchError;
        if (!record) return res.status(404).json({ error: 'Record not found' });

        if (record.status === 'approved') {
            return res.status(400).json({ error: 'Record already approved' });
        }

        // Step 2: Generate SHA256 hash
        const sha256Hash = generateHash(record);
        console.log(`🔒 SHA256 hash generated: ${sha256Hash}`);

        // Step 3: Store hash on blockchain (if configured)
        let blockchainTxHash = null;
        try {
            const contract = getContract();
            const tx = await contract.storeHash(record.record_id, sha256Hash);
            const receipt = await tx.wait();
            blockchainTxHash = receipt.hash;
            console.log(`⛓️  Blockchain tx: ${blockchainTxHash}`);
        } catch (bcError) {
            console.warn('⚠️  Blockchain not available:', bcError.message);
            console.warn('   EMR will be approved without blockchain verification.');
        }

        // Step 4: Update the database
        const { data: updated, error: updateError } = await supabase
            .from('emr_records')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                sha256_hash: sha256Hash,
                blockchain_tx_hash: blockchainTxHash,
            })
            .eq('record_id', req.params.recordId)
            .select();

        if (updateError) throw updateError;

        res.json({
            success: true,
            message: 'EMR approved successfully',
            record: updated[0],
            blockchain: {
                hash: sha256Hash,
                txHash: blockchainTxHash,
                stored: blockchainTxHash !== null,
            },
        });

    } catch (error) {
        console.error('Approve EMR error:', error);
        res.status(500).json({ error: 'Failed to approve record', details: error.message });
    }
});

/**
 * POST /api/create-emr
 * Manually create an EMR record (for testing)
 */
router.post('/create-emr', async (req, res) => {
    try {
        const { patient_name, age, symptoms, diagnosis, prescription, transcript, doctor_id } = req.body;

        if (!patient_name || !symptoms) {
            return res.status(400).json({ error: 'patient_name and symptoms are required' });
        }

        const recordId = `EMR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

        const emrRecord = {
            record_id: recordId,
            patient_name,
            age: age || null,
            symptoms,
            diagnosis: diagnosis || 'Pending doctor review',
            prescription: prescription || 'Pending doctor review',
            transcript: transcript || 'Manual entry',
            doctor_id: doctor_id || 'DR-001',
            status: 'pending_review',
            confidence_score: 100, // Manual entry = full confidence
            created_at: new Date().toISOString(),
            approved_at: null,
            sha256_hash: null,
            blockchain_tx_hash: null,
        };

        if (supabase) {
            const { data, error } = await supabase
                .from('emr_records')
                .insert([emrRecord])
                .select();

            if (error) throw error;
            return res.json({ success: true, message: 'EMR created', record: data[0] });
        }

        res.json({ success: true, message: 'EMR created (no DB)', record: emrRecord });
    } catch (error) {
        console.error('Create EMR error:', error);
        res.status(500).json({ error: 'Failed to create record', details: error.message });
    }
});

/**
 * Sample data for when DB is not connected
 */
function getSampleRecords() {
    return [
        {
            record_id: 'EMR-SAMPLE-001',
            patient_name: 'John Smith',
            age: 45,
            symptoms: 'headache, fever (severity: severe) (duration: 3 days)',
            diagnosis: 'Acute viral infection',
            prescription: 'Paracetamol 500mg, Rest',
            transcript: 'Hello, my name is John Smith. I am 45 years old. I have been experiencing severe headache and fever for the past 3 days.',
            doctor_id: 'DR-001',
            status: 'pending_review',
            confidence_score: 85,
            created_at: new Date().toISOString(),
            approved_at: null,
            sha256_hash: null,
            blockchain_tx_hash: null,
        },
        {
            record_id: 'EMR-SAMPLE-002',
            patient_name: 'Sarah Johnson',
            age: 32,
            symptoms: 'cough, sore throat, runny nose (duration: 1 week)',
            diagnosis: 'Common cold',
            prescription: 'Cough syrup, Vitamin C',
            transcript: 'Hi, this is Sarah Johnson. I am 32 years old. I have had a cough and sore throat with a runny nose for the past 1 week.',
            doctor_id: 'DR-001',
            status: 'approved',
            confidence_score: 90,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            approved_at: new Date().toISOString(),
            sha256_hash: 'a1b2c3d4e5f6...',
            blockchain_tx_hash: '0xabc123...',
        },
    ];
}

module.exports = router;
