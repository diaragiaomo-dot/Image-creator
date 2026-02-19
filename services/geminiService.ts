
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageSize } from "../types";

// Helper to get fresh AI instance right before making an API call
export const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateImage = async (
  prompt: string,
  modelId: string,
  config: { aspectRatio: AspectRatio; imageSize?: ImageSize }
): Promise<{ url: string; groundingChunks?: any[] }> => {
  const ai = getAI();
  
  const payload: any = {
    model: modelId,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: config.aspectRatio,
        ...(config.imageSize && modelId.includes('pro') ? { imageSize: config.imageSize } : {})
      }
    }
  };

  // Add search tool for Pro model to fulfill real-time information requests
  if (modelId === 'gemini-3-pro-image-preview') {
    payload.config.tools = [{ googleSearch: {} }];
  }

  const response = await ai.models.generateContent(payload);

  let url = '';
  // Iterate through all parts to find the image part as recommended
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      url = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!url) {
    throw new Error("No image was generated in the response.");
  }

  return {
    url,
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

export const editImage = async (
  prompt: string,
  base64Image: string,
  mimeType: string,
  modelId: string
): Promise<string> => {
  const ai = getAI();
  
  // Clean base64 string
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No edited image was returned.");
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
