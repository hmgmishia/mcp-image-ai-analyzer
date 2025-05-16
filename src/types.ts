export interface AnalysisResult {
  description: string;
  model: string;
  provider: string;
}

export interface ImageAnalysisService {
  analyze(imageBase64: string, modelName?: string, prompt?: string, thinking?: boolean): Promise<AnalysisResult>;
  getProvider(): string;
  getModel(): string;
}

export interface Tool {
  getName(): string;
  getDescription(): string;
  getInputSchema(): object;
  execute(params: any): Promise<{
    content: Array<{
      type: string;
      text: string;
    }>;
    isError?: boolean;
  }>;
}

export interface ToolRequest {
  params: {
    name: string;
    arguments: {
      [key: string]: any;
    };
  };
} 