import { GoogleGenAI } from "@google/genai";
import { RemoveWatermarkOptions } from "../types";

/**
 * Sends the image to Gemini to remove watermarks.
 */
export const removeWatermark = async ({
  imageBase64,
  mimeType,
  instruction,
  apiKey
}: RemoveWatermarkOptions): Promise<string> => {
  try {
    // Priority: User Provided Key -> Env Var -> Error
    // Note: process.env.API_KEY is handled by the build system/environment
    const effectiveKey = apiKey || process.env.API_KEY;

    if (!effectiveKey) {
      throw new Error("未检测到 API Key。请点击右上角设置图标，配置您的 Google Gemini API Key。");
    }

    // Initialize client per request to support dynamic keys
    const ai = new GoogleGenAI({ apiKey: effectiveKey });

    const defaultPrompt = "Remove all watermarks, text overlays, logos, and time-stamps from this image. Fill in the removed areas seamlessly to match the surrounding background texture and lighting. Output ONLY the processed image.";
    
    const finalPrompt = instruction 
      ? `${defaultPrompt} Additionally, focus on: ${instruction}` 
      : defaultPrompt;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: finalPrompt,
          },
        ],
      },
    });

    // Extract the image from the response
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data received from Gemini.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // enhance error message for common 403/400 errors related to keys
    if (error.message?.includes('API key') || error.status === 403) {
      throw new Error("API Key 无效或已过期，请检查设置。");
    }
    throw new Error(error.message || "Failed to process image.");
  }
};