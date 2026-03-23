export const DIAGNOSIS_PROMPT = (symptoms: string) => `
You are an expert dental assistant AI. 
A patient presents with the following symptoms: "${symptoms}"

Based on common dental conditions, suggest:
1. Most likely diagnosis
2. Recommended next steps
3. Urgency level (low / medium / high)

Respond in JSON format only:
{
  "diagnosis": "...",
  "steps": ["...", "..."],
  "urgency": "low | medium | high"
}
`;

export const RISK_SCORE_PROMPT = (patient: any) => `
Analyze this dental patient profile and return a risk score (0-100) 
for potential dental complications:

Patient: ${JSON.stringify(patient)}

Consider: age, medical history, visit frequency, payment history.

Respond in JSON only:
{ "score": 0-100, "reason": "..." }
`;
