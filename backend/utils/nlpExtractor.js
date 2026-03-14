// =============================================
// NLP — Transcript to Structured EMR
// =============================================
// Takes a raw conversation transcript and extracts
// structured EMR fields using simple keyword/pattern
// matching. In a production system, this would use
// a proper NLP model or LLM API.
// =============================================

/**
 * Extract structured EMR data from a conversation transcript.
 * Uses simple pattern matching for the prototype.
 *
 * @param {string} transcript - The raw conversation text
 * @returns {object} Structured EMR fields
 */
function extractEMRFromTranscript(transcript) {
    const text = transcript.toLowerCase();

    // Extract patient name
    const namePatterns = [
        /my name is ([a-z\s]+?)[\.,]/i,
        /i am ([a-z\s]+?)[\.,]/i,
        /this is ([a-z\s]+?)[\.,]/i,
        /patient name[:\s]+([a-z\s]+?)[\.,\n]/i,
        /name[:\s]+([a-z\s]+?)[\.,\n]/i,
    ];
    let patientName = 'Unknown';
    for (const pattern of namePatterns) {
        const match = transcript.match(pattern);
        if (match) {
            patientName = match[1].trim().replace(/\b\w/g, c => c.toUpperCase());
            break;
        }
    }

    // Extract age
    const agePatterns = [
        /(\d{1,3})\s*(?:years?\s*old|yrs?\s*old|year|yr)/i,
        /age[:\s]*(\d{1,3})/i,
        /i am (\d{1,3})/i,
    ];
    let age = null;
    for (const pattern of agePatterns) {
        const match = transcript.match(pattern);
        if (match) {
            age = parseInt(match[1]);
            if (age > 0 && age < 150) break;
            age = null;
        }
    }

    // Extract symptoms (common medical keywords)
    const symptomKeywords = [
        'headache', 'fever', 'cough', 'cold', 'pain', 'nausea',
        'vomiting', 'dizziness', 'fatigue', 'sore throat', 'runny nose',
        'chest pain', 'shortness of breath', 'back pain', 'stomach ache',
        'diarrhea', 'constipation', 'rash', 'swelling', 'bleeding',
        'insomnia', 'anxiety', 'depression', 'weight loss', 'weight gain',
        'joint pain', 'muscle pain', 'numbness', 'tingling', 'blurred vision',
        'sneezing', 'wheezing', 'chills', 'sweating', 'body ache',
        'abdominal pain', 'loss of appetite', 'difficulty breathing',
    ];
    const foundSymptoms = symptomKeywords.filter(s => text.includes(s));

    // Extract severity indicators
    const severityWords = ['severe', 'mild', 'moderate', 'intense', 'chronic', 'acute'];
    const foundSeverity = severityWords.filter(s => text.includes(s));

    // Extract duration mentions
    const durationPattern = /(?:for|since|past|last)\s+(\d+\s*(?:days?|weeks?|months?|hours?|years?))/gi;
    const durations = [];
    let dMatch;
    while ((dMatch = durationPattern.exec(transcript)) !== null) {
        durations.push(dMatch[1]);
    }

    // Build symptoms string
    let symptoms = foundSymptoms.length > 0
        ? foundSymptoms.join(', ')
        : 'Not clearly identified from transcript';

    if (foundSeverity.length > 0) {
        symptoms += ` (severity: ${foundSeverity.join(', ')})`;
    }
    if (durations.length > 0) {
        symptoms += ` (duration: ${durations.join(', ')})`;
    }

    // Calculate confidence score based on how many fields we extracted
    let confidence = 0;
    if (patientName !== 'Unknown') confidence += 25;
    if (age !== null) confidence += 25;
    if (foundSymptoms.length > 0) confidence += 25;
    if (durations.length > 0) confidence += 15;
    if (foundSeverity.length > 0) confidence += 10;

    return {
        patient_name: patientName,
        age: age,
        symptoms: symptoms,
        diagnosis: 'Pending doctor review',
        prescription: 'Pending doctor review',
        transcript: transcript,
        confidence_score: Math.min(confidence, 100),
        extraction_details: {
            found_symptoms: foundSymptoms,
            severity: foundSeverity,
            durations: durations,
        },
    };
}

module.exports = { extractEMRFromTranscript };
