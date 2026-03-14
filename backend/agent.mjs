
import { WorkerOptions, cli, defineAgent, voice } from '@livekit/agents';
import { STT as DeepgramSTT } from '@livekit/agents-plugin-deepgram';

import { LLM as OpenAILLM } from '@livekit/agents-plugin-openai';
import { TTS as ElevenLabsTTS } from '@livekit/agents-plugin-elevenlabs';
import { VAD as SileroVAD } from '@livekit/agents-plugin-silero';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve the directory this script lives in so we always find .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

export default defineAgent({
    prewarm: async (proc) => {
        // Pre-load the Silero VAD model so it's ready when a call comes in
        proc.userData.vad = await SileroVAD.load();
    },
    entry: async (ctx) => {
        console.log('Agent entry called, connecting to room...');
        console.log('OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL);
        console.log('OPENAI_API_KEY set:', !!process.env.OPENAI_API_KEY);
        console.log('ELEVENLABS_API_KEY set:', !!process.env.ELEVENLABS_API_KEY);

        await ctx.connect();
        console.log('Connected to room:', ctx.room.name);

        // Deepgram for fast streaming Speech-to-Text
        const stt = new DeepgramSTT({
            apiKey: process.env.DEEPGRAM_API_KEY,
            model: 'nova-2',
        });

        // Together AI via OpenAI-compatible SDK for LLM
        const llm = OpenAILLM.withTogether({
            model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', // Together's LLM model ID
            apiKey: process.env.TOGETHER_API_KEY,
        });
        const tts = new ElevenLabsTTS({
            apiKey: process.env.ELEVENLABS_API_KEY,
            model: 'eleven_turbo_v2',
        });

        // Create the voice Agent with VAD for non-streaming STT support
        const agent = new voice.Agent({
            instructions: `You are Dr. AI, an empathetic medical assistant conducting an initial intake interview over the phone.
            Keep your responses very brief, friendly, and professional.
            Do not use markdown, emojis, or asterisks.
            Ask the patient for:
            1. Their name
            2. Their age
            3. Their detailed symptoms and duration`,
            stt,
            llm,
            tts,
            vad: ctx.proc.userData.vad,
        });

        // Create an AgentSession and start it with the agent + room
        const session = new voice.AgentSession({});
        await session.start({ agent, room: ctx.room });

        // Greet the caller
        session.say('Hello, this is the AI Doctor Assistant. Can I get your name and date of birth?');

        console.log('Agent session started and greeting sent.');
    },
});

cli.runApp(new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'medical-assistant',
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
    wsUrl: process.env.LIVEKIT_URL,
}));
