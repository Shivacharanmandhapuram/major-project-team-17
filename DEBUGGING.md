# Voice Agent Debugging Checklist

Whenever a "deep check" is requested, review this checklist sequentially to rule out common failure modes that cause the LiveKit AI agent to fail or remain silent.

## 1. Environment & API Keys (.env)
- [ ] Are all API keys present in `backend/.env`?
  - `LIVEKIT_URL`: `wss://shivacharan-e6uu3uxy.livekit.cloud`
  - `LIVEKIT_API_KEY`: `APIGXAAd3rkKPFE`
  - `LIVEKIT_API_SECRET`: `wbSeAn0xvEIaEHwRvCQbf5KfTzOvzoa9XcD4iOqaRHfB`
  - `ELEVENLABS_API_KEY`: `sk_2f284dc9d14673cc6e293baa2268a1d2ed7f0f7d0251ee87`
  - `ELEVENLABS_AGENT_ID`: `agent_5001kkgnm604ef7vzcj2608x6ys9`
- [ ] Is there **NO** `OPENAI_API_KEY` variable floating around? (The underlying OpenAI Node SDK will globally hijack requests if this exists, which breaks Together AI/Groq proxy endpoints).

## 2. API Key Syntax & Formats
- [ ] Do the keys look structurally correct?
  - ElevenLabs keys start with `sk_`
  - LiveKit `API_KEY` starts with `API...` and `API_SECRET` is ~43 chars.

## 3. Worker Diagnostics (LiveKit)
- [ ] Is the worker script (`agent.ts` or `agent.mjs`) actively running?
- [ ] Did the worker log `registered worker` and receive an `AW_...` worker ID?
- [ ] Upon placing a phone call, does the worker output `Connected to room: call-...`?
- [ ] Does the worker log `Agent session started and greeting sent`?

## 4. Components Logic Check
### The Brain & Voice (ElevenLabs Conversational Agent)
- [ ] Are we using the ElevenLabs LiveKit integration correctly?
- [ ] Is `ELEVENLABS_API_KEY` set?
- [ ] Is `ELEVENLABS_AGENT_ID` set?
- [ ] Does the Agent in the ElevenLabs dashboard have the correct System Prompt and First Message?

### The Telephony & Routing (LiveKit)
- [ ] Is the LiveKit SIP Trunk properly configured to route to the LiveKit project?
- [ ] Is the LiveKit project configured to trigger the specific worker when a SIP call lands in a room?

## 5. Network Checks
- [ ] Can the server reach Twilio via SIP Trunk? (If you hear rings but no pickup, check Twilio SIP routing domain -> LiveKit).
- [ ] Wait for `participant_disconnected` vs `401 Unauthorized` inside the node output stream to differentiate between user hanging up vs API failure.

If all the above are true, the system is fundamentally sound and the issue relies on either token expiration or a LiveKit/Twilio routing backend outage.
