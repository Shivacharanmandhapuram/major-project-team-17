require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

// LiveKit will ping this when a phone call SIP lands
app.post('/livekit-webhook', (req, res) => {
    console.log("=== LiveKit Webhook Triggered ===");
    console.log(req.body);
    // Here we can instruct LiveKit to route the room direct to ElevenLabs
    res.status(200).send("OK");
});

app.listen(PORT, () => console.log('Listening for calls on port ' + PORT));
