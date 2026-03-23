// ─── SoorGreen AI Engine — Stub ───────────────────────────────────────────
// This module is the primary AI entry point for DentiFlow.
// Wire up your AI backend (Firebase Functions / OpenAI / custom) here.

const AI_ENDPOINT = import.meta.env.VITE_AI_ENDPOINT || "";

export const getDiagnosisSuggestion = async (symptoms: string): Promise<string> => {
  if (!AI_ENDPOINT) return "AI endpoint not configured.";
  const res = await fetch(AI_ENDPOINT + "/diagnose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symptoms }),
  });
  const data = await res.json();
  return data.suggestion || "No suggestion available.";
};

export const getPatientRiskScore = async (patientData: any): Promise<number> => {
  if (!AI_ENDPOINT) return 0;
  const res = await fetch(AI_ENDPOINT + "/risk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patientData),
  });
  const data = await res.json();
  return data.score ?? 0;
};

export const getChatbotReply = async (message: string, history: any[]): Promise<string> => {
  if (!AI_ENDPOINT) return "AI assistant not yet configured.";
  const res = await fetch(AI_ENDPOINT + "/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  const data = await res.json();
  return data.reply || "No reply.";
};
