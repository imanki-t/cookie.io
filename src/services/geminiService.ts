import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzePhoto(base64Image: string, mimeType: string) {
  try {
    // 1. Identify Landmark
    const identifyResponse = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          }
        },
        "Identify the main landmark, building, or point of interest in this photo. Return ONLY the name of the landmark and the city/country it is in. If there is no clear landmark, describe the scene briefly."
      ]
    });
    
    const landmarkName = identifyResponse.text?.trim() || "Unknown Location";

    // 2. Fetch History using Search Grounding
    const historyResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an engaging tour guide. Tell me the history and interesting facts about ${landmarkName}. Keep it engaging, informative, and concise (around 100-150 words).`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const historyText = historyResponse.text?.trim() || "History not available.";

    // 3. Generate Narration
    let audioBase64 = null;
    try {
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: historyText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (ttsError) {
      console.error("TTS generation failed:", ttsError);
    }

    return {
      landmark: landmarkName,
      history: historyText,
      audioBase64
    };
  } catch (error) {
    console.error("Error analyzing photo:", error);
    throw error;
  }
}
