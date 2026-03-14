// =============================================
// ElevenLabs / LiveKit Webhook Routes
// =============================================
// Handles incoming webhook calls from ElevenLabs
// when a patient call ends. Receives the transcript
// and triggers EMR extraction.
// =============================================

const express = require('express');
const router = express.Router();
const { extractEMRFromTranscript } = require('../utils/nlpExtractor');
const supabase = require('../config/supabaseClient');

/**
 * POST /api/elevenlabs-webhook
 * ElevenLabs sends call data here when a call ends.
 * We extract EMR fields from the transcript and store them.
 */
router.post('/elevenlabs-webhook', async (req, res) => {
    try {
        console.log('📞 ElevenLabs webhook received');

        // ElevenLabs POSTs the transcript to this webhook when the call finishes
        const { transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'No transcript provided' });
        }

        // We will do NLP extraction in Phase 6. For now, just logging:
        console.log("Transcript:", transcript);

        res.json({
            success: true,
            message: 'Webhook received successfully',
            status: 'pending_nlp_extraction'
        });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed', details: error.message });
    }
});

module.exports = router;
