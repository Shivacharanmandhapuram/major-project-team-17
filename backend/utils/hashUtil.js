// =============================================
// SHA256 Hash Utility
// =============================================
// Takes an EMR object and produces a SHA256 hash.
// This hash is what gets stored on the blockchain
// for tamper-proof verification.
// =============================================

const CryptoJS = require('crypto-js');

/**
 * Generate a SHA256 hash from an EMR record object.
 * We sort the keys to ensure the hash is always the same
 * for the same data, regardless of key order.
 */
function generateHash(emrData) {
    // Pick only the fields that matter for integrity
    const dataToHash = {
        patient_name: emrData.patient_name,
        age: emrData.age,
        symptoms: emrData.symptoms,
        diagnosis: emrData.diagnosis,
        prescription: emrData.prescription,
        transcript: emrData.transcript,
        doctor_id: emrData.doctor_id,
    };

    // Convert to a deterministic JSON string (sorted keys)
    const jsonString = JSON.stringify(dataToHash, Object.keys(dataToHash).sort());

    // Generate SHA256 hash
    const hash = CryptoJS.SHA256(jsonString).toString(CryptoJS.enc.Hex);

    return hash;
}

/**
 * Verify an EMR record by comparing its current hash
 * with a previously stored hash.
 */
function verifyHash(emrData, storedHash) {
    const currentHash = generateHash(emrData);
    return {
        currentHash,
        storedHash,
        isValid: currentHash === storedHash,
        status: currentHash === storedHash ? 'VERIFIED' : 'TAMPERED',
    };
}

module.exports = { generateHash, verifyHash };
