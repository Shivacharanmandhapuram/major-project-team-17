import logging
from datetime import timezone, datetime
import aiohttp
import asyncio
from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    ChatContext,
    JobContext,
    JobProcess,
    RunContext,
    ToolError,
    cli,
    inference,
    room_io,
    utils,
)
from livekit.plugins import (
    noise_cancellation,
    silero,
)
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent-new")

load_dotenv(".env.local")


class DefaultAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are a helpful, professional, and empathetic medical assistant for Maneesha's clinic.
Your job is to ask the patient for their name, age, and symptoms.
You should also ask how long they have been feeling this way.
Keep your responses concise. Do not provide medical diagnoses.
Once you have collected the patient's name, age, symptoms, and duration, thank them and say the doctor will review their record shortly, then end the call.

""",
        )

    async def on_enter(self):
        await self.session.generate_reply(
            instructions="""Hello! Thank you for calling Maneesha's clinic. """,
            allow_interruptions=True,
        )


server = AgentServer(shutdown_process_timeout=60.0)

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

server.setup_fnc = prewarm

async def _summarize_session(summarizer: inference.LLM, chat_ctx: ChatContext) -> str | None:
    summary_ctx = ChatContext()
    summary_ctx.add_message(
        role="system",
        content="""Summarize the following conversation in a concise manner. Additional instructions are as follows:
You are a medical call summarization assistant.

Convert the conversation into structured EMR data.

Return JSON only.

Fields:

patient_name
age
symptoms
duration
medical_history
diagnosis_guess
recommended_action

Example:

{
 \"patient_name\": \"Rahul\",
 \"age\": 32,
 \"symptoms\": [\"fever\",\"headache\"],
 \"duration\": \"2 days\",
 \"medical_history\": \"none\",
 \"diagnosis_guess\": \"viral fever\",
 \"recommended_action\": \"consult doctor\"
}

Return ONLY JSON.
No explanations.""",
    )

    n_summarized = 0
    for item in chat_ctx.items:
        if item.type != "message":
            continue
        if item.role not in ("user", "assistant"):
            continue
        if item.extra.get("is_summary") is True:  # avoid making summary of summaries
            continue

        text = (item.text_content or "").strip()
        if text:
            summary_ctx.add_message(
                role="user",
                content=f"{item.role}: {(item.text_content or '').strip()}"
            )
            n_summarized += 1
    if n_summarized == 0:
        logger.debug("no chat messages to summarize")
        return

    response = await summarizer.chat(
        chat_ctx=summary_ctx,
    ).collect()
    return response.text.strip() if response.text else None

async def _on_session_end_func(ctx: JobContext) -> None:
    ended_at = datetime.now(timezone.utc)
    session = ctx._primary_agent_session
    if not session:
        logger.error("no primary agent session found for end_of_call processing")
        return

    report = ctx.make_session_report()
    summarizer = inference.LLM(model="google/gemini-3-flash")
    summary = await _summarize_session(summarizer, report.chat_history)
    if not summary:
        logger.info("no summary generated for end_of_call processing")
        return
    headers_dict = {}
    body = {
        "job_id": report.job_id,
        "room_id": report.room_id,
        "room": report.room,
        "started_at": datetime.fromtimestamp(report.started_at, timezone.utc).isoformat().replace("+00:00", "Z")
            if report.started_at
            else None,
        "ended_at": ended_at.isoformat().replace("+00:00", "Z"),
        "summary": summary,
    }

    try:
        session = utils.http_context.http_session()
        timeout = aiohttp.ClientTimeout(total=10)
        resp = await asyncio.shield(session.post(
            "https://basket-interaction-fill-transparent.trycloudflare.com/api/emr-summary", timeout=timeout, json=body, headers=headers_dict
        ))
        if resp.status >= 400:
            raise ToolError(f"error: HTTP {resp.status}: {resp.reason}")
        await resp.release()
    except ToolError:
        raise
    except (TimeoutError, aiohttp.ClientError) as e:
        raise ToolError(f"error: {e!s}") from e

@server.rtc_session(agent_name="new", on_session_end=_on_session_end_func)
async def entrypoint(ctx: JobContext):
    session = AgentSession(
        stt=inference.STT(model="deepgram/nova-3", language="en"),
        llm=inference.LLM(
            model="google/gemini-2.5-flash",
        ),
        tts=inference.TTS(
            model="cartesia/sonic-3",
            voice="9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
            language="en-US"
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    await session.start(
        agent=DefaultAgent(),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: noise_cancellation.BVCTelephony() if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP else noise_cancellation.BVC(),
            ),
        ),
    )


if __name__ == "__main__":
    cli.run_app(server)
