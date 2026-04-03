const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const crypto = require('crypto');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * POST /api/verify-record
 * Verifies if an EMR record has been tampered with by comparing
 * its current JSON payload hash against the hash stored on Ganache.
 */
router.post('/verify-record', async (req, res) => {
    try {
        const { record_id } = req.body;

        if (!record_id) {
            return res.status(400).json({ error: 'record_id is required' });
        }

        console.log(`\n🔍 Verifying Record Integrity: ${record_id}`);

        // 1. Fetch EMR from Supabase
        const { data: emrData, error } = await supabase
            .from('emr_records')
            .select('*')
            .eq('record_id', record_id)
            .single();

        if (error || !emrData) {
            console.error('❌ Record not found in database.');
            return res.status(404).json({ error: 'Record not found in database' });
        }

        console.log(`✅ Found record in Supabase. Recomputing hash...`);

        // 2. Recompute the hash deterministically
        // Note: we only hash the summary_json field, sorting its keys
        const sortedKeys = Object.keys(emrData.summary_json).sort();
        const jsonString = JSON.stringify(emrData.summary_json, sortedKeys);
        const computedHash = crypto.createHash('sha256').update(jsonString).digest('hex');
        
        console.log(`   - Computed Hash: ${computedHash}`);

        // 3. Get the hash from Ganache blockchain
        let blockchainHash = null;
        if (process.env.CONTRACT_ADDRESS && process.env.CONTRACT_ADDRESS !== 'your_contract_address_here') {
            try {
                const provider = new ethers.JsonRpcProvider(process.env.GANACHE_RPC_URL);
                const abiPath = path.resolve(__dirname, '..', 'EMRHashRegistry.json');
                const contractAbi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
                
                // We don't need a wallet since getHash is a 'view' function, provider is enough
                const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractAbi, provider);

                blockchainHash = await contract.getHash(record_id);
                console.log(`   - Ganache Hash:  ${blockchainHash}`);
            } catch (err) {
                console.error('❌ Failed to fetch hash from Ganache.', err.message);
                return res.status(500).json({ error: 'Failed to connect to blockchain' });
            }
        } else {
            console.error('❌ Blockchain contract address not configured.');
            return res.status(500).json({ error: 'Blockchain not configured' });
        }

        // 4. Compare
        const isVerified = (computedHash === blockchainHash);

        if (isVerified) {
            console.log(`✅ INTEGRITY INTACT: The record is authentic and untampered!\n`);
            return res.json({
                status: 'VERIFIED',
                message: 'Record integrity verified. Hash matches the blockchain.',
                computed_hash: computedHash,
                blockchain_hash: blockchainHash
            });
        } else {
            console.log(`🚨 TAMPERED DETECTED: The hashes do not match!\n`);
            return res.json({
                status: 'TAMPERED',
                message: 'Record has been tampered with! Hashes do not match.',
                computed_hash: computedHash,
                blockchain_hash: blockchainHash
            });
        }

    } catch (error) {
        console.error('❌ Verification Endpoint Error:', error);
        res.status(500).json({ error: 'Internal server error while verifying record' });
    }
});

module.exports = router;
