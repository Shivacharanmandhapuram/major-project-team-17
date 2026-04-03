# AI Voice EMR Blockchain System

A complete end-to-end prototype for an **Artificial Intelligence Voice Electronic Medical Record Based on Blockchain**.

This system allows a patient to call a clinic, speak naturally with an AI receptionist, and have their conversation automatically transcribed, summarized, and structured into a medical record. The doctor can then review the draft, approve it, and lock its integrity permanently using a local Ganache blockchain.

## Features

- **🗣️ Natural Voice AI:** Built natively on LiveKit's Cloud Agent using Gemini 3 Flash and Deepgram STT.
- **⚡ Real-time EMR Generation:** Automatic extraction of Patient Name, Age, Symptoms, and Diagnosis.
- **🔒 Blockchain Security:** SHA-256 Hashes of every approved EMR are stored immutably on a local Ethereum blockchain (Ganache).
- **🛡️ Zero-Trust Verification:** Doctors can verify the cryptographic integrity of any record directly from the dashboard with a single click.
- **🏥 Beautiful UI:** A modern, dark-themed React dashboard with glassmorphism and integrated doctor tutorials.
- **📅 Appointment Booking:** Integrated AI capability to inquire about schedule preferences and manage appointments automatically in the Doctor Dashboard.

## Technology Stack

- **Voice/Telephony:** LiveKit
- **LLM for NLP:** Google Gemini 3 Flash
- **STT:** Deepgram
- **TTS:** ElevenLabs
- **communication between backend and LiveKit:** cloudflare tunnels
- **Backend:** Node.js, Express
- **Database:** Supabase (PostgreSQL)
- **Blockchain:** Ganache (Local RPC), Solidity, Ethers.js
- **Frontend:** React (Vite), CSS3 Glassmorphism

## System Flow & Architecture

For a detailed technical breakdown and Mermaid UML flowcharts, see the [Architecture Documentation](architecture.md).

1. **Patient Call:** The patient calls the LiveKit-provisioned phone number.
2. **AI Action:** The LiveKit conducts the interview and extracts a structured JSON summary.
3. **Webhook:** LiveKit sends the JSON to our Node.js Backend via a Cloudflare Tunnel.
4. **Database:** The backend saves the draft EMR into Supabase as `pending_review`.
5. **Dashboard:** The React frontend auto-refreshes every 15 seconds to display the new record.
6. **Approval & Hash:** The doctor hits "Approve". The backend generates a SHA-256 hash of the JSON data and sends it to the Ganache smart contract.
7. **Verification:** At any time, the doctor clicks "Verify". The backend recalculates the hash and compares it against the Ganache blockchain to prove the record has not been tampered with.

## Project Structure

```
voice-emr-blockchain/
├── backend/                  # Node.js + Express API
│   ├── routes/               # emrRoutes, blockchainRoutes
│   ├── config/               # Supabase & Ethers.js configuration
│   ├── EMRHashRegistry.sol   # Solidity Smart Contract
│   └── server.js             # Main Express server entry point
├── frontend/                 # React + Vite Doctor Dashboard
│   ├── src/                  
│   │   ├── App.jsx           # Main Dashboard UI & Logic
│   │   ├── index.css         # Design System & Styling
│   │   └── main.jsx          # React entry
│   └── package.json          
├── architecture.md           # detailed UML sequence diagrams
└── debugging_rules.md        # AI Agent startup instructions
```

## Setup & Running

This project uses a specialized startup sequence. Do **not** manually start these services. 

Instead, ask the AI Assistant:
> *"Run debugging rules and ensure the system is up"*

The AI will automatically:
1. Verify **Ganache** is running on port 7545.
2. Start the **Backend API** on port 5001.
3. Start a fresh **Cloudflare Tunnel** and grab the Webhook URL.
4. Start the **React Frontend** on port 5174.

*Note: You must paste the newly generated Cloudflare Tunnel URL into your LiveKit Dashboard's Webhook settings before testing incoming calls.*
