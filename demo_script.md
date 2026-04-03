# 🎤 AI Voice EMR with Blockchain Integrity — Live Demo Script

**Preparation Before Demo:**
1. Have the **Doctor Dashboard** open in your browser (`http://localhost:5174`).
2. Have your **Terminal** visible showing the `node server.js` logs.
3. Have your phone ready to call the LiveKit number: **+1 484 270-7122**.

---

### Step 1: Introduction (1 minute)
**Speaker:** 
"Hello everyone, today I'm demonstrating an AI Voice Electronic Medical Record system secured by Blockchain."

"The problem we are solving is the administrative burden on doctors. Doctors spend too much time typing notes instead of talking to patients. Furthermore, centralized databases can be tampered with."

"Our solution uses an AI Voice Agent to take the patient's call, automatically generate the EMR, and then we secure that record cryptographically on a Blockchain. Let's see it live."

### Step 2: The Patient Call (2 minutes)
**Speaker (Action):** *Put your phone on speaker and dial +1 484 270-7122.*

**AI Agent:** "Hello! Thank you for calling Maneesha's clinic. How can I help you today?"

**You (as Patient):** "Hi, my name is Rahul. I'm 32 years old. I've been having a severe headache and a mild fever."

**AI Agent:** "I'm sorry to hear that Rahul. How long have you been feeling this way?"

**You (as Patient):** "It started about 2 days ago."

**AI Agent:** "Thank you. I have recorded your symptoms. The doctor will review your record shortly. Have a good day."

**Speaker (Action):** *Hang up the phone.*

### Step 3: Backend Processing (30 seconds)
**Speaker:** 
"I just hung up. Right now, the AI is taking that entire conversation, running it through a Large Language Model (Gemini 3 Flash), and extracting the structured medical data as JSON."

*(Point to your terminal)*
"If we look at the backend server, we will see the webhook arrive any second now..."

*(Wait for the terminal to print `📞 CALL SUMMARY RECEIVED!`)*

"There it is! The AI successfully extracted my name, age, symptoms, and duration, and the backend just saved it to our Supabase database."

### Step 4: The Doctor Dashboard (1 minute)
**Speaker (Action):** *Switch to the browser with the Doctor Dashboard.*

**Speaker:** 
"Now I am the doctor. I open my dashboard, and I can see Rahul's record has automatically appeared under 'Patient EMR Records'. Let's click on it."

*(Click on the newly generated record)* 

"The AI did the heavy lifting. It captured:
- **Patient Name:** Rahul
- **Symptoms:** Headache, Fever
- **Duration:** 2 days
- **AI's Diagnosis Guess:** Viral Fever"

"As the doctor, I review this. It looks accurate. I'll add a quick note to the recommended action: 'Prescribe Paracetamol'."

*(Edit the Recommended Action field and click 'Save Changes')* 

### Step 5: Approval & Blockchain Hashing (1 minute)
**Speaker:**
"I am now satisfied with this record. It's time to approve it. Watch what happens when I click 'Approve EMR'."

*(Click 'Approve EMR')*

"At this exact moment, the system takes all of this EMR data and generates a unique cryptographic fingerprint — a SHA-256 Hash. It then takes that hash and sends it to our Smart Contract on the Ethereum Blockchain."

"Because it is on the blockchain, this fingerprint is now immutable. It can never be altered or deleted."

### Step 6: Zero-Trust Verification (1 minute)
**Speaker:**
"Now for the most important part: Verification. Let's say a month goes by, or an auditor wants to review this record."

"How do we prove nobody tampered with the database?"

*(Click the 'Verify Blockchain Integrity' button)*

"When I click Verify, our system takes the current data in the database and re-calculates the hash. It then reaches out to the Blockchain and retrieves the original hash we stored."

*(Show the green 'VERIFIED' banner on the UI)*

"They match perfectly! We now have cryptographic, legal-grade proof that this medical record has not been altered since the moment I approved it."

### Conclusion
"In summary: We automated data entry using AI Voice, saving doctors time, and we secured the integrity of that data using Blockchain, protecting the patient."

"Thank you!"
