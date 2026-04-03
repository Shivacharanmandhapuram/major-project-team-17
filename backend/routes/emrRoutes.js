const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const crypto = require('crypto');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * POST /api/emr-summary
 * Receives the JSON summary directly from LiveKit Cloud's End Call Call Summary tool.
 * 
 * Expected payload:
 * {
 *   "job_id": "...",
 *   "room_id": "...",
 *   "summary": "{...JSON String...}"
 * }
 */
router.post('/emr-summary', async (req, res) => {
    try {
        console.log('\n=======================================');
        console.log('📞 CALL SUMMARY RECEIVED!');
        console.log('=======================================\n');

        // Acknowledge quickly to LiveKit
        res.status(200).json({ received: true });

        const { job_id, room_id, summary } = req.body;

        if (!summary) {
            console.log('⚠️ No summary found in the payload.');
            return;
        }

        console.log('--- RAW SUMMARY STRING ---');
        console.log(summary);
        console.log('--------------------------\n');

        // Attempt to parse the summary string into an actual JSON object
        let emrData;
        try {
            // Sometimes models wrap JSON in markdown blocks like ```json ... ```
            // This cleans it up if necessary.
            let cleanSummary = summary.replace(/```json/g, '').replace(/```/g, '').trim();
            emrData = JSON.parse(cleanSummary);

            console.log('✅ SUCCESSFULLY PARSED EMR JSON:');
            console.dir(emrData, { depth: null, colors: true });

            // Ensure the record has an ID
            const recordId = `EMR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

            // -----------------------------------------------------------------
            // STEP 8 & 9: HASH GENERATION & BLOCKCHAIN STORAGE
            // -----------------------------------------------------------------
            let sha256Hash = null;
            let txHash = null;

            try {
                // Generate deterministic SHA256 Hash of the JSON by sorting keys
                const sortedKeys = Object.keys(emrData).sort();
                const jsonString = JSON.stringify(emrData, sortedKeys);
                sha256Hash = crypto.createHash('sha256').update(jsonString).digest('hex');
                console.log(`🔒 EMR SHA256 Hash Generated: ${sha256Hash}`);

                // Connect to Ganache
                if (process.env.CONTRACT_ADDRESS && process.env.CONTRACT_ADDRESS !== 'your_contract_address_here') {
                    const provider = new ethers.JsonRpcProvider(process.env.GANACHE_RPC_URL);
                    const wallet = new ethers.Wallet(process.env.GANACHE_PRIVATE_KEY, provider);

                    // Load the ABI that was generated when we deployed the contract
                    const abiPath = path.resolve(__dirname, '..', 'EMRHashRegistry.json');
                    const contractAbi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

                    // Create contract instance
                    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractAbi, wallet);

                    console.log('⛓️  Sending hash to Ganache blockchain...');
                    const tx = await contract.storeHash(recordId, sha256Hash);
                    await tx.wait(); // Wait for transaction confirmation

                    txHash = tx.hash;
                    console.log(`✅ Hash immutably stored on blockchain! TX: ${txHash}`);
                }
            } catch (chainError) {
                console.error('❌ Blockchain/Hashing Error:', chainError.message);
            }

            // Ensure the record has an ID
            const record = {
                record_id: recordId,
                patient_name: emrData.patient_name || 'Unknown',
                age: emrData.age || 0,
                symptoms: emrData.symptoms || [],
                duration: emrData.duration || 'Unknown',
                medical_history: emrData.medical_history || 'None',
                diagnosis_guess: emrData.diagnosis_guess || 'Pending',
                recommended_action: emrData.recommended_action || 'Pending',
                appointment_date: emrData.appointment_date || null,
                appointment_time: emrData.appointment_time || null,
                summary_json: emrData,
                sha256_hash: sha256Hash,
                blockchain_tx_hash: txHash,
                created_at: new Date().toISOString()
            };

            if (record.appointment_date) {
                console.log(`📅 Appointment scheduled: ${record.appointment_date} at ${record.appointment_time}`);
            }

            // Save to Supabase
            if (supabase) {
                const { data, error } = await supabase
                    .from('emr_records')
                    .insert([record])
                    .select();

                if (error) {
                    console.error('❌ Supabase DB Error:', error.message);
                } else {
                    console.log(`✅ EMR saved to Supabase! Record ID: ${recordId}`);
                }
            } else {
                console.log('⚠️ Supabase client not initialized. Cannot save to DB.');
            }

        } catch (parseError) {
            console.error('❌ Failed to parse summary as JSON. Verify your LiveKit LLM instructions returning strict JSON.');
            console.error(parseError.message);
            return;
        }

    } catch (error) {
        console.error('Webhook error:', error);
    }
});

// -----------------------------------------------
// GET /api/emr — Fetch all EMR records from Supabase
// -----------------------------------------------
router.get('/emr', async (req, res) => {
    try {
        // No-cache so the browser always gets fresh records, not 304
        res.set('Cache-Control', 'no-store');
        const { data, error } = await supabase
            .from('emr_records')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, records: data || [] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// -----------------------------------------------
// GET /api/emr/:id — Fetch a single EMR record
// -----------------------------------------------
router.get('/emr/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('emr_records')
            .select('*')
            .eq('record_id', req.params.id)
            .single();

        if (error) throw error;
        res.json({ success: true, record: data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// -----------------------------------------------
// PUT /api/emr/:id — Update an EMR record (Doctor edits)
// -----------------------------------------------
router.put('/emr/:id', async (req, res) => {
    try {
        const updates = req.body;
        const { data, error } = await supabase
            .from('emr_records')
            .update(updates)
            .eq('record_id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, record: data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// -----------------------------------------------
// POST /api/approve-emr/:id — Doctor approves the EMR
// -----------------------------------------------
router.post('/approve-emr/:id', async (req, res) => {
    try {
        const { data: existing, error: fetchError } = await supabase
            .from('emr_records')
            .select('*')
            .eq('record_id', req.params.id)
            .single();

        if (fetchError) throw fetchError;
        if (!existing) return res.status(404).json({ success: false, error: 'Record not found' });

        const { data, error } = await supabase
            .from('emr_records')
            .update({ status: 'approved' })
            .eq('record_id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        console.log(`✅ EMR ${req.params.id} approved by doctor.`);
        res.json({ success: true, record: data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// -----------------------------------------------
// GET /api/appointments — All records with appointments
// -----------------------------------------------
router.get('/appointments', async (req, res) => {
    try {
        res.set('Cache-Control', 'no-store');
        const { data, error } = await supabase
            .from('emr_records')
            .select('*')
            .not('appointment_date', 'is', null)
            .order('appointment_date', { ascending: true });

        if (error) throw error;
        res.json({ success: true, appointments: data || [] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
