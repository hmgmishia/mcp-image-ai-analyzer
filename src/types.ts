export interface AnalysisResult {
  description: string;
  model: string;
  provider: string;
}

export interface ImageAnalysisService {
  analyze(imageBase64: string, modelName?: string): Promise<AnalysisResult>;
  getProvider(): string;
  getModel(): string;
} 