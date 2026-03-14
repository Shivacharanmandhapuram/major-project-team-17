// =============================================
// Blockchain Routes
// =============================================
// Endpoints for blockchain verification.
// Compares current EMR hash with the hash stored
// on the blockchain to detect tampering.
// =============================================

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { generateHash, verifyHash } = require('../utils/hashUtil');
const { getContract } = require('../config/blockchainClient');

/**
 * POST /api/verify-record
 * Verify the integrity of an EMR record:
 * 1. Fetch the record from the database
 * 2. Recompute the SHA256 hash from current data
 * 3. Fetch the hash stored on the blockchain
 * 4. Compare both hashes
 * 5. Return VERIFIED or TAMPERED
 */
router.post('/verify-record', async (req, res) => {
    try {
        const { record_id } = req.body;

        if (!record_id) {
            return res.status(400).json({ error: 'record_id is required' });
        }

        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        // Step 1: Fetch the record
        const { data: record, error: fetchError } = await supabase
            .from('emr_records')
            .select('*')
            .eq('record_id', record_id)
            .single();

        if (fetchError) throw fetchError;
        if (!record) return res.status(404).json({ error: 'Record not found' });

        if (record.status !== 'approved') {
            return res.status(400).json({
                error: 'Record not yet approved',
                status: record.status,
            });
        }

        // Step 2: Recompute hash from current data
        const currentHash = generateHash(record);

        // Step 3: Compare with stored database hash
        const dbHashMatch = currentHash === record.sha256_hash;

        // Step 4: Try to verify against blockchain
        let blockchainHash = null;
        let blockchainMatch = null;

        try {
            const contract = getContract();
            blockchainHash = await contract.getHash(record_id);
            blockchainMatch = currentHash === blockchainHash;
        } catch (bcError) {
            console.warn('⚠️  Blockchain verification not available:', bcError.message);
        }

        // Step 5: Determine overall integrity status
        const isVerified = dbHashMatch && (blockchainMatch === null || blockchainMatch === true);
        const status = isVerified ? 'VERIFIED' : 'TAMPERED';

        console.log(`🔍 Verification for ${record_id}: ${status}`);

        res.json({
            success: true,
            verification: {
                record_id,
                status,
                current_hash: currentHash,
                database_hash: record.sha256_hash,
                database_match: dbHashMatch,
                blockchain_hash: blockchainHash,
                blockchain_match: blockchainMatch,
                blockchain_tx_hash: record.blockchain_tx_hash,
                verified_at: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Verify record error:', error);
        res.status(500).json({ error: 'Verification failed', details: error.message });
    }
});

/**
 * GET /api/blockchain/status
 * Check if the blockchain connection is working
 */
router.get('/blockchain/status', async (req, res) => {
    try {
        const { getBlockchainProvider } = require('../config/blockchainClient');
        const provider = getBlockchainProvider();
        const blockNumber = await provider.getBlockNumber();
        const network = await provider.getNetwork();

        res.json({
            success: true,
            blockchain: {
                connected: true,
                blockNumber: Number(blockNumber),
                chainId: Number(network.chainId),
                rpcUrl: process.env.GANACHE_RPC_URL || 'http://127.0.0.1:7545',
            },
        });
    } catch (error) {
        res.json({
            success: false,
            blockchain: {
                connected: false,
                error: error.message,
                hint: 'Make sure Ganache is running on the configured RPC URL',
            },
        });
    }
});

module.exports = router;
