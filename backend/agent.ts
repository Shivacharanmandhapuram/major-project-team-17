import { WorkerOptions, WorkerCli, JobContext, JobProcess } from '@livekit/agents';
import { elevenlabs } from '@livekit/agents-plugin-elevenlabs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const workerOptions: WorkerOptions = {
    agent: path.join(process.cwd(), 'agent.ts'),
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
    wsUrl: process.env.LIVEKIT_URL,
};

export default {
    workerOptions,
    async execute(ctx: JobContext) {
        console.log("Waiting for a patient call...");
        await ctx.connect();
        
        console.log("Patient connected! Routing to ElevenLabs...");
        
        // Use the ElevenLabs Conversational AI Agent integration
        const agent = new elevenlabs.ConversationalAgent({
            agentId: process.env.ELEVENLABS_AGENT_ID!,
        });

        const session = await agent.start(ctx.room!);
        console.log("ElevenLabs Agent session started.");
        
        ctx.room?.on('disconnected', () => {
            console.log("Call ended.");
            // Transcript will be sent to the webhook configured in ElevenLabs dashboard
        });
    }
};

WorkerCli.runApp(workerOptions);
