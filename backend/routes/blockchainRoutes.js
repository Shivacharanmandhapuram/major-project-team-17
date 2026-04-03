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
