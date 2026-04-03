# Debugging & Testing Rules

To ensure a smooth debugging experience, please follow these rules every time we test or modify the application.

## Rule 1: AI Agent Runs the Server
The AI agent is responsible for starting and managing the backend server in the background. The human developer should rely on the AI to confirm when the server is "UP".

**Command the AI runs:**
```bash
cd backend
node server.js
```

## Rule 2: Verify Ports
Before starting the backend, the AI must make sure port `5001` is not being used by an old crashed process (killing it if necessary).

## Rule 3: Always Check the Logs First
When a Voice Agent call finishes:
1. Wait 10-15 seconds for the LLM to generate the JSON.
2. Ask the AI to check its background `node server.js` terminal.
3. Check for the `📞 LIVEKIT CALL SUMMARY RECEIVED!` log.
4. Follow the log chain (Parsing → Hashing → Ganache → Supabase) to identify the exact step any failure occurs.

## Rule 4: Match Database Schemas
If the LLM prompt changes (e.g., adding a new field like `blood_pressure` to the JSON summary), you MUST also update:
1. The Postgres `emr_records` table in Supabase.
2. The Node.js object mapping in `backend/routes/emrRoutes.js`.

## Rule 5: Switching to a New LiveKit Account – Full Checklist
When you change your LiveKit account or create a fresh Cloud Agent, follow this EXACT checklist every time:

**Step A: Configure Call Summary Prompt in LiveKit Dashboard**
1. Log into the new LiveKit account at [cloud.livekit.io](https://cloud.livekit.io).
2. Go to your Agent → Actions → Enable **Call Summary**.
3. Paste this EXACT prompt into the instructions box:
```
You are a medical call summarization assistant.
Convert the conversation into structured EMR data.
Return JSON only. No explanations. No markdown.
Fields: patient_name, age, symptoms, duration, medical_history, diagnosis_guess, recommended_action.
```

**Step B: Restart the Cloudflare Tunnel (ALWAYS do this on a new session)**
The free Cloudflare tunnel expires after a few hours. The AI must:
1. `pkill cloudflared` (kills the old broken tunnel)
2. `cloudflared tunnel --url http://localhost:5001 > /tmp/cloudflared.log 2>&1 &` (starts a fresh one)
3. `grep trycloudflare /tmp/cloudflared.log` (get the fresh URL)

**Step C: Paste Webhook URL into new LiveKit Dashboard**
1. Go to the new LiveKit account → Project Settings → **Webhooks**.
2. Paste the fresh Cloudflare URL + append `/api/emr-summary` to the end.
   Example: `https://xxxxxx.trycloudflare.com/api/emr-summary`
3. Save it.

**Step D: Verify it works**
Make a short test call. Wait 20 seconds after hanging up.
The backend terminal must print:
```
📞 LIVEKIT CALL SUMMARY RECEIVED!
✅ SUCCESSFULLY PARSED EMR JSON
✅ Hash immutably stored on blockchain!
✅ EMR saved to Supabase!
```
If any of those lines are missing, start the checklist again from Step A.

## Rule 6: Full System Startup — AI MUST Run This Every Session
When the user says "run debugging rules" or "make sure everything is up", the AI must automatically start ALL of the following in this EXACT order. Do NOT ask the user to do any of it.

**Step 1. Check Ganache (Blockchain)**
```bash
curl -s -X POST --data '{"jsonrpc":"2.0","method":"net_version","params":[],"id":67}' http://localhost:7545
```
- If it returns `{"result":"5777"}` → ✅ Ganache is running.
- If it fails → Tell the user to open the Ganache app and click Quickstart.

**Step 2. Start the Backend API (in a VISIBLE terminal so user sees logs)**
```bash
pkill -f "node server.js" || true
cd backend && node server.js
```
- Wait for `✅ Backend server running on http://localhost:5001`.

**Step 3. Restart the Cloudflare Tunnel (ALWAYS restart — it expires after hours)**
```bash
pkill cloudflared || true
cloudflared tunnel --url http://localhost:5001 > /tmp/cloudflared.log 2>&1 &
sleep 3
grep trycloudflare /tmp/cloudflared.log
```
- Copy the new `https://xxxxx.trycloudflare.com` URL.
- Tell the user to paste it + `/api/emr-summary` into the LiveKit Dashboard webhook (Rule 5, Step C).

**Step 4. Start the Frontend Dashboard**
```bash
cd frontend && npm run dev &
```
- Confirm it starts on port `5173` or `5174`.

**Step 5. Verify ALL services are alive**
```bash
curl -s http://localhost:5001/          # Backend health check
curl -s http://localhost:7545           # Ganache
pgrep cloudflared                       # Tunnel process
lsof -i :5173 -i :5174                 # Frontend
```
All 4 must respond. If any fail, restart that specific service.

## Rule 7: NEVER Run agent.py
The voice agent runs ENTIRELY on LiveKit's Cloud Dashboard. There is NO local Python agent.
NEVER run `python agent.py start`. NEVER ask for LIVEKIT_URL, LIVEKIT_API_KEY, or LIVEKIT_API_SECRET.
If the AI ever suggests this, it is WRONG — stop and correct it.

