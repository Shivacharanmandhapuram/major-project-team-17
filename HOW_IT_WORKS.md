# 🏥 AI Voice EMR System with Blockchain Integrity — Complete Project Guide

> **Team 17 — Major Project**
> This document explains EVERYTHING about our project — what it does, how every part works, the complete data flow, and answers to common viva questions.
> Read this document end-to-end and you will be fully prepared.

---

## Table of Contents

1. [Project Overview — The Big Picture](#1-project-overview--the-big-picture)
2. [Problem Statement — Why We Built This](#2-problem-statement--why-we-built-this)
3. [System Architecture — All the Pieces](#3-system-architecture--all-the-pieces)
4. [Complete Data Flow — Step by Step](#4-complete-data-flow--step-by-step)
5. [Technology Stack — What We Used & Why](#5-technology-stack--what-we-used--why)
6. [Component Deep Dive](#6-component-deep-dive)
   - 6.1 [Voice Agent (LiveKit Cloud + Python Agent)](#61-voice-agent-livekit-cloud--python-agent)
   - 6.2 [Backend Server (Node.js + Express)](#62-backend-server-nodejs--express)
   - 6.3 [Database (Supabase / PostgreSQL)](#63-database-supabase--postgresql)
   - 6.4 [Smart Contract (Solidity on Ganache)](#64-smart-contract-solidity-on-ganache)
   - 6.5 [Frontend Dashboard (React + Vite)](#65-frontend-dashboard-react--vite)
   - 6.6 [SHA256 Hashing — The Digital Fingerprint](#66-sha256-hashing--the-digital-fingerprint)
   - 6.7 [Blockchain Verification](#67-blockchain-verification)
7. [Folder Structure — What Each File Does](#7-folder-structure--what-each-file-does)
8. [API Endpoints — The Backend's Menu](#8-api-endpoints--the-backends-menu)
9. [Database Schema — The Table Structure](#9-database-schema--the-table-structure)
10. [How To Run The Project](#10-how-to-run-the-project)
11. [Viva Preparation — Expected Questions & Answers](#11-viva-preparation--expected-questions--answers)

---

## 1. Project Overview — The Big Picture

Our project is an **AI-powered medical record system** that:

1. **Talks to patients** via a phone call using an AI voice assistant
2. **Automatically creates** a structured Electronic Medical Record (EMR) from the conversation
3. **Lets the doctor review and approve** the EMR on a dashboard
4. **Locks the record permanently** on a blockchain so no one can tamper with it
5. **Verifies integrity** anytime — proving the record hasn't been changed

### One-Line Summary
> A patient calls a phone number → AI talks to them → creates medical record → doctor approves it → record is hashed and stored on blockchain → can be verified anytime.

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────┐
│   Patient    │────▶│  AI Voice    │────▶│   Backend    │────▶│  Database  │
│  (Phone)     │     │  Agent       │     │  (Node.js)   │     │ (Supabase) │
└─────────────┘     └──────────────┘     └──────┬───────┘     └────────────┘
                                                │
                                                ▼
                                         ┌──────────────┐     ┌────────────┐
                                         │  Blockchain  │◀────│  Doctor    │
                                         │  (Ganache)   │     │ Dashboard  │
                                         └──────────────┘     └────────────┘
```

---

## 2. Problem Statement — Why We Built This

### The Problem
- Traditional medical records are **paper-based or manually typed** — slow and error-prone.
- Records can be **tampered with** — a doctor, hospital, or hacker could change diagnosis/prescription data after the fact.
- There is **no easy way to prove** a medical record hasn't been altered.
- Phone consultations produce **no automatic documentation**.

### Our Solution
- **AI Voice Agent** eliminates manual data entry — the system listens and writes the record.
- **SHA256 Hashing** creates a unique digital fingerprint of each record.
- **Blockchain** stores that fingerprint permanently — it's immutable (cannot be changed).
- **Verification system** can compare the current record with the blockchain fingerprint at any time.

### Inspired By
The research paper: *"A Novel Artificial Intelligence Voice Electronic Medical Record Based on Blockchain"*

---

## 3. System Architecture — All the Pieces

```
                          ┌─────────────────────────────────────┐
                          │          LIVEKIT CLOUD               │
                          │  ┌───────────┐  ┌──────────────┐    │
  ┌──────────┐  Phone     │  │    STT    │  │   LLM AI     │    │
  │ Patient  │───Call─────▶│  │ (Deepgram)│─▶│(Gemini Flash)│    │
  │          │            │  └───────────┘  └──────┬───────┘    │
  └──────────┘            │  ┌───────────┐         │            │
                          │  │    TTS    │◀────────┘            │
                          │  │ (Cartesia)│                      │
                          │  └───────────┘                      │
                          │         │                           │
                          │         │ On Call End               │
                          │         ▼                           │
                          │  ┌──────────────┐                   │
                          │  │  Summarizer  │                   │
                          │  │(Gemini Flash)│                   │
                          │  └──────┬───────┘                   │
                          └─────────│───────────────────────────┘
                                    │ HTTP POST (JSON)
                                    ▼
                ┌───────────────────────────────────────┐
                │         BACKEND (Node.js/Express)      │
                │                                       │
                │  /api/emr-summary  ← receives data    │
                │  /api/emr          ← list records     │
                │  /api/approve-emr  ← doctor approves  │
                │  /api/verify-record← check integrity  │
                │  /api/blockchain/status                │
                └───────┬──────────────────┬────────────┘
                        │                  │
                        ▼                  ▼
              ┌──────────────┐     ┌──────────────┐
              │   SUPABASE   │     │   GANACHE    │
              │  (Postgres)  │     │ (Blockchain) │
              │              │     │              │
              │ emr_records  │     │ EMRHash      │
              │   table      │     │ Registry.sol │
              └──────────────┘     └──────────────┘
                        ▲
                        │ fetch records
              ┌──────────────┐
              │   FRONTEND   │
              │  (React App) │
              │              │
              │ Doctor sees  │
              │ records,     │
              │ edits, and   │
              │ approves     │
              └──────────────┘
```

### The 5 Main Components

| # | Component | Technology | Purpose |
|---|-----------|-----------|---------|
| 1 | **Voice Agent** | LiveKit Cloud + Python | Talks to patient on phone, collects symptoms |
| 2 | **Backend** | Node.js + Express | Receives data, talks to DB & blockchain |
| 3 | **Database** | Supabase (PostgreSQL) | Stores all EMR records |
| 4 | **Blockchain** | Ganache + Solidity | Stores SHA256 hashes permanently |
| 5 | **Frontend** | React + Vite | Doctor's dashboard to review/approve |

---

## 4. Complete Data Flow — Step by Step

### Phase A: Patient Calls → AI Captures Data

```
STEP 1: Patient dials the LiveKit phone number (+1-240-231-5068)
        │
        ▼
STEP 2: LiveKit routes the call to our Python agent running on LiveKit Cloud
        │
        ▼
STEP 3: The AI agent greets the patient:
        "Hello! Thank you for calling Maneesha's clinic."
        │
        ▼
STEP 4: The AI asks questions:
        - What is your name?
        - How old are you?
        - What symptoms are you experiencing?
        - How long have you been feeling this way?
        │
        ▼
STEP 5: Patient answers all questions. AI thanks them and ends the call.
```

### Phase B: Call Ends → EMR Created → Stored in DB + Blockchain

```
STEP 6: When the call ends, the agent's "on_session_end" function fires
        │
        ▼
STEP 7: A SUMMARIZER LLM (Gemini 3 Flash) reads the entire conversation
        and converts it into structured JSON:
        {
          "patient_name": "Rahul",
          "age": 32,
          "symptoms": ["fever", "headache"],
          "duration": "2 days",
          "medical_history": "none",
          "diagnosis_guess": "viral fever",
          "recommended_action": "consult doctor"
        }
        │
        ▼
STEP 8: This JSON is sent via HTTP POST to our backend:
        POST https://<our-tunnel-url>/api/emr-summary
        │
        ▼
STEP 9: Backend receives the JSON and:
        a) Generates SHA256 hash of the EMR data
        b) Sends hash to Ganache blockchain via smart contract
        c) Saves everything (EMR + hash + txHash) to Supabase
```

### Phase C: Doctor Reviews → Approves → Verifies

```
STEP 10: Doctor opens the React dashboard in their browser
         │
         ▼
STEP 11: Dashboard fetches all records from: GET /api/emr
         Records appear in the left panel
         │
         ▼
STEP 12: Doctor clicks a record → EMR Editor opens on the right
         Doctor can edit patient_name, age, symptoms, etc.
         │
         ▼
STEP 13: Doctor clicks "Save Changes" → PUT /api/emr/:id
         │
         ▼
STEP 14: Doctor clicks "Approve EMR" → POST /api/approve-emr/:id
         Record status changes from "pending_review" to "approved"
         │
         ▼
STEP 15: Doctor clicks "Verify Blockchain Integrity"
         → POST /api/verify-record
         │
         ▼
STEP 16: Backend:
         a) Fetches record from Supabase
         b) Recomputes SHA256 hash from current data
         c) Fetches original hash from blockchain
         d) Compares them
         │
         ▼
STEP 17: Returns VERIFIED ✅ (hashes match) or TAMPERED ⚠️ (hashes differ)
```

---

## 5. Technology Stack — What We Used & Why

| Technology | What It Is | Why We Chose It |
|-----------|-----------|----------------|
| **LiveKit Cloud** | Real-time voice/video platform with telephony | Handles phone calls, STT, TTS, and AI conversations without us building any of that |
| **Deepgram Nova 3** | Speech-to-Text (STT) engine | Highly accurate, real-time transcription of patient speech |
| **Google Gemini 2.5 Flash** | Large Language Model (LLM) | Powers the AI conversation with the patient — understands and responds intelligently |
| **Gemini 3 Flash** | LLM (for summarization) | Converts raw conversation into structured EMR JSON after the call ends |
| **Cartesia Sonic 3** | Text-to-Speech (TTS) engine | Converts AI's text responses into natural-sounding voice |
| **Node.js + Express** | JavaScript backend framework | Simple, fast, excellent for building REST APIs |
| **Supabase** | Cloud PostgreSQL database | Free, easy to use, provides instant REST API over Postgres |
| **Ganache** | Local Ethereum blockchain | Simulates a real blockchain on our computer for development |
| **Solidity** | Smart contract language | The standard language for writing Ethereum smart contracts |
| **ethers.js** | JavaScript library for Ethereum | Lets our Node.js backend talk to the Ganache blockchain |
| **React + Vite** | Frontend framework + build tool | Fast, modern way to build the doctor's dashboard UI |
| **SHA256** | Cryptographic hash function | Creates a unique 64-character fingerprint of any data |
| **Cloudflare Tunnel** | Secure public URL for localhost | Exposes our local backend to the internet so LiveKit can send webhooks |

---

## 6. Component Deep Dive

### 6.1 Voice Agent (LiveKit Cloud + Python Agent)

**File:** `medical-agent/agent.py`

#### What does this do?
This is the AI that **talks to the patient on the phone**. It:
1. Greets the patient
2. Asks for their name, age, symptoms, and duration
3. After the call ends, summarizes the conversation into structured JSON
4. Sends that JSON to our backend

#### Key Parts Explained:

```python
# The AI's personality and instructions
class DefaultAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions="""You are a helpful, professional, and empathetic 
            medical assistant for Maneesha's clinic.
            Your job is to ask the patient for their name, age, and symptoms.
            ..."""
        )
```
**What this does:** Tells the AI how to behave — like programming its personality.

```python
# When the call ends, this function runs automatically
async def _on_session_end_func(ctx: JobContext):
    # 1. Get conversation history
    report = ctx.make_session_report()
    
    # 2. Send it to a summarizer LLM
    summarizer = inference.LLM(model="google/gemini-3-flash")
    summary = await _summarize_session(summarizer, report.chat_history)
    
    # 3. Send the summary to our backend
    resp = await session.post(
        "https://<tunnel-url>/api/emr-summary",
        json=body
    )
```
**What this does:** After the patient hangs up, this automatically creates the EMR JSON and sends it to our server.

#### The AI Pipeline:

```
Patient speaks → Deepgram (STT) → Text → Gemini 2.5 Flash (LLM) → Response Text → Cartesia (TTS) → Voice → Patient hears
```

| Component | Role | Model Used |
|-----------|------|-----------|
| **STT** (Speech-to-Text) | Converts patient's voice → text | Deepgram Nova 3 |
| **LLM** (Language Model) | Thinks and generates responses | Gemini 2.5 Flash |
| **TTS** (Text-to-Speech) | Converts AI response → voice | Cartesia Sonic 3 |
| **Summarizer** | Converts conversation → EMR JSON | Gemini 3 Flash |

---

### 6.2 Backend Server (Node.js + Express)

**File:** `backend/server.js`

The backend is the **brain** of the system. It's the central hub that connects everything.

#### How Express Works (Simple Explanation):

Think of Express like a **restaurant**:
- The **server** is the restaurant building
- **Routes** are the menu items (each URL is a different dish)
- **Middleware** is the waiter (processes every request before it reaches the kitchen)
- **Request** is the customer's order
- **Response** is the food served back

```javascript
const express = require('express');   // Import Express
const app = express();                // Create the restaurant
app.use(cors());                      // Allow frontend to talk to us
app.use(express.json());              // Understand JSON data

// Route (menu item): When someone visits "/", return a welcome message
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

// Mount all routes
app.use('/api', emrRoutes);           // EMR-related endpoints
app.use('/api', blockchainRoutes);    // Blockchain-related endpoints
app.use('/api', verificationRoutes);  // Verification endpoints

app.listen(5001);                     // Open the restaurant on port 5001
```

#### Route Files:

| File | What It Handles |
|------|----------------|
| `routes/emrRoutes.js` | Receiving EMR data, listing records, updating records, approving records |
| `routes/blockchainRoutes.js` | Checking if Ganache blockchain is connected |
| `routes/verificationRoutes.js` | Verifying record integrity against blockchain |

---

### 6.3 Database (Supabase / PostgreSQL)

**Config File:** `backend/config/supabaseClient.js`

#### What is Supabase?
Supabase is a **cloud-hosted PostgreSQL database** with a nice dashboard. Think of it as a big spreadsheet in the cloud that our backend reads and writes to.

#### How we connect:
```javascript
const { createClient } = require('@supabase/supabase-js');

// These come from the .env file
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Create the client — this is our "connection" to the database
const supabase = createClient(supabaseUrl, supabaseKey);
```

#### Example: Saving a record
```javascript
const { data, error } = await supabase
    .from('emr_records')           // Which table
    .insert([record])              // Insert this data
    .select();                     // Return what was inserted
```

#### Example: Fetching all records
```javascript
const { data, error } = await supabase
    .from('emr_records')
    .select('*')                       // Get all columns
    .order('created_at', { ascending: false });  // Newest first
```

---

### 6.4 Smart Contract (Solidity on Ganache)

**File:** `contracts/EMRHashRegistry.sol`

#### What is a Smart Contract?
A smart contract is a **program that runs on the blockchain**. Once deployed, it cannot be changed. It's like carving something into stone — permanent.

#### Our Contract Explained Line by Line:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;          // Use Solidity version 0.8+

contract EMRHashRegistry {
    
    // A mapping is like a dictionary/hashmap
    // Key: Record ID (e.g., "EMR-12345")
    // Value: SHA256 Hash (e.g., "a1b2c3d4...")
    mapping(string => string) private emrHashes;
    
    // An event is like a log entry on the blockchain
    event HashStored(string recordId, string hashValue, uint256 timestamp);

    // FUNCTION 1: Store a hash
    function storeHash(string memory recordId, string memory hashValue) public {
        // Make sure we haven't already stored a hash for this record
        // (prevents overwriting — once stored, it's permanent!)
        require(bytes(emrHashes[recordId]).length == 0, 
                "Hash already exists for this Record ID");
        
        // Store the hash
        emrHashes[recordId] = hashValue;
        
        // Emit an event (like writing to a log)
        emit HashStored(recordId, hashValue, block.timestamp);
    }

    // FUNCTION 2: Retrieve a hash
    function getHash(string memory recordId) public view returns (string memory) {
        require(bytes(recordId).length > 0, "Record ID cannot be empty");
        return emrHashes[recordId];
    }
}
```

#### Why Can't the Hash Be Changed?
The `storeHash` function has this line:
```solidity
require(bytes(emrHashes[recordId]).length == 0, "Hash already exists");
```
This means: **if a hash already exists for this record ID, reject the transaction.** So once stored, it's there forever.

#### What is Ganache?
Ganache is a **local blockchain simulator** running on your computer. It behaves exactly like Ethereum but:
- It's free (no real ETH needed)
- It's fast (no waiting for miners)
- It runs on `http://127.0.0.1:7545`

#### How We Deploy the Contract:

**File:** `backend/deployContract.js`

```
1. Read the Solidity file (EMRHashRegistry.sol)
2. Compile it using the Solidity compiler (solc)
3. Connect to Ganache using ethers.js
4. Deploy the compiled contract to Ganache
5. Get the CONTRACT_ADDRESS (where it lives on the blockchain)
6. Save the ABI (interface definition) as a JSON file
```

#### What is an ABI?
ABI = **Application Binary Interface**. It's like a menu for the smart contract — it tells our backend what functions are available and how to call them.

---

### 6.5 Frontend Dashboard (React + Vite)

**File:** `frontend/src/App.jsx`

#### What the Doctor Sees:

```
┌────────────────────────────────────────────────────────────────┐
│  🏥 AI Voice EMR          Backend: 🟢 online  Blockchain: 🟢  │
├────────────────────────────────────────────────────────────────┤
│  📋 EMR Records  │  📅 Appointments                          │
├──────────────────┴────────────────────────────────────────────┤
│ Total: 5 │ Pending: 2 │ Approved: 3 │ On Blockchain: 3       │
├───────────────────┬───────────────────────────────────────────┤
│                   │                                           │
│  Patient Records  │           EMR Editor                      │
│                   │                                           │
│  🟢 Rahul, 32    │  Patient Name: [Rahul        ]            │
│     Approved      │  Age:          [32           ]            │
│                   │  Symptoms:     [fever, headache]          │
│  🟡 Priya, 28    │  Duration:     [2 days       ]            │
│     Pending       │  Diagnosis:    [viral fever  ]            │
│                   │  Action:       [consult doctor]           │
│                   │                                           │
│                   │  [💾 Save] [✓ Approve] [🔍 Verify]       │
│                   │                                           │
├───────────────────┤───────────────────────────────────────────┤
│  ⛓️ Blockchain    │                                           │
│  SHA256: a1b2c3.. │  🔐 Verification Result                  │
│  TX: 0x4d5e6f..   │  ✅ VERIFIED — Record is Intact           │
└───────────────────┴───────────────────────────────────────────┘
```

#### How React Works (Simple Explanation):

React builds the UI from **components** and **state**:

```javascript
// STATE = the data the dashboard is tracking
const [records, setRecords] = useState([]);           // All patient records
const [selectedRecord, setSelectedRecord] = useState(null);  // Which record is open
const [verification, setVerification] = useState(null);      // Verification result

// EFFECT = "do this when the page loads"
useEffect(() => {
    fetchRecords();         // Load records from backend
    checkBackendStatus();   // Is backend running?
    checkBlockchainStatus();// Is Ganache running?
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchRecords, 15000);
}, []);
```

#### Key Functions in the Dashboard:

| Function | What It Does | API Called |
|----------|-------------|-----------|
| `fetchRecords()` | Loads all EMR records from backend | `GET /api/emr` |
| `selectRecord(record)` | Opens a record in the editor | — (local state) |
| `handleUpdateRecord()` | Saves doctor's edits | `PUT /api/emr/:id` |
| `handleApprove()` | Approves the record | `POST /api/approve-emr/:id` |
| `handleVerify()` | Checks blockchain integrity | `POST /api/verify-record` |

---

### 6.6 SHA256 Hashing — The Digital Fingerprint

#### What is SHA256?
SHA256 is a **one-way mathematical function** that converts ANY data into a fixed 64-character hexadecimal string.

#### Key Properties:

| Property | Meaning | Example |
|----------|---------|---------|
| **Deterministic** | Same input → always same output | `"hello"` → `2cf24dba...` (always) |
| **Fixed Length** | Output is always 64 chars | Doesn't matter if input is 1 byte or 1 GB |
| **One-Way** | Cannot reverse-engineer the input from the hash | You can't get `"hello"` back from `2cf24dba...` |
| **Avalanche Effect** | Tiny change in input → completely different hash | `"hello"` vs `"Hello"` → totally different hashes |

#### How We Use It:

```javascript
// 1. Take the EMR data as JSON
const emrData = {
    patient_name: "Rahul",
    age: 32,
    symptoms: ["fever", "headache"],
    ...
};

// 2. Sort the keys (so order doesn't affect the hash)
const sortedKeys = Object.keys(emrData).sort();
const jsonString = JSON.stringify(emrData, sortedKeys);

// 3. Generate SHA256 hash
const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
// Result: "a1b2c3d4e5f6..." (64 characters)
```

#### Why Sort Keys?
`{ name: "A", age: 1 }` and `{ age: 1, name: "A" }` are the same data but produce different JSON strings. Sorting keys ensures the same data always produces the same hash.

---

### 6.7 Blockchain Verification

#### The Verification Process:

```
┌──────────────────────────────────────────────────────────────┐
│                    VERIFICATION FLOW                         │
│                                                              │
│  1. Doctor clicks "Verify" on a record                       │
│     │                                                        │
│     ▼                                                        │
│  2. Backend fetches the CURRENT record from Supabase         │
│     │                                                        │
│     ▼                                                        │
│  3. Recomputes SHA256 hash from current data                 │
│     hash_now = SHA256(current_record)                        │
│     │                                                        │
│     ▼                                                        │
│  4. Calls smart contract: getHash(record_id)                 │
│     hash_blockchain = stored hash from time of creation      │
│     │                                                        │
│     ▼                                                        │
│  5. COMPARE:                                                 │
│                                                              │
│     hash_now === hash_blockchain  →  ✅ VERIFIED             │
│     hash_now !== hash_blockchain  →  ⚠️ TAMPERED             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Why This Works:
- When the EMR is first created, we compute `SHA256(originalData)` and store it on the blockchain.
- If someone changes even ONE character in the database, `SHA256(modifiedData)` will be completely different.
- The blockchain hash can never be changed (the smart contract prevents it).
- So comparing the two instantly reveals any tampering.

---

## 7. Folder Structure — What Each File Does

```
voice-emr-blockchain/
│
├── backend/                          ← THE BRAIN (Node.js server)
│   ├── server.js                     ← Entry point — starts the server
│   ├── package.json                  ← Lists all dependencies (libraries)
│   ├── .env                          ← Secret keys & configuration
│   ├── deployContract.js             ← Script to deploy smart contract to Ganache
│   ├── EMRHashRegistry.json          ← ABI (smart contract interface)
│   │
│   ├── config/
│   │   ├── supabaseClient.js         ← Connects to Supabase database
│   │   └── blockchainClient.js       ← Connects to Ganache blockchain
│   │
│   ├── routes/
│   │   ├── emrRoutes.js              ← CRUD operations for EMR records
│   │   ├── blockchainRoutes.js       ← Blockchain status check
│   │   └── verificationRoutes.js     ← Record integrity verification
│   │
│   └── utils/
│       └── hashUtil.js               ← SHA256 hash generation & comparison
│
├── frontend/                         ← THE FACE (React dashboard)
│   ├── index.html                    ← Main HTML shell
│   ├── vite.config.js                ← Vite build configuration
│   └── src/
│       ├── main.jsx                  ← React entry point
│       ├── App.jsx                   ← The entire dashboard UI (731 lines)
│       ├── App.css                   ← Component-specific styles
│       └── index.css                 ← Global CSS (colors, layout, animations)
│
├── contracts/                        ← THE VAULT (Blockchain)
│   └── EMRHashRegistry.sol           ← Solidity smart contract
│
├── medical-agent/                    ← THE EARS & MOUTH (AI Voice)
│   ├── agent.py                      ← Root-level agent entrypoint
│   ├── src/
│   │   └── agent.py                  ← Detailed agent implementation
│   ├── requirements.txt              ← Python dependencies
│   └── Dockerfile                    ← For deploying to LiveKit Cloud
│
├── README.md                         ← Project overview
├── architecture.md                   ← System architecture docs
├── demo_script.md                    ← Step-by-step demo instructions
└── HOW_IT_WORKS.md                   ← THIS file you're reading now
```

---

## 8. API Endpoints — The Backend's Menu

### EMR Routes (`emrRoutes.js`)

| Method | Endpoint | Purpose | When Is It Called? |
|--------|----------|---------|-------------------|
| `POST` | `/api/emr-summary` | Receive EMR data from AI agent | When a patient call ends |
| `GET` | `/api/emr` | Fetch all EMR records | When dashboard loads / refreshes |
| `GET` | `/api/emr/:id` | Fetch one specific record | When clicking a record |
| `PUT` | `/api/emr/:id` | Update a record (doctor edits) | When doctor clicks "Save Changes" |
| `POST` | `/api/approve-emr/:id` | Approve a record | When doctor clicks "Approve EMR" |
| `GET` | `/api/appointments` | Fetch records with appointments | When viewing Appointments tab |

### Blockchain Routes (`blockchainRoutes.js`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/blockchain/status` | Check if Ganache is running & connected |

### Verification Routes (`verificationRoutes.js`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/verify-record` | Verify record integrity against blockchain |

---

## 9. Database Schema — The Table Structure

### Table: `emr_records`

| Column | Type | Description |
|--------|------|-------------|
| `record_id` | text (PK) | Unique ID like `EMR-1712345678-abc123` |
| `patient_name` | text | Patient's name from the call |
| `age` | integer | Patient's age |
| `symptoms` | jsonb (array) | List of symptoms: `["fever","headache"]` |
| `duration` | text | How long symptoms have lasted |
| `medical_history` | text | Any past medical conditions |
| `diagnosis_guess` | text | AI's preliminary diagnosis guess |
| `recommended_action` | text | What the AI recommends |
| `appointment_date` | text | Requested appointment date (if any) |
| `appointment_time` | text | Requested appointment time (if any) |
| `summary_json` | jsonb | The full raw JSON from the AI summarizer |
| `status` | text | `"pending_review"` or `"approved"` |
| `sha256_hash` | text | The SHA256 fingerprint of the EMR data |
| `blockchain_tx_hash` | text | The Ganache transaction hash |
| `created_at` | timestamp | When the record was created |
| `approved_at` | timestamp | When the doctor approved it |

---

## 10. How To Run The Project

### Prerequisites
| Software | Purpose | Install Link |
|----------|---------|-------------|
| Node.js (v18+) | Run backend & frontend | https://nodejs.org |
| Ganache | Local blockchain | https://trufflesuite.com/ganache |
| Python 3.11+ | Run voice agent | https://python.org |
| Git | Version control | https://git-scm.com |

### Step-by-Step

```bash
# 1. Clone the repository
git clone https://github.com/Shivacharanmandhapuram/major-project-team-17.git
cd major-project-team-17

# 2. Start Ganache (open Ganache app → click "Quickstart Ethereum")
# Note the RPC URL (usually http://127.0.0.1:7545)

# 3. Setup Backend
cd backend
npm install                    # Install dependencies
# Edit .env file with your Supabase & Ganache credentials
node deployContract.js         # Deploy smart contract to Ganache
# Copy the CONTRACT_ADDRESS from the output into your .env file
node server.js                 # Start the backend server

# 4. Setup Frontend (in a NEW terminal)
cd frontend
npm install                    # Install dependencies
npm run dev                    # Start the React dev server

# 5. Open the dashboard
# Go to http://localhost:5173 in your browser
```

### For the Voice Agent (LiveKit Cloud):
The voice agent runs on **LiveKit Cloud** — it's already deployed. You don't need to run it locally. The agent sends data to your backend via a Cloudflare tunnel URL.

---

## 11. Viva Preparation — Expected Questions & Answers

### Q1: What is the main objective of your project?
**A:** To build an AI-powered voice-based Electronic Medical Record system where patient data is automatically captured through phone calls, structured into medical records, and secured using blockchain technology to prevent tampering.

---

### Q2: How does the AI voice agent work?
**A:** The agent uses three AI models in a pipeline:
1. **Deepgram Nova 3** converts the patient's speech to text (STT)
2. **Google Gemini 2.5 Flash** understands the text and generates intelligent responses (LLM)
3. **Cartesia Sonic 3** converts the AI's text responses back to speech (TTS)

After the call ends, a separate **Gemini 3 Flash** model summarizes the conversation into structured EMR JSON.

---

### Q3: What is blockchain and why did you use it?
**A:** Blockchain is a distributed, immutable ledger. Once data is written to it, it cannot be changed or deleted. We use it to store the SHA256 hash of each medical record. This way, if anyone tampers with the record in the database, we can detect it by comparing the current hash with the blockchain hash.

---

### Q4: What is SHA256? Why not MD5?
**A:** SHA256 is a cryptographic hash function that produces a 256-bit (64-character hex) digest. We chose SHA256 over MD5 because:
- MD5 is **broken** — known collision attacks exist (two different inputs producing the same hash)
- SHA256 is **collision-resistant** — no known practical attacks
- SHA256 is the industry standard for blockchain and security applications

---

### Q5: What is Ganache? Is this a real blockchain?
**A:** Ganache is a **local Ethereum blockchain simulator** for development. It behaves exactly like the Ethereum mainnet but runs on your computer. In production, we would deploy the smart contract to a real Ethereum network (like Sepolia testnet or mainnet). For our prototype, Ganache is sufficient to demonstrate the concept.

---

### Q6: What is a Smart Contract?
**A:** A smart contract is a self-executing program deployed on the blockchain. Once deployed, its code cannot be changed. Our smart contract `EMRHashRegistry` has two functions:
- `storeHash(recordId, hash)` — saves a hash permanently
- `getHash(recordId)` — retrieves a stored hash

The `storeHash` function includes a check that prevents overwriting existing hashes, making the stored data truly immutable.

---

### Q7: How does the verification system work?
**A:** 
1. We take the current EMR data from the database
2. Recompute its SHA256 hash
3. Fetch the original hash from the blockchain
4. Compare them — if they match → VERIFIED, if they differ → TAMPERED

This works because SHA256 has an **avalanche effect** — even changing one character produces a completely different hash.

---

### Q8: What is Supabase?
**A:** Supabase is an open-source Backend-as-a-Service built on top of PostgreSQL. It provides a hosted PostgreSQL database with a REST API, authentication, and a web dashboard. We use it as our primary database to store EMR records.

---

### Q9: What is ethers.js?
**A:** ethers.js is a JavaScript library for interacting with the Ethereum blockchain. We use it to:
- Connect to Ganache (`JsonRpcProvider`)
- Create a wallet for signing transactions (`Wallet`)
- Deploy and interact with our smart contract (`Contract`)

---

### Q10: What is CORS and why do you use it?
**A:** CORS = Cross-Origin Resource Sharing. Browsers block requests from one domain to another by default (security feature). Since our frontend (localhost:5173) and backend (localhost:5001) are on different ports, we need CORS middleware to allow the frontend to make API requests to the backend.

---

### Q11: What happens if someone tampers with the database directly?
**A:** Our verification system will catch it. The hash stored on the blockchain was computed from the ORIGINAL data. If someone modifies the database record:
- The recomputed hash will be different from the blockchain hash
- The system will return **TAMPERED** status
- This provides irrefutable proof of data modification

---

### Q12: What is the Cloudflare Tunnel used for?
**A:** The LiveKit voice agent runs on the cloud, but our backend runs on localhost. The Cloudflare Tunnel creates a public URL (like `https://xyz.trycloudflare.com`) that securely tunnels to our local backend. This allows the LiveKit agent to send webhook data (EMR summaries) to our local server.

---

### Q13: What are the limitations of your system?
**A:**
1. Uses Ganache (local blockchain) — not a production blockchain
2. The AI diagnosis is a "guess" — it's not meant to replace a real doctor's diagnosis
3. No authentication system — any user can access the dashboard
4. Cloudflare tunnel URL changes each time — needs to be updated in the agent config
5. Single doctor setup — doesn't support multiple doctor accounts yet

---

### Q14: What are the future improvements?
**A:**
1. Deploy smart contract to Ethereum testnet/mainnet (e.g., Sepolia)
2. Add doctor authentication and role-based access
3. Support multiple languages for the voice agent
4. Add digital signatures for doctor approval
5. Implement IPFS for storing full EMR data (not just hash) on decentralized storage
6. Add patient portal for viewing their own records

---

### Q15: What is the novelty in your project?
**A:** The combination of three cutting-edge technologies:
1. **AI Voice Agents** for automated medical data capture (no manual entry)
2. **NLP/LLM-based extraction** to convert unstructured conversations into structured EMR
3. **Blockchain-based integrity verification** for tamper-proof medical records

This end-to-end integration — voice → AI → EMR → blockchain — is what makes the project novel.

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│              TEAM 17 - QUICK REFERENCE              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📞 Phone Number:  +1 (240) 231-5068               │
│  🌐 Backend:       http://localhost:5001            │
│  🖥️  Frontend:      http://localhost:5173            │
│  ⛓️  Ganache:       http://127.0.0.1:7545           │
│  🗄️  Database:      Supabase (PostgreSQL)           │
│                                                     │
│  FLOW:                                              │
│  Patient Calls → AI Talks → JSON Created →          │
│  Stored in DB → Hash on Blockchain →                │
│  Doctor Reviews → Approves → Verify Anytime         │
│                                                     │
│  KEY TECHNOLOGIES:                                  │
│  LiveKit · Deepgram · Gemini · Cartesia ·           │
│  Node.js · Express · React · Supabase ·             │
│  Solidity · Ganache · ethers.js · SHA256            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

> **💡 Tip for Viva:** If you don't know an answer, relate it back to the main flow:
> *"The patient calls → AI captures data → backend processes it → database stores it → blockchain secures it → dashboard displays it → doctor verifies it."*
> Every question will connect back to one part of this flow.

**Good luck, Team 17! 🚀**
