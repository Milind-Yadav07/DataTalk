import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

let instance: GoogleGenerativeAIEmbeddings | null = null;

/**
 * Returns a singleton instance of GoogleGenerativeAIEmbeddings.
 * Configured with "gemini-embedding-001" (outputting 768 dimensions to match Atlas index) and GEMINI_API_KEY.
 */
export function getEmbedderInstance(): GoogleGenerativeAIEmbeddings {
  if (!instance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not defined.');
    }
    
    const rawInstance = new GoogleGenerativeAIEmbeddings({
      apiKey,
      modelName: 'gemini-embedding-001',
    });

    // Override the private _convertToContent method on the instance to support outputDimensionality
    const origConvertToContent = (rawInstance as any)._convertToContent.bind(rawInstance);
    (rawInstance as any)._convertToContent = function (text: string) {
      const req = origConvertToContent(text);
      req.outputDimensionality = 768;
      return req;
    };

    instance = rawInstance;
  }
  return instance as GoogleGenerativeAIEmbeddings;
}
