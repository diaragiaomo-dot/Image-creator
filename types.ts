
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  model: string;
  groundingChunks?: GroundingChunk[];
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ImageSize = "1K" | "2K" | "4K";

export enum AppMode {
  GENERATE = 'GENERATE',
  EDIT = 'EDIT'
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  isPro: boolean;
}

export const MODELS: ModelOption[] = [
  {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini Flash',
    description: 'Fast and reliable generation',
    isPro: false
  },
  {
    id: 'gemini-3-pro-image-preview',
    name: 'Gemini Pro',
    description: 'High-quality 4K & Real-time info',
    isPro: true
  }
];
