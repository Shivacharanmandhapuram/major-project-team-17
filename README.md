# AI Voice EMR System with Blockchain Integrity

This project is an AI-powered Voice Electronic Medical Record (EMR) system integrated with a blockchain for data integrity.

## Project Structure

- `backend/`: Node.js Express server handling webhooks, EMR creation, and blockchain interaction.
- `frontend/`: React-based Doctor Dashboard for viewing transcripts and managing EMRs.
- `contracts/`: Solidity smart contracts for storing EMR hashes on the blockchain.

## Features

- Voice-to-EMR transcription using ElevenLabs and LiveKit.
- Doctor dashboard for reviewing and approving EMRs.
- SHA256 hashing for EMR data.
- Blockchain integration (Ganache) for immutable hash storage.
- Verification system to ensure EMR integrity.
